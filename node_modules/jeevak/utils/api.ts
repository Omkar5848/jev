import axios from 'axios';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE?.trim() || 'http://localhost:5000');

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('token');
    if (t) {
      config.headers = config.headers || {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${t}`;
    }
  }
  return config;
});

// Auth
export async function login(email: string, password: string) {
  const res = await api.post('/api/auth/login', { email, password });
  const data = res.data;
  if (data?.token) localStorage.setItem('token', data.token);
  if (data?.role) localStorage.setItem('role', data.role);
  if (data?.displayName) localStorage.setItem('displayName', data.displayName);
  return data;
}

export async function register(payload: { name: string; email: string; password: string; profession?: string; }) {
  const res = await api.post('/api/auth/register', payload);
  const data = res.data;
  if (data?.token) localStorage.setItem('token', data.token);
  if (data?.role) localStorage.setItem('role', data.role);
  if (data?.displayName) localStorage.setItem('displayName', data.displayName);
  return data;
}


export async function me() {
  const res = await api.get('/api/auth/me');
  return res.data;
}

// Generic poster (kept for other calls — requires full path)
export async function postJson<T = any>(fullPath: string, body: unknown) {
  const res = await api.post<T>(fullPath, body);
  return res.data;
}

// Forgot password helpers (use these to avoid wrong paths)
export async function sendOtp(email: string) {
  const res = await api.post('/api/auth/send-otp', { email });
  return res.data as { message: string };
}

export async function verifyOtpApi(email: string, otp: string) {
  const res = await api.post('/api/auth/verify-otp', { email, otp });
  return res.data as { message: string };
}

export async function resetPassword(email: string, password: string) {
  const res = await api.post('/api/auth/reset', { email, password });
  return res.data as { message: string };
}

// Settings helpers
export async function getProfile() {
  const res = await api.get('/api/auth/me');
  return res.data;
}

export async function updateProfile(payload: { name?: string; profession?: string }) {
  const res = await api.patch('/api/users/profile', payload);
  return res.data;
}

export async function uploadAvatar(file: File) {
  const form = new FormData();
  form.append('avatar', file);
  const res = await api.post('/api/users/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}


export default api;
