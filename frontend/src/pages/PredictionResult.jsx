import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PredictionResult.css";

/* ---------- helpers (isi file mein, alag file ki zaroorat nahi) ---------- */
const currentUserId = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return String(u.id ?? u.email ?? u.username ?? u.name ?? "anon").toLowerCase();
  } catch {
    return "anon";
  }
};

const getLastPrediction = () => {
  try {
    return JSON.parse(localStorage.getItem(`gh_last_prediction:${currentUserId()}`) || "null");
  } catch {
    return null;
  }
};

const getConfidenceNumber = (r) => {
  if (!r) return 0;
  const raw = r.confidence_value ?? r.confidence ?? r.probability ?? 0;
  const n = typeof raw === "string" ? parseFloat(raw.replace("%", "")) : Number(raw);
  return Number.isNaN(n) ? 0 : n;
};

const getRisk = (r) => {
  if (!r) return "Low";
  if (r.risk_level || r.risk) return r.risk_level || r.risk;
  const c = getConfidenceNumber(r);
  return c >= 70 ? "High" : c >= 40 ? "Moderate" : "Low";
};

const normalizeDisease = (name) => {
  const n = String(name || "").toLowerCase();
  if (n.includes("thal")) return "Thalassemia";
  if (n.includes("hemoph")) return "Hemophilia";
  if (n.includes("breast") || n.includes("cancer")) return "Breast Cancer";
  if (n.includes("sickle")) return "Sickle Cell Anemia";
  if (n.includes("cystic") || n.includes("fibrosis")) return "Cystic Fibrosis";
  return null;
};

const sortedProbabilities = (result) => {
  const p = result?.probabilities;
  if (!p || typeof p !== "object") return [];
  return Object.entries(p)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .filter((x) => !Number.isNaN(x.value))
    .sort((a, b) => b.value - a.value);
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

const KEY_MARKERS = {
  Thalassemia: ["hemoglobin", "fetal_hemoglobin", "rdw_cv", "serum_ferritin"],
  Hemophilia: ["hemoglobin", "serum_ferritin", "fetal_hemoglobin"],
  "Breast Cancer": ["brca1_expression", "p53_mutation", "il6_level"],
  "Sickle Cell Anemia": ["sickled_rbc_percent", "hemoglobin", "fetal_hemoglobin"],
  "Cystic Fibrosis": ["sweat_chloride", "il6_level", "hemoglobin"],
};

const getMarkers = (disease, inputs) => {
  const canon = normalizeDisease(disease);
  if (!canon || !inputs) return [];
  return KEY_MARKERS[canon]
    .filter((k) => inputs[k] !== undefined && inputs[k] !== null && inputs[k] !== "")
    .map((k) => {
      const v = inputs[k];
      const value =
        k === "p53_mutation"
          ? Number(v) === 1
            ? "Mutated / Variant"
            : "Normal / Wild-type"
          : `${v}${MARKER_DEFS[k].unit ? " " + MARKER_DEFS[k].unit : ""}`;
      return { key: k, label: MARKER_DEFS[k].label, value };
    });
};

const PATIENT_PLANS = {
  Thalassemia: {
    tests: ["High-performance liquid chromatography (HPLC)", "Complete blood count with iron studies"],
    lifestyle: ["Iron intake regulation and hydration monitoring", "Regular physical activity under professional supervision"],
    specialist: ["Schedule appointment with a Clinical Hematologist", "Genetic counseling session for family history review"],
  },
  Hemophilia: {
    tests: ["Factor VIII / Factor IX activity assay", "aPTT and PT coagulation screening"],
    lifestyle: ["Avoid aspirin/NSAIDs and high-contact sports unless advised", "Keep a log of bleeding or bruising episodes"],
    specialist: ["Hematologist (coagulation / hemophilia clinic)", "Genetic counseling for X-linked inheritance"],
  },
  "Breast Cancer": {
    tests: ["BRCA1/2 confirmatory genetic testing", "Mammography / Breast MRI as advised"],
    lifestyle: ["Regular breast self-awareness and screening schedule", "Maintain healthy BMI and limit alcohol"],
    specialist: ["Oncologist / breast clinic consultation", "Genetic counseling for family risk"],
  },
  "Sickle Cell Anemia": {
    tests: ["Hemoglobin electrophoresis", "Complete blood count with reticulocyte count"],
    lifestyle: ["Maintain good hydration and avoid extreme cold", "Folic acid supplementation only if advised by a doctor"],
    specialist: ["Hematologist (sickle cell clinic)", "Regular eye and organ-function screening as advised"],
  },
  "Cystic Fibrosis": {
    tests: ["Repeat sweat chloride test and CFTR mutation panel", "Pulmonary function test (PFT)"],
    lifestyle: ["Nutrition plan with dietitian (high-calorie, enzyme support if advised)", "Airway clearance / chest physiotherapy as advised"],
    specialist: ["Pulmonologist / CF centre referral", "Genetic counseling for CFTR"],
  },
};

const GENERIC_PLAN = {
  tests: ["Confirmatory laboratory testing as advised by a doctor", "Repeat of key biomarker measurements"],
  lifestyle: ["Balanced diet and regular exercise", "Keep your reports and family history handy"],
  specialist: ["Consult a qualified healthcare professional", "Genetic counseling if recommended"],
};

const getPlan = (disease) => PATIENT_PLANS[normalizeDisease(disease)] || GENERIC_PLAN;

const card = {
  background: "white",
  border: "1px solid #e0e0e0",
  borderTop: "3px solid #0d6efd",
  padding: "20px",
  borderRadius: "8px",
};

function PredictionResult() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setResult(getLastPrediction());
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (!result) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>No report found. Please run a new prediction first.</h3>
        <button
          onClick={() => navigate("/prediction")}
          style={{ marginTop: "20px", padding: "10px 20px", background: "#0d6efd", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          Go to Risk Analysis
        </button>
      </div>
    );
  }

  // Sab kuch model ke result (backend) se
  const disease = result.predicted_disease || "Unknown";
  const confidence = getConfidenceNumber(result);
  const risk = getRisk(result);
  const riskKey = String(risk).toLowerCase();
  const probs = sortedProbabilities(result);
  const markers = getMarkers(disease, result.inputs);
  const plan = getPlan(disease);

  const riskStyle =
    riskKey === "high"
      ? { background: "#ffe0e0", color: "#d00" }
      : riskKey === "moderate"
      ? { background: "#fff4d6", color: "#a86400" }
      : { background: "#e0f5e0", color: "#0a0" };

  return (
    <div style={{ padding: "20px", background: "#f8f9fb", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#0d6efd", margin: "0" }}>{disease} Risk Assessment</h2>
        <p style={{ color: "#666" }}>
          Generated on {result.date || result.created_at || new Date().toLocaleDateString()} • AI Screening Result
          {result.id ? ` • ${result.id}` : ""}
        </p>
      </div>

      {/* Top cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px" }}>
        <div style={{ ...card, textAlign: "center" }}>
          <small style={{ color: "#888", letterSpacing: "1px" }}>EVALUATION CATEGORY</small>
          <h4 style={{ margin: "10px 0" }}>Most Likely Condition</h4>
          <h3 style={{ color: "#0d6efd", margin: "10px 0" }}>{disease}</h3>
          <small>Predicted by the AI model from your submitted biomarker values.</small>
        </div>

        <div style={{ ...card, textAlign: "center" }}>
          <small style={{ color: "#888", letterSpacing: "1px" }}>RISK CLASSIFICATION</small>
          <h4 style={{ margin: "10px 0" }}>Overall Risk Level</h4>
          <div style={{ ...riskStyle, display: "inline-block", padding: "4px 14px", borderRadius: "5px", fontWeight: "bold", margin: "10px 0" }}>
            {risk}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px", fontSize: "13px" }}>
            <span>Model Confidence</span>
            <b>{confidence.toFixed(1)}%</b>
          </div>
        </div>

        <div style={{ ...card, textAlign: "center" }}>
          <small style={{ color: "#888", letterSpacing: "1px" }}>KEY FINDINGS</small>
          <h4 style={{ margin: "10px 0" }}>Markers That Matter For {disease}</h4>
          {markers.length > 0 ? (
            <div style={{ textAlign: "left", fontSize: "13px" }}>
              {markers.slice(0, 3).map((m) => (
                <div key={m.key} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                  <span>{m.label}</span>
                  <b>{m.value}</b>
                </div>
              ))}
            </div>
          ) : (
            <small>Marker details are available for the assessment you just ran.</small>
          )}
        </div>
      </div>

      {/* Marker values + probability breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
        <div style={card}>
          <small style={{ textAlign: "center", display: "block", color: "#888" }}>YOUR SUBMITTED VALUES</small>
          <h3 style={{ textAlign: "center", margin: "5px 0 20px 0" }}>Key Biomarkers For {disease}</h3>
          {markers.length > 0 ? (
            markers.map((m) => (
              <div key={m.key} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                <span>{m.label}</span>
                <b>{m.value}</b>
              </div>
            ))
          ) : (
            <p style={{ color: "#777", fontSize: "13px", textAlign: "center" }}>
              Run a new assessment to see the submitted marker values here.
            </p>
          )}
        </div>

        <div style={card}>
          <small style={{ textAlign: "center", display: "block", color: "#888" }}>AI PROBABILITY BREAKDOWN</small>
          <h3 style={{ textAlign: "center", margin: "5px 0 20px 0" }}>Likelihood Across Disorders</h3>
          {probs.length > 0 ? (
            probs.map((p, i) => (
              <div key={p.name} style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ fontWeight: i === 0 ? "700" : "400" }}>{p.name}</span>
                  <span>{p.value.toFixed(1)}%</span>
                </div>
                <div style={{ height: "6px", background: "#eee", borderRadius: "10px", marginTop: "6px" }}>
                  <div style={{ width: `${Math.min(p.value, 100)}%`, height: "100%", background: i === 0 ? "#0d6efd" : "#9bbcf0", borderRadius: "10px" }}></div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: "#777", fontSize: "13px", textAlign: "center" }}>
              Full probability breakdown is available for the assessment you just ran.
            </p>
          )}
        </div>
      </div>

      {/* Recommended Action Plan */}
      <div style={{ marginTop: "25px" }}>
        <h3 style={{ marginBottom: "15px" }}>Recommended Action Plan for {disease}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px" }}>
          <div style={card}>
            <h4 style={{ textAlign: "center", margin: "0" }}>Suggested Diagnostic Tests</h4>
            <small style={{ textAlign: "center", display: "block", color: "#888", marginBottom: "15px" }}>Further confirmatory assays</small>
            <ol style={{ paddingLeft: "20px", fontSize: "14px" }}>
              {plan.tests.map((t, i) => <li key={i} style={{ marginBottom: "10px" }}>{t}</li>)}
            </ol>
          </div>
          <div style={{ ...card, borderTop: "3px solid #ff8c00" }}>
            <h4 style={{ textAlign: "center", margin: "0" }}>Lifestyle & Dietary Focus</h4>
            <small style={{ textAlign: "center", display: "block", color: "#888", marginBottom: "15px" }}>Preventive adjustments</small>
            <ol style={{ paddingLeft: "20px", fontSize: "14px" }}>
              {plan.lifestyle.map((t, i) => <li key={i} style={{ marginBottom: "10px" }}>{t}</li>)}
            </ol>
          </div>
          <div style={card}>
            <h4 style={{ textAlign: "center", margin: "0" }}>Specialist Consultation</h4>
            <small style={{ textAlign: "center", display: "block", color: "#888", marginBottom: "15px" }}>Expert medical review</small>
            <ol style={{ paddingLeft: "20px", fontSize: "14px" }}>
              {plan.specialist.map((t, i) => <li key={i} style={{ marginBottom: "10px" }}>{t}</li>)}
            </ol>
          </div>
        </div>
      </div>

      <p style={{ marginTop: "20px", fontSize: "12px", color: "#777" }}>
        This is an AI-assisted screening result, not a medical diagnosis. Please confirm with a qualified healthcare professional.
      </p>

      <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button onClick={() => window.print()} style={{ background: "#0d6efd", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>
          Download PDF Report
        </button>
        <button onClick={() => navigate("/recommendations")} style={{ background: "white", color: "#333", border: "1px solid #ddd", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>
          View Recommendations
        </button>
        <button onClick={() => navigate("/dashboard")} style={{ background: "white", color: "#333", border: "1px solid #ddd", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>
          Return to Dashboard
        </button>
        <button onClick={() => navigate("/prediction")} style={{ background: "white", color: "#333", border: "1px solid #ddd", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>
          Run New Assessment
        </button>
      </div>
    </div>
  );
}

export default PredictionResult;
