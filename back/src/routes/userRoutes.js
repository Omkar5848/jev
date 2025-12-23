import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import auth from '../middleware/authMiddleware.js';
import User from '../models/User.js';


const router = express.Router();

const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar_${req.user.id}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(png|jpeg|jpg|webp)/.test(file.mimetype);
    cb(ok ? null : new Error('Only image files allowed'));
  },
});

router.patch('/profile', auth, async (req, res) => {
  try {
    const { name, profession } = req.body || {};
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (typeof profession === 'string') user.profession = profession.trim();
    await user.save();
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      profession: user.profession,
      role: user.role || 'user',
      avatarUrl: user.avatarUrl || null,
    });
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Update failed' });
  }
});

router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const avatarUrl = `/uploads/${req.file.filename}`;
    user.avatarUrl = avatarUrl;
    await user.save();
    return res.json({ message: 'Avatar updated', avatarUrl });
  } catch (e) {
    return res.status(500).json({ message: e?.message || 'Upload failed' });
  }
});

export default router;
