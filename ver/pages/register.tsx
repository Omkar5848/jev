import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import api from '@/utils/api';
import styles from '@/styles/Auth.module.css';
import ThemeToggle from '@/components/ThemeToggle';

export default function Register() {
  const router = useRouter();
  
  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    profession: 'User', // Default role
    adminKey: ''        // Only used if profession is Admin
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Input Changes
  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Send registration request
      const { data } = await api.post('/api/auth/register', form);
      
      // Auto-login logic
      if (data.token && typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role);
        
        if (data.user.doctorId) {
          localStorage.setItem('doctorId', String(data.user.doctorId));
        }

        // Redirect based on Role
        if (data.user.role === 'Admin') {
          router.push('/dashboard');
        } else if (data.user.role === 'Doctor') {
          router.push('/doctor/overview');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <ThemeToggle />
      </div>

      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo}>Jeevak</h1>
          <p className={styles.subtitle}>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Name Field */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Full Name</label>
            <input 
              className={styles.input}
              type="text"
              required
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="John Doe"
            />
          </div>

          {/* Email Field */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input 
              className={styles.input}
              type="email"
              required
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          {/* Password Field */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input 
              className={styles.input}
              type="password"
              required
              value={form.password}
              onChange={e => handleChange('password', e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {/* Role Selection */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Register As</label>
            <select 
              className={styles.input}
              value={form.profession}
              onChange={e => handleChange('profession', e.target.value)}
            >
              <option value="User">Patient / User</option>
              <option value="Doctor">Doctor</option>
              <option value="Nurse">Nurse</option>
              <option value="Technician">Lab Technician</option>
              <option value="Admin">Administrator</option>
            </select>
          </div>

          {/* Conditional Admin Key Field */}
          {form.profession === 'Admin' && (
            <div className={styles.inputGroup}>
              <label className={styles.label} style={{ color: '#ef4444' }}>
                Admin Secret Key <span style={{fontSize: '0.8em'}}>(Required)</span>
              </label>
              <input 
                className={styles.input}
                type="password"
                required
                placeholder="Enter Admin Key"
                value={form.adminKey}
                onChange={e => handleChange('adminKey', e.target.value)}
                style={{ borderColor: '#ef4444' }}
              />
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.button} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className={styles.linkRow}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link href="/login" className={styles.link} style={{ marginLeft: '5px' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}