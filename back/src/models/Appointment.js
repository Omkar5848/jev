import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Appointment = sequelize.define('Appointment', {
  patientName: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false }, // Format: YYYY-MM-DD
  time: { type: DataTypes.STRING, allowNull: false },   // Format: HH:MM
  type: { type: DataTypes.STRING, defaultValue: 'Checkup' },
  status: { type: DataTypes.ENUM('Scheduled', 'Completed', 'Cancelled'), defaultValue: 'Scheduled' },
  doctorId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  timestamps: true
});

export default Appointment;