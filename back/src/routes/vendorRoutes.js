import express from 'express';
import Vendor from '../models/Vendor.js';
// Optional auth protection:
// import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/vendors
router.get('/', /* verifyToken, */ async (_req, res) => {
  try {
    const rows = await Vendor.findAll({ order: [['id', 'DESC']] });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to list vendors' });
  }
});

// GET /api/vendors/:id
router.get('/:id', /* verifyToken, */ async (req, res) => {
  try {
    const row = await Vendor.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to get vendor' });
  }
});

// POST /api/vendors
router.post('/', /* verifyToken, */ async (req, res) => {
  try {
    const b = req.body || {};
    const created = await Vendor.create({
      name: b.name,
      contactPerson: b.contactPerson ?? null,
      category: b.category ?? null,
      status: b.status ?? 'active',
      rating: b.rating ?? null,
      contractValue: b.contractValue ?? null,
      documentsCount: b.documentsCount ?? null,
      email: b.email ?? null,
      phone: b.phone ?? null,
      notes: b.notes ?? null,
    });
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.message || 'Failed to create vendor' });
  }
});

// PUT /api/vendors/:id
router.put('/:id', /* verifyToken, */ async (req, res) => {
  try {
    const row = await Vendor.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Not found' });
    const b = req.body || {};

    await row.update({
      name: b.name ?? row.name,
      contactPerson: b.contactPerson ?? row.contactPerson,
      category: b.category ?? row.category,
      status: b.status ?? row.status,
      rating: b.rating ?? row.rating,
      contractValue: b.contractValue ?? row.contractValue,
      documentsCount: b.documentsCount ?? row.documentsCount,
      email: b.email ?? row.email,
      phone: b.phone ?? row.phone,
      notes: b.notes ?? row.notes,
    });

    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.message || 'Failed to update vendor' });
  }
});

// DELETE /api/vendors/:id
router.delete('/:id', /* verifyToken, */ async (req, res) => {
  try {
    const row = await Vendor.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Not found' });
    await row.destroy();
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to delete vendor' });
  }
});

export default router;
