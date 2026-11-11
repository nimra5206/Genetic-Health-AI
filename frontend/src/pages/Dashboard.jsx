import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import "./Dashboard.css";

/* ---------- helpers (isi file mein, alag file ki zaroorat nahi) ---------- */
const DISEASE_LIST = [
  "Thalassemia",
  "Hemophilia",
  "Breast Cancer",
  "Sickle Cell Anemia",
  "Cystic Fibrosis",
];

const normalizeDisease = (name) => {
  const n = String(name || "").toLowerCase();
  if (n.includes("thal")) return "Thalassemia";
  if (n.includes("hemoph")) return "Hemophilia";
  if (n.includes("breast") || n.includes("cancer")) return "Breast Cancer";
  if (n.includes("sickle")) return "Sickle Cell Anemia";
  if (n.includes("cystic") || n.includes("fibrosis")) return "Cystic Fibrosis";
  return null;
};

// Har user ki alag storage key (doosre account ka data nahi aata)
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

const getLocalHistory = () => {
  try {
    const list = JSON.parse(localStorage.getItem(`gh_history:${currentUserId()}`) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

function Dashboard({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const userObj = JSON.parse(localStorage.getItem("user") || "{}");

  const role = (userObj.role || userObj.user_type || localStorage.getItem("role") || "patient").toLowerCase();
  const isDoctor = role === "doctor";

  const currentUser = {
    name: userObj.username || userObj.name || "User",
    email: (userObj.email || "").trim().toLowerCase(),
    id: userObj.id ? `#GH-${userObj.id}` : "#GH-2026-08",
  };

  const [allAssessments, setAllAssessments] = useState([]);

  // Backend ki history ko dashboard/result pages ke format mein badalna
  const toAssessment = (item, localById) => {
    const disease = item.predicted_disease || "Unknown";
    const conf = Number(item.confidence);
    const extra = localById[String(item.id)] || {}; // probabilities / inputs agar isi browser mein maujood hon
    return {
      ...extra,
      id: `#GH-${item.id}`,
      predicted_disease: disease,
      disease_code: item.disease_code,
      title: `${disease} Screening`,
      confidence: `${Number.isNaN(conf) ? "N/A" : conf.toFixed(1)}%`,
      confidence_value: conf,
      risk: item.risk_level || "Moderate",
      risk_level: item.risk_level || "Moderate",
      date: item.created_at || new Date().toLocaleDateString(),
      patientName: item.patient_name || currentUser.name,
    };
  };

  const loadFromLocalStorage = () => {
    // Per-user local history (doosre account ka data nahi aata)
    const local = getLocalHistory().map((h) => ({
      ...h,
      id: typeof h.id === "number" ? `#GH-${h.id}` : h.id,
      title: h.predicted_disease ? `${h.predicted_disease} Screening` : h.title,
    }));
    setAllAssessments(local);
  };

  const fetchHistoryFromBackend = async () => {
    try {
      const token = localStorage.getItem("access");
      if (!token) {
        loadFromLocalStorage();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/predictions/history/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const localById = {};
        getLocalHistory().forEach((h) => {
          localById[String(h.id)] = h;
        });
        setAllAssessments(data.map((item) => toAssessment(item, localById)));
      } else {
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error("Failed to fetch history from backend, using local storage:", error);
      loadFromLocalStorage();
    }
  };

  useEffect(() => {
    // Purani shared keys saaf (inhi mein purana stale result / doosre user ka data atka hota tha)
    ["lastPrediction", "latestPrediction", "predictionResult", "latestInputs", "assessment_history"].forEach(
      (k) => localStorage.removeItem(k)
    );
    fetchHistoryFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleAssessments = allAssessments;

  const isHighRisk = (a) => String(a.risk || a.risk_level || "").toLowerCase().includes("high");

  const totalCount = visibleAssessments.length;
  const highRiskCount = visibleAssessments.filter(isHighRisk).length;
  const hasHighRisk = highRiskCount > 0;
  const normalCount = totalCount - highRiskCount;

  // Saari 5 diseases ka distribution
  const distribution = DISEASE_LIST.map((name) => {
    const count = visibleAssessments.filter(
      (a) => normalizeDisease(a.predicted_disease || a.title) === name
    ).length;
    return { name, count, percent: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0 };
  });

  return (
    <div className={`dashboard-container ${isDoctor ? "doctor-theme" : "patient-theme"}`}>

      <div className="dashboard-header-flex">
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <h1>{isDoctor ? "Clinical Dashboard" : `Welcome back, ${userObj.name || userObj.username || "Patient"}`}</h1>
        </div>
        <button className="primary-btn" onClick={() => navigate("/prediction")}>
          <span>+</span> {isDoctor ? "New Clinical Assessment" : "Start New Screening"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats-grid">
        <div className="dash-stat-card">
          <span>{isDoctor ? "Total Assessments" : "My Total Screenings"}</span>
          <h2>{totalCount}</h2>
          <small>{isDoctor ? "Assessments you have run" : "Screenings performed"}</small>
        </div>

        <div className={`dash-stat-card ${hasHighRisk ? "alert-card" : ""}`}>
          <span>High Risk Alerts</span>
          <h2>{highRiskCount}</h2>
          <small className={hasHighRisk ? "text-danger" : ""}>
            {isDoctor ? "Requires clinician review" : "Consult with your specialist"}
          </small>
        </div>

        <div className="dash-stat-card">
          <span>Moderate / Low Risk</span>
          <h2>{normalCount}</h2>
          <small>{isDoctor ? "Lower-confidence predictions" : "Lower-risk screenings"}</small>
        </div>
      </div>

      {/* Lower Main Grid */}
      <div className="dashboard-lower-grid">
        <div className="dash-box">
          <div className="dash-box-header">
            <h3>{isDoctor ? "Recent Clinical Assessments" : "My Personal Assessments"}</h3>
            <p>{isDoctor ? "Your latest AI diagnostic screening records" : "Your recent screening history"}</p>
          </div>

          <div className="dash-assessment-list">
            {visibleAssessments.length > 0 ? (
              visibleAssessments.map((item, index) => {
                const high = isHighRisk(item);
                return (
                  <div
                    key={index}
                    className="dash-assessment-row"
                    onClick={() => {
                      saveLastPrediction(item);
                      navigate(isDoctor ? "/doctor-results" : "/results");
                    }}
                  >
                    <div className="row-avatar">
                      {isDoctor ? (item.predicted_disease ? item.predicted_disease[0] : "P") : "Me"}
                    </div>
                    <div className="row-info">
                      <h4>{item.title || "Genetic Screening"}</h4>
                      <p>
                        <span>Record ID: <strong>{item.id || currentUser.id}</strong></span> •
                        <span> Date: {item.date || new Date().toLocaleDateString()}</span>
                        {isDoctor && item.patientName && <> • <span>By: <strong>{item.patientName}</strong></span></>}
                      </p>
                    </div>
                    <div className="row-badges">
                      <span className="badge-conf">{item.confidence || "N/A"}</span>
                      <span className={`badge-risk ${high ? "risk-hi" : "risk-lo"}`}>
                        {item.risk || item.risk_level || "Moderate"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state-box">
                <p>{isDoctor ? "You have not run any assessments yet." : "You have not run any personal assessments yet."}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Disorder Distribution */}
        <div className="dash-box">
          <div className="dash-box-header">
            <h3>{isDoctor ? "Disorder Distribution" : "Health Summary"}</h3>
            <p>{isDoctor ? "Breakdown of predicted genetic conditions" : "Your genetic risk analysis"}</p>
          </div>

          <div className="distribution-content-wrap">
            <div className="total-badge-circle">
              <span className="big-num">{totalCount}</span>
              <span className="small-lbl">{isDoctor ? "Evaluated Cases" : "Total Reports"}</span>
            </div>

            <div className="bars-list">
              {distribution.map((d) => (
                <div className="bar-row" key={d.name}>
                  <div className="bar-labels">
                    <span>{d.name}</span>
                    <strong>{d.percent}%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${d.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
