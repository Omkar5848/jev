import { useRouter } from 'next/router';
import useSWR from 'swr';
import DoctorLayout from './DoctorLayout';
import styles from '@/styles/Temp.module.css';
import { FaUserInjured, FaCalendarCheck, FaCommentDots } from 'react-icons/fa';
import api from '@/utils/api';

// 1. Define the shape your UI expects
type OverviewData = {
  patientsCount: number;
  appointmentsCount: number;
  unreadMessages: number;
  todayAppointments: Array<{ 
    id: number; 
    time: string; 
    patientName: string; 
    type: string 
  }>;
};

// 2. Fetch from the NEW API but transform it to match your OLD design
const fetcher = async () => {
  const res = await api.get('/api/users/stats');
  const { stats, appointments } = res.data;

  // Extract counts from the generic stats array
  const patientStat = stats.find((s: any) => s.label === 'My Patients');
  
  // Return data in the exact format your design needs
  return {
    patientsCount: patientStat ? patientStat.value : 0,
    appointmentsCount: appointments.length, // Real count from the list
    unreadMessages: 0, // (Backend update needed for real message count)
    todayAppointments: appointments
  };
};

export default function DoctorOverview() {
  const router = useRouter();
  // refreshInterval keeps data live
  const { data, error } = useSWR<OverviewData>('doctor-stats-real', fetcher, { refreshInterval: 5000 });
  
  const loading = !data && !error;
  const go = (path: string) => router.push(path);

  return (
    <DoctorLayout>
      <div className={styles.overviewSection}>
        <div className={styles.pageHeader}>
          <h1>Doctor Dashboard</h1>
          <p>Overview of your day</p>
        </div>

        {/* --- STATS GRID (YOUR ORIGINAL DESIGN) --- */}
        <div className={styles.statsGrid}>
          
          {/* Patients */}
          <button className={styles.statCard} onClick={() => go('/doctor/patients')}>
            <div className={styles.statHeader}>
              <div className={styles.statIcon} style={{ background: '#dbeafe', color: '#2563eb' }}>
                <FaUserInjured />
              </div>
            </div>
            <div className={styles.statValue}>{loading ? '-' : data?.patientsCount || 0}</div>
            <div className={styles.statLabel}>Total Patients</div>
          </button>

          {/* Schedule */}
          <button className={styles.statCard} onClick={() => go('/doctor/appointments')}>
            <div className={styles.statHeader}>
              <div className={styles.statIcon} style={{ background: '#d1fae5', color: '#059669' }}>
                <FaCalendarCheck />
              </div>
            </div>
            <div className={styles.statValue}>{loading ? '-' : data?.appointmentsCount || 0}</div>
            <div className={styles.statLabel}>Appointments Today</div>
          </button>

          {/* Messages */}
          <button className={styles.statCard} onClick={() => go('/doctor/messages')} style={{position:'relative'}}>
            <div className={styles.statHeader}>
              <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
                <FaCommentDots />
              </div>
              
              {/* BADGE LOGIC */}
              {data?.unreadMessages && data.unreadMessages > 0 ? (
                <span style={{
                  background: 'var(--color-error)',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  position: 'absolute',
                  top: '15px', right: '15px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}>
                  {data.unreadMessages} NEW
                </span>
              ) : null}
            </div>
            <div className={styles.statValue}>{loading ? '-' : data?.unreadMessages || 0}</div>
            <div className={styles.statLabel}>
               {data?.unreadMessages ? 'Unread Messages' : 'No New Messages'}
            </div>
          </button>
        </div>

        {/* --- TODAY'S SCHEDULE LIST (REAL DATA) --- */}
        <div className={styles.sectionCard} style={{ marginTop: '2rem' }}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Today's Schedule</h3>
            <button className={styles.btnSecondary} onClick={() => go('/doctor/appointments')}>
              Add Appointment
            </button>
          </div>
          
          {loading ? (
             <div className={styles.loader} style={{margin:'2rem auto'}}></div>
          ) : (!data?.todayAppointments || data.todayAppointments.length === 0) ? (
             <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                <p>No appointments scheduled for today.</p>
             </div>
          ) : (
            <div className={styles.list}>
              {/* Render Real Appointments */}
              {data.todayAppointments.map((apt) => (
                <div key={apt.id} className={styles.listRow}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ 
                      background: 'var(--color-secondary)', padding: '0.6rem 1rem', borderRadius: '0.6rem', 
                      fontWeight: '800', fontSize: '1.1rem', color: 'var(--color-primary)' 
                    }}>
                      {apt.time}
                    </div>
                    <div>
                      <div className={styles.listTitle} style={{fontSize:'1.1rem'}}>{apt.patientName}</div>
                      <div className={styles.listMeta}>{apt.type}</div>
                    </div>
                  </div>
                  <button className={styles.iconGhostBtn} onClick={() => go('/doctor/appointments')}>→</button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DoctorLayout>
  );
}