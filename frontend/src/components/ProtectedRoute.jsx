import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("access");
  const userString = localStorage.getItem("user");

  if (!token && !userString) {
    return <Navigate to="/login" replace />;
  }

  // Agar allowedRoles pass nahi kiye gaye, toh logged-in user ko direct access mil jaye gi
  if (!allowedRoles || !Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return children;
  }

  const user = userString ? JSON.parse(userString) : {};
  const userRole = (user.role || localStorage.getItem("role") || "doctor").toLowerCase();

  const isAllowed = allowedRoles.some(
    (role) => role.toLowerCase() === userRole
  );

  if (!isAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;