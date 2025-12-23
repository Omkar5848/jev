// hooks/useFreelancers.ts
import { useEffect, useMemo, useState } from 'react';
import api from '@/utils/api';

export type Freelancer = {
  id?: string | number;
  name: string;
  specialization?: string;
  availability?: 'available' | 'busy' | 'offline';
  rating?: number;
  years?: number;
  ratePerHour?: number;
  projects?: number;
  skills?: string[];
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
};

function authHeaders() {
  if (typeof window === 'undefined') return {};
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const emptyFreelancer: Freelancer = {
  name: '',
  specialization: '',
  availability: 'available',
  rating: undefined, years: undefined, ratePerHour: undefined, projects: undefined,
  skills: [], email: '', phone: '',
};

export function useFreelancers(globalQuery: string) {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [form, setForm] = useState<Freelancer>(emptyFreelancer);
  const [editingId, setEditingId] = useState<string | number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function fetchFreelancers() {
    try {
      const res = await api.get('/api/freelancers', { headers: authHeaders() });
      setFreelancers(res.data || []);
    } catch {}
  }

  useEffect(() => { fetchFreelancers(); }, []);

  function onChange(e: any) {
    const { name, value } = e.target;
    if (['rating', 'years', 'ratePerHour', 'projects'].includes(name)) {
      const n = value === '' ? undefined : Number(value);
      setForm({ ...form, [name]: Number.isNaN(n) ? undefined : n });
    } else if (name === 'skillsCsv') {
      const parts = value.split(',').map((s: string) => s.trim()).filter(Boolean);
      setForm({ ...form, skills: parts });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function onSubmit(e: any) {
    e.preventDefault(); setSaving(true);
    try {
      const payload: Freelancer = {
        name: form.name, specialization: form.specialization,
        availability: form.availability || 'available',
        rating: form.rating, years: form.years, ratePerHour: form.ratePerHour,
        projects: form.projects, skills: form.skills || [], email: form.email, phone: form.phone
      };
      if (editingId !== undefined) { await api.put(`/api/freelancers/${editingId}`, payload, { headers: authHeaders() }); setEditingId(undefined); }
      else { await api.post('/api/freelancers', payload, { headers: authHeaders() }); }
      setForm(emptyFreelancer); await fetchFreelancers();
    } catch {} finally { setSaving(false); }
  }

  function onEdit(item: Freelancer) { setEditingId(item.id!); setForm({ ...emptyFreelancer, ...item }); }

  async function onDelete(id?: string | number) {
    if (!id) return; if (!confirm('Delete this freelancer?')) return;
    try { await api.delete(`/api/freelancers/${id}`, { headers: authHeaders() }); await fetchFreelancers(); } catch {}
  }

  const filtered = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return freelancers;
    return freelancers.filter(f => {
      const pool = [f.name, f.specialization, f.email, f.phone, f.availability, ...(f.skills || []),
        String(f.rating ?? ''), String(f.years ?? ''), String(f.ratePerHour ?? ''), String(f.projects ?? '')]
        .filter(Boolean).join(' ').toLowerCase();
      return pool.includes(q);
    });
  }, [freelancers, globalQuery]);

  return { freelancers, filtered, form, editingId, saving, onChange, onSubmit, onEdit, onDelete };
}
