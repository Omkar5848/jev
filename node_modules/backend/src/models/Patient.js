import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Patient = sequelize.define('Patient', {
  name: { type: DataTypes.STRING, allowNull: false },
  age: { type: DataTypes.INTEGER },
  gender: { type: DataTypes.ENUM('Male', 'Female', 'Other'), defaultValue: 'Male' },
  phone: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  bloodGroup: { type: DataTypes.STRING },
  // Medical Info
  diagnosis: { type: DataTypes.TEXT }, // Main condition
  notes: { type: DataTypes.TEXT },     // Doctor's private notes
  lastVisit: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.ENUM('Active', 'Recovered', 'Critical'), defaultValue: 'Active' },
  doctorId: { type: DataTypes.INTEGER, allowNull: false } // Linked to the logged-in Doctor
});

export default Patient;