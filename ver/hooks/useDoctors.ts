import { useEffect, useMemo, useState } from 'react';
import api from '@/utils/api';

export type Doctor = {
  // Doctor Details
  id?: string | number;
  doctorCode?: string;
  firstName: string;
  lastName: string;
  gender?: 'male' | 'female' | 'other';
  dob?: string;
  email?: string;
  phone?: string;
  altPhone?: string;
  specialization?: string;
  subSpecialties?: string[];      // CSV server side
  qualifications?: string;        // free text
  registrationNumber?: string;
  practicingFrom?: string;
  languages?: string[];           // CSV server side

  // Appointment Information
  availabilityStatus?: 'available' | 'busy' | 'offline';
  slotDurationMin?: number;
  clinicDays?: string[];          // Mon,Tue...
  startTime?: string;             // "09:00"
  endTime?: string;               // "17:00"
  allowDoubleBooking?: boolean;
  maxDailyAppointments?: number;

  // Work & Performance
  hospitalName?: string;
  department?: string;
  workArea?: string;
  rating?: number;
  totalAppointments?: number;
  lastMonthAppointments?: number;
  onCall?: boolean;

  // Medical Data (links/metadata)
  patientPanelCount?: number;
  emrSystemId?: string;
  notes?: string;

  createdAt?: string;
  updatedAt?: string;
};

function authHeaders() {
  if (typeof window === 'undefined') return {};
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const emptyDoctor: Doctor = {
  firstName: '',
  lastName: '',
  specialization: '',
  hospitalName: '',
  availabilityStatus: 'available',
  slotDurationMin: 15,
  clinicDays: ['Mon','Tue','Wed','Thu','Fri'],
  startTime: '09:00',
  endTime: '17:00',
  onCall: false,
  allowDoubleBooking: false
};

export function useDoctors(globalQuery: string) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState<Doctor>(emptyDoctor);
  const [editingId, setEditingId] = useState<string | number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function fetchDoctors() {
    try {
      const res = await api.get('/api/doctors', { headers: authHeaders(), params: { q: globalQuery || undefined } });
      const arr = (res.data || []).map((d: any) => ({
        ...d,
        subSpecialties: typeof d.subSpecialties === 'string' ? d.subSpecialties.split(',').map((s:string)=>s.trim()).filter(Boolean) : d.subSpecialties,
        languages: typeof d.languages === 'string' ? d.languages.split(',').map((s:string)=>s.trim()).filter(Boolean) : d.languages,
        clinicDays: typeof d.clinicDays === 'string' ? d.clinicDays.split(',').map((s:string)=>s.trim()).filter(Boolean) : d.clinicDays,
      }));
      setDoctors(arr);
    } catch (err) { console.error(err); }
  }

  useEffect(() => { fetchDoctors(); }, [globalQuery]);

  function onChange(e: any) {
    const { name, value, type, checked } = e.target;
    if (['slotDurationMin','maxDailyAppointments','rating','totalAppointments','lastMonthAppointments'].includes(name)) {
      const n = value === '' ? undefined : Number(value);
      setForm({ ...form, [name]: Number.isNaN(n) ? undefined : n });
    } else if (name === 'clinicDaysCsv') {
      setForm({ ...form, clinicDays: value.split(',').map((s:string)=>s.trim()).filter(Boolean) });
    } else if (name === 'languagesCsv') {
      setForm({ ...form, languages: value.split(',').map((s:string)=>s.trim()).filter(Boolean) });
    } else if (name === 'subSpecialtiesCsv') {
      setForm({ ...form, subSpecialties: value.split(',').map((s:string)=>s.trim()).filter(Boolean) });
    } else if (type === 'checkbox') {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  function toPayload(d: Doctor) {
    return {
      ...d,
      subSpecialties: (d.subSpecialties || []).join(','),
      languages: (d.languages || []).join(','),
      clinicDays: (d.clinicDays || []).join(','),
    };
  }

  async function onSubmit(e: any) {
    e.preventDefault(); setSaving(true);
    try {
      const payload = toPayload(form);
      if (editingId !== undefined) {
        await api.put(`/api/doctors/${editingId}`, payload, { headers: authHeaders() });
        setEditingId(undefined);
      } else {
        await api.post('/api/doctors', payload, { headers: authHeaders() });
      }
      setForm(emptyDoctor);
      await fetchDoctors();
    } catch (err) { console.error(err); alert('Failed to save doctor'); }
    finally { setSaving(false); }
  }

  function onEdit(item: Doctor) { setEditingId(item.id!); setForm({ ...emptyDoctor, ...item }); }

  async function onDelete(id?: string | number) {
    if (!id) return; if (!confirm('Delete this doctor?')) return;
    try { await api.delete(`/api/doctors/${id}`, { headers: authHeaders() }); await fetchDoctors(); }
    catch (err) { console.error(err); alert('Failed to delete doctor'); }
  }

  const filtered = useMemo(() => {
    const q = (globalQuery || '').trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter(d => {
      const pool = [
        d.firstName, d.lastName, d.specialization, (d.subSpecialties||[]).join(' '),
        d.hospitalName, d.department, d.workArea, d.email, d.phone, d.availabilityStatus
      ].filter(Boolean).join(' ').toLowerCase();
      return pool.includes(q);
    });
  }, [doctors, globalQuery]);

  return { doctors, filtered, form, setForm, editingId, setEditingId, saving, onChange, onSubmit, onEdit, onDelete };
}
