import express, { Router } from 'express';
import auth from '../middleware/authMiddleware.js';
import {
  getShifts,
  upsertShiftsBulk,
  list,
  create,
  update,
  remove as removeDoctor,
  getOverview,
  listAppointments,
  acceptRequest,
  rejectRequest,
} from '../controllers/doctorController.js';

const router = Router();

// Admin doctor CRUD under /api/doctors
router.get('/doctors', auth, list);
router.post('/doctors', auth, create);
router.put('/doctors/:id', auth, update);
router.delete('/doctors/:id', auth, removeDoctor);

// Self-service for logged-in doctor under /api/doctors/me/...
const me = express.Router();

me.use(auth, (req, res, next) => {
  if (!req.user || req.user.role !== 'Doctor') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
});

me.get('/overview', getOverview);
me.get('/appointments', listAppointments);
me.post('/requests/:id/accept', acceptRequest);
me.post('/requests/:id/reject', rejectRequest);
me.get('/shifts', getShifts);
me.put('/shifts/bulk', upsertShiftsBulk);

// => /api/doctors/me/...
router.use('/doctors/me', me);

export default router;
