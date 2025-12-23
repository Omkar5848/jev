import { useEffect, useRef, useState } from "react";
import styles from "../../styles/Dashboard.module.css";
import { Doctor } from "../hooks/useDoctors";
import { FaPlus, FaTimes, FaEdit, FaTrash, FaPhone, FaEnvelope, FaUserMd, FaHospital } from "react-icons/fa";

type Props = {
  filtered: Doctor[];
  form: Doctor;
  editingId: string | number | undefined;
  saving: boolean;
  onChange: (e: any) => void;
  onSubmit: (e: any) => void;
  onEdit: (d: Doctor) => void;
  onDelete: (id?: string | number) => void;
  setEditingId: (v: any) => void;
  setForm: (v: Doctor) => void;
};

export default function DoctorsSection(props: Props) {
  const { filtered, form, editingId, saving, onChange, onSubmit, onEdit, onDelete, setEditingId } = props;

  const [showForm, setShowForm] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const openForm = () => setShowForm(true);
  const closeForm = () => {
    setShowForm(false);
    if (editingId !== undefined) setEditingId(undefined);
  };

  // Open modal when editing
  useEffect(() => {
    if (editingId !== undefined) setShowForm(true);
  }, [editingId]); // [attached_file:3]

  // Autofocus first field
  useEffect(() => {
    if (showForm && firstFieldRef.current) firstFieldRef.current.focus();
  }, [showForm]); // [attached_file:3]

  // Scroll to first invalid field on submit attempt (optional enhancement)
  const handleSubmit = (e: any) => {
    onSubmit(e);
    const formEl = (e.target as HTMLFormElement) ?? document.getElementById("doctor-form");
    if (formEl && !formEl.checkValidity) return;
    if (formEl && !formEl.checkValidity()) {
      const invalid = formEl.querySelector<HTMLElement>(":invalid");
      invalid?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }; // [attached_file:3]

  return (
    <div className={styles.hospitalsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerInfo}>
          <h2>Doctor Management</h2>
          <p>Profiles, availability, and performance</p>
        </div>
        <button
          type="button"
          className={styles.addHospitalBtn}
          onClick={openForm}
          aria-label="Add doctor"
        >
          <FaPlus style={{ marginRight: 8 }} /> Add Doctor
        </button>
      </div>

      {(showForm || editingId !== undefined) && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} role="dialog" aria-modal="true" aria-labelledby="doctor-modal-title">
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
              <h2 id="doctor-modal-title">{editingId !== undefined ? "Edit Doctor" : "Add Doctor"}</h2>
            </div>

            <div className={styles.modalBody}>
              <form onSubmit={handleSubmit} className={styles.entityForm} id="doctor-form" noValidate>
                <div className={styles.formSectionTitle}>Basic</div>
                <div className={styles.formGrid}>
                  <input
                    ref={firstFieldRef}
                    className={styles.formInput}
                    name="doctorCode"
                    value={form.doctorCode || ""}
                    onChange={onChange}
                    placeholder="Doctor Code"
                  />
                  <input
                    className={styles.formInput}
                    name="firstName"
                    value={form.firstName}
                    onChange={onChange}
                    placeholder="First name"
                    required
                  />
                  <input
                    className={styles.formInput}
                    name="lastName"
                    value={form.lastName}
                    onChange={onChange}
                    placeholder="Last name"
                    required
                  />
                  <input
                    className={styles.formInput}
                    name="specialization"
                    value={form.specialization || ""}
                    onChange={onChange}
                    placeholder="Specialization"
                  />
                  <input
                    className={styles.formInput}
                    name="subSpecialtiesCsv"
                    value={(form.subSpecialties || []).join(", ")}
                    onChange={onChange}
                    placeholder="Sub-specialties (CSV)"
                  />
                </div>

                <div className={styles.formSectionTitle}>Professional</div>
                <div className={styles.formGrid}>
                  <input
                    className={styles.formInput}
                    name="qualifications"
                    value={form.qualifications || ""}
                    onChange={onChange}
                    placeholder="Qualifications"
                  />
                  <input
                    className={styles.formInput}
                    name="registrationNumber"
                    value={form.registrationNumber || ""}
                    onChange={onChange}
                    placeholder="License/Reg. No."
                  />
                  <input
                    className={styles.formInput}
                    type="date"
                    name="practicingFrom"
                    value={form.practicingFrom || ""}
                    onChange={onChange}
                  />
                  <select
                    className={styles.formInput}
                    name="gender"
                    value={form.gender || ""}
                    onChange={onChange}
                  >
                    <option value="">gender</option>
                    <option value="male">male</option>
                    <option value="female">female</option>
                    <option value="other">other</option>
                  </select>
                  <input
                    className={styles.formInput}
                    type="date"
                    name="dob"
                    value={form.dob || ""}
                    onChange={onChange}
                  />
                </div>

                <div className={styles.formSectionTitle}>Contact</div>
                <div className={styles.formGrid}>
                  <input
                    className={styles.formInput}
                    name="email"
                    value={form.email || ""}
                    onChange={onChange}
                    placeholder="Email"
                    inputMode="email"
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
                    name="altPhone"
                    value={form.altPhone || ""}
                    onChange={onChange}
                    placeholder="Alt Phone"
                    inputMode="tel"
                  />
                  <input
                    className={styles.formInput}
                    name="languagesCsv"
                    value={(form.languages || []).join(", ")}
                    onChange={onChange}
                    placeholder="Languages (CSV)"
                  />
                </div>

                <div className={styles.formSectionTitle}>Schedule</div>
                <div className={styles.formGrid}>
                  <select
                    className={styles.formInput}
                    name="availabilityStatus"
                    value={form.availabilityStatus || "available"}
                    onChange={onChange}
                  >
                    <option value="available">available</option>
                    <option value="busy">busy</option>
                    <option value="offline">offline</option>
                  </select>
                  <input
                    className={styles.formInput}
                    name="slotDurationMin"
                    value={form.slotDurationMin ?? ""}
                    onChange={onChange}
                    placeholder="Slot (min)"
                    inputMode="numeric"
                  />
                  <input
                    className={styles.formInput}
                    name="clinicDaysCsv"
                    value={(form.clinicDays || []).join(", ")}
                    onChange={onChange}
                    placeholder="Clinic Days (CSV e.g. Mon,Tue)"
                  />
                  <input
                    className={styles.formInput}
                    name="startTime"
                    value={form.startTime || ""}
                    onChange={onChange}
                    placeholder="Start HH:MM"
                  />
                  <input
                    className={styles.formInput}
                    name="endTime"
                    value={form.endTime || ""}
                    onChange={onChange}
                    placeholder="End HH:MM"
                  />
                </div>

                <div className={styles.formSectionTitle}>Affiliation</div>
                <div className={styles.formGrid}>
                  <input
                    className={styles.formInput}
                    name="hospitalName"
                    value={form.hospitalName || ""}
                    onChange={onChange}
                    placeholder="Hospital"
                  />
                  <input
                    className={styles.formInput}
                    name="department"
                    value={form.department || ""}
                    onChange={onChange}
                    placeholder="Department"
                  />
                  <input
                    className={styles.formInput}
                    name="workArea"
                    value={form.workArea || ""}
                    onChange={onChange}
                    placeholder="Work Area/OPD"
                  />
                  <input
                    className={styles.formInput}
                    name="rating"
                    value={form.rating ?? ""}
                    onChange={onChange}
                    placeholder="Rating"
                    inputMode="decimal"
                  />
                  <input
                    className={styles.formInput}
                    name="maxDailyAppointments"
                    value={form.maxDailyAppointments ?? ""}
                    onChange={onChange}
                    placeholder="Max/day"
                    inputMode="numeric"
                  />
                </div>

                <div className={styles.formSectionTitle}>Other</div>
                <div className={styles.formGrid}>
                  <input
                    className={styles.formInput}
                    name="patientPanelCount"
                    value={form.patientPanelCount ?? ""}
                    onChange={onChange}
                    placeholder="Patient Panel Count"
                    inputMode="numeric"
                  />
                  <input
                    className={styles.formInput}
                    name="emrSystemId"
                    value={form.emrSystemId || ""}
                    onChange={onChange}
                    placeholder="EMR System ID"
                  />
                  <input
                    className={styles.formInput}
                    name="notes"
                    value={form.notes || ""}
                    onChange={onChange}
                    placeholder="Notes"
                  />
                  <label className={styles.checkboxRow}>
                    <span>Allow Double Booking</span>
                    <input
                      type="checkbox"
                      name="allowDoubleBooking"
                      checked={!!form.allowDoubleBooking}
                      onChange={onChange}
                      aria-label="Allow Double Booking"
                    />
                  </label>
                  <label className={styles.checkboxRow}>
                    <span>On Call</span>
                    <input
                      type="checkbox"
                      name="onCall"
                      checked={!!form.onCall}
                      onChange={onChange}
                      aria-label="On Call"
                    />
                  </label>
                </div>
              </form>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.submitBtn} form="doctor-form" type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId !== undefined ? "Update Doctor" : "Create Doctor"}
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
                <div className={styles.entityAvatar}><FaUserMd /></div>
                <div className={styles.entityDetails}>
                  <h3>{d.firstName} {d.lastName}</h3>
                  <p className={styles.subtitle}>{d.specialization || "-"}</p>
                  <span className={`${styles.statusBadge} ${d.availabilityStatus === "available" ? styles.available : d.availabilityStatus === "busy" ? styles.pending : styles.inactive}`}>
                    {d.availabilityStatus || "offline"}
                  </span>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button className={styles.iconBtn} onClick={() => onEdit(d)} aria-label="Edit doctor" type="button">
                  <FaEdit />
                </button>
                <button className={styles.iconBtn} onClick={() => onDelete(d.id)} aria-label="Delete doctor" type="button">
                  <FaTrash />
                </button>
              </div>
            </div>

            <div className={styles.contactInfo}>
              <div className={styles.contactItem}><span className={styles.contactIcon}><FaHospital /></span><span>{d.hospitalName || "-"}</span></div>
              <div className={styles.contactItem}><span className={styles.contactIcon}><FaPhone /></span><a href={d.phone ? `tel:${d.phone}` : undefined}>{d.phone || "-"}</a></div>
              <div className={styles.contactItem}><span className={styles.contactIcon}><FaEnvelope /></span><a href={d.email ? `mailto:${d.email}` : undefined}>{d.email || "-"}</a></div>
            </div>

            <div className={styles.entityMetrics}>
              <div className={styles.metric}><div className={styles.metricValue}>⭐ {typeof d.rating === "number" ? d.rating.toFixed(1) : "—"}</div><div className={styles.metricLabel}>Rating</div></div>
              <div className={styles.metric}><div className={styles.metricValue}>⏱️ {d.slotDurationMin ?? "—"}m</div><div className={styles.metricLabel}>Slot</div></div>
              <div className={styles.metric}><div className={styles.metricValue}>📅 {(d.clinicDays || []).join(", ") || "—"}</div><div className={styles.metricLabel}>Days</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
