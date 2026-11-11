import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import "./ExplainableAI.css";

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

const box = { border: "1px solid #ddd", padding: "20px", borderRadius: "10px", background: "white" };

function ExplainableAI() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const base = getLastPrediction();
    setResult(base);
    setLoaded(true);

    // Pehle se SHAP maujood ho ya record hi na ho to kuch nahi karna
    if (!base || !base.id || (Array.isArray(base.shap_values) && base.shap_values.length > 0)) return;

    const pid = String(base.id).replace("#GH-", "");
    const token = localStorage.getItem("access");
    setLoading(true);

    fetch(`${API_BASE_URL}/api/predictions/${pid}/explain/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || d.detail || "Request failed");
        return d;
      })
      .then((d) => {
        const merged = {
          ...base,
          probabilities: d.probabilities || base.probabilities,
          inputs: d.inputs || base.inputs,
          shap_values: d.shap_values || [],
          lime_explanation: d.lime_explanation || [],
        };
        setResult(merged);
        try {
          localStorage.setItem(`gh_last_prediction:${currentUserId()}`, JSON.stringify(merged));
        } catch {}
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (!loaded) return null;

  if (!result) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>No prediction data found. Please run a prediction first.</h3>
        <button
          onClick={() => navigate("/prediction")}
          style={{ marginTop: "20px", padding: "10px 20px", background: "#0a3d8f", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          New Clinical Assessment
        </button>
      </div>
    );
  }

  const disease = result.predicted_disease || "Unknown";
  const confidence = getConfidenceNumber(result);
  const risk = getRisk(result);
  const probs = sortedProbabilities(result);
  const markers = getMarkers(disease, result.inputs);

  // Real SHAP / LIME (backend se on-demand aate hain)
  const shap = Array.isArray(result.shap_values)
    ? [...result.shap_values].sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap)).slice(0, 10)
    : [];
  const lime = Array.isArray(result.lime_explanation) ? result.lime_explanation : [];
  const maxShap = Math.max(...shap.map((s) => Math.abs(s.shap)), 1e-9);
  const maxLime = Math.max(...lime.map((l) => Math.abs(l.weight)), 1e-9);

  const emptyMsg = loading
    ? "Calculating the real SHAP / LIME explanation for this patient. This can take a few seconds…"
    : err
    ? `Could not load the explanation: ${err}`
    : "No explanation available for this assessment.";

  const left = { textAlign: "left" };

  return (
    <div style={{ padding: "20px 20px 100px", textAlign: "left", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ background: "#0a3d8f", color: "white", padding: "20px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ ...left, color: "white" }}>
          <small style={{ display: "block", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.85, color: "white", ...left }}>Clinical Reasoning</small>
          <h2 style={{ margin: "4px 0 6px", color: "white", ...left }}>{disease}</h2>
          <small style={{ display: "block", color: "white", ...left }}>Reasoning behind the most recent assessment • Risk: {risk}</small>
        </div>
        <div style={{ background: "white", color: "black", padding: "10px 15px", borderRadius: "8px", textAlign: "center" }}>
          <b>{confidence.toFixed(1)}%</b><br /><small>Prediction Score</small>
        </div>
      </div>

      {/* Row 1: probabilities | summary + markers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px", marginTop: "20px", alignItems: "start" }}>
        <div style={box}>
          <h3 style={{ marginTop: 0, marginBottom: "6px", ...left }}>Model Probability by Disorder</h3>
          <small style={{ display: "block", ...left }}>How strongly the model favoured each disorder for this patient</small>
          <div style={{ marginTop: "16px" }}>
            {probs.length > 0 ? (
              probs.map((p, i) => (
                <div key={p.name} style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <b>{p.name}</b>
                    <span>{p.value.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: "8px", background: "#eee", borderRadius: "10px", marginTop: "6px", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(p.value, 100)}%`, height: "100%", background: i === 0 ? "#0a3d8f" : "#9bbcf0", borderRadius: "10px" }} />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "#777" }}>Probabilities are available for the assessment you just ran.</p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ ...box, padding: "15px" }}>
            <b style={{ display: "block", ...left }}>Clinical Insight Summary</b>
            <div style={{ marginTop: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Predicted Disorder</span><b>{disease}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Risk Classification</span><b>{risk}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Evaluation Status</span><b>Complete</b>
              </div>
            </div>
          </div>

          <div style={{ ...box, padding: "15px" }}>
            <b style={{ display: "block", ...left }}>Submitted Key Markers</b>
            <div style={{ marginTop: "10px", fontSize: "13px" }}>
              {markers.length > 0 ? (
                markers.map((m) => (
                  <div key={m.key} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>{m.label}</span><b>{m.value}</b>
                  </div>
                ))
              ) : (
                <span style={{ color: "#777" }}>Available for the assessment you just ran.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: SHAP | LIME side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "20px", marginTop: "20px", alignItems: "start" }}>
        <div style={box}>
          <h3 style={{ marginTop: 0, marginBottom: "6px", ...left }}>Which Values Mattered Most (SHAP)</h3>
          {shap.length > 0 ? (
            <>
              <small style={{ display: "block", ...left }}>Positive values pushed the model toward {disease}; negative values pushed against it</small>
              <div style={{ marginTop: "16px" }}>
                {shap.map((s) => (
                  <div key={s.feature} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                      <b>{s.feature} <span style={{ fontWeight: 400, color: "#777" }}>({Number(s.value).toFixed(2)})</span></b>
                      <b style={{ color: s.shap >= 0 ? "#e74c3c" : "#3498db" }}>{s.shap >= 0 ? "+" : ""}{s.shap.toFixed(3)}</b>
                    </div>
                    <div style={{ height: "8px", background: "#eee", borderRadius: "10px", marginTop: "6px", overflow: "hidden" }}>
                      <div style={{ width: `${(Math.abs(s.shap) / maxShap) * 100}%`, height: "100%", background: s.shap >= 0 ? "#e74c3c" : "#3498db", borderRadius: "10px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: "#777" }}>{emptyMsg}</p>
          )}
        </div>

        <div style={box}>
          <h3 style={{ marginTop: 0, marginBottom: "6px", ...left }}>Why This Patient Was Classified This Way (LIME)</h3>
          {lime.length > 0 ? (
            <>
              <small style={{ display: "block", ...left }}>Value ranges that supported or opposed this diagnosis</small>
              <div style={{ marginTop: "16px" }}>
                {lime.map((l, i) => (
                  <div key={i} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "14px" }}>
                      <span>{l.rule}</span>
                      <b style={{ whiteSpace: "nowrap", color: l.weight >= 0 ? "#2a7f62" : "#c1443f" }}>{l.weight >= 0 ? "supports " : "opposes "}{l.weight.toFixed(3)}</b>
                    </div>
                    <div style={{ height: "8px", background: "#eee", borderRadius: "10px", marginTop: "6px", overflow: "hidden" }}>
                      <div style={{ width: `${(Math.abs(l.weight) / maxLime) * 100}%`, height: "100%", background: l.weight >= 0 ? "#2a7f62" : "#c1443f", borderRadius: "10px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: "#777" }}>{emptyMsg}</p>
          )}
        </div>
      </div>

      {/* Back button: sab se end par, beech mein, blue */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "30px" }}>
        <button
          onClick={() => navigate("/dashboard")}
          style={{ background: "#0a3d8f", color: "white", border: "none", padding: "12px 36px", borderRadius: "8px", fontSize: "15px", fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 6px rgba(10,61,143,0.3)" }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default ExplainableAI;
