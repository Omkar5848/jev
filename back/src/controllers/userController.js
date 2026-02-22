// back/src/controllers/userController.js
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Nurse from '../models/Nurse.js';
import Technician from '../models/Technician.js';
import { Op } from 'sequelize';

// Get Dashboard Statistics based on Role
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role, profession, doctorId } = req.user;
    
    let stats = [];
    let appointments = [];

    // ============================
    // 1. DOCTOR STATS
    // ============================
    if (role === 'Doctor' || profession === 'Doctor') {
      const doctor = await Doctor.findOne({ where: { email: req.user.email } });
      const docId = doctor ? doctor.id : null;

      if (docId) {
        // 1. Counts
        const totalAppointments = await Appointment.count({ where: { doctorId: docId } });
        const pendingAppointments = await Appointment.count({ 
          where: { doctorId: docId, status: 'Scheduled' } 
        });
        const totalPatients = await Patient.count({ where: { doctorId: docId } });
        
        // 2. Today's Schedule (REAL DATA)
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        
        const endOfDay = new Date();
        endOfDay.setHours(23,59,59,999);

        const todaySchedule = await Appointment.findAll({
          where: { 
            doctorId: docId,
            date: { [Op.between]: [startOfDay, endOfDay] } // Filter for today
          },
          order: [['time', 'ASC']],
          limit: 5
        });

        // Map to simple format
        appointments = todaySchedule.map(apt => ({
          id: apt.id,
          time: apt.time, // Assumes 'HH:MM' string or similar
          patientName: apt.patientName,
          type: apt.type,
          status: apt.status
        }));

        const todayCount = appointments.length;

        stats = [
          { label: 'Total Appointments', value: totalAppointments, icon: 'calendar', color: 'blue' },
          { label: 'Pending Visits', value: pendingAppointments, icon: 'clock', color: 'orange' },
          { label: 'My Patients', value: totalPatients, icon: 'users', color: 'green' },
          { label: "Today's Schedule", value: todayCount, icon: 'activity', color: 'purple' } 
        ];
      }
    }

    // ============================
    // 2. PATIENT STATS
    // ============================
    else if (profession === 'Patient' || role === 'User') {
      const patient = await Patient.findOne({ where: { userId } });
      
      if (patient) {
        const myAppointments = await Appointment.count({ where: { patientId: patient.id } });
        const upcoming = await Appointment.count({ 
           where: { 
             patientId: patient.id, 
             status: 'Scheduled',
             // date: { [Op.gte]: new Date() } // Uncomment if strict date checking
           } 
        });

        stats = [
          { label: 'Total Visits', value: myAppointments, icon: 'history', color: 'blue' },
          { label: 'Upcoming', value: upcoming, icon: 'calendar', color: 'green' },
          { label: 'Prescriptions', value: 0, icon: 'file-text', color: 'purple' }, // Placeholder for now
          { label: 'Health Score', value: 'Good', icon: 'heart', color: 'red' }
        ];
      } else {
        // Fallback if patient profile isn't fully set up
        stats = [{ label: 'Profile Status', value: 'Incomplete', icon: 'user', color: 'gray' }];
      }
    }

    // ============================
    // 3. NURSE STATS
    // ============================
    else if (profession === 'Nurse') {
      // Nurses might see all current inpatients or assigned ward count
      // For now, we'll count ALL active patients in system as a proxy
      const activePatients = await Patient.count({ where: { status: 'Active' } });
      const criticalPatients = await Patient.count({ where: { status: 'Critical' } });

      stats = [
        { label: 'Active Patients', value: activePatients, icon: 'activity', color: 'green' },
        { label: 'Critical Care', value: criticalPatients, icon: 'alert-circle', color: 'red' },
        { label: 'Available Beds', value: 12, icon: 'bed', color: 'blue' }, // Mock or fetch from Hospital model
        { label: 'Shift', value: 'Morning', icon: 'sun', color: 'orange' }
      ];
    }

    // ============================
    // 4. TECHNICIAN STATS
    // ============================
    else if (profession === 'Technician') {
      // Mocking lab requests until a "LabRequest" model exists
      stats = [
        { label: 'Pending Tests', value: 5, icon: 'flask', color: 'orange' },
        { label: 'Completed Today', value: 12, icon: 'check-circle', color: 'green' },
        { label: 'Reports Due', value: 3, icon: 'file', color: 'red' },
        { label: 'Lab Status', value: 'Active', icon: 'server', color: 'blue' }
      ];
    }

    // ============================
    // 5. ADMIN STATS (Fallback)
    // ============================
    else if (role === 'Admin') {
       const userCount = await User.count();
       stats = [{ label: 'Total Users', value: userCount, icon: 'users', color: 'blue' }];z
    }

    return res.json({ stats, appointments });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return res.status(500).json({ message: 'Error fetching stats', stats: [], appointments: [] });
  }
};