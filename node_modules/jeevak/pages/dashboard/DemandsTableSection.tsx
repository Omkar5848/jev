import React, { useEffect, useMemo, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import api from '@/utils/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

type Props = { onBack?: () => void };

type Demand = {
  id?: number | string;
  title: string;
  hospital?: string;
  vendor?: string;
  budget?: number;
  deadline?: string; // ISO date
  status?: 'open' | 'closed' | 'in_progress' | string;
  level?: 'junior' | 'mid' | 'senior' | string;
  skills?: string;
  description?: string;
};

function authHeaders() {
  if (typeof window === 'undefined') return {};
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function DemandsTableSection({ onBack }: Props) {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [isAdd, setIsAdd] = useState(false);
  const [view, setView] = useState<Demand | null>(null);
  const [edit, setEdit] = useState<Demand | null>(null);

  const [form, setForm] = useState<Demand>({
    title: '',
    hospital: '',
    vendor: '',
    budget: undefined,
    deadline: '',
    status: 'open',
    level: 'mid',
    skills: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const perPage = 5;

  async function fetchDemands() {
    setLoading(true);
    try {
      const res = await api.get('/api/demands', { headers: authHeaders() });
      const data: Demand[] = (res.data || []).map((d: any) => ({
        id: d.id ?? d.demandId ?? d._id,
        title: d.title ?? '',
        hospital: d.hospital ?? d.hospitalName ?? '',
        vendor: d.vendor ?? d.vendorName ?? '',
        budget: typeof d.budget === 'number' ? d.budget : Number(d.budget) || undefined,
        deadline: d.deadline ?? d.dueDate ?? '',
        status: d.status ?? 'open',
        level: d.level ?? d.seniority ?? 'mid',
        skills: Array.isArray(d.skills) ? d.skills.join(', ') : d.skills ?? '',
        description: d.description ?? ''
      }));
      setDemands(data);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to load demands.');
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchDemands(); }, []);

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return demands;
    return demands.filter(d =>
      `${d.title} ${d.hospital ?? ''} ${d.vendor ?? ''} ${d.status ?? ''} ${d.level ?? ''} ${d.skills ?? ''}`
        .toLowerCase()
        .includes(s)
    );
  }, [demands, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const firstIndex = (page - 1) * perPage;
  const current = filtered.slice(firstIndex, firstIndex + perPage);

  function prev() { if (page > 1) setPage(p => p - 1); }
  function next() { if (page < totalPages) setPage(p => p + 1); }

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === 'budget') {
      setForm(prev => ({ ...prev, budget: value === '' ? undefined : Number(value) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/api/demands', form, { headers: authHeaders() });
      setIsAdd(false);
      resetForm();
      await fetchDemands();
      setPage(1);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Add failed.');
    } finally { setSaving(false); }
  }

  async function onUpdate(e: React.FormEvent) {
    e.preventDefault(); if (!edit?.id) return;
    setSaving(true);
    try {
      await api.put(`/api/demands/${edit.id}`, form, { headers: authHeaders() });
      setEdit(null);
      await fetchDemands();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Update failed.');
    } finally { setSaving(false); }
  }

  async function onDelete(id?: number | string) {
    if (!id) return;
    if (!confirm('Delete this demand?')) return;
    try {
      await api.delete(`/api/demands/${id}`, { headers: authHeaders() });
      await fetchDemands();
      setPage(p => Math.min(p, Math.max(1, Math.ceil((filtered.length - 1) / perPage))));
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Delete failed.');
    }
  }

  function downloadExcel() {
    const rows = filtered.map(d => ({
      ID: d.id ?? '',
      Title: d.title,
      Hospital: d.hospital ?? '',
      Vendor: d.vendor ?? '',
      Budget: d.budget ?? '',
      Deadline: d.deadline ?? '',
      Status: d.status ?? '',
      Level: d.level ?? '',
      Skills: d.skills ?? ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Demands');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'Demands.xlsx');
  }

  function resetForm() {
    setForm({
      title: '',
      hospital: '',
      vendor: '',
      budget: undefined,
      deadline: '',
      status: 'open',
      level: 'mid',
      skills: '',
      description: ''
    });
  }

  return (
    <div className="p-0">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-xl font-semibold text-gray-100">Demands</h2>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search demand..."
            className="h-9 w-64 px-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setIsAdd(true)}
            className="h-9 px-4 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium shadow"
          >
            Add Demand
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

      {/* Table */}
      <div className="overflow-auto rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#1d4ed8]">
              <th className="text-left text-white text-[13px] font-bold px-4 py-3 border border-[#e5e7eb]">ID</th>
              <th className="text-left text-white text-[13px] font-bold px-4 py-3 border border-[#e5e7eb]">Title</th>
              <th className="text-left text-white text-[13px] font-bold px-4 py-3 border border-[#e5e7eb]">Hospital</th>
              <th className="text-left text-white text-[13px] font-bold px-4 py-3 border border-[#e5e7eb]">Vendor</th>
              <th className="text-left text-white text-[13px] font-bold px-4 py-3 border border-[#e5e7eb]">Status</th>
              <th className="text-left text-white text-[13px] font-bold px-4 py-3 border border-[#e5e7eb]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[#475569] border border-[#e5e7eb]">
                  Loading...
                </td>
              </tr>
            ) : current.length > 0 ? (
              current.map(d => (
                <tr key={String(d.id)} className="hover:bg-[#f1f5f9]">
                  <td className="px-4 py-3 text-[#0f172a] border border-[#e5e7eb]">{d.id ?? '-'}</td>
                  <td className="px-4 py-3 text-[#0f172a] border border-[#e5e7eb]">{d.title}</td>
                  <td className="px-4 py-3 text-[#0f172a] border border-[#e5e7eb]">{d.hospital || '-'}</td>
                  <td className="px-4 py-3 text-[#0f172a] border border-[#e5e7eb]">{d.vendor || '-'}</td>
                  <td className="px-4 py-3 text-[#0f172a] border border-[#e5e7eb]">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${d.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>
                      {d.status || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 border border-[#e5e7eb]">
                    <div className="flex gap-2">
                      <button className="h-8 px-3 rounded-full bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-semibold shadow-sm transition-colors" onClick={() => setView(d)}>
                        View
                      </button>
                      <button
                        className="h-8 px-3 rounded-full bg-[#10b981] hover:bg-[#059669] text-white text-sm font-semibold shadow-sm transition-colors"
                        onClick={() => {
                          setEdit(d);
                          setForm({
                            title: d.title,
                            hospital: d.hospital || '',
                            vendor: d.vendor || '',
                            budget: d.budget,
                            deadline: d.deadline || '',
                            status: (d.status as any) || 'open',
                            level: (d.level as any) || 'mid',
                            skills: d.skills || '',
                            description: d.description || ''
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button className="h-8 px-3 rounded-full bg-[#f43f5e] hover:bg-[#e11d48] text-white text-sm font-semibold shadow-sm transition-colors" onClick={() => onDelete(d.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center italic text-[#64748b] border border-[#e5e7eb]">
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
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl">
          <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Add Demand</h2>
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
            <h2 className="text-2xl font-bold text-gray-800">Demand Details</h2>
            <button onClick={() => setView(null)} className="text-gray-500 hover:text-gray-700">✖</button>
          </div>
          {view && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Summary">
                <Row label="ID" value={String(view.id ?? '-')} />
                <Row label="Title" value={view.title} />
                <Row label="Hospital" value={view.hospital || '-'} />
                <Row label="Vendor" value={view.vendor || '-'} />
                <Row label="Status" value={view.status || '-'} />
                <Row label="Level" value={view.level || '-'} />
              </Card>
              <Card title="Details">
                <Row label="Budget" value={view.budget != null ? String(view.budget) : '-'} />
                <Row label="Deadline" value={view.deadline || '-'} />
                <Row label="Skills" value={view.skills || '-'} />
                <Row label="Description" value={view.description || '-'} />
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
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl">
          <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Edit Demand</h2>
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

function FormGrid({ form, onChange }: { form: Demand; onChange: (e: any) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <Field label="Title">
        <input name="title" value={form.title} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" required />
      </Field>
      <Field label="Hospital">
        <input name="hospital" value={form.hospital || ''} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" />
      </Field>
      <Field label="Vendor">
        <input name="vendor" value={form.vendor || ''} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" />
      </Field>
      <Field label="Budget (₹)">
        <input name="budget" type="number" value={form.budget ?? ''} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" />
      </Field>
      <Field label="Deadline">
        <input name="deadline" type="date" value={form.deadline || ''} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" />
      </Field>
      <Field label="Status">
        <select name="status" value={form.status ?? 'open'} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500">
          <option value="open">open</option>
          <option value="in_progress">in_progress</option>
          <option value="closed">closed</option>
        </select>
      </Field>
      <Field label="Level">
        <select name="level" value={form.level ?? 'mid'} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500">
          <option value="junior">junior</option>
          <option value="mid">mid</option>
          <option value="senior">senior</option>
        </select>
      </Field>
      <div className="md:col-span-2">
        <Field label="Skills (comma-separated)">
          <input name="skills" value={form.skills || ''} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Description">
          <textarea name="description" value={form.description || ''} onChange={onChange} className="w-full min-h-[90px] p-3 rounded border focus:ring-2 focus:ring-blue-500" />
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
