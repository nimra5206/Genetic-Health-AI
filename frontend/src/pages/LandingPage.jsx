import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const [isDoctor, setIsDoctor] = useState(true);
  const navigate = useNavigate();

  // Button Functions
  const goToLogin = () => navigate("/login");
  const goToSignup = () => navigate("/signup"); // ya /select-user agar tumhara route ye hai
  const goToCreateAccount = () => navigate("/signup");

  return (
    <div className={`clean-wrapper ${isDoctor ? "doctor-theme" : "patient-theme"}`}>
      <nav className="clean-nav">
        <span className="brand-name" onClick={() => navigate("/")} style={{cursor:'pointer'}}>GENETICHEALTH AI</span>
        <div className="clean-nav-right">
          <div className="role-switch">
            <button className={!isDoctor ? "active" : ""} onClick={() => setIsDoctor(false)}>Patient</button>
            <button className={isDoctor ? "active" : ""} onClick={() => setIsDoctor(true)}>Doctor</button>
          </div>
          <button className="login-btn" onClick={goToLogin}>Log In</button>
          <button className="signup-btn" onClick={goToSignup}>Sign Up</button>
        </div>
      </nav>

      <div className="clean-hero">
        <div className="clean-img-wrapper">
          <img src={isDoctor ? "/doctor-genetic.jpg" : "/patient-genetic.jpg"} alt="Genetic Health AI" />
        </div>

        <div className="clean-text-side">
          <div className="ai-badge">
            <span className="ai-dot"></span>
            AI-POWERED HEALTHCARE
          </div>

          <h1>{isDoctor ? "Clinical Intelligence for Precision Care." : "Understand Your Health, Genetically."}</h1>
          <p>
            {isDoctor
              ? "AI-powered genomic analysis for clinical decision support and patient risk stratification. Get real-time variant analysis, ACMG classification, and evidence-based recommendations."
              : "Get personalized insights into your genetic health. Upload your data securely, understand your risks, and take proactive steps with AI-powered guidance."}
          </p>

          <div className="btn-group">
            <button className="btn-main" onClick={goToLogin}>
              {isDoctor ? "Launch Assessment" : "Start Screening"}
            </button>
            <button className="btn-outline" onClick={goToCreateAccount}>
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}