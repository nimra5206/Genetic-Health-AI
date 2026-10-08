import React, { useEffect, useRef, useState } from "react";
import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./Navbar.css";

function Navbar({ role, user, setRole }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const menuRef = useRef(null);
  const profileRef = useRef(null);

  const currentRole =
    role ||
    localStorage.getItem("role") ||
    user?.role ||
    "patient";

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
    { label: "Why This Result?", path: "/explainable-ai" },
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
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* =====================================================
     ROLE SWITCH
     ===================================================== */

  const handleRoleChange = () => {
    const newRole =
      currentRole === "doctor" ? "patient" : "doctor";

    localStorage.setItem("role", newRole);

    try {
      const savedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );
      savedUser.role = newRole;
      localStorage.setItem("user", JSON.stringify(savedUser));
    } catch {
      // Ignore malformed local user data
    }

    setRole(newRole);
    window.dispatchEvent(new Event("rolechange"));

    setProfileOpen(false);
    setMenuOpen(false);

    if (
      newRole === "patient" &&
      [
        "/prediction-results",
        "/explainable-ai",
        "/inheritance-analysis",
      ].includes(location.pathname)
    ) {
      navigate("/dashboard");
      return;
    }

    if (
      newRole === "doctor" &&
      location.pathname === "/patient-profile"
    ) {
      navigate("/dashboard");
      return;
    }
  };

  /* =====================================================
     LOGOUT
     ===================================================== */

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("lastPrediction");

    setProfileOpen(false);
    setMenuOpen(false);

    navigate("/login", { replace: true });
  };

  const displayName =
    user?.name ||
    user?.username ||
    (isDoctor ? "Doctor" : "Patient");

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
            <span className="brand-title">Genetic Health AI</span>
          </div>
        </NavLink>
      </div>

      {/* DESKTOP NAVIGATION */}
      <nav className="desktop-navigation">
        {navLinks.map((link) => (
          <NavLink
            key={`${link.label}-${link.path}`}
            to={link.path}
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* RIGHT SIDE */}
      <div className="navbar-right">
        {/* Role Switch */}
        <button
          type="button"
          className="role-switch"
          onClick={handleRoleChange}
          title="Switch user role"
        >
          <span className="role-switch-label">
            {isDoctor ? "Doctor" : "Patient"}
          </span>
          <span className="role-switch-icon">⇄</span>
        </button>

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
                className="dropdown-item"
                onClick={handleRoleChange}
              >
                Switch to {isDoctor ? "Patient" : "Doctor"}
              </button>

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

              <button
                type="button"
                className="mobile-nav-action"
                onClick={handleRoleChange}
              >
                Switch to {isDoctor ? "Patient" : "Doctor"}
              </button>

              {!isDoctor && (
                <NavLink
                  to="/patient-profile"
                  className="mobile-nav-link"
                >
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