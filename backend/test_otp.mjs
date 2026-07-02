import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import dns from 'dns';
import { promisify } from 'util';
dotenv.config();

console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
console.log('🔑 EMAIL_PASS:', process.env.EMAIL_PASS ? '***set***' : '❌ NOT SET');
console.log('🔌 SMTP_HOST:', process.env.SMTP_HOST);

const lookupPromise = promisify(dns.lookup);
const host = process.env.SMTP_HOST || 'smtp.gmail.com';

let resolvedHost = host;
try {
  const lookupResult = await lookupPromise(host, { family: 4 });
  resolvedHost = lookupResult.address;
  console.log(`[DNS] Resolved ${host} to IPv4: ${resolvedHost}`);
} catch (err) {
  console.error('[DNS] Failed to resolve, falling back:', err.message);
}

const transporter = nodemailer.createTransport({
  host: resolvedHost,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  tls: {
    rejectUnauthorized: false,
    servername: host,
  },
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4,
});

console.log('\n🔌 Verifying SMTP connection...');
try {
  await transporter.verify();
  console.log('✅ SMTP connection OK');
} catch (err) {
  console.error('❌ SMTP connection FAILED:', err.message);
  process.exit(1);
}

const testOtp = '482916';
const testEmail = 'timepassvah@gmail.com';

console.log(`\n📤 Sending OTP ${testOtp} to ${testEmail} ...`);
try {
  const info = await transporter.sendMail({
    from: `"AaramSe" <harittechsolution@gmail.com>`,
    to: testEmail,
    subject: `${testOtp} is your AaramSe verification code`,
    text: `Your OTP is: ${testOtp}\nValid for 10 minutes.`,
    html: `<h2>Your AaramSe OTP is: <b style="color:#3b82f6">${testOtp}</b></h2><p>Valid for 10 minutes.</p>`,
  });
  console.log('✅ Email sent! Message ID:', info.messageId);
} catch (err) {
  console.error('❌ Send failed:', err.message);
  console.error('Full error:', err);
}
