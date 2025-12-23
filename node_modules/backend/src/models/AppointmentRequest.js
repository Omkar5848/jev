import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AppointmentRequest = sequelize.define('AppointmentRequest', {
  doctorId: { type: DataTypes.INTEGER, allowNull: false },
  patientName: DataTypes.STRING,
  date: DataTypes.STRING, // ISO yyyy-mm-dd
  time: DataTypes.STRING, // HH:mm
  status: { type: DataTypes.STRING, defaultValue: 'PENDING' }
}, { tableName: 'appointment_requests' });

export default AppointmentRequest;
