import React from "react";
import { useAdviceRequest } from "../hooks/useAdviceRequest.js";
import CashflowModel from "../cashflow-model.jsx";

/**
 * AdviceRequestPage loads an advice request from the API and renders the
 * cashflow engine. If no adviceRequestId is provided, redirects to client list.
 *
 * The CashflowModelInner component uses useFactFind() internally which provides
 * mock data by default. When API data is available, we pass it via the
 * InitialDataContext so useFactFind can initialize from it instead.
 */
export default function AdviceRequestPage({ adviceRequestId, onNavigateBack }) {
  const { factFindData, isLoading, error, saveStatus, debouncedSave } = useAdviceRequest(adviceRequestId);

  if (!adviceRequestId) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui", textAlign: "center" }}>
        <p>No advice request selected.</p>
        <button onClick={onNavigateBack} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Back to Clients
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", fontFamily: "system-ui", color: "#64748b",
      }}>
        Loading advice request...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui", textAlign: "center" }}>
        <p style={{ color: "#ef4444" }}>Error: {error}</p>
        <button onClick={onNavigateBack} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Save status indicator */}
      {saveStatus !== "idle" && (
        <div style={{
          position: "fixed", top: 12, right: 12, zIndex: 10000,
          padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
          background: saveStatus === "saving" ? "#fef3c7" : saveStatus === "saved" ? "#d1fae5" : "#fee2e2",
          color: saveStatus === "saving" ? "#92400e" : saveStatus === "saved" ? "#065f46" : "#991b1b",
        }}>
          {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save error"}
        </div>
      )}
      <CashflowModel
        initialData={factFindData}
        onDataChange={debouncedSave}
      />
    </div>
  );
}
