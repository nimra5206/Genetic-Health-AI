import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

function LandingPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState(() => {
    return (localStorage.getItem("role") || "patient").toLowerCase();
  });

  useEffect(() => {
    localStorage.setItem("role", role);
    document.body.setAttribute("data-role", role);
  }, [role]);

  const isDoctor = role === "doctor";

  const handleStartAssessment = () => {
    const isLoggedIn =
      localStorage.getItem("isLoggedIn") === "true" ||
      localStorage.getItem("access");

    if (!isLoggedIn) {
      navigate("/login");
    } else {
      navigate("/prediction");
    }
  };

  return (
    <div
      className={`landing-container ${
        isDoctor ? "doctor-mode" : "patient-mode"
      }`}
    >
      {/* Soft blue glow */}
      <div className="landing-glow landing-glow-one"></div>
      <div className="landing-glow landing-glow-two"></div>

      {/* =====================================================
          NAVBAR
          ===================================================== */}
      <nav className="landing-navbar">
        <div
          className="landing-brand"
          onClick={() => navigate("/")}
        >
          Genetic Health AI
        </div>

        <div className="landing-nav-right">

          {/* Portal Mode */}
          <div className="portal-switch">
            <span className="portal-label">
              Portal Mode
            </span>

            <div className="role-switch">
              <button
                type="button"
                className={`role-btn ${
                  !isDoctor ? "active" : ""
                }`}
                onClick={() => setRole("patient")}
              >
                Patient
              </button>

              <button
                type="button"
                className={`role-btn ${
                  isDoctor ? "active" : ""
                }`}
                onClick={() => setRole("doctor")}
              >
                Doctor
              </button>
            </div>
          </div>

          {/* Sign In */}
          <button
            className="signin-btn"
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* =====================================================
          HERO
          ===================================================== */}
      <main className="landing-content">
        <section className="hero-section">

          {/* Small heading */}
          <div className="hero-badge">
            <span className="badge-dot"></span>

            {isDoctor
              ? "Clinical Genetics"
              : "Genomic Health"}
          </div>

          {/* Main heading */}
          <h1 className="hero-title">
            {isDoctor ? (
              <>
                Genetic Risk
                <br />
                <span>Insights</span>
              </>
            ) : (
              <>
                Your Genetic
                <br />
                <span>Insights</span>
              </>
            )}
          </h1>

          {/* Buttons */}
          <div className="hero-actions">
            <button
              className="primary-btn"
              onClick={handleStartAssessment}
            >
              {isDoctor
                ? "Launch Assessment"
                : "Start Screening"}

              <span>→</span>
            </button>

            <button
              className="secondary-btn"
              onClick={() => navigate("/login")}
            >
              Explore Platform
            </button>
          </div>

        </section>
      </main>
    </div>
  );
}

export default LandingPage;