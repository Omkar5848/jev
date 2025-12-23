import { v4 as uuid } from 'uuid';
import LocalAgency from '../models/LocalAgency.js';

export const list = async (_req, res) => {
  const rows = await LocalAgency.findAll({ order: [['createdAt', 'DESC']] });
  res.json(rows);
};

export const create = async (req, res) => {
  try {
    const { name, address, email, phone, contactPerson } = req.body;
    if (!name || !email || !phone) return res.status(400).json({ error: 'name, email, phone required' });
    const created = await LocalAgency.create({ id: uuid(), name, address, email, phone, contactPerson });
    res.status(201).json(created);
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'Email must be unique' });
    res.status(500).json({ error: e.message });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const [count] = await LocalAgency.update(req.body, { where: { id } });
    if (count === 0) return res.status(404).json({ error: 'LocalAgency not found' });
    const updated = await LocalAgency.findByPk(id);
    res.json(updated);
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'Email must be unique' });
    res.status(500).json({ error: e.message });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await LocalAgency.destroy({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
