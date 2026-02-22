import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '@/utils/api';
// IMPORTANT: Make sure this points to your correct CSS file
import styles from '@/styles/Temp.module.css'; 
import { 
  FaHome, FaHeartbeat, FaFileMedical, FaUser, 
  FaBell, FaCalendarAlt, FaRunning, FaPills, 
  FaExclamationTriangle, FaSignOutAlt, FaSearch
} from 'react-icons/fa';
// Import the Theme Toggle Component
import ThemeToggle from '@/components/ThemeToggle';

// --- TYPES ---
interface DashboardData {
  identity: {
    name: string;
    id: string;
    dob: string;
    gender: string;
    phone: string;
    email: string;
  };
  vitals: {
    heartRate: number;
    bpSystolic: number;
    bpDiastolic: number;
    weight: number;
    temp: number;
    glucose: number;
    bloodType: string;
    height: number;
  };
  history: {
    diagnosis: string[];
    allergies: string[];
    medications: { name: string; dosage: string; frequency: string }[];
    nextAppointment: string;
  };
  alerts: string[];
}

// --- MOCK DATA ---
const defaultData: DashboardData = {
  identity: { name: "Patient", id: "PT-NEW", dob: "-", gender: "-", phone: "-", email: "-" },
  vitals: { heartRate: 0, bpSystolic: 0, bpDiastolic: 0, weight: 0, temp: 98.6, glucose: 0, bloodType: "-", height: 0 },
  history: { diagnosis: [], allergies: [], medications: [], nextAppointment: "No upcoming visits" },
  alerts: []
};

export default function PatientDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // --- LOGOUT FUNCTION ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    router.push('/login');
  };

  useEffect(() => {
    api.get('/api/auth/me')
      .then(res => {
        const u = res.data;       
        const m = u.medical || {}; 

        setData({
          ...defaultData,
          identity: {
            name: u.name,
            id: `PT-${m.id || 'NEW'}`,
            dob: m.age ? `${m.age} yrs` : 'N/A', 
            gender: m.gender || 'N/A',
            phone: m.phone || u.email, 
            email: u.email
          },
          vitals: {
            heartRate: m.heartRate || 0,
            bpSystolic: m.bpSystolic || 0,
            bpDiastolic: m.bpDiastolic || 0,
            weight: m.weight || 0,
            temp: m.temperature || 98.6,
            glucose: m.glucose || 0,
            bloodType: m.bloodGroup || '-',
            height: m.height || 0
          },
          history: {
            diagnosis: m.diagnosis ? [m.diagnosis] : [], 
            allergies: Array.isArray(m.allergies) ? m.allergies : [],
            medications: Array.isArray(m.medications) ? m.medications : [],
            nextAppointment: "2026-02-14" // Placeholder until Appointment API is ready
          },
          alerts: defaultData.alerts
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard Sync Error:", err);
        router.push('/login');
      });
  }, []);

  if (loading || !data) return <div className={styles.loader} style={{margin:'20% auto'}}></div>;

  return (
    <div className={styles.healthcareDashboard}>
      
      {/* --- 1. HEADER --- */}
      <header className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          {/* Logo Section */}
          <div className={styles.headerLogo}>
            <div className={styles.logoIcon}>Bt.</div>
            <div className={styles.logoText}>BioTrack</div>
          </div>

          {/* Header Actions */}
          <div className={styles.headerActions}>
             {/* Search Bar */}
             <div className={styles.searchContainer}>
                <FaSearch className={styles.searchIcon} />
                <input type="text" placeholder="Search..." className={styles.searchInput} />
             </div>

             {/* --- THEME TOGGLE BUTTON --- */}
             <ThemeToggle />

             {/* Notification Icon */}
             <button className={styles.iconBtn} style={{position:'relative'}}>
                <FaBell />
                {data.alerts.length > 0 && <span style={{position:'absolute', top:8, right:8, width:8, height:8, background:'var(--color-error)', borderRadius:'50%'}}></span>}
             </button>

             {/* User Profile Info */}
             <div className={styles.userProfile}>
                <div className={styles.userAvatar}>
                  {data.identity.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.userInfo}>
                   <span className={styles.userName}>{data.identity.name.split(' ')[0]}</span>
                   <span className={styles.userRole}>Patient</span>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* --- 2. MAIN LAYOUT (Sidebar + Content) --- */}
      <div className={styles.dashboardLayout}>
        
        {/* --- SIDEBAR --- */}
        <aside className={styles.sidebar}>
          <nav className={styles.navMenu}>
             <Link href="/patient/dashboard" className={`${styles.navItem} ${styles.active}`}>
                <FaHome /> Overview
             </Link>
             
             {/* New Navigation Tabs */}
             <Link href="/patient/appointments" className={styles.navItem}>
                <FaCalendarAlt /> Appointments
             </Link>
             
             <Link href="/patient/medicines" className={styles.navItem}>
                <FaPills /> Medicines
             </Link>
             
             <Link href="/patient/records" className={styles.navItem}>
                <FaFileMedical /> Lab Records
             </Link>

             <Link href="/patient/profile" className={styles.navItem}>
                <FaUser /> Profile
             </Link>
          </nav>

          {/* Logout Button at bottom of sidebar */}
          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
             <button onClick={handleLogout} className={styles.navItem} style={{ color: '#ef4444', fontWeight:'bold', cursor:'pointer' }}>
                <FaSignOutAlt /> Logout
             </button>
          </div>
        </aside>

        {/* --- MAIN CONTENT AREA --- */}
        <main className={styles.mainContent}>
          
          <div className={styles.sectionHeader}>
            <div className={styles.headerInfo}>
              <h2>Health Overview</h2>
              <p>Welcome back, {data.identity.name}. Here are your latest metrics.</p>
            </div>
          </div>

          {/* Alerts Section */}
          {data.alerts.length > 0 && (
            <div className={styles.sectionCard} style={{ background: '#fff1f2', borderColor: '#fecdd3', color: '#be123c' }}>
               <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                  <FaExclamationTriangle /> <strong>Attention:</strong> {data.alerts.join(', ')}
               </div>
            </div>
          )}

          {/* --- VITALS GRID (Uses 'statsGrid' from your CSS) --- */}
          <div className={styles.statsGrid}>
             
             {/* Blood Pressure Card */}
             <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                   <FaHeartbeat />
                </div>
                <div className={styles.statLabel}>Blood Pressure</div>
                <div className={styles.statValue}>
                   {data.vitals.bpSystolic}/{data.vitals.bpDiastolic}
                </div>
             </div>

             {/* Heart Rate Card */}
             <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                   <FaRunning />
                </div>
                <div className={styles.statLabel}>Heart Rate</div>
                <div className={styles.statValue}>
                   {data.vitals.heartRate} <span style={{fontSize:'1rem', color:'var(--color-text-secondary)', fontWeight:'normal'}}>bpm</span>
                </div>
             </div>

             {/* Weight Card */}
             <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                   <FaUser />
                </div>
                <div className={styles.statLabel}>Weight</div>
                <div className={styles.statValue}>
                   {data.vitals.weight} <span style={{fontSize:'1rem', color:'var(--color-text-secondary)', fontWeight:'normal'}}>kg</span>
                </div>
             </div>

             {/* Glucose Card */}
             <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                   <FaFileMedical />
                </div>
                <div className={styles.statLabel}>Glucose</div>
                <div className={styles.statValue}>
                   {data.vitals.glucose} <span style={{fontSize:'1rem', color:'var(--color-text-secondary)', fontWeight:'normal'}}>mg/dL</span>
                </div>
             </div>

          </div>

          {/* --- DETAILED SECTIONS --- */}
          <div className={styles.gridThree} style={{ marginTop: '2rem' }}>
             
             {/* 1. Upcoming Appointment (Wide Card) */}
             <div className={styles.sectionCard} style={{ gridColumn: 'span 2' }}>
                <div className={styles.cardHeader}>
                   <h3 className={styles.cardTitle}>Upcoming Appointment</h3>
                   <Link href="/patient/appointments" className={styles.navLink}>View All</Link>
                </div>
                
                {/* Appointment Row */}
                <div className={styles.glassCard} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <div className={styles.avatarPill} style={{ background: 'var(--color-primary)' }}>
                       <FaCalendarAlt />
                    </div>
                    <div>
                       <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>General Checkup</div>
                       <div className={styles.listMeta}>Dr. Smith • {data.history.nextAppointment}</div>
                    </div>
                    <button className={styles.btnSecondary} style={{ marginLeft: 'auto' }}>Reschedule</button>
                </div>
             </div>

             {/* 2. Active Medicines List (Side Card) */}
             <div className={styles.sectionCard}>
                <div className={styles.cardHeader}>
                   <h3 className={styles.cardTitle}>Active Medicines</h3>
                </div>
                <div className={styles.list}>
                   {data.history.medications.length > 0 ? data.history.medications.map((med, i) => (
                      <div key={i} className={styles.listRow}>
                         <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ padding: '8px', background: 'var(--color-background)', borderRadius: '8px', color: 'var(--color-primary)' }}>
                               <FaPills />
                            </div>
                            <div>
                               <div style={{ fontWeight: '600' }}>{med.name}</div>
                               <div className={styles.listMeta}>{med.dosage} • {med.frequency}</div>
                            </div>
                         </div>
                      </div>
                   )) : <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic', padding:'1rem' }}>No active prescriptions.</p>}
                </div>
             </div>

          </div>

        </main>
      </div>
    </div>
  );
}