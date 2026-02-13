import { useEffect, useState } from 'react';
import api from '@/utils/api';
import styles from '@/styles/Temp.module.css';

type Registration = {
  id: number;
  name: string;
  email: string;
  profession: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
};

export default function RegistrationsSection() {
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await api.get('/api/auth/registrations');
    setRows(res.data || []);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function review(id: number, status: 'approved' | 'rejected') {
    await api.patch(`/api/auth/registrations/${id}`, { status });
    await load();
  }

  if (loading) return <div className={styles.sectionCard}>Loading registrations...</div>;

  return (
    <div className={styles.sectionCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Registration Approvals</h3>
      </div>
      <div className={styles.list}>
        {rows.map((r) => (
          <div key={r.id} className={styles.listRow}>
            <div>
              <div className={styles.listTitle}>{r.name} ({r.profession})</div>
              <div className={styles.listMeta}>{r.email} • {r.approvalStatus}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={styles.btnSecondary} onClick={() => review(r.id, 'approved')}>Approve</button>
              <button className={styles.btnPrimary} onClick={() => review(r.id, 'rejected')}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
