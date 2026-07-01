import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ── Transporter — Gmail SMTP port 587 STARTTLS ────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,          // STARTTLS (not SSL)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    // Force IPv4 — Render free tier blocks IPv6 outbound (ENETUNREACH)
    family: 4,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

// ── Generic send function ─────────────────────────────────────────────────────
export const sendEmail = async (mailOptions) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Sent to ${mailOptions.to}`);
  } catch (error) {
    console.error('[Email] Send failed:', error.message);
    throw new Error('Error sending email: ' + error.message);
  }
};

// ── Booking Confirmation Email ────────────────────────────────────────────────
export const sendBookingConfirmationEmail = async ({
  toEmail,
  userName,
  storeName,
  storeLocation,
  storePhone,
  slotDate,
  startTime,
  endTime,
  queueNumber,
}) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AaramSe - Booking Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="background-color:#1e293b;border-radius:24px;overflow:hidden;border:1px solid #334155;">
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:40px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:16px;padding:12px 20px;margin-bottom:16px;">
              <span style="color:#fff;font-size:28px;font-weight:900;">Aaramse<span style="color:#bbf7d0;"></span></span>
            </div>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:14px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Booking Confirmed ✓</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#f1f5f9;font-size:22px;font-weight:800;margin:0 0 12px;">Hi ${userName}, your appointment is confirmed!</h2>
            <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 28px;">
              Your booking at <strong style="color:#f1f5f9;">${storeName}</strong> has been successfully placed.
            </p>

            <!-- Booking Details Card -->
            <div style="background:#0f172a;border:1px solid #334155;border-radius:20px;padding:28px;margin-bottom:28px;">
              <p style="color:#64748b;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 20px;font-weight:700;">Booking Details</p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;color:#94a3b8;font-size:14px;width:40%;">📍 Location</td>
                  <td style="padding:8px 0;color:#f1f5f9;font-size:14px;font-weight:600;">${storeLocation || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#94a3b8;font-size:14px;">📞 Contact</td>
                  <td style="padding:8px 0;color:#f1f5f9;font-size:14px;font-weight:600;">${storePhone || 'N/A'}</td>
                </tr>
                ${slotDate ? `
                <tr>
                  <td style="padding:8px 0;color:#94a3b8;font-size:14px;">📅 Date</td>
                  <td style="padding:8px 0;color:#f1f5f9;font-size:14px;font-weight:600;">${new Date(slotDate).toDateString()}</td>
                </tr>` : ''}
                ${startTime && endTime ? `
                <tr>
                  <td style="padding:8px 0;color:#94a3b8;font-size:14px;">🕐 Time Slot</td>
                  <td style="padding:8px 0;color:#f1f5f9;font-size:14px;font-weight:600;">${startTime} – ${endTime}</td>
                </tr>` : ''}
              </table>

              <!-- Queue Number -->
              <div style="margin-top:20px;padding:20px;background:#1e293b;border-radius:14px;text-align:center;border:2px solid rgba(34,197,94,0.2);">
                <p style="color:#64748b;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;font-weight:700;">Your Queue Number</p>
                <div style="font-size:48px;font-weight:900;color:#22c55e;font-family:monospace;">${queueNumber}</div>
              </div>
            </div>

            <div style="background:#1e293b;border-radius:14px;padding:16px 20px;margin-bottom:28px;border-left:3px solid #f59e0b;">
              <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.5;">
                💡 <strong style="color:#f1f5f9;">Tip:</strong> Arrive a few minutes before your slot time to avoid delays.
              </p>
            </div>

            <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;">
              If you need to cancel or reschedule, please do so through the AaramSe app.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#0f172a;padding:24px 40px;text-align:center;border-top:1px solid #1e293b;">
            <p style="color:#475569;font-size:12px;margin:0;">© ${new Date().getFullYear()} AaramSe · All rights reserved</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  await sendEmail({
    from: `"AaramSe" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `✅ Booking Confirmed at ${storeName} – Queue #${queueNumber}`,
    html,
  });
};

// ── Booking Cancellation / Completion Email ───────────────────────────────────
export const sendAppointmentStatusEmail = async ({
  toEmail,
  userName,
  storeName,
  status, // 'Completed' | 'Canceled'
}) => {
  const isCompleted = status === 'Completed';

  const accentColor = isCompleted ? '#3b82f6' : '#ef4444';
  const accentLight = isCompleted ? '#93c5fd' : '#fca5a5';
  const headerGradient = isCompleted
    ? 'linear-gradient(135deg,#1e40af,#3b82f6)'
    : 'linear-gradient(135deg,#991b1b,#ef4444)';
  const emoji = isCompleted ? '✅' : '❌';
  const statusLabel = isCompleted ? 'Appointment Completed' : 'Appointment Canceled';
  const bodyText = isCompleted
    ? `Thank you for choosing <strong style="color:#f1f5f9;">${storeName}</strong>. We hope you had a great experience!`
    : `Your appointment at <strong style="color:#f1f5f9;">${storeName}</strong> has been canceled. You can book a new appointment anytime through the AaramSe app.`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AaramSe - ${statusLabel}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="background-color:#1e293b;border-radius:24px;overflow:hidden;border:1px solid #334155;">
        <tr>
          <td style="background:${headerGradient};padding:40px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:16px;padding:12px 20px;margin-bottom:16px;">
              <span style="color:#fff;font-size:28px;font-weight:900;">AaramSe</span>
            </div>
            <p style="color:rgba(255,255,255,0.85);margin:0;font-size:14px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">${emoji} ${statusLabel}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#f1f5f9;font-size:22px;font-weight:800;margin:0 0 12px;">Hi ${userName},</h2>
            <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 28px;">
              ${bodyText}
            </p>

            <div style="background:#0f172a;border:2px solid rgba(${isCompleted ? '59,130,246' : '239,68,68'},0.2);border-radius:20px;padding:28px;text-align:center;margin-bottom:28px;">
              <div style="font-size:52px;margin-bottom:12px;">${emoji}</div>
              <p style="color:${accentColor};font-size:18px;font-weight:800;margin:0;">${statusLabel}</p>
              <p style="color:#64748b;font-size:13px;margin:8px 0 0;">at <span style="color:#94a3b8;font-weight:600;">${storeName}</span></p>
            </div>

            ${isCompleted ? `
            <div style="background:#1e293b;border-radius:14px;padding:16px 20px;margin-bottom:28px;border-left:3px solid #22c55e;">
              <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.5;">
                ⭐ <strong style="color:#f1f5f9;">Enjoyed the service?</strong> Don't forget to leave a review in the AaramSe app!
              </p>
            </div>` : ''}

            <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;">
              For any queries, please contact us through the AaramSe app.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#0f172a;padding:24px 40px;text-align:center;border-top:1px solid #1e293b;">
            <p style="color:#475569;font-size:12px;margin:0;">© ${new Date().getFullYear()} AaramSe · All rights reserved</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  await sendEmail({
    from: `"AaramSe" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `${emoji} Appointment ${status} at ${storeName}`,
    html,
  });
};
