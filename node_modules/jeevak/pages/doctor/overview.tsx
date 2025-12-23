import { useRouter } from 'next/router';
import useSWR from 'swr';
import DoctorLayout from './DoctorLayout';
import styles from '@/styles/Dashboard.module.css';
import { FaUserInjured, FaCalendarCheck, FaCommentDots, FaPills } from 'react-icons/fa';
import api from '@/utils/api';

type OverviewData = {
  patientsCount: number;
  appointmentsCount: number;
  unreadMessages: number;
  // Make sure this matches backend response
  todayAppointments: Array<{ 
    id: number; 
    time: string; 
    patientName: string; 
    type: string 
  }>;
};

const fetcher = () => api.get('/api/doctor-features/overview').then(res => res.data);

export default function DoctorOverview() {
  const router = useRouter();
  // refreshInterval ensures new messages/appointments appear without refreshing page
  const { data, error } = useSWR<OverviewData>('doctor-overview', fetcher, { refreshInterval: 5000 });
  const loading = !data && !error;
  const go = (path: string) => router.push(path);

  return (
    <DoctorLayout>
      <div className={styles.overviewSection}>
        <div className={styles.pageHeader}>
          <h1>Doctor Dashboard</h1>
          <p>Overview of your day</p>
        </div>

        {/* --- STATS GRID --- */}
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

          {/* Messages (With RED Badge) */}
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
               {/* Label changes based on count */}
               {data?.unreadMessages ? 'Unread Messages' : 'No New Messages'}
            </div>
          </button>
        </div>

        {/* --- TODAY'S SCHEDULE LIST (Fixed) --- */}
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
              {/* Loop through the actual data */}
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