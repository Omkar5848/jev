import express from 'express';
import Hospital from '../models/Hospital.js';
// import { protect } from '../middleware/authMiddleware.js'; // optional if you want auth for write ops

const router = express.Router();

// GET /api/hospitals — return global list (no user filter)
router.get('/', async (_req, res) => {
  try {
    const list = await Hospital.findAll({ order: [['id', 'DESC']] });
    // If departments is stored as CSV, optionally normalize to array:
    const mapped = list.map(h => {
      const j = h.toJSON();
      const departments = typeof j.departments === 'string'
        ? j.departments.split(',').map(s => s.trim()).filter(Boolean)
        : (j.departments || []);
      return { ...j, departments };
    });
    res.json(mapped);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load hospitals' });
  }
});

// GET one
router.get('/:id', async (req, res) => {
  try {
    const h = await Hospital.findByPk(req.params.id);
    if (!h) return res.status(404).json({ message: 'Not found' });
    const j = h.toJSON();
    const departments = typeof j.departments === 'string'
      ? j.departments.split(',').map(s => s.trim()).filter(Boolean)
      : (j.departments || []);
    res.json({ ...j, departments });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to get hospital' });
  }
});

// POST /api/hospitals — optional protect if needed
router.post('/', /* protect, */ async (req, res) => {
  try {
    const b = req.body || {};
    const created = await Hospital.create({
      name: b.name,
      address: b.address ?? null,
      phone: b.phone ?? null,
      email: b.email ?? null,
      ceo: b.ceo ?? null,
      totalBeds: b.totalBeds ?? 0,
      availableBeds: b.availableBeds ?? 0,
      departments: Array.isArray(b.departments) ? b.departments.join(',') : (b.departments ?? null),
      status: b.status ?? 'active',
    });
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to create hospital' });
  }
});

// PUT /api/hospitals/:id
router.put('/:id', /* protect, */ async (req, res) => {
  try {
    const h = await Hospital.findByPk(req.params.id);
    if (!h) return res.status(404).json({ message: 'Not found' });
    const b = req.body || {};
    await h.update({
      name: b.name ?? h.name,
      address: b.address ?? h.address,
      phone: b.phone ?? h.phone,
      email: b.email ?? h.email,
      ceo: b.ceo ?? h.ceo,
      totalBeds: b.totalBeds ?? h.totalBeds,
      availableBeds: b.availableBeds ?? h.availableBeds,
      departments: b.departments !== undefined
        ? (Array.isArray(b.departments) ? b.departments.join(',') : b.departments)
        : h.departments,
      status: b.status ?? h.status,
    });
    res.json(h);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to update hospital' });
  }
});

// DELETE /api/hospitals/:id
router.delete('/:id', /* protect, */ async (req, res) => {
  try {
    const h = await Hospital.findByPk(req.params.id);
    if (!h) return res.status(404).json({ message: 'Not found' });
    await h.destroy();
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to delete hospital' });
  }
});

export default router;
