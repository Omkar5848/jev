import { useState, useEffect } from 'react';
import DoctorLayout from './DoctorLayout';
import api from '@/utils/api';
import styles from '@/styles/Temp.module.css';
import { 
  FaPlus, FaUserInjured, FaNotesMedical, FaPhone, 
  FaTrash, FaEdit, FaEnvelope, FaClock 
} from 'react-icons/fa';

// --- UPDATED TYPE DEFINITION ---
type Patient = {
  id?: number;
  name: string;
  age: number | string;
  gender: string;
  email: string;
  phone: string;
  diagnosis: string;
  status: 'Active' | 'Recovered' | 'Critical';
  lastVisit: string;
  // New Vitals Fields
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  weight?: number;
  glucose?: number;
  bloodGroup?: string;
  temperature?: number;
};

const emptyForm: Patient = { 
  name: '', 
  age: '', 
  gender: 'Male', 
  phone: '', 
  email: '', 
  diagnosis: '', 
  status: 'Active', 
  lastVisit: new Date().toISOString().split('T')[0],
  // Initialize vitals
  bpSystolic: undefined,
  bpDiastolic: undefined,
  heartRate: undefined,
  weight: undefined,
  glucose: undefined,
  bloodGroup: '-',
  temperature: undefined
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Patient>(emptyForm);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Doctor's Patients
  useEffect(() => { loadPatients(); }, []);

  async function loadPatients() {
    try {
      // Correct endpoint for "My Patients"
      const res = await api.get('/api/doctor-features/patients');
      setPatients(res.data || []);
      setLoading(false);
    } catch (e) { 
      console.error(e); 
      setLoading(false);
    }
  }

  // 2. Handle Create/Update
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        // Update existing patient
        await api.put(`/api/doctor-features/patients/${isEditing}`, form);
        alert('Patient updated successfully');
      } else {
        // Create new patient (Triggers Email + OTP logic if email is present)
        await api.post('/api/doctor-features/patients', form);
        alert('Patient added successfully!' + (form.email ? ' Login instructions sent to email.' : ''));
      }
      setShowModal(false);
      setForm(emptyForm);
      setIsEditing(null);
      loadPatients(); // Reload list
    } catch (e: any) { 
      alert(e.response?.data?.message || 'Failed to save'); 
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete patient record? This cannot be undone.')) return;
    try {
       await api.delete(`/api/doctor-features/patients/${id}`);
       loadPatients();
    } catch(e) { alert('Failed to delete'); }
  }

  return (
    <DoctorLayout>
      <div className={styles.sectionHeader}>
        <div className={styles.headerInfo}>
          <h2>My Patients</h2>
          <p>Manage patient records and medical history</p>
        </div>
        <button className={styles.addHospitalBtn} onClick={() => { setIsEditing(null); setForm(emptyForm); setShowModal(true); }}>
          <FaPlus /> Add Patient
        </button>
      </div>

      {/* --- PATIENT GRID --- */}
      <div className={styles.entityGrid}>
        {loading ? <p style={{padding: 20}}>Loading patients...</p> : patients.map(p => (
          <div key={p.id} className={styles.glassCard} style={{ borderLeft: `4px solid ${p.status === 'Critical' ? 'var(--color-error)' : 'var(--color-primary)'}` }}>
            
            {/* Card Header */}
            <div className={styles.cardTopRow}>
              <div className={styles.avatarBlock}>
                <div className={styles.avatarPill} style={{background: '#f3f4f6', color: '#374151'}}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className={styles.cardTitle}>{p.name}</h3>
                  <div className={styles.listMeta}>{p.gender}, {p.age} Yrs</div>
                </div>
              </div>
              <div className={styles.topActions}>
                  <button className={styles.iconGhostBtn} onClick={() => { setForm(p); setIsEditing(p.id!); setShowModal(true); }}><FaEdit/></button>
                  <button className={styles.iconGhostBtn} style={{color:'var(--color-error)'}} onClick={() => handleDelete(p.id!)}><FaTrash/></button>
              </div>
            </div>

            {/* Status Badge */}
            <div className={styles.statusRow}>
               <span className={`${styles.statusPill} ${p.status === 'Active' ? styles.statusActive : styles.pending}`}>
                 {p.status || 'Active'}
               </span>
            </div>

            {/* Info Details */}
            <div className={styles.infoRow} style={{marginTop: 15, display: 'flex', flexDirection: 'column', gap: '8px'}}>
              
              {/* Show Email if exists */}
              {p.email && p.email !== '-' && (
                <div className={styles.infoItem} style={{ color: 'var(--color-primary)' }}>
                    <FaEnvelope size={12}/> <span>{p.email}</span>
                </div>
              )}

              <div className={styles.infoItem}>
                  <FaPhone size={12}/> <span>{p.phone || 'No Phone'}</span>
              </div>
              
              <div className={styles.infoItem}>
                  <FaUserInjured size={12}/> <span>Dx: <strong>{p.diagnosis || 'N/A'}</strong></span>
              </div>
              
              {/* New: Quick Vitals Preview */}
              {(p.bpSystolic || p.heartRate) && (
                 <div className={styles.infoItem} style={{fontSize:'0.8rem', color:'#666'}}>
                    <FaNotesMedical size={12}/> 
                    <span>
                        {p.bpSystolic ? `BP: ${p.bpSystolic}/${p.bpDiastolic}` : ''}
                        {p.heartRate ? ` • HR: ${p.heartRate}` : ''}
                    </span>
                 </div>
              )}
              
              <div className={styles.infoItem} style={{fontSize: '0.8rem', color:'#9ca3af'}}>
                  <FaClock size={12}/> <span>Last: {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>
          </div>
        ))}
        
        {!loading && patients.length === 0 && (
           <div style={{gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)'}}>
              <p>No patients found. Add a patient to get started.</p>
           </div>
        )}
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.cardTitle}>{isEditing ? 'Edit Patient' : 'Add New Patient'}</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.entityForm}>
              <div className={styles.formGrid}>
                 
                 {/* Name */}
                 <div>
                    <label className={styles.formSectionTitle}>Name *</label>
                    <input className={styles.formInput} value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/>
                 </div>

                 {/* Phone */}
                 <div>
                    <label className={styles.formSectionTitle}>Phone *</label>
                    <input className={styles.formInput} value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required/>
                 </div>

                 {/* EMAIL FIELD WITH NOTE */}
                 <div style={{ gridColumn: 'span 2', background: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                    <label className={styles.formSectionTitle} style={{color: '#0369a1'}}>Email (Enable Portal Access)</label>
                    <input 
                        type="email" 
                        className={styles.formInput} 
                        value={form.email} 
                        onChange={e=>setForm({...form, email:e.target.value})} 
                        placeholder="patient@example.com"
                        style={{borderColor: '#bae6fd'}}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#0284c7', margin: '5px 0 0 0', display:'flex', alignItems:'center', gap:'5px' }}>
                        <FaEnvelope size={10} />
                        Instructions to <b>Login via OTP</b> will be emailed to the patient.
                    </p>
                 </div>

                 {/* Age & Gender */}
                 <div>
                    <label className={styles.formSectionTitle}>Age</label>
                    <input type="number" className={styles.formInput} value={form.age} onChange={e=>setForm({...form, age: e.target.value})} required/>
                 </div>
                 <div>
                    <label className={styles.formSectionTitle}>Gender</label>
                    <select className={styles.formInput} value={form.gender} onChange={e=>setForm({...form, gender:e.target.value})}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                 </div>

                 {/* --- NEW VITALS SECTION --- */}
                 <div style={{ gridColumn: '1 / -1', marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <h4 style={{margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666', textTransform:'uppercase'}}>Vitals & Metrics</h4>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', gridColumn: '1 / -1' }}>
                    <div>
                        <label className={styles.formSectionTitle}>BP (Systolic)</label>
                        <input type="number" className={styles.formInput} placeholder="120" 
                         value={form.bpSystolic || ''} onChange={e=>setForm({...form, bpSystolic: +e.target.value})} />
                    </div>
                    <div>
                        <label className={styles.formSectionTitle}>BP (Diastolic)</label>
                        <input type="number" className={styles.formInput} placeholder="80" 
                         value={form.bpDiastolic || ''} onChange={e=>setForm({...form, bpDiastolic: +e.target.value})} />
                    </div>
                    <div>
                        <label className={styles.formSectionTitle}>Heart Rate</label>
                        <input type="number" className={styles.formInput} placeholder="72" 
                         value={form.heartRate || ''} onChange={e=>setForm({...form, heartRate: +e.target.value})} />
                    </div>
                    <div>
                        <label className={styles.formSectionTitle}>Weight (kg)</label>
                        <input type="number" className={styles.formInput} placeholder="70" 
                         value={form.weight || ''} onChange={e=>setForm({...form, weight: +e.target.value})} />
                    </div>
                    <div>
                        <label className={styles.formSectionTitle}>Glucose</label>
                        <input type="number" className={styles.formInput} placeholder="95" 
                         value={form.glucose || ''} onChange={e=>setForm({...form, glucose: +e.target.value})} />
                    </div>
                    <div>
                        <label className={styles.formSectionTitle}>Blood Group</label>
                        <select className={styles.formInput} value={form.bloodGroup || ''} onChange={e=>setForm({...form, bloodGroup: e.target.value})}>
                            <option value="-">-</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                        </select>
                    </div>
                 </div>

                 {/* Diagnosis */}
                 <div style={{gridColumn:'span 2'}}>
                    <label className={styles.formSectionTitle}>Diagnosis / Notes</label>
                    <input className={styles.formInput} value={form.diagnosis} onChange={e=>setForm({...form, diagnosis:e.target.value})} />
                 </div>
                 
                 {/* Status */}
                 <div>
                    <label className={styles.formSectionTitle}>Status</label>
                    <select className={styles.formInput} value={form.status} onChange={e=>setForm({...form, status:e.target.value as any})}>
                      <option>Active</option><option>Recovered</option><option>Critical</option>
                    </select>
                 </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
}