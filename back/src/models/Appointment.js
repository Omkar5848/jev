import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Appointment = sequelize.define('Appointment', {
  patientName: { type: DataTypes.STRING, allowNull: false }, 
  date: { type: DataTypes.DATEONLY, allowNull: false },
  time: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, defaultValue: 'Checkup' },
  status: { type: DataTypes.ENUM('Scheduled', 'Completed', 'Cancelled'), defaultValue: 'Scheduled' },
  doctorId: { type: DataTypes.INTEGER, allowNull: false },
  

  patientId: { type: DataTypes.INTEGER, allowNull: true },
  reason: { type: DataTypes.TEXT },
  notes: { type: DataTypes.TEXT }
}, {
  timestamps: true
});

export default Appointment;