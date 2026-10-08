import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientProfile.css";

function PatientProfile() {
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    // Recent prediction context se patient info retrieve karna
    const saved = localStorage.getItem("lastPrediction");
    if (saved) {
      try {
        setPatientData(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing patient data", e);
      }
    }
  }, []);

  // Fallback data agar koi prediction execute na hui ho
  const patientId = patientData?.patient_id || "GEN-001";
  const patientName = patientData?.patient_name || "Patient 001";
  const age = patientData?.age || "28 Years";
  const gender = patientData?.gender || "Female";
  const bloodTest = patientData?.blood_test || "Normal";

  const familyHistory = patientData?.family_history || "Yes";
  const inheritedFromFather = patientData?.father_inherited || "Yes";
  const maternalGene = patientData?.maternal_gene || "Present";
  const paternalGene = patientData?.paternal_gene || "Present";

  const symptoms = patientData?.symptoms || [
    "Fatigue",
    "Breathing Difficulty",
    "Weakness",
    "Abnormal Blood Test"
  ];

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="page-heading">
        <div className="heading-title-box">
          <h1>Patient Profile</h1>
          <p>Patient clinical information and genetic health overview</p>
        </div>
        <button className="primary-action-btn" onClick={() => navigate("/prediction")}>
          + New Prediction
        </button>
      </div>

      {/* Main Grid */}
      <div className="profile-grid">
        {/* Patient Core Details */}
        <div className="profile-card hero-card">
          <div className="avatar">{patientName.charAt(0)}</div>
          <h2>{patientName}</h2>
          <span className="patient-id-badge">ID: {patientId}</span>

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
              <span>Blood Test</span>
              <strong className="status-highlight">{bloodTest}</strong>
            </div>
          </div>
        </div>

        {/* Family & Genetic Background */}
        <div className="profile-card">
          <div className="card-header">
            <h3>Family & Genetic Information</h3>
            <span className="info-tag">Pedigree Data</span>
          </div>

          <div className="info-grid">
            <div className="info-row">
              <span>Family History</span>
              <strong>{familyHistory}</strong>
            </div>

            <div className="info-row">
              <span>Inherited from Father</span>
              <strong>{inheritedFromFather}</strong>
            </div>

            <div className="info-row">
              <span>Maternal Gene</span>
              <strong>{maternalGene}</strong>
            </div>

            <div className="info-row">
              <span>Paternal Gene</span>
              <strong>{paternalGene}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Reported Symptoms */}
      <div className="profile-card symptoms-card">
        <h3>Reported Symptoms</h3>
        <div className="symptom-list">
          {symptoms.map((symptom, index) => (
            <span key={index} className="symptom-chip">
              • {symptom}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PatientProfile;