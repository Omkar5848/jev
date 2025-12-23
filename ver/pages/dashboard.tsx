// ver/pages/dashboard.tsx
import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Temp.module.css';
import { useRouter } from 'next/router';
import { getProfile } from '@/utils/api';
import dynamic from 'next/dynamic';
import { FaBars } from 'react-icons/fa6';
import { FaSignOutAlt } from 'react-icons/fa'; // Import Logout Icon

// IMPORT THE SHARED THEME TOGGLE
import ThemeToggle from '@/components/ThemeToggle';

// Sections (tabs)
import OverviewSection from './dashboard/OverviewSection';
import HospitalsSection from './dashboard/HospitalsSection';
import DoctorsSection from './dashboard/DoctorsSection';
import DemandsSection from './dashboard/DemandsSection';
import LocalAgenciesSection from './dashboard/LocalAgenciesSection';
import VendorsSection from './dashboard/VendorsSection';
import FreelancersSection from './dashboard/FreelancersSection';
import ProfileSection from './dashboard/ProfileSection';

// Hooks used by tabs
import { useHospitals } from './hooks/useHospitals';
import { useDoctors } from './hooks/useDoctors';
import { useDemands } from './hooks/useDemands';
import { useVendors } from './hooks/useVendors';
import { useFreelancers } from './hooks/useFreelancers';

// Embedded tables for Overview swaps
const HospitalTableSection = dynamic(() => import('./dashboard/HospitalTableSection'), { ssr: false });
const DoctorsTableSection  = dynamic(() => import('./dashboard/DoctorsTableSection'),  { ssr: false });
const DemandsTableSection  = dynamic(() => import('./dashboard/DemandsTableSection'),  { ssr: false });

type User = {
  id: string | number;
  name: string;
  profession?: string;
  email?: string;
  avatarUrl?: string | null;
};

// Keep union with all tabs
type TabSection = 'overview' | 'profile' | 'hospitals' | 'doctors' | 'demands' | 'local_agencies' | 'vendors' | 'freelancers' ;

export default function Dashboard() {
  const router = useRouter();

  // User
  const [user, setUser] = useState<User | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<TabSection>('overview');

  // Sidebar collapsed state
  const [collapsed, setCollapsed] = useState(false);

  // Search
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Load profile
  useEffect(() => {
    (async () => {
      try {
        const profileData = await getProfile();
        setUser(profileData);
      } catch {
        if (typeof window === 'undefined') return;
        const cached = localStorage.getItem('auth_user');
        if (cached) {
          try {
            const u = JSON.parse(cached);
            if (u?.name) { setUser(u); return; }
          } catch {}
        }
        const t = localStorage.getItem('token');
        if (t) {
          try {
            const payload = JSON.parse(atob(t.split('.')[1] || 'e30='));
            const candidateName =
              payload.name || payload.username || payload.preferred_username ||
              (payload.given_name && payload.family_name ? `${payload.given_name} ${payload.family_name}`.trim() : undefined) ||
              payload.given_name || payload.nickname || payload.email || null;

            if (candidateName) {
              setUser({
                id: payload.sub || payload.id || payload.user_id || payload.uid || candidateName,
                name: candidateName,
                profession: payload.profession || payload.role || 'Admin',
                email: payload.email,
                avatarUrl: null
              });
            }
          } catch {}
        }
      }
    })();
  }, []);

  // Data hooks
  const hospitals = useHospitals(debounced || '');
  const doctors   = useDoctors(debounced || '');
  const demands   = useDemands(debounced || '');
  const vendors   = useVendors(debounced || '');
  const freelancers = useFreelancers(debounced || '');

  // Stats for OverviewSection
  const stats = useMemo(() => ({
    totalHospitals: (hospitals.hospitals || []).length,
    totalDoctors:   (doctors.doctors   || []).length,
    activeDoctors:  (doctors.filtered  || []).filter((d: any) =>
                     d?.availabilityStatus === 'available' || d?.available === true
                   ).length,
    openDemands:    (demands.filtered  || []).filter((d: any) =>
                     d?.status === 'open' || d?.state === 'open'
                   ).length
  }), [hospitals.hospitals, doctors.doctors, doctors.filtered, demands.filtered]);

  // Overview swap mode
  const [overviewMode, setOverviewMode] =
    useState<'default' | 'hospitalsTable' | 'doctorsTable' | 'demandsTable'>('default');

  // Logout Logic
  function onLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('doctorId');
    }
    router.push('/login');
  }

  // Sidebar entries
  const sidebarItems = [
    { id: 'profile',         name: 'Profile',         icon: '👤' },
    { id: 'overview',        name: 'Overview',        icon: '🗂️' },
    { id: 'hospitals',       name: 'Hospitals',       icon: '🏥' },
    { id: 'doctors',         name: 'Doctors',         icon: '👨‍⚕️' },
    { id: 'demands',         name: 'Demands',         icon: '📄' },
    { id: 'local_agencies',  name: 'Local Agencies',  icon: '🏢' },
   
  ] as const;

  return (
    <>
      <Head>
        <title>Jeevak - Healthcare Dashboard</title>
        <meta name="description" content="Healthcare Management Dashboard" />
        <meta name="color-scheme" content="light dark" />
      </Head>

      <div className={styles.healthcareDashboard}>
        {/* Header */}
        <header className={styles.dashboardHeader}>
          <div className={styles.headerContent}>
            
            <div className={styles.headerLogo}>
              <div className={styles.logoIcon}>H</div>
              <span className={styles.logoText}>Jeevak</span>
              
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
                  placeholder="Search..."
                  className={styles.searchInput}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <button className={styles.iconBtn}><span>🔔</span></button>

              <ThemeToggle />

              <div className={styles.userProfile}>
                <div className={styles.userAvatar}>
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    (user?.name ? user.name.charAt(0) : 'U').toUpperCase()
                  )}
                </div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user?.name || 'User'}</div>
                  <div className={styles.userRole}>{user?.profession || 'Admin'}</div>
                </div>
                {/* Replaced Logout Button with Link to Settings only */}
                <Link href="/settings" className={styles.settingsBtn}>Settings</Link>
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className={styles.dashboardLayout}>
          {/* Sidebar */}
          <aside
            className={styles.sidebar}
            aria-label="Primary"
            style={{
              width: collapsed ? '5rem' : '16rem',
              minWidth: collapsed ? '5rem' : '16rem',
              transition: 'width 200ms ease'
            }}
          >
            <nav className={styles.navMenu}>
              {/* Navigation Items */}
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabSection);
                    if (item.id === 'overview') setOverviewMode('default');
                  }}
                  className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''} ${collapsed ? 'justify-center px-2' : ''}`}
                  aria-current={activeTab === item.id ? 'page' : undefined}
                  title={item.name}
                >
                  <span className={styles.navIcon} role="img" aria-label={item.name}>
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.name}</span>}
                </button>
              ))}

              {/* LOGOUT BUTTON - Pushed to bottom */}
              <button
                onClick={onLogout}
                className={`${styles.navItem} ${collapsed ? 'justify-center px-2' : ''}`}
                style={{ marginTop: 'auto', color: 'var(--color-error)' }}
                title="Logout"
              >
                <span className={styles.navIcon} style={{ fontSize: '1.2rem' }}>
                  <FaSignOutAlt />
                </span>
                {!collapsed && <span>Logout</span>}
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className={styles.mainContent}>
            {activeTab === 'overview' && (
              overviewMode === 'default' ? (
                <OverviewSection
                  stats={{
                    totalHospitals: stats.totalHospitals,
                    activeDoctors:  stats.activeDoctors,
                    totalDoctors:   stats.totalDoctors,
                    openDemands:    stats.openDemands
                  }}
                  onNavigateTab={(tab: 'hospitals' | 'doctors' | 'demands') => {
                    if (tab === 'hospitals') { setOverviewMode('hospitalsTable'); return; }
                    if (tab === 'doctors') { setOverviewMode('doctorsTable'); return; }
                    if (tab === 'demands') { setOverviewMode('demandsTable'); return; }
                    setActiveTab(tab as TabSection);
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

            {activeTab === 'profile' && <ProfileSection />}

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

            {activeTab === 'doctors' && (
              <DoctorsSection
                filtered={doctors.filtered}
                form={doctors.form}
                editingId={doctors.editingId}
                saving={doctors.saving}
                onChange={doctors.onChange}
                onSubmit={doctors.onSubmit}
                onEdit={doctors.onEdit}
                onDelete={doctors.onDelete}
                setEditingId={doctors.setEditingId}
                setForm={doctors.setForm}
              />
            )}

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

            {activeTab === 'local_agencies' && <LocalAgenciesSection />}


            
          </main>
        </div>
      </div>
    </>
  );
}