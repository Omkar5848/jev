import { FormEvent, useState } from 'react';
import styles from '@/styles/Auth.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import api from '@/utils/api';

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
  const [profession, setProfession] =
    useState<'doctor' | 'nurse' | 'technician' | 'receptionist'>('doctor');
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
        name, email, password, profession
      });

      const token: string | undefined = res.data?.token;
      const user: AuthUser | undefined = res.data?.user;

      if (typeof window !== 'undefined' && token) {
        localStorage.setItem('token', token);
      }
      if (user?.role) localStorage.setItem('role', user.role);
      if (user?.doctorId != null) localStorage.setItem('doctorId', String(user.doctorId));

      if (token) {
        // Auto-login path with role-based routing
        if (user?.role === 'Doctor') {
          setMsg('Registered successfully. Redirecting to doctor dashboard...');
          router.push('/doctor/overview');
        } else {
          setMsg('Registered successfully. Redirecting...');
          router.push('/dashboard');
        }
        return;
      }

      // Fallback: no token returned -> go to login
      setMsg('Registered! You can now login.');
      setTimeout(() => router.push('/login'), 800);
    } catch (err: any) {
      // Clear any stale keys on failure
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
          <input
            className={styles.input}
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            className={styles.input}
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className={styles.input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <input
            className={styles.input}
            placeholder="Confirm Password"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
          <select
            className={styles.input}
            value={profession}
            onChange={e => setProfession(e.target.value as any)}
          >
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="technician">Technician</option>
            <option value="receptionist">Receptionist</option>
          </select>

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
