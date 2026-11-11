import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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

const DOCTOR_PLANS = {
  Thalassemia: {
    tests: ["Alpha and Beta globin gene sequencing", "Quantitative iron panel and liver MRI T2*"],
    consultations: ["Hematology / blood disorder specialist referral", "Preconception and carrier genetic screening consultation"],
  },
  Hemophilia: {
    tests: ["F8 and F9 gene mutation analysis via sequencing", "Factor activity assays with platelet function assessment"],
    consultations: ["Hematology referral (coagulation disorders clinic)", "Genetic counseling for X-linked inheritance evaluation"],
  },
  "Breast Cancer": {
    tests: ["BRCA1/BRCA2 and TP53 confirmatory germline testing", "Breast imaging (mammography / MRI) as clinically indicated"],
    consultations: ["Oncology / breast clinic referral", "Clinical genetics counseling for hereditary cancer risk"],
  },
  "Sickle Cell Anemia": {
    tests: ["Hemoglobin electrophoresis / HPLC with HBB gene analysis", "CBC with reticulocyte count and peripheral smear"],
    consultations: ["Hematology referral (sickle cell clinic)", "Genetic counseling for HBB inheritance"],
  },
  "Cystic Fibrosis": {
    tests: ["Confirmatory sweat chloride test and CFTR mutation panel", "Pulmonary function testing and fecal elastase"],
    consultations: ["Pulmonology / CF centre referral", "Genetic counseling for CFTR carrier screening"],
  },
};

const getDoctorPlan = (disease) =>
  DOCTOR_PLANS[normalizeDisease(disease)] || {
    tests: [`Confirmatory testing for ${disease || "the predicted disorder"}`, "Molecular biomarker confirmation panel"],
    consultations: ["Specialist consultation (relevant department)", "Clinical genetics risk evaluation"],
  };

function DoctorPredictionResult() {
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [animatedProb, setAnimatedProb] = useState(0);

  const pdfRef = useRef(null);

  useEffect(() => {
    setPrediction(getLastPrediction());
    setLoaded(true);
  }, []);

  const probabilityNum = getConfidenceNumber(prediction);

  useEffect(() => {
    const end = Number(probabilityNum);
    if (!end) {
      setAnimatedProb(0);
      return undefined;
    }
    let current = 0;
    const step = Math.max(end / 40, 0.5);
    const timer = setInterval(() => {
      current += step;
      if (current >= end) {
        setAnimatedProb(end);
        clearInterval(timer);
      } else {
        setAnimatedProb(current);
      }
    }, 25);
    return () => clearInterval(timer);
  }, [probabilityNum]);

  if (!loaded) return null;

  if (!prediction) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>No report found. Please run a new assessment first.</h3>
        <button
          onClick={() => navigate("/prediction")}
          style={{ marginTop: "20px", padding: "10px 20px", background: "#0b1f3a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          New Clinical Assessment
        </button>
      </div>
    );
  }

  // Sab kuch model ke result (backend) se
  const disease = prediction.predicted_disease || "Unknown";
  const riskLevel = getRisk(prediction);
  const probs = sortedProbabilities(prediction);
  const runnerUp = probs.length > 1 ? probs[1] : null;
  const markers = getMarkers(disease, prediction.inputs);
  const clinicalRecs = getDoctorPlan(disease);

  const exportToPDF = async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);

    try {
      const element = pdfRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const dateStr = new Date().toISOString().split("T")[0];
      pdf.save(`Clinical_Report_${disease.replace(/\s+/g, "_")}_${dateStr}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF report:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="result-page">
      <div ref={pdfRef} className="pdf-printable-area">
        <div className="result-header" style={{ borderBottom: "3px solid #0b1f3a" }}>
          <div>
            <h1 style={{ color: "#0b1f3a" }}>Clinical & Doctor Diagnostic Report</h1>
            <p>
              Model classification, probability distribution and specialist referral guidelines
              {prediction.id ? ` • ${prediction.id}` : ""}
            </p>
          </div>
          <div className="result-status" style={{ background: "#0b1f3a", color: "#fff" }}>
            <span className="pulse-dot" style={{ background: "#38bdf8" }}></span>
            Restricted Clinical Portal
          </div>
        </div>

        <div className="result-grid">
          <div className="result-card main-result">
            <span className="card-badge">AI Primary Model Classification</span>
            <h3>Predicted Genetic Disorder</h3>
            <h2>{disease}</h2>
            <p>Model evaluated from the submitted clinical parameters.</p>
            <div className="confidence">
              <span>Confidence Probability</span>
              <strong>{Number(animatedProb).toFixed(1)}%</strong>
            </div>
          </div>

          <div className="result-card">
            <span className="card-badge">Differential</span>
            <h3>Next Most Likely Disorder</h3>
            {runnerUp ? (
              <>
                <h2>{runnerUp.name}</h2>
                <p>Model probability: {runnerUp.value.toFixed(1)}%</p>
              </>
            ) : (
              <p>Differential probabilities are available for the assessment just run.</p>
            )}
          </div>

          <div className="result-card risk-card">
            <span className="card-badge">Stratification Index</span>
            <h3>Risk Level</h3>
            <div className={`risk-value ${String(riskLevel).toLowerCase()}`}>{riskLevel}</div>
            <p>Based on the model's confidence in the predicted disorder.</p>
          </div>
        </div>

        {/* XAI Banner */}
        <div className="xai-banner" style={{ marginTop: "25px", border: "1px solid #0b1f3a" }}>
          <div className="xai-content">
            <h4>Clinical Reasoning Behind This Result</h4>
            <p>See which lab values and biomarkers contributed most to this diagnosis.</p>
          </div>
          <button className="xai-btn" onClick={() => navigate("/explainable-ai")}>
            View Clinical Details →
          </button>
        </div>

        {/* Key markers */}
        <div className="analysis-section" style={{ gridTemplateColumns: "1fr", marginTop: "20px" }}>
          <div className="result-card doctor-only-section" style={{ borderTop: "4px solid #0b1f3a" }}>
            <span className="card-badge" style={{ color: "#0b1f3a", fontWeight: "700" }}>Doctor View</span>
            <h3>Key Biomarkers For {disease} (Submitted Values)</h3>
            {markers.length > 0 ? (
              <ol className="factor-list">
                {markers.map((m, index) => (
                  <li key={m.key}>
                    <span className="factor-num">0{index + 1}</span>
                    <span className="factor-text">{m.label}: <b>{m.value}</b></span>
                  </li>
                ))}
              </ol>
            ) : (
              <p>Marker values are available for the assessment just run.</p>
            )}
          </div>
        </div>

        {/* Clinical Recommendations & Routing */}
        <div className="recommendations-container" style={{ marginTop: "25px" }}>
          <div className="section-title">
            <h3>Advanced Clinical Tests & Department Routing</h3>
            <p>Suggested confirmatory workflows and specialist referrals for {disease}.</p>
          </div>

          <div className="recommendations-grid" style={{ marginTop: "15px", gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="recommendation-card test-card">
              <div className="rec-card-header">
                <div>
                  <h4>Confirmatory Tests</h4>
                  <small>Sequencing and assays</small>
                </div>
              </div>
              <ul className="rec-list">
                {clinicalRecs.tests.map((item, idx) => (
                  <li key={idx}><span className="item-index">{idx + 1}</span><span className="item-text">{item}</span></li>
                ))}
              </ul>
            </div>

            <div className="recommendation-card doctor-card">
              <div className="rec-card-header">
                <div>
                  <h4>Specialist Department Referrals</h4>
                  <small>Inter-departmental routing</small>
                </div>
              </div>
              <ul className="rec-list">
                {clinicalRecs.consultations.map((item, idx) => (
                  <li key={idx}><span className="item-index">{idx + 1}</span><span className="item-text">{item}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Probability distribution (real model output) */}
        <div className="analysis-section" style={{ gridTemplateColumns: "1fr", marginTop: "30px" }}>
          <div className="result-card">
            <h3>Model Probability Distribution</h3>
            {probs.length > 0 ? (
              probs.map((p, i) => (
                <div key={p.name}>
                  <div className="risk-row">
                    <span>{p.name}</span>
                    <strong>{p.value.toFixed(1)}%</strong>
                  </div>
                  <div className={`progress ${i === 0 ? "overall" : ""}`}>
                    <div style={{ width: `${Math.min(p.value, 100)}%` }}></div>
                  </div>
                </div>
              ))
            ) : (
              <p>Probability distribution is available for the assessment just run.</p>
            )}
          </div>
        </div>

        <div className="disclaimer-card" style={{ marginTop: "30px", borderLeft: "4px solid #0b1f3a" }}>
          <div className="disclaimer-title">Clinical Compliance Notice</div>
          <p className="disclaimer-text">
            This report is AI-generated decision support for certified healthcare professionals. It is not a diagnosis; interpretation and clinical decisions remain with the attending specialist.
          </p>
        </div>
      </div>

      <div className="result-buttons">
         <button 
    onClick={exportToPDF} 
    disabled={isExporting}
    style={{ 
      background: "#0d6efd", 
      color: "white", 
      border: "none", 
      padding: "12px 24px", 
      borderRadius: "8px", 
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "14px",
      boxShadow: "0 4px 12px rgba(13, 110, 253, 0.3)"
    }}>
    {isExporting ? "Generating PDF..." : "📄 Download PDF Report"}
  </button>
        <button className="secondary-btn" onClick={() => navigate("/explainable-ai")}>Clinical Reasoning</button>
        <button className="secondary-btn" onClick={() => navigate("/recommendations")}>Recommendations</button>
        <button className="outline-btn" onClick={() => navigate("/dashboard")}>Back to Doctor Portal</button>
      </div>
    </div>
  );
}

export default DoctorPredictionResult;
