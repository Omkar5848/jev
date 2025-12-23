import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Treatment = sequelize.define('Treatment', {
  doctorId: { type: DataTypes.INTEGER, allowNull: false },
  patientId: { type: DataTypes.INTEGER, allowNull: false },
  name: DataTypes.STRING
}, { tableName: 'treatments' });

export default Treatment;
