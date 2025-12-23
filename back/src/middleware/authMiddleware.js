import jwt from 'jsonwebtoken';
import User from '../models/User.js';
// Doctor import is not needed for doctorId anymore
// import Doctor from '../models/Doctor.js';

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

    // IMPORTANT: get doctorId only from the token
    const doctorId = decoded.doctorId || null;

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      profession: user.profession,
      role:
        user.profession?.toLowerCase() === 'doctor'
          ? 'Doctor'
          : (user.role || 'user'),
      avatarUrl: user.avatarUrl || null,
      doctorId: doctorId,
    };

    return next();
  } catch (err) {
    console.error('authMiddleware error:', err?.message || err);
    return res.status(401).json({ message: 'Not authorized' });
  }
}
