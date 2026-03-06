import React, { useState } from "react";
import { useCredit } from "../../../api/billing";

const BILLING_CHECKOUT_URL = "/billing/checkout";
const UPGRADE_URL = "/billing/upgrade";

const overlayStyle = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.5)", zIndex: 10000,
  display: "flex", alignItems: "center", justifyContent: "center",
};

const modalStyle = {
  background: "var(--ps-surface, #fff)", borderRadius: 12,
  padding: "32px 36px", maxWidth: 460, width: "90%",
  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
};

const titleStyle = {
  fontSize: 18, fontWeight: 700, marginBottom: 8,
  color: "var(--ps-text-primary, #1E293B)",
};

const bodyStyle = {
  fontSize: 14, lineHeight: 1.6, marginBottom: 24,
  color: "var(--ps-text-secondary, #475569)",
};

const btnBase = {
  padding: "8px 20px", borderRadius: 8, border: "none",
  fontSize: 13, fontWeight: 600, cursor: "pointer",
};

/* ── Case 2: SOA submitted via credits ── */
export function SOASubmissionModal({ onClose, onCreditUsed }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await useCredit();
      setSubmitted(true);
      if (onCreditUsed) onCreditUsed(result.soaCredits);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit SOA request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Initial confirmation screen
  if (!submitted) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={e => e.stopPropagation()}>
          <div style={titleStyle}>Request SOA</div>
          <div style={bodyStyle}>
            Our team will review and build your Statement of Advice. You will be notified when it's ready.
            <br /><br />
            <strong>1 credit will be used.</strong>
          </div>
          {error && (
            <div style={{ color: "#DC2626", fontSize: 13, marginBottom: 12 }}>{error}</div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{ ...btnBase, background: "var(--ps-surface-alt, #F1F5F9)", color: "var(--ps-text-secondary, #475569)" }}
            >Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ ...btnBase, background: "#2563EB", color: "#fff", opacity: submitting ? 0.6 : 1 }}
            >{submitting ? "Submitting…" : "Submit Request"}</button>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={titleStyle}>Your SOA has been submitted</div>
        <div style={bodyStyle}>
          Our team will review and build your Statement of Advice. You will be notified when it's ready.
          <br /><br />
          1 credit has been used.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ ...btnBase, background: "#2563EB", color: "#fff" }}
          >Close</button>
        </div>
      </div>
    </div>
  );
}

/* ── Case 3: No credits remaining ── */
export function NoCreditModal({ onClose }) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ ...titleStyle, color: "#DC2626" }}>You're out of SOA credits</div>
        <div style={bodyStyle}>
          Purchase credits to continue, or upgrade to Full Platform for unlimited SOAs.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => { window.location.href = BILLING_CHECKOUT_URL; }}
            style={{ ...btnBase, background: "#2563EB", color: "#fff" }}
          >Buy Credits</button>
          <button
            onClick={() => { window.location.href = UPGRADE_URL; }}
            style={{ ...btnBase, background: "linear-gradient(135deg, #059669 0%, #10B981 100%)", color: "#fff" }}
          >Upgrade to Full Platform</button>
        </div>
      </div>
    </div>
  );
}
