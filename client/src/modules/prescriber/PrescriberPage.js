import React, { useEffect, useState } from "react";
import AppShell from "../../components/AppShell.js";
import Card from "../../components/Card.js";
import EmptyState from "../../components/EmptyState.js";
import api from "../../services/api.js";
import "./PrescriberPage.css";

const EMPTY_FORM = {
  name: "",
  contact: "",
  email: "",
  npi: "",
};

const PrescriberFormFields = ({ formData, onChange }) => (
  <div className="prescribers-form-grid">
    <label>
      Name
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={onChange}
        required
      />
    </label>

    <label>
      Contact
      <input
        type="text"
        name="contact"
        value={formData.contact}
        onChange={onChange}
        required
      />
    </label>

    <label>
      Email
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={onChange}
        required
      />
    </label>

    <label>
      NPI
      <input
        type="text"
        name="npi"
        value={formData.npi}
        onChange={onChange}
        maxLength={10}
        pattern="[0-9]{10}"
        title="NPI must be 10 digits"
        required
      />
    </label>
  </div>
);

const PrescribersPage = () => {
  const [prescribers, setPrescribers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const loadPrescribers = React.useCallback(async (query = "") => {
    setLoading(true);
    setError("");

    try {
      const response = await api.listPrescribers({
        page: 1,
        limit: 200,
        q: query,
      });
      const rows = response?.data || [];
      setPrescribers(rows);

      setSelectedId((currentSelectedId) => {
        if (!rows.length) {
          return "";
        }

        return rows.some((row) => row.id === currentSelectedId)
          ? currentSelectedId
          : rows[0].id;
      });
    } catch (err) {
      setPrescribers([]);
      setError(err.message || "Failed to load prescribers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounceId = window.setTimeout(() => {
      loadPrescribers(search);
    }, 250);

    return () => window.clearTimeout(debounceId);
  }, [loadPrescribers, search]);

  const selectedPrescriber = prescribers.find((p) => p.id === selectedId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSuccessMessage("");
    setSaveLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        contact: formData.contact.trim(),
        email: formData.email.trim(),
        npi: formData.npi.trim(),
      };

      const response = await api.createPrescriber(payload);
      const created = response?.data;
      if (created?.id) {
        setSelectedId(created.id);
      }

      await loadPrescribers(search);
      setModalOpen(false);
      setFormData(EMPTY_FORM);
      setSuccessMessage(response?.message || "Prescriber created.");
    } catch (err) {
      setSaveError(err.message || "Failed to create prescriber.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <AppShell title="Prescribers">
      <div className="prescribers-page">
        <div className="prescribers-grid">
          {/* LEFT PANEL */}
          <Card>
            <div className="prescribers-toolbar">
              <div>
                <h3>Prescriber Directory</h3>
                <p className="prescribers-subtitle">
                  Search prescribers by name or NPI number.
                </p>
              </div>
              <button
                className="prescribers-primary-btn"
                onClick={() => setModalOpen(true)}
              >
                Add Prescriber
              </button>
            </div>

            <div className="prescribers-search">
              <input
                type="text"
                placeholder="Search prescribers"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {error ? (
              <div className="prescribers-message error">{error}</div>
            ) : null}
            {successMessage ? (
              <div className="prescribers-message success">
                {successMessage}
              </div>
            ) : null}

            {loading ? (
              <div className="prescribers-message">Loading prescribers...</div>
            ) : prescribers.length === 0 ? (
              <EmptyState
                title="No prescribers found"
                description="Try adjusting your search."
              />
            ) : (
              <div className="prescribers-list">
                {prescribers.map((p) => (
                  <button
                    key={p.id}
                    className={`prescribers-list-item ${
                      selectedId === p.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <strong>{p.name}</strong>
                    <p>NPI: {p.npi}</p>
                    <span>{p.contact}</span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* RIGHT PANEL */}
          <Card>
            <div className="prescribers-section-header">
              <h3>Prescriber Details</h3>
              {selectedPrescriber && (
                <span className="prescribers-chip">
                  NPI: {selectedPrescriber.npi}
                </span>
              )}
            </div>

            {!selectedPrescriber ? (
              <EmptyState
                title="Select a prescriber"
                description="Choose one from the directory."
              />
            ) : (
              <div className="prescribers-detail-grid">
                <div>
                  <span>Name</span>
                  <strong>{selectedPrescriber.name}</strong>
                </div>

                <div>
                  <span>NPI</span>
                  <strong>{selectedPrescriber.npi}</strong>
                </div>

                <div>
                  <span>Contact</span>
                  <strong>{selectedPrescriber.contact}</strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>{selectedPrescriber.email}</strong>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div
          className="prescribers-modal-backdrop"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="prescribers-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="prescribers-modal-header">
              <h3>Add Prescriber</h3>
              <button
                className="prescriber-modal-close"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>

            {saveError ? (
              <div className="prescribers-message error">{saveError}</div>
            ) : null}

            <form onSubmit={handleCreate} className="prescribers-form">
              <PrescriberFormFields
                formData={formData}
                onChange={handleChange}
              />

              <div className="prescribers-actions">
                <button
                  type="submit"
                  className="prescribers-primary-btn"
                  disabled={saveLoading}
                >
                  {saveLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default PrescribersPage;
