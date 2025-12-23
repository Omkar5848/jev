// ver/pages/doctor/DoctorLayout.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ThemeToggle from '../../components/ThemeToggle';
import styles from '../../styles/Dashboard.module.css'; // Use the main dashboard styles
import { FaChartPie, FaCalendarAlt, FaUserInjured, FaCommentDots, FaPills, FaSignOutAlt } from 'react-icons/fa';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const r = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    setRole(r);
    if (r !== 'Doctor') router.replace('/login');
  }, [router]);

  if (role !== 'Doctor') return null; // Prevent flash of content

  const navItems = [
    { href: '/doctor/profile', label: 'My Profile', icon: <FaUserInjured /> },
    { href: '/doctor/overview', label: 'Dashboard', icon: <FaChartPie /> },
    { href: '/doctor/appointments', label: 'Schedule', icon: <FaCalendarAlt /> },
    { href: '/doctor/patients', label: 'Patients', icon: <FaUserInjured /> },
    { href: '/doctor/messages', label: 'Messages', icon: <FaCommentDots /> },
    { href: '/doctor/medicines', label: 'Medicines', icon: <FaPills /> },
  ];

  return (
    <div className={styles.healthcareDashboard}>
      {/* Header */}
      <header className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLogo}>
            <div className={styles.logoIcon}>Dr</div>
            <span className={styles.logoText}>Jeevak</span>
          </div>
          
          <div className={styles.headerActions}>
            <button 
              className={styles.btnSecondary}
              onClick={() => router.push('/settings')}
            >
              Settings
            </button>
            <ThemeToggle />
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>DR</div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>Doctor</div>
                <div className={styles.userRole}>Specialist</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className={styles.dashboardLayout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <nav className={styles.navMenu}>
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`${styles.navItem} ${router.pathname === item.href ? styles.active : ''}`}
                aria-current={router.pathname === item.href ? 'page' : undefined}
              >
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            
            <button
              onClick={() => { localStorage.clear(); router.push('/login'); }}
              className={styles.navItem}
              style={{ marginTop: 'auto', color: 'var(--color-error)' }}
            >
              <FaSignOutAlt /> Logout
            </button>
          </nav>
        </aside>

        {/* Content */}
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}