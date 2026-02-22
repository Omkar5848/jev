import { useEffect, useState } from 'react';
import Head from 'next/head';
import api, { getProfile } from '@/utils/api';
import ThemeToggle from '@/components/ThemeToggle';
import StatsGrid from '@/components/StatsGrid';

export default function NurseDashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile().then(u => {
      setUser(u);
      api.get('/api/users/stats').then(res => {
        setStats(res.data.stats);
        setLoading(false);
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-6">
      <Head><title>Nurse Station | Jeevak</title></Head>
      
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-green-600">Nurse Station</h1>
          <p className="text-gray-500">{user?.name} | {user?.profession}</p>
        </div>
        <ThemeToggle />
      </header>

      <StatsGrid stats={stats} loading={loading} />
    </div>
  );
}