import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { FaBars, FaSignOutAlt } from 'react-icons/fa'; 

// Shared Components & Utils
import styles from '@/styles/Temp.module.css';
import { getProfile } from '@/utils/api';
import ThemeToggle from '@/components/ThemeToggle';

// Section Components
import OverviewSection from './dashboard/OverviewSection';
import HospitalsSection from './dashboard/HospitalsSection';
import DoctorsSection from './dashboard/DoctorsSection';
import DemandsSection from './dashboard/DemandsSection';
import LocalAgenciesSection from './dashboard/LocalAgenciesSection';
import ProfileSection from './dashboard/ProfileSection';
import PatientsSection from './dashboard/PatientsSection'; // <--- NEW IMPORT

// Hooks
import { useHospitals } from '../hooks/useHospitals';
import { useDoctors } from '../hooks/useDoctors';
import { useDemands } from '../hooks/useDemands';

// Dynamic Table Imports
const HospitalTableSection = dynamic(() => import('./dashboard/HospitalTableSection'), { ssr: false });
const DoctorsTableSection  = dynamic(() => import('./dashboard/DoctorsTableSection'),  { ssr: false });
const DemandsTableSection  = dynamic(() => import('./dashboard/DemandsTableSection'),  { ssr: false });

type User = {
  id: string | number;
  name: string;
  profession: string;
  role?: string;
  email?: string;
  avatarUrl?: string | null;
};

// Update Tab Types
type TabSection = 'overview' | 'profile' | 'hospitals' | 'doctors' | 'patients' | 'demands' | 'local_agencies';

export default function AdminDashboard() {
  const router = useRouter();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabSection>('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const [overviewMode, setOverviewMode] = useState<'default' | 'hospitalsTable' | 'doctorsTable' | 'demandsTable'>('default');

  // ==========================================
  // 1. SECURITY CHECK
  // ==========================================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      router.push('/login');
      return;
    }

    if (role !== 'Admin') {
      if (role === 'Doctor') router.push('/doctor/overview');
      else router.push('/');
      return;
    }

    setAuthorized(true);
    getProfile()
      .then((u) => {
        setUser(u as User);
        setLoading(false);
      })
      .catch(() => {
        localStorage.clear();
        router.push('/login');
      });
  }, [router]);

  // ==========================================
  // 2. DATA HOOKS
  // ==========================================
  const hospitals = useHospitals(query);
  const doctors = useDoctors(query);
  const demands = useDemands(query);

  const stats = useMemo(() => ({
    totalHospitals: (hospitals.hospitals || []).length,
    totalDoctors:   (doctors.doctors   || []).length,
    activeDoctors:  (doctors.filtered  || []).filter((d: any) => d?.availabilityStatus === 'available').length,
    openDemands:    (demands.filtered  || []).filter((d: any) => d?.status === 'open').length
  }), [hospitals.hospitals, doctors.doctors, doctors.filtered, demands.filtered]);

  // ==========================================
  // 3. SIDEBAR CONFIGURATION
  // ==========================================
  const sidebarItems = [
    { id: 'profile',         name: 'Profile',         icon: '👤' },
    { id: 'overview',        name: 'Overview',        icon: '🗂️' },
    { id: 'hospitals',       name: 'Hospitals',       icon: '🏥' },
    { id: 'doctors',         name: 'Doctors',         icon: '👨‍⚕️' },
    { id: 'patients',        name: 'Patients',        icon: '🤕' }, // <--- NEW TAB ADDED
    { id: 'demands',         name: 'Demands',         icon: '📄' },
    { id: 'local_agencies',  name: 'Local Agencies',  icon: '🏢' },
  ] as const;

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (!authorized || loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Verifying Admin Access...</div>;
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard | Jeevak</title>
      </Head>

      <div className={styles.healthcareDashboard}>
        {/* Header */}
        <header className={styles.dashboardHeader}>
          <div className={styles.headerContent}>
            
            <div className={styles.headerLogo}>
              <div className={styles.logoIcon}>J</div>
              <span className={styles.logoText}>Jeevak <small style={{fontSize: '0.6em', opacity: 0.8}}>ADMIN</small></span>
              
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className={styles.iconBtn}
                style={{ marginLeft: '1rem', background: 'transparent', boxShadow: 'none' }}
              >
                <FaBars />
              </button>
            </div>

            <div className={styles.headerActions}>
              <div className={styles.searchContainer}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Search system..."
                  className={styles.searchInput}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <ThemeToggle />

              <div className={styles.userProfile}>
                <div className={styles.userAvatar}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user?.name || 'Administrator'}</div>
                  <div className={styles.userRole}>System Admin</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className={styles.dashboardLayout}>
          {/* Sidebar */}
          <aside
            className={styles.sidebar}
            style={{
              width: collapsed ? '5rem' : '16rem',
              minWidth: collapsed ? '5rem' : '16rem',
              transition: 'width 200ms ease'
            }}
          >
            <nav className={styles.navMenu}>
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabSection);
                    if (item.id === 'overview') setOverviewMode('default');
                  }}
                  className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''} ${collapsed ? 'justify-center px-2' : ''}`}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {!collapsed && <span>{item.name}</span>}
                </button>
              ))}

              <button
                onClick={handleLogout}
                className={styles.navItem}
                style={{ marginTop: 'auto', color: '#ef4444' }}
              >
                <span className={styles.navIcon}><FaSignOutAlt /></span>
                {!collapsed && <span>Logout</span>}
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className={styles.mainContent}>
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              overviewMode === 'default' ? (
                <OverviewSection
                  stats={stats}
                  onNavigateTab={(tab: any) => {
                    if (tab === 'hospitals') setOverviewMode('hospitalsTable');
                    else if (tab === 'doctors') setOverviewMode('doctorsTable');
                    else if (tab === 'demands') setOverviewMode('demandsTable');
                    else setActiveTab(tab);
                  }}
                />
              ) : overviewMode === 'hospitalsTable' ? (
                <HospitalTableSection onBack={() => setOverviewMode('default')} />
              ) : overviewMode === 'doctorsTable' ? (
                <DoctorsTableSection onBack={() => setOverviewMode('default')} />
              ) : (
                <DemandsTableSection onBack={() => setOverviewMode('default')} />
              )
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && <ProfileSection />}

            {/* HOSPITALS TAB */}
            {activeTab === 'hospitals' && (
              <HospitalsSection
                filtered={hospitals.filtered}
                form={hospitals.form}
                editingId={hospitals.editingId}
                saving={hospitals.saving}
                loading={hospitals.loading}
                onChange={hospitals.onChange}
                onSubmit={hospitals.onSubmit}
                onEdit={hospitals.onEdit}
                onDelete={hospitals.onDelete}
              />
            )}

            {/* DOCTORS TAB */}
            {activeTab === 'doctors' && (
              <DoctorsSection/>
            )}

            {/* PATIENTS TAB (NEW) */}
            {activeTab === 'patients' && <PatientsSection />}

            {/* DEMANDS TAB */}
            {activeTab === 'demands' && (
              <DemandsSection
                filtered={demands.filtered}
                form={demands.form}
                editingId={demands.editingId}
                saving={demands.saving}
                onChange={demands.onChange}
                onSubmit={demands.onSubmit}
                onEdit={demands.onEdit}
                onDelete={demands.onDelete}
              />
            )}

            {/* LOCAL AGENCIES TAB */}
            {activeTab === 'local_agencies' && <LocalAgenciesSection />}
            
          </main>
        </div>
      </div>
    </>
  );
}