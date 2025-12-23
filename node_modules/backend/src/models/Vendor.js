import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Vendor = sequelize.define(
  'Vendor',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    name: { type: DataTypes.STRING, allowNull: false },             // "MedEquip Solutions"
    contactPerson: { type: DataTypes.STRING, allowNull: true },     // "John Anderson"
    category: { type: DataTypes.STRING, allowNull: true },          // "Medical Equipment" / "Pharmacy"

    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },

    rating: { type: DataTypes.FLOAT, allowNull: true },             // 4.8
    contractValue: { type: DataTypes.INTEGER, allowNull: true },    // 250000 => 250K in UI
    documentsCount: { type: DataTypes.INTEGER, allowNull: true },   // 3

    email: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'vendors',
    timestamps: true, // createdAt, updatedAt
  }
);

export default Vendor;
