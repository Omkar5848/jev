// backend/src/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import { verifyOtp } from '../services/otpStore.js';



const asNonEmptyStr = (v) =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;

function toAuthPayload(user, doctor) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profession: user.profession || 'Admin',
    role:
      user.profession?.toLowerCase() === 'doctor'
        ? 'Doctor'
        : (user.role || 'user'),
    doctorId: doctor?.id || null,
  };
}

function signUserToken(user, doctor) {
  const secret = asNonEmptyStr(process.env.JWT_SECRET) || 'secret123';
  const expiresIn = asNonEmptyStr(process.env.JWT_EXPIRES) || '7d';

  const payload = {
    sub: String(user.id),
    name: user.name,
    email: user.email,
    profession: user.profession || 'Admin',
    role:
      user.profession?.toLowerCase() === 'doctor'
        ? 'Doctor'
        : (user.role || 'user'),
    doctorId: doctor?.id || null,
  };

  return jwt.sign(payload, secret, { expiresIn });
}



// POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const name = asNonEmptyStr(req.body?.name);
    const email = asNonEmptyStr(req.body?.email);
    const password = asNonEmptyStr(req.body?.password);
    const profession = asNonEmptyStr(req.body?.profession);

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'name, email, password required' });
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, profession });

    // Link doctor via email (Doctors table has no userId)
    const doctor =
      user.profession?.toLowerCase() === 'doctor'
        ? await Doctor.findOne({ where: { email: user.email } })
        : null;

    const token = signUserToken(user, doctor);
    const profile = toAuthPayload(user, doctor);

    return res
      .status(201)
      .json({ message: 'User registered', token, user: profile });
  } catch (error) {
    console.error('registerUser error:', error);
    return res
      .status(500)
      .json({ message: error?.message || 'Registration failed' });
  }
};

// POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const email = asNonEmptyStr(req.body?.email);
    const password = asNonEmptyStr(req.body?.password);

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'email, password required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !asNonEmptyStr(user.password)) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Link doctor via email (no userId column in Doctors)
    const doctor =
      user.profession?.toLowerCase() === 'doctor'
        ? await Doctor.findOne({ where: { email: user.email } })
        : null;

    const token = signUserToken(user, doctor);
    const profile = toAuthPayload(user, doctor);

    return res.json({ message: 'Login successful', token, user: profile });
  } catch (error) {
    console.error('loginUser error:', error);
    return res
      .status(500)
      .json({ message: error?.message || 'Login failed' });
  }
};

// NEW: Verify Email Controller
export const verifyEmail = async (req, res) => {
  try {
    const userId = req.user.id; // From authMiddleware
    const { otp } = req.body;

    if (!otp) return res.status(400).json({ message: 'OTP required' });

    // Get user to find email
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isValid = verifyOtp(user.email, otp);
    if (!isValid) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.isEmailVerified = true;
    await user.save();

    res.json({ message: 'Email verified successfully', isEmailVerified: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Verification failed' });
  }
};

// GET /api/auth/me
export const me = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findByPk(req.user.id);

    return res.json({
     id: user.id,
      name: user.name,
      email: user.email,
      profession: user.profession,
      role: user.profession?.toLowerCase() === 'doctor' ? 'Doctor' : (user.role || 'user'),
      avatarUrl: user.avatarUrl || null,
      doctorId: req.user.doctorId || null,
      isEmailVerified: user.isEmailVerified // Return this!
    });
  } catch (e) {
    console.error('me error:', e);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
};
