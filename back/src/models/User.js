import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  profession: { type: DataTypes.STRING },
  avatarUrl: { type: DataTypes.STRING, allowNull: true },
  isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  timestamps: true
});

export default User;
