import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Freelancer = sequelize.define(
  'Freelancer',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },

    specialization: { type: DataTypes.STRING, allowNull: true },
    availability: {
      type: DataTypes.ENUM('available', 'busy', 'offline'),
      allowNull: true,
      defaultValue: 'available',
    },

    rating: { type: DataTypes.FLOAT, allowNull: true },
    years: { type: DataTypes.INTEGER, allowNull: true },
    ratePerHour: { type: DataTypes.INTEGER, allowNull: true },
    projects: { type: DataTypes.INTEGER, allowNull: true },

    // Store as CSV; controller converts to array for responses
    skills: { type: DataTypes.TEXT, allowNull: true },

    email: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: 'freelancers',
    timestamps: true, // createdAt, updatedAt
  }
);

export default Freelancer;
