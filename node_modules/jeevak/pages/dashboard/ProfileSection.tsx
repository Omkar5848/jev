import { useState, useEffect } from 'react';
import styles from '@/styles/Dashboard.module.css';
import api, { getProfile, updateProfile, uploadAvatar, sendOtp } from '@/utils/api';
import { FaCheckCircle, FaExclamationTriangle, FaCamera } from 'react-icons/fa';

export default function ProfileSection() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  
  // Avatar States
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg] = useState<{ text: string, type: 'success'|'error' } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const u = await getProfile();
      setUser(u);
      setName(u.name);
      setProfession(u.profession || '');
      setPreview(u.avatarUrl);
    } catch (e) {}
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Optimistic Preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setMsg(null);

    try {
      const res = await uploadAvatar(file);
      setPreview(res.avatarUrl); // Confirm with server URL
      setUser({ ...user, avatarUrl: res.avatarUrl });
      setMsg({ text: 'Avatar updated!', type: 'success' });
    } catch (err) {
      setMsg({ text: 'Upload failed', type: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function handleUpdate() {
    setMsg(null);
    try {
      await updateProfile({ name, profession });
      setMsg({ text: 'Profile updated!', type: 'success' });
      loadProfile(); // Refresh
    } catch (err) {
      setMsg({ text: 'Update failed', type: 'error' });
    }
  }

  async function handleSendOtp() {
    if(!user?.email) return;
    setMsg(null);
    try {
      await sendOtp(user.email);
      setOtpSent(true);
      setMsg({ text: 'OTP sent to your email', type: 'success' });
    } catch (err) {
      setMsg({ text: 'Failed to send OTP', type: 'error' });
    }
  }

  async function handleVerify() {
    setVerifying(true);
    setMsg(null);
    try {
      // Direct call since we haven't added this wrapper to api.ts yet
      await api.post('/api/auth/verify-email', { otp });
      setUser({ ...user, isEmailVerified: true });
      setOtpSent(false);
      setMsg({ text: 'Email Verified Successfully!', type: 'success' });
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || 'Verification failed', type: 'error' });
    } finally {
      setVerifying(false);
    }
  }

  if (!user) return <div className={styles.loading}>Loading Profile...</div>;

  return (
    <div className={styles.sectionCard}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>My Profile</h2>
          <p className={styles.cardSubtitle}>Manage your personal information and security</p>
        </div>
        {user.isEmailVerified ? (
          <span className={`${styles.statusPill} ${styles.statusActive}`}>
            <FaCheckCircle /> Verified
          </span>
        ) : (
          <span className={`${styles.statusPill} ${styles.pending}`} style={{background:'#fff3cd', color:'#856404'}}>
            <FaExclamationTriangle /> Unverified
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Left Column: Avatar & Verification */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <img 
              src={preview || '/default-avatar.png'} 
              className={styles.userAvatar} 
              style={{ width: 150, height: 150, fontSize: '3rem' }} 
              alt="Profile"
            />
            <label 
              style={{
                position: 'absolute', bottom: 5, right: 5, 
                background: 'var(--color-primary)', color: '#fff', 
                padding: 10, borderRadius: '50%', cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
              }}
            >
              <FaCamera />
              <input type="file" hidden accept="image/*" onChange={handleUpload} />
            </label>
          </div>
          {uploading && <small>Uploading...</small>}

          {/* Email Verification Box */}
          {!user.isEmailVerified && (
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.1)', 
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '1.5rem', borderRadius: '12px', width: '100%', textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 0.5rem', color: '#b45309' }}>Verify your Email</h4>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>
                To secure your account, please verify <strong>{user.email}</strong>
              </p>
              
              {!otpSent ? (
                <button className={styles.btnSecondary} onClick={handleSendOtp}>
                  Send Verification Code
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <input 
                    className={styles.formInput} 
                    style={{ width: 100, textAlign: 'center' }} 
                    placeholder="123456"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                  />
                  <button className={styles.submitBtn} onClick={handleVerify} disabled={verifying}>
                    {verifying ? '...' : 'Verify'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Details Form */}
        <div className={styles.entityForm}>
          <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
            <div>
              <label className={styles.formSectionTitle}>Full Name</label>
              <input 
                className={styles.formInput} 
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
            </div>
            <div>
              <label className={styles.formSectionTitle}>Email</label>
              <input 
                className={styles.formInput} 
                value={user.email} 
                disabled 
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>
            <div>
              <label className={styles.formSectionTitle}>Role / Profession</label>
              <input 
                className={styles.formInput} 
                value={profession} 
                onChange={e => setProfession(e.target.value)} 
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {msg ? (
              <span style={{ 
                color: msg.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                fontWeight: 600 
              }}>
                {msg.text}
              </span>
            ) : <span />}
            
            <button className={styles.submitBtn} onClick={handleUpdate}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}