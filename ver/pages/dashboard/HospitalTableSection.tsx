// ver/pages/dashboard/HospitalTableSection.tsx
import React, { useEffect, useMemo, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import api from '@/utils/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

type Props = { onBack?: () => void };

type Hospital = {
  id?: number | string;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  ceo?: string;
};

function authHeaders() {
  if (typeof window === 'undefined') return {};
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function HospitalTableSection({ onBack }: Props) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [isAdd, setIsAdd] = useState(false);
  const [view, setView] = useState<Hospital | null>(null);
  const [edit, setEdit] = useState<Hospital | null>(null);

  const [form, setForm] = useState<Hospital>({ name: '', email: '', address: '', phone: '', ceo: '' });
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const perPage = 5;

  async function fetchHospitals() {
    setLoading(true);
    try {
      const res = await api.get('/api/hospitals', { headers: authHeaders() });
      const data: Hospital[] = (res.data || []).map((h: any) => ({
        id: h.id ?? h.hospitalId ?? h._id,
        name: h.name ?? h.hospitalName ?? '',
        email: h.email ?? h.contactEmail ?? '',
        address: h.address ?? '',
        phone: h.phone ?? '',
        ceo: h.ceo ?? '',
      }));
      setHospitals(data);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to load hospitals.');
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchHospitals(); }, []);

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return hospitals;
    return hospitals.filter(h => `${h.name} ${h.email} ${h.address} ${h.phone} ${h.ceo}`.toLowerCase().includes(s));
  }, [hospitals, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const firstIndex = (page - 1) * perPage;
  const current = filtered.slice(firstIndex, firstIndex + perPage);

  function prev() { if (page > 1) setPage(p => p - 1); }
  function next() { if (page < totalPages) setPage(p => p + 1); }

  function onChange(e: any) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function onCreate(e: any) {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/api/hospitals', form, { headers: authHeaders() });
      setIsAdd(false);
      setForm({ name: '', email: '', address: '', phone: '', ceo: '' });
      await fetchHospitals();
      setPage(1);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Add failed.');
    } finally { setSaving(false); }
  }

  async function onUpdate(e: any) {
    e.preventDefault(); if (!edit?.id) return;
    setSaving(true);
    try {
      await api.put(`/api/hospitals/${edit.id}`, form, { headers: authHeaders() });
      setEdit(null);
      await fetchHospitals();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Update failed.');
    } finally { setSaving(false); }
  }

  async function onDelete(id?: number | string) {
    if (!id) return;
    if (!confirm('Delete this hospital?')) return;
    try {
      await api.delete(`/api/hospitals/${id}`, { headers: authHeaders() });
      await fetchHospitals();
      setPage(p => Math.min(p, Math.max(1, Math.ceil((filtered.length - 1) / perPage))));
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Delete failed.');
    }
  }

  function downloadExcel() {
    const rows = filtered.map(h => ({
      ID: h.id ?? '',
      'Hospital Name': h.name,
      Email: h.email ?? '',
      Address: h.address ?? '',
      Phone: h.phone ?? '',
      CEO: h.ceo ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hospitals');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'Hospitals.xlsx');
  }

  return (
    <div className="p-0">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-xl font-semibold text-gray-100">Hospitals</h2>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search hospital..."
            className="h-9 w-64 px-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setIsAdd(true)}
            className="h-9 px-4 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium shadow"
          >
            Add Hospital
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="h-9 px-4 rounded-full bg-[#475569] hover:bg-[#334155] text-white text-sm font-medium shadow"
            >
              ← Back to Overview
            </button>
          )}
        </div>
      </div>

      {/* Table with outer and inner borders, rounded container */}
      <div className="overflow-auto rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#1d4ed8]">
              <th className="text-left text-white text-[13px] font-bold px-4 py-3 border border-[#e5e7eb]">ID</th>
              <th className="text-left text-white text-[13px] font-bold px-4 py-3 border border-[#e5e7eb]">Hospital Name</th>
              <th className="text-left text-white text-[13px] font-bold px-4 py-3 border border-[#e5e7eb]">Email</th>
              <th className="text-left text-white text-[13px] font-bold px-4 py-3 border border-[#e5e7eb]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[#475569] border border-[#e5e7eb]">
                  Loading...
                </td>
              </tr>
            ) : current.length > 0 ? (
              current.map(h => (
                <tr key={String(h.id)} className="hover:bg-[#f1f5f9]">
                  <td className="px-4 py-3 text-[#0f172a] border border-[#e5e7eb]">{h.id ?? '-'}</td>
                  <td className="px-4 py-3 text-[#0f172a] border border-[#e5e7eb]">{h.name}</td>
                  <td className="px-4 py-3 text-[#0f172a] border border-[#e5e7eb]">{h.email || '-'}</td>
                  <td className="px-4 py-3 border border-[#e5e7eb]">
                    <div className="flex gap-2">
                      {/* View: Indigo pill */}
                      <button
                        className="h-8 px-3 rounded-full bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-semibold shadow-sm transition-colors"
                        onClick={() => setView(h)}
                      >
                        View
                      </button>
                      {/* Edit: Emerald pill */}
                      <button
                        className="h-8 px-3 rounded-full bg-[#10b981] hover:bg-[#059669] text-white text-sm font-semibold shadow-sm transition-colors"
                        onClick={() => {
                          setEdit(h);
                          setForm({
                            name: h.name,
                            email: h.email || '',
                            address: h.address || '',
                            phone: h.phone || '',
                            ceo: h.ceo || ''
                          });
                        }}
                      >
                        Edit
                      </button>
                      {/* Delete: Rose pill */}-+
                      <button
                        className="h-8 px-3 rounded-full bg-[#f43f5e] hover:bg-[#e11d48] text-white text-sm font-semibold shadow-sm transition-colors"
                        onClick={() => onDelete(h.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center italic text-[#64748b] border border-[#e5e7eb]">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-3 mt-4 border border-[#e5e7eb] rounded-xl bg-white px-4 py-3">
        <button
          className={`h-9 px-3 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium ${page === 1 ? 'opacity-50 cursor-not-allowed hover:bg-[#3b82f6]' : ''}`}
          disabled={page === 1}
          onClick={prev}
        >
          Previous
        </button>
        <span className="text-[13px] font-semibold text-[#0f172a]">Page {page} of {totalPages}</span>
        <button
          className={`h-9 px-3 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium ${page === totalPages ? 'opacity-50 cursor-not-allowed hover:bg-[#3b82f6]' : ''}`}
          disabled={page === totalPages}
          onClick={next}
        >
          Next
        </button>
      </div>

      {/* Download */}
      <div className="mt-6 flex justify-center">
        <button className="h-9 px-5 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white text-sm font-medium shadow" onClick={downloadExcel}>
          Download Excel
        </button>
      </div>

      {/* Add popup */}
      <Popup open={isAdd} onClose={() => setIsAdd(false)} modal nested>
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Add Hospital</h2>
          <form onSubmit={onCreate}>
            <FormGrid form={form} onChange={onChange} />
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setIsAdd(false)} className="h-9 px-4 rounded bg-gray-500 hover:bg-gray-600 text-white">
                Cancel
              </button>
              <button type="submit" className="h-9 px-4 rounded bg-blue-500 hover:bg-blue-600 text-white" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </Popup>

      {/* View popup */}
      <Popup open={!!view} onClose={() => setView(null)} modal nested>
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-2xl font-bold text-gray-800">Hospital Details</h2>
            <button onClick={() => setView(null)} className="text-gray-500 hover:text-gray-700">✖</button>
          </div>
          {view && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Basic Information">
                <Row label="ID" value={String(view.id ?? '-')} />
                <Row label="Name" value={view.name} />
                <Row label="Email" value={view.email || '-'} />
              </Card>
              <Card title="More">
                <Row label="Address" value={view.address || '-'} />
                <Row label="Phone" value={view.phone || '-'} />
                <Row label="CEO" value={view.ceo || '-'} />
              </Card>
            </div>
          )}
          <div className="mt-6 flex justify-end border-t pt-4">
            <button onClick={() => setView(null)} className="h-9 px-5 rounded bg-blue-500 hover:bg-blue-600 text-white">
              Close
            </button>
          </div>
        </div>
      </Popup>

      {/* Edit popup */}
      <Popup open={!!edit} onClose={() => setEdit(null)} modal nested>
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Edit Hospital</h2>
          {edit && (
            <form onSubmit={onUpdate}>
              <FormGrid form={form} onChange={onChange} />
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setEdit(null)} className="h-9 px-4 rounded bg-gray-500 hover:bg-gray-600 text-white">
                  Cancel
                </button>
                <button type="submit" className="h-9 px-4 rounded bg-blue-500 hover:bg-blue-600 text-white" disabled={saving}>
                  {saving ? 'Saving...' : 'Update'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Popup>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-1">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600 font-medium">{label}:</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}

function FormGrid({ form, onChange }: { form: any; onChange: (e: any) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <Field label="Name">
        <input name="name" value={form.name} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" required />
      </Field>
      <Field label="Email">
        <input name="email" type="email" value={form.email || ''} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" />
      </Field>
      <Field label="Address">
        <input name="address" value={form.address || ''} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" />
      </Field>
      <Field label="Phone">
        <input name="phone" value={form.phone || ''} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" />
      </Field>
      <div className="md:col-span-2">
        <Field label="CEO">
          <input name="ceo" value={form.ceo || ''} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
