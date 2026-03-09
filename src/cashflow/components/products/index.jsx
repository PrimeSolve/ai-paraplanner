import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart, LineChart, Line, ReferenceLine } from "recharts";
import { T } from "../../constants/theme.jsx";
import { EntityBadge } from "../../constants/entities.jsx";
import { AGE_PENSION_PARAMS } from "../../constants/assumptions.js";
import { SectionTable } from "../common/SectionTable.jsx";

// ─────────────────────────────────────────────────────────────
// AGED CARE PAGE
// ─────────────────────────────────────────────────────────────
export function AgedCarePage({ data, shortYears, projYears, onUpdate }) {
  const fC = (v) => v == null ? "—" : `$${Math.abs(v).toLocaleString("en-AU")}`;
  const fP = (v) => v == null ? "—" : `${(v * 100).toFixed(2)}%`;
  const [showAssessmentPopup, setShowAssessmentPopup] = React.useState(false);
  const [localRadPct, setLocalRadPct] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);

  if (!data) return (
    <div style={{ padding: "40px 24px", textAlign: "center", border: "2px dashed var(--ps-border)", borderRadius: 12 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🏥</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ps-text-primary)", marginBottom: 8 }}>No Aged Care Strategy Active</div>
      <div style={{ fontSize: 13, color: "var(--ps-text-muted)" }}>Add strategy "Move into Aged Care" (57) in the Advice panel to model aged care scenarios.</div>
    </div>
  );

  const { clientName, entryYear, entryAge, rad, radPct, radLumpSum, dapPortion, dapAnnual, accommodationStatus, MPIR, BASIC_DAILY_FEE, BASIC_DAILY_FEE_ANNUAL,
    MEANS_TESTED_FEE_CAP_ANNUAL, MEANS_TESTED_FEE_LIFETIME_CAP, ADDITIONAL_SERVICES,
    radBalance, basicDailyFee, meansTested, dapPayments, additionalServices,
    totalExpenses, retentionDeducted, cumulativeRetention, govtContribution,
    mtcfLifetimeCumulative, estateRefund, entryYearIdx, ages, paymentMethod, meansAssessment } = data;

  const effectiveRadPct = localRadPct !== null ? localRadPct : (radPct || 100);
  const effectiveRadLumpSum = Math.round((rad || 0) * effectiveRadPct / 100);
  const effectiveDapPortion = (rad || 0) - effectiveRadLumpSum;
  const effectiveDapAnnual = Math.round(effectiveDapPortion * (MPIR || 0.0765));

  // Clear local override once engine data catches up
  React.useEffect(() => {
    if (localRadPct !== null && !isDragging && Math.abs((radPct || 100) - localRadPct) < 6) {
      setLocalRadPct(null);
    }
  }, [radPct]);

  const N = shortYears.length;
  const displayYears = shortYears;
  const entryFY = projYears[entryYearIdx] || `${entryYear}/${entryYear + 1}`;

  // Input styles
  const controlInput = { padding: "6px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", background: "var(--ps-surface)", color: "var(--ps-text-strongest)", width: 90, textAlign: "center" };

  // KPI tiles
  const totalCashflowCost = totalExpenses.reduce((s, v) => s + v, 0);
  const totalGovt = govtContribution.reduce((s, v) => s + v, 0);
  const peakAnnualCost = Math.max(...totalExpenses);
  const finalRAD = radBalance[N - 1] || radBalance.find((v, i) => i >= entryYearIdx && v > 0) || 0;

  const tiles = [
    { label: "Entry Year", value: entryFY, sub: `${clientName} age ${entryAge}`, color: "#4F46E5" },
    { label: "RAD Amount", value: fC(rad), sub: paymentMethod === "full_rad" ? "Full RAD (lump sum)" : paymentMethod === "full_dap" ? "Full DAP" : `${radPct}% RAD / ${100 - radPct}% DAP`, color: "#0891B2" },
    { label: "Accommodation Status", value: accommodationStatus, sub: `MPIR: ${fP(MPIR)}`, color: accommodationStatus === "Full Payer" ? "#D97706" : "#059669" },
    { label: "Total Cashflow Cost", value: fC(totalCashflowCost), sub: `Over projection period`, color: "var(--ps-red)" },
    { label: "Govt Accom. Supplement", value: totalGovt > 0 ? fC(totalGovt) : "Nil", sub: totalGovt > 0 ? "Supported resident" : "Full payer — no supplement", color: "var(--ps-green)" },
    { label: "Estate RAD Refund", value: fC(finalRAD), sub: `After retention deductions`, color: "#7C3AED" },
  ];

  // Section header style
  const secHead = (icon, title, sub, bg, border) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
      background: bg, borderBottom: `1px solid ${border}`, borderRadius: "12px 12px 0 0",
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-strongest)" }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>{sub}</div>}
      </div>
    </div>
  );

  // Scroll table
  const scrollTableStyle = { borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif", width: "100%" };
  const stickyLabel = {
    position: "sticky", left: 0, zIndex: 2, padding: "10px 16px",
    fontSize: 13, fontWeight: 500, color: "var(--ps-text-secondary)",
    background: "var(--ps-surface)", borderRight: "2px solid var(--ps-border)",
    borderBottom: "1px solid var(--ps-border-light)", whiteSpace: "nowrap", minWidth: 220,
  };
  const yearCell = {
    padding: "8px 10px", fontSize: 12, textAlign: "right",
    borderBottom: "1px solid var(--ps-border-light)", minWidth: 88,
    fontFamily: "'JetBrains Mono', monospace", color: "var(--ps-text-body)",
  };
  const yearHeader = {
    padding: "10px 10px", fontSize: 11, fontWeight: 600, color: "var(--ps-text-muted)",
    textAlign: "center", borderBottom: "2px solid var(--ps-border)", minWidth: 88, whiteSpace: "nowrap",
  };
  const sectionRow = (label, icon) => (
    <tr>
      <td colSpan={N + 1} style={{
        padding: "10px 16px", fontWeight: 700, fontSize: 13, color: "var(--ps-text-primary)",
        background: "var(--ps-section-bg)", borderBottom: "1px solid var(--ps-border)",
        textTransform: "uppercase", letterSpacing: "0.03em",
      }}>
        {icon && <span style={{ marginRight: 8 }}>{icon}</span>}{label}
      </td>
    </tr>
  );
  const totalRowStyle = (color) => ({
    ...stickyLabel, fontWeight: 700, color: color || "var(--ps-text-strongest)",
    background: "var(--ps-surface-alt)", fontSize: 14,
  });
  const totalCellStyle = (color) => ({
    ...yearCell, fontWeight: 700, color: color || "var(--ps-text-strongest)",
    background: "var(--ps-surface-alt)", fontSize: 13,
  });

  const dataRow = (label, values, opts = {}) => {
    const { bold, color, isCurrency = true, isNegative, highlight } = opts;
    return (
      <tr>
        <td style={{ ...stickyLabel, fontWeight: bold ? 700 : 500, color: color || stickyLabel.color, background: highlight ? "var(--ps-surface-alt)" : "var(--ps-surface)" }}>{label}</td>
        {values.map((v, i) => (
          <td key={i} style={{
            ...yearCell,
            fontWeight: bold ? 700 : 400,
            color: v === 0 ? "var(--ps-text-subtle)" : isNegative ? "var(--ps-red)" : color || yearCell.color,
            background: highlight ? "var(--ps-surface-alt)" : "var(--ps-surface)",
          }}>
            {v === 0 ? "—" : isCurrency ? (isNegative ? `-${fC(v)}` : fC(v)) : v.toLocaleString("en-AU")}
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div>
      {/* Controls Bar */}
      {onUpdate && (
        <div style={{
          display: "flex", alignItems: "center", gap: 24, padding: "14px 20px", marginBottom: 20,
          background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)", borderRadius: 12,
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-text-secondary)" }}>Entry Year</span>
            <select value={String(entryYear)} onChange={e => onUpdate("start_year", e.target.value)}
              style={{ ...controlInput, width: 110 }}>
              {Array.from({ length: 30 }, (_, i) => {
                const yr = new Date().getFullYear() + i;
                return <option key={yr} value={String(yr)}>{yr}/{String(yr + 1).slice(-2)}</option>;
              })}
            </select>
            <span style={{ fontSize: 11, color: "var(--ps-text-muted)" }}>Age {entryAge}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-text-secondary)" }}>Room Price</span>
            <input type="text" value={rad ? rad.toLocaleString() : ""} onChange={e => onUpdate("amount", e.target.value.replace(/[^0-9]/g, ""))}
              style={{ ...controlInput, width: 120 }} placeholder="800,000" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 280 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-text-secondary)", whiteSpace: "nowrap" }}>RAD %</span>
            <input type="range" min="0" max="100" step="5" value={effectiveRadPct}
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
              onChange={e => { const v = parseInt(e.target.value); setLocalRadPct(v); }}
              onMouseUp={e => { const v = parseInt(e.target.value); setIsDragging(false); onUpdate("rad_pct", String(v)); }}
              onTouchEnd={() => { setIsDragging(false); onUpdate("rad_pct", String(effectiveRadPct)); }}
              style={{ flex: 1, accentColor: "#4F46E5", minWidth: 100 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#4F46E5", minWidth: 36, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{effectiveRadPct}%</span>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ padding: "2px 8px", borderRadius: 6, background: "var(--ps-surface-indigo)", border: "1px solid var(--ps-ring-indigo)", fontSize: 11, fontWeight: 600, color: "#4F46E5" }}>
                RAD {fC(effectiveRadLumpSum)}
              </span>
              {effectiveDapPortion > 0 && (
                <span style={{ padding: "2px 8px", borderRadius: 6, background: "var(--ps-surface-amber)", border: "1px solid var(--ps-ring-amber)", fontSize: 11, fontWeight: 600, color: "#D97706" }}>
                  DAP {fC(effectiveDapAnnual)}/yr
                </span>
              )}
            </div>
          </div>
          <button onClick={() => setShowAssessmentPopup(true)} style={{
            padding: "6px 14px", borderRadius: 8, border: "1px solid var(--ps-ring-indigo)",
            background: "var(--ps-surface-indigo)", color: "#4F46E5", fontSize: 12, fontWeight: 700,
            cursor: "pointer", whiteSpace: "nowrap",
          }}>📋 View Assessment</button>
        </div>
      )}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        {tiles.map((t, i) => (
          <div key={i} style={{
            flex: 1, minWidth: 170, padding: "16px 20px", borderRadius: 12,
            background: "var(--ps-surface)", border: "1px solid var(--ps-border)",
            borderTop: `3px solid ${t.color}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ps-text-strongest)", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{t.value}</div>
            {t.sub && <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginTop: 2 }}>{t.sub}</div>}
          </div>
        ))}
      </div>

      {/* View Assessment button (always visible, even without controls bar) */}
      {!onUpdate && meansAssessment && (
        <div style={{ marginBottom: 16, textAlign: "right" }}>
          <button onClick={() => setShowAssessmentPopup(true)} style={{
            padding: "6px 14px", borderRadius: 8, border: "1px solid var(--ps-ring-indigo)",
            background: "var(--ps-surface-indigo)", color: "#4F46E5", fontSize: 12, fontWeight: 700,
            cursor: "pointer",
          }}>📋 View Assessment Workings</button>
        </div>
      )}

      {/* Assessment Summary Card */}
      <div style={{ borderRadius: 12, border: "1px solid var(--ps-border)", overflow: "hidden", marginBottom: 24 }}>
        {secHead("📋", "Means Assessment", `${clientName} — Entry ${entryFY} (age ${entryAge})`, "var(--ps-surface-indigo)", "var(--ps-ring-indigo)")}
        <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Accommodation</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--ps-text-secondary)" }}>Status</span>
                <span style={{ fontWeight: 700, color: accommodationStatus === "Full Payer" ? "var(--ps-badge-amber)" : "var(--ps-badge-green)" }}>{accommodationStatus}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--ps-text-secondary)" }}>Room Price</span>
                <span style={{ fontWeight: 600, color: "var(--ps-text-primary)" }}>{fC(rad)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--ps-text-secondary)" }}>RAD Paid ({radPct}%)</span>
                <span style={{ fontWeight: 600, color: "#4F46E5" }}>{fC(radLumpSum)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--ps-text-secondary)" }}>DAP Portion ({100 - radPct}%)</span>
                <span style={{ fontWeight: 600, color: dapPortion > 0 ? "#D97706" : "var(--ps-text-subtle)" }}>{dapPortion > 0 ? `${fC(dapAnnual)}/yr` : "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--ps-text-secondary)" }}>MPIR</span>
                <span style={{ fontWeight: 600, color: "var(--ps-text-primary)" }}>{fP(MPIR)}</span>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Annual Fees (Year 1)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--ps-text-secondary)" }}>Basic Daily Fee</span>
                <span style={{ fontWeight: 600, color: "var(--ps-text-primary)" }}>{fC(BASIC_DAILY_FEE_ANNUAL)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--ps-text-secondary)" }}>Means-Tested Care Fee</span>
                <span style={{ fontWeight: 600, color: "var(--ps-text-primary)" }}>{fC(meansAssessment?.mtcfAnnual || 0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--ps-text-secondary)" }}>Additional Services</span>
                <span style={{ fontWeight: 600, color: "var(--ps-text-primary)" }}>{fC(ADDITIONAL_SERVICES)}</span>
              </div>
              {dapAnnual > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--ps-text-secondary)" }}>Daily Accommodation Payment (DAP)</span>
                  <span style={{ fontWeight: 600, color: "#D97706" }}>{fC(dapAnnual)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderTop: "1px solid var(--ps-border)", paddingTop: 6 }}>
                <span style={{ fontWeight: 700, color: "var(--ps-text-primary)" }}>Total Annual (Year 1)</span>
                <span style={{ fontWeight: 800, color: "var(--ps-text-strongest)", fontFamily: "'JetBrains Mono', monospace" }}>{fC(BASIC_DAILY_FEE_ANNUAL + (meansAssessment?.mtcfAnnual || 0) + ADDITIONAL_SERVICES + (dapAnnual || 0))}</span>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Caps & Limits</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--ps-text-secondary)" }}>MTCF Annual Cap</span>
                <span style={{ fontWeight: 600, color: "var(--ps-text-primary)" }}>{fC(MEANS_TESTED_FEE_CAP_ANNUAL)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--ps-text-secondary)" }}>MTCF Lifetime Cap</span>
                <span style={{ fontWeight: 600, color: "var(--ps-text-primary)" }}>{fC(MEANS_TESTED_FEE_LIFETIME_CAP)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--ps-text-secondary)" }}>RAD Retention</span>
                <span style={{ fontWeight: 600, color: "var(--ps-text-primary)" }}>2% pa of balance, max 5 years</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--ps-text-secondary)" }}>Payment Method</span>
                <span style={{ fontWeight: 600, color: "#4F46E5" }}>{paymentMethod === "full_rad" ? "Full RAD" : paymentMethod === "full_dap" ? "Full DAP" : `${radPct}% RAD + ${100-radPct}% DAP`}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--ps-text-secondary)" }}>Pension Impact</span>
                <span style={{ fontWeight: 600, color: "var(--ps-badge-green)" }}>RAD assessed (not deemed)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Means Test Calculation Detail */}
      {meansAssessment && (
        <div style={{ borderRadius: 12, border: "1px solid var(--ps-border)", overflow: "hidden", marginBottom: 24 }}>
          {secHead("🧮", "Means Test Calculation", "Pre-1 Nov 2025 legislated formula — income test + asset test = MTA", "var(--ps-surface-green)", "var(--ps-ring-emerald)")}
          <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Income Test */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 10, borderBottom: "2px solid var(--ps-border)", paddingBottom: 6 }}>Step 1: Income Test Contribution</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--ps-text-secondary)" }}>Total Assessable Income</span>
                  <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{fC(meansAssessment.entryIncome?.total || 0)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--ps-text-secondary)" }}>Less: Income Free Area</span>
                  <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "var(--ps-text-muted)" }}>({fC(meansAssessment.incomeFreeArea)})</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--ps-text-secondary)" }}>Income Above Threshold</span>
                  <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{fC(meansAssessment.incomeAboveThreshold)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--ps-text-secondary)" }}>× 50%</span>
                  <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#4F46E5" }}>{fC(Math.round(meansAssessment.incomeTestedAnnual))}/yr</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, borderTop: "1px solid var(--ps-border-light)", paddingTop: 4 }}>
                  <span style={{ fontWeight: 600, color: "var(--ps-text-primary)" }}>Daily rate (÷ 364)</span>
                  <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#4F46E5" }}>${meansAssessment.incomeTestedDaily?.toFixed(2) || "0.00"}/day</span>
                </div>
              </div>
            </div>

            {/* Asset Test */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 10, borderBottom: "2px solid var(--ps-border)", paddingBottom: 6 }}>Step 2: Asset Test Contribution (Tiered)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--ps-text-secondary)" }}>Total Assessable Assets</span>
                  <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{fC(meansAssessment.totalAssets)}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--ps-text-muted)", padding: "4px 8px", background: "var(--ps-surface-alt)", borderRadius: 4 }}>
                  $0–$63k: nil · $63k–$210.6k: 17.5% · $210.6k–$505.7k: 1% · $505.7k+: 2%
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--ps-text-secondary)" }}>Asset Tested Amount</span>
                  <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#4F46E5" }}>{fC(Math.round(meansAssessment.assetTestedAnnual))}/yr</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, borderTop: "1px solid var(--ps-border-light)", paddingTop: 4 }}>
                  <span style={{ fontWeight: 600, color: "var(--ps-text-primary)" }}>Daily rate (÷ 364)</span>
                  <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#4F46E5" }}>${meansAssessment.assetTestedDaily?.toFixed(2) || "0.00"}/day</span>
                </div>
              </div>
            </div>
          </div>

          {/* MTA + MTCF summary */}
          <div style={{ padding: "12px 24px 20px", borderTop: "1px solid var(--ps-border-light)" }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)", textTransform: "uppercase" }}>Step 3: Means Tested Amount (MTA)</div>
                <div style={{ fontSize: 11, color: "var(--ps-text-secondary)", marginTop: 2 }}>Income daily + Asset daily</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ps-text-strongest)", fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>${meansAssessment.mtaDaily?.toFixed(2) || "0.00"}/day</div>
                <div style={{ fontSize: 11, color: "var(--ps-text-muted)" }}>{fC(meansAssessment.mtaAnnual)}/yr</div>
              </div>
              <div style={{ flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)", textTransform: "uppercase" }}>Step 4: MTCF = MTA − MASA</div>
                <div style={{ fontSize: 11, color: "var(--ps-text-secondary)", marginTop: 2 }}>${meansAssessment.mtaDaily?.toFixed(2)} − ${meansAssessment.masaDaily?.toFixed(2)} = ${meansAssessment.mtcfDaily?.toFixed(2)}/day</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: meansAssessment.mtcfAnnual > 0 ? "var(--ps-red)" : "var(--ps-green)", fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>{meansAssessment.mtcfAnnual > 0 ? fC(meansAssessment.mtcfAnnual) + "/yr" : "NIL"}</div>
                <div style={{ fontSize: 11, color: "var(--ps-text-muted)" }}>{meansAssessment.mtcfDaily < 1 && meansAssessment.mtaDaily > meansAssessment.masaDaily ? "< $1/day — reduced to nil" : meansAssessment.mtaDaily <= meansAssessment.masaDaily ? "MTA ≤ MASA — no MTCF" : `Capped at ${fC(MEANS_TESTED_FEE_CAP_ANNUAL)}/yr`}</div>
              </div>
              <div style={{ flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8, background: accommodationStatus === "Full Payer" ? "var(--ps-surface-amber)" : "var(--ps-surface-green)", border: `1px solid ${accommodationStatus === "Full Payer" ? "var(--ps-ring-amber)" : "var(--ps-ring-emerald)"}` }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)", textTransform: "uppercase" }}>Step 5: Accommodation Status</div>
                <div style={{ fontSize: 11, color: "var(--ps-text-secondary)", marginTop: 2 }}>MTA {meansAssessment.mtaDaily >= meansAssessment.masaDaily ? "≥" : "<"} MASA (${meansAssessment.masaDaily?.toFixed(2)}/day)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ps-text-strongest)", marginTop: 4 }}>{accommodationStatus}</div>
                <div style={{ fontSize: 11, color: "var(--ps-text-muted)" }}>{accommodationStatus === "Full Payer" ? "Pays RAD/DAP — no govt supplement" : "Govt pays accommodation supplement"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fee Breakdown Table */}
      <div style={{ borderRadius: 12, border: "1px solid var(--ps-border)", overflow: "hidden", marginBottom: 24 }}>
        {secHead("💰", "Fee Breakdown", "Annual aged care expenses hitting cashflow", "var(--ps-surface-amber)", "var(--ps-ring-amber)")}
        <div style={{ overflow: "auto", maxHeight: "70vh" }}>
          <table style={scrollTableStyle}>
            <thead>
              <tr style={{ background: "var(--ps-surface-alt)" }}>
                <th style={{ ...stickyLabel, background: "var(--ps-surface-alt)", fontWeight: 700, color: "var(--ps-text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", zIndex: 3 }}>Fee Component</th>
                {displayYears.map((y, i) => (
                  <th key={i} style={{ ...yearHeader, background: i >= entryYearIdx ? "var(--ps-surface-indigo)" : "var(--ps-surface-alt)" }}>
                    {y}<br /><span style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>Age {ages[i]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sectionRow("Cashflow Expenses", "📤")}
              {dataRow("Basic Daily Fee", basicDailyFee)}
              {dataRow("Means-Tested Care Fee", meansTested)}
              {dapPayments.some(v => v > 0) && dataRow("Daily Accommodation Payment (DAP)", dapPayments)}
              {dataRow("Additional Services", additionalServices)}
              <tr>
                <td style={totalRowStyle("var(--ps-red)")}>Total Aged Care Expenses</td>
                {totalExpenses.map((v, i) => (
                  <td key={i} style={totalCellStyle("var(--ps-red)")}>{v === 0 ? "—" : fC(v)}</td>
                ))}
              </tr>

              {govtContribution.some(v => v > 0) && sectionRow("Government Accommodation Supplement", "🏛️")}
              {govtContribution.some(v => v > 0) && dataRow("Accommodation Supplement (Supported)", govtContribution, { color: "var(--ps-green)" })}

              {sectionRow("RAD Balance", "🔒")}
              {dataRow("RAD Opening Balance", radBalance.map((v, i) => i === entryYearIdx ? rad : i > entryYearIdx ? rad - (cumulativeRetention[i - 1] || 0) : 0))}
              {dataRow("Less: Retention", retentionDeducted, { isNegative: true })}
              <tr>
                <td style={totalRowStyle("#7C3AED")}>RAD Closing Balance</td>
                {radBalance.map((v, i) => (
                  <td key={i} style={totalCellStyle("#7C3AED")}>{v === 0 ? "—" : fC(v)}</td>
                ))}
              </tr>
              {dataRow("Cumulative Retention", cumulativeRetention, { color: "var(--ps-text-muted)" })}
              {dataRow("Estate Refund", estateRefund, { bold: true, color: "#7C3AED" })}

              {sectionRow("Means-Tested Care Fee Tracking", "📊")}
              {dataRow("MTCF This Year", meansTested)}
              {dataRow("MTCF Cumulative (Lifetime)", mtcfLifetimeCumulative)}
              {dataRow("Lifetime Cap", mtcfLifetimeCumulative.map(() => MEANS_TESTED_FEE_LIFETIME_CAP))}
              {dataRow("Cap Remaining", mtcfLifetimeCumulative.map(v => Math.max(0, MEANS_TESTED_FEE_LIFETIME_CAP - v)), { color: "var(--ps-green)" })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Assessment Workings Popup ── */}
      {showAssessmentPopup && meansAssessment && (() => {
        const ma = meansAssessment;
        const assetItems = ma.entryAssets?.items || [];
        const incomeItems = ma.entryIncome?.items || [];
        const th = ma.thresholds || {};
        const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
        const modalStyle = { background: "var(--ps-surface)", borderRadius: 16, border: "1px solid var(--ps-border)", maxWidth: 720, width: "100%", maxHeight: "85vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" };
        const secTitle = (icon, title) => (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", background: "var(--ps-surface-alt)", borderBottom: "1px solid var(--ps-border)" }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-strongest)" }}>{title}</span>
          </div>
        );
        const lineItem = (label, value, opts = {}) => (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 20px", borderBottom: "1px solid var(--ps-border-light)", fontSize: 13 }}>
            <span style={{ color: opts.exempt ? "var(--ps-text-muted)" : opts.bold ? "var(--ps-text-strongest)" : "var(--ps-text-secondary)", fontWeight: opts.bold ? 700 : 400, fontStyle: opts.exempt ? "italic" : "normal" }}>
              {label} {opts.note && <span style={{ fontSize: 10, color: "var(--ps-text-muted)" }}>({opts.note})</span>}
            </span>
            <span style={{ fontWeight: opts.bold ? 800 : 600, fontFamily: "'JetBrains Mono', monospace", color: opts.color || (opts.bold ? "var(--ps-text-strongest)" : opts.exempt ? "var(--ps-text-muted)" : "var(--ps-text-body)") }}>
              {typeof value === "string" ? value : fC(value)}
            </span>
          </div>
        );
        const calcStep = (step, label, formula, result) => (
          <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--ps-border-light)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", background: "#4F46E5", color: "#fff", fontSize: 11, fontWeight: 700 }}>{step}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-strongest)" }}>{label}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--ps-text-muted)", fontFamily: "'JetBrains Mono', monospace", paddingLeft: 30, marginBottom: 2 }}>{formula}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#4F46E5", fontFamily: "'JetBrains Mono', monospace", paddingLeft: 30 }}>{typeof result === "string" ? result : fC(result)}</div>
          </div>
        );

        return (
          <div style={overlayStyle} onClick={() => setShowAssessmentPopup(false)}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--ps-border)", background: "var(--ps-surface-indigo)" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ps-text-strongest)" }}>📋 Means Assessment Workings</div>
                  <div style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>{clientName} — Entry {entryFY} (age {entryAge})</div>
                </div>
                <button onClick={() => setShowAssessmentPopup(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--ps-text-muted)", padding: 4 }}>✕</button>
              </div>

              {/* Assessable Assets */}
              {secTitle("💰", `Assessable Assets at Entry (Year ${entryYearIdx + 1})`)}
              {assetItems.map((item, i) => lineItem(item.label, item.value, { exempt: item.exempt, note: item.exempt ? `Full value ${fC(item.fullValue)}` : item.note }))}
              {lineItem("TOTAL ASSESSABLE ASSETS", ma.entryAssets?.total || 0, { bold: true, color: "#4F46E5" })}

              {/* Assessable Income */}
              {secTitle("📊", "Assessable Income at Entry")}
              {incomeItems.map((item, i) => lineItem(item.label, item.value, { note: item.note }))}
              {lineItem("TOTAL ASSESSABLE INCOME", ma.entryIncome?.total || 0, { bold: true, color: "#4F46E5" })}

              {/* Means Test Calculation */}
              {secTitle("🧮", "Means Test Calculation")}
              {calcStep("1", "Income Test Contribution",
                `Income ${fC(ma.entryIncome?.total)} − free area ${fC(ma.incomeFreeArea)} = ${fC(ma.incomeAboveThreshold)} × 50%`,
                `${fC(ma.incomeTestedAnnual)}/yr → ${fC(Math.round(ma.incomeTestedDaily * 100) / 100)}/day`
              )}
              {calcStep("2", "Asset Test Contribution",
                `Assets ${fC(ma.totalAssets)} through tiered thresholds`,
                `${fC(ma.assetTestedAnnual)}/yr → ${fC(Math.round(ma.assetTestedDaily * 100) / 100)}/day`
              )}
              {calcStep("3", "Means Tested Amount (MTA)",
                `Income daily ${fC(Math.round(ma.incomeTestedDaily * 100) / 100)} + Asset daily ${fC(Math.round(ma.assetTestedDaily * 100) / 100)}`,
                `${fC(Math.round(ma.mtaDaily * 100) / 100)}/day (${fC(ma.mtaAnnual)}/yr)`
              )}
              {calcStep("4", "MTCF",
                `MTA daily ${fC(Math.round(ma.mtaDaily * 100) / 100)} − MASA ${fC(ma.masaDaily)}/day`,
                ma.mtcfDaily > 0 ? `${fC(Math.round(ma.mtcfDaily * 100) / 100)}/day (${fC(ma.mtcfAnnual)}/yr)` : "Nil — MTA ≤ MASA"
              )}
              {calcStep("5", "Accommodation Status",
                `MTA daily ${fC(Math.round(ma.mtaDaily * 100) / 100)} ${ma.mtaDaily >= ma.masaDaily ? "≥" : "<"} MASA ${fC(ma.masaDaily)}/day`,
                ma.mtaDaily >= ma.masaDaily ? "FULL PAYER — pays RAD/DAP, no govt supplement" : "SUPPORTED — govt pays accommodation supplement"
              )}

              {/* Asset Test Tier Detail */}
              {secTitle("📐", "Asset Test Tier Breakdown")}
              <div style={{ padding: "10px 20px", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "var(--ps-text-secondary)" }}>
                {lineItem(`$0 – ${fC(th.assetTier0)}`, "Nil", { note: "free area" })}
                {lineItem(`${fC(th.assetTier0)} – ${fC(th.assetTier1)}`, `17.5% of ${fC(Math.max(0, Math.min(ma.totalAssets, th.assetTier1) - th.assetTier0))}`)}
                {ma.totalAssets > th.assetTier1 && lineItem(`${fC(th.assetTier1)} – ${fC(th.assetTier2)}`, `1% of ${fC(Math.max(0, Math.min(ma.totalAssets, th.assetTier2) - th.assetTier1))}`)}
                {ma.totalAssets > th.assetTier2 && lineItem(`Above ${fC(th.assetTier2)}`, `2% of ${fC(Math.max(0, ma.totalAssets - th.assetTier2))}`)}
                {lineItem("Total Asset Tested Amount", ma.assetTestedAnnual, { bold: true })}
              </div>

              {/* Home status */}
              {ma.isHomeowner && (
                <>
                  {secTitle("🏠", "Home Assessment")}
                  {lineItem("Home Value", ma.homeValue)}
                  {lineItem("Partner in Home", ma.partnerInHome ? "Yes — home EXEMPT" : "No")}
                  {!ma.partnerInHome && lineItem("Home Cap Applied", ma.HOME_CAP, { note: "capped value used in asset test" })}
                </>
              )}

              {/* Caps */}
              {secTitle("🔒", "Fee Caps")}
              {lineItem("Annual MTCF Cap", th.annualMTCFCap)}
              {lineItem("Lifetime MTCF Cap", th.lifetimeMTCFCap)}
              {lineItem("Cost of Care Cap", `${fC(th.costOfCareDaily)}/day`)}
              {lineItem("MASA", `${fC(ma.masaDaily)}/day`)}

              <div style={{ padding: "12px 20px", textAlign: "center" }}>
                <button onClick={() => setShowAssessmentPopup(false)} style={{
                  padding: "8px 24px", borderRadius: 8, border: "1px solid var(--ps-border-mid)",
                  background: "var(--ps-surface-alt)", color: "var(--ps-text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export function SocialSecurityTable({ ssData }) {
  const [collapsed, setCollapsed] = useState({ "Assets Test": true, "Income Test": false });
  const toggleSection = (title) => setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));

  if (!ssData) return <div style={{ padding: 40, textAlign: "center", color: "var(--ps-text-subtle)" }}>No data available</div>;

  const { shortYears, bothEligibleYear, isCouple, isHomeowner, assetsThreshold, assetsCutoff, annualRent, assetRows, assetTotals, assetsTestPension, incomeRows, incomeTotals, incomeTestPension, finalPension, appliedTest, maxAnnual, rentAssistVals, totalPensionWithRA } = ssData;
  const N = shortYears.length;
  const fC = (v) => "$" + Math.abs(Math.round(v)).toLocaleString("en-AU");
  const fN = (v) => Math.round(v).toLocaleString("en-AU");

  const sections = [
    { title: "Assets Test", icon: "🏠", accent: "#2563EB", bg: "var(--ps-surface-blue)", border: "var(--ps-ring-blue)",
      rows: assetRows, totals: assetTotals, pension: assetsTestPension },
    { title: "Income Test", icon: "💰", accent: "#059669", bg: "var(--ps-surface-emerald)", border: "var(--ps-ring-green)",
      rows: incomeRows, totals: incomeTotals, pension: incomeTestPension },
  ];

  const tableStyle = {
    width: "100%", borderCollapse: "separate", borderSpacing: 0,
    fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontVariantNumeric: "tabular-nums",
  };
  const thStyle = (sticky) => ({
    padding: "10px 12px", textAlign: sticky ? "left" : "right",
    fontWeight: 600, color: "var(--ps-text-secondary)", borderBottom: "2px solid var(--ps-border)",
    fontSize: 12, background: "var(--ps-surface-alt)", whiteSpace: "nowrap",
    ...(sticky ? { position: "sticky", left: 0, zIndex: 2, minWidth: 260, textTransform: "uppercase", letterSpacing: "0.05em" } : {}),
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Eligibility banner */}
      <div style={{
        padding: "14px 20px", borderRadius: 10,
        background: bothEligibleYear < N ? "var(--ps-surface-emerald)" : "var(--ps-surface-orange)",
        border: `1px solid ${bothEligibleYear < N ? "var(--ps-ring-green)" : "var(--ps-ring-orange)"}`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ fontSize: 20 }}>{bothEligibleYear < N ? "✅" : "⏳"}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-strongest)" }}>
            {bothEligibleYear < N
              ? `Age Pension eligible from Year ${bothEligibleYear + 1} (${shortYears[bothEligibleYear]})`
              : "Age Pension eligibility beyond projection horizon"}
          </div>
          <div style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>
            {isCouple ? "Couple (combined)" : "Single"} · {isHomeowner ? "Homeowner" : "Non-homeowner"} · Pension age {AGE_PENSION_PARAMS.pensionAge}
            {bothEligibleYear < N && ` · Max annual: ${fC(maxAnnual * Math.pow(1 + AGE_PENSION_PARAMS.cpiRate, bothEligibleYear))}`}
            {` · Assets threshold: ${fC(assetsThreshold)} / Cut-off: ${fC(assetsCutoff)}`}
          </div>
        </div>
      </div>

      {/* Assets Test + Income Test sections */}
      {sections.map(sec => {
        const isOpen = !collapsed[sec.title];
        return (
          <div key={sec.title} style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${sec.border}`, background: "var(--ps-surface)" }}>
            {/* Header */}
            <div onClick={() => toggleSection(sec.title)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 20px", background: sec.bg, borderBottom: `1px solid ${sec.border}`, cursor: "pointer",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: "var(--ps-surface)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, border: `1px solid ${sec.border}`, boxShadow: "0 1px 3px var(--ps-shadow-xs)",
                }}>{sec.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-strongest)" }}>{sec.title}</div>
                  <div style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>{sec.rows.length} component{sec.rows.length !== 1 ? "s" : ""}</div>
                </div>
                <span style={{ fontSize: 10, color: "var(--ps-text-subtle)", transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s", marginLeft: 4 }}>▼</span>
              </div>
            </div>

            {/* Table */}
            {isOpen && (
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle(true)}>Component</th>
                      {shortYears.map((y, i) => (
                        <th key={i} style={thStyle(false)}>{y}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Detail rows */}
                    {sec.rows.map((row, ri) => {
                      const allZero = row.values.every(v => v === 0);
                      return (
                        <tr key={ri} style={{ opacity: allZero ? 0.4 : 1 }}>
                          <td style={{
                            padding: "7px 16px", fontWeight: 400, color: row.isNegative ? "var(--ps-red)" : "var(--ps-text-secondary)",
                            borderBottom: "1px solid var(--ps-surface-alt)", position: "sticky", left: 0, background: "var(--ps-surface)",
                            zIndex: 1, borderRight: "1px solid var(--ps-border-light)", fontSize: 12,
                          }}>{row.label}</td>
                          {row.values.slice(0, N).map((v, vi) => (
                            <td key={vi} style={{
                              padding: "7px 12px", textAlign: "right", fontWeight: 400,
                              color: v === 0 ? "var(--ps-border-input)" : row.isNegative ? "var(--ps-red)" : "var(--ps-text-secondary)",
                              borderBottom: "1px solid var(--ps-surface-alt)", fontSize: 12,
                            }}>{row.isNegative ? `-${fN(Math.abs(v))}` : fN(v)}</td>
                          ))}
                        </tr>
                      );
                    })}
                    {/* Total row */}
                    <tr>
                      <td style={{
                        padding: "10px 16px", fontWeight: 700, color: sec.accent,
                        background: sec.bg, borderBottom: "1px solid " + sec.border, borderTop: "1px solid " + sec.border,
                        position: "sticky", left: 0, zIndex: 1, borderRight: "1px solid var(--ps-border-light)",
                      }}>Total Assessable</td>
                      {sec.totals.map((v, vi) => (
                        <td key={vi} style={{
                          padding: "10px 12px", textAlign: "right", fontWeight: 700,
                          color: sec.accent, background: sec.bg,
                          borderBottom: "1px solid " + sec.border, borderTop: "1px solid " + sec.border,
                        }}>{fC(v)}</td>
                      ))}
                    </tr>
                    {/* Pension from this test */}
                    <tr>
                      <td style={{
                        padding: "10px 16px", fontWeight: 700, color: "var(--ps-text-strongest)",
                        background: "var(--ps-surface-alt)", borderBottom: "2px solid var(--ps-border)",
                        position: "sticky", left: 0, zIndex: 1, borderRight: "1px solid var(--ps-border-light)",
                      }}>Pension ({sec.title})</td>
                      {sec.pension.map((v, vi) => (
                        <td key={vi} style={{
                          padding: "10px 12px", textAlign: "right", fontWeight: 700,
                          color: vi < bothEligibleYear ? "var(--ps-border-input)" : v > 0 ? "var(--ps-green)" : "var(--ps-red)",
                          background: "var(--ps-surface-alt)", borderBottom: "2px solid var(--ps-border)",
                        }}>{vi < bothEligibleYear ? "N/E" : fC(v)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* ══ Final Determination ══ */}
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--ps-ring-indigo)", background: "var(--ps-surface)" }}>
        <div style={{
          padding: "14px 20px", background: "var(--ps-surface-indigo)", borderBottom: "1px solid var(--ps-ring-indigo)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: "var(--ps-surface)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, border: "1px solid var(--ps-ring-indigo)", boxShadow: "0 1px 3px var(--ps-shadow-xs)",
          }}>🏛️</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-strongest)" }}>Age Pension Determination</div>
            <div style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>Lower of Assets Test and Income Test applied</div>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle(true)}>Year</th>
                {shortYears.map((y, i) => (
                  <th key={i} style={thStyle(false)}>{y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "8px 16px", fontWeight: 600, color: "#2563EB", background: "var(--ps-surface-blue)", borderBottom: "1px solid var(--ps-border-light)", position: "sticky", left: 0, zIndex: 1, borderRight: "1px solid var(--ps-border-light)" }}>Pension (Assets Test)</td>
                {assetsTestPension.map((v, i) => (
                  <td key={i} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 500, color: i < bothEligibleYear ? "var(--ps-border-input)" : "#2563EB", borderBottom: "1px solid var(--ps-border-light)", background: "var(--ps-surface-blue)" }}>{i < bothEligibleYear ? "N/E" : fC(v)}</td>
                ))}
              </tr>
              <tr>
                <td style={{ padding: "8px 16px", fontWeight: 600, color: "var(--ps-green)", background: "var(--ps-surface-emerald)", borderBottom: "1px solid var(--ps-border-light)", position: "sticky", left: 0, zIndex: 1, borderRight: "1px solid var(--ps-border-light)" }}>Pension (Income Test)</td>
                {incomeTestPension.map((v, i) => (
                  <td key={i} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 500, color: i < bothEligibleYear ? "var(--ps-border-input)" : "#059669", borderBottom: "1px solid var(--ps-border-light)", background: "var(--ps-surface-emerald)" }}>{i < bothEligibleYear ? "N/E" : fC(v)}</td>
                ))}
              </tr>
              <tr>
                <td style={{ padding: "8px 16px", fontWeight: 600, color: "var(--ps-text-muted)", borderBottom: "1px solid var(--ps-border-light)", position: "sticky", left: 0, zIndex: 1, borderRight: "1px solid var(--ps-border-light)", background: "var(--ps-surface-alt)" }}>Applied Test</td>
                {appliedTest.map((t, i) => (
                  <td key={i} style={{
                    padding: "8px 12px", textAlign: "right", fontWeight: 500, fontSize: 11,
                    color: i < bothEligibleYear ? "var(--ps-border-input)" : t === "Assets" ? "#2563EB" : "var(--ps-green)",
                    borderBottom: "1px solid var(--ps-border-light)", background: "var(--ps-surface-alt)",
                  }}>{i < bothEligibleYear ? "—" : t}</td>
                ))}
              </tr>
              {/* Final pension — highlight row */}
              <tr>
                <td style={{
                  padding: "12px 16px", fontWeight: 700, color: "#4338CA",
                  background: "var(--ps-surface-indigo)", borderTop: "2px solid var(--ps-ring-indigo)",
                  position: "sticky", left: 0, zIndex: 1, borderRight: "1px solid var(--ps-ring-indigo)",
                  fontSize: 14,
                }}>Age Pension (Base)</td>
                {finalPension.map((v, i) => (
                  <td key={i} style={{
                    padding: "12px 12px", textAlign: "right", fontWeight: 700, fontSize: 14,
                    color: i < bothEligibleYear ? "var(--ps-border-input)" : v > 0 ? "#4338CA" : "var(--ps-red)",
                    background: "var(--ps-surface-indigo)", borderTop: "2px solid var(--ps-ring-indigo)",
                  }}>{i < bothEligibleYear ? "N/E" : fC(v)}</td>
                ))}
              </tr>
              {/* Rent Assistance — only shows for non-homeowners with rent */}
              {!isHomeowner && annualRent > 0 && (
                <tr>
                  <td style={{
                    padding: "8px 16px", fontWeight: 600, color: "#D97706",
                    background: "var(--ps-surface-amber)", position: "sticky", left: 0, zIndex: 1,
                    borderRight: "1px solid var(--ps-ring-indigo)", fontSize: 13,
                  }}>Rent Assistance</td>
                  {rentAssistVals.map((v, i) => (
                    <td key={i} style={{
                      padding: "8px 12px", textAlign: "right", fontWeight: 600, fontSize: 13,
                      color: i < bothEligibleYear ? "var(--ps-border-input)" : v > 0 ? "#D97706" : "var(--ps-text-subtle)",
                      background: "var(--ps-surface-amber)",
                    }}>{i < bothEligibleYear ? "N/E" : fC(v)}</td>
                  ))}
                </tr>
              )}
              {/* Total pension entitlement */}
              <tr>
                <td style={{
                  padding: "12px 16px", fontWeight: 700, color: "var(--ps-green)",
                  background: "var(--ps-surface-emerald)", borderTop: "2px solid var(--ps-ring-green)", borderBottom: "2px solid var(--ps-ring-green)",
                  position: "sticky", left: 0, zIndex: 1, borderRight: "1px solid var(--ps-ring-green)",
                  fontSize: 14,
                }}>Total Annual Entitlement</td>
                {totalPensionWithRA.map((v, i) => (
                  <td key={i} style={{
                    padding: "12px 12px", textAlign: "right", fontWeight: 700, fontSize: 14,
                    color: i < bothEligibleYear ? "var(--ps-border-input)" : v > 0 ? "var(--ps-green)" : "var(--ps-red)",
                    background: "var(--ps-surface-emerald)", borderTop: "2px solid var(--ps-ring-green)", borderBottom: "2px solid var(--ps-ring-green)",
                  }}>{i < bothEligibleYear ? "N/E" : fC(v)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


// Assumptions > Eligibility & Superannuation
const ASSUMPTION_YEARS = ["2025/2026","2026/2027","2027/2028","2028/2029","2029/2030","2030/2031","2031/2032","2032/2033","2033/2034","2034/2035","2035/2036","2036/2037","2037/2038","2038/2039","2039/2040","2040/2041","2041/2042"];

// ── Australian Life Tables 2020–22 ──────────────────────────────────────────
// Source: Australian Government Actuary, ALT 2020-22 (Commonwealth of Australia 2024)
// e(x) = remaining life expectancy at exact age x
// l(x) = survivors out of 100,000 births (used for survival probability)
const ALT_MALE_EX = {
  0:81.3,1:80.7,2:79.7,3:78.8,4:77.8,5:76.8,6:75.9,7:74.9,8:73.9,9:72.9,
  10:71.9,11:71.0,12:70.0,13:69.0,14:68.0,15:67.1,16:66.1,17:65.2,18:64.3,19:63.4,
  20:62.5,21:61.6,22:60.7,23:59.8,24:58.9,25:58.0,26:57.1,27:56.2,28:55.3,29:54.4,
  30:53.5,31:52.5,32:51.6,33:50.7,34:49.8,35:48.8,36:47.9,37:47.0,38:46.1,39:45.2,
  40:44.3,41:43.4,42:42.5,43:41.6,44:40.7,45:39.8,46:38.9,47:38.0,48:37.2,49:36.3,
  50:35.4,51:34.6,52:33.7,53:32.9,54:32.1,55:31.2,56:30.4,57:29.6,58:28.8,59:28.1,
  60:27.3,61:26.5,62:25.8,63:25.1,64:24.3,65:23.6,66:22.9,67:22.2,68:21.5,69:20.8,
  70:20.2,71:19.5,72:18.8,73:18.2,74:17.6,75:17.0,76:16.3,77:15.7,78:15.2,79:14.6,
  80:14.0,81:13.5,82:12.9,83:12.4,84:11.9,85:11.4,86:10.9,87:10.4,88:9.9,89:9.5,
  90:9.0,91:8.6,92:8.2,93:7.8,94:7.4,95:7.0,96:6.7,97:6.3,98:6.0,99:5.7,100:5.4
};
const ALT_FEMALE_EX = {
  0:85.3,1:84.6,2:83.7,3:82.7,4:81.7,5:80.8,6:79.8,7:78.8,8:77.8,9:76.8,
  10:75.8,11:74.9,12:73.9,13:72.9,14:71.9,15:71.0,16:70.0,17:69.0,18:68.1,19:67.1,
  20:66.1,21:65.2,22:64.2,23:63.2,24:62.3,25:61.3,26:60.3,27:59.4,28:58.4,29:57.4,
  30:56.5,31:55.5,32:54.5,33:53.6,34:52.6,35:51.6,36:50.7,37:49.7,38:48.8,39:47.8,
  40:46.8,41:45.9,42:44.9,43:44.0,44:43.0,45:42.1,46:41.1,47:40.2,48:39.3,49:38.3,
  50:37.4,51:36.5,52:35.6,53:34.7,54:33.8,55:32.9,56:32.0,57:31.1,58:30.2,59:29.4,
  60:28.5,61:27.6,62:26.8,63:25.9,64:25.1,65:24.3,66:23.4,67:22.6,68:21.8,69:21.0,
  70:20.2,71:19.4,72:18.7,73:17.9,74:17.2,75:16.4,76:15.7,77:15.0,78:14.3,79:13.6,
  80:13.0,81:12.3,82:11.7,83:11.1,84:10.5,85:9.9,86:9.4,87:8.9,88:8.4,89:7.9,
  90:7.4,91:7.0,92:6.6,93:6.2,94:5.8,95:5.5,96:5.2,97:4.9,98:4.6,99:4.3,100:4.1
};
const ALT_MALE_LX = {
  0:100000,5:99400,10:99342,15:99250,20:98810,25:98240,30:97684,35:96773,40:95222,45:92646,
  46:91971,47:91233,48:90427,49:89549,50:88595,51:87560,52:86440,53:85233,54:83937,55:82551,
  56:81069,57:79487,58:77801,59:76005,60:74097,61:72076,62:69941,63:67695,64:65341,65:62881,
  66:60321,67:57669,68:54933,69:52122,70:49248,71:46326,72:43374,73:40413,74:37463,75:34545,
  76:31679,77:28886,78:26189,79:23605,80:21152,81:18844,82:16695,83:14718,84:12921,85:11308,
  86:9875,87:8617,88:7523,89:6580,90:5775,91:5094,92:4522,93:4046,94:3652,95:3323,
  96:3044,97:2802,98:2586,99:2388,100:2202
};
const ALT_FEMALE_LX = {
  0:100000,5:99484,10:99433,15:99371,20:99171,25:98911,30:98612,35:98126,40:97291,45:95880,
  46:95499,47:95075,48:94605,49:94083,50:93504,51:92864,52:92161,53:91390,54:90548,55:89628,
  56:88626,57:87535,58:86351,59:85067,60:83681,61:82191,62:80598,63:78905,64:77113,65:75225,
  66:73247,67:71184,68:69042,69:66826,70:64542,71:62199,72:59803,73:57360,74:54877,75:52360,
  76:49817,77:47254,78:44678,79:42095,80:39512,81:36937,82:34384,83:31864,84:29389,85:26974,
  86:24633,87:22381,88:20232,89:18199,90:16295,91:14530,92:12912,93:11447,94:10137,95:8979,
  96:7965,97:7082,98:6318,99:5661,100:5099
};
export const altEx = (age, gender) => {
  const tbl = gender === "1" ? ALT_FEMALE_EX : ALT_MALE_EX;
  const a = Math.min(100, Math.max(0, Math.round(age)));
  return tbl[a] ?? Math.max(0, (gender === "1" ? 85.3 : 81.3) - age);
};
export const altSurvivalPct = (fromAge, toAge, gender) => {
  const lx = gender === "1" ? ALT_FEMALE_LX : ALT_MALE_LX;
  // Interpolate l(x) for ages not in sparse table
  const getLx = (a) => {
    const ai = Math.min(100, Math.max(0, Math.round(a)));
    if (lx[ai] !== undefined) return lx[ai];
    // Find nearest lower/upper
    let lo = ai - 1, hi = ai + 1;
    while (lo >= 0 && lx[lo] === undefined) lo--;
    while (hi <= 100 && lx[hi] === undefined) hi++;
    if (lx[lo] === undefined) return lx[hi] ?? 100;
    if (lx[hi] === undefined) return lx[lo];
    return lx[lo] + (lx[hi] - lx[lo]) * (ai - lo) / (hi - lo);
  };
  const lFrom = getLx(fromAge);
  if (lFrom <= 0) return 0;
  return Math.round((getLx(toAge) / lFrom) * 100);
};

const ELIGIBILITY_CATHERINE = [
  { label: "Age at start of year", values: [60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76], type: "number" },
  { label: "Life expectancy", values: [27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11], type: "number" },
  { label: "Alive", values: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], type: "bool" },
  { label: "Eligible for age pension", values: [0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1], type: "bool" },
  { label: "Still working", values: [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0], type: "bool" },
  { label: "Under 60", values: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], type: "bool" },
  { label: "Over 60", values: [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], type: "bool" },
  { label: "Preservation met", values: [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], type: "bool" },
  { label: "Eligible for full pension", values: [0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1], type: "bool" },
  { label: "Eligible for TTR", values: [0,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0], type: "bool" },
  { label: "Eligible for allowance", values: [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0], type: "bool" },
  { label: "Receiving age pension", values: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], type: "bool" },
  { label: "Eligible for tax free annuity", values: [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], type: "bool" },
  { label: "SGC Eligible", values: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], type: "bool" },
  { label: "Eligible to make concessional contributions", values: [1,1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0], type: "bool" },
  { label: "Eligible to make government co-contribution", values: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], type: "bool" },
  { label: "Eligible to make non-concessional contribution", values: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], type: "bool" },
  { label: "Eligible to make spouse contribution", values: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], type: "bool" },
  { label: "Annuity assessability - Assets test", values: ["60%","60%","60%","60%","60%","60%","60%","60%","60%","60%","60%","60%","60%","60%","60%","60%","60%"], type: "text" },
  { label: "Annuity assessability - Income test", values: ["60%","60%","60%","60%","60%","60%","60%","60%","60%","60%","60%","60%","60%","60%","60%","60%","60%"], type: "text" },
  { label: "Single", values: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], type: "bool" },
  { label: "Couple", values: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], type: "bool" },
  { label: "Living in principal residence", values: [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1], type: "bool" },
  { label: "Renting out principal residence", values: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], type: "bool" },
  { label: "Renting", values: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], type: "bool" },
];

const ELIGIBILITY_PAUL = ELIGIBILITY_CATHERINE.map(row => {
  if (row.label === "Age at start of year") return { ...row, values: [56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72] };
  if (row.label === "Life expectancy") return { ...row, values: [31,30,29,28,27,26,25,24,23,22,21,20,19,18,17,16,15] };
  if (row.label === "Still working") return { ...row, values: [1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0] };
  if (row.label === "Over 60") return { ...row, values: [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1] };
  if (row.label === "Eligible for age pension") return { ...row, values: [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1] };
  if (row.label === "Preservation met") return { ...row, values: [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1] };
  if (row.label === "Eligible for full pension") return { ...row, values: [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1] };
  if (row.label === "Eligible for TTR") return { ...row, values: [0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0] };
  if (row.label === "Eligible for tax free annuity") return { ...row, values: [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1] };
  return row;
});

const SUPER_ASSUMPTIONS_CATHERINE = [
  { label: "Concessional contributions cap", values: [30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000,30000], type: "number" },
  { label: "Non-concessional contributions cap", values: [120000,120000,120000,120000,120000,120000,120000,120000,120000,120000,120000,120000,120000,120000,120000,120000,120000], type: "number" },
  { label: "Transfer balance cap", values: [1900000,1900000,1900000,1900000,1900000,1900000,1900000,1900000,1900000,1900000,1900000,1900000,1900000,1900000,1900000,1900000,1900000], type: "number" },
  { label: "Total super balance", values: [485000,510000,538000,568000,600000,634000,670000,690000,710000,730000,750000,770000,790000,810000,830000,850000,870000], type: "number" },
  { label: "Minimum pension drawdown rate", values: ["4%","4%","4%","4%","4%","4%","5%","5%","5%","5%","5%","5%","5%","5%","5%","7%","7%"], type: "text" },
  { label: "Super guarantee rate", values: ["12%","12%","12%","12%","12%","12%","12%","12%","12%","12%","12%","12%","12%","12%","12%","12%","12%"], type: "text" },
  { label: "Maximum super guarantee salary", values: [245680,245680,245680,245680,245680,245680,245680,245680,245680,245680,245680,245680,245680,245680,245680,245680,245680], type: "number" },
  { label: "Government co-contribution max", values: [500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500], type: "number" },
  { label: "Low income super tax offset", values: [500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500], type: "number" },
  { label: "Div 293 threshold", values: [250000,250000,250000,250000,250000,250000,250000,250000,250000,250000,250000,250000,250000,250000,250000,250000,250000], type: "number" },
];

const SUPER_ASSUMPTIONS_PAUL = SUPER_ASSUMPTIONS_CATHERINE.map(row => {
  if (row.label === "Total super balance") return { ...row, values: [620000,655000,692000,732000,774000,818000,865000,900000,930000,960000,990000,1020000,1050000,1080000,1110000,1140000,1170000] };
  return { ...row };
});

export function EligibilityTable({ data }) {
  // Group eligibility rows
  const ELIG_CATEGORIES = {
    "Demographics": { icon: "👤", accentColor: "#0891B2", bgColor: "var(--ps-surface-cyan)", borderColor: "var(--ps-ring-cyan)",
      labels: ["Age at start of year", "Life expectancy", "Probability still alive", "Alive", "Single", "Couple", "Still working"] },
    "Pension Eligibility": { icon: "🏖️", accentColor: "#7C3AED", bgColor: "var(--ps-surface-purple)", borderColor: "var(--ps-ring-purple)",
      labels: ["Eligible for age pension", "Eligible for full pension", "Receiving age pension", "Eligible for allowance"] },
    "Super Access": { icon: "🏦", accentColor: "#2563EB", bgColor: "var(--ps-surface-blue)", borderColor: "var(--ps-ring-blue)",
      labels: ["Under 60", "Over 60", "Preservation age", "Preservation met", "Eligible for TTR", "Eligible for tax free annuity", "SGC Eligible"] },
    "Contribution Eligibility": { icon: "💰", accentColor: "#059669", bgColor: "var(--ps-surface-emerald)", borderColor: "var(--ps-ring-green)",
      labels: ["Eligible to make concessional contributions", "Eligible to make government co-contribution", "Eligible to make non-concessional contribution", "Eligible to make spouse contribution"] },
    "Residence": { icon: "🏡", accentColor: "#D97706", bgColor: "var(--ps-surface-amber)", borderColor: "var(--ps-ring-amber)",
      labels: ["Living in principal residence", "Renting out principal residence", "Renting"] },
  };

  const renderVal = (row, val, vi, row_values) => {
    if (row.type === "bool") {
      const changed = vi > 0 && val !== row_values[vi - 1];
      return (
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 26, height: 26, borderRadius: 6,
          background: val ? "var(--ps-bg-green-200)" : "var(--ps-bg-red-200)",
          color: val ? "var(--ps-badge-green)" : "var(--ps-badge-red)",
          fontWeight: 700, fontSize: 12,
          border: changed ? `2px solid ${val ? "#16A34A" : "#DC2626"}` : "none",
          boxShadow: changed ? `0 0 0 2px ${val ? "#16A34A22" : "#DC262622"}` : "none",
        }}>
          {val ? "✓" : "✕"}
        </div>
      );
    }
    if (row.type === "text") return <span style={{ fontSize: 12, color: "var(--ps-text-muted)", fontWeight: 500 }}>{val}</span>;
    return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, color: "var(--ps-text-strongest)" }}>{typeof val === "number" ? val.toLocaleString("en-AU") : val}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {Object.entries(ELIG_CATEGORIES).map(([catName, cat]) => {
        const catRows = data.filter(r => cat.labels.includes(r.label));
        if (catRows.length === 0) return null;
        return (
          <div key={catName} style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${cat.borderColor}`, background: "var(--ps-surface)" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
              background: cat.bgColor, borderBottom: `1px solid ${cat.borderColor}`,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: "var(--ps-surface)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, border: `1px solid ${cat.borderColor}`, boxShadow: "0 1px 3px var(--ps-shadow-xs)",
              }}>{cat.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-strongest)" }}>{catName}</div>
              <span style={{ fontSize: 11, color: "var(--ps-text-muted)" }}>{catRows.length} items</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "8px 20px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--ps-border-light)", position: "sticky", left: 0, background: "var(--ps-surface)", zIndex: 2, minWidth: 260 }}>Condition</th>
                    {ASSUMPTION_YEARS.map(y => (
                      <th key={y} style={{ padding: "8px 8px", textAlign: "center", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", borderBottom: "1px solid var(--ps-border-light)", minWidth: 60, whiteSpace: "nowrap" }}>{y.slice(0, 4)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catRows.map((row, ri) => {
                    const bg = "var(--ps-surface)";
                    return (
                      <tr key={ri} style={{ background: bg }}>
                        <td style={{
                          padding: "9px 20px", fontSize: 13, fontWeight: 500, color: "var(--ps-text-primary)",
                          position: "sticky", left: 0, background: bg, zIndex: 1, borderRight: "1px solid var(--ps-border-light)",
                          borderBottom: ri < catRows.length - 1 ? "1px solid var(--ps-surface-alt)" : "none", minWidth: 260,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 4, height: 4, borderRadius: "50%", background: cat.accentColor, flexShrink: 0 }} />
                            {row.label}
                          </div>
                        </td>
                        {row.values.map((v, vi) => (
                          <td key={vi} style={{
                            padding: "6px 8px", textAlign: "center",
                            borderBottom: ri < catRows.length - 1 ? "1px solid var(--ps-surface-alt)" : "none",
                          }}>
                            {renderVal(row, v, vi, row.values)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SuperAssumptionsTable({ data }) {
  // Group rows into categories for card display
  const SUPER_CATEGORIES = {
    "Contribution Limits": { icon: "💰", accentColor: "#059669", bgColor: "var(--ps-surface-emerald)", borderColor: "var(--ps-ring-green)",
      labels: ["Concessional contributions cap", "Non-concessional contributions cap"] },
    "Balance & Transfer": { icon: "🏦", accentColor: "#2563EB", bgColor: "var(--ps-surface-blue)", borderColor: "var(--ps-ring-blue)",
      labels: ["Transfer balance cap", "TBC used", "TBC remaining", "TBC exceeded"] },
    "Pension & Guarantee": { icon: "📋", accentColor: "#7C3AED", bgColor: "var(--ps-surface-purple)", borderColor: "var(--ps-ring-purple)",
      labels: ["Minimum pension drawdown rate", "Super guarantee rate", "Maximum super guarantee salary"] },
    "Offsets & Thresholds": { icon: "🧾", accentColor: "#D97706", bgColor: "var(--ps-surface-amber)", borderColor: "var(--ps-ring-amber)",
      labels: ["Government co-contribution max", "Low income super tax offset", "Div 293 threshold"] },
  };

  const fV = (row, v) => {
    if (row.type === "text") return v;
    if (row.type === "bool") return (
      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 22, height: 22, borderRadius: 5,
        background: v ? "var(--ps-bg-red-200)" : "var(--ps-bg-green-200)", color: v ? "var(--ps-badge-red)" : "var(--ps-badge-green)",
        fontWeight: 700, fontSize: 11 }}>
        {v ? "✕" : "✓"}
      </div>
    );
    return typeof v === "number" ? v.toLocaleString("en-AU") : v;
  };

  // Detect which values change across years
  const hasChange = (row) => row.values.some(v => v !== row.values[0]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {Object.entries(SUPER_CATEGORIES).map(([catName, cat]) => {
        const catRows = data.filter(r => cat.labels.includes(r.label));
        if (catRows.length === 0) return null;
        return (
          <div key={catName} style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${cat.borderColor}`, background: "var(--ps-surface)" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
              background: cat.bgColor, borderBottom: `1px solid ${cat.borderColor}`,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: "var(--ps-surface)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, border: `1px solid ${cat.borderColor}`, boxShadow: "0 1px 3px var(--ps-shadow-xs)",
              }}>{cat.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-strongest)" }}>{catName}</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "8px 20px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--ps-border-light)", position: "sticky", left: 0, background: "var(--ps-surface)", zIndex: 2, minWidth: 240 }}>Rate / Cap</th>
                    {ASSUMPTION_YEARS.map(y => (
                      <th key={y} style={{ padding: "8px 10px", textAlign: "right", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", borderBottom: "1px solid var(--ps-border-light)", minWidth: 80, whiteSpace: "nowrap" }}>{y.slice(0, 4)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catRows.map((row, ri) => {
                    const changes = hasChange(row);
                    const bg = "var(--ps-surface)";
                    return (
                      <tr key={ri} style={{ background: bg }}>
                        <td style={{
                          padding: "10px 20px", fontSize: 13, fontWeight: 500, color: "var(--ps-text-primary)",
                          position: "sticky", left: 0, background: bg, zIndex: 1, borderRight: "1px solid var(--ps-border-light)",
                          borderBottom: ri < catRows.length - 1 ? "1px solid var(--ps-surface-alt)" : "none", minWidth: 240,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 4, height: 4, borderRadius: "50%", background: cat.accentColor, flexShrink: 0 }} />
                            {row.label}
                            {changes && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "var(--ps-bg-amber-200)", color: "var(--ps-badge-amber)", fontWeight: 600, marginLeft: 4 }}>VARIES</span>}
                          </div>
                        </td>
                        {row.values.map((v, vi) => {
                          const changed = vi > 0 && v !== row.values[vi - 1];
                          return (
                            <td key={vi} style={{
                              padding: "10px 10px", textAlign: "right",
                              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: changed ? 700 : 400,
                              color: changed ? cat.accentColor : "var(--ps-text-secondary)",
                              background: changed ? `${cat.accentColor}08` : "transparent",
                              borderBottom: ri < catRows.length - 1 ? "1px solid var(--ps-surface-alt)" : "none",
                            }}>
                              {fV(row, v)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Placeholder content for empty tabs
// ─────────────────────────────────────────────────────────────
// SUPER PRODUCT PAGE (chart + table)
// ─────────────────────────────────────────────────────────────

export function SuperProductPage({ data, onToggleIndex, fundIdx, factFind, updateFF }) {
  const [showDashboard, setShowDashboard] = useState(true);
  const [hidden, setHidden] = useState({});
  const toggleSeries = (key) => setHidden(prev => ({ ...prev, [key]: !prev[key] }));

  const superSeries = [
    { key: "sgContrib",     label: "SG Contributions",      color: "#34D399" },
    { key: "personalContrib", label: "Personal CC",          color: "#10B981" },
    { key: "nccContrib",    label: "Non-Concessional",       color: "var(--ps-green)" },
    { key: "rollIns",       label: "Roll-ins",               color: "#06B6D4" },
    { key: "withdrawals",   label: "Withdrawals / Roll-outs",color: "#F43F5E" },
    { key: "balance",       label: "Account Balance",        color: "#4F46E5", isLine: true },
  ];
  // Extract chart data from the existing section table data
  const years = data.years || [];
  const shortYears = years.map(y => y.slice(2)); // "25/2026" → "25/26" style

  // Insurance inflation controls
  const sp = (factFind?.superProducts || [])[fundIdx];
  const insInflationOn = sp?.fees?.ins_inflation_on !== false;
  const insInflationRate = sp?.fees?.ins_inflation_rate || "5.0";

  const toggleInsInflation = () => {
    if (!updateFF || fundIdx == null) return;
    const prods = [...(factFind.superProducts || [])];
    if (prods[fundIdx]) {
      prods[fundIdx] = { ...prods[fundIdx], fees: { ...prods[fundIdx].fees, ins_inflation_on: !insInflationOn } };
      updateFF("superProducts", prods);
    }
  };
  const setInsInflationRate = (val) => {
    if (!updateFF || fundIdx == null) return;
    const prods = [...(factFind.superProducts || [])];
    if (prods[fundIdx]) {
      prods[fundIdx] = { ...prods[fundIdx], fees: { ...prods[fundIdx].fees, ins_inflation_rate: val } };
      updateFF("superProducts", prods);
    }
  };

  // Find key rows from sections
  const findRow = (label) => {
    for (const sec of data.sections) {
      if (sec.rows) {
        const r = sec.rows.find(r => r.label === label);
        if (r) return r.values;
      }
      if (sec.subSections) {
        for (const sub of sec.subSections) {
          if (sub.rows) {
            const r = sub.rows.find(r => r.label === label);
            if (r) return r.values;
          }
        }
      }
    }
    return years.map(() => 0);
  };

  const endValueFV = findRow("End Value (FV)").some(v => v > 0) ? findRow("End Value (FV)") : findRow("Closing Balance");
  const totalCC = findRow("Total Concessional").some(v => v > 0) ? findRow("Total Concessional") : findRow("Total Contributions");
  const totalNCC = findRow("Total Non-Concessional").some(v => v > 0) ? findRow("Total Non-Concessional") : findRow("After-Tax (NCC)");
  const sg = findRow("Super Guarantee").some(v => v > 0) ? findRow("Super Guarantee") : findRow("Employer SG");
  const personalDC = findRow("Personal Deductible Contributions").some(v => v > 0) ? findRow("Personal Deductible Contributions") : findRow("Salary Sacrifice");
  const contribTax = findRow("Contributions Tax (15%)");
  const div293 = findRow("Division 293 Tax (15%)");
  const withdrawals = findRow("Withdrawals");
  const lumpSum = findRow("Lump Sum");
  const investReturns = findRow("Investment Returns");
  const totalFees = findRow("Total Fees & Insurance").some(v => v !== 0) ? findRow("Total Fees & Insurance") : findRow("Total Fees");
  const rollOutTotal = data.sections.find(s => s.subSections)?.subSections?.find(s => s.label === "Roll-outs")?.summaryValues || years.map(() => 0);
  const rollInTotal = data.sections.find(s => s.subSections)?.subSections?.find(s => s.label === "Roll-ins")?.summaryValues || years.map(() => 0);

  // Build chart data
  const chartData = years.map((yr, i) => {
    const ccIn = (totalCC[i] || 0);
    const nccIn = (totalNCC[i] || 0);
    const totalContribs = ccIn + nccIn;
    const wdraw = (withdrawals[i] || 0) + (lumpSum[i] || 0);
    const rollOut = rollOutTotal[i] || 0;
    const rollIn = rollInTotal[i] || 0;
    const totalOut = wdraw + rollOut;

    return {
      year: shortYears[i],
      balance: endValueFV[i] || 0,
      sgContrib: sg[i] || 0,
      personalContrib: personalDC[i] || 0,
      nccContrib: totalNCC[i] || 0,
      rollIns: rollIn || 0,
      contribTax: Math.abs(contribTax[i] || 0) + Math.abs(div293[i] || 0),
      withdrawals: totalOut > 0 ? -totalOut : 0,
    };
  });

  const maxBal = Math.max(...chartData.map(d => d.balance));
  const fK = (v) => Math.abs(v) >= 1e6 ? `$${(v/1e6).toFixed(1)}m` : Math.abs(v) >= 1000 ? `$${Math.round(v/1000)}k` : `$${v}`;
  const fC = (v) => v < 0 ? `-$${Math.abs(Math.round(v)).toLocaleString("en-AU")}` : `$${Math.round(v).toLocaleString("en-AU")}`;

  // Summary KPIs
  const finalBal = endValueFV[endValueFV.length - 1] || 0;
  const openBalRow = findRow("Opening Balance");
  const openBal = (openBalRow[0] || 0) > 0 ? openBalRow[0] : (endValueFV[0] || 0);
  const totalContribsSum = chartData.reduce((s, d) => s + d.sgContrib + d.personalContrib + d.nccContrib, 0);
  const totalTaxSum = chartData.reduce((s, d) => s + d.contribTax, 0);
  const totalRollInsSum = chartData.reduce((s, d) => s + d.rollIns, 0);
  const totalReturnsSum = investReturns.reduce((s, v) => s + (v || 0), 0);
  const totalFeesSum = totalFees.reduce((s, v) => s + Math.abs(v || 0), 0);

  return (
    <div>
      {/* Fund header if dynamic data */}
      {data.fundName && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ps-text-primary)" }}>{data.fundName}</div>
          {data.entity && <EntityBadge name={data.entity} size="sm" />}
          {data.memberNumber && <span style={{ fontSize: 12, color: "var(--ps-text-subtle)" }}>Member: {data.memberNumber}</span>}
        </div>
      )}
      {/* Insurance inflation controls */}
      {sp && (
        <div style={{
          display: "flex", alignItems: "center", gap: 16, padding: "10px 16px",
          borderRadius: 10, background: insInflationOn ? "var(--ps-surface-indigo)" : "var(--ps-surface-alt)",
          border: `1px solid ${insInflationOn ? "var(--ps-ring-indigo)" : "var(--ps-border)"}`,
          marginBottom: 16, transition: "all 0.2s",
        }}>
          <span style={{ fontSize: 15 }}>🛡️</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-body)" }}>Insurance Premium Inflation</span>
          <div
            onClick={toggleInsInflation}
            style={{
              width: 40, height: 22, borderRadius: 11, cursor: "pointer",
              background: insInflationOn ? "#6366F1" : "var(--ps-border-mid)",
              position: "relative", transition: "background 0.2s",
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 9, background: "var(--ps-surface)",
              position: "absolute", top: 2,
              left: insInflationOn ? 20 : 2,
              transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            }} />
          </div>
          <span style={{ fontSize: 12, color: insInflationOn ? "#4338CA" : "var(--ps-text-subtle)", fontWeight: 500 }}>
            {insInflationOn ? "ON" : "OFF"}
          </span>
          {insInflationOn && (
            <>
              <span style={{ fontSize: 12, color: "var(--ps-text-muted)", marginLeft: 8 }}>Rate:</span>
              <input
                type="number"
                value={insInflationRate}
                onChange={(e) => setInsInflationRate(e.target.value)}
                step="0.5" min="0" max="20"
                style={{
                  width: 60, padding: "4px 8px", borderRadius: 6,
                  border: "1px solid var(--ps-ring-indigo)", fontSize: 13, fontWeight: 600,
                  color: "#4338CA", textAlign: "center", background: "var(--ps-surface)", outline: "none",
                }}
              />
              <span style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>% p.a.</span>
            </>
          )}
        </div>
      )}
      {/* Dashboard & Chart collapse */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button onClick={() => setShowDashboard(p => !p)} style={{
          padding: "5px 14px", borderRadius: 6, border: "1px solid var(--ps-border)", background: showDashboard ? "var(--ps-surface-alt)" : "var(--ps-surface-indigo)",
          color: showDashboard ? "var(--ps-text-muted)" : "#4F46E5", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        }}>
          {showDashboard ? "▼ Hide" : "▶ Show"} Dashboard & Charts
        </button>
      </div>
      {showDashboard && (<>
      {/* KPI strip — Super fund */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Opening Balance", value: fK(openBal), color: "var(--ps-text-secondary)" },
          { label: "Projected Closing", value: fK(finalBal), color: "#4F46E5" },
          { label: "Total Contributions", value: fK(totalContribsSum), color: "var(--ps-green)" },
          { label: totalReturnsSum > 0 ? "Total Returns" : "Total Roll-ins", value: fK(totalReturnsSum > 0 ? totalReturnsSum : totalRollInsSum), color: "#0891B2" },
          { label: totalFeesSum > 0 ? "Total Fees" : "Total Tax", value: fK(totalFeesSum > 0 ? totalFeesSum : totalTaxSum), color: "var(--ps-red)" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "var(--ps-surface)", border: "1px solid var(--ps-border)", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Combined chart: stacked bars (contribs/withdrawals) + area (balance) */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16, marginTop: 0 }}>
          Balance, Contributions &amp; Withdrawals
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barCategoryGap={0}>
            <defs>
              <linearGradient id="gSuperBal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis yAxisId="balance" orientation="right" tickFormatter={fK} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
            <YAxis yAxisId="flows" orientation="left" tickFormatter={fK} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
            <Tooltip
              formatter={(v, n) => [fC(v), n]}
              contentStyle={{ background: "var(--ps-text-strongest)", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--ps-tile-dark-text)" }}
              labelStyle={{ color: "var(--ps-text-subtle)", marginBottom: 6, fontSize: 12 }}
            />
            <Legend content={() => (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", paddingTop: 10 }}>
                {superSeries.map(s => (
                  <div key={s.key} onClick={() => toggleSeries(s.key)} style={{
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                    fontSize: 11, padding: "3px 10px", borderRadius: 6,
                    border: `1px solid ${hidden[s.key] ? "var(--ps-border-light)" : "var(--ps-border)"}`,
                    background: hidden[s.key] ? "var(--ps-surface-alt)" : "var(--ps-surface)",
                    opacity: hidden[s.key] ? 0.5 : 1,
                    textDecoration: hidden[s.key] ? "line-through" : "none",
                    color: "var(--ps-text-secondary)",
                  }}>
                    {s.isLine
                      ? <div style={{ width: 16, height: 2, background: s.color, borderRadius: 2 }} />
                      : <div style={{ width: 8, height: 8, background: s.color, borderRadius: 2 }} />}
                    {s.label}
                  </div>
                ))}
              </div>
            )} />

            {/* Contribution bars (positive, stacked) */}
            <Bar yAxisId="flows" dataKey="sgContrib" name="SG Contributions" stackId="flows" fill="#34D399" radius={[0,0,0,0]} hide={hidden.sgContrib} />
            <Bar yAxisId="flows" dataKey="personalContrib" name="Personal CC" stackId="flows" fill="#10B981" radius={[0,0,0,0]} hide={hidden.personalContrib} />
            <Bar yAxisId="flows" dataKey="nccContrib" name="Non-Concessional" stackId="flows" fill="#059669" radius={[0,0,0,0]} hide={hidden.nccContrib} />
            <Bar yAxisId="flows" dataKey="rollIns" name="Roll-ins" stackId="flows" fill="#06B6D4" radius={[0,0,0,0]} hide={hidden.rollIns} />

            {/* Withdrawal bars (negative, same stackId so no gap) */}
            <Bar yAxisId="flows" dataKey="withdrawals" name="Withdrawals / Roll-outs" stackId="flows" fill="#F43F5E" radius={[0,0,0,0]} hide={hidden.withdrawals} />

            {/* Balance area overlay */}
            {!hidden.balance && <Area yAxisId="balance" type="monotone" dataKey="balance" name="Account Balance" stroke="#4F46E5" strokeWidth={2.5} fill="url(#gSuperBal)" dot={false} activeDot={{ r: 4, fill: "#6366F1", strokeWidth: 0 }} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      </>)}

      {/* Existing data table */}
      <SectionTable data={data} onToggleIndex={onToggleIndex} />
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// PENSION PRODUCT PAGE (chart + table)
// ─────────────────────────────────────────────────────────────

export function PensionProductPage({ data }) {
  const [hidden, setHidden] = useState({});
  const toggleSeries = (key) => setHidden(prev => ({ ...prev, [key]: !prev[key] }));

  const penSeries = [
    { key: "rollIns",  label: "Roll-ins",         color: "#10B981" },
    { key: "payments", label: "Drawdowns",         color: "#F59E0B" },
    { key: "balance",  label: "Account Balance",   color: "#4F46E5", isLine: true },
  ];
  const [showDashboard, setShowDashboard] = useState(true);
  const years = data.years || [];
  const shortYears = years.map(y => y.slice(2));

  const findRow = (...labels) => {
    for (const sec of data.sections) {
      if (sec.rows) {
        for (const label of labels) {
          const r = sec.rows.find(r => r.label === label);
          if (r) return r.values;
        }
      }
    }
    return years.map(() => 0);
  };

  const closingBal = findRow("Closing Balance", "End Value (FV)");
  const drawdowns = findRow("Pension Payment", "Payment");
  const additionalDrawdown = findRow("Additional Drawdown");
  const rollIns = data.sections.find(s => s.title === "Roll-ins")?.rows?.[0]?.values || years.map(() => 0);
  const openBal = findRow("Opening Balance", "Current Value");
  const totalFees = findRow("Total Fees");
  const growth = findRow("Investment Returns");

  const chartData = years.map((yr, i) => {
    const pmt = Math.abs(drawdowns[i] || 0);
    const addDraw = Math.abs(additionalDrawdown[i] || 0);
    const totalDraw = pmt + addDraw;
    const rollIn = rollIns[i] || 0;

    return {
      year: shortYears[i],
      balance: closingBal[i] || 0,
      payments: totalDraw > 0 ? -totalDraw : 0,
      rollIns: rollIn || 0,
    };
  });

  const fK = (v) => Math.abs(v) >= 1e6 ? `$${(v/1e6).toFixed(1)}m` : Math.abs(v) >= 1000 ? `$${Math.round(v/1000)}k` : `$${v}`;
  const fC = (v) => v < 0 ? `-$${Math.abs(Math.round(v)).toLocaleString("en-AU")}` : `$${Math.round(v).toLocaleString("en-AU")}`;

  const peakBal = Math.max(...chartData.map(d => d.balance), 0);
  const totalDrawdowns = chartData.reduce((s, d) => s + Math.abs(d.payments), 0);
  const totalRollIns = chartData.reduce((s, d) => s + d.rollIns, 0);
  const finalBal = closingBal[closingBal.length - 1] || 0;
  const totalFeesSum = totalFees.reduce((s, v) => s + Math.abs(v || 0), 0);
  const totalGrowth = growth.reduce((s, v) => s + (v || 0), 0);

  return (
    <div>
      {/* Fund name header */}
      {data.fundName && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ps-text-primary)", margin: 0 }}>{data.fundName}</h2>
          {data.entity && <EntityBadge name={data.entity} />}
          {data.memberNumber && <span style={{ fontSize: 13, color: "var(--ps-text-subtle)" }}>Member: {data.memberNumber}</span>}
          {data.pensionTypeLabel && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#6366f1", background: "rgba(99,102,241,0.08)", padding: "3px 10px", borderRadius: 6 }}>
              {data.pensionTypeLabel}
            </span>
          )}
        </div>
      )}
      {/* Dashboard & Chart collapse */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button onClick={() => setShowDashboard(p => !p)} style={{
          padding: "5px 14px", borderRadius: 6, border: "1px solid var(--ps-border)", background: showDashboard ? "var(--ps-surface-alt)" : "var(--ps-surface-indigo)",
          color: showDashboard ? "var(--ps-text-muted)" : "#4F46E5", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        }}>
          {showDashboard ? "▼ Hide" : "▶ Show"} Dashboard & Charts
        </button>
      </div>
      {showDashboard && (<>
      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Opening Balance", value: fK(openBal[0] || 0), color: "var(--ps-text-secondary)" },
          { label: "Final Balance", value: fK(finalBal), color: finalBal === 0 ? "var(--ps-red)" : "#4F46E5" },
          { label: "Total Drawdowns", value: fK(totalDrawdowns), color: "#F59E0B" },
          { label: "Total Returns", value: fK(totalGrowth), color: "var(--ps-green)" },
          { label: "Total Fees", value: fK(totalFeesSum), color: "var(--ps-red)" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "var(--ps-surface)", border: "1px solid var(--ps-border)", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Combined chart */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16, marginTop: 0 }}>
          Balance, Drawdowns &amp; Roll-ins
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barCategoryGap={0}>
            <defs>
              <linearGradient id="gPenBal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis yAxisId="balance" orientation="right" tickFormatter={fK} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
            <YAxis yAxisId="flows" orientation="left" tickFormatter={fK} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
            <Tooltip
              formatter={(v, n) => [fC(v), n]}
              contentStyle={{ background: "var(--ps-text-strongest)", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--ps-tile-dark-text)" }}
              labelStyle={{ color: "var(--ps-text-subtle)", marginBottom: 6, fontSize: 12 }}
            />
            <Legend content={() => (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", paddingTop: 10 }}>
                {penSeries.map(s => (
                  <div key={s.key} onClick={() => toggleSeries(s.key)} style={{
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                    fontSize: 11, padding: "3px 10px", borderRadius: 6,
                    border: `1px solid ${hidden[s.key] ? "var(--ps-border-light)" : "var(--ps-border)"}`,
                    background: hidden[s.key] ? "var(--ps-surface-alt)" : "var(--ps-surface)",
                    opacity: hidden[s.key] ? 0.5 : 1,
                    textDecoration: hidden[s.key] ? "line-through" : "none",
                    color: "var(--ps-text-secondary)",
                  }}>
                    {s.isLine
                      ? <div style={{ width: 16, height: 2, background: s.color, borderRadius: 2 }} />
                      : <div style={{ width: 8, height: 8, background: s.color, borderRadius: 2 }} />}
                    {s.label}
                  </div>
                ))}
              </div>
            )} />

            {/* Roll-in bars (positive) */}
            <Bar yAxisId="flows" dataKey="rollIns" name="Roll-ins" stackId="flows" fill="#10B981" radius={[0,0,0,0]} hide={hidden.rollIns} />

            {/* Drawdown bars (negative, same stackId) */}
            <Bar yAxisId="flows" dataKey="payments" name="Drawdowns" stackId="flows" fill="#F59E0B" radius={[0,0,0,0]} hide={hidden.payments} />

            {/* Balance area */}
            {!hidden.balance && <Area yAxisId="balance" type="monotone" dataKey="balance" name="Account Balance" stroke="#4F46E5" strokeWidth={2.5} fill="url(#gPenBal)" dot={false} activeDot={{ r: 4, fill: "#6366F1", strokeWidth: 0 }} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      </>)}

      {/* Existing data table */}
      <SectionTable data={data} />
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// INVESTMENT BOND PRODUCT PAGE (chart + table)
// ─────────────────────────────────────────────────────────────

export function BondProductPage({ data }) {
  const years = data.years || [];
  const shortYears = years.map(y => y.slice(2));

  const findRow = (label) => {
    for (const sec of data.sections) {
      if (sec.rows) {
        const r = sec.rows.find(r => r.label === label);
        if (r) return r.values;
      }
    }
    return years.map(() => null);
  };

  // Extract the first year values we have
  const contribsRaw = findRow("Contributions");
  const withdrawalsRaw = findRow("Withdrawal");
  const endValueFVRaw = findRow("End Value (FV)");
  const investReturn = 0.0605; // from header data

  // The bond data only has year 1 populated — project the rest
  const initialContrib = contribsRaw[0] || 150000;
  const initialEndVal = endValueFVRaw[0] || 159075;

  const chartData = years.map((yr, i) => {
    // Contributions: initial lump sum year 1 only (typical for bonds)
    const contrib = i === 0 ? initialContrib : 0;
    // Withdrawals: none in this data
    const withdraw = 0;
    // End value: compound from initial
    const endVal = Math.round(initialContrib * Math.pow(1 + investReturn, i + 1));
    // Growth this year
    const prevVal = i === 0 ? initialContrib : Math.round(initialContrib * Math.pow(1 + investReturn, i));
    const growth = endVal - prevVal;

    return {
      year: shortYears[i],
      yearFull: yr,
      bondYear: i + 1,
      balance: endVal,
      contributions: contrib,
      withdrawals: 0,
      growth,
    };
  });

  const fK = (v) => Math.abs(v) >= 1e6 ? `$${(v/1e6).toFixed(1)}m` : Math.abs(v) >= 1000 ? `$${Math.round(v/1000)}k` : `$${v}`;
  const fC = (v) => v < 0 ? `-$${Math.abs(Math.round(v)).toLocaleString("en-AU")}` : `$${Math.round(v).toLocaleString("en-AU")}`;

  const finalBal = chartData[chartData.length - 1].balance;
  const totalGrowth = finalBal - initialContrib;
  const taxFreeYear = chartData.findIndex(d => d.bondYear >= 10);
  const taxFreeVal = taxFreeYear >= 0 ? chartData[taxFreeYear].balance : null;

  return (
    <div>
      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Initial Investment", value: fK(initialContrib), color: "var(--ps-text-secondary)" },
          { label: "Projected Value", value: fK(finalBal), sub: `Year ${years.length}`, color: "#4F46E5" },
          { label: "Total Growth", value: fK(totalGrowth), sub: `${((totalGrowth / initialContrib) * 100).toFixed(0)}% return`, color: "var(--ps-green)" },
          { label: "Tax-Free After", value: taxFreeYear >= 0 ? `Year 10 (${fK(taxFreeVal)})` : "Year 10", sub: "10-year rule", color: "#F59E0B" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "var(--ps-surface)", border: "1px solid var(--ps-border)", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginTop: 2 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16, marginTop: 0 }}>
          Bond Value, Contributions &amp; Growth
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barCategoryGap={0}>
            <defs>
              <linearGradient id="gBondBal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis yAxisId="balance" orientation="right" tickFormatter={fK} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
            <YAxis yAxisId="flows" orientation="left" tickFormatter={fK} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
            <Tooltip
              formatter={(v, n) => [fC(v), n]}
              contentStyle={{ background: "var(--ps-text-strongest)", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--ps-tile-dark-text)" }}
              labelStyle={{ color: "var(--ps-text-subtle)", marginBottom: 6, fontSize: 12 }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />

            {/* Contribution bars */}
            <Bar yAxisId="flows" dataKey="contributions" name="Contributions" stackId="flows" fill="#10B981" radius={[0,0,0,0]} />

            {/* Growth bars */}
            <Bar yAxisId="flows" dataKey="growth" name="Annual Growth" stackId="flows" fill="#F59E0B" radius={[0,0,0,0]} opacity={0.8} />

            {/* 10-year tax free reference line */}
            {taxFreeYear >= 0 && (
              <ReferenceLine yAxisId="balance" x={shortYears[taxFreeYear]} stroke="#F59E0B" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: "Tax-free", fill: "#D97706", fontSize: 11, fontWeight: 600, position: "top" }} />
            )}

            {/* Balance area */}
            <Area yAxisId="balance" type="monotone" dataKey="balance" name="Bond Value" stroke="#4F46E5" strokeWidth={2.5} fill="url(#gBondBal)" dot={false} activeDot={{ r: 4, fill: "#6366F1", strokeWidth: 0 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Existing data table */}
      <SectionTable data={data} />
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// ANNUITY PRODUCT PAGE (chart + table)
// ─────────────────────────────────────────────────────────────

export function AnnuityProductPage({ data }) {
  const years = data.years || [];
  const shortYears = years.map(y => y.length > 5 ? y.slice(2) : y);

  const findRow = (label) => {
    for (const sec of data.sections) {
      if (sec.rows) {
        const r = sec.rows.find(r => r.label === label);
        if (r) return r.values;
      }
    }
    return years.map(() => null);
  };

  // Read from new dynamic format or fall back to old static
  const incomeVals = data.incomeVals || findRow("Annuity Income") || findRow("Income");
  const assessableVals = data.assessableVals || findRow("Assessable Income") || findRow("Net Assessable");
  const assetTestVals = findRow("Asset Test Value") || findRow("Asset Test");
  const incomeTestVals = findRow("Income Test Value") || findRow("Income Test");
  const typeLabel = data.typeLabel || findRow("Annuity Type")[0] || "Standard";
  const envLabel = data.envLabel || findRow("Tax Environment")[0] || "Super";
  const productName = data.productName || "Annuity";
  const entity = data.entity || "";

  const incomeY1 = (incomeVals && incomeVals[0]) || 0;
  const totalIncome = (incomeVals || []).reduce((s, v) => s + (v || 0), 0);
  const totalAssessable = (assessableVals || []).reduce((s, v) => s + (v || 0), 0);
  const purchasePrice = (findRow("Purchase Price") || [])[0] || parseFloat(data.purchasePrice) || 0;

  const fK = (v) => Math.abs(v) >= 1e6 ? `$${(v/1e6).toFixed(1)}m` : Math.abs(v) >= 1000 ? `$${Math.round(v/1000)}k` : `$${v}`;
  const fC = (v) => v < 0 ? `-$${Math.abs(Math.round(v)).toLocaleString("en-AU")}` : `$${Math.round(v).toLocaleString("en-AU")}`;

  const assetTestY1 = (assetTestVals && assetTestVals[0]) || 0;
  const incomeTestY1 = (incomeTestVals && incomeTestVals[0]) || 0;
  const reversionary = findRow("Potential Reversionary Benefit")[0] || 0;

  // Chart data
  const deductibleVals = findRow("Deductible Amount") || years.map(() => 0);
  const chartData = years.map((yr, i) => ({
    year: shortYears[i],
    income: incomeVals?.[i] || 0,
    netAssessable: assessableVals?.[i] || 0,
    deductible: Math.abs(deductibleVals?.[i] || 0),
    assetTest: assetTestVals?.[i] || 0,
  }));

  let runningTotal = 0;
  chartData.forEach(d => { runningTotal += d.income; d.accumulatedIncome = runningTotal; });

  return (
    <div>
      {/* Header */}
      {productName && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ps-text-primary)", margin: 0 }}>{productName}</h2>
          {entity && <EntityBadge name={entity} />}
          <span style={{ fontSize: 11, fontWeight: 600, color: "#6366f1", background: "rgba(99,102,241,0.08)", padding: "3px 10px", borderRadius: 6 }}>
            {typeLabel} · {envLabel}
          </span>
        </div>
      )}
      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Purchase Price", value: fK(purchasePrice), sub: envLabel, color: "var(--ps-text-secondary)" },
          { label: "Annual Income (Yr 1)", value: fK(incomeY1), sub: `${typeLabel}`, color: "#4F46E5" },
          { label: "Total Income", value: fK(totalIncome), sub: `${years.length} years`, color: "var(--ps-green)" },
          { label: "Tax Environment", value: envLabel, sub: typeLabel, color: "#F59E0B" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "var(--ps-surface)", border: "1px solid var(--ps-border)", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginTop: 2 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Income + Accumulated chart */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16, marginTop: 0 }}>
          Annual Income &amp; Accumulated Total
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barCategoryGap={0}>
            <defs>
              <linearGradient id="gAnnAccum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis yAxisId="accum" orientation="right" tickFormatter={fK} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
            <YAxis yAxisId="annual" orientation="left" tickFormatter={fK} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
            <Tooltip
              formatter={(v, n) => [fC(v), n]}
              contentStyle={{ background: "var(--ps-text-strongest)", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--ps-tile-dark-text)" }}
              labelStyle={{ color: "var(--ps-text-subtle)", marginBottom: 6, fontSize: 12 }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />

            {/* Annual income bars — split into deductible and net assessable */}
            <Bar yAxisId="annual" dataKey="netAssessable" name="Assessable Income" stackId="income" fill="#10B981" radius={[0,0,0,0]} />
            <Bar yAxisId="annual" dataKey="deductible" name="Deductible Component" stackId="income" fill="#34D399" radius={[0,0,0,0]} opacity={0.5} />

            {/* Accumulated income area */}
            <Area yAxisId="accum" type="monotone" dataKey="accumulatedIncome" name="Accumulated Income" stroke="#4F46E5" strokeWidth={2.5} fill="url(#gAnnAccum)" dot={false} activeDot={{ r: 4, fill: "#6366F1", strokeWidth: 0 }} />

            {/* Purchase price reference line */}
            <ReferenceLine yAxisId="accum" y={purchasePrice} stroke="#EF4444" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: "Purchase Price", fill: "#DC2626", fontSize: 11, fontWeight: 600, position: "left" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Centrelink assessment strip */}
      <div style={{
        padding: "14px 20px", background: "#FAFAF9", borderRadius: 10, border: "1px solid var(--ps-border-input)",
        display: "flex", gap: 32, alignItems: "center", marginBottom: 16,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Centrelink Assessment
        </span>
        {[
          { label: "Asset Test Value", value: fC(assetTestY1), sub: "60% reducing" },
          { label: "Income Test Value", value: `${fC(incomeTestY1)}/yr`, sub: "deemed portion" },
          { label: "Reversionary", value: fC(reversionary), sub: "on death" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div>
              <span style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>{item.label} </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1E1B4B", fontFamily: "'JetBrains Mono',monospace" }}>{item.value}</span>
              <span style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginLeft: 4 }}>{item.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tax breakdown strip */}
      <div style={{
        padding: "14px 20px", background: "#FAFAF9", borderRadius: 10, border: "1px solid var(--ps-border-input)",
        display: "flex", gap: 32, alignItems: "center", marginBottom: 16,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Tax Treatment (Yr 1)
        </span>
        {[
          { label: "Gross Income", value: fC(incomeY1), color: "var(--ps-green)" },
          { label: "Deductible", value: `-${fC(Math.abs(deductibleVals?.[0] || 0))}`, color: "var(--ps-red)" },
          { label: "Net Assessable", value: fC(assessableVals?.[0] || 0), color: "#1E1B4B" },
          { label: "Tax Offset", value: fC(data.taxOffsetVals?.[0] || 0), color: "#F59E0B" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>{item.label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono',monospace" }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Existing data table */}
      <SectionTable data={data} />
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// INSURANCE PROJECTION PAGE
// ─────────────────────────────────────────────────────────────

const INSURANCE_MOCK = (() => {
  const startYear = 2025;
  const years = 12;
  const inflationRate = 0.025;

  function genClient(opts) {
    const { mortgage, otherDebts, emergLife, emergTPD, emergTrauma, medical, funeral, homeMods,
      otherUp, salary, salaryGrowth, retireIdx, incomeYears, incomeAmt, superStart, superGrowth,
      sharesStart, sharesGrowth, tpdUpliftBase } = opts;

    const data = [];
    for (let i = 0; i < years; i++) {
      const cpi = Math.pow(1 + inflationRate, i);
      const isRetired = i >= retireIdx;

      const mortBal = Math.max(0, mortgage * Math.pow(0.94, i));
      const debtBal = Math.max(0, otherDebts * Math.pow(0.85, i));

      const lifeCapital = mortBal + debtBal + (emergLife + medical + funeral + otherUp) * cpi;
      const tpdCapital = mortBal + debtBal + (emergTPD + medical + homeMods + otherUp + 15000) * cpi;
      const traumaCapital = (emergTrauma + medical + homeMods + 5000) * cpi;

      const incYrsLeft = Math.max(0, incomeYears - i);
      const curIncome = incomeAmt * Math.pow(1.025, i);
      const lifePV = incYrsLeft > 0 ? Math.round(curIncome * incYrsLeft * 0.97) : 0;
      const tpdPV = incYrsLeft > 0 ? Math.round(curIncome * incYrsLeft * 0.85) : 0;

      const upliftPct = isRetired ? 0 : tpdUpliftBase * Math.max(0, 1 - i / retireIdx);
      const tpdUplift = Math.round((tpdCapital + tpdPV) * upliftPct);

      const superBal = superStart * Math.pow(1 + superGrowth, i);
      const sharesBal = sharesStart ? sharesStart * Math.pow(1 + sharesGrowth, i) : 0;
      const lifeAssets = superBal + sharesBal;
      const tpdAssets = superBal;

      const projSalary = isRetired ? 0 : Math.round(salary * Math.pow(1 + salaryGrowth, i));
      const ipMonthly = Math.round(projSalary * 0.75 / 12);

      data.push({
        year: `${startYear + i}/${(startYear + i + 1).toString().slice(-2)}`,
        yearShort: `${(startYear + i).toString().slice(-2)}/${(startYear + i + 1).toString().slice(-2)}`,
        age: opts.startAge + i,
        life: Math.max(0, Math.round(lifeCapital + lifePV - lifeAssets)),
        tpd: Math.max(0, Math.round(tpdCapital + tpdPV + tpdUplift - tpdAssets)),
        trauma: Math.round(traumaCapital),
        ip: ipMonthly,
        lifeCapital: Math.round(lifeCapital),
        tpdCapital: Math.round(tpdCapital),
        lifePV, tpdPV, tpdUplift,
        lifeAssets: Math.round(lifeAssets),
        tpdAssets: Math.round(tpdAssets),
        mortgage: Math.round(mortBal),
      });
    }
    return data;
  }

  return {
    client: genClient({
      startAge: 60, mortgage: 450000, otherDebts: 25000,
      emergLife: 30000, emergTPD: 40000, emergTrauma: 20000, medical: 10000,
      funeral: 15000, homeMods: 60000, otherUp: 10000,
      salary: 85000, salaryGrowth: 0.025, retireIdx: 6,
      incomeYears: 6, incomeAmt: 60000,
      superStart: 350000, superGrowth: 0.068, sharesStart: 80000, sharesGrowth: 0.055,
      tpdUpliftBase: 0.03,
    }),
    partner: genClient({
      startAge: 56, mortgage: 450000, otherDebts: 25000,
      emergLife: 30000, emergTPD: 40000, emergTrauma: 20000, medical: 10000,
      funeral: 15000, homeMods: 60000, otherUp: 10000,
      salary: 95000, salaryGrowth: 0.025, retireIdx: 10,
      incomeYears: 10, incomeAmt: 60000,
      superStart: 250000, superGrowth: 0.068, sharesStart: 0, sharesGrowth: 0,
      tpdUpliftBase: 0.05,
    }),
  };
})();

const INS_COLORS = {
  life: { fill: "#3B82F6", stroke: "#2563EB" },
  tpd: { fill: "#F59E0B", stroke: "#D97706" },
  trauma: { fill: "#EF4444", stroke: "#DC2626" },
  ip: { fill: "#10B981", stroke: "#059669" },
};

// ─────────────────────────────────────────────────────────────
// INSURANCE PREMIUM COST PROJECTION
// ─────────────────────────────────────────────────────────────

export function InsurancePremiumProjection({ personKey, factFind, updateFF }) {
  const [showInflation, setShowInflation] = useState(false);
  const [localBands, setLocalBands] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const toggleSection = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  // ─── Data sources: merge Fact Find policies + SOA Request policies ───
  const insData = factFind.advice_request?.adv_insurance || {};
  const personData = insData[personKey] || {};
  const assumptions = personData.assumptions || {};

  // Fact Find policies (existing/current)
  const ffPolicies = (factFind.insurance?.policies || [])
    .filter(p => p.pol_insured === personKey)
    .map(p => ({
      source: "factfind",
      insurer: p.pol_insurer || "",
      product_name: p.pol_name || "",
      insurance_type: p.pol_type || "",
      structure: p.pol_tax_env || p.pol_structure || "",
      premium_type: "Stepped",
      premium_frequency: p.pol_freq || "Annual",
      include_life: !!(parseFloat(p.premium_life)),
      life_premium: parseFloat(p.premium_life) || 0,
      life_sum_insured: p.sum_insured_life || "",
      include_tpd: !!(parseFloat(p.premium_tpd)),
      tpd_premium: parseFloat(p.premium_tpd) || 0,
      tpd_sum_insured: p.sum_insured_tpd || "",
      include_trauma: !!(parseFloat(p.premium_trauma)),
      trauma_premium: parseFloat(p.premium_trauma) || 0,
      trauma_sum_insured: p.sum_insured_trauma || "",
      include_ip: !!(parseFloat(p.premium_ip)),
      ip_premium: parseFloat(p.premium_ip) || 0,
      ip_monthly_benefit: p.sum_insured_ip || "",
    }));

  // SOA Request policies (recommended/new)
  const soaPolicies = (insData.policies || [])
    .filter(p => p.person === personKey)
    .map(p => ({ ...p, source: "advice" }));

  // Merge — use real policies if any exist, otherwise fall back to demo
  const DEMO_POLICIES = [
    { source: "factfind", insurer: "MLC", product_name: "MLC Life Cover", insurance_type: "Life with Linked TPD", structure: "Inside Super", premium_type: "Stepped", premium_frequency: "Monthly", include_life: true, life_premium: 1420, life_sum_insured: "600000", include_tpd: true, tpd_premium: 980, tpd_sum_insured: "600000", include_trauma: false, trauma_premium: 0, include_ip: false, ip_premium: 0 },
    { source: "factfind", insurer: "MLC", product_name: "MLC Income Protection", insurance_type: "Income Protection", structure: "Inside Super", premium_type: "Stepped", premium_frequency: "Monthly", include_life: false, life_premium: 0, include_tpd: false, tpd_premium: 0, include_trauma: false, trauma_premium: 0, include_ip: true, ip_premium: 1870, ip_monthly_benefit: "8500" },
    { source: "advice", insurer: "TAL", product_name: "Accelerated Protection", insurance_type: "Life with Linked TPD/Trauma", structure: "Inside Super (Platform Linked)", premium_type: "Stepped", premium_frequency: "Monthly", include_life: true, life_premium: 1840, life_sum_insured: "750000", include_tpd: true, tpd_premium: 1260, tpd_sum_insured: "750000", include_trauma: false, trauma_premium: 0, include_ip: false, ip_premium: 0 },
    { source: "advice", insurer: "TAL", product_name: "Accelerated Protection", insurance_type: "Income Protection (Stand-alone)", structure: "Inside Super (Platform Linked)", premium_type: "Stepped", premium_frequency: "Monthly", include_life: false, life_premium: 0, include_tpd: false, tpd_premium: 0, include_trauma: false, trauma_premium: 0, include_ip: true, ip_premium: 2150, ip_monthly_benefit: "10000" },
    { source: "advice", insurer: "Zurich", product_name: "Wealth Protection", insurance_type: "Trauma (Stand alone)", structure: "Non-Super (Ordinary)", premium_type: "Stepped", premium_frequency: "Annual", include_life: false, life_premium: 0, include_tpd: false, tpd_premium: 0, include_trauma: true, trauma_premium: 1480, trauma_sum_insured: "250000", include_ip: false, ip_premium: 0 },
    { source: "advice", insurer: "AIA", product_name: "Priority Protection", insurance_type: "Life (stand-alone)", structure: "Non-Super (Ordinary)", premium_type: "Level", premium_frequency: "Annual", include_life: true, life_premium: 920, life_sum_insured: "500000", include_tpd: false, tpd_premium: 0, include_trauma: false, trauma_premium: 0, include_ip: false, ip_premium: 0 },
  ];
  const DEMO_POLICIES_P = [
    { source: "factfind", insurer: "AMP", product_name: "AMP Elevate", insurance_type: "Life with Linked TPD", structure: "Inside Super", premium_type: "Stepped", premium_frequency: "Monthly", include_life: true, life_premium: 860, life_sum_insured: "400000", include_tpd: true, tpd_premium: 620, tpd_sum_insured: "400000", include_trauma: false, trauma_premium: 0, include_ip: false, ip_premium: 0 },
    { source: "advice", insurer: "TAL", product_name: "Accelerated Protection", insurance_type: "Life with Linked TPD", structure: "Inside Super (Platform Linked)", premium_type: "Stepped", premium_frequency: "Monthly", include_life: true, life_premium: 980, life_sum_insured: "500000", include_tpd: true, tpd_premium: 720, tpd_sum_insured: "500000", include_trauma: false, trauma_premium: 0, include_ip: false, ip_premium: 0 },
    { source: "advice", insurer: "TAL", product_name: "Accelerated Protection", insurance_type: "Income Protection (Stand-alone)", structure: "Non-Super (Ordinary)", premium_type: "Stepped", premium_frequency: "Monthly", include_life: false, life_premium: 0, include_tpd: false, tpd_premium: 0, include_trauma: false, trauma_premium: 0, include_ip: true, ip_premium: 1640, ip_monthly_benefit: "7500" },
  ];

  const realPolicies = [...ffPolicies, ...soaPolicies];
  const allPolicies = realPolicies.length > 0 ? realPolicies : (personKey === "client1" ? DEMO_POLICIES : DEMO_POLICIES_P);
  const isDemo = realPolicies.length === 0;

  const ffCount = allPolicies.filter(p => p.source === "factfind").length;
  const soaCount = allPolicies.filter(p => p.source === "advice").length;

  const cn = (id) => {
    if (id === "client1") return ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim() || "Client 1";
    if (id === "client2") return ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim() || "Client 2";
    return id;
  };
  const personName = cn(personKey);

  // ─── Projection horizon ───
  const clientData = personKey === "client1" ? factFind.client1 : factFind.client2;
  const clientDob = clientData?.date_of_birth;
  const dob = clientDob ? new Date(clientDob) : (assumptions.date_of_birth ? new Date(assumptions.date_of_birth) : null);
  const retAge = parseFloat(assumptions.retirement_age) || parseFloat(clientData?.retirement_age) || 65;
  const currentYear = new Date().getFullYear();
  const currentAge = dob ? Math.floor((new Date() - dob) / (365.25 * 86400000)) : 40;
  const yearsToRet = Math.max(1, retAge - currentAge);

  // ─── Inflation bands ───
  const inflationKey = `ins_inflation_${personKey}`;
  const savedBands = factFind[inflationKey] || [{ rate: 5, years: yearsToRet }];
  const bands = localBands || savedBands;

  const openInflation = () => { setLocalBands(JSON.parse(JSON.stringify(savedBands))); setShowInflation(true); };
  const saveInflation = () => { updateFF(inflationKey, localBands); setShowInflation(false); setLocalBands(null); };
  const uBand = (i, f, v) => { const b = [...bands]; b[i] = { ...b[i], [f]: parseFloat(v) || 0 }; setLocalBands(b); };
  const addBand = () => setLocalBands([...bands, { rate: 5, years: 5 }]);
  const rmBand = (i) => setLocalBands(bands.filter((_, idx) => idx !== i));

  // Build inflation multiplier array for each projection year
  const getInflationMultipliers = () => {
    const multipliers = [];
    let yearIdx = 0;
    for (const band of savedBands) {
      for (let y = 0; y < band.years && yearIdx < yearsToRet; y++) {
        multipliers.push(yearIdx === 0 ? 1 : multipliers[yearIdx - 1] * (1 + band.rate / 100));
        yearIdx++;
      }
    }
    while (multipliers.length < yearsToRet) {
      const lastRate = savedBands[savedBands.length - 1]?.rate || 5;
      multipliers.push((multipliers[multipliers.length - 1] || 1) * (1 + lastRate / 100));
    }
    return multipliers;
  };

  const inflationMult = getInflationMultipliers();

  // ─── Group policies by structure ───
  const superPolicies = allPolicies.filter(p => {
    const s = (p.structure || "").toLowerCase();
    return s.includes("inside") || s.includes("smsf") || s.includes("platform");
  });
  const nonSuperPolicies = allPolicies.filter(p => {
    const s = (p.structure || "").toLowerCase();
    return !s.includes("inside") && !s.includes("smsf") && !s.includes("platform");
  });

  // ─── Build projection data ───
  const fC = (v) => "$" + Math.round(v).toLocaleString("en-AU");
  const fK = (v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`;

  const buildPolicyRows = (policy) => {
    const rows = [];
    if (policy.include_life && parseFloat(policy.life_premium)) rows.push({ label: `Life`, key: "life", base: parseFloat(policy.life_premium) });
    if (policy.include_tpd && parseFloat(policy.tpd_premium)) rows.push({ label: `TPD`, key: "tpd", base: parseFloat(policy.tpd_premium) });
    if (policy.include_trauma && parseFloat(policy.trauma_premium)) rows.push({ label: `Trauma`, key: "trauma", base: parseFloat(policy.trauma_premium) });
    if (policy.include_ip && parseFloat(policy.ip_premium)) rows.push({ label: `IP`, key: "ip", base: parseFloat(policy.ip_premium) });
    return rows;
  };

  // Project per-policy premiums
  const projectionData = [];
  for (let yr = 0; yr < yearsToRet; yr++) {
    const row = { year: currentYear + yr, age: currentAge + yr, yearLabel: `Yr ${yr + 1}`, yearShort: `${currentYear + yr}`.slice(-2) };
    let superLife = 0, superTPD = 0, superIP = 0;
    let nonSuperLife = 0, nonSuperTPD = 0, nonSuperTrauma = 0, nonSuperIP = 0;

    // Per-policy values
    allPolicies.forEach((pol, pi) => {
      const isSuper = (pol.structure || "").toLowerCase().includes("super") && !(pol.structure || "").toLowerCase().includes("non");
      if (pol.include_life) {
        const v = Math.round((parseFloat(pol.life_premium) || 0) * inflationMult[yr]);
        row[`pol_${pi}_life`] = v;
        if (isSuper) superLife += v; else nonSuperLife += v;
      }
      if (pol.include_tpd) {
        const v = Math.round((parseFloat(pol.tpd_premium) || 0) * inflationMult[yr]);
        row[`pol_${pi}_tpd`] = v;
        if (isSuper) superTPD += v; else nonSuperTPD += v;
      }
      if (pol.include_trauma) {
        const v = Math.round((parseFloat(pol.trauma_premium) || 0) * inflationMult[yr]);
        row[`pol_${pi}_trauma`] = v;
        if (isSuper) nonSuperTrauma += v; else nonSuperTrauma += v;
      }
      if (pol.include_ip) {
        const v = Math.round((parseFloat(pol.ip_premium) || 0) * inflationMult[yr]);
        row[`pol_${pi}_ip`] = v;
        if (isSuper) superIP += v; else nonSuperIP += v;
      }
    });

    row.superLife = superLife; row.superTPD = superTPD; row.superIP = superIP;
    row.superTotal = superLife + superTPD + superIP;
    row.nonSuperLife = nonSuperLife; row.nonSuperTPD = nonSuperTPD; row.nonSuperTrauma = nonSuperTrauma; row.nonSuperIP = nonSuperIP;
    row.nonSuperTotal = nonSuperLife + nonSuperTPD + nonSuperTrauma + nonSuperIP;
    row.totalPremium = row.superTotal + row.nonSuperTotal;
    projectionData.push(row);
  }

  // Year 1 summary
  const yr1 = projectionData[0] || {};
  const totalYr1 = yr1.totalPremium || 0;

  // Build structured table rows: coverage type → policies underneath
  const buildCoverageSection = (coverageLabel, coverageKey, icon, structureFilter) => {
    const matchingPolicies = allPolicies.map((pol, pi) => ({ pol, pi })).filter(({ pol }) => {
      const isSuper = (pol.structure || "").toLowerCase().includes("super") && !(pol.structure || "").toLowerCase().includes("non");
      const matchesStructure = structureFilter === "super" ? isSuper : !isSuper;
      return matchesStructure && pol[`include_${coverageKey}`] && parseFloat(pol[`${coverageKey}_premium`]);
    });
    if (matchingPolicies.length === 0) return [];
    // Total row
    const totalKey = structureFilter === "super" ? `super${coverageKey.charAt(0).toUpperCase() + coverageKey.slice(1)}` : `nonSuper${coverageKey.charAt(0).toUpperCase() + coverageKey.slice(1)}`;
    const rows = [
      { key: totalKey, label: `${icon} ${coverageLabel}`, style: "subtotal", isCollapsible: true, childKeys: matchingPolicies.map(({ pi }) => `pol_${pi}_${coverageKey}`) },
    ];
    matchingPolicies.forEach(({ pol, pi }) => {
      const envBadge = structureFilter === "super" ? "" : "";
      rows.push({
        key: `pol_${pi}_${coverageKey}`,
        label: `${pol.product_name || pol.insurer || "Policy"} — ${pol.insurer}`,
        style: "child",
        parentKey: totalKey,
      });
    });
    return rows;
  };

  const tableRows = [
    { key: "sh", label: "Inside Super", style: "section-header", icon: "🏦" },
    ...buildCoverageSection("Life", "life", "🛡️", "super"),
    ...buildCoverageSection("TPD", "tpd", "🩹", "super"),
    ...buildCoverageSection("Income Protection", "ip", "💰", "super"),
    { key: "superTotal", label: "Total Inside Super", style: "total" },
    { key: "nsh", label: "Outside Super", style: "section-header", icon: "📋" },
    ...buildCoverageSection("Life", "life", "🛡️", "nonSuper"),
    ...buildCoverageSection("TPD", "tpd", "🩹", "nonSuper"),
    ...buildCoverageSection("Trauma", "trauma", "❤️", "nonSuper"),
    ...buildCoverageSection("Income Protection", "ip", "💰", "nonSuper"),
    { key: "nonSuperTotal", label: "Total Outside Super", style: "total" },
    { key: "th", label: "Total Premium", style: "section-header", icon: "📊" },
    { key: "totalPremium", label: "Total Annual Premium", style: "highlight" },
  ];

  // No policies message
  if (allPolicies.length === 0) return (
    <div style={{ padding: "60px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 8 }}>No policies for {personName}</div>
      <div style={{ fontSize: 14, color: "var(--ps-text-subtle)" }}>Add policies in the Advice panel → Insurance → Policies tab to see premium projections.</div>
    </div>
  );

  return (
    <div>
      {/* ─── Header with inflation button ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ps-text-strongest)" }}>Premium Costs — {personName}</div>
          <div style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>Age {currentAge} → {retAge} ({yearsToRet} years) · {allPolicies.length} polic{allPolicies.length === 1 ? "y" : "ies"} ({ffCount} existing, {soaCount} recommended) · {superPolicies.length} inside super · {nonSuperPolicies.length} outside super</div>
        </div>
        <button onClick={openInflation} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--ps-border-mid)", background: "var(--ps-surface)", fontSize: 12, fontWeight: 600, color: "var(--ps-text-secondary)", cursor: "pointer" }}>⚙️ Inflation Rates</button>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div style={{ padding: "10px 16px", borderRadius: 8, background: "var(--ps-bg-amber-200)", border: "1px solid var(--ps-ring-amber)", fontSize: 13, color: "var(--ps-badge-amber)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚠️</span> Showing demo data. Add policies in Advice panel → Insurance → Policies tab for actual projections.
        </div>
      )}

      {/* ─── Inflation Modal ─── */}
      <InsModal show={showInflation} onClose={saveInflation} title="Premium Inflation Rates" wide={false}>
        <div style={{ padding: 10, borderRadius: 8, background: "var(--ps-surface-blue)", border: "1px solid var(--ps-ring-blue)", fontSize: 13, color: "#1E40AF", marginBottom: 14 }}>
          Define inflation rate bands. Each band applies its rate for the specified number of years in sequence.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 36px", gap: 10, padding: "8px 0", fontSize: 11, fontWeight: 700, color: "var(--ps-text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--ps-border)" }}>
          <div>Rate (% p.a.)</div><div>Duration (years)</div><div></div>
        </div>
        {bands.map((b, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 36px", gap: 10, padding: "10px 0", alignItems: "center", borderBottom: "1px solid var(--ps-border-light)" }}>
            <input type="number" value={b.rate} onChange={e => uBand(i, "rate", e.target.value)} placeholder="5" style={{ padding: "10px 12px", border: "1px solid var(--ps-border)", borderRadius: 8, fontSize: 14, textAlign: "center", background: "var(--ps-surface)" }} />
            <input type="number" value={b.years} onChange={e => uBand(i, "years", e.target.value)} placeholder="10" style={{ padding: "10px 12px", border: "1px solid var(--ps-border)", borderRadius: 8, fontSize: 14, textAlign: "center", background: "var(--ps-surface)" }} />
            {bands.length > 1 && <button onClick={() => rmBand(i)} style={{ border: "none", background: "var(--ps-bg-red-200)", color: "var(--ps-red)", borderRadius: 8, width: 34, height: 34, cursor: "pointer", fontWeight: 700, fontSize: 16 }}>×</button>}
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--ps-border)" }}>
          <button onClick={addBand} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--ps-border-mid)", background: "var(--ps-surface)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Add Band</button>
          <div style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>
            Total: {bands.reduce((s, b) => s + (b.years || 0), 0)} years covered
          </div>
        </div>
      </InsModal>

      {/* ─── Summary pills ─── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "Year 1 Total", value: fC(totalYr1), bg: "var(--ps-border-light)", color: "var(--ps-text-strongest)" },
          { label: "Inside Super", value: fC(yr1.superTotal || 0), bg: "var(--ps-surface-blue)", color: "var(--ps-badge-blue)" },
          { label: "Outside Super", value: fC(yr1.nonSuperTotal || 0), bg: "var(--ps-surface-green)", color: "var(--ps-badge-green)" },
          { label: "Year " + yearsToRet + " Total", value: fC(projectionData[yearsToRet - 1]?.totalPremium || 0), bg: "var(--ps-bg-amber-200)", color: "var(--ps-badge-amber)" },
        ].map(p => (
          <div key={p.label} style={{ padding: "10px 18px", borderRadius: 10, background: p.bg, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "var(--ps-text-muted)", fontWeight: 500 }}>{p.label}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: p.color, fontFamily: "'JetBrains Mono', monospace" }}>{p.value}</span>
          </div>
        ))}
      </div>

      {/* ─── Stacked area chart: Super vs Non-super ─── */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16, marginTop: 0 }}>
          Annual Premium — Super vs Non-Super
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={projectionData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="gPremSuper" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} /></linearGradient>
              <linearGradient id="gPremNonSuper" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.25} /><stop offset="95%" stopColor="#10B981" stopOpacity={0.02} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="yearShort" tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis tickFormatter={fK} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
            <Tooltip formatter={(v, n) => [fC(v), n]} contentStyle={{ background: "var(--ps-text-strongest)", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--ps-tile-dark-text)" }} labelStyle={{ color: "var(--ps-text-subtle)", marginBottom: 6, fontSize: 12 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
            <Area type="monotone" dataKey="superTotal" name="Inside Super" stackId="1" stroke="#3B82F6" strokeWidth={2} fill="url(#gPremSuper)" />
            <Area type="monotone" dataKey="nonSuperTotal" name="Outside Super" stackId="1" stroke="#10B981" strokeWidth={2} fill="url(#gPremNonSuper)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ─── Benefit breakdown chart ─── */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16, marginTop: 0 }}>
          Premium by Benefit Type
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={projectionData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barCategoryGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="yearShort" tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis tickFormatter={fK} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
            <Tooltip formatter={(v, n) => [fC(v), n]} contentStyle={{ background: "var(--ps-text-strongest)", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--ps-tile-dark-text)" }} labelStyle={{ color: "var(--ps-text-subtle)" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
            <Bar dataKey={(d) => d.superLife + d.nonSuperLife} name="Life" stackId="b" fill={INS_COLORS.life.fill} radius={[0, 0, 0, 0]} />
            <Bar dataKey={(d) => d.superTPD + d.nonSuperTPD} name="TPD" stackId="b" fill={INS_COLORS.tpd.fill} radius={[0, 0, 0, 0]} />
            <Bar dataKey="nonSuperTrauma" name="Trauma" stackId="b" fill={INS_COLORS.trauma.fill} radius={[0, 0, 0, 0]} />
            <Bar dataKey={(d) => d.superIP + d.nonSuperIP} name="IP" stackId="b" fill={INS_COLORS.ip.fill} radius={[0, 0, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ─── Policy summary cards ─── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {allPolicies.map((pol, i) => {
          const isSuper = superPolicies.includes(pol);
          const premiums = [];
          if (pol.include_life && parseFloat(pol.life_premium)) premiums.push({ label: "Life", val: parseFloat(pol.life_premium), color: INS_COLORS.life.fill });
          if (pol.include_tpd && parseFloat(pol.tpd_premium)) premiums.push({ label: "TPD", val: parseFloat(pol.tpd_premium), color: INS_COLORS.tpd.fill });
          if (pol.include_trauma && parseFloat(pol.trauma_premium)) premiums.push({ label: "Trauma", val: parseFloat(pol.trauma_premium), color: INS_COLORS.trauma.fill });
          if (pol.include_ip && parseFloat(pol.ip_premium)) premiums.push({ label: "IP", val: parseFloat(pol.ip_premium), color: INS_COLORS.ip.fill });
          const total = premiums.reduce((s, p) => s + p.val, 0);
          return (
            <div key={i} style={{ border: "1px solid var(--ps-border)", borderRadius: 10, padding: 14, minWidth: 200, flex: "1 1 200px", background: "var(--ps-surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-strongest)" }}>{pol.insurer || "Policy " + (i + 1)}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: pol.source === "factfind" ? "#F3E8FF" : "var(--ps-bg-blue-200)", color: pol.source === "factfind" ? "#7C3AED" : "var(--ps-badge-blue)" }}>{pol.source === "factfind" ? "Current" : "Recommended"}</span>
                  <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: isSuper ? "var(--ps-surface-blue)" : "var(--ps-surface-green)", color: isSuper ? "var(--ps-badge-blue)" : "var(--ps-badge-green)" }}>{isSuper ? "Super" : "Non-super"}</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--ps-text-muted)", marginBottom: 8 }}>{pol.insurance_type || "—"} · {pol.premium_type || "Stepped"} · {pol.premium_frequency || "Annual"}</div>
              {premiums.map(pr => (
                <div key={pr.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: pr.color }} />{pr.label}</span>
                  <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{fC(pr.val)}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid var(--ps-border)", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
                <span>Total</span><span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fC(total)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Data table — matching SectionTable style ─── */}
      <div style={{ overflowX: "auto", margin: "0 -4px" }}>
        <table style={{
          width: "100%", borderCollapse: "separate", borderSpacing: 0,
          fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontVariantNumeric: "tabular-nums",
        }}>
          <thead>
            <tr>
              <th style={{
                position: "sticky", left: 0, zIndex: 2,
                background: "var(--ps-surface-alt)", padding: "10px 16px",
                textAlign: "left", fontWeight: 600, color: "var(--ps-text-secondary)",
                borderBottom: "2px solid var(--ps-border)", minWidth: 260,
                fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em",
              }}>Year</th>
              {projectionData.map((d, i) => (
                <th key={i} style={{
                  padding: "10px 12px", textAlign: "right",
                  fontWeight: 600, color: "var(--ps-text-secondary)",
                  borderBottom: "2px solid var(--ps-border)",
                  fontSize: 12, background: "var(--ps-surface-alt)", whiteSpace: "nowrap",
                }}>
                  <div>{d.year}</div>
                  <div style={{ color: "var(--ps-text-subtle)", fontWeight: 400, fontSize: 11 }}>Age {d.age}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => {
              // Section header (Inside Super / Outside Super / Total Premium)
              if (row.style === "section-header") return (
                <tr key={row.key}>
                  <td colSpan={projectionData.length + 1} style={{
                    padding: "12px 16px", fontWeight: 700, fontSize: 13,
                    color: "var(--ps-text-primary)", background: "var(--ps-border-light)",
                    borderBottom: "1px solid var(--ps-border)", borderTop: "1px solid var(--ps-border)",
                    position: "sticky", left: 0, zIndex: 1,
                  }}>
                    {row.icon && <span style={{ marginRight: 8 }}>{row.icon}</span>}
                    {row.label}
                  </td>
                </tr>
              );

              // Collapsible coverage type subtotal
              if (row.style === "subtotal") {
                const isOpen = !collapsed[row.key];
                return (
                  <tr key={row.key} onClick={() => toggleSection(row.key)} style={{ cursor: "pointer" }}>
                    <td style={{
                      padding: "8px 16px", fontWeight: 600, color: "var(--ps-text-body)",
                      background: "var(--ps-surface-alt)", borderBottom: "1px solid var(--ps-border-light)",
                      position: "sticky", left: 0, zIndex: 1,
                      borderRight: "1px solid var(--ps-border-light)",
                    }}>
                      <span style={{ fontSize: 9, color: "var(--ps-text-subtle)", marginRight: 8, display: "inline-block", width: 10 }}>
                        {isOpen ? "▾" : "▸"}
                      </span>
                      {row.label}
                    </td>
                    {projectionData.map((d, di) => (
                      <td key={di} style={{
                        padding: "8px 12px", textAlign: "right",
                        fontWeight: 600, color: d[row.key] ? "var(--ps-text-body)" : "var(--ps-border-input)",
                        borderBottom: "1px solid var(--ps-border-light)", background: "var(--ps-surface-alt)",
                      }}>
                        {d[row.key] ? fC(d[row.key]) : "—"}
                      </td>
                    ))}
                  </tr>
                );
              }

              // Child policy row (hidden if parent collapsed)
              if (row.style === "child") {
                if (collapsed[row.parentKey]) return null;
                return (
                  <tr key={row.key}>
                    <td style={{
                      padding: "6px 16px 6px 44px", fontWeight: 400, color: "var(--ps-text-secondary)",
                      background: "var(--ps-surface)", borderBottom: "1px solid var(--ps-surface-alt)",
                      position: "sticky", left: 0, zIndex: 1,
                      borderRight: "1px solid var(--ps-border-light)", fontSize: 12,
                    }}>
                      {row.label}
                    </td>
                    {projectionData.map((d, di) => (
                      <td key={di} style={{
                        padding: "6px 12px", textAlign: "right",
                        fontWeight: 400, color: d[row.key] ? "var(--ps-text-secondary)" : "var(--ps-border-input)",
                        borderBottom: "1px solid var(--ps-surface-alt)", fontSize: 12,
                      }}>
                        {d[row.key] ? fC(d[row.key]) : "—"}
                      </td>
                    ))}
                  </tr>
                );
              }

              // Total row
              if (row.style === "total") return (
                <tr key={row.key}>
                  <td style={{
                    padding: "8px 16px", fontWeight: 700, color: "var(--ps-text-primary)",
                    background: "var(--ps-surface-alt)", borderBottom: "1px solid var(--ps-border)",
                    borderTop: "1px solid var(--ps-border)",
                    position: "sticky", left: 0, zIndex: 1,
                    borderRight: "1px solid var(--ps-border-light)",
                  }}>
                    {row.label}
                  </td>
                  {projectionData.map((d, di) => (
                    <td key={di} style={{
                      padding: "8px 12px", textAlign: "right",
                      fontWeight: 700, color: d[row.key] ? "var(--ps-text-primary)" : "var(--ps-border-input)",
                      borderBottom: "1px solid var(--ps-border)", borderTop: "1px solid var(--ps-border)",
                      background: "var(--ps-surface-alt)",
                    }}>
                      {d[row.key] ? fC(d[row.key]) : "—"}
                    </td>
                  ))}
                </tr>
              );

              // Highlight row (total premium)
              if (row.style === "highlight") return (
                <tr key={row.key}>
                  <td style={{
                    padding: "10px 16px", fontWeight: 700, color: "#4338ca",
                    background: "var(--ps-surface-indigo)", borderBottom: "2px solid var(--ps-ring-indigo)",
                    position: "sticky", left: 0, zIndex: 1,
                    borderRight: "1px solid var(--ps-ring-indigo)",
                  }}>
                    {row.label}
                  </td>
                  {projectionData.map((d, di) => (
                    <td key={di} style={{
                      padding: "10px 12px", textAlign: "right",
                      fontWeight: 700, color: "#4338ca",
                      borderBottom: "2px solid var(--ps-ring-indigo)", background: "var(--ps-surface-indigo)",
                    }}>
                      {fC(d[row.key])}
                    </td>
                  ))}
                </tr>
              );

              return null;
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Inflation schedule ─── */}
      <div style={{ padding: "14px 20px", background: "var(--ps-surface-alt)", borderRadius: 10, border: "1px solid var(--ps-border)", marginTop: 16, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-text-muted)" }}>Inflation schedule:</span>
        {savedBands.map((b, i) => (
          <span key={i} style={{ fontSize: 12, color: "var(--ps-text-body)" }}>
            <span style={{ fontWeight: 700 }}>{b.rate}%</span> for {b.years} yr{b.years !== 1 ? "s" : ""}
            {i < savedBands.length - 1 && <span style={{ color: "var(--ps-border-mid)", margin: "0 4px" }}>→</span>}
          </span>
        ))}
        <button onClick={openInflation} style={{ fontSize: 11, color: "#2563EB", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Edit</button>
      </div>
    </div>
  );
}


export function InsuranceProjectionPage({ clientKey }) {
  const data = INSURANCE_MOCK[clientKey] || INSURANCE_MOCK.client;
  const yr1 = data[0];
  const fK = (v) => v >= 1000000 ? `$${(v/1e6).toFixed(1)}m` : v >= 1000 ? `$${Math.round(v/1000)}k` : `$${v}`;
  const fC = (v) => `$${Math.round(v).toLocaleString("en-AU")}`;

  const pills = [
    { label: "Life", value: yr1.life, color: INS_COLORS.life },
    { label: "TPD", value: yr1.tpd, color: INS_COLORS.tpd },
    { label: "Trauma", value: yr1.trauma, color: INS_COLORS.trauma },
    { label: "IP", value: yr1.ip, color: INS_COLORS.ip, suffix: "/m" },
  ];

  const lifeZero = data.findIndex(d => d.life === 0);
  const tpdZero = data.findIndex(d => d.tpd === 0);
  const ipZero = data.findIndex(d => d.ip === 0);

  const tableRows = [
    { key: "h1", label: "Capital Needs", isHeader: true },
    { key: "mortgage", label: "Mortgage remaining", fmt: fC },
    { key: "lifeCapital", label: "Life — capital total", fmt: fC, color: INS_COLORS.life.stroke },
    { key: "tpdCapital", label: "TPD — capital total", fmt: fC, color: INS_COLORS.tpd.stroke },
    { key: "h2", label: "Income Replacement PV", isHeader: true },
    { key: "lifePV", label: "Life — income PV", fmt: fC, color: INS_COLORS.life.stroke },
    { key: "tpdPV", label: "TPD — income PV", fmt: fC, color: INS_COLORS.tpd.stroke },
    { key: "h3", label: "Adjustments", isHeader: true },
    { key: "tpdUplift", label: "TPD tax uplift", fmt: fC, color: INS_COLORS.tpd.stroke },
    { key: "lifeAssets", label: "Life — less assets", fmt: (v) => `-${fC(v)}`, neg: true },
    { key: "tpdAssets", label: "TPD — less assets", fmt: (v) => `-${fC(v)}`, neg: true },
    { key: "h4", label: "Cover Required", isHeader: true },
    { key: "life", label: "Life cover", fmt: fC, color: INS_COLORS.life.stroke, bold: true },
    { key: "tpd", label: "TPD cover", fmt: fC, color: INS_COLORS.tpd.stroke, bold: true },
    { key: "trauma", label: "Trauma cover", fmt: fC, color: INS_COLORS.trauma.stroke, bold: true },
    { key: "ip", label: "IP monthly benefit", fmt: (v) => `${fC(v)}/m`, color: INS_COLORS.ip.stroke, bold: true },
  ];

  return (
    <div>
      {/* Summary pills */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {pills.map(p => (
          <div key={p.label} style={{
            padding: "10px 18px", borderRadius: 10,
            background: `${p.color.fill}10`, border: `1px solid ${p.color.fill}22`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color.fill }} />
            <span style={{ fontSize: 12, color: "var(--ps-text-muted)", fontWeight: 500 }}>{p.label}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-strongest)", fontFamily: "'JetBrains Mono', monospace" }}>
              {fK(p.value)}{p.suffix || ""}
            </span>
          </div>
        ))}
      </div>

      {/* Lump sum chart */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16, marginTop: 0 }}>
          Lump Sum Cover Required
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <defs>
              {Object.entries(INS_COLORS).filter(([k]) => k !== "ip").map(([k, c]) => (
                <linearGradient key={k} id={`gIns${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c.fill} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={c.fill} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="yearShort" tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis tickFormatter={fK} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
            <Tooltip formatter={(v, n) => [fC(v), n]} contentStyle={{ background: "var(--ps-text-strongest)", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--ps-tile-dark-text)" }} labelStyle={{ color: "var(--ps-text-subtle)", marginBottom: 6, fontSize: 12 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
            <Area type="monotone" dataKey="life" name="Life" stroke={INS_COLORS.life.stroke} strokeWidth={2.5} fill={`url(#gInslife)`} dot={false} />
            <Area type="monotone" dataKey="tpd" name="TPD" stroke={INS_COLORS.tpd.stroke} strokeWidth={2.5} fill={`url(#gInstpd)`} dot={false} />
            <Area type="monotone" dataKey="trauma" name="Trauma" stroke={INS_COLORS.trauma.stroke} strokeWidth={2.5} fill={`url(#gInstrauma)`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* IP bar chart */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16, marginTop: 0 }}>
          Income Protection — Monthly Benefit
        </h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barCategoryGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="yearShort" tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis tickFormatter={fK} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
            <Tooltip formatter={(v) => [`${fC(v)}/month`, "IP Benefit"]} contentStyle={{ background: "var(--ps-text-strongest)", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--ps-tile-dark-text)" }} labelStyle={{ color: "var(--ps-text-subtle)" }} />
            <Bar dataKey="ip" fill={INS_COLORS.ip.fill} radius={[0,0,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Milestones */}
      <div style={{
        padding: "14px 20px", background: "var(--ps-surface-alt)", borderRadius: 10, border: "1px solid var(--ps-border)",
        display: "flex", gap: 32, marginBottom: 16,
      }}>
        {[
          { icon: "📉", label: "Life cover reaches $0", value: lifeZero > 0 ? `Year ${lifeZero + 1} (age ${data[lifeZero].age})` : "Not within projection" },
          { icon: "🛡️", label: "TPD cover reaches $0", value: tpdZero > 0 ? `Year ${tpdZero + 1} (age ${data[tpdZero].age})` : "Not within projection" },
          { icon: "🏖️", label: "IP drops to $0", value: ipZero > 0 ? `Year ${ipZero + 1} (age ${data[ipZero].age})` : "Already retired" },
        ].map((m, i) => (
          <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18 }}>{m.icon}</span>
            <div>
              <div style={{ fontSize: 11, color: "var(--ps-text-muted)", fontWeight: 500 }}>{m.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-strongest)" }}>{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Data table */}
      <div style={{ ...T.scrollWrap }}>
        <table style={{ ...T.scrollTable, width: "100%", minWidth: 900 }}>
          <thead>
            <tr style={{ background: "var(--ps-surface-alt)" }}>
              <th style={{ ...T.th, color: "var(--ps-text-secondary)", background: "var(--ps-surface-alt)", position: "sticky", left: 0, zIndex: 3, minWidth: 200, borderBottom: "2px solid var(--ps-border)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Year</th>
              {data.map((d, i) => (
                <th key={i} style={{ ...T.th, color: "var(--ps-text-secondary)", textAlign: "right", fontSize: 12, borderBottom: "2px solid var(--ps-border)", whiteSpace: "nowrap", background: "var(--ps-surface-alt)" }}>
                  <div>{d.year}</div>
                  <div style={{ color: "var(--ps-text-subtle)", fontWeight: 400, fontSize: 11 }}>Age {d.age}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => {
              if (row.isHeader) return (
                <tr key={row.key} style={{ background: "var(--ps-surface-alt)" }}>
                  <td colSpan={data.length + 1} style={{ ...T.section, position: "sticky", left: 0, background: "var(--ps-surface-alt)", zIndex: 1, cursor: "default" }}>{row.label}</td>
                </tr>
              );
              return (
                <tr key={row.key} style={{ borderBottom: "1px solid var(--ps-border-light)", background: row.bold ? "var(--ps-surface-alt)" : "var(--ps-surface)" }}>
                  <td style={{ ...T.td, fontWeight: row.bold ? 700 : 400, color: row.color || "var(--ps-text-secondary)", position: "sticky", left: 0, background: row.bold ? "var(--ps-surface-alt)" : "var(--ps-surface)", zIndex: 1, borderRight: "1px solid var(--ps-border-light)", whiteSpace: "nowrap" }}>
                    {row.bold && row.color && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: row.color, marginRight: 8, verticalAlign: "middle" }} />}
                    {row.label}
                  </td>
                  {data.map((d, di) => (
                    <td key={di} style={{ ...T.td, textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontWeight: row.bold ? 600 : 400, color: row.neg ? "var(--ps-red)" : d[row.key] === 0 ? "var(--ps-border-mid)" : row.bold ? "var(--ps-text-strongest)" : "var(--ps-text-secondary)", whiteSpace: "nowrap" }}>
                      {d[row.key] === 0 ? "—" : row.fmt(d[row.key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// WRAP / PLATFORM ACCOUNT PAGE
// ─────────────────────────────────────────────────────────────

const WRAP_MOCK = (() => {
  const startYear = 2025;
  const years = 12;
  const inflationRate = 0.025;

  function project(opts) {
    const data = [];
    let balance = opts.openingBalance;
    for (let i = 0; i < years; i++) {
      const opening = Math.round(balance);
      const contrib = Math.round(opts.regularContrib * Math.pow(1 + inflationRate, i));
      const adhocC = opts.adhocContribs?.find(a => a.year === startYear + i)?.amount || 0;
      const totalContrib = contrib + adhocC;
      const withdraw = opts.adhocWithdraws?.find(a => a.year === startYear + i)?.amount || 0;

      const midBal = opening + (totalContrib - withdraw) / 2;
      const incomeDist = Math.round(midBal * opts.incomeYield);
      const franking = Math.round(incomeDist * opts.frankingRate * (30/70));
      const capGrowth = Math.round(midBal * opts.capitalGrowth);
      const grossEarnings = incomeDist + capGrowth;

      const avgBal = Math.max(0, midBal + grossEarnings / 2);
      const platformFee = Math.round(avgBal * opts.platformFee);
      const investFee = Math.round(avgBal * opts.investFee);
      const adviserFee = Math.round(avgBal * opts.adviserFee);
      const totalFees = platformFee + investFee + adviserFee;

      const taxIncome = Math.max(0, Math.round(incomeDist * opts.taxRate - franking));
      const realisedGains = Math.round(capGrowth * opts.turnover);
      const taxCGT = Math.round(realisedGains * (1 - opts.cgtDiscount) * opts.taxRate);
      const totalTax = Math.max(0, taxIncome + taxCGT);

      const closing = Math.round(opening + totalContrib - withdraw + grossEarnings - totalFees - totalTax);

      data.push({
        year: `${startYear + i}/${(startYear + i + 1).toString().slice(-2)}`,
        yearShort: `${(startYear + i).toString().slice(-2)}/${(startYear + i + 1).toString().slice(-2)}`,
        opening, contributions: totalContrib, withdrawals: withdraw,
        incomeDist, franking, capGrowth, grossEarnings,
        platformFee, investFee, adviserFee, totalFees,
        taxIncome, taxCGT, totalTax,
        closing, netReturn: grossEarnings - totalFees - totalTax,
      });
      balance = closing;
    }
    return data;
  }

  return project({
    openingBalance: 180000,
    regularContrib: 0,
    adhocContribs: [],
    adhocWithdraws: [{ year: 2031, amount: 20000 }],
    incomeYield: 0.025, capitalGrowth: 0.04, frankingRate: 0.30,
    platformFee: 0.0033, investFee: 0.006, adviserFee: 0.0055,
    taxRate: 0.37, cgtDiscount: 0.50, turnover: 0.10,
  });
})();

const WRAP_C = {
  balance: { fill: "#6366F1", stroke: "#4F46E5" },
  earnings: { fill: "#F59E0B", stroke: "#D97706" },
  fees: { fill: "#8B5CF6", stroke: "#7C3AED" },
  tax: { fill: "#EF4444", stroke: "#DC2626" },
  net: { fill: "#06B6D4", stroke: "#0891B2" },
  contrib: { fill: "#10B981", stroke: "#059669" },
};

export function WrapProjectionPage() {
  const data = WRAP_MOCK;
  const yr1 = data[0];
  const yrL = data[data.length - 1];
  const fK = (v) => Math.abs(v) >= 1e6 ? `$${(v/1e6).toFixed(1)}m` : Math.abs(v) >= 1000 ? `$${Math.round(v/1000)}k` : `$${v}`;
  const fC = (v) => v < 0 ? `-$${Math.abs(Math.round(v)).toLocaleString("en-AU")}` : `$${Math.round(v).toLocaleString("en-AU")}`;
  const fP = (v) => `${(v * 100).toFixed(2)}%`;

  const totalFees = data.reduce((s, d) => s + d.totalFees, 0);
  const totalTax = data.reduce((s, d) => s + d.totalTax, 0);
  const totalEarnings = data.reduce((s, d) => s + d.grossEarnings, 0);

  const tableRows = [
    { key: "h1", label: "Balance", isHeader: true },
    { key: "opening", label: "Opening balance", fmt: fC },
    { key: "h2", label: "Cash Flows", isHeader: true },
    { key: "contributions", label: "Contributions", fmt: fC, color: WRAP_C.contrib.stroke },
    { key: "withdrawals", label: "Withdrawals", fmt: (v) => v === 0 ? "—" : `-${fC(v)}`, neg: true },
    { key: "h3", label: "Investment Earnings", isHeader: true },
    { key: "incomeDist", label: "Income distributions", fmt: fC },
    { key: "franking", label: "Franking credits", fmt: fC },
    { key: "capGrowth", label: "Capital growth", fmt: fC },
    { key: "grossEarnings", label: "Gross earnings", fmt: fC, color: WRAP_C.earnings.stroke, sub: true },
    { key: "h4", label: "Fees", isHeader: true },
    { key: "platformFee", label: "Platform fee", fmt: (v) => `-${fC(v)}`, neg: true },
    { key: "investFee", label: "Investment management fee", fmt: (v) => `-${fC(v)}`, neg: true },
    { key: "adviserFee", label: "Adviser service fee", fmt: (v) => `-${fC(v)}`, neg: true },
    { key: "totalFees", label: "Total fees", fmt: (v) => `-${fC(v)}`, color: WRAP_C.fees.stroke, sub: true, neg: true },
    { key: "h5", label: "Tax on Earnings", isHeader: true },
    { key: "taxIncome", label: "Tax on income distributions", fmt: (v) => v === 0 ? "—" : `-${fC(v)}`, neg: true },
    { key: "taxCGT", label: "Tax on realised gains", fmt: (v) => v === 0 ? "—" : `-${fC(v)}`, neg: true },
    { key: "totalTax", label: "Total tax", fmt: (v) => `-${fC(v)}`, color: WRAP_C.tax.stroke, sub: true, neg: true },
    { key: "h6", label: "Closing", isHeader: true },
    { key: "closing", label: "Closing balance", fmt: fC, color: WRAP_C.balance.stroke, bold: true },
    { key: "netReturn", label: "Net return", fmt: fC, color: WRAP_C.net.stroke },
  ];

  return (
    <div>
      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Opening", value: fK(yr1.opening), color: "var(--ps-text-secondary)" },
          { label: "Projected Closing", value: fK(yrL.closing), color: WRAP_C.balance.stroke },
          { label: "Total Earnings", value: fK(totalEarnings), color: WRAP_C.earnings.stroke },
          { label: "Total Fees", value: fK(totalFees), color: WRAP_C.fees.stroke },
          { label: "Total Tax", value: fK(totalTax), color: WRAP_C.tax.stroke },
        ].map((s, i) => (
          <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "var(--ps-surface-alt)", border: "none", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Fee breakdown */}
      <div style={{ padding: "12px 20px", background: "var(--ps-surface-alt)", borderRadius: 10, border: "none", display: "flex", gap: 24, alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Fees</span>
        {[
          { label: "Platform", rate: 0.0033 },
          { label: "Investment Mgmt", rate: 0.006 },
          { label: "Adviser", rate: 0.0055 },
        ].map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: ["#A78BFA","#7C3AED","#5B21B6"][i] }} />
            <span style={{ fontSize: 13, color: "var(--ps-text-secondary)" }}>{f.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono',monospace" }}>{fP(f.rate)}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: WRAP_C.fees.stroke, fontFamily: "'JetBrains Mono',monospace" }}>
          Total {fP(0.0033 + 0.006 + 0.0055)} p.a.
        </div>
      </div>

      {/* Balance chart */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16, marginTop: 0 }}>Balance Projection</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="gWrapBal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={WRAP_C.balance.fill} stopOpacity={0.2} />
                <stop offset="95%" stopColor={WRAP_C.balance.fill} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="yearShort" tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis tickFormatter={fK} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
            <Tooltip formatter={(v, n) => [fC(v), n]} contentStyle={{ background: "#1E1B4B", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--ps-tile-dark-text)" }} labelStyle={{ color: "#A5B4FC" }} />
            <Area type="monotone" dataKey="closing" name="Closing Balance" stroke={WRAP_C.balance.stroke} strokeWidth={2.5} fill="url(#gWrapBal)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Earnings vs Fees vs Tax */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16, marginTop: 0 }}>Earnings, Fees &amp; Tax</h3>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barCategoryGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="yearShort" tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis tickFormatter={fK} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
            <Tooltip formatter={(v, n) => [fC(v), n]} contentStyle={{ background: "#1E1B4B", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--ps-tile-dark-text)" }} labelStyle={{ color: "#A5B4FC" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar dataKey="grossEarnings" name="Gross Earnings" fill={WRAP_C.earnings.fill} radius={[3,3,0,0]} maxBarSize={18} opacity={0.8} />
            <Bar dataKey="totalFees" name="Fees" fill={WRAP_C.fees.fill} radius={[3,3,0,0]} maxBarSize={18} opacity={0.8} />
            <Bar dataKey="totalTax" name="Tax" fill={WRAP_C.tax.fill} radius={[3,3,0,0]} maxBarSize={18} opacity={0.8} />
            <Line type="monotone" dataKey="netReturn" name="Net Return" stroke={WRAP_C.net.stroke} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Data table */}
      <div style={{ ...T.scrollWrap }}>
        <table style={{ ...T.scrollTable, width: "100%", minWidth: 900 }}>
          <thead>
            <tr style={{ background: "var(--ps-surface-alt)" }}>
              <th style={{ ...T.th, color: "var(--ps-text-secondary)", background: "var(--ps-surface-alt)", position: "sticky", left: 0, zIndex: 3, minWidth: 240, borderBottom: "2px solid var(--ps-border)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Year</th>
              {data.map((d, i) => (
                <th key={i} style={{ ...T.th, color: "var(--ps-text-secondary)", textAlign: "right", fontSize: 12, borderBottom: "2px solid var(--ps-border)", whiteSpace: "nowrap", background: "var(--ps-surface-alt)" }}>
                  {d.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => {
              if (row.isHeader) return (
                <tr key={row.key} style={{ background: "var(--ps-surface-alt)" }}>
                  <td colSpan={data.length + 1} style={{ ...T.section, position: "sticky", left: 0, background: "var(--ps-surface-alt)", zIndex: 1, cursor: "default" }}>{row.label}</td>
                </tr>
              );
              return (
                <tr key={row.key} style={{ borderBottom: "1px solid var(--ps-border-light)", background: row.bold ? "var(--ps-surface-purple)" : "var(--ps-surface)" }}>
                  <td style={{ ...T.td, fontWeight: row.bold ? 700 : row.sub ? 600 : 400, color: row.color || "var(--ps-text-secondary)", position: "sticky", left: 0, background: row.bold ? "var(--ps-surface-purple)" : "var(--ps-surface)", zIndex: 1, borderRight: "1px solid var(--ps-border-light)", whiteSpace: "nowrap" }}>
                    {(row.bold || row.sub) && row.color && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: row.color, marginRight: 8, verticalAlign: "middle" }} />}
                    {row.label}
                  </td>
                  {data.map((d, di) => (
                    <td key={di} style={{ ...T.td, textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontWeight: row.bold ? 600 : row.sub ? 500 : 400, color: row.neg ? "var(--ps-red)" : d[row.key] === 0 ? "var(--ps-border-mid)" : row.bold ? "var(--ps-text-strongest)" : "var(--ps-text-secondary)", whiteSpace: "nowrap" }}>
                      {d[row.key] === 0 && !row.bold ? "—" : row.fmt(d[row.key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// POTENTIAL DEATH TAX PAGE
// ─────────────────────────────────────────────────────────────

const DEATH_TAX_DATA = (() => {
  const startYear = 2025;
  const years = 12;

  // Super balances (from SUPER1_DATA end values)
  const super1EndFV = [20026,42556,66317,91396,117851,147547,545662,575673,607335,640738,675979,713158];
  // Super 2 — Paul Andrew (estimate growth from 250k)
  const super2EndFV = Array.from({length: years}, (_,i) => Math.round(250000 * Math.pow(1.06, i+1)));

  // Pension balances
  const pension1EndFV = [0,0,0,0,0,0,181944,184173,186429,188713,86332,0];

  // Bond
  const bond1EndFV = Array.from({length: years}, (_,i) => Math.round(150000 * Math.pow(1.0605, i+1)));

  // Wrap
  const wrap1EndFV = Array.from({length: years}, (_,i) => Math.round(180000 * Math.pow(1.055, i+1)));

  // Tax-free percentages
  const super1TaxFree = [0,0,0,0,0,0,0.715,0.678,0.642,0.609,0.577,0.547]; // NCC portion
  const super2TaxFree = [0,0,0,0,0,0,0,0,0,0,0,0]; // No NCC
  const pension1TaxFree = [0,0,0,0,0,0,0.50,0.50,0.50,0.50,0.50,0]; // 50% tax-free

  // Death tax rate on taxable component to non-dependant
  const taxRate = 0.17; // 15% + 2% Medicare levy

  // Assets
  const homeValue = Array.from({length: years}, (_,i) => Math.round(1200000 * Math.pow(1.04, i)));
  const investProp = Array.from({length: years}, (_,i) => Math.round(650000 * Math.pow(1.04, i)));
  const shares = Array.from({length: years}, (_,i) => Math.round(80000 * Math.pow(1.055, i)));
  const bankAccounts = Array.from({length: years}, (_,i) => Math.round(45000 * Math.pow(1.02, i)));
  const vehicles = Array.from({length: years}, (_,i) => Math.round(35000 * Math.pow(0.95, i)));
  const contents = Array.from({length: years}, () => 20000);

  // CGT on investment property (assume cost base 450k, 50% discount)
  const investPropCGT = investProp.map((v, i) => {
    const gain = v - 450000;
    return gain > 0 ? Math.round(gain * 0.5 * 0.37) : 0; // 50% discount, marginal rate
  });

  // CGT on shares
  const sharesCGT = shares.map((v, i) => {
    const gain = v - 60000; // cost base
    return gain > 0 ? Math.round(gain * 0.5 * 0.37) : 0;
  });

  // Debts
  const homeLoan = Array.from({length: years}, (_,i) => Math.round(Math.max(0, 380000 - (i * 18000))));
  const investLoan = Array.from({length: years}, (_,i) => Math.round(Math.max(0, 280000 - (i * 14000))));
  const creditCard = Array.from({length: years}, () => 5000);

  return Array.from({length: years}, (_,i) => {
    const yr = `${startYear + i}/${(startYear + i + 1).toString().slice(-2)}`;
    const yrShort = yr.slice(2);

    // Super death tax = taxable component × 17%
    const s1Taxable = super1EndFV[i] * (1 - super1TaxFree[i]);
    const s1Tax = Math.round(s1Taxable * taxRate);
    const s2Taxable = super2EndFV[i] * (1 - super2TaxFree[i]);
    const s2Tax = Math.round(s2Taxable * taxRate);

    // Pension death tax
    const p1Taxable = pension1EndFV[i] * (1 - pension1TaxFree[i]);
    const p1Tax = Math.round(p1Taxable * taxRate);

    // Total super section
    const superTotal = super1EndFV[i] + super2EndFV[i] + pension1EndFV[i];
    const superTaxTotal = s1Tax + s2Tax + p1Tax;
    const superNet = superTotal - superTaxTotal;

    // Assets
    const totalAssets = homeValue[i] + investProp[i] + shares[i] + bankAccounts[i] + vehicles[i] + contents[i] + bond1EndFV[i] + wrap1EndFV[i];
    const totalAssetTax = investPropCGT[i] + sharesCGT[i];
    const assetsNet = totalAssets - totalAssetTax;

    // Debts
    const totalDebts = homeLoan[i] + investLoan[i] + creditCard[i];

    // Estate
    const estateValue = superNet + assetsNet - totalDebts;

    return {
      year: yr, yearShort: yrShort,
      // Super
      super1: super1EndFV[i], super1Tax: s1Tax,
      super2: super2EndFV[i], super2Tax: s2Tax,
      // Pension
      pension1: pension1EndFV[i], pension1Tax: p1Tax,
      // Super totals
      superTotal, superTaxTotal, superNet,
      // Assets
      home: homeValue[i], investProp: investProp[i], investPropCGT: investPropCGT[i],
      shares: shares[i], sharesCGT: sharesCGT[i],
      bank: bankAccounts[i], vehicles: vehicles[i], contents: contents[i],
      bond: bond1EndFV[i], wrap: wrap1EndFV[i],
      totalAssets, totalAssetTax, assetsNet,
      // Debts
      homeLoan: homeLoan[i], investLoan: investLoan[i], creditCard: creditCard[i],
      totalDebts,
      // Estate
      estateValue,
      debtsNeg: -totalDebts,
    };
  });
})();

export function PotentialDeathTaxPage() {
  const data = DEATH_TAX_DATA;
  const fK = (v) => Math.abs(v) >= 1e6 ? `$${(v/1e6).toFixed(1)}m` : Math.abs(v) >= 1000 ? `$${Math.round(v/1000)}k` : `$${v}`;
  const fC = (v) => v < 0 ? `-$${Math.abs(Math.round(v)).toLocaleString("en-AU")}` : `$${Math.round(v).toLocaleString("en-AU")}`;

  const sections = [
    {
      id: "super", title: "Superannuation", icon: "🏦",
      rows: [
        { key: "super1", label: "Super 1 — Catherine", fmt: fC },
        { key: "super1Tax", label: "Death tax (17% taxable component)", fmt: (v) => v === 0 ? "—" : `-${fC(v)}`, neg: true },
        { key: "super2", label: "Super 2 — Paul Andrew", fmt: fC },
        { key: "super2Tax", label: "Death tax (17% taxable component)", fmt: (v) => v === 0 ? "—" : `-${fC(v)}`, neg: true },
      ],
      subtotal: { key: "superNet", label: "Superannuation — net to estate", color: "#4F46E5" },
    },
    {
      id: "pension", title: "Pension", icon: "📋",
      rows: [
        { key: "pension1", label: "Pension 1 — Catherine", fmt: fC },
        { key: "pension1Tax", label: "Death tax (17% taxable component)", fmt: (v) => v === 0 ? "—" : `-${fC(v)}`, neg: true },
      ],
      subtotal: { key: "superNet", label: "Pension — net to estate", color: "#4F46E5",
        custom: (d) => d.pension1 - d.pension1Tax },
    },
    {
      id: "assets", title: "Assets", icon: "🏠",
      rows: [
        { key: "home", label: "Principal Residence", fmt: fC },
        { key: "investProp", label: "Investment Property", fmt: fC },
        { key: "investPropCGT", label: "CGT on investment property", fmt: (v) => v === 0 ? "—" : `-${fC(v)}`, neg: true },
        { key: "shares", label: "Shares / Managed Funds", fmt: fC },
        { key: "sharesCGT", label: "CGT on shares", fmt: (v) => v === 0 ? "—" : `-${fC(v)}`, neg: true },
        { key: "bank", label: "Bank Accounts / TDs", fmt: fC },
        { key: "bond", label: "Investment Bond", fmt: fC },
        { key: "wrap", label: "Wrap — Macquarie", fmt: fC },
        { key: "vehicles", label: "Motor Vehicles", fmt: fC },
        { key: "contents", label: "Home & Contents", fmt: fC },
      ],
      subtotal: { key: "assetsNet", label: "Assets — net to estate", color: "var(--ps-green)" },
    },
    {
      id: "debts", title: "Debts", icon: "💳",
      rows: [
        { key: "homeLoan", label: "Home Loan", fmt: (v) => v === 0 ? "—" : `-${fC(v)}`, neg: true },
        { key: "investLoan", label: "Investment Loan", fmt: (v) => v === 0 ? "—" : `-${fC(v)}`, neg: true },
        { key: "creditCard", label: "Credit Card", fmt: (v) => v === 0 ? "—" : `-${fC(v)}`, neg: true },
      ],
      subtotal: { key: "totalDebts", label: "Total debts", color: "var(--ps-red)",
        custom: (d) => -d.totalDebts },
    },
  ];

  // KPIs from year 1 and last year
  const yr1 = data[0];
  const yrL = data[data.length - 1];

  return (
    <div>
      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Estate Value (Yr 1)", value: fK(yr1.estateValue), color: "#4F46E5" },
          { label: "Estate Value (Final)", value: fK(yrL.estateValue), color: "var(--ps-green)" },
          { label: "Total Death Tax (Yr 1)", value: fK(yr1.superTaxTotal + yr1.totalAssetTax), color: "var(--ps-red)" },
          { label: "Total Death Tax (Final)", value: fK(yrL.superTaxTotal + yrL.totalAssetTax), color: "var(--ps-red)" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "var(--ps-surface)", border: "1px solid var(--ps-border)", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Estate chart */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16, marginTop: 0 }}>
          Estate Value Composition
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barCategoryGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="yearShort" tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis tickFormatter={fK} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
            <Tooltip formatter={(v, n) => [fC(Math.abs(v)), n]} contentStyle={{ background: "var(--ps-text-strongest)", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--ps-tile-dark-text)" }} labelStyle={{ color: "var(--ps-text-subtle)", marginBottom: 6, fontSize: 12 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar dataKey="superNet" name="Super/Pension (net)" stackId="estate" fill="#6366F1" />
            <Bar dataKey="assetsNet" name="Assets (net)" stackId="estate" fill="#10B981" />
            <Bar dataKey="debtsNeg" name="Debts" stackId="estate" fill="#F43F5E" />
            <Line type="monotone" dataKey="estateValue" name="Net Estate" stroke="var(--ps-text-strongest)" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Data table */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", overflowX: "auto", overflowY: "visible" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif", minWidth: 900 }}>
          <thead>
            <tr style={{ background: "var(--ps-surface-alt)" }}>
              <th style={{ padding: "12px 16px", color: "var(--ps-text-secondary)", fontWeight: 600, fontSize: 12, textAlign: "left", position: "sticky", left: 0, background: "var(--ps-surface-alt)", zIndex: 3, minWidth: 260, borderBottom: "2px solid var(--ps-border)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Year</th>
              {data.map((d, i) => (
                <th key={i} style={{ padding: "12px 10px", color: "var(--ps-text-secondary)", fontWeight: 600, fontSize: 12, textAlign: "right", borderBottom: "2px solid var(--ps-border)", whiteSpace: "nowrap", background: "var(--ps-surface-alt)" }}>
                  {d.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((sec) => (
              <React.Fragment key={sec.id}>
                {/* Section header */}
                <tr key={sec.id} style={{ background: "var(--ps-border-light)" }}>
                  <td colSpan={data.length + 1} style={{
                    padding: "10px 16px", fontWeight: 700, fontSize: 13, color: "var(--ps-text-primary)",
                    textTransform: "uppercase", letterSpacing: "0.02em",
                    position: "sticky", left: 0, background: "var(--ps-border-light)", zIndex: 1,
                  }}>
                    <span style={{ marginRight: 8 }}>{sec.icon}</span>{sec.title}
                  </td>
                </tr>

                {/* Rows */}
                {sec.rows.map((row) => (
                  <tr key={`${sec.id}-${row.key}`} style={{ borderBottom: "1px solid var(--ps-border-light)" }}>
                    <td style={{
                      padding: "9px 16px 9px 32px", fontSize: 13, color: row.neg ? "var(--ps-text-subtle)" : "var(--ps-text-secondary)",
                      fontWeight: 400, position: "sticky", left: 0, background: "var(--ps-surface)", zIndex: 1,
                      borderRight: "1px solid var(--ps-border-light)", whiteSpace: "nowrap",
                    }}>
                      {row.label}
                    </td>
                    {data.map((d, di) => (
                      <td key={di} style={{
                        padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 12, color: row.neg ? "var(--ps-red)" : "var(--ps-text-secondary)", whiteSpace: "nowrap",
                      }}>
                        {d[row.key] === 0 ? "—" : row.fmt(d[row.key])}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Subtotal */}
                <tr key={`${sec.id}-sub`} style={{ borderBottom: "2px solid var(--ps-border)", background: "var(--ps-surface-alt)" }}>
                  <td style={{
                    padding: "10px 16px", fontSize: 13, fontWeight: 700, color: sec.subtotal.color,
                    position: "sticky", left: 0, background: "var(--ps-surface-alt)", zIndex: 1,
                    borderRight: "1px solid var(--ps-border-light)", whiteSpace: "nowrap",
                  }}>
                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: sec.subtotal.color, marginRight: 8, verticalAlign: "middle" }} />
                    {sec.subtotal.label}
                  </td>
                  {data.map((d, di) => {
                    const val = sec.subtotal.custom ? sec.subtotal.custom(d) : d[sec.subtotal.key];
                    return (
                      <td key={di} style={{
                        padding: "10px 10px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 12, fontWeight: 700, color: sec.subtotal.color, whiteSpace: "nowrap",
                      }}>
                        {fC(val)}
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            ))}

            {/* ESTATE TOTAL */}
            <tr style={{ background: "var(--ps-surface-purple)", borderTop: "3px solid #4F46E5" }}>
              <td style={{
                padding: "14px 16px", fontSize: 14, fontWeight: 800, color: "#1E1B4B",
                position: "sticky", left: 0, background: "var(--ps-surface-purple)", zIndex: 1,
                borderRight: "1px solid var(--ps-border)", textTransform: "uppercase", letterSpacing: "0.03em",
              }}>
                Net Estate Value
              </td>
              {data.map((d, di) => (
                <td key={di} style={{
                  padding: "14px 10px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 14, fontWeight: 800, color: "#1E1B4B", whiteSpace: "nowrap",
                }}>
                  {fC(d.estateValue)}
                </td>
              ))}
            </tr>

            {/* Tax paid by estate total */}
            <tr style={{ background: "var(--ps-surface-red)" }}>
              <td style={{
                padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "var(--ps-red)",
                position: "sticky", left: 0, background: "var(--ps-surface-red)", zIndex: 1,
                borderRight: "1px solid var(--ps-border-light)",
              }}>
                Total Tax Paid by Estate
              </td>
              {data.map((d, di) => (
                <td key={di} style={{
                  padding: "12px 10px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 12, fontWeight: 700, color: "var(--ps-red)", whiteSpace: "nowrap",
                }}>
                  {fC(d.superTaxTotal + d.totalAssetTax)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ─── Assumptions Panel (inside Advice sidebar) ───
export function AssumptionsPanel({ factFind, updateFF }) {
  const [activeTab, setActiveTab] = useState("returns-asset-type");

  const tabs = [
    { id: "basic", icon: "⚙️", label: "Basic" },
    { id: "returns-entity", icon: "🏢", label: "Returns (Entity)" },
    { id: "returns-asset-type", icon: "📐", label: "Returns (Asset Type)" },
    { id: "returns-asset", icon: "📊", label: "Returns (Asset)" },
    { id: "interest-rates", icon: "💹", label: "Interest Rates" },
    { id: "advice-fees", icon: "🏷️", label: "Advice Fees" },
  ];

  const tabStyle = (isActive) => ({
    padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: isActive ? 600 : 500,
    cursor: "pointer", border: "none", whiteSpace: "nowrap",
    background: isActive ? "rgba(79,70,229,0.1)" : "transparent",
    color: isActive ? "#4F46E5" : "var(--ps-text-muted)",
    display: "inline-flex", alignItems: "center", gap: 6,
    transition: "all 0.15s",
  });

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap", borderBottom: "1px solid var(--ps-border)", paddingBottom: 12 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(activeTab === t.id)}>
            <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {activeTab === "returns-asset-type" ? (
        <AssetAssumptionsPage
          assumptions={factFind.assetAssumptions || {}}
          onUpdate={(updated) => updateFF("assetAssumptions", updated)}
        />
      ) : activeTab === "basic" ? (
        <BasicAssumptionsForm factFind={factFind} updateFF={updateFF} />
      ) : activeTab === "returns-asset" ? (
        <AssetOverridesPage factFind={factFind} updateFF={updateFF} />
      ) : (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ps-text-subtle)" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>
            {tabs.find(t => t.id === activeTab)?.icon}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 6 }}>
            {tabs.find(t => t.id === activeTab)?.label}
          </div>
          <div style={{ fontSize: 12, color: "var(--ps-text-subtle)" }}>
            Configuration coming soon
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Basic Assumptions Form ───
export function BasicAssumptionsForm({ factFind, updateFF }) {
  const config = factFind.cashflowConfig || {};
  const basic = factFind.basicAssumptions || {};

  const updateBasic = (field, value) => {
    updateFF("basicAssumptions", { ...basic, [field]: value });
  };

  const fieldStyle = {
    padding: "10px 12px", border: "1px solid var(--ps-border)", borderRadius: 8,
    fontSize: 14, background: "var(--ps-surface)", color: "var(--ps-text-body)", width: "100%",
  };
  const labelStyle = { fontSize: 13, fontWeight: 500, color: "var(--ps-text-secondary)", marginBottom: 6, display: "block" };

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 16 }}>Basic Assumptions</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <label style={labelStyle}>Strategy start date</label>
          <input type="date" value={basic.startDate || ""} onChange={e => updateBasic("startDate", e.target.value)} style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>Inflation rate (%)</label>
          <input type="number" step="0.1" value={basic.inflationRate ?? 2.5} onChange={e => updateBasic("inflationRate", parseFloat(e.target.value) || 0)} style={fieldStyle} />
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-body)", marginBottom: 12 }}>How long to run model for?</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {[
          { value: "life_expectancy", label: "Life expectancy + buffer" },
          { value: "specify_age", label: "Specify age" },
          { value: "specify_years", label: "Specify timeframe (years)" },
        ].map(opt => (
          <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ps-text-secondary)", cursor: "pointer" }}>
            <input
              type="radio"
              name="runMode"
              checked={(basic.runMode || "life_expectancy") === opt.value}
              onChange={() => updateBasic("runMode", opt.value)}
              style={{ accentColor: "#4F46E5" }}
            />
            {opt.label}
          </label>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <label style={labelStyle}>Run until age</label>
          <input type="number" value={basic.runUntilAge ?? 100} onChange={e => updateBasic("runUntilAge", parseInt(e.target.value) || 100)} style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>Life expectancy buffer (yrs)</label>
          <input type="number" value={basic.lifeBuffer ?? 5} onChange={e => updateBasic("lifeBuffer", parseInt(e.target.value) || 5)} style={fieldStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Years to run model</label>
        <input type="number" value={basic.yearsToRun ?? ""} onChange={e => updateBasic("yearsToRun", parseInt(e.target.value) || "")} style={fieldStyle} placeholder="Calculated from above" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        {[
          { field: "applyDesiredIncome", label: "Apply desired income in retirement" },
          { field: "stopExpensesAtRetirement", label: "Stop expenses at retirement" },
          { field: "turnOffCentrelink", label: "Turn Centrelink calculations off" },
        ].map(opt => (
          <label key={opt.field} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ps-text-secondary)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={!!basic[opt.field]}
              onChange={e => updateBasic(opt.field, e.target.checked)}
              style={{ accentColor: "#4F46E5", width: 16, height: 16 }}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Returns (Asset) — per-asset overrides of the generic type defaults ───
export function AssetOverridesPage({ factFind, updateFF }) {
  const assets = factFind.assets || [];
  const overrides = factFind.assetOverrides || {};
  const typeDefaults = factFind.assetAssumptions || {};
  const assetTypeMap = { "1": "Principal Residence", "19": "Principal Residence (Absent)", "18": "Investment Property", "21": "Commercial Property", "20": "Holiday Home", "2": "Car", "8": "Savings Account", "9": "Term Deposits", "12": "Australian Shares", "13": "International Shares", "26": "Managed Funds", "10": "Bonds — Australian", "11": "Bonds — International", "7": "Lifestyle Other", "42": "Investment Other", "50": "Receivables", "51": "Inventory", "52": "Plant & Equipment", "53": "Goodwill", "54": "Intellectual Property", "55": "Related Party Loan", "56": "Work in Progress" };

  const handleChange = (idx, field, value) => {
    const numVal = parseFloat(value);
    const updated = { ...overrides };
    if (!updated[idx]) updated[idx] = {};
    if (value === "" || value === null) {
      delete updated[idx][field];
      if (Object.keys(updated[idx]).length === 0) delete updated[idx];
    } else {
      updated[idx][field] = isNaN(numVal) ? 0 : numVal;
    }
    updateFF("assetOverrides", updated);
  };

  const clearOverride = (idx) => {
    const updated = { ...overrides };
    delete updated[idx];
    updateFF("assetOverrides", updated);
  };

  const inputStyle = (isOverridden) => ({
    width: 72, padding: "5px 6px", borderRadius: 6,
    border: `1px solid ${isOverridden ? "#818cf8" : "var(--ps-border)"}`,
    fontSize: 12, textAlign: "right",
    fontFamily: "'JetBrains Mono', monospace",
    background: isOverridden ? "rgba(99,102,241,0.06)" : "var(--ps-surface)",
    color: isOverridden ? "#4F46E5" : "var(--ps-text-subtle)",
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>Per-Asset Return Overrides</div>
        <div style={{ fontSize: 12, color: "var(--ps-text-muted)", lineHeight: 1.5 }}>
          Override the generic asset type defaults for specific holdings. Leave blank to use the default from <strong>Returns (Asset Type)</strong>. Overridden values shown in purple.
        </div>
      </div>

      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--ps-surface-alt)" }}>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: "var(--ps-text-secondary)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", minWidth: 200 }}>Asset</th>
              <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 600, color: "var(--ps-text-secondary)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", width: 100 }}>Growth</th>
              <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 600, color: "var(--ps-text-secondary)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", width: 100 }}>Yield</th>
              <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 600, color: "var(--ps-text-secondary)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", width: 100 }}>Franking</th>
              <th style={{ padding: "10px 8px", borderBottom: "2px solid var(--ps-border)", width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a, idx) => {
              const typeDef = typeDefaults[a.a_type] || {};
              const ov = overrides[idx] || {};
              const hasOverride = Object.keys(ov).length > 0;
              const typeName = assetTypeMap[a.a_type] || "Other";

              return (
                <tr key={idx} style={{ borderBottom: "1px solid var(--ps-border-light)" }}>
                  <td style={{ padding: "8px 16px" }}>
                    <div style={{ fontWeight: 500, color: "var(--ps-text-body)", fontSize: 13 }}>{a.a_name || `Asset ${idx + 1}`}</div>
                    <div style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>{typeName} — defaults: {typeDef.growthRate ?? 0}% / {typeDef.incomeYield ?? 0}% / {typeDef.frankingPct ?? typeDef.frankingCredit ?? 0}% franked</div>
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <input type="number" step="0.1" value={ov.growthRate ?? ""} placeholder={`${typeDef.growthRate ?? 0}`}
                        onChange={e => handleChange(idx, "growthRate", e.target.value)} style={inputStyle(ov.growthRate != null)} />
                      <span style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>%</span>
                    </div>
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <input type="number" step="0.1" value={ov.incomeYield ?? ""} placeholder={`${typeDef.incomeYield ?? 0}`}
                        onChange={e => handleChange(idx, "incomeYield", e.target.value)} style={inputStyle(ov.incomeYield != null)} />
                      <span style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>%</span>
                    </div>
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <input type="number" step="1" value={ov.frankingCredit ?? ""} placeholder={`${typeDef.frankingCredit ?? 0}`}
                        onChange={e => handleChange(idx, "frankingCredit", e.target.value)} style={inputStyle(ov.frankingCredit != null)} />
                      <span style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>%</span>
                    </div>
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    {hasOverride && (
                      <button onClick={() => clearOverride(idx)}
                        style={{ border: "none", background: "none", cursor: "pointer", fontSize: 14, color: "var(--ps-red)", padding: 4 }}
                        title="Clear overrides (use type defaults)">✕</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Returns (Asset Type) — generic defaults per asset class ───
export function AssetAssumptionsPage({ assumptions, onUpdate }) {
  const typeOrder = ["1", "18", "21", "2", "7", "8", "9", "10", "11", "12", "13", "26", "42"];
  const categoryMap = {
    "1": "Property", "18": "Property", "21": "Property",
    "8": "Defensive", "9": "Defensive", "10": "Defensive", "11": "Defensive",
    "12": "Growth", "13": "Growth", "26": "Growth", "42": "Growth",
    "2": "Lifestyle", "7": "Lifestyle",
  };
  const categoryColors = {
    "Property": { bg: "rgba(5,150,105,0.06)", color: "var(--ps-green)", border: "rgba(5,150,105,0.15)" },
    "Defensive": { bg: "rgba(3,105,161,0.06)", color: "#0369A1", border: "rgba(3,105,161,0.15)" },
    "Growth": { bg: "rgba(79,70,229,0.06)", color: "#4F46E5", border: "rgba(79,70,229,0.15)" },
    "Lifestyle": { bg: "rgba(217,119,6,0.06)", color: "#D97706", border: "rgba(217,119,6,0.15)" },
  };

  const handleChange = (typeCode, field, value) => {
    const numVal = parseFloat(value);
    if (isNaN(numVal) && value !== "" && value !== "-") return;
    const updated = { ...assumptions };
    updated[typeCode] = { ...updated[typeCode], [field]: value === "" ? 0 : numVal };
    onUpdate(updated);
  };

  const inputStyle = {
    width: 80, padding: "6px 8px", borderRadius: 6,
    border: "1px solid var(--ps-border)", fontSize: 13, textAlign: "right",
    fontFamily: "'JetBrains Mono', monospace", background: "var(--ps-surface)", color: "var(--ps-text-body)",
  };

  let lastCategory = "";

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>Asset Class Assumptions</div>
        <div style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>
          Configure growth rates, income yields, and franking credits for each asset type. These assumptions drive all projection calculations.
        </div>
      </div>

      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr style={{ background: "var(--ps-surface-alt)" }}>
              <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--ps-text-secondary)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", minWidth: 220 }}>
                Asset Type
              </th>
              <th style={{ textAlign: "center", padding: "12px 16px", fontWeight: 600, color: "var(--ps-text-secondary)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", width: 120 }}>
                Growth Rate
              </th>
              <th style={{ textAlign: "center", padding: "12px 16px", fontWeight: 600, color: "var(--ps-text-secondary)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", width: 120 }}>
                Income Yield
              </th>
              <th style={{ textAlign: "center", padding: "12px 16px", fontWeight: 600, color: "var(--ps-text-secondary)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", width: 120 }}>
                Franking Credit
              </th>
            </tr>
          </thead>
          <tbody>
            {typeOrder.map(code => {
              const a = assumptions[code];
              if (!a) return null;
              const cat = categoryMap[code] || "Other";
              const catStyle = categoryColors[cat] || { bg: "var(--ps-surface-alt)", color: "var(--ps-text-muted)", border: "var(--ps-border)" };
              const showCategoryHeader = cat !== lastCategory;
              lastCategory = cat;
              return (
                <React.Fragment key={code}>
                  {showCategoryHeader && (
                    <tr>
                      <td colSpan={4} style={{
                        padding: "10px 16px 6px", fontWeight: 700, fontSize: 12,
                        color: catStyle.color, background: catStyle.bg,
                        borderBottom: `1px solid ${catStyle.border}`,
                        textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>
                        {cat}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: "1px solid var(--ps-border-light)" }}>
                    <td style={{ padding: "10px 16px 10px 32px", color: "var(--ps-text-body)", fontWeight: 500 }}>
                      {a.label}
                    </td>
                    <td style={{ padding: "8px 16px", textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <input
                          type="number"
                          step="0.1"
                          value={a.growthRate}
                          onChange={e => handleChange(code, "growthRate", e.target.value)}
                          style={{
                            ...inputStyle,
                            color: a.growthRate < 0 ? "var(--ps-red)" : a.growthRate > 0 ? "var(--ps-green)" : "var(--ps-text-body)",
                          }}
                        />
                        <span style={{ fontSize: 12, color: "var(--ps-text-subtle)" }}>%</span>
                      </div>
                    </td>
                    <td style={{ padding: "8px 16px", textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <input
                          type="number"
                          step="0.1"
                          value={a.incomeYield}
                          onChange={e => handleChange(code, "incomeYield", e.target.value)}
                          style={inputStyle}
                        />
                        <span style={{ fontSize: 12, color: "var(--ps-text-subtle)" }}>%</span>
                      </div>
                    </td>
                    <td style={{ padding: "8px 16px", textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <input
                          type="number"
                          step="1"
                          value={a.frankingCredit}
                          onChange={e => handleChange(code, "frankingCredit", e.target.value)}
                          style={{
                            ...inputStyle,
                            color: a.frankingCredit > 0 ? "#4F46E5" : "var(--ps-text-body)",
                          }}
                        />
                        <span style={{ fontSize: 12, color: "var(--ps-text-subtle)" }}>%</span>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(99,102,241,0.04)", borderRadius: 10, border: "1px solid rgba(99,102,241,0.1)" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#4F46E5", marginBottom: 4 }}>How these are used</div>
        <div style={{ fontSize: 12, color: "var(--ps-text-muted)", lineHeight: 1.6 }}>
          <strong>Growth Rate</strong> — applied as annual capital appreciation (or depreciation for negative values) to project asset values forward.
          <strong style={{ marginLeft: 12 }}>Income Yield</strong> — annual income generated as a % of asset value (rent, interest, dividends, distributions).
          <strong style={{ marginLeft: 12 }}>Franking Credit</strong> — % of income that carries franking credits, reducing tax payable. Primarily applies to Australian equities.
        </div>
      </div>
    </div>
  );
}

// ─── SOA Document Builder ───
export function SOADocumentBuilder({ factFind = {}, engineData = {}, summaryMeta, ssData, strategies = [], projYears, superProj, c1Display = "Client 1", c2Display = "Client 2", navigateTo }) {
  const [expandedSections, setExpandedSections] = useState({ "welcome": true, "exec-summary": true, "circumstances": true, "strategies": true });
  const [editingSection, setEditingSection] = useState(null);
  const [sectionContent, setSectionContent] = useState({});
  const [aiGenerating, setAiGenerating] = useState(null);
  const [sectionStatus, setSectionStatus] = useState({});
  const [sectionPrompts, setSectionPrompts] = useState({});

  // Client data helpers
  const c1 = factFind.client1 || {};
  const c2 = factFind.client2 || {};
  const hasPartner = !!c2.first_name;
  const c1Name = `${c1.first_name || "Client"} ${c1.last_name || ""}`.trim();
  const c2Name = hasPartner ? `${c2.first_name || ""} ${c2.last_name || ""}`.trim() : "";
  const clientNames = hasPartner ? `${c1Name} & ${c2Name}` : c1Name;
  const assets = factFind.assets || [];
  const liabilities = factFind.liabilities || [];
  const scope = factFind.advice_request?.scope || {};
  const income = factFind.income || {};
  const expenses = factFind.expenses || {};

  // Financial calculations
  const totalAssets = assets.reduce((s, a) => s + (parseFloat(a.a_value) || 0), 0);
  const totalLiabilities = liabilities.reduce((s, d) => s + (parseFloat(d.d_balance) || 0), 0);
  const netPosition = totalAssets - totalLiabilities;
  const c1Salary = parseFloat(income.client1?.i_gross) || 0;
  const c2Salary = parseFloat(income.client2?.i_gross) || 0;
  const superFunds = engineData.superannuation || [];
  const pensions = engineData.pensions || [];
  const retAge1 = parseFloat(factFind.advice_reason?.quick?.client1?.ret_age) || 67;
  const retAge2 = parseFloat(factFind.advice_reason?.quick?.client2?.ret_age) || 67;

  // Strategy helpers
  const strategyLabels = {
    "14": "Salary Sacrifice", "15": "Non-Concessional Contribution", "23": "Extra Debt Repayments",
    "33": "Gifting", "48": "Establish a Trust", "56": "Move Back into PR",
    "62": "Additional Super Contribution", "67": "Salary Packaging", "69": "Pledge Asset as Security",
    "87": "Rent Out Holiday Home", "88": "Rent Out Principal Residence",
    "96": "Commence Account Based Pension", "97": "Commence TTR Pension",
    "137": "Granny Flat Interest (Property Transfer)", "138": "Granny Flat Interest (Funds Transfer)",
    "145": "Support at Home (Home Care)", "184": "Commence Annuity",
    "210": "JobSeeker Payment", "219": "Disability Support Pension",
    "1": "Paid Parental Leave",
  };

  const toggleSection = (id) => setExpandedSections(p => ({ ...p, [id]: !p[id] }));

  const markDone = (sectionId) => setSectionStatus(p => ({ ...p, [sectionId]: "done" }));
  const markPending = (sectionId) => setSectionStatus(p => ({ ...p, [sectionId]: "pending" }));

  // AI content generation
  const generateSection = async (sectionId) => {
    const prompt = sectionPrompts[sectionId] || "";
    setAiGenerating(sectionId);
    try {
      const sectionDef = SOA_GROUPS.flatMap(g => g.sections).find(s => s.id === sectionId);
      const context = `You are writing a section of a Statement of Advice (SOA) for an Australian financial planner.
Client: ${clientNames}
Net position: ${fmt(netPosition)} (Assets: ${fmt(totalAssets)}, Liabilities: ${fmt(totalLiabilities)})
${c1Name} income: ${fmt(c1Salary)}${hasPartner ? `, ${c2Name} income: ${fmt(c2Salary)}` : ""}
Retirement ages: ${c1Name} ${retAge1}${hasPartner ? `, ${c2Name} ${retAge2}` : ""}
Super funds: ${(factFind.superProducts || []).map(s => `${s.fund_name}: $${(parseFloat(s.balance)||0).toLocaleString()}`).join(", ") || "None"}
Strategies: ${strategies.map(s => strategyLabels[s.strategy_id] || `Strategy ${s.strategy_id}`).join(", ") || "None"}

Section: ${sectionDef?.title || sectionId}
${prompt ? `\nAdviser instructions: ${prompt}` : ""}

Write professional SOA content for this section. Be specific with the client data provided. Write in a warm but professional tone appropriate for an Australian SOA. Do not use markdown formatting.`;

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: context }],
        }),
      });
      const data = await resp.json();
      const text = data.content?.map(b => b.text || "").join("") || "Generation failed. Please try again.";
      setSectionContent(p => ({ ...p, [sectionId]: text }));
    } catch (err) {
      setSectionContent(p => ({ ...p, [sectionId]: "Error generating content. Please try again." }));
    }
    setAiGenerating(null);
  };

  const fmt = (v) => v != null ? `$${Math.round(v).toLocaleString()}` : "—";
  const fmtPct = (v) => v != null ? `${(v * 100).toFixed(1)}%` : "—";

  // Compute stats (totalSections computed after sectionOrder below)
  const doneCount = Object.values(sectionStatus).filter(v => v === "done").length;

  // Section group definitions
  const SOA_GROUPS = [
    { id: "welcome", icon: "👋", title: "Welcome & Introduction", color: "#F59E0B", sections: [
      { id: "cover-letter", title: "Cover Letter", subtitle: "Personalised introduction", render: () => (
        <div>
          <p style={{ fontSize: 13, color: "var(--ps-text-secondary)", lineHeight: 1.7 }}>
            Dear {clientNames},
          </p>
          <p style={{ fontSize: 13, color: "var(--ps-text-secondary)", lineHeight: 1.7, marginTop: 8 }}>
            Thank you for the opportunity to prepare this Statement of Advice. This document outlines our recommendations based on the information you provided during our meeting and through the fact find process.
          </p>
          <p style={{ fontSize: 13, color: "var(--ps-text-secondary)", lineHeight: 1.7, marginTop: 8 }}>
            Please take the time to read this document carefully. If you have any questions, please don't hesitate to contact us.
          </p>
        </div>
      )},
      { id: "cover-page", title: "Cover Page", subtitle: "Title page with client and adviser details", render: () => (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ padding: 16, background: "var(--ps-surface-alt)", borderRadius: 10, border: "1px solid var(--ps-border)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Prepared for</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-primary)" }}>{clientNames}</div>
            {c1.residential_address && <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginTop: 4 }}>{c1.residential_address}</div>}
          </div>
          <div style={{ padding: 16, background: "var(--ps-surface-alt)", borderRadius: 10, border: "1px solid var(--ps-border)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Prepared by</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-primary)" }}>{factFind.adviser?.name || "Financial Adviser"}</div>
            <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginTop: 4 }}>AR No: {factFind.adviser?.ar_number || "—"}</div>
            <div style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>AFSL: {factFind.adviser?.afsl || "—"}</div>
          </div>
          <div style={{ padding: 16, background: "var(--ps-surface-alt)", borderRadius: 10, border: "1px solid var(--ps-border)", gridColumn: "span 2" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Document</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ps-text-primary)" }}>Statement of Advice</div>
            <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginTop: 4 }}>Date prepared: {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</div>
            <div style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>SOA Type: {scope.soa_type || "Statement of Advice"}</div>
          </div>
        </div>
      )},
    ]},
    { id: "exec-summary", icon: "📋", title: "Executive Summary & Scope", color: "#6366F1", sections: [
      { id: "exec-summary-item", title: "Executive Summary", subtitle: "High-level overview", render: () => (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Net Position", value: fmt(netPosition), color: netPosition >= 0 ? "var(--ps-green)" : "var(--ps-red)" },
              { label: "Total Assets", value: fmt(totalAssets), color: "var(--ps-text-primary)" },
              { label: "Total Liabilities", value: fmt(totalLiabilities), color: totalLiabilities > 0 ? "var(--ps-red)" : "var(--ps-green)" },
            ].map(k => (
              <div key={k.label} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase" }}>{k.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: k.color, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{k.value}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "var(--ps-text-secondary)", lineHeight: 1.7 }}>
            Based on our analysis of {hasPartner ? "your combined" : "your"} financial position, we recommend the following key strategies:
          </p>
          {strategies.length > 0 ? (
            <ul style={{ margin: "8px 0 0 16px", fontSize: 13, color: "var(--ps-text-secondary)", lineHeight: 1.8 }}>
              {strategies.slice(0, 8).map((s, i) => (
                <li key={i}>{strategyLabels[s.strategy_id] || `Strategy ${s.strategy_id}`}{s.amount ? ` — ${fmt(parseFloat(s.amount))}` : ""}{s.end_year === "Ongoing" ? " (ongoing)" : s.end_year ? ` (FY${s.start_year}–${s.end_year})` : ""}</li>
              ))}
            </ul>
          ) : (
            <div style={{ padding: 12, background: "var(--ps-surface-amber)", borderRadius: 8, fontSize: 12, color: "var(--ps-h1-amb-text)", marginTop: 8 }}>⚠ No strategies configured. Add strategies in the Advice Request section.</div>
          )}
        </div>
      )},
      { id: "scope-of-advice", title: "Scope of Advice", subtitle: "What this advice covers", render: () => (
        <div>
          {scope.additional_notes ? (
            <p style={{ fontSize: 13, color: "var(--ps-text-secondary)", lineHeight: 1.7 }}>{scope.additional_notes}</p>
          ) : (
            <div style={{ padding: 12, background: "var(--ps-surface-amber)", borderRadius: 8, fontSize: 12, color: "var(--ps-h1-amb-text)" }}>⚠ Scope notes not yet configured. <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => navigateTo(["Advice Detail", "Objectives"])}>Go to Objectives →</span></div>
          )}
        </div>
      )},
    ]},
    { id: "circumstances", icon: "👤", title: "Relevant Circumstances & Current Situation", color: "#3B82F6", sections: [
      { id: "personal-details", title: "Personal Details", subtitle: "Demographics", render: () => (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <tbody>
            {[
              [c1Name, c2Name || "—"],
              [c1.date_of_birth || "—", c2.date_of_birth || "—"],
              [c1.employment_status === "1" ? "Employed" : c1.employment_status === "2" ? "Self-employed" : c1.employment_status === "7" ? "Retired" : "—", c2.employment_status === "1" ? "Employed" : c2.employment_status === "2" ? "Self-employed" : c2.employment_status === "7" ? "Retired" : "—"],
              [fmt(c1Salary), hasPartner ? fmt(c2Salary) : "—"],
              [`Retirement: ${retAge1}`, hasPartner ? `Retirement: ${retAge2}` : "—"],
            ].map((row, ri) => (
              <tr key={ri} style={{ borderBottom: "1px solid var(--ps-border-light)" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--ps-text-secondary)", width: "25%" }}>{["Name", "DOB", "Employment", "Gross Income", "Target"][ri]}</td>
                <td style={{ padding: "8px 12px", color: "var(--ps-text-primary)" }}>{row[0]}</td>
                {hasPartner && <td style={{ padding: "8px 12px", color: "var(--ps-text-primary)" }}>{row[1]}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )},
      { id: "assets-liabilities", title: "Assets & Liabilities", subtitle: "Current financial position", render: () => (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 6 }}>Assets</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 12 }}>
            <thead><tr style={{ background: "var(--ps-surface-alt)" }}>
              <th style={{ padding: "6px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)" }}>Asset</th>
              <th style={{ padding: "6px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)" }}>Type</th>
              <th style={{ padding: "6px 12px", textAlign: "right", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)" }}>Value</th>
            </tr></thead>
            <tbody>
              {assets.map((a, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--ps-border-light)" }}>
                  <td style={{ padding: "6px 12px", color: "var(--ps-text-primary)" }}>{a.a_name || "—"}</td>
                  <td style={{ padding: "6px 12px", color: "var(--ps-text-muted)" }}>{({ "1": "Principal Residence", "18": "Investment Property", "21": "Commercial Property", "19": "PR (Absent)", "8": "Cash", "9": "Term Deposit", "12": "AU Shares", "13": "Intl Shares", "26": "Managed Funds" })[a.a_type] || a.a_type}</td>
                  <td style={{ padding: "6px 12px", textAlign: "right", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(parseFloat(a.a_value) || 0)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid var(--ps-border)", fontWeight: 700 }}>
                <td colSpan={2} style={{ padding: "8px 12px" }}>Total Assets</td>
                <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "var(--ps-green)" }}>{fmt(totalAssets)}</td>
              </tr>
            </tbody>
          </table>
          {liabilities.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 6 }}>Liabilities</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ background: "var(--ps-surface-red)" }}>
                  <th style={{ padding: "6px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)" }}>Liability</th>
                  <th style={{ padding: "6px 12px", textAlign: "right", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)" }}>Balance</th>
                  <th style={{ padding: "6px 12px", textAlign: "right", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)" }}>Rate</th>
                </tr></thead>
                <tbody>
                  {liabilities.map((d, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--ps-border-light)" }}>
                      <td style={{ padding: "6px 12px", color: "var(--ps-text-primary)" }}>{d.d_name || "—"}</td>
                      <td style={{ padding: "6px 12px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "var(--ps-red)" }}>{fmt(parseFloat(d.d_balance) || 0)}</td>
                      <td style={{ padding: "6px 12px", textAlign: "right", color: "var(--ps-text-muted)" }}>{d.d_rate ? `${d.d_rate}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )},
      { id: "superannuation", title: "Superannuation", subtitle: "Current super positions", render: () => (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ background: "var(--ps-surface-alt)" }}>
            <th style={{ padding: "6px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)" }}>Fund</th>
            <th style={{ padding: "6px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)" }}>Owner</th>
            <th style={{ padding: "6px 12px", textAlign: "right", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)" }}>Balance</th>
          </tr></thead>
          <tbody>
            {superFunds.map((sf, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--ps-border-light)" }}>
                <td style={{ padding: "6px 12px", color: "var(--ps-text-primary)" }}>{sf.fund_name || `Super Fund ${i + 1}`}</td>
                <td style={{ padding: "6px 12px", color: "var(--ps-text-muted)" }}>{sf.owner === "client1" ? c1Display : c2Display}</td>
                <td style={{ padding: "6px 12px", textAlign: "right", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(parseFloat(sf.balance) || 0)}</td>
              </tr>
            ))}
            {pensions.map((pf, i) => (
              <tr key={`p${i}`} style={{ borderBottom: "1px solid var(--ps-border-light)" }}>
                <td style={{ padding: "6px 12px", color: "var(--ps-text-primary)" }}>{pf.fund_name || `Pension ${i + 1}`} <span style={{ fontSize: 10, color: "#8B5CF6" }}>(Pension)</span></td>
                <td style={{ padding: "6px 12px", color: "var(--ps-text-muted)" }}>{pf.owner === "client1" ? c1Display : c2Display}</td>
                <td style={{ padding: "6px 12px", textAlign: "right", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(parseFloat(pf.balance) || 0)}</td>
              </tr>
            ))}
            {superFunds.length === 0 && pensions.length === 0 && (
              <tr><td colSpan={3} style={{ padding: 12, textAlign: "center", color: "var(--ps-text-subtle)" }}>No super funds recorded</td></tr>
            )}
          </tbody>
        </table>
      )},
    ]},
    { id: "strategies", icon: "💡", title: "Recommended Strategies", color: "#F59E0B", sections: strategies.length > 0 ? strategies.map((s, i) => ({
      id: `strategy-${i}`,
      title: strategyLabels[s.strategy_id] || `Strategy ${s.strategy_id}`,
      subtitle: `${s.owner_id === "client2" ? c2Display : c1Display} · FY${s.start_year}${s.end_year ? `–${s.end_year}` : ""}`,
      render: () => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)" }}>Strategy</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginTop: 2 }}>{strategyLabels[s.strategy_id] || s.strategy_id}</div>
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)" }}>Owner</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginTop: 2 }}>{s.owner_id === "client2" ? c2Display : c1Display}</div>
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)" }}>Amount</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginTop: 2 }}>{s.amount ? fmt(parseFloat(s.amount)) : "N/A"}</div>
          </div>
        </div>
      ),
    })) : [{ id: "no-strategies", title: "No Strategies", subtitle: "Add strategies in the model", render: () => (
      <div style={{ padding: 16, background: "var(--ps-surface-amber)", borderRadius: 8, fontSize: 12, color: "var(--ps-h1-amb-text)", textAlign: "center" }}>
        No strategies have been configured. <span style={{ cursor: "pointer", textDecoration: "underline", fontWeight: 600 }} onClick={() => navigateTo(["Advice Detail", "Recommendations"])}>Go to Recommendations →</span>
      </div>
    )}]},
    { id: "social-security", icon: "🏛️", title: "Social Security", color: "#10B981", sections: [
      { id: "age-pension", title: "Age Pension Assessment", subtitle: "Centrelink entitlement", render: () => ssData ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-emerald)", border: "1px solid var(--ps-ring-green)" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)" }}>Maximum Annual Pension</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ps-green)", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{fmt(ssData.maxAnnual)}</div>
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)" }}>Status</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginTop: 2 }}>{ssData.isCouple ? "Couple" : "Single"} · {ssData.isHomeowner ? "Homeowner" : "Non-homeowner"}</div>
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)" }}>Applied Test</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginTop: 2 }}>{ssData.appliedTest || "—"}</div>
            </div>
          </div>
        </div>
      ) : <div style={{ fontSize: 12, color: "var(--ps-text-subtle)" }}>Age Pension data not available</div>},
    ]},
    { id: "fees", icon: "💰", title: "Fees & Disclosure", color: "#8B5CF6", sections: [
      { id: "adviser-fees", title: "Adviser Fee Disclosure", subtitle: "Full fee disclosure", render: () => (
        <div style={{ padding: 12, background: "var(--ps-surface-amber)", borderRadius: 8, fontSize: 12, color: "var(--ps-h1-amb-text)" }}>✨ AI will generate fee disclosure based on configured fees from the Assumptions page.</div>
      )},
      { id: "how-to-proceed", title: "How to Proceed", subtitle: "Next steps", render: () => (
        <div style={{ padding: 12, background: "var(--ps-surface-amber)", borderRadius: 8, fontSize: 12, color: "var(--ps-h1-amb-text)" }}>✨ AI will generate next steps based on recommended strategies.</div>
      )},
    ]},
  ];

  // Flatten all sections for easy lookup
  const BASE_ALL_SECTIONS = SOA_GROUPS.flatMap(g => g.sections.map(s => ({ ...s, groupId: g.id, groupTitle: g.title, groupIcon: g.icon, groupColor: g.color })));

  // Custom sections added by user
  const [customSections, setCustomSections] = useState([]);
  // Section order — array of section IDs. Initialized from base + custom
  const [sectionOrder, setSectionOrder] = useState(() => BASE_ALL_SECTIONS.map(s => s.id));
  const totalSections = sectionOrder.length;
  const pendingCount = totalSections - doneCount;
  const [activeSOASection, setActiveSOASection] = useState(sectionOrder[0] || null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionGroup, setNewSectionGroup] = useState("welcome");

  // Build ordered groups with custom sections merged in
  const ALL_SECTIONS_MAP = {};
  BASE_ALL_SECTIONS.forEach(s => { ALL_SECTIONS_MAP[s.id] = s; });
  customSections.forEach(s => { ALL_SECTIONS_MAP[s.id] = s; });
  const ALL_SECTIONS = sectionOrder.map(id => ALL_SECTIONS_MAP[id]).filter(Boolean);
  const activeSection = ALL_SECTIONS.find(s => s.id === activeSOASection);
  const activeGroup = activeSection ? SOA_GROUPS.find(g => g.id === activeSection.groupId) : null;

  // Build grouped view respecting order
  const ORDERED_GROUPS = SOA_GROUPS.map(g => ({
    ...g,
    sections: sectionOrder.map(id => ALL_SECTIONS_MAP[id]).filter(s => s && s.groupId === g.id),
  })).filter(g => g.sections.length > 0);

  const moveSection = (sectionId, direction) => {
    setSectionOrder(prev => {
      const idx = prev.indexOf(sectionId);
      if (idx < 0) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const addCustomSection = () => {
    if (!newSectionTitle.trim()) return;
    const id = "custom-" + Date.now();
    const group = SOA_GROUPS.find(g => g.id === newSectionGroup) || SOA_GROUPS[0];
    const newSection = {
      id, title: newSectionTitle.trim(), subtitle: "Custom section",
      groupId: group.id, groupTitle: group.title, groupIcon: group.icon, groupColor: group.color,
      render: () => (
        <div style={{ padding: 12, background: "#EEF2FF", borderRadius: 8, fontSize: 12, color: "#4338CA" }}>
          Custom section — use AI Generate or Edit Manually to add content.
        </div>
      ),
    };
    setCustomSections(prev => [...prev, newSection]);
    // Insert after last section of that group
    setSectionOrder(prev => {
      const groupSectionIds = prev.filter(sid => ALL_SECTIONS_MAP[sid]?.groupId === group.id);
      const lastIdx = groupSectionIds.length > 0 ? prev.indexOf(groupSectionIds[groupSectionIds.length - 1]) : prev.length - 1;
      const next = [...prev];
      next.splice(lastIdx + 1, 0, id);
      return next;
    });
    setNewSectionTitle("");
    setShowAddSection(false);
    setActiveSOASection(id);
  };

  const removeSection = (sectionId) => {
    setSectionOrder(prev => prev.filter(id => id !== sectionId));
    setCustomSections(prev => prev.filter(s => s.id !== sectionId));
    if (activeSOASection === sectionId) {
      const idx = sectionOrder.indexOf(sectionId);
      setActiveSOASection(sectionOrder[idx > 0 ? idx - 1 : idx + 1] || null);
    }
  };

  // Render
  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left: Table of Contents */}
      <div style={{
        width: 300, minWidth: 300, overflowY: "auto", borderRight: "1px solid var(--ps-border)",
        background: "var(--ps-surface-alt)", padding: "16px 0",
      }}>
        {/* Progress bar */}
        <div style={{ padding: "0 16px 16px", borderBottom: "1px solid var(--ps-border)", marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-muted)" }}>PROGRESS</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: doneCount > 0 ? "#059669" : "var(--ps-text-muted)" }}>{doneCount}/{totalSections}</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "var(--ps-border)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #059669, #10B981)", width: `${(doneCount / totalSections) * 100}%`, transition: "width 0.3s" }} />
          </div>
        </div>

        {ORDERED_GROUPS.map(group => {
          const groupDone = group.sections.filter(s => sectionStatus[s.id] === "done").length;
          return (
            <div key={group.id} style={{ marginBottom: 4 }}>
              {/* Group label */}
              <div style={{
                padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, color: "var(--ps-text-subtle)",
                textTransform: "uppercase", letterSpacing: "0.06em",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 13 }}>{group.icon}</span>
                <span style={{ flex: 1 }}>{group.title}</span>
                {groupDone > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--ps-green)" }}>{groupDone}/{group.sections.length}</span>}
              </div>

              {/* Section items */}
              {group.sections.map(section => {
                const isActive = activeSOASection === section.id;
                const isDone = sectionStatus[section.id] === "done";
                const isCustom = section.id.startsWith("custom-");
                return (
                  <div key={section.id} style={{
                    display: "flex", alignItems: "center", width: "100%",
                    background: isActive ? `${group.color}15` : "transparent",
                    borderLeft: isActive ? `3px solid ${group.color}` : "3px solid transparent",
                    transition: "all 0.1s",
                  }}>
                    <button onClick={() => setActiveSOASection(section.id)} style={{
                      display: "flex", alignItems: "center", gap: 8, flex: 1,
                      padding: "8px 4px 8px 12px", border: "none", cursor: "pointer",
                      background: "transparent",
                    }}>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? "var(--ps-text-primary)" : "var(--ps-text-secondary)" }}>
                          {section.title}
                        </div>
                      </div>
                      {isDone ? (
                        <span style={{ width: 8, height: 8, borderRadius: 4, background: "#10B981", flexShrink: 0 }} />
                      ) : (
                        <span style={{ width: 8, height: 8, borderRadius: 4, background: "#F59E0B", flexShrink: 0 }} />
                      )}
                    </button>
                    {/* Move & remove controls — show on hover/active */}
                    {isActive && (
                      <div style={{ display: "flex", gap: 1, padding: "0 6px 0 2px", flexShrink: 0 }}>
                        <button onClick={(e) => { e.stopPropagation(); moveSection(section.id, -1); }}
                          title="Move up"
                          style={{ width: 20, height: 20, border: "none", background: "transparent", cursor: "pointer", fontSize: 10, color: "var(--ps-text-muted)", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >▲</button>
                        <button onClick={(e) => { e.stopPropagation(); moveSection(section.id, 1); }}
                          title="Move down"
                          style={{ width: 20, height: 20, border: "none", background: "transparent", cursor: "pointer", fontSize: 10, color: "var(--ps-text-muted)", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >▼</button>
                        {isCustom && (
                          <button onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                            title="Remove section"
                            style={{ width: 20, height: 20, border: "none", background: "transparent", cursor: "pointer", fontSize: 10, color: "#EF4444", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}
                          >✕</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Add Section */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--ps-border)", marginTop: 8 }}>
          {showAddSection ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                value={newSectionTitle}
                onChange={e => setNewSectionTitle(e.target.value)}
                placeholder="Section title..."
                autoFocus
                onKeyDown={e => { if (e.key === "Enter") addCustomSection(); if (e.key === "Escape") setShowAddSection(false); }}
                style={{
                  padding: "7px 10px", borderRadius: 6, border: "1px solid var(--ps-border-input)",
                  fontSize: 12, outline: "none", background: "var(--ps-surface)", color: "var(--ps-text-primary)",
                }}
              />
              <select
                value={newSectionGroup}
                onChange={e => setNewSectionGroup(e.target.value)}
                style={{
                  padding: "6px 8px", borderRadius: 6, border: "1px solid var(--ps-border-input)",
                  fontSize: 11, background: "var(--ps-surface)", color: "var(--ps-text-secondary)",
                }}
              >
                {SOA_GROUPS.map(g => <option key={g.id} value={g.id}>{g.icon} {g.title}</option>)}
              </select>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={addCustomSection} style={{
                  flex: 1, padding: "6px 10px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600,
                  background: "#4F46E5", color: "#fff", cursor: "pointer",
                }}>Add</button>
                <button onClick={() => { setShowAddSection(false); setNewSectionTitle(""); }} style={{
                  padding: "6px 10px", borderRadius: 6, border: "1px solid var(--ps-border)", fontSize: 11, fontWeight: 500,
                  background: "var(--ps-surface)", color: "var(--ps-text-muted)", cursor: "pointer",
                }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddSection(true)} style={{
              width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px dashed var(--ps-border)",
              background: "transparent", fontSize: 12, fontWeight: 500, color: "var(--ps-text-muted)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}>
              + Add Section
            </button>
          )}
        </div>
      </div>

      {/* Right: Section Content */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {activeSection ? (
          <>
            {/* Section header */}
            <div style={{
              padding: "20px 32px", borderBottom: "1px solid var(--ps-border)",
              background: "var(--ps-surface)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${activeGroup?.color || "#4F46E5"}15`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
              }}>{activeGroup?.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: activeGroup?.color || "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {activeGroup?.title}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ps-text-primary)", letterSpacing: "-0.02em" }}>
                  {activeSection.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginTop: 1 }}>{activeSection.subtitle}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {sectionStatus[activeSection.id] === "done" ? (
                  <span style={{ padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: "#ECFDF5", color: "var(--ps-green)" }}>✓ Approved</span>
                ) : (
                  <span style={{ padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: "#FEF3C7", color: "#B45309" }}>Pending</span>
                )}
              </div>
            </div>

            {/* Section body */}
            <div style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}>
              {/* Data preview from model — what the AI will work with */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  DATA FROM MODEL
                </div>
                <div style={{
                  padding: "16px 20px", borderRadius: 10, background: "var(--ps-surface)",
                  border: "1px solid var(--ps-border)", fontSize: 13, color: "var(--ps-text-secondary)", lineHeight: 1.7,
                }}>
                  {activeSection.render()}
                </div>
              </div>

              {/* Prompt input area */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  INSTRUCTIONS FOR AI
                </div>
                <div style={{
                  borderRadius: 10, border: "1.5px solid var(--ps-border-mid, var(--ps-border))",
                  background: "var(--ps-surface)", overflow: "hidden",
                }}>
                  <textarea
                    value={sectionPrompts[activeSection.id] || ""}
                    onChange={e => setSectionPrompts(p => ({ ...p, [activeSection.id]: e.target.value }))}
                    placeholder={`e.g. "Write a warm introduction mentioning their upcoming retirement and key goals..." or leave blank for default generation`}
                    rows={3}
                    style={{
                      width: "100%", padding: "14px 16px", border: "none", fontSize: 13, resize: "vertical",
                      fontFamily: "inherit", outline: "none", background: "transparent",
                      color: "var(--ps-text-primary)", lineHeight: 1.6,
                      minHeight: 70,
                    }}
                  />
                  <div style={{
                    padding: "8px 12px", borderTop: "1px solid var(--ps-border)",
                    display: "flex", alignItems: "center", gap: 8, background: "var(--ps-surface-alt)",
                  }}>
                    <button
                      onClick={() => generateSection(activeSection.id)}
                      disabled={aiGenerating === activeSection.id}
                      style={{
                        padding: "7px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none",
                        cursor: aiGenerating === activeSection.id ? "wait" : "pointer",
                        background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "white",
                        opacity: aiGenerating === activeSection.id ? 0.6 : 1,
                        display: "flex", alignItems: "center", gap: 6,
                        boxShadow: "0 2px 6px rgba(99,102,241,0.25)",
                      }}
                    >
                      {aiGenerating === activeSection.id ? (
                        <><span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 12 }}>⟳</span> Generating...</>
                      ) : (
                        <>✨ Generate</>
                      )}
                    </button>
                    <span style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>
                      {sectionPrompts[activeSection.id] ? "Custom prompt" : "Will use default template"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Generated content */}
              {sectionContent[activeSection.id] && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {editingSection === activeSection.id ? "EDITING CONTENT" : "GENERATED CONTENT"}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {editingSection === activeSection.id && (
                        <button
                          onClick={() => setEditingSection(null)}
                          style={{
                            padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, border: "1px solid #6EE7B7",
                            background: "#ECFDF5", color: "var(--ps-green)", cursor: "pointer",
                          }}
                        >✓ Done Editing</button>
                      )}
                      <button
                        onClick={() => generateSection(activeSection.id)}
                        style={{
                          padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, border: "1px solid var(--ps-border)",
                          background: "var(--ps-surface)", color: "var(--ps-text-muted)", cursor: "pointer",
                        }}
                      >↻ Regenerate</button>
                    </div>
                  </div>
                  <div style={{
                    borderRadius: 10, background: "var(--ps-surface)",
                    border: editingSection === activeSection.id ? "1.5px solid #6366F1" : "1px solid var(--ps-border)",
                    overflow: "hidden",
                  }}>
                    {editingSection === activeSection.id ? (
                      <textarea
                        value={sectionContent[activeSection.id]}
                        onChange={e => setSectionContent(p => ({ ...p, [activeSection.id]: e.target.value }))}
                        style={{
                          width: "100%", padding: "20px 24px", border: "none", fontSize: 14,
                          color: "var(--ps-text-primary)", lineHeight: 1.8, fontFamily: "inherit",
                          background: "transparent", outline: "none", resize: "vertical", minHeight: 200,
                        }}
                      />
                    ) : (
                      <div style={{ padding: "20px 24px", fontSize: 14, color: "var(--ps-text-primary)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                        {sectionContent[activeSection.id]}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action bar — fixed at bottom */}
            <div style={{
              padding: "14px 32px", borderTop: "1px solid var(--ps-border)",
              background: "var(--ps-surface)", display: "flex", gap: 10, alignItems: "center",
              flexShrink: 0,
            }}>
              <button
                onClick={() => sectionStatus[activeSection.id] === "done" ? markPending(activeSection.id) : markDone(activeSection.id)}
                style={{
                  padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: sectionStatus[activeSection.id] === "done" ? "1px solid #6EE7B7" : "1px solid #6EE7B7",
                  background: sectionStatus[activeSection.id] === "done" ? "#ECFDF5" : "transparent", color: "var(--ps-green)",
                }}
              >{sectionStatus[activeSection.id] === "done" ? "✓ Approved — click to revert" : "✓ Approve Section"}</button>
              <button
                onClick={() => {
                  if (editingSection === activeSection.id) {
                    setEditingSection(null);
                  } else {
                    if (!sectionContent[activeSection.id]) {
                      setSectionContent(p => ({ ...p, [activeSection.id]: "" }));
                    }
                    setEditingSection(activeSection.id);
                  }
                }}
                style={{
                  padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
                  border: editingSection === activeSection.id ? "1px solid #6366F1" : "1px solid var(--ps-border)",
                  background: editingSection === activeSection.id ? "#6366F110" : "transparent",
                  color: editingSection === activeSection.id ? "#6366F1" : "var(--ps-text-muted)",
                }}
              >{editingSection === activeSection.id ? "✓ Done Editing" : "✏️ Edit Manually"}</button>
              <div style={{ flex: 1 }} />
              {/* Navigate between sections */}
              {(() => {
                const idx = ALL_SECTIONS.findIndex(s => s.id === activeSOASection);
                return (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => idx > 0 && setActiveSOASection(ALL_SECTIONS[idx - 1].id)}
                      disabled={idx <= 0}
                      style={{
                        padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: idx > 0 ? "pointer" : "default",
                        border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: idx > 0 ? "var(--ps-text-secondary)" : "var(--ps-text-subtle)",
                        opacity: idx <= 0 ? 0.4 : 1,
                      }}
                    >← Prev</button>
                    <button
                      onClick={() => idx < ALL_SECTIONS.length - 1 && setActiveSOASection(ALL_SECTIONS[idx + 1].id)}
                      disabled={idx >= ALL_SECTIONS.length - 1}
                      style={{
                        padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: idx < ALL_SECTIONS.length - 1 ? "pointer" : "default",
                        border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: idx < ALL_SECTIONS.length - 1 ? "var(--ps-text-secondary)" : "var(--ps-text-subtle)",
                        opacity: idx >= ALL_SECTIONS.length - 1 ? 0.4 : 1,
                      }}
                    >Next →</button>
                  </div>
                );
              })()}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ps-text-subtle)" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📄</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Select a section from the table of contents</div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
