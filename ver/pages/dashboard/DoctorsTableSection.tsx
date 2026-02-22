import React, { useEffect, useMemo, useState } from 'react';
import api from '@/utils/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import styles from '@/styles/Temp.module.css';
import { 
  FaArrowLeft, FaSearch, FaUserMd, FaStethoscope, FaEnvelope, 
  FaStar, FaPlus, FaEdit, FaTrash, FaEye, FaDownload, FaSync 
} from 'react-icons/fa';

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

type Props = { 
  onBack?: () => void; 
  // Optional: Callback to tell parent dashboard to refresh stats
  onDataChange?: () => void; 
};

function authHeaders() {
  if (typeof window === 'undefined') return {};
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function DoctorsTableSection({ onBack, onDataChange }: Props) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [query, setQuery] = useState('');
  
  // Two loading states: one for initial load (shows spinner), one for background (silent)
  const [isLoading, setIsLoading] = useState(true); 
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // --- MODAL STATES ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [viewDoctor, setViewDoctor] = useState<Doctor | null>(null);
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);

  // Form State
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
  const [isSaving, setIsSaving] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 5;

  // --- CORE DATA FETCHING ---
  async function fetchDoctors(isBackground = false) {
    if (!isBackground) setIsLoading(true);
    
    try {
      const res = await api.get('/api/doctors', { headers: authHeaders() });
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
    } catch (e: any) {
      console.error('Failed to sync doctors');
    } finally { 
      if (!isBackground) setIsLoading(false); 
    }
  }

  // --- AUTO REFRESH LOGIC ---
  useEffect(() => {
    // 1. Initial Load
    fetchDoctors(); 

    // 2. Poll every 30 seconds (Silent Refresh)
    const interval = setInterval(() => {
      fetchDoctors(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // --- FILTERING ---
  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return doctors;
    return doctors.filter((d: Doctor) =>
      `${d.firstName} ${d.lastName ?? ''} ${d.email ?? ''} ${d.specialization ?? ''} ${d.hospital ?? ''}`
        .toLowerCase()
        .includes(s)
    );
  }, [doctors, query]);

  // --- PAGINATION ---
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const firstIndex = (page - 1) * perPage;
  const current = filtered.slice(firstIndex, firstIndex + perPage);

  function prev() { if (page > 1) setPage(p => p - 1); }
  function next() { if (page < totalPages) setPage(p => p + 1); }

  // --- ACTIONS (With Auto-Refresh) ---

  function resetForm() {
    setForm({
      firstName: '', lastName: '', email: '', phone: '',
      specialization: '', hospital: '', rating: undefined, available: true
    });
  }

  function handleAddClick() {
    resetForm();
    setShowAddModal(true);
  }

  function handleEditClick(d: Doctor) {
    setEditDoctor(d);
    setForm({ ...d });
    setShowEditModal(true);
  }

  function handleViewClick(d: Doctor) {
    setViewDoctor(d);
    setShowViewModal(true);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'rating') {
      setForm(prev => ({ ...prev, rating: value === '' ? undefined : Number(value) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  // CREATE
  async function onCreate(e: React.FormEvent) {
    e.preventDefault(); 
    setIsSaving(true);
    try {
      await api.post('/api/doctors', form, { headers: authHeaders() });
      setShowAddModal(false);
      // REFRESH IMMEDIATELY
      await fetchDoctors(true); 
      if (onDataChange) onDataChange(); 
    } catch (e) { alert('Failed to create'); } 
    finally { setIsSaving(false); }
  }

  // UPDATE
  async function onUpdate(e: React.FormEvent) {
    e.preventDefault(); 
    if (!editDoctor?.id) return;
    setIsSaving(true);
    try {
      await api.put(`/api/doctors/${editDoctor.id}`, form, { headers: authHeaders() });
      setShowEditModal(false);
      // REFRESH IMMEDIATELY
      await fetchDoctors(true);
      if (onDataChange) onDataChange();
    } catch (e) { alert('Failed to update'); } 
    finally { setIsSaving(false); }
  }

  // DELETE
  async function onDelete(id?: number | string) {
    if (!id || !confirm('Delete this doctor?')) return;
    try {
      await api.delete(`/api/doctors/${id}`, { headers: authHeaders() });
      // OPTIMISTIC UPDATE (Remove immediately from UI for speed)
      setDoctors(prev => prev.filter(d => d.id !== id));
      // THEN SYNC
      await fetchDoctors(true);
      if (onDataChange) onDataChange();
    } catch (e) { alert('Failed to delete'); }
  }

  // --- EXPORT ---
  function downloadExcel() {
    const rows = filtered.map((d: Doctor) => ({
      ID: d.id, Name: `${d.firstName} ${d.lastName||''}`, Email: d.email, 
      Spec: d.specialization, Hospital: d.hospital, Status: d.available ? 'Active' : 'Offline'
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Doctors');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'Doctors.xlsx');
  }

  return (
    <div className={styles.sectionCard}>
      {/* HEADER */}
      <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap:'wrap', gap:'1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onBack && (
            <button onClick={onBack} className={styles.iconGhostBtn} style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '8px' }}>
              <FaArrowLeft />
            </button>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className={styles.cardTitle}>Medical Directory</h3>
                {/* Manual Refresh Button */}
                <button onClick={() => fetchDoctors(false)} className={styles.iconGhostBtn} title="Force Refresh">
                   <FaSync className={isLoading ? 'animate-spin' : ''} style={{fontSize:'0.8rem'}} />
                </button>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              {filtered.length} professionals found • Last updated {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
                <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input 
                    value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}
                    placeholder="Search..."
                    style={{ padding: '8px 10px 8px 30px', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', background: 'var(--bg-secondary)', color: 'var(--color-text)' }}
                />
            </div>
            <button onClick={downloadExcel} className={styles.iconGhostBtn} title="Download"><FaDownload /></button>
            <button onClick={handleAddClick} className={styles.btnPrimary}>
                <FaPlus /> Add Doctor
            </button>
        </div>
      </div>

      {/* TABLE */}
      <div className={styles.list}>
        {isLoading ? <div style={{padding:'2rem', textAlign:'center'}}>Loading...</div> : 
         filtered.length === 0 ? <div style={{padding:'2rem', textAlign:'center', color:'gray'}}>No results.</div> :
         (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '1rem' }}>Name</th>
                        <th style={{ padding: '1rem' }}>Contact</th>
                        <th style={{ padding: '1rem' }}>Specialization</th>
                        <th style={{ padding: '1rem' }}>Status</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {current.map((d) => (
                        <tr key={d.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                        <FaUserMd />
                                    </div>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Dr. {d.firstName} {d.lastName}</span>
                                </div>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                <div>{d.email}</div>
                                <div style={{ fontSize: '0.8rem' }}>{d.phone}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                                <span style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>
                                    {d.specialization || 'General'}
                                </span>
                                {d.hospital && <div style={{fontSize:'0.75rem', marginTop:'2px'}}>@ {d.hospital}</div>}
                            </td>
                            <td style={{ padding: '1rem' }}>
                                <span className={d.available ? styles.statusActive : styles.pending} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px' }}>
                                    {d.available ? 'Active' : 'Offline'}
                                </span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button onClick={() => handleViewClick(d)} className={styles.iconGhostBtn}><FaEye /></button>
                                    <button onClick={() => handleEditClick(d)} className={styles.iconGhostBtn}><FaEdit /></button>
                                    <button onClick={() => onDelete(d.id)} className={styles.iconGhostBtn} style={{ color: 'var(--color-error)' }}><FaTrash /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         )
        }
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
         <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '1rem' }}>
            <button onClick={prev} disabled={page === 1} className={styles.iconGhostBtn}>Prev</button>
            <span style={{ alignSelf: 'center', fontSize: '0.9rem' }}>{page} / {totalPages}</span>
            <button onClick={next} disabled={page === totalPages} className={styles.iconGhostBtn}>Next</button>
         </div>
      )}

      {/* --- ADD MODAL --- */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.cardTitle}>Add New Doctor</h3>
                    <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
                </div>
                <form onSubmit={onCreate} className={styles.entityForm}>
                    <FormGrid form={form} onChange={onChange} />
                    <div className={styles.modalActions}>
                        <button type="button" onClick={() => setShowAddModal(false)} className={styles.cancelBtn}>Cancel</button>
                        <button className={styles.submitBtn}>{isSaving ? 'Saving...' : 'Create Profile'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {showEditModal && (
        <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.cardTitle}>Edit Doctor</h3>
                    <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>×</button>
                </div>
                <form onSubmit={onUpdate} className={styles.entityForm}>
                    <FormGrid form={form} onChange={onChange} />
                    <div className={styles.modalActions}>
                        <button type="button" onClick={() => setShowEditModal(false)} className={styles.cancelBtn}>Cancel</button>
                        <button className={styles.submitBtn}>{isSaving ? 'Saving...' : 'Update Profile'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- VIEW MODAL --- */}
      {showViewModal && viewDoctor && (
        <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.cardTitle}>Doctor Details</h3>
                    <button className={styles.closeBtn} onClick={() => setShowViewModal(false)}>×</button>
                </div>
                <div style={{ padding: '1rem' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                        <div>
                            <label className={styles.formSectionTitle}>Name</label>
                            <p>Dr. {viewDoctor.firstName} {viewDoctor.lastName}</p>
                        </div>
                        <div>
                            <label className={styles.formSectionTitle}>Specialization</label>
                            <p>{viewDoctor.specialization}</p>
                        </div>
                        <div>
                            <label className={styles.formSectionTitle}>Contact</label>
                            <p>{viewDoctor.email}</p>
                            <p>{viewDoctor.phone}</p>
                        </div>
                        <div>
                            <label className={styles.formSectionTitle}>Status</label>
                            <p>{viewDoctor.available ? 'Available' : 'Unavailable'}</p>
                        </div>
                    </div>
                </div>
                <div className={styles.modalActions}>
                    <button onClick={() => setShowViewModal(false)} className={styles.btnPrimary}>Close</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- HELPER COMPONENT FOR FORM FIELDS ---
function FormGrid({ form, onChange }: { form: Doctor; onChange: (e: any) => void }) {
    return (
        <div className={styles.formGrid}>
            <div>
                <label className={styles.formSectionTitle}>First Name</label>
                <input className={styles.formInput} name="firstName" value={form.firstName} onChange={onChange} required />
            </div>
            <div>
                <label className={styles.formSectionTitle}>Last Name</label>
                <input className={styles.formInput} name="lastName" value={form.lastName || ''} onChange={onChange} />
            </div>
            <div>
                <label className={styles.formSectionTitle}>Email</label>
                <input className={styles.formInput} name="email" type="email" value={form.email || ''} onChange={onChange} />
            </div>
            <div>
                <label className={styles.formSectionTitle}>Phone</label>
                <input className={styles.formInput} name="phone" value={form.phone || ''} onChange={onChange} />
            </div>
            <div>
                <label className={styles.formSectionTitle}>Specialization</label>
                <input className={styles.formInput} name="specialization" value={form.specialization || ''} onChange={onChange} />
            </div>
            <div>
                <label className={styles.formSectionTitle}>Hospital</label>
                <input className={styles.formInput} name="hospital" value={form.hospital || ''} onChange={onChange} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" name="available" checked={!!form.available} onChange={onChange} style={{ width: '18px', height: '18px' }} />
                    <span style={{ color: 'var(--color-text)' }}>Available for Appointments</span>
                </label>
            </div>
        </div>
    );
}