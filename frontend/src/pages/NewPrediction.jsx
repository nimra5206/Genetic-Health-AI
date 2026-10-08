import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import "./NewPrediction.css";

function NewPrediction() {
  const navigate = useNavigate();

  let userObj = {};

  try {
    userObj = JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch (error) {
    console.error("Error reading user:", error);
  }

  const currentRole = (
    localStorage.getItem("role") ||
    userObj.role ||
    userObj.user_type ||
    "patient"
  ).toLowerCase();

  const isPatient = currentRole === "patient";

  const emptyFormState = {
    age: "",
    gender: "",
    family_history: "",
    hemoglobin: "",
    fetal_hemoglobin: "",
    rdw_cv: "",
    serum_ferritin: "",
    brca1_expression: "",
    p53_mutation: "",
    sweat_chloride: "",
    sickled_rbc_percent: "",
    il6_level: "",
  };

  const [form, setForm] = useState(emptyFormState);
  const [selectedDisease, setSelectedDisease] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const handleDiseasePreset = (e) => {
    const type = e.target.value;

    setSelectedDisease(type);

    if (type === "normal") {
      setForm({
        age: "28",
        gender: "0",
        family_history: "0",
        hemoglobin: "14.2",
        fetal_hemoglobin: "0.5",
        rdw_cv: "12.5",
        serum_ferritin: "110",
        brca1_expression: "0.95",
        p53_mutation: "0",
        sweat_chloride: "18",
        sickled_rbc_percent: "0",
        il6_level: "2.1",
      });
    } else if (type === "thalassemia") {
      setForm({
        age: "24",
        gender: "1",
        family_history: "1",
        hemoglobin: "9.5",
        fetal_hemoglobin: "4.2",
        rdw_cv: "18.2",
        serum_ferritin: "320",
        brca1_expression: "0.88",
        p53_mutation: "0",
        sweat_chloride: "22",
        sickled_rbc_percent: "0.1",
        il6_level: "5.4",
      });
    } else if (type === "cystic_fibrosis") {
      setForm({
        age: "18",
        gender: "0",
        family_history: "1",
        hemoglobin: "13.0",
        fetal_hemoglobin: "0.8",
        rdw_cv: "13.8",
        serum_ferritin: "85",
        brca1_expression: "0.90",
        p53_mutation: "0",
        sweat_chloride: "88",
        sickled_rbc_percent: "0.0",
        il6_level: "14.2",
      });
    } else if (type === "sickle_cell") {
      setForm({
        age: "22",
        gender: "1",
        family_history: "1",
        hemoglobin: "8.2",
        fetal_hemoglobin: "12.5",
        rdw_cv: "19.0",
        serum_ferritin: "210",
        brca1_expression: "0.92",
        p53_mutation: "0",
        sweat_chloride: "25",
        sickled_rbc_percent: "28.5",
        il6_level: "6.8",
      });
    } else if (type === "hereditary_cancer") {
      setForm({
        age: "42",
        gender: "1",
        family_history: "1",
        hemoglobin: "12.1",
        fetal_hemoglobin: "0.4",
        rdw_cv: "14.1",
        serum_ferritin: "95",
        brca1_expression: "0.42",
        p53_mutation: "1",
        sweat_chloride: "20",
        sickled_rbc_percent: "0.0",
        il6_level: "8.5",
      });
    } else {
      setForm(emptyFormState);
    }
  };

  const handleChange = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setToastMessage(null);

    const token = localStorage.getItem("access");

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const diseaseTitles = {
      normal: "Normal Health Screening",
      thalassemia: "Thalassemia Major / Trait Panel",
      cystic_fibrosis: "Cystic Fibrosis Screening",
      sickle_cell: "Sickle Cell Anemia Panel",
      hereditary_cancer: "Hereditary Cancer Risk (BRCA/p53)",
    };

    const evaluatedTitle =
      diseaseTitles[selectedDisease] ||
      "Comprehensive Genetic Panel Screening";

    const payload = {
      age: Number(form.age),
      gender: Number(form.gender),
      family_history: Number(form.family_history),
      hemoglobin: Number(form.hemoglobin),
      fetal_hemoglobin: Number(form.fetal_hemoglobin),
      rdw_cv: Number(form.rdw_cv),
      serum_ferritin: Number(form.serum_ferritin),
      brca1_expression: Number(form.brca1_expression),
      p53_mutation: Number(form.p53_mutation),
      sweat_chloride: Number(form.sweat_chloride),
      sickled_rbc_percent: Number(form.sickled_rbc_percent),
      il6_level: Number(form.il6_level),
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/predictions/predict/`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(
          `Server returned ${response.status}: ${text}`
        );
      }

      if (!response.ok) {
        const errorMessage =
          data?.error ||
          data?.detail ||
          data?.message ||
          "Prediction request failed.";

        throw new Error(errorMessage);
      }

      const fullResult = {
        ...data,
        id: data.id || `#GH-${Math.floor(1000 + Math.random() * 9000)}`,
        title: evaluatedTitle,
        risk: data.risk_level || data.risk || "Moderate",
        confidence: `${data.confidence || 94}%`,
        date: new Date().toLocaleDateString(),
        patientEmail: userObj.email || "",
        patientName: userObj.username || userObj.name || "Patient"
      };

      // 1. Last prediction save karein result page ke liye
      localStorage.setItem(
        "lastPrediction",
        JSON.stringify(fullResult)
      );

      // 2. Assessment history mein push karein taake Dashboard live update ho jaye
      const existingHistory = JSON.parse(localStorage.getItem("assessment_history") || "[]");
      existingHistory.unshift(fullResult);
      localStorage.setItem("assessment_history", JSON.stringify(existingHistory));

      setToastMessage({
        type: "success",
        text: "Analysis completed successfully! Redirecting...",
      });

      setTimeout(() => {
        navigate(
          currentRole === "doctor"
            ? "/doctor-results"
            : "/results"
        );
      }, 800);

    } catch (error) {
      console.error("Prediction error:", error);

      setToastMessage({
        type: "error",
        text:
          error.message ||
          "Prediction could not be completed. Please check the backend connection.",
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`prediction-page ${currentRole === "doctor" ? "doctor-mode" : "patient-mode"}`}>
      
      <div className="prediction-header">

        <div className="heading-title-box">
          <h1>
            {isPatient
              ? "Personal Genetic Health Assessment"
              : "New Patient Risk Analysis"}
          </h1>
        </div>

        <div className="preset-card-box">
          <label
            className="preset-label"
            htmlFor="disease-preset-select"
          >
            Quick Preset Loader:
          </label>

          <select
            id="disease-preset-select"
            className="disease-select-dropdown"
            value={selectedDisease}
            onChange={handleDiseasePreset}
          >
            <option value="">
              Manual Entry (Blank Fields)
            </option>
            <option value="normal">
              Normal Health Sample
            </option>
            <option value="thalassemia">
              Thalassemia Pattern
            </option>
            <option value="cystic_fibrosis">
              Cystic Fibrosis Pattern
            </option>
            <option value="sickle_cell">
              Sickle Cell Anemia Pattern
            </option>
            <option value="hereditary_cancer">
              Hereditary Cancer Risk (BRCA1/p53)
            </option>
          </select>
        </div>

      </div>

      {toastMessage && (
        <div className={`toast-banner ${toastMessage.type}`}>
          {toastMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* Demographics */}
        <div className="form-card">
          <div className="card-title-row">
            <h2>1. Demographics & Background</h2>
          </div>

          <div className="form-grid">
            <div className="input-field-group">
              <label>Age (Years)</label>
              <input
                type="number"
                name="age"
                min="0"
                max="100"
                placeholder="e.g., 25"
                value={form.age}
                onChange={handleChange}
                required
              />
              <span className="range-hint">
                Standard Range: 0 - 100 yrs
              </span>
            </div>

            <div className="input-field-group">
              <label>Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select gender</option>
                <option value="0">Male</option>
                <option value="1">Female</option>
              </select>
              <span className="range-hint">
                Biological sex assigned at birth
              </span>
            </div>

            <div className="input-field-group">
              <label>Family History of Disorder</label>
              <select
                name="family_history"
                value={form.family_history}
                onChange={handleChange}
                required
              >
                <option value="">Select option</option>
                <option value="0">No known history</option>
                <option value="1">Yes (Parent/Sibling affected)</option>
              </select>
              <span className="range-hint">
                Known genetic condition in family
              </span>
            </div>
          </div>
        </div>

        {/* Blood */}
        <div className="form-card">
          <div className="card-title-row">
            <h2>2. Blood & Hematology Markers</h2>
          </div>

          <div className="form-grid">
            <div className="input-field-group">
              <label>Hemoglobin (Hb)</label>
              <input
                type="number"
                step="any"
                name="hemoglobin"
                placeholder="e.g., 13.5"
                value={form.hemoglobin}
                onChange={handleChange}
                required
              />
              <span className="range-hint">
                Normal: 12.0 - 17.5 g/dL
              </span>
            </div>

            <div className="input-field-group">
              <label>Fetal Hemoglobin (HbF)</label>
              <input
                type="number"
                step="any"
                name="fetal_hemoglobin"
                placeholder="e.g., 0.8"
                value={form.fetal_hemoglobin}
                onChange={handleChange}
                required
              />
              <span className="range-hint">
                Normal: &lt; 2.0 %
              </span>
            </div>

            <div className="input-field-group">
              <label>RDW-CV (%)</label>
              <input
                type="number"
                step="any"
                name="rdw_cv"
                placeholder="e.g., 12.8"
                value={form.rdw_cv}
                onChange={handleChange}
                required
              />
              <span className="range-hint">
                Normal: 11.5 - 14.5 %
              </span>
            </div>

            <div className="input-field-group">
              <label>Serum Ferritin</label>
              <input
                type="number"
                step="any"
                name="serum_ferritin"
                placeholder="e.g., 120"
                value={form.serum_ferritin}
                onChange={handleChange}
                required
              />
              <span className="range-hint">
                Normal: 30 - 300 ng/mL
              </span>
            </div>

            <div className="input-field-group">
              <label>BRCA1 Expression Ratio</label>
              <input
                type="number"
                step="any"
                min="0"
                max="1"
                name="brca1_expression"
                placeholder="e.g., 0.95"
                value={form.brca1_expression}
                onChange={handleChange}
                required
              />
              <span className="range-hint">
                Normal: 0.80 - 1.00 (Normalized)
              </span>
            </div>

            <div className="input-field-group">
              <label>p53 Gene Status</label>
              <select
                name="p53_mutation"
                value={form.p53_mutation}
                onChange={handleChange}
                required
              >
                <option value="">Select status</option>
                <option value="0">Normal / Wild-type</option>
                <option value="1">Mutated / Variant Identified</option>
              </select>
              <span className="range-hint">
                Tumor suppressor gene profile
              </span>
            </div>
          </div>
        </div>

        {/* Disease-specific */}
        <div className="form-card">
          <div className="card-title-row">
            <h2>3. Disease-Specific Clinical Assays</h2>
          </div>

          <div className="form-grid">
            <div className="input-field-group">
              <label>Sweat Chloride</label>
              <input
                type="number"
                step="any"
                name="sweat_chloride"
                placeholder="e.g., 20"
                value={form.sweat_chloride}
                onChange={handleChange}
                required
              />
              <span className="range-hint">
                Normal: &lt; 30 mmol/L
              </span>
            </div>

            <div className="input-field-group">
              <label>Sickled RBC Percentage</label>
              <input
                type="number"
                step="any"
                name="sickled_rbc_percent"
                placeholder="e.g., 0.0"
                value={form.sickled_rbc_percent}
                onChange={handleChange}
                required
              />
              <span className="range-hint">
                Normal: 0.0%
              </span>
            </div>

            <div className="input-field-group">
              <label>IL-6 Inflammatory Level</label>
              <input
                type="number"
                step="any"
                name="il6_level"
                placeholder="e.g., 2.5"
                value={form.il6_level}
                onChange={handleChange}
                required
              />
              <span className="range-hint">
                Normal: &lt; 5.0 pg/mL
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-action-btn submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-wrapper">
                <span className="spinner"></span>
                Evaluating...
              </span>
            ) : (
              "Run AI Prediction"
            )}
          </button>
        </div>

      </form>

    </div>
  );
}

export default NewPrediction;