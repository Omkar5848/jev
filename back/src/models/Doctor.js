// back/src/models/Doctor.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Doctor = sequelize.define('Doctor', {
  // Custom ID (e.g. "DOC-1001")
  doctorCode: { type: DataTypes.STRING, unique: true, allowNull: true },
  
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: true }, // Changed to true just in case
  gender: { type: DataTypes.ENUM('male','female','other'), allowNull: true },
  dob: { type: DataTypes.DATEONLY, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  altPhone: { type: DataTypes.STRING, allowNull: true },
  specialization: { type: DataTypes.STRING, allowNull: true },
  subSpecialties: { type: DataTypes.TEXT, allowNull: true },
  qualifications: { type: DataTypes.TEXT, allowNull: true },
  registrationNumber: { type: DataTypes.STRING, allowNull: true },
  practicingFrom: { type: DataTypes.DATEONLY, allowNull: true },
  languages: { type: DataTypes.TEXT, allowNull: true },
  availabilityStatus: { type: DataTypes.ENUM('available','busy','offline'), defaultValue: 'available' },
  slotDurationMin: { type: DataTypes.INTEGER, allowNull: true },
  clinicDays: { type: DataTypes.STRING, allowNull: true },
  startTime: { type: DataTypes.STRING, allowNull: true },
  endTime: { type: DataTypes.STRING, allowNull: true },
  allowDoubleBooking: { type: DataTypes.BOOLEAN, defaultValue: false },
  maxDailyAppointments: { type: DataTypes.INTEGER, allowNull: true },
  hospitalName: { type: DataTypes.STRING, allowNull: true },
  department: { type: DataTypes.STRING, allowNull: true },
  workArea: { type: DataTypes.STRING, allowNull: true },
  rating: { type: DataTypes.FLOAT, allowNull: true },
  totalAppointments: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  lastMonthAppointments: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  onCall: { type: DataTypes.BOOLEAN, defaultValue: false },
  patientPanelCount: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  emrSystemId: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, { 
  tableName: 'Doctors',
  hooks: {
    // AUTOMATIC ID GENERATION HOOK
    beforeCreate: async (doctor) => {
      if (!doctor.doctorCode) {
        // 1. Find the last doctor created
        const lastDoctor = await Doctor.findOne({
          order: [['createdAt', 'DESC']],
          attributes: ['doctorCode']
        });

        // 2. Determine the next number
        let nextNumber = 1001; // Start from 1001
        if (lastDoctor && lastDoctor.doctorCode) {
          const parts = lastDoctor.doctorCode.split('-');
          const lastNum = parseInt(parts[1], 10);
          if (!isNaN(lastNum)) {
            nextNumber = lastNum + 1;
          }
        }

        // 3. Set the new code
        doctor.doctorCode = `DOC-${nextNumber}`;
      }
    }
  }
});

export default Doctor;