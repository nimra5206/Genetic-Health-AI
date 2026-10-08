import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import "./Dashboard.css";

function Dashboard({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const userObj = JSON.parse(localStorage.getItem("user") || "{}");
  
  const role = (userObj.role || userObj.user_type || "patient").toLowerCase();
  const isDoctor = role === "doctor";
  
  const currentUser = { 
    name: userObj.username || userObj.name || 'User', 
    email: (userObj.email || "").trim().toLowerCase(),
    id: userObj.id ? `#GH-${userObj.id}` : '#GH-2026-08' 
  };

  const [allAssessments, setAllAssessments] = useState([]);

  // Backend se history fetch karne ka function
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
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Backend data ko dashboard format mein map karna
        const formattedData = data.map(item => ({
          id: `#GH-${item.id}`,
          title: item.predicted_disease ? `${item.predicted_disease} Screening` : "Genetic Panel Screening",
          confidence: `${item.confidence || 90}%`,
          risk: item.risk_level || "Moderate",
          date: item.created_at || new Date().toLocaleDateString(),
          patientName: item.patient_name || currentUser.name
        }));
        setAllAssessments(formattedData);
      } else {
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error("Failed to fetch history from backend, using local storage:", error);
      loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const savedReports = localStorage.getItem('assessment_history');
      if (savedReports) {
        const parsed = JSON.parse(savedReports);
        if (Array.isArray(parsed)) {
          setAllAssessments(parsed);
        }
      }
    } catch (e) {
      console.error("Error parsing assessment history", e);
    }
  };

  useEffect(() => {
    fetchHistoryFromBackend();
    
    const handleStorageChange = () => fetchHistoryFromBackend();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const visibleAssessments = allAssessments;

  const hasHighRisk = visibleAssessments.some(a => {
    const isHigh = a.risk && a.risk.toLowerCase().includes('high');
    const confNum = parseFloat((a.confidence || "0").replace('%', ''));
    return isHigh || confNum > 70;
  });

  const totalCount = visibleAssessments.length;
  const highRiskCount = visibleAssessments.filter(item => {
    const isHigh = item.risk && item.risk.toLowerCase().includes("high");
    const confNum = parseFloat((item.confidence || "0").replace('%', ''));
    return isHigh || confNum > 70;
  }).length;
  
  const normalCount = totalCount - highRiskCount;

  const hemoThalCount = visibleAssessments.filter(item => {
    const title = (item.title || "").toLowerCase();
    return title.includes('hemophilia') || title.includes('thalassemia');
  }).length;

  const cysticCount = visibleAssessments.filter(item => {
    const title = (item.title || "").toLowerCase();
    return title.includes('cystic') || title.includes('fibrosis');
  }).length;

  const hemoThalPercent = totalCount > 0 ? Math.round((hemoThalCount / totalCount) * 100) : 0;
  const cysticPercent = totalCount > 0 ? Math.round((cysticCount / totalCount) * 100) : 0;

  return (
    <div className={`dashboard-container ${isDoctor ? 'doctor-theme' : 'patient-theme'}`}>
      
      <div className="dashboard-header-flex">
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <h1>{isDoctor ? 'Clinical Dashboard' : `Welcome back, ${userObj.name || userObj.username || 'Patient'}`}</h1>
        </div>
        <button className="primary-btn" onClick={() => navigate('/prediction')}>
          <span>+</span> {isDoctor ? 'New Clinical Assessment' : 'Start New Screening'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats-grid">
        <div className="dash-stat-card">
          <span>{isDoctor ? 'Total Assessments' : 'My Total Screenings'}</span>
          <h2>{totalCount}</h2>
          <small>{isDoctor ? 'Patient logs processed' : 'Screenings performed'}</small>
        </div>

        <div className={`dash-stat-card ${hasHighRisk ? 'alert-card' : ''}`}>
          <span>High Risk Alerts</span>
          <h2>{highRiskCount}</h2>
          <small className={hasHighRisk ? 'text-danger' : ''}>
            {isDoctor ? 'Requires immediate clinician review' : 'Consult with your specialist'}
          </small>
        </div>

        <div className="dash-stat-card">
          <span>Normal / Low Risk</span>
          <h2>{normalCount}</h2>
          <small>{isDoctor ? 'Stable patient records' : 'Healthy screening markers'}</small>
        </div>
      </div>

      {/* Lower Main Grid */}
      <div className="dashboard-lower-grid">
        <div className="dash-box">
          <div className="dash-box-header">
            <h3>{isDoctor ? 'Recent Clinical Assessments' : 'My Personal Assessments'}</h3>
            <p>{isDoctor ? 'Latest AI diagnostic screening records' : 'Your recent screening history'}</p>
          </div>

          <div className="dash-assessment-list">
            {visibleAssessments.length > 0 ? (
              visibleAssessments.map((item, index) => {
                const confVal = parseFloat((item.confidence || "0").replace('%', ''));
                const isItemHighRisk = (item.risk && item.risk.toLowerCase().includes('high')) || confVal > 70;
                return (
                  <div 
                    key={index} 
                    className="dash-assessment-row"
                    onClick={() => {
                      localStorage.setItem("lastPrediction", JSON.stringify(item));
                      navigate(isDoctor ? "/doctor-results" : "/results");
                    }}
                  >
                    <div className="row-avatar">
                      {isDoctor ? (item.title ? item.title[0] : 'P') : 'Me'}
                    </div>
                    <div className="row-info">
                      <h4>{item.title || 'Genetic Screening'}</h4>
                      <p>
                        <span>Record ID: <strong>{item.id || currentUser.id}</strong></span> • 
                        <span> Date: {item.date || new Date().toLocaleDateString()}</span>
                        {isDoctor && item.patientName && <> • <span>Patient: <strong>{item.patientName}</strong></span></>}
                      </p>
                    </div>
                    <div className="row-badges">
                      <span className="badge-conf">{item.confidence || '94.00%'}</span>
                      <span className={`badge-risk ${isItemHighRisk ? 'risk-hi' : 'risk-lo'}`}>
                        {isItemHighRisk ? 'High Risk' : 'Normal'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state-box">
                <p>{isDoctor ? "No patient records found in the system." : "You have not run any personal assessments yet."}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Disorder Distribution */}
        <div className="dash-box">
          <div className="dash-box-header">
            <h3>{isDoctor ? 'Disorder Distribution' : 'Health Summary'}</h3>
            <p>{isDoctor ? 'Breakdown of predicted genetic conditions' : 'Your genetic risk analysis'}</p>
          </div>

          <div className="distribution-content-wrap">
            <div className="total-badge-circle">
              <span className="big-num">{totalCount}</span>
              <span className="small-lbl">{isDoctor ? 'Evaluated Cases' : 'Total Reports'}</span>
            </div>

            <div className="bars-list">
              <div className="bar-row">
                <div className="bar-labels">
                  <span>Hemophilia / Thalassemia</span>
                  <strong>{hemoThalPercent}%</strong>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${hemoThalPercent}%` }}></div>
                </div>
              </div>

              <div className="bar-row">
                <div className="bar-labels">
                  <span>Cystic Fibrosis / Disorders</span>
                  <strong>{cysticPercent}%</strong>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${cysticPercent}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;