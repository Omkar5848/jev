// ver/pages/login.tsx
import { FormEvent, useState } from 'react';
import styles from '@/styles/Auth.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import api from '@/utils/api';
import ThemeToggle from '@/components/ThemeToggle'; // Make sure this import works

type AuthUser = {
  id: number | string;
  name: string;
  email: string;
  profession?: string;
  role?: string;
  doctorId?: number | string | null;
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const router = useRouter();

  async function resolveUserFromMe(): Promise<AuthUser | null> {
    try {
      const me = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      return me.data as AuthUser;
    } catch {
      return null;
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const token: string | undefined = res.data?.token;
      const user: AuthUser | undefined = res.data?.user;

      if (typeof window !== 'undefined' && token) {
        localStorage.setItem('token', token);
      }

      let u: AuthUser | null | undefined = user;
      if (!u && token) {
        u = await resolveUserFromMe();
      }

      if (u?.role) localStorage.setItem('role', u.role);
      if (u?.doctorId != null) localStorage.setItem('doctorId', String(u.doctorId));

      if (u?.role === 'Doctor') {
        router.push('/doctor/overview');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      localStorage.removeItem('role');
      localStorage.removeItem('doctorId');
      setError(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <ThemeToggle />
      </div>
      
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo}>Jeevak</h1>
          <p className={styles.subtitle}>Sign in to access your dashboard</p>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="doctor@hospital.com"
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.button} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.linkRow}>
          <Link href="/forgot" className={styles.link}>Forgot password?</Link>
          <Link href="/register" className={styles.link}>Create account</Link>
        </div>

        <Link href="/" className={styles.backHome}>&larr; Back to Home</Link>
      </div>
    </div>
  );
}