import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
console.log('🔑 EMAIL_PASS:', process.env.EMAIL_PASS ? '***set***' : '❌ NOT SET');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
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
    from: `"AaramSe" <${process.env.EMAIL_USER}>`,
    to: testEmail,
    subject: `${testOtp} is your AaramSe verification code`,
    text: `Your OTP is: ${testOtp}\nValid for 10 minutes.`,
    html: `<h2>Your AaramSe OTP is: <b style="color:#3b82f6">${testOtp}</b></h2><p>Valid for 10 minutes.</p>`,
  });
  console.log('✅ Email sent! Message ID:', info.messageId);
  console.log('📬 Preview URL:', nodemailer.getTestMessageUrl(info) || 'N/A');
} catch (err) {
  console.error('❌ Send failed:', err.message);
  console.error('Full error:', err);
}
