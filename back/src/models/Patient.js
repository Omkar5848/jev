import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, 
    references: {
      model: 'Users', 
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Changed to STRING to allow flexibility (e.g. "2 months", "45") if needed, 
  // or keep INTEGER if you prefer strict numbers. Kept INTEGER based on your previous file.
  age: {
    type: DataTypes.INTEGER
  },
  gender: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  diagnosis: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active'
  },
  lastVisit: {
    type: DataTypes.DATE
  },
  
  // --- NEW FIELDS FOR DASHBOARD SYNC ---
  bloodGroup: { 
    type: DataTypes.STRING, 
    defaultValue: '-' 
  },
  height: { 
    type: DataTypes.INTEGER, 
    defaultValue: 0 // stored in cm
  }, 
  weight: { 
    type: DataTypes.INTEGER, 
    defaultValue: 0 // stored in kg
  }, 
  heartRate: { 
    type: DataTypes.INTEGER, 
    defaultValue: 0 
  },
  bpSystolic: { 
    type: DataTypes.INTEGER, 
    defaultValue: 0 
  },
  bpDiastolic: { 
    type: DataTypes.INTEGER, 
    defaultValue: 0 
  },
  glucose: { 
    type: DataTypes.INTEGER, 
    defaultValue: 0 // stored in mg/dL
  },
  temperature: { 
    type: DataTypes.FLOAT, 
    defaultValue: 98.6 
  },

  // --- HISTORY FIELDS (JSON) ---
  // Stores arrays like ["Peanuts", "Dust"]
  allergies: { 
    type: DataTypes.JSON, 
    defaultValue: [] 
  }, 
  // Stores arrays of objects like [{name: "Aspirin", dosage: "10mg"}]
  medications: { 
    type: DataTypes.JSON, 
    defaultValue: [] 
  },

  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Doctors',
      key: 'id'
    }
  }
}, {
  tableName: 'Patients', 
  freezeTableName: true, // Prevents Sequelize from renaming it to 'patients'
  timestamps: true       
});

export default Patient;