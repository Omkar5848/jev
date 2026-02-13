import { useRouter } from 'next/router';
import { useEffect } from 'react';
import styles from '@/styles/Temp.module.css';

export default function NurseDashboard() {
  const router = useRouter();
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'Nurse') router.replace('/login');
  }, [router]);

  return (
    <div className={styles.sectionCard} style={{ margin: '2rem' }}>
      <h2>Nurse Dashboard</h2>
      <p>Manage assigned patients, shifts, and care coordination.</p>
      <ul>
        <li>View shift roster</li>
        <li>Track medication schedules</li>
        <li>Update patient vitals</li>
      </ul>
    </div>
  );
}
