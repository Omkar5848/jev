import { FormEvent, useState } from 'react';
import styles from '@/styles/Auth.module.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { resetPassword } from '@/utils/api';

export default function ResetPassword() {
  const router = useRouter();
  const email = (router.query.email as string) || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string|undefined>(undefined);
  const [error, setError] = useState<string|undefined>(undefined);

  async function onSubmit(e: FormEvent) {
  e.preventDefault();
  if (password !== confirm) { setError('Passwords do not match'); return; }
  setLoading(true); setError(undefined); setMsg(undefined);
  try {
    const out = await resetPassword(email, password);
    setMsg(out?.message || 'Password reset! Redirecting to login...');
    setTimeout(()=>router.push('/login'), 800);
  } catch (err: any) {
    const msg = err?.response?.data?.error || err?.message || 'Reset failed';
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
          <input className={styles.input} placeholder="New Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
          <input className={styles.input} placeholder="Confirm Password" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/>
          <button className={styles.button} disabled={loading}>{loading ? 'Saving...' : 'Reset Password'}</button>
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
