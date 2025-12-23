// components/dashboard/FreelancersSection.tsx
import styles from '@/styles/dashboard.module.css';
import { Freelancer } from '../hooks/useFreelancers';

type Props = {
  filtered: Freelancer[];
  form: Freelancer;
  editingId: string | number | undefined;
  saving: boolean;
  onChange: (e: any) => void;
  onSubmit: (e: any) => void;
  onEdit: (f: Freelancer) => void;
  onDelete: (id?: string | number) => void;
};

export default function FreelancersSection(props: Props) {
  const { filtered, form, editingId, saving, onChange, onSubmit, onEdit, onDelete } = props;

  return (
    <div className={styles.hospitalsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerInfo}>
          <h2>Freelancer Management</h2>
          <p>Manage healthcare freelancers and their availability</p>
        </div>
      </div>

      <div className={styles.entityCard} style={{ marginBottom: '1rem' }}>
        <form onSubmit={onSubmit} className={styles.entityForm}>
          <div className={styles.formRow}>
            <input className={styles.input} name="name" value={form.name} onChange={onChange} placeholder="Full name" required />
            <input className={styles.input} name="specialization" value={form.specialization || ''} onChange={onChange} placeholder="Specialization" />
            <select className={styles.input} name="availability" value={form.availability || 'available'} onChange={onChange}>
              <option value="available">available</option>
              <option value="busy">busy</option>
              <option value="offline">offline</option>
            </select>
            <input className={styles.input} name="email" value={form.email || ''} onChange={onChange} placeholder="Email" />
            <input className={styles.input} name="phone" value={form.phone || ''} onChange={onChange} placeholder="Phone" />
          </div>

          <div className={styles.formRow}>
            <input className={styles.input} name="rating" value={form.rating ?? ''} onChange={onChange} placeholder="Rating" />
            <input className={styles.input} name="years" value={form.years ?? ''} onChange={onChange} placeholder="Years" />
            <input className={styles.input} name="ratePerHour" value={form.ratePerHour ?? ''} onChange={onChange} placeholder="Rate per hour" />
            <input className={styles.input} name="projects" value={form.projects ?? ''} onChange={onChange} placeholder="Projects" />
            <input className={styles.input} name="skillsCsv" value={(form.skills || []).join(', ')} onChange={onChange} placeholder="Skills (comma-separated)" />
          </div>

          <div className={styles.cardActions}>
            <button className={`${styles.actionBtn} ${styles.primary}`} type="submit" disabled={saving}>
              {saving ? 'Saving...' : (editingId !== undefined ? 'Update Freelancer' : 'Create Freelancer')}
            </button>
            {editingId !== undefined && (
              <button className={`${styles.actionBtn} ${styles.secondary}`} type="button" onClick={() => { /* parent resets */ }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className={styles.entityGrid}>
        {filtered.map((f) => (
          <div key={f.id} className={styles.entityCard}>
            <div className={styles.cardHeader}>
              <div className={styles.entityInfo}>
                <div className={`${styles.entityAvatar} ${styles.freelancer}`}>🧑‍⚕️</div>
                <div className={styles.entityDetails}>
                  <h3>{f.name}</h3>
                  <p className={styles.subtitle}>{f.specialization || '-'}</p>
                  <span className={`${styles.statusBadge} ${f.availability === 'available' ? styles.available : f.availability === 'busy' ? styles.pending : styles.inactive}`}>
                    {f.availability || 'offline'}
                  </span>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button className={`${styles.iconBtn} ${styles.edit}`} onClick={() => onEdit(f)}>✏️</button>
                <button className={`${styles.iconBtn} ${styles.delete}`} onClick={() => onDelete(f.id)}>🗑️</button>
              </div>
            </div>

            <div className={styles.contactInfo}>
              <div className={styles.contactItem}><span className={styles.contactIcon}>📞</span><span>{f.phone || '-'}</span></div>
              <div className={styles.contactItem}><span className={styles.contactIcon}>📧</span><span>{f.email || '-'}</span></div>
            </div>

            <div className={styles.entityMetrics}>
              <div className={styles.metric}><div className={styles.metricValue}>⭐ {typeof f.rating === 'number' ? f.rating.toFixed(1) : '—'}</div><div className={styles.metricLabel}>Rating</div></div>
              <div className={styles.metric}><div className={styles.metricValue}>⏱️ {typeof f.years === 'number' ? `${f.years}+` : '—'}</div><div className={styles.metricLabel}>Years</div></div>
              <div className={styles.metric}><div className={styles.metricValue}>💰 {typeof f.ratePerHour === 'number' ? `₹${f.ratePerHour}` : '—'}</div><div className={styles.metricLabel}>Per Hour</div></div>
              <div className={styles.metric}><div className={styles.metricValue}>📁 {typeof f.projects === 'number' ? f.projects : '—'}</div><div className={styles.metricLabel}>Projects</div></div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className={styles.skillsLabel}>Skills:</div>
              <div className={styles.skillsList}>{(f.skills || []).map((s) => (<span key={s} className={styles.skillTag}>{s}</span>))}</div>
            </div>

            <div className={styles.entityActions}>
              <button className={`${styles.actionBtn} ${styles.success}`}>Verify Resume</button>
              <button className={`${styles.actionBtn} ${styles.primary}`}>Apply Demand</button>
              <button className={`${styles.actionBtn} ${styles.secondary}`}>View Demands</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
