// pages/dashboard/LocalAgenciesSection.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/styles/Temp.module.css";
// ✅ FIX: Use absolute import for hooks to prevent path errors
import {
  useLocalAgencies,
  createAgency,
  updateAgency,
  deleteAgency,
  LocalAgency,
} from "@/hooks/useLocalAgencies";
import { FaPlus, FaTimes } from "react-icons/fa";

type AgencyForm = {
  name: string;
  address: string;
  email: string;
  phone: string;
  contactPerson: string;
};

const empty: AgencyForm = {
  name: "",
  address: "",
  email: "",
  phone: "",
  contactPerson: "",
};

export default function LocalAgenciesSection() {
  const { agencies, isLoading } = useLocalAgencies();

  const [form, setForm] = useState<AgencyForm>(empty);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  // Modal visibility
  const [showForm, setShowForm] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const openForm = () => setShowForm(true);
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(empty);
  };

  // Focus first field on open
  useEffect(() => {
    if (showForm && firstFieldRef.current) firstFieldRef.current.focus();
  }, [showForm]);

  // If editingId gets set via onEdit, open modal
  useEffect(() => {
    if (editingId !== null) setShowForm(true);
  }, [editingId]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ✅ FIX: Strict check for null (fixes bug where ID 0 wouldn't update)
    if (editingId !== null) {
      await updateAgency(editingId, form);
    } else {
      await createAgency(form);
    }
    closeForm();
  };

  const onEdit = (a: LocalAgency) => {
    setEditingId(a.id as any);
    setForm({
      name: a.name || "",
      address: a.address || "",
      email: a.email || "",
      phone: a.phone || "",
      contactPerson: a.contactPerson || "",
    });
  };

  const onDeleteClick = async (id: string | number | undefined) => {
    if (!id) return;
    await deleteAgency(id as any);
  };

  // ✅ SAFE CHECK: Ensures map doesn't crash if hook returns undefined
  const safeAgencies = Array.isArray(agencies) ? agencies : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className={styles.sectionHeader}>
        <div className={styles.headerInfo}>
          <h2>Local Agencies</h2>
          <p>Create and manage local agency partners and contacts.</p>
        </div>
        <button
          type="button"
          className={styles.addHospitalBtn}
          onClick={openForm}
          aria-label="Add agency"
        >
          <FaPlus style={{ marginRight: 8 }} /> Add Agency
        </button>
      </section>

      {/* Modal */}
      {showForm && (
        <div className={styles.modalOverlay}>
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="agency-modal-title"
          >
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
              <h2 id="agency-modal-title">
                {editingId !== null ? "Edit Agency" : "Add Agency"}
              </h2>
            </div>

            <div className={styles.modalBody}>
              <form
                id="agency-form"
                className={styles.entityForm}
                onSubmit={onSubmit}
                noValidate
              >
                <div className={styles.formSectionTitle}>Basic</div>
                <div className={styles.formGrid}>
                  <input
                    ref={firstFieldRef}
                    className={styles.formInput}
                    name="name"
                    placeholder="Name"
                    value={form.name}
                    onChange={onChange}
                    required
                  />
                  <input
                    className={styles.formInput}
                    name="contactPerson"
                    placeholder="CEO / Contact Person"
                    value={form.contactPerson}
                    onChange={onChange}
                  />
                </div>

                <div className={styles.formSectionTitle}>Address</div>
                <div className={styles.formGrid}>
                  <input
                    className={styles.formInput}
                    name="address"
                    placeholder="Address"
                    value={form.address}
                    onChange={onChange}
                  />
                </div>

                <div className={styles.formSectionTitle}>Contact</div>
                <div className={styles.formGrid}>
                  <input
                    className={styles.formInput}
                    name="phone"
                    placeholder="Phone"
                    value={form.phone}
                    onChange={onChange}
                    inputMode="tel"
                  />
                  <input
                    className={styles.formInput}
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={onChange}
                    inputMode="email"
                  />
                </div>
              </form>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.submitBtn}
                form="agency-form"
                type="submit"
              >
                {editingId !== null ? "Update" : "Create"}
              </button>
              <button className={styles.cancelBtn} type="button" onClick={closeForm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={styles.agencyTableWrap}>
        <table className={styles.agencyTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Contact Person</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-white/85">
                  Loading agencies...
                </td>
              </tr>
            )}

            {!isLoading &&
              safeAgencies.length > 0 &&
              safeAgencies.map((a: LocalAgency) => (
                <tr key={String(a.id)}>
                  <td>{a.name}</td>
                  <td>{a.address || "-"}</td>
                  <td>{a.email || "-"}</td>
                  <td>{a.phone || "-"}</td>
                  <td>{a.contactPerson || "-"}</td>
                  <td>
                    <div className={styles.actionsRow}>
                      <button
                        type="button"
                        onClick={() => onEdit(a)}
                        className={`${styles.agencyActionBtn} ${styles.agencyActionBtnPrimary}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteClick(a.id as any)}
                        className={`${styles.agencyActionBtn} ${styles.agencyActionBtnDanger}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            {!isLoading && safeAgencies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-white/85">
                  No agencies yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};