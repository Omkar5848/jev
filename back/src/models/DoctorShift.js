import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const DoctorShift = sequelize.define('DoctorShift', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  doctorId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  shift: { type: DataTypes.ENUM('MORNING','EVENING','NIGHT','OFF'), allowNull: false },
}, {
  tableName: 'doctor_shifts',
  indexes: [{ unique: true, fields: ['doctorId', 'date'] }],
});

export default DoctorShift;
