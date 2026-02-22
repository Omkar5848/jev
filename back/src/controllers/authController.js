import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Nurse from '../models/Nurse.js';
import Technician from '../models/Technician.js';
import { sendOTP } from '../utils/mailer.js';
// Updated Import: Added 'putOtp'
import { verifyOtp, putOtp } from '../services/otpStore.js';

// Helper to validate strings
const asNonEmptyStr = (v) =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;

// Helper to construct the Auth Payload (for response)
function toAuthPayload(user, doctor) {
  let role = 'User';
  // Priority: Database Role > Profession
  if (user.role === 'Admin' || user.profession === 'Admin') role = 'Admin';
  else if (user.profession?.toLowerCase() === 'doctor') role = 'Doctor';
  else if (user.profession?.toLowerCase() === 'nurse') role = 'Nurse';
  else if (user.profession?.toLowerCase() === 'technician') role = 'Technician';
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profession: user.profession || 'User',
    role: role,
    doctorId: doctor?.id || null,
    isEmailVerified: user.isEmailVerified
  };
}

// Helper to sign JWT Token
function signUserToken(user, doctor) {
  const secret = process.env.JWT_SECRET || 'secret123';
  const expiresIn = process.env.JWT_EXPIRES || '7d';

  // Determine Role for Token
  let role = 'User';
  if (user.role === 'Admin' || user.profession === 'Admin') role = 'Admin';
  else if (user.profession?.toLowerCase() === 'doctor') role = 'Doctor';
  else if (user.profession?.toLowerCase() === 'nurse') role = 'Nurse';
  else if (user.profession?.toLowerCase() === 'technician') role = 'Technician';

  const payload = {
    sub: String(user.id),
    name: user.name,
    email: user.email,
    profession: user.profession || 'User',
    role: role,
    doctorId: doctor?.id || null,
  };

  return jwt.sign(payload, secret, { expiresIn });
}

// ==========================================
// REGISTER USER
// ==========================================
export const registerUser = async (req, res) => {
  try {
    const name = asNonEmptyStr(req.body?.name);
    const email = asNonEmptyStr(req.body?.email);
    const password = asNonEmptyStr(req.body?.password);
    const profession = asNonEmptyStr(req.body?.profession) || 'User';
    const adminKey = req.body?.adminKey; 

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // --- SECURITY CHECK: ADMIN REGISTRATION ---
    if (profession === 'Admin') {
      const SAFE_KEY = process.env.ADMIN_SECRET_KEY || 'admin123';
      if (adminKey !== SAFE_KEY) {
        return res.status(403).json({ message: 'Invalid Admin Secret Key. Access Denied.' });
      }
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    
    // 1. Create User Account
    const user = await User.create({ 
      name, 
      email, 
      password: hash, 
      profession,
      role: profession === 'Admin' ? 'Admin' : 'User' 
    });

    // 2. Create Linked Profile
    if (profession === 'Doctor') {
      await Doctor.create({ firstName: name, email: email, userId: user.id });
    } 
    else if (profession === 'Nurse') {
      await Nurse.create({ userId: user.id, name: name, department: 'General' });
    }
    else if (profession === 'Technician') {
      await Technician.create({ userId: user.id, name: name, specialization: 'General Lab' });
    }
    else if (profession === 'User' || profession === 'Patient') {
      await Patient.create({
        userId: user.id,
        name: name,
        email: email,
        phone: '', 
        doctorId: null 
      });
    }

    // 3. Generate Token
    const doctor = profession === 'Doctor' ? await Doctor.findOne({ where: { userId: user.id } }) : null;
    const token = signUserToken(user, doctor);
    const profile = toAuthPayload(user, doctor);

    return res.status(201).json({ message: 'Registration successful', token, user: profile });
  } catch (error) {
    console.error('registerUser error:', error);
    return res.status(500).json({ message: error?.message || 'Registration failed' });
  }
};

// ==========================================
// LOGIN USER (Standard Password Login)
// ==========================================
export const loginUser = async (req, res) => {
  try {
    const email = asNonEmptyStr(req.body?.email);
    const password = asNonEmptyStr(req.body?.password);

    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    // 🔥 AUTO-FIX ADMIN ROLE 🔥
    if (user.email === 'omkarjore066@gmail.com' && user.role !== 'Admin') {
        console.log(`>>> AUTO-FIXING ADMIN ROLE FOR: ${user.email}`);
        user.role = 'Admin';
        user.profession = 'Admin';
        await user.save();
    }

    // Link doctor if applicable
    let doctor = null;
    if (user.profession?.toLowerCase() === 'doctor') {
         doctor = await Doctor.findOne({ where: { userId: user.id } });
         if (!doctor) doctor = await Doctor.findOne({ where: { email: user.email } }); 
    }

    const token = signUserToken(user, doctor);
    const profile = toAuthPayload(user, doctor);

    return res.json({ message: 'Login successful', token, user: profile });
  } catch (error) {
    console.error('loginUser error:', error);
    return res.status(500).json({ message: error?.message || 'Login failed' });
  }
};

// ==========================================
// LOGIN VIA OTP: Step 1 - Send OTP
// ==========================================
export const sendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not registered' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP (Valid for 10 mins)
    putOtp(email, otp, 600); 

    // Send Email
    await sendOTP(email, otp); 

    res.json({ message: 'OTP sent to your email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// ==========================================
// LOGIN VIA OTP: Step 2 - Verify & Login
// ==========================================
export const loginWithOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // 1. Verify OTP
    const isValid = verifyOtp(email, otp);
    if (!isValid) return res.status(400).json({ message: 'Invalid or expired OTP' });

    // 2. Find User
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 3. Find Doctor profile if applicable
    let doctor = null;
    if (user.profession === 'Doctor') {
         doctor = await Doctor.findOne({ where: { userId: user.id } });
    }

    // 4. Issue Token
    const token = signUserToken(user, doctor);
    const profile = toAuthPayload(user, doctor);

    res.json({ 
      message: 'Login successful', 
      token, 
      user: profile,
      // Flag: If user logged in via OTP, suggest setting a password
      requiresPasswordSet: user.needsPasswordReset, 
    });

  } catch (error) {
    console.error('loginWithOtp error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

// ==========================================
// SET NEW PASSWORD (Protected Route)
// ==========================================
export const setNewPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.id; // From Auth Middleware

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findByPk(userId);
    const hash = await bcrypt.hash(newPassword, 10);
    
    user.password = hash;
    user.needsPasswordReset = false;
    
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('setNewPassword error:', error);
    res.status(500).json({ message: 'Failed to update password' });
  }
};

// ==========================================
// VERIFY EMAIL (For Registration)
// ==========================================
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
    res.status(500).json({ message: 'Verification failed' });
  }
};

// ==========================================
// GET CURRENT USER (ME)
// ==========================================
export const me = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let patientProfile = null;
    if (user.profession === 'Patient') {
        patientProfile = await Patient.findOne({ where: { userId: user.id } });
    }

    const doctor = req.user.doctorId ? { id: req.user.doctorId } : null; 
    const profile = toAuthPayload(user, doctor);

    if (patientProfile) {
        profile.medical = patientProfile; 
    }
      
    return res.json(profile);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
};