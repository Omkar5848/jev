import React, { useEffect, useMemo, useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import api from '@/utils/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

type Doctor = {
  id?: number | string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  hospital?: string;
  rating?: number;
  available?: boolean;
};

type Props = { onBack?: () => void };

function authHeaders() {
  if (typeof window === 'undefined') return {};
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function DoctorsTableSection({ onBack }: Props) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [isAdd, setIsAdd] = useState(false);
  const [view, setView] = useState<Doctor | null>(null);
  const [edit, setEdit] = useState<Doctor | null>(null);

  const [form, setForm] = useState<Doctor>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: '',
    hospital: '',
    rating: undefined,
    available: true
  });
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const perPage = 5;

  async function fetchDoctors() {
    setLoading(true);
    try {
      const res = await api.get('/api/doctors', { headers: authHeaders() });
      const data: Doctor[] = (res.data || []).map((d: any) => ({
        id: d.id ?? d.doctorId ?? d._id,
        firstName: d.firstName ?? d.name ?? '',
        lastName: d.lastName ?? '',
        email: d.email ?? '',
        phone: d.phone ?? '',
        specialization: d.specialization ?? d.speciality ?? '',
        hospital: d.hospital ?? d.hospitalName ?? '',
        rating: typeof d.rating === 'number' ? d.rating : undefined,
        available: typeof d.available === 'boolean' ? d.available : d.availabilityStatus === 'available'
      }));
      setDoctors(data);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to load doctors.');
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchDoctors(); }, []);

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return doctors;
    return doctors.filter((d: Doctor) =>
      `${d.firstName} ${d.lastName ?? ''} ${d.email ?? ''} ${d.phone ?? ''} ${d.specialization ?? ''} ${d.hospital ?? ''} ${(d.available ? 'available' : 'unavailable')}`
        .toLowerCase()
        .includes(s)
    );
  }, [doctors, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const firstIndex = (page - 1) * perPage;
  const current = filtered.slice(firstIndex, firstIndex + perPage);

  function prev() { if (page > 1) setPage(p => p - 1); }
  function next() { if (page < totalPages) setPage(p => p + 1); }

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type, checked } = e.target as any;
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'rating') {
      setForm(prev => ({ ...prev, rating: value === '' ? undefined : Number(value) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const res = await api.post('/api/doctors', form, { headers: authHeaders() });
      const created = res.data as any;
      setDoctors(prev => [normalizeDoctor(created), ...prev]);
      setIsAdd(false);
      resetForm();
      setPage(1);
      await fetchDoctors();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Add failed.');
    } finally { setSaving(false); }
  }

  async function onUpdate(e: React.FormEvent) {
    e.preventDefault(); if (!edit?.id) return;
    setSaving(true);
    try {
      const res = await api.put(`/api/doctors/${edit.id}`, form, { headers: authHeaders() });
      const updated = normalizeDoctor(res.data);
      setDoctors(prev => prev.map(d => (d.id === updated.id ? updated : d)));
      setEdit(null);
      await fetchDoctors();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Update failed.');
    } finally { setSaving(false); }
  }

  async function onDelete(id?: number | string) {
    if (!id) return;
    if (!confirm('Delete this doctor?')) return;
    try {
      await api.delete(`/api/doctors/${id}`, { headers: authHeaders() });
      setDoctors(prev => prev.filter(d => d.id !== id));
      await fetchDoctors();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Delete failed.');
    }
  }

  function resetForm() {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialization: '',
      hospital: '',
      rating: undefined,
      available: true
    });
  }

  function normalizeDoctor(x: any): Doctor {
    return {
      id: x.id ?? x.doctorId ?? x._id,
      firstName: x.firstName ?? x.name ?? '',
      lastName: x.lastName ?? '',
      email: x.email ?? '',
      phone: x.phone ?? '',
      specialization: x.specialization ?? x.speciality ?? '',
      hospital: x.hospital ?? x.hospitalName ?? '',
      rating: typeof x.rating === 'number' ? x.rating : undefined,
      available: typeof x.available === 'boolean' ? x.available : x.availabilityStatus === 'available'
    };
  }

  function downloadExcel() {
    const rows = filtered.map((d: Doctor) => ({
      ID: d.id ?? '',
      Name: `${d.firstName}${d.lastName ? ' ' + d.lastName : ''}`,
      Email: d.email ?? '',
      Phone: d.phone ?? '',
      Specialization: d.specialization ?? '',
      Hospital: d.hospital ?? '',
      Rating: d.rating ?? '',
      Available: d.available ? 'Yes' : 'No'
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Doctors');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'Doctors.xlsx');
  }

  return (
    <div className="p-0">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-xl font-semibold text-gray-100">Doctors</h2>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search doctor..."
            className="h-9 w-64 px-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setIsAdd(true)}
            className="h-9 px-4 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-medium shadow"
          >
            Add Doctor
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

      {/* Table (rounded, outer/inner borders, blue header) */}
      <div className="overflow-auto rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#1d4ed8]">
              <th className="text-left text-white text-[13px] font-bold px-4 py-3 border border-[#e5e7eb]">ID</th>
              <th className="text-left text-white text-[13px] font-bold px-4 py-3 border border-[#e5e7eb]">Name</th>
              <th className="text-left text-white text-[13px] font-bold px-4 py-3 border border-[#e5e7eb]">Email</th>
              <th className="text-left text-white text-[13px] font-bold px-4 py-3 border border-[#e5e7eb]">Specialization</th>
              <th className="text-left text-white text-[13px] font-bold px-4 py-3 border border-[#e5e7eb]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[#475569] border border-[#e5e7eb]">
                  Loading...
                </td>
              </tr>
            ) : current.length > 0 ? (
              current.map((d: Doctor) => (
                <tr key={String(d.id)} className="hover:bg-[#f1f5f9]">
                  <td className="px-4 py-3 text-[#0f172a] border border-[#e5e7eb]">{d.id ?? '-'}</td>
                  <td className="px-4 py-3 text-[#0f172a] border border-[#e5e7eb]">
                    {`${d.firstName}${d.lastName ? ' ' + d.lastName : ''}`}
                  </td>
                  <td className="px-4 py-3 text-[#0f172a] border border-[#e5e7eb]">{d.email || '-'}</td>
                  <td className="px-4 py-3 text-[#0f172a] border border-[#e5e7eb]">{d.specialization || '-'}</td>
                  <td className="px-4 py-3 border border-[#e5e7eb]">
                    <div className="flex gap-2">
                      {/* View: Indigo pill */}
                      <button
                        className="h-8 px-3 rounded-full bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-semibold shadow-sm transition-colors"
                        onClick={() => setView(d)}
                      >
                        View
                      </button>
                      {/* Edit: Emerald pill */}
                      <button
                        className="h-8 px-3 rounded-full bg-[#10b981] hover:bg-[#059669] text-white text-sm font-semibold shadow-sm transition-colors"
                        onClick={() => {
                          setEdit(d);
                          setForm({
                            firstName: d.firstName,
                            lastName: d.lastName || '',
                            email: d.email || '',
                            phone: d.phone || '',
                            specialization: d.specialization || '',
                            hospital: d.hospital || '',
                            rating: d.rating,
                            available: d.available ?? true
                          });
                        }}
                      >
                        Edit
                      </button>
                      {/* Delete: Rose pill */}
                      <button
                        className="h-8 px-3 rounded-full bg-[#f43f5e] hover:bg-[#e11d48] text-white text-sm font-semibold shadow-sm transition-colors"
                        onClick={() => onDelete(d.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center italic text-[#64748b] border border-[#e5e7eb]">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination strip */}
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
          <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Add Doctor</h2>
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
            <h2 className="text-2xl font-bold text-gray-800">Doctor Details</h2>
            <button onClick={() => setView(null)} className="text-gray-500 hover:text-gray-700">✖</button>
          </div>
          {view && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Basic Information">
                <Row label="ID" value={String(view.id ?? '-')} />
                <Row label="Name" value={`${view.firstName}${view.lastName ? ' ' + view.lastName : ''}`} />
                <Row label="Email" value={view.email || '-'} />
                <Row label="Phone" value={view.phone || '-'} />
              </Card>
              <Card title="Professional">
                <Row label="Specialization" value={view.specialization || '-'} />
                <Row label="Hospital" value={view.hospital || '-'} />
                <Row label="Rating" value={String(view.rating ?? '-')} />
                <Row label="Available" value={view.available ? 'Yes' : 'No'} />
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
          <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Edit Doctor</h2>
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

function FormGrid({ form, onChange }: { form: Doctor; onChange: (e: any) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <Field label="First Name">
        <input name="firstName" value={form.firstName} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" required />
      </Field>
      <Field label="Last Name">
        <input name="lastName" value={form.lastName || ''} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" />
      </Field>
      <Field label="Email">
        <input name="email" type="email" value={form.email || ''} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" />
      </Field>
      <Field label="Phone">
        <input name="phone" value={form.phone || ''} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" />
      </Field>
      <Field label="Specialization">
        <input name="specialization" value={form.specialization || ''} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" />
      </Field>
      <Field label="Hospital">
        <input name="hospital" value={form.hospital || ''} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" />
      </Field>
      <Field label="Rating">
        <input name="rating" type="number" value={form.rating ?? ''} onChange={onChange} className="w-full h-9 px-3 rounded border focus:ring-2 focus:ring-blue-500" />
      </Field>
      <div className="md:col-span-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="available" checked={!!form.available} onChange={onChange} />
          <span>Available</span>
        </label>
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
