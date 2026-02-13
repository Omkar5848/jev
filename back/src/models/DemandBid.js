import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const DemandBid = sequelize.define('DemandBid', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  demandId: { type: DataTypes.INTEGER, allowNull: false },
  agencyName: { type: DataTypes.STRING, allowNull: false },
  agencyEmail: { type: DataTypes.STRING, allowNull: false },
  bidAmount: { type: DataTypes.INTEGER, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM('applied', 'shortlisted', 'rejected', 'accepted'),
    allowNull: false,
    defaultValue: 'applied',
  },
}, {
  tableName: 'demand_bids',
  timestamps: true,
});

export default DemandBid;
