import { useState, useEffect } from 'react';
import DoctorLayout from './DoctorLayout';
import api from '@/utils/api';
import styles from '@/styles/Dashboard.module.css';
import { FaPlus, FaUserInjured, FaNotesMedical, FaPhone, FaTrash, FaEdit } from 'react-icons/fa';

type Patient = {
  id?: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  diagnosis: string;
  status: 'Active' | 'Recovered' | 'Critical';
  lastVisit: string;
};

const emptyForm: Patient = { 
  name: '', age: 0, gender: 'Male', phone: '', 
  diagnosis: '', status: 'Active', 
  lastVisit: new Date().toISOString().split('T')[0] 
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Patient>(emptyForm);
  const [isEditing, setIsEditing] = useState<number | null>(null);

  useEffect(() => { loadPatients(); }, []);

  async function loadPatients() {
    try {
      const res = await api.get('/api/doctor-features/patients');
      setPatients(res.data);
    } catch (e) { console.error(e); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/api/doctor-features/patients/${isEditing}`, form);
      } else {
        await api.post('/api/doctor-features/patients', form);
      }
      setShowModal(false);
      setForm(emptyForm);
      setIsEditing(null);
      loadPatients();
    } catch (e) { alert('Failed to save'); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete patient record?')) return;
    await api.delete(`/api/doctor-features/patients/${id}`);
    loadPatients();
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

      <div className={styles.entityGrid}>
        {patients.map(p => (
          <div key={p.id} className={styles.glassCard}>
            <div className={styles.cardTopRow}>
              <div className={styles.avatarBlock}>
                <div className={styles.avatarPill} style={{background: p.status === 'Critical' ? 'var(--color-error)' : 'var(--color-primary)'}}>
                  {p.name.charAt(0)}
                </div>
                <div>
                  <h3 className={styles.cardTitle}>{p.name}</h3>
                  <div className={styles.listMeta}>{p.age} Yrs • {p.gender}</div>
                </div>
              </div>
              <div className={styles.topActions}>
                 <button className={styles.iconGhostBtn} onClick={() => { setForm(p); setIsEditing(p.id!); setShowModal(true); }}><FaEdit/></button>
                 <button className={styles.iconGhostBtn} style={{color:'var(--color-error)'}} onClick={() => handleDelete(p.id!)}><FaTrash/></button>
              </div>
            </div>

            <div className={styles.statusRow}>
               <span className={`${styles.statusPill} ${p.status === 'Active' ? styles.statusActive : styles.pending}`}>
                 {p.status}
               </span>
            </div>

            <div className={styles.infoRow} style={{marginTop: 15}}>
              <div className={styles.infoItem}><FaUserInjured/> <span>Dx: <strong>{p.diagnosis || 'N/A'}</strong></span></div>
              <div className={styles.infoItem}><FaPhone/> <span>{p.phone || 'No Phone'}</span></div>
              <div className={styles.infoItem}><FaNotesMedical/> <span>Last: {p.lastVisit}</span></div>
            </div>
          </div>
        ))}
        {patients.length === 0 && <p style={{color:'var(--color-text-secondary)'}}>No patients found. Add one to get started.</p>}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.cardTitle}>{isEditing ? 'Edit Patient' : 'New Patient'}</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.entityForm}>
              <div className={styles.formGrid}>
                 <div><label className={styles.formSectionTitle}>Name</label><input className={styles.formInput} value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/></div>
                 <div><label className={styles.formSectionTitle}>Age</label><input type="number" className={styles.formInput} value={form.age} onChange={e=>setForm({...form, age: +e.target.value})} required/></div>
                 <div><label className={styles.formSectionTitle}>Gender</label>
                   <select className={styles.formInput} value={form.gender} onChange={e=>setForm({...form, gender:e.target.value})}>
                     <option>Male</option><option>Female</option><option>Other</option>
                   </select>
                 </div>
                 <div><label className={styles.formSectionTitle}>Phone</label><input className={styles.formInput} value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} /></div>
                 <div style={{gridColumn:'span 2'}}><label className={styles.formSectionTitle}>Diagnosis</label><input className={styles.formInput} value={form.diagnosis} onChange={e=>setForm({...form, diagnosis:e.target.value})} /></div>
                 <div><label className={styles.formSectionTitle}>Status</label>
                   <select className={styles.formInput} value={form.status} onChange={e=>setForm({...form, status:e.target.value as any})}>
                     <option>Active</option><option>Recovered</option><option>Critical</option>
                   </select>
                 </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button className={styles.submitBtn}>Save Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
}