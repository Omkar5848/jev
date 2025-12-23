// hooks/useDemands.ts
import { useEffect, useMemo, useState } from 'react';
import api from '@/utils/api';

export type Demand = {
  id?: string | number;
  title: string;
  description?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled';
  budget?: number;
  deadline?: string;
  hospitalName?: string;
  vendorName?: string;
  requiredSkills?: string[];
  hospitalId?: number;
  vendorId?: number;
  createdAt?: string;
  updatedAt?: string;
};

function authHeaders() {
  if (typeof window === 'undefined') return {};
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const emptyDemand: Demand = {
  title: '', description: '', priority: 'medium', status: 'open',
  budget: undefined, deadline: '', hospitalName: '', vendorName: '', requiredSkills: [],
};

export function useDemands(globalQuery: string) {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [form, setForm] = useState<Demand>(emptyDemand);
  const [editingId, setEditingId] = useState<string | number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function fetchDemands() {
    try {
      const res = await api.get('/api/demands', { headers: authHeaders() });
      setDemands(res.data || []);
    } catch {}
  }

  useEffect(() => { fetchDemands(); }, []);

  function onChange(e: any) {
    const { name, value } = e.target;
    if (name === 'budget') {
      const n = value === '' ? undefined : Number(value);
      setForm({ ...form, budget: Number.isNaN(n) ? undefined : n });
    } else if (name === 'requiredSkillsCsv') {
      const parts = value.split(',').map((s: string) => s.trim()).filter(Boolean);
      setForm({ ...form, requiredSkills: parts });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function onSubmit(e: any) {
    e.preventDefault(); setSaving(true);
    try {
      const payload: Demand = {
        title: form.title, description: form.description,
        priority: form.priority || 'medium', status: form.status || 'open',
        budget: form.budget, deadline: form.deadline || undefined,
        hospitalName: form.hospitalName, vendorName: form.vendorName,
        requiredSkills: form.requiredSkills || [],
        hospitalId: form.hospitalId, vendorId: form.vendorId
      };
      if (editingId !== undefined) { await api.put(`/api/demands/${editingId}`, payload, { headers: authHeaders() }); setEditingId(undefined); }
      else { await api.post('/api/demands', payload, { headers: authHeaders() }); }
      setForm(emptyDemand); await fetchDemands();
    } catch {} finally { setSaving(false); }
  }

  function onEdit(item: Demand) { setEditingId(item.id!); setForm({ ...emptyDemand, ...item }); }

  async function onDelete(id?: string | number) {
    if (!id) return; if (!confirm('Delete this demand?')) return;
    try { await api.delete(`/api/demands/${id}`, { headers: authHeaders() }); await fetchDemands(); } catch {}
  }

  const filtered = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return demands;
    return demands.filter(d => {
      const pool = [d.title, d.description, d.hospitalName, d.vendorName, d.priority, d.status,
        ...(d.requiredSkills || []), String(d.budget ?? ''), String(d.deadline ?? '')]
        .filter(Boolean).join(' ').toLowerCase();
      return pool.includes(q);
    });
  }, [demands, globalQuery]);

  return { demands, filtered, form, editingId, saving, onChange, onSubmit, onEdit, onDelete };
}
