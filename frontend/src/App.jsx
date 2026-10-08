import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import GlobalChatbot from "./components/GlobalChatbot";
import ProtectedRoute from "./components/ProtectedRoute";

// Main pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import Dashboard from "./pages/Dashboard";

import NewPrediction from "./pages/NewPrediction";
import PredictionResult from "./pages/PredictionResult";

import Recommendations from "./pages/Recommendations";
import DiseaseExplorer from "./pages/DiseaseExplorer";
import PredictionHistory from "./pages/PredictionHistory";

import ExplainableAI from "./pages/ExplainableAI";
import InheritanceAnalysis from "./pages/InheritanceAnalysis";
import PatientProfile from "./pages/PatientProfile";

import "./App.css";

function App() {
  const location = useLocation();

  const [role, setRole] = useState(() => {
    const savedRole = localStorage.getItem("role");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    return savedRole || user?.role || "patient";
  });

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const isPublicRoute =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  useEffect(() => {
    const updateUser = () => {
      try {
        const savedUser = JSON.parse(
          localStorage.getItem("user") || "null"
        );

        setUser(savedUser);

        const savedRole =
          localStorage.getItem("role") ||
          savedUser?.role ||
          "patient";

        setRole(savedRole);
      } catch {
        setUser(null);
        setRole("patient");
      }
    };

    updateUser();

    window.addEventListener("storage", updateUser);
    window.addEventListener("rolechange", updateUser);

    return () => {
      window.removeEventListener("storage", updateUser);
      window.removeEventListener("rolechange", updateUser);
    };
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-role", role);
  }, [role]);

  return (
    <div className="app-root">

      {/* ================= NAVBAR ================= */}
      {!isPublicRoute && (
        <Navbar
          role={role}
          user={user}
          setRole={setRole}
        />
      )}

      {/* ================= MAIN CONTENT ================= */}
      <main
        className={
          isPublicRoute
            ? "page-container public-page"
            : "page-container"
        }
      >
        <Routes>

          {/* ================= PUBLIC ================= */}

          <Route
            path="/"
            element={<LandingPage />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/signup"
            element={<Signup />}
          />

          {/* ================= DASHBOARD ================= */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ================= PREDICTION ================= */}

          <Route
            path="/prediction"
            element={
              <ProtectedRoute>
                <NewPrediction />
              </ProtectedRoute>
            }
          />

          {/* ================= RESULTS ================= */}

       
<Route path="/prediction-results" element={<ProtectedRoute><PredictionResult /></ProtectedRoute>} />

          {/* ================= RECOMMENDATIONS ================= */}

          <Route
            path="/recommendations"
            element={
              <ProtectedRoute>
                <Recommendations />
              </ProtectedRoute>
            }
          />

          {/* ================= DISEASE EXPLORER ================= */}

          <Route
            path="/disease-explorer"
            element={
              <ProtectedRoute>
                <DiseaseExplorer />
              </ProtectedRoute>
            }
          />

          {/* ================= HISTORY ================= */}

          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <PredictionHistory />
              </ProtectedRoute>
            }
          />

          {/* ================= EXPLAINABLE AI ================= */}

          <Route
            path="/explainable-ai"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <ExplainableAI />
              </ProtectedRoute>
            }
          />

          {/* Old route compatibility */}
          <Route
            path="/explainable-AI"
            element={
              <Navigate
                to="/explainable-ai"
                replace
              />
            }
          />

          {/* ================= INHERITANCE ================= */}

          <Route
            path="/inheritance-analysis"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <InheritanceAnalysis />
              </ProtectedRoute>
            }
          />

          {/* ================= PROFILE ================= */}

          <Route
            path="/patient-profile"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientProfile />
              </ProtectedRoute>
            }
          />

          {/* ================= FALLBACK ================= */}

          <Route
            path="*"
            element={
              <Navigate
                to={
                  localStorage.getItem("access")
                    ? "/dashboard"
                    : "/login"
                }
                replace
              />
            }
          />

        </Routes>
      </main>

      {/* Chatbot only for logged-in users */}
      {!isPublicRoute && <GlobalChatbot />}

    </div>
  );
}

export default App;