import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import "./Navbar.css";

function Navbar({ role, user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const menuRef = useRef(null);
  const profileRef = useRef(null);

  const currentRole = String(
    role || localStorage.getItem("role") || user?.role || "patient"
  ).toLowerCase();

  const isDoctor = currentRole === "doctor";

  /* =====================================================
     NAVIGATION LINKS
     ===================================================== */

  const patientLinks = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "New Assessment", path: "/prediction" },
    { label: "My Results", path: "/prediction-results" },
    { label: "History", path: "/history" },
    { label: "Recommendations", path: "/recommendations" },
    { label: "Disease Explorer", path: "/disease-explorer" },
  ];

  const doctorLinks = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Risk Analysis", path: "/prediction" },
    { label: "Latest Report", path: "/prediction-results" },
    { label: "Patient History", path: "/history" },
    { label: "Recommendations", path: "/recommendations" },
    { label: "Disease Explorer", path: "/disease-explorer" },
    { label: "Clinical Reasoning", path: "/explainable-ai" },
    { label: "Inheritance", path: "/inheritance-analysis" },
  ];

  const navLinks = isDoctor ? doctorLinks : patientLinks;

  /* =====================================================
     CLOSE MENUS WHEN ROUTE CHANGES
     ===================================================== */

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  /* =====================================================
     CLOSE WHEN CLICKING OUTSIDE
     ===================================================== */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* =====================================================
     LOGOUT
     ===================================================== */

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("lastPrediction");
    window.dispatchEvent(new Event("rolechange"));

    setProfileOpen(false);
    setMenuOpen(false);

    navigate("/login", { replace: true });
  };

  const displayName =
    user?.name || user?.username || (isDoctor ? "Doctor" : "Patient");

  const initials = displayName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className={`app-navbar ${isDoctor ? "doctor-theme" : "patient-theme"}`}>
      {/* BRAND */}
      <div className="navbar-left">
        <NavLink to="/dashboard" className="navbar-brand">
          <div className="brand-text">
            <span className="brand-title">GENETICHEALTH AI</span>
          </div>
        </NavLink>
      </div>

      {/* DESKTOP NAVIGATION */}
      <nav className="desktop-navigation">
        {navLinks.map((link) => (
          <NavLink
            key={`${link.label}-${link.path}`}
            to={link.path}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* RIGHT SIDE */}
      <div className="navbar-right">
        {/* Role label (read-only) */}
        <span className="role-switch" title="Your account role">
          <span className="role-switch-label">{isDoctor ? "Doctor" : "Patient"}</span>
        </span>

        {/* Profile */}
        <div className="profile-wrapper" ref={profileRef}>
          <button
            type="button"
            className="profile-button"
            onClick={() => setProfileOpen((prev) => !prev)}
          >
            <span className="profile-avatar">{initials}</span>
            <span className="profile-name">{displayName}</span>
            <span className="profile-arrow">▾</span>
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              {!isDoctor && (
                <NavLink
                  to="/patient-profile"
                  className="dropdown-item"
                  onClick={() => setProfileOpen(false)}
                >
                  My Profile
                </NavLink>
              )}

              <button
                type="button"
                className="dropdown-item logout-item"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        <div className="mobile-menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {menuOpen && (
            <div className="mobile-navigation">
              {navLinks.map((link) => (
                <NavLink
                  key={`${link.label}-mobile`}
                  to={link.path}
                  className={({ isActive }) =>
                    `mobile-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              {!isDoctor && (
                <NavLink to="/patient-profile" className="mobile-nav-link">
                  My Profile
                </NavLink>
              )}

              <button
                type="button"
                className="mobile-nav-action logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
