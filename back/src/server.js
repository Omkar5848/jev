// back/src/server.js
import path from 'path';
import express from 'express';
import cors from 'cors';
import sequelize from './config/db.js';
import 'dotenv/config';

// Routes
import authRoutes from './routes/authRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import freelancerRoutes from './routes/freelancerRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import demandRoutes from './routes/demandRoutes.js';
import userRoutes from './routes/userRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import localAgencyRoutes from './routes/localAgencyRoutes.js';
import doctorFeatureRoutes from './routes/doctorFeatureRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';  

// Mailer
import { verifyMailer } from './utils/mailer.js';

// ==========================================
// 1. IMPORT MODELS (Required for Associations)
// ==========================================
import User from './models/User.js';
import Doctor from './models/Doctor.js';
import Patient from './models/Patient.js';
import Appointment from './models/Appointment.js';
import Treatment from './models/Treatment.js';
import Nurse from './models/Nurse.js';
import Technician from './models/Technician.js';

// Import others to ensure they are registered with Sequelize
import './models/Hospital.js';
import './models/Freelancer.js';
import './models/Vendor.js';
import './models/Demand.js';
import './models/LocalAgency.js';
import './models/Message.js';

const app = express();

const allowedOrigins = [process.env.WEB_ORIGIN || 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); 
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use('/uploads', express.static(path.resolve('uploads')));

// ==========================================
// 2. DEFINE DATABASE ASSOCIATIONS
// ==========================================

// 1. Link User -> Doctor
User.hasOne(Doctor, { foreignKey: 'userId' });
Doctor.belongsTo(User, { foreignKey: 'userId' }); 

// 2. Link User -> Patient
User.hasOne(Patient, { foreignKey: 'userId', as: 'patientProfile' });
Patient.belongsTo(User, { foreignKey: 'userId' });

// 3. Link User -> Nurse
User.hasOne(Nurse, { foreignKey: 'userId' });
Nurse.belongsTo(User, { foreignKey: 'userId' });

// 4. Link User -> Technician
User.hasOne(Technician, { foreignKey: 'userId' });
Technician.belongsTo(User, { foreignKey: 'userId' });

// --- Patient & Doctor Care Links ---
// A Doctor has many Patients
Doctor.hasMany(Patient, { foreignKey: 'doctorId' });
Patient.belongsTo(Doctor, { foreignKey: 'doctorId' });

// Appointments link a Doctor and a Patient
Doctor.hasMany(Appointment, { foreignKey: 'doctorId' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId' });

Patient.hasMany(Appointment, { foreignKey: 'patientId' });
Appointment.belongsTo(Patient, { foreignKey: 'patientId' });

// Treatments History
Patient.hasMany(Treatment, { foreignKey: 'patientId' });
Treatment.belongsTo(Patient, { foreignKey: 'patientId' });

Doctor.hasMany(Treatment, { foreignKey: 'doctorId' });
Treatment.belongsTo(Doctor, { foreignKey: 'doctorId' });
// ==========================================
// 3. ROUTES
// ==========================================

// Public Routes
app.use('/api/auth', authRoutes);

// Protected Routes
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/freelancers', freelancerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/demands', demandRoutes);
app.use('/api/users', userRoutes);
app.use('/api', doctorRoutes); 
app.use('/api/local-agencies', localAgencyRoutes);
app.use('/api/doctor-features', doctorFeatureRoutes);
app.use('/api/appointments', appointmentRoutes);
app.get('/', (_req, res) => res.send('API running (PostgreSQL)'));

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    // alter: true updates tables to match new models (adds userId columns etc.)
    await sequelize.sync({ alter: true });
    
    try { await verifyMailer(); } catch (e) { console.warn('SMTP Warning:', e.message); }
    
    console.log('✅ Database synced');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  }
})(); 