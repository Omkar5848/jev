import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Message = sequelize.define('Message', {
  content: { type: DataTypes.TEXT, allowNull: false },
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  receiverId: { type: DataTypes.INTEGER, allowNull: false },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  // NEW FIELD
  isEdited: { type: DataTypes.BOOLEAN, defaultValue: false } 
}, {
  timestamps: true
});

export default Message;