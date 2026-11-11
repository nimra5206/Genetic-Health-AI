import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import "./NewPrediction.css";

/* ---------- helpers: har user ki alag storage key (doosre account ka data nahi aata) ---------- */
const currentUserId = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return String(u.id ?? u.email ?? u.username ?? u.name ?? "anon").toLowerCase();
  } catch {
    return "anon";
  }
};

const saveLastPrediction = (result) => {
  try {
    localStorage.setItem(`gh_last_prediction:${currentUserId()}`, JSON.stringify(result));
  } catch {
    /* ignore */
  }
};

const pushLocalHistory = (item) => {
  try {
    const key = `gh_history:${currentUserId()}`;
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    list.unshift(item);
    localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* ignore */
  }
};

// Presets = asli dataset ke har disease ke class-average values (notebook Section 1.5).
// NOTE: dataset mein "Normal/Healthy" class hi nahi hai, isliye Normal preset hata diya gaya hai.
const PRESETS = {
  thalassemia: {
    age: "41", gender: "1", family_history: "0",
    hemoglobin: "8.2", fetal_hemoglobin: "14.9", rdw_cv: "17.2", serum_ferritin: "50",
    brca1_expression: "0.21", p53_mutation: "0",
    sweat_chloride: "41.4", sickled_rbc_percent: "1", il6_level: "5.5",
  },
  hemophilia: {
    age: "42", gender: "0", family_history: "0",
    hemoglobin: "10.4", fetal_hemoglobin: "4.9", rdw_cv: "14.1", serum_ferritin: "122",
    brca1_expression: "0.20", p53_mutation: "0",
    sweat_chloride: "39.9", sickled_rbc_percent: "1.4", il6_level: "4.9",
  },
  breast_cancer: {
    age: "39", gender: "1", family_history: "0",
    hemoglobin: "13.4", fetal_hemoglobin: "1.5", rdw_cv: "13.6", serum_ferritin: "98",
    brca1_expression: "0.72", p53_mutation: "1",
    sweat_chloride: "42.2", sickled_rbc_percent: "1.3", il6_level: "19.2",
  },
  sickle_cell: {
    age: "40", gender: "0", family_history: "0",
    hemoglobin: "7.2", fetal_hemoglobin: "17.1", rdw_cv: "17.9", serum_ferritin: "98",
    brca1_expression: "0.21", p53_mutation: "0",
    sweat_chloride: "40.3", sickled_rbc_percent: "28", il6_level: "5",
  },
  cystic_fibrosis: {
    age: "38", gender: "1", family_history: "0",
    hemoglobin: "13.3", fetal_hemoglobin: "1.3", rdw_cv: "13.6", serum_ferritin: "129",
    brca1_expression: "0.21", p53_mutation: "0",
    sweat_chloride: "69", sickled_rbc_percent: "1.4", il6_level: "17.7",
  },
};

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

    if (PRESETS[type]) {
      setForm({ ...PRESETS[type] });
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

      // Title ab preset se nahi, model ki asli prediction se banta hai
      const evaluatedTitle = data.predicted_disease
        ? `${data.predicted_disease} Risk Assessment`
        : "Comprehensive Genetic Panel Screening";

      const fullResult = {
        ...data,
        id: data.id || `#GH-${Math.floor(1000 + Math.random() * 9000)}`,
        title: evaluatedTitle,
        primary_condition: data.predicted_disease,
        risk: data.risk_level || data.risk || "Moderate",
        confidence: `${Number(data.confidence).toFixed(1)}%`,
        confidence_value: Number(data.confidence),
        inputs: payload,
        date: new Date().toLocaleDateString(),
        patientEmail: userObj.email || "",
        patientName: userObj.username || userObj.name || "Patient"
      };

      // Sirf is user ke liye save hota hai (doosre account ko nazar nahi aata)
      saveLastPrediction(fullResult);
      pushLocalHistory(fullResult);

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
            <option value="thalassemia">
              Thalassemia Pattern
            </option>
            <option value="hemophilia">
              Hemophilia Pattern
            </option>
            <option value="breast_cancer">
              Breast Cancer Pattern (BRCA1/p53)
            </option>
            <option value="sickle_cell">
              Sickle Cell Anemia Pattern
            </option>
            <option value="cystic_fibrosis">
              Cystic Fibrosis Pattern
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
