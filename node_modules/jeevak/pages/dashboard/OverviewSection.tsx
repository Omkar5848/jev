import styles from '@/styles/Temp.module.css';
import Link from 'next/link';
import HospitalTableSection from './HospitalTableSection';
import DoctorsTableSection from './DoctorsTableSection';
import DemandsTableSection from './DemandsTableSection';

type Props = {
  stats: {
    totalHospitals: number;
    activeDoctors: number;
    totalDoctors: number;
    openDemands: number;
  };
  onNavigateTab?: (tab: 'hospitals' | 'doctors' | 'demands') => void;
};

export default function OverviewSection({ stats, onNavigateTab }: Props) {
  // --- SAFETY CHECK (Prevents Build Crash) ---
  if (!stats) return null;
  // -------------------------------------------

  return (
    <div className={styles.overviewSection}>
      <div className={styles.pageHeader}>
        <h1>Healthcare Management Dashboard</h1>
        <p>Manage hospitals, doctors, and demands from one central location.</p>
      </div>

      <div className={styles.statsGrid}>
        <button
          type="button"
          className={styles.statCard}
          onClick={() => onNavigateTab?.('hospitals')}
          aria-label="Go to Hospitals"
        >
          <div className={styles.statHeader}>
            <div className={`${styles.statIcon} ${styles.blue}`}>🏥</div>;
          </div>
          <div className={styles.statValue}>{stats.totalHospitals}</div>
          <div className={styles.statLabel}>Total Hospitals</div>
        </button>

        <button
          type="button"
          className={styles.statCard}
          onClick={() => onNavigateTab?.('doctors')}
          aria-label="Go to Doctors"
        >
          <div className={styles.statHeader}>
            <div className={`${styles.statIcon} ${styles.purple}`}>🧑‍⚕️</div>;
          </div>
          <div className={styles.statValue}>{stats.totalDoctors}</div>
          <div className={styles.statLabel}>Total Doctors</div>
        </button>

        <button
          type="button"
          className={styles.statCard}
          onClick={() => onNavigateTab?.('demands')}
          aria-label="Go to Demands"
        >
          <div className={styles.statHeader}>
            <div className={`${styles.statIcon} ${styles.orange}`}>📋</div>;
          </div>
          <div className={styles.statValue}>{stats.openDemands}</div>
          <div className={styles.statLabel}>Open Demands</div>
        </button>
      </div>
    </div>
  );
};