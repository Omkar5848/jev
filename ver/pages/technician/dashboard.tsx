import { useRouter } from 'next/router';
import { useEffect } from 'react';
import styles from '@/styles/Temp.module.css';

export default function TechnicianDashboard() {
  const router = useRouter();
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'Technician') router.replace('/login');
  }, [router]);

  return (
    <div className={styles.sectionCard} style={{ margin: '2rem' }}>
      <h2>Technician Dashboard</h2>
      <p>Manage diagnostics tasks, reports, and test queue.</p>
      <ul>
        <li>Pending diagnostic requests</li>
        <li>Upload test outcomes</li>
        <li>Track machine availability</li>
      </ul>
    </div>
  );
}
