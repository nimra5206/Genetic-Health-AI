import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ExplainableAI.css";

function ExplainableAI() {
  const navigate = useNavigate();
  const [predictionData, setPredictionData] = useState(null);

  useEffect(() => {
    // LocalStorage se last prediction ka data retrieve karna
    const saved = localStorage.getItem("lastPrediction");
    if (saved) {
      try {
        setPredictionData(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing prediction data", e);
      }
    }
  }, []);

  const diseaseName = predictionData?.predicted_disease || "Cystic Fibrosis";
  const probability = predictionData?.probability 
    ? (predictionData.probability * 100).toFixed(1) 
    : "87.4";

  const factors = predictionData?.shap_features || [
    { feature: "Sweat Chloride", value: "88 mmol/L", importance: 88, status: "High Risk", impact: "+0.34" },
    { feature: "IL-6 Level", value: "12.4 pg/mL", importance: 74, status: "Elevated", impact: "+0.28" },
    { feature: "Family History", value: "Positive", importance: 65, status: "Present", impact: "+0.21" },
    { feature: "Sickled RBC %", value: "0.2%", importance: 15, status: "Normal", impact: "-0.05" },
    { feature: "BRCA1 Expression", value: "0.92", importance: 10, status: "Normal", impact: "-0.02" },
  ];

  return (
    <div className="xai-page">
      {/* Top Breadcrumb & Navigation Control */}
      <div style={{ marginBottom: "16px" }}>
        <button
          onClick={() => navigate("/results")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#ffffff",
            border: "1px solid #cbd5e1",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600",
            color: "#334155"
          }}
        >
          ← Back to Prediction Results
        </button>
      </div>

      {/* Summary Card */}
      <div className="xai-summary-card">
        <div className="summary-main">
          <div>
            <span className="summary-badge">Primary AI Prediction</span>
            <h2>{diseaseName}</h2>
            <p className="summary-subtext">Recent Patient Diagnostic Analysis</p>
          </div>
          <div className="confidence-pill-box">
            <span className="confidence-score">{probability}%</span>
            <span className="confidence-label">Prediction Score</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="xai-grid">
        {/* SHAP Feature Contribution */}
        <div className="xai-card feature-card">
          <div className="card-header">
            <div>
              <h3>Key Factors & Biomarker Impact</h3>
              <p className="card-subtext">Factors with the highest influence on the final result</p>
            </div>
            <span className="info-tag">Top Influencing Factors</span>
          </div>

          <div className="factor-list">
            {factors.map((factor, index) => (
              <div className="factor-item" key={index}>
                <div className="factor-top-info">
                  <div>
                    <span className="factor-name">{factor.feature}</span>
                    {factor.value && <span className="factor-val"> ({factor.value})</span>}
                  </div>
                  <div className="factor-metrics">
                    <span className={`status-badge ${factor.importance > 50 ? 'high' : 'normal'}`}>
                      {factor.status || (factor.importance > 50 ? "High Risk" : "Normal")}
                    </span>
                    <span className="impact-value">{factor.impact || `${factor.importance}%`}</span>
                  </div>
                </div>

                <div className="bar-track">
                  <div
                    className={`bar-fill ${factor.importance > 50 ? 'high-fill' : 'low-fill'}`}
                    style={{ width: `${Math.min(factor.importance, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side Stack */}
        <div className="side-stack">
          <div className="xai-card">
            <h3>Understanding Factor Impact</h3>
            <p className="card-desc">
              Impact values show how each individual health marker pushes the prediction toward or away from a specific condition.
            </p>
            <ul className="xai-bullets">
              <li><strong>Positive (+) Impact:</strong> Increases likelihood toward the predicted condition.</li>
              <li><strong>Negative (-) Impact:</strong> Decreases risk or favors a normal outcome.</li>
            </ul>
          </div>

          <div className="xai-card">
            <h3>Clinical Insight Summary</h3>
            <div className="audit-row">
              <span>Primary Biomarker</span>
              <strong>{factors[0]?.feature || "Sweat Chloride"}</strong>
            </div>
            <div className="audit-row">
              <span>Risk Classification</span>
              <strong>{Number(probability) > 70 ? "High Risk" : "Moderate Risk"}</strong>
            </div>
            <div className="audit-row">
              <span>Evaluation Status</span>
              <strong>Complete</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExplainableAI;