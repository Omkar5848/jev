import { FormEvent, useState } from 'react';
import styles from '@/styles/Auth.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { verifyOtpApi } from '@/utils/api';
import api, { sendOtp } from '@/utils/api';

export default function VerifyOTP() {
  const router = useRouter();
  const email = (router.query.email as string) || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string|undefined>(undefined);
  const [error, setError] = useState<string|undefined>(undefined);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError(undefined); setMsg(undefined);
    const out = await verifyOtpApi(email, otp);
    setMsg(out?.message || 'OTP verified');
    router.push({ pathname: '/forgot/reset', query: { email } });
    const res = await fetch('/api/auth/verify-otp', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error||'OTP invalid'); return; }
    setMsg('Verified! Proceeding to reset password...');
    setTimeout(()=>router.push({ pathname:'/forgot/reset', query:{ email } }), 600);
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className="logo">Jeevak</h1>
        <form onSubmit={onSubmit}>
          <input className={styles.input} placeholder="Enter OTP" value={otp} onChange={e=>setOtp(e.target.value)} required/>
          <button className={styles.button} disabled={loading}>{loading ? 'Checking...' : 'Verify OTP'}</button>
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
