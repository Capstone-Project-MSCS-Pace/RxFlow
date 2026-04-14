import React, { useState } from "react";
import AppShell from "../../components/AppShell";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import "./PrescriptionsPage.css";
import "../dashboard/DashboardPage.css";

const INITIAL_DATA = [
  {
    prescription_id: "RX1001",
    patient: "John Doe",
    drug: "Amoxicillin",
    status: "Received",
    quantity: 30,
    entered_by: "Tech A",
    verified_by: "-",
    created_at: "10:00 AM",
  },
  {
    prescription_id: "RX1002",
    patient: "Jane Smith",
    drug: "Ibuprofen",
    status: "Review",
    quantity: 60,
    entered_by: "Tech B",
    verified_by: "-",
    created_at: "10:15 AM",
  },
];

const STATUS = ["Received", "Review", "Enter", "Ready", "Picked Up"];

export default function PrescriptionPage() {
  const [statusTab, setStatusTab] = useState("Received");
  const [selectedId, setSelectedId] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [data, setData] = useState(INITIAL_DATA);

  const [formData, setFormData] = useState({
    drug: "",
    quantity: "",
    directions: "",
    refills: "",
  });

  const filtered = data.filter((d) => d.status === statusTab);
  const selected = data.find((d) => d.prescription_id === selectedId);

  const updateStatus = (newStatus) => {
    setData((prev) =>
      prev.map((rx) =>
        rx.prescription_id === selectedId
          ? { ...rx, status: newStatus }
          : rx
      )
    );
    setSelectedId("");
  };

  return (
    <AppShell title="Prescriptions">
      <div className="prescription-page">
        <div className="prescription-grid">

          {/* LEFT PANEL */}
          <Card>
            <div className="prescription-toolbar">
              <div>
                <h3>Prescription Queue</h3>
                <p className="prescription-subtitle">
                  Manage prescriptions through workflow stages
                </p>
              </div>
            </div>

            <div className="prescription-tabs">
              {STATUS.map((s) => (
                <button
                  key={s}
                  className={statusTab === s ? "active" : ""}
                  onClick={() => {
                    setStatusTab(s);
                    setSelectedId("");
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <EmptyState title="No prescriptions" />
            ) : (
              <div className="prescription-list">
                {filtered.map((rx) => (
                  <button
                    key={rx.prescription_id}
                    className={`prescription-list-item ${selectedId === rx.prescription_id ? "active" : ""
                      }`}
                    onClick={() => setSelectedId(rx.prescription_id)}
                  >
                    <strong>{rx.prescription_id}</strong>
                    <p>{rx.patient}</p>
                    <span className={`prescription-status ${rx.status.toLowerCase().replace(" ", "-")}`}>
                      {rx.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* RIGHT PANEL */}
          <Card>
            <div className="prescription-section-header">
              <h3>Prescription Details</h3>

              <div className="prescription-tabs">
                <button
                  className={activeTab === "details" ? "active" : ""}
                  onClick={() => setActiveTab("details")}
                >
                  Details
                </button>
                <button
                  className={activeTab === "workflow" ? "active" : ""}
                  onClick={() => setActiveTab("workflow")}
                >
                  Workflow
                </button>
                <button
                  className={activeTab === "audit" ? "active" : ""}
                  onClick={() => setActiveTab("audit")}
                >
                  Audit
                </button>
              </div>
            </div>

            {!selected ? (
              <EmptyState title="Select a prescription" />
            ) : activeTab === "details" ? (
              <div className="prescription-detail-grid">
                <div><span>ID</span><strong>{selected.prescription_id}</strong></div>
                <div><span>Patient</span><strong>{selected.patient}</strong></div>
                <div><span>Drug</span><strong>{selected.drug}</strong></div>
                <div><span>Quantity</span><strong>{selected.quantity}</strong></div>
                <div><span>Entered By</span><strong>{selected.entered_by}</strong></div>
                <div><span>Verified By</span><strong>{selected.verified_by}</strong></div>
                <div><span>Status</span><strong>{selected.status}</strong></div>
              </div>

            ) : activeTab === "workflow" ? (
              <div className="prescription-actions">

                {/* RECEIVED */}
                {statusTab === "Received" && (
                  <button
                    className="prescription-primary-btn"
                    onClick={() => updateStatus("Review")}
                  >
                    Send to Review
                  </button>
                )}

                {/* REVIEW */}
                {statusTab === "Review" && (
                  <div className="prescription-review">
                    <p className="prescription-review-text">
                      Validate prescription before proceeding
                    </p>

                    <div className="prescription-review-actions">
                      <button
                        className="prescription-primary-btn"
                        onClick={() => updateStatus("Enter")}
                      >
                        Approve
                      </button>

                      <button className="prescription-danger-btn">
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {/* ENTER (FORM) */}
                {statusTab === "Enter" && (
                  <div className="prescription-form">
                    <input
                      placeholder="Drug"
                      value={formData.drug}
                      onChange={(e) =>
                        setFormData({ ...formData, drug: e.target.value })
                      }
                    />
                    <input
                      placeholder="Quantity"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                    />
                    <textarea
                      placeholder="Directions (SIG)"
                      value={formData.directions}
                      onChange={(e) =>
                        setFormData({ ...formData, directions: e.target.value })
                      }
                    />
                    <input
                      placeholder="Refills"
                      value={formData.refills}
                      onChange={(e) =>
                        setFormData({ ...formData, refills: e.target.value })
                      }
                    />

                    <button
                      className="prescription-primary-btn"
                      onClick={() => updateStatus("Ready")}
                    >
                      Mark Ready
                    </button>
                  </div>
                )}

                {/* READY */}
                {statusTab === "Ready" && (
                  <button
                    className="prescription-primary-btn"
                    onClick={() => updateStatus("Picked Up")}
                  >
                    Complete Pickup
                  </button>
                )}

                {/* DONE */}
                {statusTab === "Picked Up" && (
                  <p>Prescription completed</p>
                )}
              </div>

            ) : (
              <div className="prescription-detail-grid">
                <div><span>10:00</span><strong>Received</strong></div>
                <div><span>10:05</span><strong>Reviewed</strong></div>
                <div><span>10:10</span><strong>Entered</strong></div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}