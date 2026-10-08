import React, { useState } from "react";
import "./DiseaseExplorer.css";

function DiseaseExplorer() {
  const [selectedDisease, setSelectedDisease] = useState(null);

  // User role detect karne ke liye logic
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch (error) {
    console.error("Error reading localStorage:", error);
  }

  const storedRole =
    localStorage.getItem("role") ||
    user.role ||
    user.user_type ||
    "patient";

  const isDoctor = String(storedRole).toLowerCase() === "doctor";

  const diseases = [
    {
      id: "thalassemia",
      title: "Thalassemia",
      category: "Inherited Blood Disorder",
      bgClass: "card-theme-teal",
      description:
        "Reduced or absent production of hemoglobin chains causing chronic anemia and fatigue.",
      symptoms: ["Fatigue and weakness", "Pale or yellowish skin", "Facial bone deformities"],
      biomarkers: ["Hemoglobin", "Fetal Hemoglobin", "RDW-CV", "Serum Ferritin"]
    },
    {
      id: "hemophilia",
      title: "Hemophilia",
      category: "Bleeding Disorder",
      bgClass: "card-theme-rose",
      description:
        "Deficiency of essential blood clotting factors leading to prolonged bleeding episodes.",
      symptoms: ["Excessive bleeding from cuts", "Spontaneous joint bleeds", "Easy bruising"],
      biomarkers: ["Family History", "Hemoglobin", "IL-6 Level"]
    },
    {
      id: "breast-cancer",
      title: "Breast Cancer",
      category: "Oncology",
      bgClass: "card-theme-purple",
      description:
        "Malignant proliferation of breast tissue; a significant subset is hereditary.",
      symptoms: ["New breast lump or mass", "Change in breast shape", "Skin dimpling"],
      biomarkers: ["BRCA1 Expression", "p53 Mutation", "IL-6 Level", "Family History"]
    },
    {
      id: "sickle-cell",
      title: "Sickle Cell Anemia",
      category: "Inherited Blood Disorder",
      bgClass: "card-theme-amber",
      description:
        "Abnormal hemoglobin causing red blood cells to deform into sickles and obstruct flow.",
      symptoms: ["Painful vaso-occlusive crises", "Chronic anemia", "Swelling of hands and feet"],
      biomarkers: ["Sickled RBC Percentage", "Hemoglobin", "Fetal Hemoglobin", "RDW-CV"]
    },
    {
      id: "cystic-fibrosis",
      title: "Cystic Fibrosis",
      category: "Multisystem Genetic Disorder",
      bgClass: "card-theme-blue",
      isCentered: true,
      description:
        "CFTR gene dysfunction causing abnormally thick mucus in lungs and digestive tract.",
      symptoms: ["Persistent cough with thick mucus", "Recurrent lung infections", "Poor weight gain"],
      biomarkers: ["Sweat Chloride", "Family History", "IL-6 Level"]
    }
  ];

  return (
    <div className={`explorer-container ${!isDoctor ? "patient-theme" : ""}`}>
      {/* Page Header */}
      <div className="explorer-header">
        <h1>Disease & Disorder Explorer</h1>
      </div>

      {/* Grid Layout Container */}
      <div className="explorer-wrapper">
        <div className="disease-compact-grid">
          {diseases.map((d) => (
            <div
              key={d.id}
              className={`compact-card ${d.bgClass} ${d.isCentered ? "center-card" : ""}`}
              onClick={() => setSelectedDisease(d)}
            >
              <div className="compact-top">
                <span className="compact-category">{d.category}</span>
              </div>
              
              <div className="card-body">
                <h3 className="compact-title">{d.title}</h3>
                <p className="compact-snippet">{d.description}</p>
              </div>

              <div className="compact-footer">
                <span>View Details</span>
                <span className="arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal Popup */}
      {selectedDisease && (
        <div className="modal-overlay" onClick={() => setSelectedDisease(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedDisease(null)}>
              ✕
            </button>

            <div className="modal-header">
              <div>
                <h2 className="modal-title">{selectedDisease.title}</h2>
                <span className="modal-category">{selectedDisease.category}</span>
              </div>
            </div>

            <p className="modal-description">{selectedDisease.description}</p>

            <div className="modal-section">
              <h4>Key Clinical Symptoms</h4>
              <div className="symptoms-badges">
                {selectedDisease.symptoms.map((s, idx) => (
                  <span key={idx} className="symptom-badge">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="modal-section">
              <h4>Relevant Biomarkers & Factors</h4>
              <div className="modal-chips">
                {selectedDisease.biomarkers.map((b, idx) => (
                  <span key={idx} className="modal-chip">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <button className="modal-action-btn" onClick={() => setSelectedDisease(null)}>
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiseaseExplorer;