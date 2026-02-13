import { FormEvent, useState } from 'react';
import styles from '@/styles/Auth.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import api from '@/utils/api';
import ThemeToggle from '@/components/ThemeToggle';

type AuthUser = {
  id: number | string;
  name: string;
  email: string;
  profession?: string;
  role?: string;
  doctorId?: number | string | null;
};

const routeByRole = (role?: string) => {
  if (role === 'Doctor') return '/doctor/overview';
  if (role === 'Nurse') return '/nurse/dashboard';
  if (role === 'Technician') return '/technician/dashboard';
  if (role === 'Patient') return '/patient/dashboard';
  if (role === 'LocalAgency') return '/local-agency/dashboard';
  return '/dashboard';
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>(undefined);
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

  async function sendOtp() {
    setError(undefined);
    setMessage(undefined);
    if (!email) {
      setError('Enter email first');
      return;
    }
    try {
      await api.post('/api/auth/send-otp', { email });
      setOtpSent(true);
      setMessage('OTP sent to your email.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to send OTP');
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setLoading(true);
    try {
      if (!password && !otp) {
        setError('Enter password or OTP to continue');
        setLoading(false);
        return;
      }

      const res = await api.post('/api/auth/login', {
        email,
        ...(password ? { password } : {}),
        ...(otp ? { otp } : {}),
      });
      const token: string | undefined = res.data?.token;
      const user: AuthUser | undefined = res.data?.user;

      if (typeof window !== 'undefined' && token) {
        localStorage.setItem('token', token);
      }

      let u: AuthUser | null | undefined = user;
      if (!u && token) u = await resolveUserFromMe();

      if (u?.role) localStorage.setItem('role', u.role);
      if (u?.doctorId != null) localStorage.setItem('doctorId', String(u.doctorId));

      router.push(routeByRole(u?.role));
    } catch (err: any) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('doctorId');
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Invalid credentials');
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
          <p className={styles.subtitle}>Sign in with password OR OTP</p>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input className={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@hospital.com" required />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input className={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password (optional if using OTP)" />
          </div>


          <p className={styles.subtitle} style={{ fontSize: "0.85rem", marginTop: -4 }}>Use at least one method: Password or OTP.</p>

          <div className={styles.inputGroup}>
            <label className={styles.label}>OTP</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className={styles.input} value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP (optional if using password)" />
              <button type="button" className={styles.button} style={{ width: '40%' }} onClick={sendOtp}>
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>
            </div>
          </div>

          {message && <div className={styles.success}>{message}</div>}
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
