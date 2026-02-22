import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { sendMail } from '../utils/mailer.js';
import crypto from 'crypto';
import { Op } from 'sequelize';

// Helper: Get Doctor ID
const getDoctorId = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return null;
  const doctor = await Doctor.findOne({ where: { email: user.email } });
  return doctor ? doctor.id : null;
};

// =========================================================
// 1. Create Patient (Updated: Admins + Doctors)
// =========================================================
export const createPatient = async (req, res) => {
  try {
    let doctorId = null;

    // --- PERMISSION CHECK ---
    // If Admin: Can add patients (optionally assign a doctorId if passed in body)
    if (req.user.role === 'Admin' || req.user.profession === 'Admin') {
        doctorId = req.body.doctorId || null;
    } 
    // If Doctor: Must have a valid doctor profile
    else {
        doctorId = await getDoctorId(req.user.id);
        if (!doctorId) {
            return res.status(403).json({ message: 'Only Doctors or Admins can add patients' });
        }
    }
    // ------------------------

    const { name, age, gender, phone, email, diagnosis, status } = req.body;

    // A. Check duplicates (Only if a specific doctor is assigned)
    if (doctorId) {
        const exists = await Patient.findOne({ where: { phone, doctorId } });
        if (exists) return res.status(400).json({ message: 'Patient with this phone already exists for this doctor' });
    }

    let userId = null;

    // B. Handle User Account Creation (Passwordless Setup)
    if (email) {
      const userExists = await User.findOne({ where: { email } });
      
      if (userExists) {
        userId = userExists.id; 
      } else {
        // 1. Create a secure random password (we DO NOT send this to the user)
        const secureRandomPass = crypto.randomBytes(16).toString('hex');
        const hash = await bcrypt.hash(secureRandomPass, 10);

        const newUser = await User.create({
          name,
          email,
          password: hash, 
          profession: 'Patient',
          role: 'User',
          isEmailVerified: true, 
          // Flag: User must set password after OTP login
          needsPasswordReset: true 
        });
        userId = newUser.id;

        // 2. Send "Login via OTP" Instructions via Email
        const loginLink = process.env.WEB_ORIGIN || 'http://localhost:3000/login';
        
        try {
            await sendMail({
            to: email,
            subject: 'Welcome to Jeevak Health Portal',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: auto;">
                <h2 style="color: #0070f3;">Welcome to Jeevak Health</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>An account has been created for you on the Jeevak Health Portal.</p>
                
                <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold; font-size: 1.1em;">How to Access Your Account:</p>
                    <ol style="margin-top: 10px; line-height: 1.6;">
                        <li>Go to the Login Page: <a href="${loginLink}" style="color: #0070f3;">${loginLink}</a></li>
                        <li>Click the <strong>"Login via OTP"</strong> button.</li>
                        <li>Enter your registered email: <strong>${email}</strong></li>
                    </ol>
                </div>

                <p style="font-size: 0.9rem; color: #666; margin-top: 20px;">
                   <em>Note: For security reasons, you will be prompted to set a permanent password after your first login.</em>
                </p>
              </div>
            `
            });
        } catch (mailError) {
            console.error("Failed to send welcome email:", mailError);
        }
      }
    }

    // C. Create Patient Record
    const newPatient = await Patient.create({
      doctorId, // Can be null if Admin adds it unassigned
      userId,
      name,
      age,
      gender,
      phone,
      email,
      diagnosis,
      status: status || 'Active',
      lastVisit: new Date()
    });

    res.status(201).json(newPatient);
  } catch (error) {
    console.error("Create Patient Error:", error);
    res.status(500).json({ message: 'Failed to add patient' });
  }
};

// =========================================================
// 2. Get All Patients (Admin: Merges Registered + Doctor Created)
// =========================================================
export const getAllPatients = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access Denied' });

    // Step A: Get Self-Registered Users (Role = 'Patient')
    const registeredUsers = await User.findAll({
      where: { profession: 'Patient' }, 
      attributes: ['id', 'name', 'email', 'createdAt'],
      include: [{
        model: Patient,
        as: 'patientProfile', 
        required: false,      
        include: [{
            model: Doctor,
            attributes: ['firstName', 'lastName']
        }]
      }],
      order: [['createdAt', 'DESC']]
    });

    // Step B: Get Doctor-Created Patients who have NO User Account
    const medicalOnlyPatients = await Patient.findAll({
      where: { userId: null },
      include: [{ model: Doctor, attributes: ['firstName', 'lastName'] }]
    });

    // Step C: Normalize & Merge Data
    const results = [
      // 1. Map Registered Users
      ...registeredUsers.map(u => {
        const p = u.patientProfile || {}; 
        return {
          id: u.id,
          source: 'Registered',
          name: u.name,
          email: u.email,
          age: p.age || '-',
          gender: p.gender || '-',
          phone: p.phone || '-',
          diagnosis: p.diagnosis || 'N/A',
          status: p.status || 'Active', 
          doctorName: p.Doctor ? `Dr. ${p.Doctor.firstName}` : 'Unassigned',
          createdAt: u.createdAt
        };
      }),
      // 2. Map Doctor-Created Patients
      ...medicalOnlyPatients.map(p => ({
        id: p.id,
        source: 'Doctor Created',
        name: p.name,
        email: p.email || '-',
        age: p.age,
        gender: p.gender,
        phone: p.phone,
        diagnosis: p.diagnosis,
        status: p.status,
        doctorName: p.Doctor ? `Dr. ${p.Doctor.firstName}` : 'Unknown',
        createdAt: p.createdAt
      }))
    ];

    // Sort merged list by newest first
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(results);
  } catch (error) {
    console.error("Get All Patients Error:", error);
    res.status(500).json({ message: 'Error fetching patients' });
  }
};

// =========================================================
// 3. Get My Patients (Doctor Specific)
// =========================================================
export const getMyPatients = async (req, res) => {
  try {
    const doctorId = await getDoctorId(req.user.id);
    if (!doctorId) return res.status(404).json([]);
    
    const patients = await Patient.findAll({ 
        where: { doctorId }, 
        order: [['createdAt', 'DESC']] 
    });
    res.json(patients);
  } catch (error) { 
    res.status(500).json({ message: 'Error fetching your patients' }); 
  }
};

// =========================================================
// 4. Update Patient
// =========================================================
export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    await Patient.update(req.body, { where: { id } });
    res.json({ message: 'Updated successfully' });
  } catch (e) { 
    res.status(500).json({ message: 'Update failed' }); 
  }
};

// =========================================================
// 5. Delete Patient
// =========================================================
export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    await Patient.destroy({ where: { id } });
    res.json({ message: 'Deleted successfully' });
  } catch (e) { 
    res.status(500).json({ message: 'Delete failed' }); 
  }
};