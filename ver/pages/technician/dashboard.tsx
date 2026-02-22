import { useEffect, useState } from 'react';
import Head from 'next/head';
import ThemeToggle from '@/components/ThemeToggle';
import { getProfile } from '@/utils/api';

export default function TechnicianDashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getProfile().then(setUser);
  }, []);

  return (
    <div className="min-h-screen bg-purple-50 dark:bg-gray-900 p-6">
      <Head><title>Lab Dashboard</title></Head>
      
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-purple-700">Lab Technician</h1>
          <p className="text-gray-600">{user?.name} | Pathology</p>
        </div>
        <ThemeToggle />
      </header>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">Pending Test Requests</h2>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded border">
          <div className="font-bold">Sample Collection #402</div>
          <div className="text-sm">Patient: John Doe | Type: Blood Test</div>
          <button className="mt-2 text-xs bg-purple-600 text-white px-2 py-1 rounded">Process</button>
        </div>
      </div>
    </div>
  );
}