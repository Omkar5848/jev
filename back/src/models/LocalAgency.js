import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const LocalAgency = sequelize.define('LocalAgency', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  phone: { type: DataTypes.STRING, allowNull: false, validate: { len: [7, 20] } },
  contactPerson: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'local_agencies', timestamps: true });

export default LocalAgency;
