// ver/pages/settings.tsx
import { useEffect, useMemo, useState } from 'react';
import styles from '@/styles/dashboard.module.css'; // Using the Dashboard styles for consistency
import { useRouter } from 'next/router';
import { getProfile, updateProfile, uploadAvatar } from '@/utils/api';
import ThemeToggle from '@/components/ThemeToggle'; // Ensure you have this component

type Profile = {
  id: string | number;
  name: string;
  email: string;
  profession?: string;
  role?: string;
  avatarUrl?: string | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await getProfile();
        setProfile(p);
        setName(p?.name || '');
        setProfession(p?.profession || '');
        setPreview(p?.avatarUrl || null);
      } catch {
        router.replace('/login');
      }
    })();
  }, [router]);

  const canSave = useMemo(() => {
    if (!profile) return false;
    return name.trim() !== profile.name || (profession || '') !== (profile.profession || '');
  }, [name, profession, profile]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  }

  async function onUpload() {
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const data = await uploadAvatar(file);
      setPreview(data.avatarUrl);
      setProfile((p) => (p ? { ...p, avatarUrl: data.avatarUrl } : p));
      setMsg({ text: 'Profile photo updated successfully', type: 'success' });
      setFile(null); // Clear file input
    } catch (e: any) {
      setMsg({ text: e?.response?.data?.message || 'Upload failed', type: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    if (!profile) return;
    setSaving(true);
    setMsg(null);
    try {
      const data = await updateProfile({ name, profession });
      setProfile((p) => (p ? { ...p, name: data.name, profession: data.profession } : p));
      setMsg({ text: 'Profile details saved', type: 'success' });
    } catch (e: any) {
      setMsg({ text: e?.response?.data?.message || 'Save failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  const goBack = () => {
    if (profile?.role === 'Doctor') {
      router.push('/doctor/overview');
    } else {
      router.push('/dashboard');
    }
  };

  if (!profile) {
    return (
      <div className={styles.healthcareDashboard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <div className={styles.healthcareDashboard}>
      {/* Reusing Dashboard Header Style for Consistency */}
      <header className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLogo} style={{cursor: 'pointer'}} onClick={goBack}>
             <div className={styles.logoIcon}>←</div>
             <span className={styles.logoText}>Settings</span>
          </div>
          <div className={styles.headerActions}>
             <ThemeToggle />
          </div>
        </div>
      </header>

      <main className={styles.dashboardLayout} style={{ display: 'block', maxWidth: '800px', margin: '0 auto' }}>
        <div className={styles.mainContent} style={{ padding: '2rem 1rem' }}>
          
          <div className={styles.sectionCard} style={{ background: 'var(--color-surface)' }}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Profile Information</h2>
              <p className={styles.sectionDesc}>Update your personal details and avatar.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Avatar Section */}
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={preview || '/default-avatar.png'}
                    alt="Avatar"
                    style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      border: '4px solid var(--color-background)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className={styles.formSectionTitle}>Profile Picture</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label className={styles.btnSecondary} style={{ cursor: 'pointer', display: 'inline-block' }}>
                      Choose Image
                      <input type="file" accept="image/*" onChange={onPick} style={{ display: 'none' }} />
                    </label>
                    <button 
                      className={styles.addHospitalBtn} 
                      onClick={onUpload} 
                      disabled={uploading || !file}
                      style={{ margin: 0, fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                    >
                      {uploading ? 'Uploading...' : 'Upload New Photo'}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Recommended: Square JPG, PNG or WEBP, at least 400x400.
                  </p>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

              {/* Fields Section */}
              <div className={styles.entityForm}>
                <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                  <div>
                    <label className={styles.formSectionTitle}>Full Name</label>
                    <input 
                      className={styles.formInput} 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label className={styles.formSectionTitle}>Email Address</label>
                    <input 
                      className={styles.formInput} 
                      value={profile.email} 
                      readOnly 
                      disabled
                      style={{ opacity: 0.7, cursor: 'not-allowed' }}
                    />
                  </div>

                  <div>
                    <label className={styles.formSectionTitle}>Profession / Role</label>
                    <input
                      className={styles.formInput}
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      placeholder="e.g., Senior Surgeon, Administrator"
                    />
                  </div>
                </div>

                {msg && (
                  <div className={`status ${msg.type === 'success' ? styles.statusActive : styles.inactive}`} 
                       style={{ padding: '10px', borderRadius: '8px', textAlign: 'center', marginTop: '10px' }}>
                    {msg.text}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button 
                    className={styles.submitBtn} 
                    onClick={onSave} 
                    disabled={saving || !canSave}
                    style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}
                  >
                    {saving ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}