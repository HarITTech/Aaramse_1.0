import nodemailer from 'nodemailer';

/**
 * In-memory OTP store.
 * Structure: Map<email, { otp: string, expiresAt: number, attempts: number }>
 * This is cleared on server restart. For production, use Redis or DB.
 */
const otpStore = new Map();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Beautiful HTML email template
const getEmailTemplate = (otp, email) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AaramSe - Email Verification</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:24px;overflow:hidden;border:1px solid #334155;">
          
          <!-- Header Gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:40px 40px 32px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:16px;padding:12px 20px;margin-bottom:16px;">
                <span style="color:#fff;font-size:28px;font-weight:900;letter-spacing:-1px;">Aaram<span style="color:#93c5fd;">Se</span></span>
              </div>
              <p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Store Verification</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#f1f5f9;font-size:22px;font-weight:800;margin:0 0 12px;">Verify your email address</h2>
              <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 32px;">
                You're one step away from registering your store on AaramSe. Use the OTP below to verify your email and complete the store creation.
              </p>

              <!-- OTP Box -->
              <div style="background:linear-gradient(135deg,#1e40af15,#3b82f615);border:2px solid #3b82f630;border-radius:20px;padding:32px;text-align:center;margin-bottom:32px;">
                <p style="color:#64748b;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 16px;font-weight:700;">Your One-Time Password</p>
                <div style="letter-spacing:16px;font-size:42px;font-weight:900;color:#3b82f6;font-family:monospace;margin-left:16px;">${otp}</div>
                <p style="color:#64748b;font-size:12px;margin:16px 0 0;">Valid for <strong style="color:#f59e0b;">10 minutes</strong> only</p>
              </div>

              <div style="background:#0f172a;border-radius:14px;padding:16px 20px;margin-bottom:28px;border-left:3px solid #f59e0b;">
                <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.5;">
                  🔒 <strong style="color:#f1f5f9;">Never share this OTP</strong> with anyone. AaramSe will never ask for your OTP via call or message.
                </p>
              </div>

              <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;">
                If you didn't request this, you can safely ignore this email. Someone may have entered <strong style="color:#94a3b8;">${email}</strong> by mistake.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:24px 40px;text-align:center;border-top:1px solid #1e293b;">
              <p style="color:#475569;font-size:12px;margin:0;">© ${new Date().getFullYear()} AaramSe · All rights reserved</p>
              <p style="color:#334155;font-size:11px;margin:8px 0 0;">This is an automated message, please do not reply.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

/**
 * POST /api/otp/send
 * Body: { email }
 */
export const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ msg: 'Please provide a valid email address.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Rate limiting: if OTP was sent recently, block resend until cooldown
  const existing = otpStore.get(normalizedEmail);
  if (existing) {
    const secondsSinceSent = (Date.now() - (existing.expiresAt - OTP_EXPIRY_MS)) / 1000;
    if (secondsSinceSent < 60) {
      return res.status(429).json({
        msg: `Please wait ${Math.ceil(60 - secondsSinceSent)} seconds before requesting a new OTP.`,
        waitSeconds: Math.ceil(60 - secondsSinceSent),
      });
    }
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  // Store OTP
  otpStore.set(normalizedEmail, { otp, expiresAt, attempts: 0 });

  // Auto-delete after expiry
  setTimeout(() => {
    const entry = otpStore.get(normalizedEmail);
    if (entry && entry.expiresAt === expiresAt) {
      otpStore.delete(normalizedEmail);
    }
  }, OTP_EXPIRY_MS);

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"AaramSe" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: `${otp} is your AaramSe verification code`,
      html: getEmailTemplate(otp, normalizedEmail),
    });

    console.log(`[OTP] Sent to ${normalizedEmail}`);
    res.status(200).json({ msg: 'OTP sent successfully. Please check your email.' });
  } catch (err) {
    console.error('[OTP] Email send failed:', err.message);
    otpStore.delete(normalizedEmail);
    res.status(500).json({ msg: 'Failed to send OTP email. Please check your email address and try again.' });
  }
};

/**
 * POST /api/otp/verify
 * Body: { email, otp }
 */
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ msg: 'Email and OTP are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const entry = otpStore.get(normalizedEmail);

  if (!entry) {
    return res.status(400).json({ msg: 'OTP expired or not found. Please request a new one.' });
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalizedEmail);
    return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
  }

  // Increment attempts
  entry.attempts += 1;

  if (entry.attempts > MAX_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    return res.status(429).json({ msg: 'Too many incorrect attempts. Please request a new OTP.' });
  }

  if (entry.otp !== otp.toString().trim()) {
    return res.status(400).json({
      msg: `Incorrect OTP. ${MAX_ATTEMPTS - entry.attempts} attempts remaining.`,
      attemptsLeft: MAX_ATTEMPTS - entry.attempts,
    });
  }

  // OTP is correct — remove from store
  otpStore.delete(normalizedEmail);
  console.log(`[OTP] Verified for ${normalizedEmail}`);
  res.status(200).json({ msg: 'Email verified successfully.', verified: true });
};
