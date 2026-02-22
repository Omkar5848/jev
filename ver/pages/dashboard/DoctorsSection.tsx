import React, { useState, useEffect, useMemo } from 'react';
import api from '@/utils/api';
import styles from '@/styles/Temp.module.css';
import { 
  FaPlus, FaEdit, FaTrash, FaUserMd, FaStethoscope, 
  FaEnvelope, FaStar, FaSearch, FaSync, FaDownload, FaPhone, FaMapMarkerAlt 
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// --- TYPES ---
type Doctor = {
  id?: number | string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  hospital?: string;
  rating?: number;
  available?: boolean;
  avatarUrl?: string;
};

export default function DoctorsSection() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Modal & Form States
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState<Doctor>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: '',
    hospital: '',
    rating: undefined,
    available: true
  });

  // --- 1. DATA FETCHING (Self-Contained & Auto-Refresh) ---
  async function fetchDoctors(isBackground = false) {
    if (!isBackground) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await api.get('/api/doctors', { headers });
      
      const data: Doctor[] = (res.data || []).map((d: any) => ({
        id: d.id ?? d.doctorId ?? d._id,
        firstName: d.firstName ?? d.name ?? '',
        lastName: d.lastName ?? '',
        email: d.email ?? '',
        phone: d.phone ?? '',
        specialization: d.specialization ?? d.speciality ?? '',
        hospital: d.hospital ?? d.hospitalName ?? '',
        rating: typeof d.rating === 'number' ? d.rating : undefined,
        available: typeof d.available === 'boolean' ? d.available : d.availabilityStatus === 'available'
      }));

      setDoctors(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to sync doctors');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }

  useEffect(() => {
    fetchDoctors();
    const interval = setInterval(() => fetchDoctors(true), 30000); // 30s Poll
    return () => clearInterval(interval);
  }, []);

  // --- 2. FILTERING ---
  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    return doctors.filter(d => 
      (d.firstName && d.firstName.toLowerCase().includes(term)) ||
      (d.lastName && d.lastName.toLowerCase().includes(term)) ||
      (d.specialization && d.specialization.toLowerCase().includes(term)) ||
      (d.hospital && d.hospital.toLowerCase().includes(term))
    );
  }, [doctors, query]);

  // --- 3. ACTIONS ---
  function handleAdd() {
    setEditingId(null);
    setForm({ firstName: '', lastName: '', email: '', phone: '', specialization: '', hospital: '', rating: undefined, available: true });
    setShowForm(true);
  }

  function handleEdit(d: Doctor) {
    setEditingId(d.id || null);
    setForm({ ...d });
    setShowForm(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'rating' ? Number(value) : value)
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      if (editingId) {
        await api.put(`/api/doctors/${editingId}`, form, { headers });
      } else {
        await api.post('/api/doctors', form, { headers });
      }
      setShowForm(false);
      await fetchDoctors(true);
    } catch (e) {
      alert('Operation failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id?: number | string) {
    if (!id || !confirm('Are you sure you want to delete this doctor?')) return;
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    try {
      await api.delete(`/api/doctors/${id}`, { headers });
      setDoctors(prev => prev.filter(d => d.id !== id));
      await fetchDoctors(true);
    } catch (e) {
      alert('Delete failed');
    }
  }

  function downloadExcel() {
    const rows = filtered.map(d => ({
        ID: d.id, Name: `${d.firstName} ${d.lastName||''}`, Email: d.email, 
        Spec: d.specialization, Hospital: d.hospital, Status: d.available ? 'Active' : 'Offline'
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Doctors');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'Doctors_List.xlsx');
  }

  return (
    <div className={styles.sectionCard} style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
      
      {/* --- UNIFIED HEADER --- */}
      <div className={styles.sectionCard} style={{ marginBottom: '1.5rem' }}>
        <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className={styles.cardTitle}>Medical Professionals</h3>
                <button onClick={() => fetchDoctors(false)} className={styles.iconGhostBtn} title="Force Sync">
                   <FaSync className={loading ? 'animate-spin' : ''} style={{fontSize:'0.8rem'}} />
                </button>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              {filtered.length} doctors • Last updated {lastUpdated.toLocaleTimeString()}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                  <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input 
                      value={query} onChange={e => setQuery(e.target.value)}
                      placeholder="Search doctors..."
                      style={{ padding: '8px 10px 8px 30px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', background: 'var(--bg-secondary)', color: 'var(--color-text)' }}
                  />
              </div>
              <button onClick={downloadExcel} className={styles.iconGhostBtn} title="Download Excel"><FaDownload /></button>
              <button className={styles.btnPrimary} onClick={handleAdd}>
                <FaPlus /> Add Doctor
              </button>
          </div>
        </div>
      </div>

      {/* --- CARD GRID (The Look You Wanted) --- */}
      {loading && doctors.length === 0 ? (
         <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading professionals...</div>
      ) : filtered.length === 0 ? (
         <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No doctors found.</div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {filtered.map((d) => (
            <div key={d.id} className={styles.sectionCard} style={{ 
              position: 'relative', overflow: 'hidden', padding: '1.5rem',
              display: 'flex', flexDirection: 'column', gap: '1rem',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              
              {/* Card Top: Avatar & Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: '56px', height: '56px', borderRadius: '50%', 
                  background: 'var(--bg-secondary)', color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
                }}>
                  {d.avatarUrl ? <img src={d.avatarUrl} style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} /> : <FaUserMd />}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                   <button onClick={() => handleEdit(d)} className={styles.iconGhostBtn}><FaEdit size={14}/></button>
                   <button onClick={() => handleDelete(d.id)} className={styles.iconGhostBtn} style={{ color: 'var(--color-error)' }}><FaTrash size={14}/></button>
                </div>
              </div>

              {/* Card Body: Info */}
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  Dr. {d.firstName} {d.lastName}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: 'var(--color-primary)', fontWeight: 500, fontSize: '0.9rem' }}>
                  <FaStethoscope size={12} /> {d.specialization || 'General'}
                </div>
              </div>

              {/* Details List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                {d.hospital && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaMapMarkerAlt size={12} /> {d.hospital}
                  </div>
                )}
                {d.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaEnvelope size={12} /> {d.email}
                  </div>
                )}
                {d.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaPhone size={12} /> {d.phone}
                  </div>
                )}
              </div>

              {/* Card Footer: Status & Rating */}
              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span className={d.available ? styles.statusActive : styles.pending} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px' }}>
                    {d.available ? 'Available' : 'Unavailable'}
                 </span>
                 {d.rating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '0.9rem', fontWeight: 600 }}>
                       <FaStar size={12} /> {d.rating}
                    </div>
                 )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* --- FORM MODAL (Consistent Style) --- */}
      {showForm && (
        <div className={styles.modalOverlay}>
           <div className={styles.modalCard}>
              <div className={styles.modalHeader}>
                 <h3>{editingId ? 'Edit Doctor Profile' : 'Add New Doctor'}</h3>
                 <button className={styles.closeBtn} onClick={() => setShowForm(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit} className={styles.entityForm}>
                 <div className={styles.formGrid}>
                    <div>
                       <label className={styles.formSectionTitle}>First Name</label>
                       <input className={styles.formInput} name="firstName" value={form.firstName} onChange={handleChange} required />
                    </div>
                    <div>
                       <label className={styles.formSectionTitle}>Last Name</label>
                       <input className={styles.formInput} name="lastName" value={form.lastName || ''} onChange={handleChange} />
                    </div>
                    <div>
                       <label className={styles.formSectionTitle}>Specialization</label>
                       <input className={styles.formInput} name="specialization" value={form.specialization || ''} onChange={handleChange} />
                    </div>
                    <div>
                       <label className={styles.formSectionTitle}>Email</label>
                       <input className={styles.formInput} type="email" name="email" value={form.email || ''} onChange={handleChange} required />
                    </div>
                    <div>
                       <label className={styles.formSectionTitle}>Hospital / Clinic</label>
                       <input className={styles.formInput} name="hospital" value={form.hospital || ''} onChange={handleChange} />
                    </div>
                    <div>
                       <label className={styles.formSectionTitle}>Contact Phone</label>
                       <input className={styles.formInput} name="phone" value={form.phone || ''} onChange={handleChange} />
                    </div>
                    <div style={{gridColumn:'1/-1', display:'flex', gap:'10px', alignItems:'center', background:'var(--bg-secondary)', padding:'10px', borderRadius:'8px'}}>
                        <input type="checkbox" name="available" checked={!!form.available} onChange={handleChange} style={{width:'18px', height:'18px'}} />
                        <label style={{cursor:'pointer', fontWeight:500}}>Mark as Available for Appointments</label>
                    </div>
                 </div>
                 <div className={styles.modalActions}>
                    <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                    <button className={styles.submitBtn}>{saving ? 'Saving...' : 'Save Doctor'}</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}