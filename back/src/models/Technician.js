import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Technician = sequelize.define('Technician', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  specialization: { type: DataTypes.STRING }, // e.g. "Radiology", "Pathology"
  certification: { type: DataTypes.STRING },  // e.g. "Certified Lab Tech"
  labNumber: { type: DataTypes.STRING },      // Assigned Lab Room/Unit
  phone: { type: DataTypes.STRING }
}, {
  tableName: 'technicians',
  timestamps: true
});

export default Technician;