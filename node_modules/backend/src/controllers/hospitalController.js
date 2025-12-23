import Hospital from '../models/Hospital.js';

export const getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.findAll({ where: { createdBy: req.user.id } });
    res.json(hospitals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const createHospital = async (req, res) => {
  try {
    const { name, address, phone, email, ceo } = req.body;
    const hospital = await Hospital.create({ name, address, phone, email, ceo, createdBy: req.user.id });
    res.status(201).json(hospital);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const updateHospital = async (req, res) => {
  try {
    const [count, rows] = await Hospital.update(req.body, { where: { id: req.params.id, createdBy: req.user.id }, returning: true });
    if(count === 0) return res.status(404).json({ message: 'Hospital not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteHospital = async (req, res) => {
  try {
    const deleted = await Hospital.destroy({ where: { id: req.params.id, createdBy: req.user.id } });
    if(!deleted) return res.status(404).json({ message: 'Hospital not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
