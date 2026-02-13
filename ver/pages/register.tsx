import { FormEvent, useState } from 'react';
import styles from '@/styles/Auth.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import api from '@/utils/api';

type Profession = 'doctor' | 'nurse' | 'technician' | 'patient' | 'local_agency' | 'admin';

type AuthUser = {
  id: number | string;
  name: string;
  email: string;
  profession?: string;
  role?: string;
  doctorId?: number | string | null;
};

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [profession, setProfession] = useState<Profession>('patient');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setMsg(undefined);

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        name, email, password, profession,
        ...(profession === 'admin' ? { adminKey } : {}),
      });

      const token: string | undefined = res.data?.token;
      const user: AuthUser | undefined = res.data?.user;
      const requiresApproval = Boolean(res.data?.requiresApproval);

      if (requiresApproval) {
        setMsg('Registration submitted. Please wait for admin approval before login.');
        setTimeout(() => router.push('/login'), 1200);
        return;
      }

      if (typeof window !== 'undefined' && token) {
        localStorage.setItem('token', token);
      }
      if (user?.role) localStorage.setItem('role', user.role);
      if (user?.doctorId != null) localStorage.setItem('doctorId', String(user.doctorId));

      if (token && user?.role === 'Doctor') {
        setMsg('Registered successfully. Redirecting to doctor dashboard...');
        router.push('/doctor/overview');
        return;
      }
      if (token && user?.role === 'Admin') {
        router.push('/dashboard');
        return;
      }

      setMsg('Registered successfully. Please login after admin approval.');
      setTimeout(() => router.push('/login'), 1000);
    } catch (err: any) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('doctorId');

      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className="logo">Jeevak</h1>
        <form onSubmit={onSubmit}>
          <input className={styles.input} placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
          <input className={styles.input} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className={styles.input} placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <input className={styles.input} placeholder="Confirm Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          <select className={styles.input} value={profession} onChange={e => setProfession(e.target.value as Profession)}>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="technician">Technician</option>
            <option value="local_agency">Local Agency</option>
            <option value="admin">Admin</option>
          </select>

          {profession === 'admin' && (
            <input
              className={styles.input}
              placeholder="Admin key"
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              required
            />
          )}

          <button className={styles.button} disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        {msg && <p className={styles.success}>{msg}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <p className={styles.linkRow} style={{ justifyContent: 'center' }}>
          <Link href="/login">Already registered? Login</Link>
        </p>
      </div>
    </div>
  );
}
