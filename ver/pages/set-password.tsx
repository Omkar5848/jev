import React, { useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/utils/api';
import styles from '@/styles/Auth.module.css'; 

export default function SetPassword() {
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pass !== confirm) return alert("Passwords don't match");

    try {
      const token = localStorage.getItem('token');
      await api.post('/api/auth/set-password', { newPassword: pass }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Password set successfully!');
      router.push('/dashboard');
    } catch (e) {
      alert('Failed to set password');
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Set New Password</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.group}>
            <label>New Password</label>
            <input className={styles.formInput} type="password" value={pass} onChange={e => setPass(e.target.value)} required />
          </div>
          <div className={styles.group}>
            <label>Confirm Password</label>
            <input className={styles.formInput} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          <button type="submit" className={styles.btn}>Save Password</button>
        </form>
      </div>
    </div>
  );
}