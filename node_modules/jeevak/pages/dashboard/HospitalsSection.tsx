import { useEffect, useRef, useState } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import styles from "@/styles/dashboard.module.css";
import { Hospital } from "../hooks/useHospitals";

type Props = {
  filtered: Hospital[];
  form: Hospital;
  editingId: string | number | undefined;
  saving: boolean;
  loading: boolean;
  onChange: (e: any) => void;
  onSubmit: (e: any) => void;
  onEdit: (h: Hospital) => void;
  onDelete: (id?: string | number) => void;
};

export default function HospitalsSection(props: Props) {
  const { filtered, form, editingId, saving, loading, onChange, onSubmit, onEdit, onDelete } = props;
  const [showForm, setShowForm] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const openForm = () => setShowForm(true);
  const closeForm = () => setShowForm(false);

  // Autofocus first input in modal
  useEffect(() => {
    if ((showForm || editingId !== undefined) && firstFieldRef.current) {
      firstFieldRef.current.focus();
    }
  }, [showForm, editingId]);

  return (
    <div className={styles.hospitalsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerInfo}>
          <h2>Hospital Management</h2>
          <p>Manage and monitor hospital information</p>
        </div>
        <button type="button" className={styles.addHospitalBtn} onClick={openForm}>
          <FaPlus style={{ marginRight: 8 }} />
          Add Hospital
        </button>
      </div>

      {(showForm || editingId !== undefined) && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} role="dialog" aria-modal="true" aria-labelledby="hospital-modal-title">
            <div className={styles.modalHeader}>
              <button
                className={styles.closeBtn}
                onClick={closeForm}
                title="Close"
                type="button"
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
              <h2 id="hospital-modal-title">{editingId !== undefined ? "Edit Hospital" : "Add Hospital"}</h2>
            </div>

            <div className={styles.modalBody}>
              <form onSubmit={onSubmit} className={styles.entityForm} id="hospital-form" noValidate>
                <div className={styles.formSectionTitle}>Basic</div>
                <div className={styles.formGrid}>
                  <input
                    ref={firstFieldRef}
                    className={styles.formInput}
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    placeholder="Name"
                    required
                  />
                  <input
                    className={styles.formInput}
                    name="ceo"
                    value={form.ceo || ""}
                    onChange={onChange}
                    placeholder="CEO"
                  />
                </div>

                <div className={styles.formSectionTitle}>Contact</div>
                <div className={styles.formGrid}>
                  <input
                    className={styles.formInput}
                    name="address"
                    value={form.address || ""}
                    onChange={onChange}
                    placeholder="Address"
                  />
                  <input
                    className={styles.formInput}
                    name="phone"
                    value={form.phone || ""}
                    onChange={onChange}
                    placeholder="Phone"
                    inputMode="tel"
                  />
                  <input
                    className={styles.formInput}
                    name="email"
                    value={form.email || ""}
                    onChange={onChange}
                    placeholder="Email"
                    inputMode="email"
                  />
                </div>
              </form>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.submitBtn} type="submit" form="hospital-form" disabled={saving}>
                {saving ? "Saving..." : editingId !== undefined ? "Update" : "Create"}
              </button>
              <button className={styles.cancelBtn} type="button" onClick={closeForm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards grid */}
      <div className={styles.entityGrid}>
        {filtered.map((it) => (
          <div key={String(it.id)} className={styles.glassCard}>
            <div className={styles.cardTopRow}>
              <div className={styles.avatarBlock}>
                <div className={styles.avatarPill}>🏥</div>
                <div>
                  <h3 className={styles.cardTitle}>{it.name}</h3>
                  <p className={styles.cardSubtitle}>CEO: {it.ceo || "-"}</p>
                </div>
              </div>

              <div className={styles.topActions}>
                <button
                  className={styles.iconGhostBtn}
                  onClick={() => {
                    onEdit(it);
                    openForm();
                  }}
                  aria-label="Edit"
                  type="button"
                >
                  ✏️
                </button>
                <button
                  className={styles.iconGhostBtn}
                  onClick={() => onDelete(it.id)}
                  aria-label="Delete"
                  type="button"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className={styles.statusRow}>
              <span className={`${styles.statusPill} ${styles.statusActive}`}>Active</span>
            </div>

            <div className={styles.infoRow}>
              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>📞</span>
                <a href={it.phone ? `tel:${it.phone}` : undefined}>{it.phone || "-"}</a>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>✉️</span>
                <a href={it.email ? `mailto:${it.email}` : undefined}>{it.email || "-"}</a>
              </div>
            </div>

            <div className={styles.kpiPanel}>
              <div className={styles.kpi}>
                <div className={styles.kpiValue}>{it.totalBeds ?? 0}</div>
                <div className={styles.kpiLabel}>Total Beds</div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiValue}>{it.availableBeds ?? 0}</div>
                <div className={styles.kpiLabel}>Available</div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiValue}>{it.departments?.length ?? 0}</div>
                <div className={styles.kpiLabel}>Departments</div>
              </div>
            </div>

            {(it.departments || []).length > 0 && (
              <div className={styles.badgeRow}>
                {(it.departments || []).slice(0, 3).map((dpt) => (
                  <span key={dpt} className={styles.tagPill}>
                    {dpt}
                  </span>
                ))}
                {(it.departments || []).length > 3 && (
                  <button className={styles.morePill}>+ more</button>
                )}
              </div>
            )}

            <div className={styles.cardFooter}>
              <button className={`${styles.ctaBtn} ${styles.ctaPrimary}`}>Add Demand</button>
              <button className={`${styles.ctaBtn} ${styles.ctaGhost}`}>View Demands</button>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loader} />
          <p>Loading hospitals...</p>
        </div>
      )}
    </div>
  );
}
