import { useState, useEffect } from 'react';
import DoctorLayout from './DoctorLayout';
import api from '@/utils/api';
import styles from '@/styles/Temp.module.css';
import { FaEdit, FaCalendarAlt, FaList, FaChevronLeft, FaChevronRight, FaPlus, FaClock, FaUser } from 'react-icons/fa';

export default function AppointmentsPage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null); // Track ID if editing

  // Form State
  const [form, setForm] = useState({
    patientId: '',
    patientName: '',
    email: '', // <--- NEW: Capture Email for auto-login generation
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'Checkup'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [aptRes, patRes] = await Promise.all([
        api.get('/api/appointments'),
        api.get('/api/doctor-features/patients')
      ]);
      setAppointments(aptRes.data);
      setPatients(patRes.data);
    } catch (e) { console.error(e); }
  };

  // --- ACTIONS ---

  // Open Modal for Editing
  const handleEditClick = (apt: any) => {
    setIsEditing(apt.id);
    setForm({
      patientId: apt.patientId || '',
      patientName: apt.patientName || '',
      email: '', // Email usually shouldn't be edited here, or fetch if needed
      date: apt.date,
      time: apt.time,
      type: apt.type || 'Checkup'
    });
    setShowModal(true);
  };

  // Open Modal for Creating
  const handleNewClick = (dateStr?: string) => {
    setIsEditing(null);
    setForm({
      patientId: '',
      patientName: '',
      email: '',
      date: dateStr || new Date().toISOString().split('T')[0],
      time: '09:00',
      type: 'Checkup'
    });
    setShowModal(true);
  };

  // Submit Form (Create OR Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Logic to resolve Patient Name
      let finalName = form.patientName;
      if (form.patientId) {
        const p = patients.find(pt => pt.id === parseInt(form.patientId));
        if (p) finalName = p.name;
      }

      if (isEditing) {
        // --- UPDATE ---
        await api.put(`/api/appointments/${isEditing}`, {
           date: form.date,
           time: form.time,
           type: form.type
        });
        alert('Appointment Updated!');
      } else {
        // --- CREATE ---
        // Pass 'email' so backend can create User & send Temp Password
        await api.post('/api/appointments', { 
            ...form, 
            patientName: finalName 
        });
        alert('Appointment Scheduled! (Patient notified if email provided)');
      }

      setShowModal(false);
      fetchData();
    } catch (e) { 
      console.error(e);
      alert('Operation failed'); 
    }
  };

  // --- CALENDAR LOGIC ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDay };
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const renderCalendar = () => {
    const { daysInMonth, firstDay } = getDaysInMonth(currentDate);
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const allSlots = [...blanks, ...days];
    const currentMonthStr = currentDate.toISOString().slice(0, 7);

    return (
      <div className={styles.sectionCard} style={{ padding: 0, overflow: 'hidden' }}>
        <div className={styles.cardHeader} style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <button onClick={() => changeMonth(-1)} className={styles.iconGhostBtn}><FaChevronLeft /></button>
             <h3 className={styles.cardTitle} style={{ margin: 0 }}>
               {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
             </h3>
             <button onClick={() => changeMonth(1)} className={styles.iconGhostBtn}><FaChevronRight /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ padding: '0.75rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--color-surface)' }}>
          {allSlots.map((day, idx) => {
            if (!day) return <div key={idx} style={{ minHeight: '120px', borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', background: 'var(--bg-secondary)', opacity: 0.5 }} />;
            
            const dayStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
            const dayApts = appointments.filter(a => a.date === dayStr);
            const isToday = new Date().toISOString().split('T')[0] === dayStr;

            return (
              <div key={idx} className="group" style={{ 
                  minHeight: '120px', borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', 
                  padding: '0.5rem', position: 'relative', transition: 'background 0.2s'
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: isToday ? 'var(--color-primary)' : 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                   <span style={isToday ? { background: 'var(--color-primary)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}>{day}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {dayApts.slice(0, 3).map(apt => (
                    <div 
                      key={apt.id} 
                      onClick={(e) => { e.stopPropagation(); handleEditClick(apt); }} // CLICK TO EDIT
                      style={{ 
                        fontSize: '0.75rem', background: 'var(--color-secondary)', color: 'var(--color-primary)', 
                        padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', 
                        textOverflow: 'ellipsis', fontWeight: 500, cursor: 'pointer' 
                    }} title={`Edit ${apt.patientName}`}>
                      {apt.time} {apt.patientName}
                    </div>
                  ))}
                  {dayApts.length > 3 && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', paddingLeft: '4px' }}>+{dayApts.length - 3} more</div>}
                </div>

                <button 
                  onClick={() => handleNewClick(dayStr)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', 
                    width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                >
                  <FaPlus size={10} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <DoctorLayout>
      <div className={styles.overviewSection}>
        
        <div className={styles.pageHeader} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1>Schedule Manager</h1>
            <p>Organize patient visits and availability</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', display: 'flex' }}>
              <button onClick={() => setViewMode('calendar')} style={{ /* ... styles ... */ padding: '6px 12px', background: viewMode === 'calendar' ? 'var(--color-surface)' : 'transparent' }}>
                <FaCalendarAlt /> Calendar
              </button>
              <button onClick={() => setViewMode('list')} style={{ /* ... styles ... */ padding: '6px 12px', background: viewMode === 'list' ? 'var(--color-surface)' : 'transparent' }}>
                <FaList /> List
              </button>
            </div>
            
            <button className={styles.btnPrimary} onClick={() => handleNewClick()}>
              <FaPlus /> New Appointment
            </button>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
            {viewMode === 'calendar' ? renderCalendar() : (
            <div className={styles.sectionCard}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>Upcoming Appointments</h3>
                </div>
                <div className={styles.list}>
                {appointments.map(a => (
                    <div key={a.id} className={styles.listRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '8px', minWidth: '80px', textAlign: 'center' }}>
                                <div style={{ fontWeight: 'bold' }}>{a.time}</div>
                                <div style={{ fontSize: '0.8rem' }}>{a.date}</div>
                            </div>
                            <div>
                                <div className={styles.listTitle}>{a.patientName}</div>
                                <div className={styles.listMeta}>{a.type} • {a.status}</div>
                            </div>
                        </div>
                        {/* Edit Button */}
                        <button onClick={() => handleEditClick(a)} className={styles.iconGhostBtn}><FaEdit /></button>
                    </div>
                ))}
                </div>
            </div>
            )}
        </div>

        {/* MODAL */}
        {showModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
               <div className={styles.modalHeader}>
                 <h3 className={styles.cardTitle}>{isEditing ? 'Edit Appointment' : 'Schedule Visit'}</h3>
                 <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
               </div>
               
               <form onSubmit={handleSubmit} className={styles.entityForm}>
                  <div className={styles.formGrid}>
                    
                    {/* Only show Patient selection if NOT editing (changing patient usually requires re-booking) */}
                    {!isEditing && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className={styles.formSectionTitle}>Patient</label>
                            <select 
                            className={styles.formInput}
                            value={form.patientId}
                            onChange={e => setForm({...form, patientId: e.target.value})}
                            >
                            <option value="">-- New / Unregistered --</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    )}
                    
                    {/* If New Patient, show Name AND Email inputs */}
                    {!isEditing && !form.patientId && (
                        <>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className={styles.formSectionTitle}>Patient Name</label>
                                <input 
                                    className={styles.formInput}
                                    value={form.patientName} 
                                    onChange={e => setForm({...form, patientName: e.target.value})}
                                    required={!form.patientId}
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className={styles.formSectionTitle}>
                                    Patient Email <span style={{fontSize:'0.8em', color:'var(--color-primary)'}}>(For Login)</span>
                                </label>
                                <input 
                                    type="email"
                                    className={styles.formInput}
                                    value={form.email} 
                                    onChange={e => setForm({...form, email: e.target.value})}
                                    placeholder="e.g. patient@example.com"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className={styles.formSectionTitle}>Date</label>
                        <input type="date" className={styles.formInput} value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                    </div>
                    <div>
                        <label className={styles.formSectionTitle}>Time</label>
                        <input type="time" className={styles.formInput} value={form.time} onChange={e => setForm({...form, time: e.target.value})} required />
                    </div>
                    
                    <div style={{ gridColumn: '1 / -1' }}>
                         <label className={styles.formSectionTitle}>Type</label>
                         <select className={styles.formInput} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                            <option>Checkup</option>
                            <option>Follow-up</option>
                            <option>Consultation</option>
                            <option>Emergency</option>
                         </select>
                    </div>
                  </div>

                  <div className={styles.modalActions}>
                     <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                     <button className={styles.submitBtn}>{isEditing ? 'Update' : 'Confirm'}</button>
                  </div>
               </form>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}