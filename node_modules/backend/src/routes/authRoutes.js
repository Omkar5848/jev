import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendOTP } from '../utils/mailer.js';
import { putOtp, verifyOtp } from '../services/otpStore.js';
import { registerUser, loginUser, me, verifyEmail } from '../controllers/authController.js'; // Import verifyEmail
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/verify-email', auth, verifyEmail);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', auth, me);

router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Email not registered' });

    const otp = crypto.randomInt(100000, 999999).toString();
    const ttl = Number(process.env.OTP_EXPIRES_SEC || 300);

    putOtp(email, otp, ttl);
    await sendOTP(email, otp);

    return res.json({ message: 'OTP sent' });
  } catch (e) {
    console.error('send-otp error:', e);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ error: 'email and otp required' });

    const ok = verifyOtp(email, otp);
    if (!ok) return res.status(400).json({ error: 'Invalid or expired OTP' });

    return res.json({ message: 'OTP verified' });
  } catch (e) {
    console.error('verify-otp error:', e);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

router.post('/reset', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const bcrypt = (await import('bcryptjs')).default;
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  await user.save();
  return res.json({ message: 'Password reset successful' });
});


export default router;


