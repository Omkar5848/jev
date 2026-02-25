import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export default async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const secret = process.env.JWT_SECRET || 'secret123';
    const decoded = jwt.verify(token, secret);

    const userId = decoded.sub || decoded.id;
    if (!userId) return res.status(401).json({ message: 'Not authorized' });

    const user = await User.findByPk(userId);
    if (!user) return res.status(401).json({ message: 'Not authorized' });

    if (user.status === 'DISABLED') {
      return res.status(403).json({ message: 'Account disabled' });
    }

    // 🔥 ULTIMATE ADMIN OVERRIDE 🔥
    // This guarantees your email is ALWAYS treated as an Admin, 
    // bypassing any database errors, OTP logins, or old tokens!
    let assignedRole = user.role || 'user';
    let assignedProfession = user.profession;

    if (user.email === 'omkarjore066@gmail.com') {
        assignedRole = 'Admin';
        assignedProfession = 'Admin';
    } else if (user.profession?.toLowerCase() === 'doctor') {
        assignedRole = 'Doctor';
    }

    const doctorId = decoded.doctorId || null;

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      profession: assignedProfession,
      role: assignedRole,
      avatarUrl: user.avatarUrl || null,
      doctorId: doctorId,
    };

    return next();
  } catch (err) {
    console.error('authMiddleware error:', err?.message || err);
    return res.status(401).json({ message: 'Not authorized' });
  }
}