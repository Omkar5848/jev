// hooks/useVendors.ts
import { useEffect, useMemo, useState } from 'react';
import api from '@/utils/api';

export type Vendor = {
  id?: string | number;
  name: string;
  contactPerson?: string;
  category?: string;
  status?: 'active' | 'inactive';
  rating?: number;
  contractValue?: number;
  documentsCount?: number;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

function authHeaders() {
  if (typeof window === 'undefined') return {};
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const emptyVendor: Vendor = {
  name: '', contactPerson: '', category: '', status: 'active',
  rating: undefined, contractValue: undefined, documentsCount: undefined,
  email: '', phone: '', notes: '',
};

export function useVendors(globalQuery: string) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState<Vendor>(emptyVendor);
  const [editingId, setEditingId] = useState<string | number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function fetchVendors() {
    try {
      const res = await api.get('/api/vendors', { headers: authHeaders() });
      setVendors(res.data || []);
    } catch {}
  }

  useEffect(() => { fetchVendors(); }, []);

  function onChange(e: any) {
    const { name, value } = e.target;
    if (['rating', 'contractValue', 'documentsCount'].includes(name)) {
      const n = value === '' ? undefined : Number(value);
      setForm({ ...form, [name]: Number.isNaN(n) ? undefined : n });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function onSubmit(e: any) {
    e.preventDefault(); setSaving(true);
    try {
      const payload: Vendor = {
        name: form.name, contactPerson: form.contactPerson, category: form.category,
        status: form.status || 'active', rating: form.rating, contractValue: form.contractValue,
        documentsCount: form.documentsCount, email: form.email, phone: form.phone, notes: form.notes
      };
      if (editingId !== undefined) { await api.put(`/api/vendors/${editingId}`, payload, { headers: authHeaders() }); setEditingId(undefined); }
      else { await api.post('/api/vendors', payload, { headers: authHeaders() }); }
      setForm(emptyVendor); await fetchVendors();
    } catch {} finally { setSaving(false); }
  }

  function onEdit(item: Vendor) { setEditingId(item.id!); setForm({ ...emptyVendor, ...item }); }

  async function onDelete(id?: string | number) {
    if (!id) return; if (!confirm('Delete this vendor?')) return;
    try { await api.delete(`/api/vendors/${id}`, { headers: authHeaders() }); await fetchVendors(); } catch {}
  }

  const filtered = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(v => {
      const pool = [v.name, v.contactPerson, v.category, v.email, v.phone, v.status,
        String(v.rating ?? ''), String(v.contractValue ?? ''), String(v.documentsCount ?? '')]
        .filter(Boolean).join(' ').toLowerCase();
      return pool.includes(q);
    });
  }, [vendors, globalQuery]);

  return { vendors, filtered, form, editingId, saving, onChange, onSubmit, onEdit, onDelete };
}
