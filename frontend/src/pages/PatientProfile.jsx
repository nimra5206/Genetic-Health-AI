import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientProfile.css";

/* ---------- helpers (isi file mein) ---------- */
const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    return {};
  }
};

const currentUserId = (u) =>
  String(u.id ?? u.email ?? u.username ?? u.name ?? "anon").toLowerCase();

// Sab se naya assessment: pehle is browser ki history, warna last prediction
const readLatestAssessment = (uid) => {
  try {
    const list = JSON.parse(localStorage.getItem(`gh_history:${uid}`) || "[]");
    if (Array.isArray(list) && list.length > 0) return list[0];
  } catch {
    /* ignore */
  }
  try {
    const last = JSON.parse(localStorage.getItem(`gh_last_prediction:${uid}`) || "null");
    if (last) return last;
  } catch {
    /* ignore */
  }
  return null;
};

const MARKER_DEFS = {
  hemoglobin: { label: "Hemoglobin", unit: "g/dL" },
  fetal_hemoglobin: { label: "Fetal Hemoglobin (HbF)", unit: "%" },
  rdw_cv: { label: "RDW-CV", unit: "%" },
  serum_ferritin: { label: "Serum Ferritin", unit: "ng/mL" },
  brca1_expression: { label: "BRCA1 Expression", unit: "" },
  p53_mutation: { label: "p53 Gene Status", unit: "" },
  sweat_chloride: { label: "Sweat Chloride", unit: "mmol/L" },
  sickled_rbc_percent: { label: "Sickled RBC", unit: "%" },
  il6_level: { label: "IL-6 Level", unit: "pg/mL" },
};

const getMarkers = (inputs) => {
  if (!inputs) return [];
  return Object.keys(MARKER_DEFS)
    .filter((k) => inputs[k] !== undefined && inputs[k] !== null && inputs[k] !== "")
    .map((k) => {
      const v = inputs[k];
      const value =
        k === "p53_mutation"
          ? Number(v) === 1
            ? "Mutated / Variant"
            : "Normal / Wild-type"
          : `${v}${MARKER_DEFS[k].unit ? " " + MARKER_DEFS[k].unit : ""}`;
      return `${MARKER_DEFS[k].label}: ${value}`;
    });
};

// Normal range wohi hai jo New Assessment form ke hint mein likhi hai (12.0 - 17.5 g/dL)
const hemoglobinStatus = (hb) => {
  const n = Number(hb);
  if (hb === undefined || hb === null || hb === "" || Number.isNaN(n)) return "Not available";
  if (n < 12) return `${n} g/dL (Below normal range)`;
  if (n > 17.5) return `${n} g/dL (Above normal range)`;
  return `${n} g/dL (Within normal range)`;
};

const genderLabel = (g) => (String(g) === "0" ? "Male" : String(g) === "1" ? "Female" : "Not available");

const yesNo = (v) => (String(v) === "1" ? "Yes" : String(v) === "0" ? "No known history" : "Not available");

const formatDate = (d) => {
  if (!d) return "Not available";
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? String(d) : parsed.toLocaleDateString();
};

const confidenceNumber = (a) => {
  const raw = a?.confidence_value ?? a?.confidence;
  const n = typeof raw === "string" ? parseFloat(raw.replace("%", "")) : Number(raw);
  return Number.isNaN(n) ? null : n;
};

function PatientProfile() {
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const user = readUser();

  useEffect(() => {
    setAssessment(readLatestAssessment(currentUserId(readUser())));
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  // Asli account data
  const patientName = user.name || user.username || "Patient";
  const patientId = user.id ? `GH-${user.id}` : "Not available";
  const email = user.email || "";

  // Asli assessment data (agar koi assessment chala hua ho)
  const inputs = assessment?.inputs || null;
  const hasData = Boolean(assessment);
  const age = inputs?.age !== undefined && inputs?.age !== "" ? `${inputs.age} Years` : "Not available";
  const gender = genderLabel(inputs?.gender);
  const hemoglobin = hemoglobinStatus(inputs?.hemoglobin);
  const familyHistory = yesNo(inputs?.family_history);

  const conf = confidenceNumber(assessment);
  const risk =
    assessment?.risk_level ||
    assessment?.risk ||
    (conf === null ? "Not available" : conf >= 70 ? "High" : conf >= 40 ? "Moderate" : "Low");
  const markers = getMarkers(inputs);

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="page-heading">
        <div className="heading-title-box">
          <h1>Patient Profile</h1>
          <p>Your account details and latest genetic screening overview</p>
        </div>
        <button className="primary-action-btn" onClick={() => navigate("/prediction")}>
          + New Prediction
        </button>
      </div>

      {/* Main Grid */}
      <div className="profile-grid">
        {/* Patient Core Details */}
        <div className="profile-card hero-card">
          <div className="avatar">{patientName.charAt(0).toUpperCase()}</div>
          <h2>{patientName}</h2>
          <span className="patient-id-badge">ID: {patientId}</span>
          {email && <small style={{ display: "block", marginTop: "6px", color: "#64748b" }}>{email}</small>}

          <div className="profile-info">
            <div className="info-item">
              <span>Age</span>
              <strong>{age}</strong>
            </div>

            <div className="info-item">
              <span>Gender</span>
              <strong>{gender}</strong>
            </div>

            <div className="info-item">
              <span>Hemoglobin</span>
              <strong className="status-highlight">{hemoglobin}</strong>
            </div>
          </div>
        </div>

        {/* Latest Screening Summary */}
        <div className="profile-card">
          <div className="card-header">
            <h3>Genetic Screening Summary</h3>
            <span className="info-tag">Latest Assessment</span>
          </div>

          {hasData ? (
            <div className="info-grid">
              <div className="info-row">
                <span>Family History</span>
                <strong>{familyHistory}</strong>
              </div>

              <div className="info-row">
                <span>Predicted Condition</span>
                <strong>{assessment.predicted_disease || "Not available"}</strong>
              </div>

              <div className="info-row">
                <span>Model Confidence</span>
                <strong>{conf === null ? "Not available" : `${conf.toFixed(1)}%`}</strong>
              </div>

              <div className="info-row">
                <span>Risk Level</span>
                <strong>{risk}</strong>
              </div>

              <div className="info-row">
                <span>Assessment Date</span>
                <strong>{formatDate(assessment.date || assessment.created_at)}</strong>
              </div>
            </div>
          ) : (
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              No assessment found yet. Run a new prediction and your details will appear here.
            </p>
          )}
        </div>
      </div>

      {/* Submitted biomarkers */}
      <div className="profile-card symptoms-card">
        <h3>Submitted Biomarkers (Latest Assessment)</h3>
        <div className="symptom-list">
          {markers.length > 0 ? (
            markers.map((m, index) => (
              <span key={index} className="symptom-chip">
                • {m}
              </span>
            ))
          ) : (
            <span style={{ color: "#64748b", fontSize: "14px" }}>
              Biomarker values will appear here after you run an assessment on this device.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientProfile;
