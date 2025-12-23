// backend/src/utils/mailer.js
import nodemailer from 'nodemailer';

const HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const PORT = Number(process.env.EMAIL_PORT || 465);
const SECURE = String(process.env.EMAIL_SECURE ?? (PORT === 465)).toLowerCase() === 'true';
const USER = process.env.EMAIL_USER || '';
const PASS = process.env.EMAIL_PASS || '';
const FROM = process.env.FROM_EMAIL || USER || 'no-reply@example.com';

function ensureEnv() {
  if (!HOST || !PORT) throw new Error('EMAIL_HOST/EMAIL_PORT missing');
  if (!USER || !PASS) throw new Error('EMAIL_USER/EMAIL_PASS missing');
}

export function createTransporter() {
  ensureEnv();
  return nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: SECURE,
    auth: { user: USER, pass: PASS },
  });
}

export async function verifyMailer() {
  const tx = createTransporter();
  await tx.verify();
  console.log('SMTP is ready to send mail');
  return true;
}

export async function sendMail({ to, subject, html, text }) {
  const tx = createTransporter();
  return tx.sendMail({ from: FROM, to, subject, html, text });
}

export async function sendOTP(email, otp) {
  const expires = Number(process.env.OTP_EXPIRES_SEC || 300);
  return sendMail({
    to: email,
    subject: 'Your Jeevak OTP',
    text: `Your OTP is ${otp}. It expires in ${expires} seconds.`,
    html: `<p>Your OTP is <b>${otp}</b>. It expires in ${expires} seconds.</p>`,
  });
}
