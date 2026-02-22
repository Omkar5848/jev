import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Nurse = sequelize.define('Nurse', {
  userId: { type: DataTypes.INTEGER, allowNull: false }, // Links to User table
  name: { type: DataTypes.STRING, allowNull: false },
  qualification: { type: DataTypes.STRING }, // e.g. "B.Sc Nursing"
  department: { type: DataTypes.STRING },    // e.g. "ICU", "Pediatrics"
  shift: { type: DataTypes.ENUM('Morning', 'Evening', 'Night'), defaultValue: 'Morning' },
  isAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
  phone: { type: DataTypes.STRING }
}, {
  tableName: 'nurses',
  timestamps: true
});

export default Nurse;