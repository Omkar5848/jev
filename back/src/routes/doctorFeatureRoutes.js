import express from 'express';
import { Op } from 'sequelize';
import auth from '../middleware/authMiddleware.js';
import Patient from '../models/Patient.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import { createPatient, getMyPatients, getAllPatients, updatePatient, deletePatient } from '../controllers/patientController.js';
import { updateAppointment } from '../controllers/appointmentController.js';

const router = express.Router();

// ================= HELPER FUNCTION =================
async function getDoctorId(userId) {
  const user = await User.findByPk(userId);
  if (!user) return null;
  const doctor = await Doctor.findOne({ where: { email: user.email } });
  return doctor ? doctor.id : null;
}

// ================= OVERVIEW DASHBOARD =================
router.get('/overview', auth, async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);
    if (!doctorId) return res.status(404).json({ error: 'Doctor profile not found' });

    const today = new Date().toISOString().split('T')[0];

    // 1. Count Patients
    const patientsCount = await Patient.count({ where: { doctorId } });

    // 2. Count Unread Messages
    const unreadMessages = await Message.count({
      where: { receiverId: req.user.id, isRead: false }
    });

    // 3. Get Today's Appointments
    const todayAppointments = await Appointment.findAll({
      where: { doctorId, date: today },
      order: [['time', 'ASC']]
    });

    res.json({
      patientsCount,
      appointmentsCount: todayAppointments.length,
      unreadMessages,
      todayAppointments
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch overview stats' });
  }
});

// ================= APPOINTMENT ROUTES =================

// GET All Future Appointments
router.get('/appointments', auth, async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);
    if (!doctorId) return res.status(404).json({ error: 'Doctor profile not found' });

    const apps = await Appointment.findAll({
      where: { doctorId },
      order: [['date', 'ASC'], ['time', 'ASC']]
    });
    res.json(apps);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST Create Appointment
router.post('/appointments', auth, async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);
    if (!doctorId) return res.status(404).json({ error: 'Doctor profile not found' });

    const app = await Appointment.create({ 
      ...req.body, 
      doctorId: doctorId 
    });
    res.json(app);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT Update Appointment (NEW)
// Allows editing date, time, status, etc.
router.put('/appointments/:id', auth, async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);
    const app = await Appointment.findOne({ where: { id: req.params.id, doctorId } });
    
    if (!app) return res.status(404).json({ message: 'Appointment not found' });
    
    await app.update(req.body);
    res.json(app);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE Appointment
router.delete('/appointments/:id', auth, async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);
    await Appointment.destroy({ where: { id: req.params.id, doctorId } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// ================= PATIENT ROUTES (Using Controller) =================
// These now use the robust logic we created in patientController.js
// which handles the email sending and user creation.

router.get('/patients', auth, getMyPatients);
router.post('/patients', auth, createPatient); // Uses the logic with Mailer
router.put('/patients/:id', auth, updatePatient);
router.delete('/patients/:id', auth, deletePatient);

// ADMIN: Get All Patients
router.get('/admin/patients', auth, getAllPatients);


// ================= MESSAGING ROUTES (Unchanged) =================

router.get('/messages/contacts', auth, async (req, res) => {
  try {
    const users = await User.findAll({
      where: { 
        id: { [Op.ne]: req.user.id },
        profession: { [Op.iLike]: 'Doctor' } 
      },
      attributes: ['id', 'name', 'profession', 'avatarUrl']
    });

    const contactsWithCount = await Promise.all(users.map(async (user) => {
      const count = await Message.count({
        where: { senderId: user.id, receiverId: req.user.id, isRead: false }
      });
      return { ...user.toJSON(), unreadCount: count };
    }));

    res.json(contactsWithCount);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/messages/:userId', auth, async (req, res) => {
  try {
    const msgs = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: req.user.id, receiverId: req.params.userId },
          { senderId: req.params.userId, receiverId: req.user.id }
        ]
      },
      order: [['createdAt', 'ASC']]
    });

    await Message.update({ isRead: true }, {
      where: { senderId: req.params.userId, receiverId: req.user.id, isRead: false }
    });

    res.json(msgs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/messages', auth, async (req, res) => {
  try {
    const msg = await Message.create({
      senderId: req.user.id,
      receiverId: req.body.receiverId,
      content: req.body.content
    });
    res.json(msg);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/messages/:id', auth, async (req, res) => {
  try {
    const msg = await Message.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (msg.senderId !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    msg.content = req.body.content;
    msg.isEdited = true;
    await msg.save();
    res.json(msg);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/messages/:id', auth, async (req, res) => {
  try {
    const msg = await Message.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (msg.senderId !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    await msg.destroy();
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;