import React, { useState, useEffect, useRef } from "react"; 
import { useNavigate } from "react-router-dom"; 
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./PredictionResult.css"; 

function DoctorPredictionResult() { 
  const navigate = useNavigate(); 
  const [prediction, setPrediction] = useState(null); 
  const [isExporting, setIsExporting] = useState(false);
  const [animatedProb, setAnimatedProb] = useState(0);
  
  const pdfRef = useRef(null);

  useEffect(() => { 
    const saved = localStorage.getItem("lastPrediction"); 
    if (saved) { 
      try { 
        setPrediction(JSON.parse(saved)); 
      } catch (e) { 
        console.error("Error parsing prediction data", e); 
      } 
    } 
  }, []); 

  const rawProb = prediction?.confidence ?? prediction?.probability ?? 0.874;
  const probabilityNum = rawProb <= 1 ? rawProb * 100 : rawProb;
  const probability = Number(probabilityNum).toFixed(1);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(probability);
    if (start === end) return;
    
    let totalMiliseconds = 1000;
    let incrementTime = (totalMiliseconds / end);
    
    let timer = setInterval(() => {
      start += 1;
      if (start > end) {
        setAnimatedProb(end);
        clearInterval(timer);
      } else {
        setAnimatedProb(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [probability]);

  const disease = prediction?.predicted_disease || "Hemophilia"; 
  const subclass = prediction?.subclass || "Genetic Variant Subtype"; 
  const riskLevel = prediction?.risk_level || (probabilityNum >= 70 ? "High" : probabilityNum >= 40 ? "Moderate" : "Low"); 

  const maternalRisk = prediction?.maternal_risk || 62; 
  const paternalRisk = prediction?.paternal_risk || 48; 
  const overallRisk = prediction?.overall_risk || Math.round(probabilityNum); 

  const factors = prediction?.important_factors || [ 
    "Primary Genetic Variant Expression", 
    "Elevated Biomarker Ratio", 
    "Family History Index", 
    "Pathogenic Mutation Status" 
  ]; 

  // Heavy Clinical / Doctor Recommendations
  const getClinicalRecommendations = (diseaseName) => {
    const norm = String(diseaseName || "").trim().toLowerCase();

    if (norm.includes("hemophilia")) {
      return {
        tests: ["F8 and F9 Gene Mutation Analysis via Sequencing", "Complete Blood Count (CBC) with Platelet Function Assay"],
        consultations: ["Hematology Specialist Referral (Coagulation Disorders Clinic)", "Genetic Counseling for X-Linked Inheritance Evaluation"]
      };
    }
    if (norm.includes("thalassemia")) {
      return {
        tests: ["Alpha and Beta Globin Gene Sequencing", "Quantitative Iron Panel and Liver MRI T2*"],
        consultations: ["Hematologist & Blood Disorder Specialist Referral", "Preconception and Carrier Genetic Screening Consultation"]
      };
    }
    return {
      tests: [`Comprehensive Genomic Assay for ${diseaseName}`, "Molecular Biomarker Confirmation Panel"],
      consultations: ["Specialist Medical Consultation (Relevant Department)", "Clinical Genetics Risk Evaluation"]
    };
  };

  const clinicalRecs = getClinicalRecommendations(disease);

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
            <h1 style={{ color: "#0b1f3a" }}>🔒 Clinical & Doctor Diagnostic Report</h1> 
            <p>Advanced AI feature analysis, SHAP/LIME telemetry, and specialist referral guidelines</p> 
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
            <p>Model evaluated based on deep clinical parameters input.</p> 
            <div className="confidence"> 
              <span>Confidence Probability</span> 
              <strong>{Number(animatedProb).toFixed(1)}%</strong> 
            </div> 
          </div> 

          <div className="result-card"> 
            <span className="card-badge">Molecular Subtype</span> 
            <h3>Disorder Subclass</h3> 
            <h2>{subclass}</h2> 
            <p>Deep learning gene variant identification.</p> 
          </div> 

          <div className="result-card risk-card"> 
            <span className="card-badge">Stratification Index</span> 
            <h3>Risk Level</h3> 
            <div className={`risk-value ${riskLevel.toLowerCase()}`}>{riskLevel}</div> 
            <p>Based on weighted biomarker distribution.</p> 
          </div> 
        </div> 

        {/* XAI Banner */}
        <div className="xai-banner" style={{ marginTop: "25px", border: "1px solid #0b1f3a" }}>
          <div className="xai-content">
            <h4>Explainable AI (SHAP & LIME Telemetry Insights)</h4>
            <p>Examine precise attribution vectors influencing this specific classification output.</p>
          </div>
          <button className="xai-btn" onClick={() => navigate("/explainable-ai")}>
            Launch Deep XAI Dashboard →
          </button>
        </div>

        {/* Contributing Factors */}
        <div className="analysis-section" style={{ gridTemplateColumns: "1fr", marginTop: "20px" }}>
          <div className="result-card doctor-only-section" style={{ borderTop: "4px solid #0b1f3a" }}> 
            <span className="card-badge" style={{ color: "#0b1f3a", fontWeight: "700" }}>🔒 Doctor View Telemetry</span>
            <h3>Top Contributing Clinical Biomarker Factors</h3> 
            <ol className="factor-list"> 
              {factors.map((factor, index) => ( 
                <li key={index}> 
                  <span className="factor-num">0{index + 1}</span> 
                  <span className="factor-text">{factor}</span> 
                </li> 
              ))} 
            </ol> 
          </div> 
        </div>

        {/* Clinical Recommendations & Routing */}
        <div className="recommendations-container" style={{ marginTop: "25px" }}>
          <div className="section-title">
            <h3>Advanced Clinical Tests & Department Routing</h3>
            <p>Recommended diagnostic workflows and specialist referrals for patient stabilization.</p>
          </div>

          <div className="recommendations-grid" style={{ marginTop: "15px", gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className="recommendation-card test-card">
              <div className="rec-card-header">
                <div>
                  <h4>Confirmatory Molecular Tests</h4>
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

        {/* Inheritance Risk */}
        <div className="analysis-section" style={{ gridTemplateColumns: "1fr", marginTop: "30px" }}> 
          <div className="result-card"> 
            <h3>Transmission & Inheritance Matrix</h3> 
            <div className="risk-row"><span>Maternal Transmission Risk</span><strong>{maternalRisk}%</strong></div> 
            <div className="progress"><div style={{ width: `${maternalRisk}%` }}></div></div> 
            <div className="risk-row"><span>Paternal Transmission Risk</span><strong>{paternalRisk}%</strong></div> 
            <div className="progress"><div style={{ width: `${paternalRisk}%` }}></div></div> 
            <div className="risk-row"><span>Overall Compound Risk</span><strong>{overallRisk}%</strong></div> 
            <div className="progress overall"><div style={{ width: `${overallRisk}%` }}></div></div> 
          </div> 
        </div> 

        <div className="disclaimer-card" style={{ marginTop: "30px", borderLeft: "4px solid #0b1f3a" }}>
          <div className="disclaimer-title">Clinical Compliance Notice</div>
          <p className="disclaimer-text">
            This analytical report contains sensitive clinical data and AI telemetry generated solely for certified healthcare professionals. Interpretation and clinical deployment remain strictly under the professional discretion of the attending specialist.
          </p>
        </div>
      </div>

      <div className="result-buttons"> 
        <button className="primary-btn" onClick={exportToPDF} disabled={isExporting} style={{ background: "#0b1f3a" }}>
          {isExporting ? "Generating PDF..." : "Download Official Clinical PDF"}
        </button> 
        <button className="secondary-btn" onClick={() => navigate("/explainable-ai")}>View XAI Metrics</button> 
        <button className="secondary-btn" onClick={() => navigate("/inheritance-analysis")}>Inheritance Details</button> 
        <button className="outline-btn" onClick={() => navigate("/doctor-dashboard")}>Back to Doctor Portal</button> 
      </div> 
    </div> 
  ); 
} 

export default DoctorPredictionResult;