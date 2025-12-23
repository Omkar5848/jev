// backend/src/models/Demand.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Demand = sequelize.define(
  'Demand',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    title: { type: DataTypes.STRING, allowNull: false },               // "Cardiology Specialist Required"
    description: { type: DataTypes.TEXT, allowNull: true },

    priority: {
      type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
      allowNull: false,
      defaultValue: 'medium',
    },

    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'open',
    },

    budget: { type: DataTypes.INTEGER, allowNull: true },              // e.g., 8000 => show as 8K in UI
    deadline: { type: DataTypes.DATEONLY, allowNull: true },           // "2025-09-15"

    hospitalName: { type: DataTypes.STRING, allowNull: true },         // "City General Hospital"
    vendorName: { type: DataTypes.STRING, allowNull: true },           // "MedEquip Solutions"

    requiredSkills: { type: DataTypes.TEXT, allowNull: true },         // CSV, UI gets array

    // Optional references if you later relate to tables
    hospitalId: { type: DataTypes.INTEGER, allowNull: true },
    vendorId: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'demands',
    timestamps: true,
  }
);

export default Demand;
