const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const dns = require('dns');
const { run, get } = require('./database');

// Fix for Render IPv6 ENETUNREACH error with Nodemailer
dns.setDefaultResultOrder('ipv4first');

function generateOtp() {
  const otp = crypto.randomInt(100000, 1000000);
  return String(otp);
}

async function sendOtpEmail(toEmail, otp) {
  console.log(`✅ OTP for ${toEmail}: ${otp}`);
  
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      },
      debug: true,
      logger: true
    });

    const mailOptions = {
      from: `"AURA STORE" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: 'AURA STORE - OTP Verification',
      text: `Your One-Time Password (OTP) for AURA STORE is: ${otp}\n\nThis OTP is valid for 5 minutes. Do not share this code with anyone.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #e11b23; text-align: center;">AURA STORE</h2>
          <p>Hello,</p>
          <p>Your One-Time Password (OTP) for AURA STORE is:</p>
          <h1 style="text-align: center; font-size: 36px; letter-spacing: 5px; color: #333; background: #f5f5f5; padding: 15px; border-radius: 5px;">${otp}</h1>
          <p>This OTP is valid for <strong>5 minutes</strong>.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent via Nodemailer to ${toEmail}: ${info.response}`);
  } catch (err) {
    console.error('Failed to send OTP via Nodemailer:', err);
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
