import express from 'express';
import Freelancer from '../models/Freelancer.js';
// If you want auth, uncomment and apply:
// import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const toCsv = (v) => (Array.isArray(v) ? v.join(',') : typeof v === 'string' ? v : null);
const toArr = (csv) =>
  csv ? String(csv).split(',').map((s) => s.trim()).filter(Boolean) : [];

// GET /api/freelancers
router.get('/', /* verifyToken, */ async (req, res) => {
  try {
    const rows = await Freelancer.findAll({ order: [['id', 'DESC']] });
    res.json(rows.map((r) => ({ ...r.toJSON(), skills: toArr(r.skills) })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to list freelancers' });
  }
});

// GET /api/freelancers/:id
router.get('/:id', /* verifyToken, */ async (req, res) => {
  try {
    const row = await Freelancer.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Not found' });
    const j = row.toJSON();
    res.json({ ...j, skills: toArr(j.skills) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to get freelancer' });
  }
});

// POST /api/freelancers
router.post('/', /* verifyToken, */ async (req, res) => {
  try {
    const b = req.body || {};
    const created = await Freelancer.create({
      name: b.name,
      specialization: b.specialization ?? null,
      availability: b.availability ?? 'available',
      rating: b.rating ?? null,
      years: b.years ?? null,
      ratePerHour: b.ratePerHour ?? null,
      projects: b.projects ?? null,
      skills: toCsv(b.skills),
      email: b.email ?? null,
      phone: b.phone ?? null,
    });
    const j = created.toJSON();
    res.status(201).json({ ...j, skills: toArr(j.skills) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.message || 'Failed to create freelancer' });
  }
});

// PUT /api/freelancers/:id
router.put('/:id', /* verifyToken, */ async (req, res) => {
  try {
    const row = await Freelancer.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Not found' });

    const b = req.body || {};
    await row.update({
      name: b.name ?? row.name,
      specialization: b.specialization ?? row.specialization,
      availability: b.availability ?? row.availability,
      rating: b.rating ?? row.rating,
      years: b.years ?? row.years,
      ratePerHour: b.ratePerHour ?? row.ratePerHour,
      projects: b.projects ?? row.projects,
      skills: b.skills !== undefined ? toCsv(b.skills) : row.skills,
      email: b.email ?? row.email,
      phone: b.phone ?? row.phone,
    });

    const j = row.toJSON();
    res.json({ ...j, skills: toArr(j.skills) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.message || 'Failed to update freelancer' });
  }
});

// DELETE /api/freelancers/:id
router.delete('/:id', /* verifyToken, */ async (req, res) => {
  try {
    const row = await Freelancer.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Not found' });
    await row.destroy();
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to delete freelancer' });
  }
});

export default router;
