import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './User.js';

const Hospital = sequelize.define('Hospital', {
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  ceo: { type: DataTypes.STRING }
}, {
  timestamps: true
});

Hospital.belongsTo(User, { foreignKey: 'createdBy' });
User.hasMany(Hospital, { foreignKey: 'createdBy' });

export default Hospital;
