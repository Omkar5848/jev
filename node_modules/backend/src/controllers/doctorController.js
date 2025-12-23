import { Op } from 'sequelize';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Invoice from '../models/Invoice.js';
import Treatment from '../models/Treatment.js';
import AppointmentRequest from '../models/AppointmentRequest.js';
import Doctor from '../models/Doctor.js';
import DoctorShift from '../models/DoctorShift.js';
import sequelize from '../config/db.js';

export const list = async (req, res) => {
  try {
    const { q } = req.query;
    const where = q ? {
      [Op.or]: [
        { firstName: { [Op.like]: `%${q}%` } },
        { lastName: { [Op.like]: `%${q}%` } },
        { specialization: { [Op.like]: `%${q}%` } },
        { hospitalName: { [Op.like]: `%${q}%` } },
        { doctorCode: { [Op.like]: `%${q}%` } }
      ]
    } : undefined;
    const rows = await Doctor.findAll({ where, order: [['createdAt','DESC']] });
    res.json(rows);
  } catch (err) {
    console.error('Doctor list error', err);
    res.status(500).json({ message: 'Failed to fetch doctors' });
  }
};

export const create = async (req, res) => {
  try {
    const body = { ...req.body };
    if (Array.isArray(body.subSpecialties)) body.subSpecialties = body.subSpecialties.join(',');
    if (Array.isArray(body.languages)) body.languages = body.languages.join(',');
    if (Array.isArray(body.clinicDays)) body.clinicDays = body.clinicDays.join(',');
    const doc = await Doctor.create(body);
    res.status(201).json(doc);
  } catch (err) {
    console.error('Doctor create error', err);
    res.status(400).json({ message: err?.message || 'Failed to create doctor' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const body = { ...req.body };
    if (Array.isArray(body.subSpecialties)) body.subSpecialties = body.subSpecialties.join(',');
    if (Array.isArray(body.languages)) body.languages = body.languages.join(',');
    if (Array.isArray(body.clinicDays)) body.clinicDays = body.clinicDays.join(',');
    const [count] = await Doctor.update(body, { where: { id } });
    if (!count) return res.status(404).json({ message: 'Not found' });
    const latest = await Doctor.findByPk(id);
    res.json(latest);
  } catch (err) {
    console.error('Doctor update error', err);
    res.status(400).json({ message: err?.message || 'Failed to update doctor' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const count = await Doctor.destroy({ where: { id } });
    if (!count) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Doctor delete error', err);
    res.status(400).json({ message: err?.message || 'Failed to delete doctor' });
  }
};


// --- Self-service doctor dashboard handlers ---



const isoToday = () => new Date().toISOString().slice(0, 10);
const monthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { [Op.between]: [start, end] };
};

// GET /doctors/me/overview
export const getOverview = async (req, res) => {
  try {
    const doctorId = req.user?.doctorId;
    if (!doctorId) return res.status(401).json({ message: 'Unauthorized' });

    const [patientsCount, income, appointmentsCount, treatmentsCount, todayAppointments, requests] = await Promise.all([
      Patient.count({ where: { doctorId } }),
      Invoice.sum('amount', { where: { doctorId, status: 'PAID', createdAt: monthRange() } }),
      Appointment.count({ where: { doctorId, createdAt: monthRange() } }),
      Treatment.count({ where: { doctorId, createdAt: monthRange() } }),
      Appointment.findAll({
        where: { doctorId, date: isoToday() },
        order: [['time', 'ASC']],
        attributes: ['id','patientId','patientName','reason','status','time'],
        limit: 20
      }),
      AppointmentRequest.findAll({
        where: { doctorId, status: 'PENDING' },
        order: [['createdAt','DESC']],
        attributes: ['id','patientName','date','time'],
        limit: 10
      })
    ]);

    const nextPatient = todayAppointments[0]
      ? await Patient.findByPk(todayAppointments[0].patientId, {
          attributes: ['id','name','address','dob','sex','height','weight','lastAppointment','registerDate','conditions']
        })
      : null;

    res.json({
      patientsCount: patientsCount || 0,
      income: income || 0,
      appointmentsCount: appointmentsCount || 0,
      treatmentsCount: treatmentsCount || 0,
      todayAppointments,
      nextPatient,
      requests
    });
  } catch (err) {
    console.error('getOverview error', err);
    res.status(500).json({ message: 'Failed to load overview' });
  }
};

// GET /doctors/me/appointments
export const listAppointments = async (req, res) => {
  try {
    const doctorId = req.user?.doctorId;
    if (!doctorId) return res.status(401).json({ message: 'Unauthorized' });

    const { page = 1, pageSize = 20, status, q } = req.query;
    const where = { doctorId };
    if (status) where.status = status;
    if (q) where[Op.or] = [
      { patientName: { [Op.like]: `%${q}%` } },
      { reason: { [Op.like]: `%${q}%` } }
    ];

    const rows = await Appointment.findAll({
      where,
      order: [['date','DESC'],['time','DESC']],
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize),
      attributes: ['id','date','time','patientName','reason','status']
    });
    const total = await Appointment.count({ where });
    res.json({ rows, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    console.error('listAppointments error', err);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
};

// POST /doctors/me/requests/:id/accept
export const acceptRequest = async (req, res) => {
  try {
    const doctorId = req.user?.doctorId;
    if (!doctorId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const reqRow = await AppointmentRequest.findOne({ where: { id, doctorId } });
    if (!reqRow) return res.status(404).json({ message: 'Not found' });

    reqRow.status = 'ACCEPTED';
    await reqRow.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('acceptRequest error', err);
    res.status(500).json({ message: 'Failed to accept request' });
  }
};

// POST /doctors/me/requests/:id/reject
export const rejectRequest = async (req, res) => {
  try {
    const doctorId = req.user?.doctorId;
    if (!doctorId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const reqRow = await AppointmentRequest.findOne({ where: { id, doctorId } });
    if (!reqRow) return res.status(404).json({ message: 'Not found' });

    reqRow.status = 'REJECTED';
    await reqRow.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('rejectRequest error', err);
    res.status(500).json({ message: 'Failed to reject request' });
  }
};
export const getShifts = async (req, res) => {
  try {
    const doctorId = req.user?.doctorId;
    if (!doctorId) return res.status(401).json({ message: 'Unauthorized' });

    const { month } = req.query; // 'YYYY-MM'
    if (!month || !/^\d{4}-\d{2}$/.test(String(month))) {
      return res.status(400).json({ message: 'Missing or invalid month' });
    }

    const [yearStr, monthStr] = String(month).split('-');
    const year = Number(yearStr);
    const m = Number(monthStr); // 1–12

    const start = new Date(year, m - 1, 1);          // inclusive
    const end = new Date(year, m, 0, 23, 59, 59);    // inclusive last day

    const rows = await DoctorShift.findAll({
      where: {
        doctorId,
        date: { [Op.between]: [start, end] },
      },
      attributes: ['date', 'shift'],
      order: [['date', 'ASC']],
    });

    res.json(rows);
  } catch (e) {
    console.error('getShifts error', e);
    res.status(500).json({ message: 'Failed to load shifts' });
  }
};

export const upsertShiftsBulk = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      await t.rollback();
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { month, days } = req.body || {};
    if (!month || !Array.isArray(days) || !/^\d{4}-\d{2}$/.test(String(month))) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const [yearStr, monthStr] = String(month).split('-');
    const year = Number(yearStr);
    const m = Number(monthStr);

    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 0, 23, 59, 59);

    // Delete existing rows for this doctor+month
    await DoctorShift.destroy({
      where: {
        doctorId,
        date: { [Op.between]: [start, end] },
      },
      transaction: t,
    });

    // Insert new rows
    for (const d of days) {
      if (!d?.date || !d?.shift) continue;
      await DoctorShift.create(
        { doctorId, date: d.date, shift: d.shift },
        { transaction: t }
      );
    }

    await t.commit();
    res.json({ ok: true });
  } catch (e) {
    await t.rollback();
    console.error('upsertShiftsBulk error', e);
    res.status(500).json({ message: 'Failed to save shifts' });
  }
};