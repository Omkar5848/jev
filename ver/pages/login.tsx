import { FormEvent, useState } from 'react';
import styles from '@/styles/Auth.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import api from '@/utils/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function Login() {
  // Login Method Toggle: 'password' or 'otp'
  const [method, setMethod] = useState<'password' | 'otp'>('password');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // OTP Flow Step: 1 = Request OTP, 2 = Verify OTP
  const [step, setStep] = useState(1); 

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // --- 1. REQUEST OTP ---
  async function requestOtp() {
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/login-otp-request', { email });
      setStep(2); // Move to verify step
      alert('OTP sent to your email!');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  // --- 2. SUBMIT LOGIN (Password OR OTP) ---
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      
      if (method === 'password') {
        // A. Standard Login
        const res = await api.post('/api/auth/login', { email, password });
        data = res.data;
      } else {
        // B. OTP Login Verify
        const res = await api.post('/api/auth/login-otp-verify', { email, otp });
        data = res.data;
      }
      
      // Store Token & Role
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      
      if (data.user.doctorId) {
        localStorage.setItem('doctorId', String(data.user.doctorId));
      }

      // --- REDIRECT LOGIC ---
      
      // 1. If user needs to set password (e.g. new patient via OTP)
      if (data.requiresPasswordSet) {
          router.push('/set-password');
          return;
      }

      // 2. Standard Role Redirects
      const role = data.user.role;
      const profession = data.user.profession;

      if (role === 'Admin' || profession === 'Admin') router.push('/dashboard');
      else if (role === 'Doctor' || profession === 'Doctor') router.push('/doctor/overview');
      else if (profession === 'Nurse') router.push('/nurse/dashboard');
      else if (profession === 'Technician') router.push('/technician/dashboard');
      else router.push('/patient/dashboard'); // Default Patient

    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>
      
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo}>Jeevak</h1>
          <p className={styles.subtitle}>Secure Access Portal</p>
        </div>

        {/* --- METHOD TOGGLE --- */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
            <button 
                type="button"
                onClick={() => setMethod('password')}
                style={{
                    flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer',
                    borderBottom: method === 'password' ? '2px solid var(--color-primary)' : 'none',
                    fontWeight: method === 'password' ? 'bold' : 'normal',
                    color: method === 'password' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                }}
            >
                Password
            </button>
            <button 
                type="button"
                onClick={() => setMethod('otp')}
                style={{
                    flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer',
                    borderBottom: method === 'otp' ? '2px solid var(--color-primary)' : 'none',
                    fontWeight: method === 'otp' ? 'bold' : 'normal',
                    color: method === 'otp' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                }}
            >
                Login via OTP
            </button>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          
          {/* Email is common for both */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              disabled={loading || (method === 'otp' && step === 2)} // Lock email during OTP verify
            />
          </div>
          
          {/* PASSWORD INPUT */}
          {method === 'password' && (
            <div className={styles.inputGroup}>
                <label className={styles.label}>Password</label>
                <input
                className={styles.input}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                />
            </div>
          )}

          {/* OTP INPUT */}
          {method === 'otp' && step === 2 && (
            <div className={styles.inputGroup}>
                <label className={styles.label}>Enter OTP</label>
                <input
                className={styles.input}
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                placeholder="123456"
                maxLength={6}
                style={{ letterSpacing: '2px', textAlign: 'center', fontSize: '1.2rem' }}
                />
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          {/* BUTTON LOGIC */}
          <div style={{ marginTop: '1rem' }}>
              {method === 'password' ? (
                  <button className={styles.button} disabled={loading}>
                     {loading ? 'Verifying...' : 'Login'}
                  </button>
              ) : step === 1 ? (
                  <button 
                    type="button" 
                    onClick={requestOtp} 
                    className={styles.button} 
                    disabled={loading || !email}
                    style={{ background: '#10b981' }} // Green for "Get OTP"
                   >
                     {loading ? 'Sending...' : 'Get OTP'}
                  </button>
              ) : (
                  <button className={styles.button} disabled={loading}>
                     {loading ? 'Verifying...' : 'Verify & Login'}
                  </button>
              )}
          </div>
        </form>

        <div className={styles.linkRow}>
          {method === 'otp' && step === 2 ? (
             <button onClick={() => setStep(1)} className={styles.link} style={{background:'none', border:'none', cursor:'pointer'}}>
                 Change Email / Resend
             </button>
          ) : (
             <Link href="/forgot" className={styles.link}>Forgot password?</Link>
          )}
          <Link href="/register" className={styles.link}>Register New Account</Link>
        </div>
      </div>
    </div>
  );
}