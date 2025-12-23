// components/dashboard/VendorsSection.tsx
import styles from '@/styles/Temp.module.css';
// ✅ FIX: Use absolute import to prevent path errors
import { Vendor } from '@/hooks/useVendors';

type Props = {
  filtered: Vendor[];
  form: Vendor;
  editingId: string | number | undefined;
  saving: boolean;
  onChange: (e: any) => void;
  onSubmit: (e: any) => void;
  onEdit: (v: Vendor) => void;
  onDelete: (id?: string | number) => void;
};

export default function VendorsSection(props: Props) {
  const { filtered, form, editingId, saving, onChange, onSubmit, onEdit, onDelete } = props;

  // --- SAFETY CHECK (Prevents Build Crash) ---
  if (!form) return null;
  // -------------------------------------------

  return (
    <div className={styles.hospitalsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerInfo}>
          <h2>Vendor Management</h2>
          <p>Manage subcontractors and service vendors</p>
        </div>
      </div>

      <div className={styles.entityCard} style={{ marginBottom: '1rem' }}>
        <form onSubmit={onSubmit} className={styles.entityForm}>
          <div className={styles.formRow}>
            <input className={styles.input} name="name" value={form.name || ''} onChange={onChange} placeholder="Vendor name" required />
            <input className={styles.input} name="contactPerson" value={form.contactPerson || ''} onChange={onChange} placeholder="Contact person" />
            <input className={styles.input} name="category" value={form.category || ''} onChange={onChange} placeholder="Category" />
            <select className={styles.input} name="status" value={form.status || 'active'} onChange={onChange}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
            <input className={styles.input} name="email" value={form.email || ''} onChange={onChange} placeholder="Email" />
          </div>

          <div className={styles.formRow}>
            <input className={styles.input} name="phone" value={form.phone || ''} onChange={onChange} placeholder="Phone" />
            <input className={styles.input} name="rating" value={form.rating ?? ''} onChange={onChange} placeholder="Rating" />
            <input className={styles.input} name="contractValue" value={form.contractValue ?? ''} onChange={onChange} placeholder="Contract value (₹)" />
            <input className={styles.input} name="documentsCount" value={form.documentsCount ?? ''} onChange={onChange} placeholder="Documents count" />
            <input className={styles.input} name="notes" value={form.notes || ''} onChange={onChange} placeholder="Notes" />
          </div>

          <div className={styles.cardActions}>
            <button className={`${styles.actionBtn} ${styles.primary}`} type="submit" disabled={saving}>
              {saving ? 'Saving...' : (editingId !== undefined ? 'Update Vendor' : 'Add Vendor')}
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
        {(filtered || []).map((v) => (
          <div key={v.id} className={styles.entityCard}>
            <div className={styles.cardHeader}>
              <div className={styles.entityInfo}>
                <div className={`${styles.entityAvatar} ${styles.vendor}`}>🚚</div>
                <div className={styles.entityDetails}>
                  <h3>{v.name}</h3>
                  <p className={styles.subtitle}>Contact: {v.contactPerson || '-'}</p>
                  <span className={`${styles.statusBadge} ${v.status === 'active' ? styles['active'] : styles.inactive}`}>{v.status || 'inactive'}</span>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button className={`${styles.iconBtn} ${styles.edit}`} onClick={() => onEdit(v)}>✏️</button>
                <button className={`${styles.iconBtn} ${styles.delete}`} onClick={() => onDelete(v.id)}>🗑️</button>
              </div>
            </div>

            <div className={styles.contactInfo}>
              <div className={styles.contactItem}><span className={styles.contactIcon}>📞</span><span>{v.phone || '-'}</span></div>
              <div className={styles.contactItem}><span className={styles.contactIcon}>📧</span><span>{v.email || '-'}</span></div>
            </div>

            <div className={styles.entityMetrics}>
              <div className={styles.metric}><div className={styles.metricValue}>⭐ {typeof v.rating === 'number' ? v.rating.toFixed(1) : '—'}</div><div className={styles.metricLabel}>Rating</div></div>
              <div className={styles.metric}><div className={styles.metricValue}>💰 {typeof v.contractValue === 'number' ? v.contractValue : '—'}</div><div className={styles.metricLabel}>Contract Value</div></div>
              <div className={styles.metric}><div className={styles.metricValue}>📄 {typeof v.documentsCount === 'number' ? v.documentsCount : '—'}</div><div className={styles.metricLabel}>Documents</div></div>
            </div>

            <div className={styles.entityActions}>
              <button className={`${styles.actionBtn} ${styles.success}`}>Verify Resume</button>
              <button className={`${styles.actionBtn} ${styles.primary}`}>Add Demand</button>
              <button className={`${styles.actionBtn} ${styles.secondary}`}>View Demands</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};