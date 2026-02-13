import { useRouter } from 'next/router';
import { useEffect } from 'react';
import styles from '@/styles/Temp.module.css';

export default function PatientDashboard() {
  const router = useRouter();
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'Patient') router.replace('/login');
  }, [router]);

  return (
    <div className={styles.sectionCard} style={{ margin: '2rem' }}>
      <h2>Patient Dashboard</h2>
      <p>Access your appointments, reports, and medical timeline.</p>
      <ul>
        <li>Upcoming appointments</li>
        <li>Prescription reminders</li>
        <li>Lab report access</li>
      </ul>
    </div>
  );
}
