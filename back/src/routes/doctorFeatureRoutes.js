import express from 'express';
import { Op } from 'sequelize';
import auth from '../middleware/authMiddleware.js';
import Patient from '../models/Patient.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js'; // IMPORT NEW MODEL

const router = express.Router();

// ================= OVERVIEW DASHBOARD =================
router.get('/overview', auth, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // 1. Count Patients
    const patientsCount = await Patient.count({ 
      where: { doctorId } 
    });

    // 2. Count Total Unread Messages
    const unreadMessages = await Message.count({
      where: { 
        receiverId: doctorId,
        isRead: false
      }
    });

    // 3. Get Today's Appointments (Real Data)
    const todayAppointments = await Appointment.findAll({
      where: { doctorId, date: today },
      order: [['time', 'ASC']]
    });

    res.json({
      patientsCount,
      appointmentsCount: todayAppointments.length, // Send real count
      unreadMessages,
      todayAppointments // Send the list for the bottom section
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch overview stats' });
  }
});

// ================= APPOINTMENT ROUTES (NEW) =================

// GET All Future Appointments
router.get('/appointments', auth, async (req, res) => {
  try {
    const apps = await Appointment.findAll({
      where: { 
        doctorId: req.user.id,
        // Optional: Filter for today onwards only?
        // date: { [Op.gte]: new Date().toISOString().split('T')[0] } 
      },
      order: [['date', 'ASC'], ['time', 'ASC']]
    });
    res.json(apps);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST Create Appointment
router.post('/appointments', auth, async (req, res) => {
  try {
    const app = await Appointment.create({ ...req.body, doctorId: req.user.id });
    res.json(app);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE Appointment
router.delete('/appointments/:id', auth, async (req, res) => {
  try {
    await Appointment.destroy({ where: { id: req.params.id, doctorId: req.user.id } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// ================= PATIENT ROUTES =================

router.get('/patients', auth, async (req, res) => {
  try {
    const patients = await Patient.findAll({ 
      where: { doctorId: req.user.id },
      order: [['createdAt', 'DESC']] 
    });
    res.json(patients);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/patients', auth, async (req, res) => {
  try {
    const patient = await Patient.create({ ...req.body, doctorId: req.user.id });
    res.json(patient);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/patients/:id', auth, async (req, res) => {
  try {
    const p = await Patient.findOne({ where: { id: req.params.id, doctorId: req.user.id } });
    if (!p) return res.status(404).json({ message: 'Patient not found' });
    await p.update(req.body);
    res.json(p);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/patients/:id', auth, async (req, res) => {
  try {
    await Patient.destroy({ where: { id: req.params.id, doctorId: req.user.id } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// ================= MESSAGING ROUTES =================

// GET Contacts (With Unread Counts)
router.get('/messages/contacts', auth, async (req, res) => {
  try {
    const users = await User.findAll({
      where: { 
        id: { [Op.ne]: req.user.id },
        profession: { [Op.iLike]: 'Doctor' } 
      },
      attributes: ['id', 'name', 'profession', 'avatarUrl']
    });

    // Calculate unread count per contact
    const contactsWithCount = await Promise.all(users.map(async (user) => {
      const count = await Message.count({
        where: { 
          senderId: user.id, 
          receiverId: req.user.id, 
          isRead: false 
        }
      });
      return { ...user.toJSON(), unreadCount: count };
    }));

    res.json(contactsWithCount);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET Messages (And Mark as Read)
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

    // Mark these messages as READ now that we've fetched them
    await Message.update({ isRead: true }, {
      where: { 
        senderId: req.params.userId, 
        receiverId: req.user.id, 
        isRead: false 
      }
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