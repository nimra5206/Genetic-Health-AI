import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "patient",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      body: JSON.stringify({
          username: form.username,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        
        localStorage.setItem(
  "user",
  JSON.stringify({
    id: data.id,
    username: data.username || form.username,
    email: data.email,
    role: data.role || form.role,
  })
);

localStorage.setItem("role", data.role || form.role);

        window.dispatchEvent(new Event("rolechange"));

        navigate("/dashboard");
      } else {
        alert(data.detail || "Login failed. Check username and password.");
      }
    } catch (error) {
      alert("Backend connection error.");
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
      zIndex: 9999,
      boxSizing: "border-box",
      padding: "20px"
    }}>
      <div style={{
        background: "#ffffff",
        padding: "40px 36px",
        borderRadius: "20px",
        boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
        width: "100%",
        maxWidth: "440px",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box"
      }}>
        <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0", textAlign: "center" }}>
          Welcome Back
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px 0", textAlign: "center" }}>
          Sign in to Genetic Health AI
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Select Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              style={{
                width: "100%",
                height: "46px",
                padding: "0 16px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                backgroundColor: "#f8fafc",
                color: "#0f172a",
                boxSizing: "border-box",
                outline: "none"
              }}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter username"
              required
              style={{
                width: "100%",
                height: "46px",
                padding: "0 16px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                backgroundColor: "#f8fafc",
                color: "#0f172a",
                boxSizing: "border-box",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
              style={{
                width: "100%",
                height: "46px",
                padding: "0 16px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                backgroundColor: "#f8fafc",
                color: "#0f172a",
                boxSizing: "border-box",
                outline: "none"
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              height: "46px",
              background: "#0d9f9a",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              marginTop: "8px",
              boxShadow: "0 4px 12px rgba(13, 159, 154, 0.25)"
            }}
          >
            Login
          </button>
        </form>

        <p style={{ marginTop: "20px", textAlign: "center", fontSize: "13.5px", color: "#64748b" }}>
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
            style={{
              background: "none",
              border: "none",
              color: "#0d9f9a",
              fontWeight: "700",
              cursor: "pointer",
              padding: 0,
              fontSize: "13.5px",
              marginLeft: "4px"
            }}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;