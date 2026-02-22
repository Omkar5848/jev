// back/src/routes/appointmentRoutes.js
import express from 'express';
import { getMyAppointments, createAppointment, getMyPatients } from '../controllers/appointmentController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getMyAppointments);       // GET /api/appointments
router.post('/', authMiddleware, createAppointment);      // POST /api/appointments
router.get('/patients', authMiddleware, getMyPatients);   // GET /api/appointments/patients

export default router;