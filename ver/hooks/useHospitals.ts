// hooks/useHospitals.ts
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/utils/api';

export type Hospital = {
  id?: number | string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  ceo?: string;
  totalBeds?: number;
  availableBeds?: number;
  departments?: string[];
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
};

function authHeaders() {
  if (typeof window === 'undefined') return {};
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export function useHospitals(globalQuery: string) {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [form, setForm] = useState<Hospital>({ name: '', address: '', phone: '', email: '', ceo: '' });
  const [editingId, setEditingId] = useState<string | number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchHospitals() {
    setLoading(true);
    try {
      const res = await api.get('/api/hospitals', { headers: authHeaders() });
      setHospitals(res.data || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        if (typeof window !== 'undefined') localStorage.removeItem('token');
        router.push('/login');
      } else {
        alert(err?.response?.data?.message || err.message || 'Failed to load hospitals');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchHospitals(); }, []);

  function onChange(e: any) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function onSubmit(e: any) {
    e.preventDefault(); setSaving(true);
    try {
      if (editingId !== undefined) {
        await api.put(`/api/hospitals/${editingId}`, form, { headers: authHeaders() });
        setEditingId(undefined);
      } else {
        await api.post('/api/hospitals', form, { headers: authHeaders() });
      }
      setForm({ name:'', address:'', phone:'', email:'', ceo:'' });
      await fetchHospitals();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Operation failed');
    } finally { setSaving(false); }
  }

  function onEdit(item: Hospital) {
    setEditingId(item.id!);
    setForm({ name:item.name||'', address:item.address||'', phone:item.phone||'', email:item.email||'', ceo:item.ceo||'' });
  }

  async function onDelete(id?: string | number) {
    if (!id) return;
    if (!confirm('Delete this item?')) return;
    try { await api.delete(`/api/hospitals/${id}`, { headers: authHeaders() }); await fetchHospitals(); }
    catch (err: any) { alert(err?.response?.data?.message || err.message || 'Delete failed'); }
  }

  const filtered = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return hospitals;
    return hospitals.filter(h => {
      const pool = [h.name, h.address, h.phone, h.email, h.ceo, ...(h.departments || [])]
        .filter(Boolean).join(' ').toLowerCase();
      return pool.includes(q);
    });
  }, [hospitals, globalQuery]);

  return { hospitals, filtered, loading, form, setForm, editingId, saving, onChange, onSubmit, onEdit, onDelete };
}
