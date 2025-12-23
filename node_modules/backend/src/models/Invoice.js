import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Invoice = sequelize.define('Invoice', {
  doctorId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'PENDING' }
}, { tableName: 'invoices' });

export default Invoice;
