import React, { useState, useEffect, useMemo } from 'react';
import api from '@/utils/api';
import styles from '@/styles/Temp.module.css';
import { 
  FaPlus, FaEdit, FaTrash, FaUser, FaEnvelope, 
  FaSearch, FaSync, FaDownload, FaStethoscope, FaClock, FaPhone, FaGlobe, FaTimes 
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// --- TYPES ---
type Patient = {
  id?: number | string;
  source: string; // 'Registered' or 'Doctor Created'
  name: string;
  age: string | number;
  gender: string;
  email: string;
  phone: string;
  diagnosis: string;
  status: string;
  doctorName: string;
  createdAt: string;
};

// Form Initial State
const initialForm = {
  name: '',
  email: '',
  phone: '',
  age: '',
  gender: 'Male',
  diagnosis: '',
  status: 'Active'
};

export default function PatientsSection() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  // --- DATA FETCHING ---
  async function fetchPatients(isBackground = false) {
    if (!isBackground) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await api.get('/api/doctor-features/admin/patients', { headers });
      setPatients(res.data || []);
    } catch (e) {
      console.error('Failed to sync patients');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(() => fetchPatients(true), 15000); // Fast poll
    return () => clearInterval(interval);
  }, []);

  // --- ADD PATIENT ---
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Ensure you have this route in your backend (e.g., in doctorRoutes.js: router.post('/patients', createPatient))
      await api.post('/api/patients', form); 
      
      alert('Patient added successfully!' + (form.email ? ' Login instructions sent to email.' : ''));
      setShowModal(false);
      setForm(initialForm);
      fetchPatients(true); // Refresh list
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // --- FILTERING ---
  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    return patients.filter(p => 
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.email && p.email.toLowerCase().includes(term))
    );
  }, [patients, query]);

  // --- EXCEL DOWNLOAD ---
  function downloadExcel() {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Patients');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'Patients_List.xlsx');
  }

  return (
    <div className={styles.sectionCard} style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
      
      {/* --- HEADER --- */}
      <div className={styles.sectionCard} style={{ marginBottom: '1.5rem' }}>
        <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className={styles.cardTitle}>Patient Registry</h3>
                <button onClick={() => fetchPatients(false)} className={styles.iconGhostBtn} title="Force Sync">
                   <FaSync className={loading ? 'animate-spin' : ''} style={{fontSize:'0.8rem'}} />
                </button>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              {filtered.length} total users/patients
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                  <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input 
                      value={query} onChange={e => setQuery(e.target.value)}
                      placeholder="Search patients..."
                      style={{ padding: '8px 10px 8px 30px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', background: 'var(--bg-secondary)', color: 'var(--color-text)' }}
                  />
              </div>
              <button className={styles.addHospitalBtn} onClick={() => setShowModal(true)} >
                  <FaPlus /> Add Patient
              </button>
              <button onClick={downloadExcel} className={styles.iconGhostBtn}><FaDownload /></button>
          </div>
        </div>
      </div>

      {/* --- CARD GRID --- */}
      {loading && patients.length === 0 ? (
         <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading registry...</div>
      ) : filtered.length === 0 ? (
         <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No patients found.</div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {filtered.map((p, idx) => (
            <div key={idx} className={styles.sectionCard} style={{ 
              position: 'relative', overflow: 'hidden', padding: '1.5rem',
              display: 'flex', flexDirection: 'column', gap: '1rem',
              transition: 'transform 0.2s'
            }}>
              
              {/* Card Top */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '50%', 
                      background: p.source === 'Registered' ? '#e0f2fe' : '#f3f4f6', 
                      color: p.source === 'Registered' ? '#0284c7' : '#4b5563',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold'
                    }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                        {p.name}
                        </h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {p.source === 'Registered' ? <FaGlobe size={10} /> : <FaUser size={10} />}
                            {p.source}
                        </div>
                    </div>
                </div>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop:'0.5rem' }}>
                
                {p.email && p.email !== '-' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaEnvelope size={12} /> {p.email}
                  </div>
                )}
                
                {p.phone && p.phone !== '-' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaPhone size={12} /> {p.phone}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: p.doctorName !== 'Unassigned' ? 'var(--color-primary)' : 'gray' }}>
                    <FaStethoscope size={12} /> {p.doctorName}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaClock size={12} /> Dx: {p.diagnosis || 'N/A'}
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span className={p.status === 'Active' ? styles.statusActive : styles.pending} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px' }}>
                    {p.status}
                 </span>
                 <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Joined {new Date(p.createdAt).toLocaleDateString()}
                 </span>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* --- ADD PATIENT MODAL --- */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className={`${styles.sectionCard} bg-[var(--color-surface)] rounded-[1.5rem] p-8 text-[var(--color-text)] min-w-[320px] max-w-[500px] w-[90%] relative shadow-[var(--shadow-lg)] flex flex-col max-h-[90vh] border border-[var(--color-card-border)]`}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Add New Patient</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}><FaTimes size={20} /></button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'grid', gap: '1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', display: 'block' }}>Name *</label>
                  <input required name="name" value={form.name} onChange={handleInputChange} className={styles.inputField} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', display: 'block' }}>Phone *</label>
                  <input required name="phone" value={form.phone} onChange={handleInputChange} className={styles.inputField} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                </div>
              </div>

              {/* EMAIL FIELD WITH SPECIAL NOTE */}
              <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', display: 'block', color: '#0369a1' }}>Email (For Login Access)</label>
                <input 
                  type="email" 
                  name="email" 
                  value={form.email} 
                  onChange={handleInputChange} 
                  placeholder="patient@example.com"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bae6fd' }} 
                />
                <p style={{ fontSize: '0.75rem', color: '#0284c7', margin: '5px 0 0 0' }}>
                  * If provided, the patient will receive an email with instructions to <b>Login via OTP</b> and set their password.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', display: 'block' }}>Age</label>
                  <input type="number" name="age" value={form.age} onChange={handleInputChange} className={styles.inputField} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', display: 'block' }}>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--bg-secondary)', color: 'var(--color-text)' }}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                 <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '5px', display: 'block' }}>Diagnosis</label>
                 <input name="diagnosis" value={form.diagnosis} onChange={handleInputChange} className={styles.inputField} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                style={{ 
                  marginTop: '1rem', padding: '12px', borderRadius: '8px', border: 'none', 
                  background: 'var(--color-primary)', color: 'white', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Adding Patient...' : 'Save & Invite'}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}