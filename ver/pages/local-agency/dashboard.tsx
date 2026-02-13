import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/utils/api';
import styles from '@/styles/Temp.module.css';

type Demand = {
  id: number;
  title: string;
  description?: string;
  budget?: number;
  status: string;
};

export default function LocalAgencyDashboard() {
  const router = useRouter();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [bidAmount, setBidAmount] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<Record<number, string>>({});

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'LocalAgency') {
      router.replace('/login');
      return;
    }
    api.get('/api/demands').then((res) => {
      setDemands((res.data || []).filter((d: Demand) => d.status === 'open'));
    });
  }, [router]);

  async function bid(demandId: number) {
    await api.post(`/api/demands/${demandId}/bids`, {
      bidAmount: Number(bidAmount[demandId] || 0),
      message: message[demandId] || '',
    });
    alert('Bid submitted');
  }

  return (
    <div className={styles.sectionCard} style={{ margin: '2rem' }}>
      <h2>Local Agency Dashboard</h2>
      <p>Apply and bid for available shifts.</p>

      <div className={styles.list}>
        {demands.map((d) => (
          <div key={d.id} className={styles.listRow}>
            <div>
              <div className={styles.listTitle}>{d.title}</div>
              <div className={styles.listMeta}>{d.description || 'No description'} • Budget: ₹{d.budget || '-'}</div>
            </div>
            <div style={{ display: 'grid', gap: 8, minWidth: 260 }}>
              <input
                className={styles.searchInput}
                placeholder="Bid amount"
                value={bidAmount[d.id] || ''}
                onChange={(e) => setBidAmount((v) => ({ ...v, [d.id]: e.target.value }))}
              />
              <input
                className={styles.searchInput}
                placeholder="Message"
                value={message[d.id] || ''}
                onChange={(e) => setMessage((v) => ({ ...v, [d.id]: e.target.value }))}
              />
              <button className={styles.btnPrimary} onClick={() => bid(d.id)}>Apply / Bid</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
