import React from "react";
import { useAuth } from "../auth/AuthProvider.jsx";

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "48px 40px",
        boxShadow: "0 25px 50px rgba(0,0,0,0.25)", textAlign: "center",
        maxWidth: 420, width: "100%",
      }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
          PrimeSolve
        </div>
        <div style={{ fontSize: 14, color: "#64748b", marginBottom: 32 }}>
          AI Paraplanner — Cashflow Engine
        </div>
        <button
          onClick={login}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            width: "100%", padding: "14px 24px", borderRadius: 8,
            border: "1px solid #d1d5db", background: "#fff",
            fontSize: 15, fontWeight: 600, color: "#1f2937",
            cursor: "pointer", transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
        >
          <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
}
