import { useState, useEffect } from 'react';
import DoctorLayout from './DoctorLayout';
import api from '@/utils/api';
import styles from '@/styles/dashboard.module.css';
import { FaCalendarPlus, FaClock, FaUser, FaTrash, FaClipboardList } from 'react-icons/fa';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

type Appointment = {
  id?: number;
  patientName: string;
  date: string;
  time: string;
  type: string;
  status: string;
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [date, setDate] = useState<any>(new Date());
  const [form, setForm] = useState({ patientName: '', date: '', time: '', type: 'Checkup' });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { loadApps(); }, []);

  async function loadApps() {
    try {
      const res = await api.get('/api/doctor-features/appointments');
      setAppointments(res.data);
    } catch(e) {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/doctor-features/appointments', form);
      setShowModal(false);
      setForm({ patientName: '', date: '', time: '', type: 'Checkup' });
      loadApps();
    } catch(e) { alert('Error creating appointment'); }
  }

  async function handleDelete(id: number) {
    if(!confirm('Cancel this appointment?')) return;
    await api.delete(`/api/doctor-features/appointments/${id}`);
    loadApps();
  }

  // --- TIMEZONE FIX HERE ---
  const formatDate = (d: Date) => {
    // Manually construct YYYY-MM-DD using local time methods
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const selectedDateStr = formatDate(date instanceof Date ? date : new Date());

  const todaysApps = appointments
    .filter(a => a.date === selectedDateStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const hasAppointment = (d: Date) => {
    const s = formatDate(d);
    return appointments.some(a => a.date === s);
  };

  return (
    <DoctorLayout>
      <div className={styles.sectionHeader}>
        <div className={styles.headerInfo}>
          <h2>Schedule & Calendar</h2>
          <p>Manage patient visits and availability</p>
        </div>
        <button 
          className={styles.addHospitalBtn} 
          onClick={() => {
            setForm({ ...form, date: selectedDateStr });
            setShowModal(true);
          }}
        >
          <FaCalendarPlus /> Add Appointment
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* LEFT: CALENDAR */}
        <div>
          <h3 className={styles.cardTitle} style={{ marginBottom: '1rem' }}>Select Date</h3>
          <div className={`${styles.calendarWrapper} custom-calendar-root`}>
            <Calendar 
              onChange={setDate} 
              value={date}
              className="react-calendar"
              tileContent={({ date, view }) => 
                view === 'month' && hasAppointment(date) ? (
                  <div className={styles.dotContainer}><div className={styles.dot}></div></div>
                ) : null
              }
            />
          </div>
        </div>

        {/* RIGHT: LIST */}
        <div>
           <h3 className={styles.cardTitle} style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
             {/* Note: This might parse as 00:00 local time, which is correct */}
             <span>Appointments for {new Date(selectedDateStr).toDateString()}</span>
             <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{todaysApps.length} Total</span>
           </h3>

           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {todaysApps.length === 0 ? (
               <div className={styles.glassCard} style={{ textAlign: 'center', padding: '3rem 1rem', opacity: 0.7 }}>
                 <FaClipboardList size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                 <p>No appointments scheduled for this date.</p>
                 <button 
                    className={styles.link} 
                    style={{ background: 'none', border: 'none', marginTop: '0.5rem', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 'bold' }}
                    onClick={() => { setForm({ ...form, date: selectedDateStr }); setShowModal(true); }}
                 >
                   + Schedule One
                 </button>
               </div>
             ) : (
               todaysApps.map(app => (
                <div key={app.id} className={styles.glassCard} style={{ borderLeft: '5px solid var(--color-primary)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ background: 'var(--color-secondary)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' }}>
                      {app.time}
                    </div>
                    <button onClick={() => handleDelete(app.id!)} style={{ color: 'var(--color-error)', border: 'none', background: 'none', cursor: 'pointer' }} title="Cancel">
                      <FaTrash />
                    </button>
                  </div>
                  
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', marginTop: '5px' }}>
                    {app.patientName}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '15px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FaUser size={12}/> Patient</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FaClock size={12}/> {app.type}</span>
                  </div>
                </div>
               ))
             )}
           </div>
        </div>

      </div>

      {/* MODAL */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
             <div className={styles.modalHeader}>
              <h3>New Appointment</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.entityForm}>
              <label className={styles.formSectionTitle}>Patient Name</label>
              <input className={styles.formInput} value={form.patientName} onChange={e => setForm({...form, patientName: e.target.value})} required placeholder="e.g. John Doe" />
              
              <div style={{display:'flex', gap:'1rem'}}>
                <div style={{flex:1}}>
                  <label className={styles.formSectionTitle}>Date</label>
                  <input type="date" className={styles.formInput} value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                </div>
                <div style={{flex:1}}>
                  <label className={styles.formSectionTitle}>Time</label>
                  <input type="time" className={styles.formInput} value={form.time} onChange={e => setForm({...form, time: e.target.value})} required />
                </div>
              </div>

              <label className={styles.formSectionTitle}>Type</label>
              <select className={styles.formInput} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option>Checkup</option>
                <option>Surgery</option>
                <option>Consultation</option>
                <option>Follow-up</option>
                <option>Emergency</option>
              </select>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button className={styles.submitBtn}>Confirm Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
}