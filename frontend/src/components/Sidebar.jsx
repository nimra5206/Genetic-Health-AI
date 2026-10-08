import React from "react";
import { Link, NavLink } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ isOpen, setIsOpen }) => {
  let user = {};

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch (error) {
    console.error(
      "Error reading user object:",
      error
    );
  }

  const rawRole =
    localStorage.getItem("role") ||
    user.role ||
    user.user_type ||
    "patient";

  const role = String(rawRole).toLowerCase();
  const isDoctor = role === "doctor";

  const closeSidebar = () => {
    if (setIsOpen) {
      setIsOpen(false);
    }
  };

  const linkClass = ({ isActive }) =>
    `sidebar-link ${isActive ? "active" : ""}`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${
          isOpen ? "open" : ""
        }`}
      >
        {/* -------------------------------- */}
        {/* Header */}
        {/* -------------------------------- */}

        <div className="sidebar-header-row">
          <Link
            to="/dashboard"
            className="sidebar-logo-link"
            onClick={closeSidebar}
          >
            <div className="sidebar-logo">
              <div className="logo-text-group">
                <span className="logo-title">
                  Genetic Health AI
                </span>

                <span className="logo-subtitle">
                  AI Intelligence
                </span>
              </div>
            </div>
          </Link>

          {/* Mobile Close */}
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={closeSidebar}
            aria-label="Close Menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* -------------------------------- */}
        {/* Navigation */}
        {/* -------------------------------- */}

        <div className="sidebar-nav">
          {/* Dashboard */}
          <div className="menu-section">
            <NavLink
              to="/dashboard"
              className={linkClass}
              onClick={closeSidebar}
            >
              <span>Dashboard</span>
            </NavLink>
          </div>

          {/* -------------------------------- */}
          {/* Doctor Navigation */}
          {/* -------------------------------- */}

          {isDoctor ? (
            <div className="menu-section">
              <NavLink
                to="/prediction"
                className={linkClass}
                onClick={closeSidebar}
              >
                <span>Risk Analysis</span>
              </NavLink>

              <NavLink
                to="/doctor-results"
                className={linkClass}
                onClick={closeSidebar}
              >
                <span>Latest Report</span>
              </NavLink>

              <NavLink
                to="/recommendations"
                className={linkClass}
                onClick={closeSidebar}
              >
                <span>Recommendations</span>
              </NavLink>

              <NavLink
                to="/history"
                className={linkClass}
                onClick={closeSidebar}
              >
                <span>Patient History</span>
              </NavLink>

              <NavLink
                to="/explainable-ai"
                className={linkClass}
                onClick={closeSidebar}
              >
                <span>Explainable AI</span>
              </NavLink>

              <NavLink
                to="/inheritance-analysis"
                className={linkClass}
                onClick={closeSidebar}
              >
                <span>Inheritance Analysis</span>
              </NavLink>

              <NavLink
                to="/disease-explorer"
                className={linkClass}
                onClick={closeSidebar}
              >
                <span>Disease Explorer</span>
              </NavLink>
            </div>
          ) : (
            /* -------------------------------- */
            /* Patient Navigation */
            /* -------------------------------- */

            <div className="menu-section">
              <NavLink
                to="/prediction"
                className={linkClass}
                onClick={closeSidebar}
              >
                <span>Run Assessment</span>
              </NavLink>

              <NavLink
                to="/results"
                className={linkClass}
                onClick={closeSidebar}
              >
                <span>My Results</span>
              </NavLink>

              <NavLink
                to="/recommendations"
                className={linkClass}
                onClick={closeSidebar}
              >
                <span>Recommendations</span>
              </NavLink>

              <NavLink
                to="/history"
                className={linkClass}
                onClick={closeSidebar}
              >
                <span>Assessment History</span>
              </NavLink>

              <NavLink
                to="/disease-explorer"
                className={linkClass}
                onClick={closeSidebar}
              >
                <span>Disease Explorer</span>
              </NavLink>

              <NavLink
                to="/patient-profile"
                className={linkClass}
                onClick={closeSidebar}
              >
                <span>My Profile</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* -------------------------------- */}
        {/* Footer */}
        {/* -------------------------------- */}

        <div className="sidebar-warning">
          <div className="status-indicator-row">
            <div className="status-pulse-dot"></div>

            <strong>
              Decision Support Active
            </strong>
          </div>

          <p>
            Active Role:{" "}
            <span className="role-pill-text">
              {role}
            </span>
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;