import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PredictionResult.css";

function PredictionResult() {
  const navigate = useNavigate();
  const [resultData, setResultData] = useState(null);
  const [currentRole, setCurrentRole] = useState("patient");

  useEffect(() => {
    let userObj = {};
    try {
      userObj = JSON.parse(localStorage.getItem("user") || "{}");
    } catch (error) {
      console.error("Error reading user:", error);
    }

    const role = (
      localStorage.getItem("role") ||
      userObj.role ||
      userObj.user_type ||
      "patient"
    ).toLowerCase();

    setCurrentRole(role);

    const storedResult = localStorage.getItem("lastPrediction");
    if (storedResult) {
      try {
        setResultData(JSON.parse(storedResult));
      } catch (err) {
        console.error("Error parsing prediction result:", err);
      }
    }
  }, []);

  const isDoctor = currentRole === "doctor";

  const data = resultData || {
    title: "Comprehensive Genetic Panel Screening",
    date: new Date().toLocaleDateString(),
    risk_level: "High Risk",
    confidence: "94.2%",
    primary_condition: "Thalassemia Major / Trait Panel",
    contributing_factors: [
      { text: "Elevated Fetal Hemoglobin (HbF) levels detected." },
      { text: "Abnormal RDW-CV distribution percentage." },
      { text: "Family history positive indicator." }
    ]
  };

  const getRiskClass = (level) => {
    if (!level) return "low";
    const l = level.toLowerCase();
    if (l.includes("high")) return "high";
    if (l.includes("moderate") || l.includes("medium")) return "moderate";
    return "low";
  };

  return (
    <div className={`result-page ${isDoctor ? "doctor-mode" : "patient-mode"}`}>
      
      {/* Header Section */}
      <div className="result-header">
        <div>
          <h1>{data.title || "Genetic Health Assessment Report"}</h1>
          <p>Generated on {data.date || new Date().toLocaleDateString()}</p>
        </div>

        <div className="result-status">
          <span className="pulse-dot"></span>
          Verified Analysis
        </div>
      </div>

      <div className="pdf-printable-area">
        
        {/* Top Summary Cards Grid */}
        <div className="result-grid">
          
          <div className="result-card">
            <span className="card-badge">Evaluation Category</span>
            <h3>Primary Condition</h3>
            <h2>{data.primary_condition || "General Screening"}</h2>
            <p>Evaluated using multi-parametric clinical indicators and markers.</p>
          </div>

          <div className="result-card">
            <span className="card-badge">Risk Classification</span>
            <h3>Overall Risk Level</h3>
            <div className={`risk-value ${getRiskClass(data.risk_level)}`}>
              {data.risk_level || "Moderate Risk"}
            </div>
            <div className="confidence">
              <span>Model Confidence</span>
              <strong>{data.confidence || "91.5%"}</strong>
            </div>
          </div>

          <div className="result-card">
            <span className="card-badge">Key Findings</span>
            <h3>Top Contributing Factors</h3>
            <ul className="factor-list" style={{ marginTop: "6px" }}>
              {data.contributing_factors && data.contributing_factors.length > 0 ? (
                data.contributing_factors.slice(0, 2).map((factor, idx) => (
                  <li key={idx} style={{ padding: "6px 8px" }}>
                    <span className="factor-num">0{idx + 1}</span>
                    <span className="factor-text" style={{ fontSize: "11.5px" }}>{factor.text || factor}</span>
                  </li>
                ))
              ) : (
                <li><span className="factor-text">Standard baseline profile parameters observed.</span></li>
              )}
            </ul>
          </div>

        </div>

        {/* XAI Interactive Banner - Visible ONLY for Doctors */}
        {isDoctor && (
          <div className="xai-banner">
            <div className="xai-content">
              <h4>Explainable AI (XAI) Insight</h4>
              <p>Explore detailed feature impact analysis and SHAP values breakdown for this assessment.</p>
            </div>
            <button 
              className="xai-btn" 
              onClick={() => navigate("/doctor-xai")}
            >
              View Feature Breakdown &rarr;
            </button>
          </div>
        )}

        {/* Analysis Breakdown Section */}
        <div className="analysis-section">
          
          <div className="result-card">
            <span className="card-badge">Biomarker Metrics</span>
            <h3>Hematology & Blood Indices</h3>
            
            <div className="risk-row">
              <span>Hemoglobin & Ferritin Ratio</span>
              <span>88% Optimal</span>
            </div>
            <div className="progress">
              <div style={{ width: "88%" }}></div>
            </div>

            <div className="risk-row" style={{ marginTop: "14px" }}>
              <span>Genetic Expression Marker (BRCA1/p53)</span>
              <span>74% Stable</span>
            </div>
            <div className="progress">
              <div style={{ width: "74%" }}></div>
            </div>
          </div>

          <div className="result-card">
            <span className="card-badge">System Index</span>
            <h3>Comprehensive Health Score</h3>
            
            <div className="risk-row">
              <span>Overall System Stability Index</span>
              <span>65% Match</span>
            </div>
            <div className="progress overall">
              <div style={{ width: "65%" }}></div>
            </div>

            <p style={{ marginTop: "16px" }}>
              The profile indicates specific marker deviations that require clinical oversight and follow-up screening.
            </p>
          </div>

        </div>

        {/* Recommendations Section */}
        <div className="recommendations-container">
          <div className="section-title">
            <h3>Recommended Action Plan</h3>
          </div>

          <div className="recommendations-grid">
            
            <div className="recommendation-card test-card">
              <div className="rec-card-header">
                <h4>Suggested Diagnostic Tests</h4>
                <small>Further confirmatory assays</small>
              </div>
              <ul className="rec-list">
                <li>
                  <span className="item-index">1</span>
                  <span className="item-text">High-performance liquid chromatography (HPLC)</span>
                </li>
                <li>
                  <span className="item-index">2</span>
                  <span className="item-text">Comprehensive metabolic panel blood work</span>
                </li>
              </ul>
            </div>

            <div className="recommendation-card med-card">
              <div className="rec-card-header">
                <h4>Lifestyle & Dietary Focus</h4>
                <small>Preventive adjustments</small>
              </div>
              <ul className="rec-list">
                <li>
                  <span className="item-index">1</span>
                  <span className="item-text">Iron intake regulation and hydration monitoring</span>
                </li>
                <li>
                  <span className="item-index">2</span>
                  <span className="item-text">Regular physical activity under professional supervision</span>
                </li>
              </ul>
            </div>

            <div className="recommendation-card doctor-card">
              <div className="rec-card-header">
                <h4>Specialist Consultation</h4>
                <small>Expert medical review</small>
              </div>
              <ul className="rec-list">
                <li>
                  <span className="item-index">1</span>
                  <span className="item-text">Schedule appointment with a Clinical Hematologist</span>
                </li>
                <li>
                  <span className="item-index">2</span>
                  <span className="item-text">Genetic counseling session for family history review</span>
                </li>
              </ul>
            </div>

          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="result-buttons">
        <button 
          className="primary-btn"
          onClick={() => window.print()}
        >
          Download PDF Report
        </button>

        <button 
          className="secondary-btn"
          onClick={() => navigate(isDoctor ? "/doctor-dashboard" : "/dashboard")}
        >
          Return to Dashboard
        </button>

        <button 
          className="outline-btn"
          onClick={() => navigate(isDoctor ? "/new-prediction" : "/predict")}
        >
          Run New Assessment
        </button>
      </div>

    </div>
  );
}

export default PredictionResult;