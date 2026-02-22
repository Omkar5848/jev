// back/src/controllers/appointmentController.js
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

// Helper to find Doctor ID from User ID
const getDoctorId = async (userId) => {
  const doctor = await Doctor.findOne({ where: { email: { [Op.in]: [
    (await User.findByPk(userId)).email 
  ]} } });
  return doctor ? doctor.id : null;
};

// 1. Get Doctor's Appointments
export const getMyAppointments = async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);
    if (!doctorId) return res.status(404).json({ message: 'Doctor profile not found' });

    const appointments = await Appointment.findAll({
      where: { doctorId },
      include: [{ model: Patient, attributes: ['id', 'name', 'phone'] }], // Join Patient info
      order: [['date', 'ASC'], ['time', 'ASC']]
    });

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching schedule' });
  }
};

// 2. Schedule a Patient Visit (Create Appointment)
export const createAppointment = async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);
    const { patientId, patientName, date, time, type, reason } = req.body;

    if (!doctorId) return res.status(404).json({ message: 'Doctor profile not found' });

    const newAppointment = await Appointment.create({
      doctorId,
      patientId: patientId || null, // Optional if patient not registered yet
      patientName: patientName || 'Unknown', // Fallback name
      date,
      time,
      type: type || 'Checkup',
      status: 'Scheduled',
      reason
    });

    res.status(201).json(newAppointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error scheduling visit' });
  }
};

// 3. Get Doctor's Patients
export const getMyPatients = async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);
    if (!doctorId) return res.status(404).json({ message: 'Doctor profile not found' });

    // Find patients assigned to this doctor OR patients who have appointments with this doctor
    const patients = await Patient.findAll({
      where: { doctorId },
      order: [['name', 'ASC']]
    });

    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching patients' });
  }
};

// Add this function to your existing controller
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, status, type, reason } = req.body;
    
    // Find the appointment
    const appointment = await Appointment.findByPk(id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Update fields
    if (date) appointment.date = date;
    if (time) appointment.time = time;
    if (status) appointment.status = status;
    if (type) appointment.type = type;
    if (reason) appointment.reason = reason;

    await appointment.save();
    res.json({ message: 'Appointment updated', appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Update failed' });
  }
};