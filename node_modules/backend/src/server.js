import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
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

// Models (must be imported before sync so Sequelize knows about them)
import './models/User.js';
import './models/Hospital.js';
import './models/Freelancer.js';
import './models/Vendor.js';
import './models/Demand.js';
import './models/Doctor.js';
import './models/LocalAgency.js';
import './models/Patient.js';
import './models/Message.js';
import './models/Appointment.js';

// Mailer (verify SMTP on boot)
import { verifyMailer } from './utils/mailer.js';

dotenv.config();

const app = express();

// CORS for local dev; tighten origin array for prod if needed
const allowedOrigins = [process.env.WEB_ORIGIN || 'http://localhost:3000'];

app.use(
  cors({
    origin: function (origin, callback) {
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
  
      return callback(null, true);
    }
    
    return callback(null, true);
  },
    credentials: true,
    // FIX: Added 'PATCH' to the allowed methods
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Serve uploaded avatars
app.use('/uploads', express.static(path.resolve('uploads')));

// Route mounts
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/freelancers', freelancerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/demands', demandRoutes);
app.use('/api/users', userRoutes);
app.use('/api', doctorRoutes);
app.use('/api/local-agencies', localAgencyRoutes);
app.use('/api/doctor-features', doctorFeatureRoutes);

app.get('/', (_req, res) => res.send('API running (PostgreSQL + Sequelize)'));

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    // Ensure DB schema is in place
    await sequelize.sync({ alter: true });

    // Verify SMTP credentials early
    try {
      await verifyMailer();
    } catch (e) {
      console.warn('SMTP verify warning:', e?.message || e);
    }

    console.log('Database synced (PostgreSQL, alter:true)');
    app.listen(PORT, () => console.log('Server started on', PORT));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();