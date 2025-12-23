// components/dashboard/DemandsSection.tsx
import { useEffect, useRef, useState } from "react";
import styles from "@/styles/dashboard.module.css";
import { Demand } from "../hooks/useDemands";
import { FaPlus, FaTimes, FaEdit, FaTrash, FaClock, FaMoneyBillWave, FaUserMd, FaHospital } from "react-icons/fa";

const formatCurrencyCompact = (n?: number) => {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1000)}K`;
  return String(n);
};

type Props = {
  filtered: Demand[];
  form: Demand;
  editingId: string | number | undefined;
  saving: boolean;
  onChange: (e: any) => void;
  onSubmit: (e: any) => void;
  onEdit: (d: Demand) => void;
  onDelete: (id?: string | number) => void;
};

export default function DemandsSection(props: Props) {
  const { filtered, form, editingId, saving, onChange, onSubmit, onEdit, onDelete } = props;

  const [showForm, setShowForm] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const openForm = () => setShowForm(true);
  const closeForm = () => setShowForm(false);

  // Open modal when editing
  useEffect(() => {
    if (editingId !== undefined) setShowForm(true);
  }, [editingId]);

  // Autofocus first field
  useEffect(() => {
    if (showForm && firstFieldRef.current) firstFieldRef.current.focus();
  }, [showForm]);

  // Optional: scroll to first invalid input on submit
  const handleSubmit = (e: any) => {
    onSubmit(e);
    const formEl = (e.target as HTMLFormElement) ?? document.getElementById("demand-form");
    if (formEl && (formEl as any).checkValidity && !(formEl as any).checkValidity()) {
      const invalid = formEl.querySelector<HTMLElement>(":invalid");
      invalid?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className={styles.hospitalsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerInfo}>
          <h2>Demand Management</h2>
          <p>Create and manage service demands and requirements</p>
        </div>
        <button
          type="button"
          className={styles.addHospitalBtn}
          onClick={openForm}
          aria-label="Add demand"
        >
          <FaPlus style={{ marginRight: 8 }} /> Add Demand
        </button>
      </div>

      {(showForm || editingId !== undefined) && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} role="dialog" aria-modal="true" aria-labelledby="demand-modal-title">
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
              <h2 id="demand-modal-title">{editingId !== undefined ? "Edit Demand" : "Add Demand"}</h2>
            </div>

            <div className={styles.modalBody}>
              <form id="demand-form" className={styles.entityForm} onSubmit={handleSubmit} noValidate>
                <div className={styles.formSectionTitle}>Basic</div>
                <div className={styles.formGrid}>
                  <input
                    ref={firstFieldRef}
                    className={styles.formInput}
                    name="title"
                    value={(form as any).title || ""}
                    onChange={onChange}
                    placeholder="Title"
                    required
                  />
                  <input
                    className={styles.formInput}
                    name="code"
                    value={(form as any).code || ""}
                    onChange={onChange}
                    placeholder="Demand Code"
                  />
                  <input
                    className={styles.formInput}
                    name="priority"
                    value={(form as any).priority || ""}
                    onChange={onChange}
                    placeholder="Priority (Low/Med/High)"
                  />
                  <select
                    className={styles.formInput}
                    name="status"
                    value={(form as any).status || "open"}
                    onChange={onChange}
                  >
                    <option value="open">open</option>
                    <option value="in_progress">in progress</option>
                    <option value="fulfilled">fulfilled</option>
                    <option value="closed">closed</option>
                  </select>
                </div>

                <div className={styles.formSectionTitle}>Scope</div>
                <div className={styles.formGrid}>
                  <input
                    className={styles.formInput}
                    name="department"
                    value={(form as any).department || ""}
                    onChange={onChange}
                    placeholder="Department"
                  />
                  <input
                    className={styles.formInput}
                    name="hospitalName"
                    value={(form as any).hospitalName || ""}
                    onChange={onChange}
                    placeholder="Hospital"
                  />
                  <input
                    className={styles.formInput}
                    name="assignedDoctor"
                    value={(form as any).assignedDoctor || ""}
                    onChange={onChange}
                    placeholder="Assigned Doctor"
                  />
                  <input
                    className={styles.formInput}
                    name="location"
                    value={(form as any).location || ""}
                    onChange={onChange}
                    placeholder="Location / OPD"
                  />
                </div>

                <div className={styles.formSectionTitle}>Timeline</div>
                <div className={styles.formGrid}>
                  <input
                    className={styles.formInput}
                    type="date"
                    name="requestedOn"
                    value={(form as any).requestedOn || ""}
                    onChange={onChange}
                    placeholder="Requested On"
                  />
                  <input
                    className={styles.formInput}
                    type="date"
                    name="dueBy"
                    value={(form as any).dueBy || ""}
                    onChange={onChange}
                    placeholder="Due By"
                  />
                  <input
                    className={styles.formInput}
                    name="slaHours"
                    value={(form as any).slaHours ?? ""}
                    onChange={onChange}
                    placeholder="SLA (hours)"
                    inputMode="numeric"
                  />
                </div>

                <div className={styles.formSectionTitle}>Budget</div>
                <div className={styles.formGrid}>
                  <input
                    className={styles.formInput}
                    name="budget"
                    value={(form as any).budget ?? ""}
                    onChange={onChange}
                    placeholder="Budget (₹)"
                    inputMode="decimal"
                  />
                  <input
                    className={styles.formInput}
                    name="expectedCost"
                    value={(form as any).expectedCost ?? ""}
                    onChange={onChange}
                    placeholder="Expected Cost (₹)"
                    inputMode="decimal"
                  />
                  <label className={styles.checkboxRow}>
                    <span>CapEx</span>
                    <input
                      type="checkbox"
                      name="isCapex"
                      checked={!!(form as any).isCapex}
                      onChange={onChange}
                      aria-label="CapEx"
                    />
                  </label>
                  <label className={styles.checkboxRow}>
                    <span>Urgent</span>
                    <input
                      type="checkbox"
                      name="urgent"
                      checked={!!(form as any).urgent}
                      onChange={onChange}
                      aria-label="Urgent"
                    />
                  </label>
                </div>

                <div className={styles.formSectionTitle}>Details</div>
                <div className={styles.formGrid}>
                  <textarea
                    className={styles.formInput}
                    name="description"
                    value={(form as any).description || ""}
                    onChange={onChange}
                    placeholder="Description"
                    rows={4}
                  />
                  <input
                    className={styles.formInput}
                    name="tagsCsv"
                    value={((form as any).tags || []).join(", ")}
                    onChange={onChange}
                    placeholder="Tags (CSV)"
                  />
                </div>
              </form>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.submitBtn} form="demand-form" type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId !== undefined ? "Update Demand" : "Create Demand"}
              </button>
              <button className={styles.cancelBtn} type="button" onClick={closeForm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.entityGrid}>
        {filtered.map((d) => (
          <div key={String(d.id)} className={styles.entityCard}>
            <div className={styles.cardHeader}>
              <div className={styles.entityInfo}>
                <div className={styles.entityAvatar}><FaClock /></div>
                <div className={styles.entityDetails}>
                  <h3>{(d as any).title ?? "Untitled demand"}</h3>
                  <p className={styles.subtitle}>{(d as any).department || (d as any).location || "-"}</p>
                  <span className={`${styles.statusBadge} ${((d as any).status ?? "open") === "open" ? styles.available : ((d as any).status === "in_progress" ? styles.pending : styles.inactive)}`}>
                    {(d as any).status ?? "open"}
                  </span>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button className={styles.iconBtn} onClick={() => onEdit(d)} aria-label="Edit demand" type="button">
                  <FaEdit />
                </button>
                <button className={styles.iconBtn} onClick={() => onDelete(d.id)} aria-label="Delete demand" type="button">
                  <FaTrash />
                </button>
              </div>
            </div>

            <div className={styles.contactInfo}>
              <div className={styles.contactItem}><span className={styles.contactIcon}><FaHospital /></span><span>{(d as any).hospitalName || "-"}</span></div>
              <div className={styles.contactItem}><span className={styles.contactIcon}><FaUserMd /></span><span>{(d as any).assignedDoctor || "-"}</span></div>
              <div className={styles.contactItem}><span className={styles.contactIcon}><FaMoneyBillWave /></span><span>₹ {formatCurrencyCompact((d as any).budget)}</span></div>
            </div>

            <div className={styles.entityMetrics}>
              <div className={styles.metric}><div className={styles.metricValue}>{(d as any).slaHours ?? "—"}h</div><div className={styles.metricLabel}>SLA</div></div>
              <div className={styles.metric}><div className={styles.metricValue}>{formatCurrencyCompact((d as any).expectedCost)}</div><div className={styles.metricLabel}>Expected</div></div>
              <div className={styles.metric}><div className={styles.metricValue}>{((d as any).tags || []).length}</div><div className={styles.metricLabel}>Tags</div></div>
            </div>

            <p className={styles.subtitle} style={{ marginTop: 8 }}>
              {(d as any).description || "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
