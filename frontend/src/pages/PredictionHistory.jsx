import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./PredictionHistory.css";

function PredictionHistory() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const role = localStorage.getItem("role") || user?.role || "patient";
  const isDoctor = role === "doctor";

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("access");

    if (!token) {
      setError("Your session has expired. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/predictions/history/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        setError("Your session has expired. Please login again.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const history = Array.isArray(data) ? data : data.results || data.predictions || [];
      setRecords(history);
    } catch (err) {
      console.error("Prediction history error:", err);
      setError("Unable to load prediction history from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getConfidence = (value) => {
    if (value === null || value === undefined || value === "") return null;
    let numeric = Number(String(value).replace("%", "").trim());
    if (Number.isNaN(numeric)) return null;
    if (numeric <= 1) numeric *= 100;
    return Math.min(100, Math.max(0, numeric));
  };

  // Record ke alag-alag field names mein se confidence nikalta hai
  const getRecordConfidence = (record) =>
    getConfidence(record.confidence_value ?? record.confidence ?? record.probability);

  const filteredRecords = records.filter((record) => {
    const disease = record.predicted_disease || record.disease || record.result || "";
    const diseaseText = String(disease).toLowerCase();
    const searchMatch = diseaseText.includes(search.toLowerCase());

    if (!searchMatch) return false;
    if (filter === "all") return true;
    if (filter === "normal") return !(getConfidence(record.confidence) >= 70);
    if (filter === "high") {
      const confidence = getConfidence(record.confidence);
      return confidence !== null && confidence >= 70;
    }
    return true;
  });

  const handleViewReport = (record) => {
    let uid = "anon";
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      uid = String(u.id ?? u.email ?? u.username ?? u.name ?? "anon").toLowerCase();
    } catch {}

    // Isi browser mein saved probabilities / inputs agar maujood hon to jod dein
    let extra = {};
    try {
      const local = JSON.parse(localStorage.getItem(`gh_history:${uid}`) || "[]");
      extra = local.find((h) => String(h.id).replace("#GH-", "") === String(record.id)) || {};
    } catch {}

    const conf = Number(record.confidence);
    const full = {
      ...extra,
      ...record,
      predicted_disease: record.predicted_disease,
      confidence: `${Number.isNaN(conf) ? "N/A" : conf.toFixed(1)}%`,
      confidence_value: conf,
      risk_level: record.risk_level || (conf >= 70 ? "High" : conf >= 40 ? "Moderate" : "Low"),
    };

    localStorage.setItem(`gh_last_prediction:${uid}`, JSON.stringify(full));
    navigate(isDoctor ? "/doctor-results" : "/results");
  };

  const handlePrint = (record) => {
    const disease = record.predicted_disease || record.disease || record.result || "Prediction Report";
    const confidence = getRecordConfidence(record);

    const html = `
      <html>
        <head>
          <title>Genetic Health AI Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #0f172a; background: #f8fafc; }
            h1 { color: #034078; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            .box { background: white; border: 1px solid #cbd5e1; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            p { font-size: 16px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>Genetic Health AI Report</h1>
          <div class="box">
            <h2>Disease: ${disease}</h2>
            ${confidence !== null ? `<p><strong>Confidence Level:</strong> ${confidence.toFixed(1)}%</p>` : ""}
            ${record.created_at ? `<p><strong>Assessment Date:</strong> ${new Date(record.created_at).toLocaleString()}</p>` : ""}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="pulse-loader"></div>
          Loading prediction history...
        </div>
      </div>
    );
  }

  return (
    <div className={`history-page ${!isDoctor ? "patient-mode" : ""}`}>

      {/* Header Banner */}
      <div className="history-header">
        <div>
          <h1>Prediction History</h1>
        </div>

        <button
          type="button"
          onClick={() => navigate("/prediction")}
          className="new-prediction-btn"
        >
          + New Assessment
        </button>
      </div>

      {error && (
        <div className="history-error-banner">
          ⚠ {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="tab-container">
          {["all", "normal", "high"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`tab-btn ${filter === item ? "active" : ""}`}
            >
              {item === "all" ? "All Records" : item === "normal" ? "Lower Risk" : "High Risk"}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search disease..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="history-search"
        />

        <button
          type="button"
          onClick={fetchHistory}
          className="refresh-btn"
        >
          Refresh
        </button>
      </div>

      {/* Table Section */}
      {filteredRecords.length === 0 ? (
        <div className="history-empty-box">
          <h3>No prediction records found</h3>
          <p>Your backend prediction history will appear here after an assessment.</p>
        </div>
      ) : (
        <div className="history-card">
          <div className="table-wrapper">
            <table className="interactive-table">
              <thead>
                <tr>
                  <th>Disease</th>
                  <th>Confidence</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => {
                  const disease = record.predicted_disease || record.disease || record.result || "Unknown";
                  const confidence = getRecordConfidence(record);
                  const isHovered = hoveredRow === index;

                  return (
                    <tr
                      key={record.id || record.pk || index}
                      onMouseEnter={() => setHoveredRow(index)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={`table-row-anim ${isHovered ? "hovered" : ""}`}
                    >
                      <td className="disorder-cell">
                        <strong>{disease}</strong>
                      </td>
                      <td>
                        {confidence !== null ? (
                          <div className="prob-container">
                            <span className="prob-val">{confidence.toFixed(1)}%</span>
                            <div className="history-progress-track">
                              <div
                                className="history-progress-fill"
                                style={{ width: `${confidence}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="date-cell">
                        {record.created_at ? new Date(record.created_at).toLocaleString() : "—"}
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button
                            type="button"
                            onClick={() => handleViewReport(record)}
                            className="view-btn"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrint(record)}
                            className="pdf-btn"
                          >
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PredictionHistory;
