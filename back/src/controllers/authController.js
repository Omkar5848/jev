import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import { verifyOtp } from '../services/otpStore.js';

const asNonEmptyStr = (v) =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;

const ADMIN_REGISTER_KEY = 'admin123';

function normalizeRole(user) {
  const p = (user.profession || '').toLowerCase();
  if (p === 'doctor') return 'Doctor';
  if (p === 'nurse') return 'Nurse';
  if (p === 'technician') return 'Technician';
  if (p === 'patient') return 'Patient';
  if (p === 'local_agency') return 'LocalAgency';
  if (p === 'admin') return 'Admin';
  return user.role || 'user';
}

function toAuthPayload(user, doctor) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profession: user.profession || 'Admin',
    role: normalizeRole(user),
    doctorId: doctor?.id || null,
    approvalStatus: user.approvalStatus,
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
    role: normalizeRole(user),
    doctorId: doctor?.id || null,
  };

  return jwt.sign(payload, secret, { expiresIn });
}

export const registerUser = async (req, res) => {
  try {
    const name = asNonEmptyStr(req.body?.name);
    const email = asNonEmptyStr(req.body?.email)?.toLowerCase();
    const password = asNonEmptyStr(req.body?.password);
    const profession = asNonEmptyStr(req.body?.profession)?.toLowerCase() || 'patient';
    const adminKey = asNonEmptyStr(req.body?.adminKey);

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'name, email, password required' });
    }

    if (profession === 'admin' && adminKey !== ADMIN_REGISTER_KEY) {
      return res.status(403).json({ message: 'Invalid admin key' });
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const role =
      profession === 'doctor' ? 'Doctor'
      : profession === 'nurse' ? 'Nurse'
      : profession === 'technician' ? 'Technician'
      : profession === 'patient' ? 'Patient'
      : profession === 'local_agency' ? 'LocalAgency'
      : profession === 'admin' ? 'Admin'
      : 'user';

    const approvalStatus = profession === 'admin' ? 'approved' : 'pending';

    const user = await User.create({ name, email, password: hash, profession, role, approvalStatus });

    if (user.approvalStatus !== 'approved') {
      return res.status(201).json({
        message: 'Registration submitted. Waiting for admin approval.',
        requiresApproval: true,
      });
    }

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

export const loginUser = async (req, res) => {
  try {
    const email = asNonEmptyStr(req.body?.email)?.toLowerCase();
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

    if (user.approvalStatus !== 'approved') {
      return res.status(403).json({ message: 'Registration pending admin approval' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

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

export const verifyEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp } = req.body;

    if (!otp) return res.status(400).json({ message: 'OTP required' });

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
      role: normalizeRole(user),
      avatarUrl: user.avatarUrl || null,
      doctorId: req.user.doctorId || null,
      isEmailVerified: user.isEmailVerified,
      approvalStatus: user.approvalStatus,
    });
  } catch (e) {
    console.error('me error:', e);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

export const listRegistrations = async (_req, res) => {
  const users = await User.findAll({ order: [['createdAt', 'DESC']] });
  res.json(users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    profession: u.profession,
    role: normalizeRole(u),
    approvalStatus: u.approvalStatus,
    createdAt: u.createdAt,
  })));
};

export const reviewRegistration = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'status must be approved or rejected' });
  }
  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.approvalStatus = status;
  await user.save();

  res.json({
    id: user.id,
    email: user.email,
    approvalStatus: user.approvalStatus,
  });
};
