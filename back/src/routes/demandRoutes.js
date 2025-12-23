// backend/src/routes/demandRoutes.js
import express from 'express';
import Demand from '../models/Demand.js';
// import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const toCsv = (v) => (Array.isArray(v) ? v.join(',') : typeof v === 'string' ? v : null);
const toArr = (csv) => (csv ? String(csv).split(',').map(s => s.trim()).filter(Boolean) : []);

// GET /api/demands
router.get('/', /* verifyToken, */ async (_req, res) => {
  try {
    const rows = await Demand.findAll({ order: [['id', 'DESC']] });
    const mapped = rows.map(r => {
      const j = r.toJSON();
      return { ...j, requiredSkills: toArr(j.requiredSkills) };
    });
    res.json(mapped);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to list demands' });
  }
});

// GET /api/demands/:id
router.get('/:id', /* verifyToken, */ async (req, res) => {
  try {
    const row = await Demand.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Not found' });
    const j = row.toJSON();
    res.json({ ...j, requiredSkills: toArr(j.requiredSkills) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to get demand' });
  }
});

// POST /api/demands
router.post('/', /* verifyToken, */ async (req, res) => {
  try {
    const b = req.body || {};
    const created = await Demand.create({
      title: b.title,
      description: b.description ?? null,
      priority: b.priority ?? 'medium',
      status: b.status ?? 'open',
      budget: b.budget ?? null,
      deadline: b.deadline ?? null,
      hospitalName: b.hospitalName ?? null,
      vendorName: b.vendorName ?? null,
      requiredSkills: toCsv(b.requiredSkills),
      hospitalId: b.hospitalId ?? null,
      vendorId: b.vendorId ?? null,
    });
    const j = created.toJSON();
    res.status(201).json({ ...j, requiredSkills: toArr(j.requiredSkills) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.message || 'Failed to create demand' });
  }
});

// PUT /api/demands/:id
router.put('/:id', /* verifyToken, */ async (req, res) => {
  try {
    const row = await Demand.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Not found' });
    const b = req.body || {};

    await row.update({
      title: b.title ?? row.title,
      description: b.description ?? row.description,
      priority: b.priority ?? row.priority,
      status: b.status ?? row.status,
      budget: b.budget ?? row.budget,
      deadline: b.deadline ?? row.deadline,
      hospitalName: b.hospitalName ?? row.hospitalName,
      vendorName: b.vendorName ?? row.vendorName,
      requiredSkills: b.requiredSkills !== undefined ? toCsv(b.requiredSkills) : row.requiredSkills,
      hospitalId: b.hospitalId ?? row.hospitalId,
      vendorId: b.vendorId ?? row.vendorId,
    });

    const j = row.toJSON();
    res.json({ ...j, requiredSkills: toArr(j.requiredSkills) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.message || 'Failed to update demand' });
  }
});

// DELETE /api/demands/:id
router.delete('/:id', /* verifyToken, */ async (req, res) => {
  try {
    const row = await Demand.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Not found' });
    await row.destroy();
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to delete demand' });
  }
});

export default router;
