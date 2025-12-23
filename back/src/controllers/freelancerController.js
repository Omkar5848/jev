// backend/src/controllers/freelancerController.js
const Freelancer = require('../models/Freelancer');

exports.ensureInit = async () => {
  await Freelancer.init();
};

exports.list = async (req, res) => {
  try {
    const rows = await Freelancer.all();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to list freelancers' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
    const row = await Freelancer.findById(id);
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to get freelancer' });
  }
};

exports.create = async (req, res) => {
  try {
    const created = await Freelancer.create(req.body || {});
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to create freelancer' });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
    const updated = await Freelancer.update(id, req.body || {});
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to update freelancer' });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
    await Freelancer.remove(id);
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to delete freelancer' });
  }
};
