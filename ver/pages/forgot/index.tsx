import { FormEvent, useState } from 'react';
import styles from '@/styles/Auth.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { postJson } from '@/utils/api';
import { sendOtp } from '@/utils/api';

export default function ForgotEmail() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string|undefined>(undefined);
  const [error, setError] = useState<string|undefined>(undefined);
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
  e.preventDefault();
  setLoading(true); setError(undefined); setMsg(undefined);
  try {
    const out = await sendOtp(email);
    setMsg(out?.message || 'OTP sent');
    router.push({ pathname: '/forgot/otp', query: { email } });
  } catch (err: any) {
    const msg = err?.response?.data?.error || err?.message || 'Request failed';
    setError(msg);
  } finally {
    setLoading(false);
  }
}

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className="logo">Jeevak</h1>
        <form onSubmit={onSubmit}>
          <input className={styles.input} placeholder="Your registered email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
          <button className={styles.button} disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</button>
        </form>
        {error && <div className="small" style={{color:'#c00', marginTop:8}}>{error}</div>}
        {msg && <div className="small" style={{color:'#090', marginTop:8}}>{msg}</div>}
        <div className={styles.linkRow} style={{justifyContent:'center'}}>
          <Link href="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
