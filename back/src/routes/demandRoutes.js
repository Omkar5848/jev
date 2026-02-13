import express from 'express';
import Demand from '../models/Demand.js';
import DemandBid from '../models/DemandBid.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();
const toCsv = (v) => (Array.isArray(v) ? v.join(',') : typeof v === 'string' ? v : null);
const toArr = (csv) => (csv ? String(csv).split(',').map(s => s.trim()).filter(Boolean) : []);

router.get('/', async (_req, res) => {
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

router.get('/:id', async (req, res) => {
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

router.post('/', auth, async (req, res) => {
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

router.put('/:id', auth, async (req, res) => {
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

router.delete('/:id', auth, async (req, res) => {
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

router.get('/:id/bids', auth, async (req, res) => {
  const bids = await DemandBid.findAll({ where: { demandId: req.params.id }, order: [['createdAt', 'DESC']] });
  res.json(bids);
});

router.post('/:id/bids', auth, async (req, res) => {
  if (req.user.role !== 'LocalAgency') {
    return res.status(403).json({ message: 'Only local agencies can bid for shifts' });
  }

  const { bidAmount, message } = req.body || {};
  if (!bidAmount) return res.status(400).json({ message: 'bidAmount is required' });

  const demand = await Demand.findByPk(req.params.id);
  if (!demand) return res.status(404).json({ message: 'Demand not found' });

  const bid = await DemandBid.create({
    demandId: Number(req.params.id),
    agencyName: req.user.name,
    agencyEmail: req.user.email,
    bidAmount,
    message: message || null,
  });

  res.status(201).json(bid);
});

export default router;
