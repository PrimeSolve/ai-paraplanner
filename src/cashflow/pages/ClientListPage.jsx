import React, { useState, useEffect, useMemo } from "react";
import { getClients } from "../api/clients.js";
import { createAdviceRequest, getAdviceRequests } from "../api/adviceRequests.js";

export default function ClientListPage({ onNavigate, user, onLogout }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getClients()
      .then((data) => {
        if (!cancelled) setClients(Array.isArray(data) ? data : data.items || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load clients");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        (c.firstName || "").toLowerCase().includes(q) ||
        (c.lastName || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  const handleClientClick = async (client) => {
    try {
      // Try to find existing advice requests for this client
      const existingRequests = await getAdviceRequests({ clientId: client.id });
      const requests = Array.isArray(existingRequests) ? existingRequests : existingRequests.items || [];
      if (requests.length > 0) {
        onNavigate(`/advice/${requests[0].id}`);
      } else {
        // Create a new advice request
        const newRequest = await createAdviceRequest({ clientId: client.id });
        onNavigate(`/advice/${newRequest.id}`);
      }
    } catch (err) {
      console.error("Failed to open/create advice request:", err);
      setError(err.message);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f8fafc",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 32px", background: "#fff",
        borderBottom: "1px solid #e2e8f0",
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
          PrimeSolve
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>{user?.name || user?.email}</span>
          <button
            onClick={onLogout}
            style={{
              padding: "6px 16px", borderRadius: 6,
              border: "1px solid #e2e8f0", background: "#fff",
              fontSize: 13, color: "#64748b", cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 24 }}>
          Clients
        </h1>

        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "10px 16px", borderRadius: 8,
            border: "1px solid #e2e8f0", fontSize: 14,
            marginBottom: 24, boxSizing: "border-box",
          }}
        />

        {loading && <div style={{ color: "#64748b", padding: 20 }}>Loading clients...</div>}
        {error && <div style={{ color: "#ef4444", padding: 20 }}>{error}</div>}

        {!loading && !error && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.length === 0 && (
              <div style={{ color: "#94a3b8", padding: 20, textAlign: "center" }}>
                No clients found
              </div>
            )}
            {filtered.map((client) => (
              <div
                key={client.id}
                onClick={() => handleClientClick(client)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 20px", background: "#fff", borderRadius: 10,
                  border: "1px solid #e2e8f0", cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 15 }}>
                    {client.firstName} {client.lastName}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                    {client.email}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>
                  {client.adviceRequestCount || 0} advice requests
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
