const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { run, get } = require('./database');

function generateOtp() {
  const otp = crypto.randomInt(100000, 1000000);
  return String(otp);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

async function sendOtpEmail(toEmail, otp) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn('Gmail credentials not configured – OTP email not sent');
    console.log(`✅ OTP for ${toEmail}: ${otp}`);
    return;
  }
  console.log(`✅ OTP for ${toEmail}: ${otp}`);
  try {
    await transporter.sendMail({
      from: `"Aura Store" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: 'Your security OTP for Aura Store',
      html: `
        <div style="font-family:sans-serif; padding:20px;">
          <h2>AURA STORE – Security OTP</h2>
          <p>Your one‑time password is:</p>
          <p style="font-size:24px; font-weight:bold;">${otp}</p>
          <p>This OTP will expire in 5 minutes. If you did not request this, please secure your account.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send OTP email:', err);
  }
}

async function canRequestOtp(email) {
  const record = await get(
    "SELECT created_at FROM otp WHERE email = ? ORDER BY created_at DESC LIMIT 1",
    [email]
  );
  if (!record) return true;

  // Convert UTC string to Date object
  const lastRequestTime = new Date(record.created_at).getTime();
  const now = Date.now();
  
  if (now - lastRequestTime < 60 * 1000) {
    return false; // Less than 60 seconds ago
  }
  return true;
}

async function storeOtp(email, otp, ttlMs = 5 * 60 * 1000) {
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const otpHash = await bcrypt.hash(otp, 10);
  
  await run(
    'INSERT INTO otp (email, otp_hash, expires_at) VALUES (?, ?, ?)',
    [email, otpHash, expiresAt]
  );
}

async function verifyOtp(email, otp) {
  const record = await get(
    'SELECT * FROM otp WHERE email = ? AND used = FALSE ORDER BY created_at DESC LIMIT 1',
    [email]
  );

  if (!record) return false;

  if (new Date(record.expires_at) < new Date()) {
    return false;
  }

  if (record.attempts >= 3) {
    return false; // Max attempts reached
  }

  const isValid = await bcrypt.compare(String(otp).trim(), record.otp_hash);

  if (!isValid) {
    await run('UPDATE otp SET attempts = attempts + 1 WHERE id = ?', [record.id]);
    return false;
  }

  await run('UPDATE otp SET used = TRUE WHERE id = ?', [record.id]);
  return true;
}

module.exports = {
  generateOtp,
  sendOtpEmail,
  storeOtp,
  verifyOtp,
  canRequestOtp
};
