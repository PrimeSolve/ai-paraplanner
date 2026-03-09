import React, { useState } from "react";
import { T } from "../../constants/theme.jsx";
import { EntityBadge, resolveEntity } from "../../constants/entities.jsx";
import { formatNumber } from "../../utils/formatters.js";

export function PlaceholderContent({ topTab, subTab, subSubTab }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: 400,
      color: "var(--ps-text-subtle)",
      gap: 12,
    }}>
      <div style={{ fontSize: 48, opacity: 0.3 }}>📄</div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>
        {topTab} → {subTab}{subSubTab ? ` → ${subSubTab}` : ""}
      </div>
      <div style={{ fontSize: 13, opacity: 0.7 }}>
        Feed data to populate this sheet
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLE TOKENS — SectionTable Style Rules
   ═══════════════════════════════════════════════════════════════ */

// H1 section-break variants (border-left + tinted background) — uses CSS variables for dark mode support
const H1V = {
  income:  { borderLeft: "4px solid var(--ps-h1-income-border)", background: "var(--ps-h1-income-bg)", color: "var(--ps-h1-income-text)" },
  expense: { borderLeft: "4px solid var(--ps-h1-expense-border)", background: "var(--ps-h1-expense-bg)", color: "var(--ps-h1-expense-text)" },
  super:   { borderLeft: "4px solid var(--ps-h1-super-border)", background: "var(--ps-h1-super-bg)", color: "var(--ps-h1-super-text)" },
  nw:      { borderLeft: "4px solid var(--ps-h1-nw-border)", background: "var(--ps-h1-nw-bg)", color: "var(--ps-h1-nw-text)" },
  debt:    { borderLeft: "4px solid var(--ps-h1-debt-border)", background: "var(--ps-h1-debt-bg)", color: "var(--ps-h1-debt-text)" },
  amb:     { borderLeft: "4px solid var(--ps-h1-amb-border)", background: "var(--ps-h1-amb-bg)", color: "var(--ps-h1-amb-text)" },
  slate:   { borderLeft: "4px solid var(--ps-h1-slate-border)", background: "var(--ps-h1-slate-bg)", color: "var(--ps-h1-slate-text)" },
};

// H2 sub-header variants — uses CSS variables for dark mode support
const H2V = {
  cath: { bg: "rgba(79,70,229,0.06)", bl: "3px solid #4F46E5", color: "var(--ps-h1-income-text)", bb: "1px solid rgba(79,70,229,0.08)", dot: "#4F46E5" },
  paul: { bg: "rgba(8,145,178,0.06)", bl: "3px solid #0891B2", color: "var(--ps-text-secondary)", bb: "1px solid rgba(8,145,178,0.08)", dot: "#0891B2" },
  neu:  { bg: "var(--ps-surface-alt)", bl: "3px solid var(--ps-text-subtle)", color: "var(--ps-text-secondary)", bb: "1px solid var(--ps-border-light)", dot: "var(--ps-text-subtle)" },
  grn:  { bg: "rgba(5,150,105,0.05)", bl: "3px solid #059669", color: "var(--ps-h1-nw-text)", bb: "1px solid rgba(5,150,105,0.06)", dot: "#059669" },
};

// H4 entity bracket styles (coloured left + bottom border) — uses CSS variables for dark mode support
const H4B = {
  cath: { bg: "rgba(79,70,229,0.13)", color: "var(--ps-h1-income-text)", bl: "3px solid rgba(79,70,229,0.5)", bt: "1px solid rgba(79,70,229,0.18)", bb: "2px solid rgba(79,70,229,0.15)" },
  paul: { bg: "rgba(8,145,178,0.13)", color: "var(--ps-text-secondary)", bl: "3px solid rgba(8,145,178,0.5)", bt: "1px solid rgba(8,145,178,0.18)", bb: "2px solid rgba(8,145,178,0.15)" },
  grn:  { bg: "rgba(5,150,105,0.11)", color: "var(--ps-h1-nw-text)", bl: "3px solid rgba(5,150,105,0.5)", bt: "1px solid rgba(5,150,105,0.15)", bb: "2px solid rgba(5,150,105,0.12)" },
};

// Section accent colours for grand-total border-left
const SECTION_ACCENT = {
  income: "#4F46E5", expense: "#EA580C", super: "#7C3AED",
  nw: "#059669", debt: "#DC2626", amb: "#D97706", slate: "#64748B",
};

// Entity badge inline styles (spec §6)
const BADGE_STYLES = {
  cath:  { background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.2)", color: "#4F46E5" },
  paul:  { background: "rgba(8,145,178,0.08)", border: "1px solid rgba(8,145,178,0.2)", color: "#0891B2" },
  joint: { background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#7C3AED" },
};

/* ── Helpers ── */

function inferVariant(section) {
  const id = (section.id || "").toLowerCase();
  const t = (section.title || "").toLowerCase();
  if (id.includes("income") || t.includes("income")) return "income";
  if (id.includes("expense") || t.includes("expense")) return "expense";
  if (id.includes("super") || t.includes("super")) return "super";
  if (id.includes("net-worth") || t.includes("net worth") || id.includes("networth")) return "nw";
  if (id.includes("debt") || t.includes("debt")) return "debt";
  if (id.includes("cgt") || t.includes("capital gain") || t.includes("cgt")) return "amb";
  return "slate";
}

function entityType(entity) {
  if (!entity) return null;
  const resolved = resolveEntity(entity);
  if (resolved.color === "#4F46E5") return "cath";
  if (resolved.color === "#0891B2") return "paul";
  if (resolved.color === "#7C3AED") return "joint";
  return null;
}

function isAllNil(values) {
  if (!values || values.length === 0) return true;
  return values.every(v => v === null || v === undefined || v === 0);
}

function renderVal(val, format) {
  if (val === null || val === undefined) return "–";
  if (format === "pct") return `${val}%`;
  return formatNumber(val);
}

// Reusable Section Table component
export function SectionTable({ data, onNavigate, onToggleIndex, onCellEdit }) {
  const [collapsed, setCollapsed] = useState({});
  const [popupOpen, setPopupOpen] = useState(null);

  function toggleSection(id) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // Backward-compatible STYLE_MAP for standard data rows
  const STYLE_MAP = {
    "header":         { bg: "var(--ps-border-light)", color: "var(--ps-text-primary)",   weight: 600, indent: 0 },
    "child":          { bg: "var(--ps-surface)", color: "var(--ps-text-secondary)",   weight: 400, indent: 20 },
    "child-negative": { bg: "var(--ps-surface)", color: "var(--ps-red)",   weight: 400, indent: 20 },
    "subtotal":       { bg: "var(--ps-border-light)", color: "var(--ps-text-body)",   weight: 600, indent: 0, isSub: true },
    "total":          { bg: "var(--ps-border-light)", color: "var(--ps-text-primary)",   weight: 700, indent: 0, borderTop: true, isSub: true },
    "highlight":      { bg: "rgba(79,70,229,0.07)", color: "var(--ps-h1-income-text)", weight: 700, indent: 0, isHl: true },
    "current-value":  { bg: "rgba(37,99,235,0.08)", color: "var(--ps-retirement-text)", weight: 700, indent: 0 },
    "end-value":      { bg: "rgba(5,150,105,0.06)", color: "var(--ps-text-primary)", weight: 700, indent: 0 },
    "subheader":      { bg: "var(--ps-surface-alt)", color: "var(--ps-text-secondary)",   weight: 600, indent: 0 },
  };

  // H4 bracket rule — entity bracket or neutral
  function getH4(sectionEntity) {
    const et = entityType(sectionEntity);
    if (et === "cath" || et === "paul") return H4B[et];
    return null; // neutral
  }

  // Grand total style for a given section
  function grandStyle(section) {
    const variant = inferVariant(section);
    return { accent: SECTION_ACCENT[variant] || "#059669" };
  }

  // Value cell colour for grand total (dark bg — always on --ps-grand-total-bg)
  function grandValColor(val) {
    if (val === null || val === undefined) return "var(--ps-text-subtle)";
    if (val < 0) return "var(--ps-red-bold)";
    return "var(--ps-text-strongest)";
  }

  // Value cell colour for hl rows
  function hlValColor(val) {
    if (val === null || val === undefined) return "var(--ps-border)";
    if (val < 0) return "var(--ps-red)";
    return "var(--ps-h1-income-text)";
  }

  // Standard value cell colour
  function valColor(val, rowStyle) {
    if (val === null || val === undefined) return "var(--ps-border-input)";
    if (val < 0 || rowStyle === "child-negative") return "var(--ps-red)";
    return "var(--ps-text-body)";
  }

  // Render an hl (highlight) row
  function renderHlRow(key, row, format) {
    return (
      <tr key={key}>
        <td style={{
          position: "sticky", left: 0, zIndex: 1,
          background: "rgba(79,70,229,0.07)", color: "var(--ps-h1-income-text)",
          borderLeft: "3px solid rgba(79,70,229,0.5)",
          borderTop: "1px solid rgba(79,70,229,0.15)",
          borderBottom: "2px solid rgba(79,70,229,0.12)",
          padding: "8px 12px", fontWeight: 700, fontSize: 13,
          whiteSpace: "nowrap",
        }}>{row.label}</td>
        {row.values.map((val, vi) => (
          <td key={vi} style={{
            padding: "8px 12px", textAlign: "right",
            background: "rgba(79,70,229,0.07)",
            borderTop: "1px solid rgba(79,70,229,0.15)",
            borderBottom: "2px solid rgba(79,70,229,0.12)",
            fontWeight: 700, fontSize: 13,
            color: hlValColor(val),
          }}>{renderVal(val, format)}</td>
        ))}
      </tr>
    );
  }

  // Render a grand total row
  function renderGrandRow(key, row, section) {
    const gs = grandStyle(section);
    return (
      <tr key={key}>
        <td style={{
          position: "sticky", left: 0, zIndex: 1,
          background: "var(--ps-grand-total-bg)", color: "var(--ps-text-strongest)",
          borderLeft: `4px solid ${gs.accent}`,
          borderTop: "2px solid var(--ps-border-mid)",
          padding: "12px 12px 12px 16px",
          fontSize: 13, fontWeight: 800, textAlign: "left",
          whiteSpace: "nowrap",
        }}>{row.label}</td>
        {row.values.map((val, vi) => (
          <td key={vi} style={{
            padding: "12px 12px", textAlign: "right",
            background: "var(--ps-grand-total-bg)",
            borderTop: "2px solid var(--ps-border-mid)",
            fontSize: 13, fontWeight: 800,
            color: grandValColor(val),
          }}>{renderVal(val)}</td>
        ))}
      </tr>
    );
  }

  // Render an H4 row (subtotal with bracket rule)
  function renderH4Row(key, row, sectionEntity, format) {
    const bracket = getH4(sectionEntity);
    if (bracket) {
      // Entity bracket H4
      return (
        <tr key={key}>
          <td style={{
            position: "sticky", left: 0, zIndex: 1,
            background: bracket.bg, color: bracket.color,
            borderLeft: bracket.bl, borderTop: bracket.bt, borderBottom: bracket.bb,
            padding: "6px 12px", fontWeight: 700, fontSize: 12,
            whiteSpace: "nowrap",
          }}>{row.label}</td>
          {row.values.map((val, vi) => (
            <td key={vi} style={{
              padding: "6px 12px", textAlign: "right",
              background: bracket.bg, borderTop: bracket.bt, borderBottom: bracket.bb,
              fontWeight: 700, fontSize: 12,
              color: val !== null && val !== undefined ? bracket.color : "var(--ps-border)",
            }}>{renderVal(val, format)}</td>
          ))}
        </tr>
      );
    }
    // Neutral H4 — no bracket
    return (
      <tr key={key}>
        <td style={{
          position: "sticky", left: 0, zIndex: 1,
          background: "var(--ps-border-light)", color: "var(--ps-text-body)",
          borderTop: "1px solid var(--ps-border)",
          padding: "6px 12px", fontWeight: 700, fontSize: 12,
          whiteSpace: "nowrap",
        }}>{row.label}</td>
        {row.values.map((val, vi) => (
          <td key={vi} style={{
            padding: "6px 12px", textAlign: "right",
            background: "var(--ps-border-light)",
            borderTop: "1px solid var(--ps-border)",
            fontWeight: 700, fontSize: 12,
            color: val !== null && val !== undefined ? "var(--ps-text-body)" : "var(--ps-border)",
          }}>{renderVal(val, format)}</td>
        ))}
      </tr>
    );
  }

  return (
    <div style={{ overflowX: "auto", margin: "0 -4px" }}>
      <table style={{
        width: "100%",
        borderCollapse: "separate",
        borderSpacing: 0,
        fontSize: 12,
        fontFamily: "'DM Sans', sans-serif",
        fontVariantNumeric: "tabular-nums",
        tableLayout: "fixed",
      }}>
        {/* ── THEAD — dark navy bar (spec §3 thead) ── */}
        <thead>
          <tr>
            <th style={{
              position: "sticky", left: 0, zIndex: 2,
              background: "var(--ps-thead-bg)", padding: "13px 12px",
              textAlign: "left", fontSize: 11, fontWeight: 800,
              color: "var(--ps-thead-text)", textTransform: "uppercase",
              letterSpacing: "0.08em", width: 220,
            }}>Year</th>
            {data.years.map((y, i) => (
              <th key={i} style={{
                padding: "13px 12px", textAlign: "right",
                fontWeight: 700, color: "var(--ps-thead-text)", fontSize: 13,
                background: "var(--ps-thead-bg)", width: 80, whiteSpace: "nowrap",
              }}>{y}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.sections.map((section) => {
            // ── Divider ──
            if (section.isDivider) {
              return (
                <tr key={section.id}>
                  <td colSpan={data.years.length + 1} style={{
                    padding: 0,
                    height: 20,
                    background: "var(--ps-surface)",
                    borderBottom: "none",
                  }}>
                    <div style={{
                      margin: "8px 0",
                      borderTop: "3px solid #4F46E5",
                      opacity: 0.15,
                    }} />
                  </td>
                </tr>
              );
            }
            // ── Section Header (decorative banner) ──
            if (section.isSectionHeader) {
              return (
                <tr key={section.id}>
                  <td colSpan={data.years.length + 1} style={{
                    padding: "6px 0",
                    background: "var(--ps-surface)",
                    borderBottom: "none",
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 20px",
                      background: section.bg || "var(--ps-surface-indigo)",
                      borderRadius: 10,
                      border: `1px solid ${section.border || "var(--ps-ring-indigo)"}`,
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 9,
                        background: "var(--ps-surface)", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, border: `1px solid ${section.border || "var(--ps-ring-indigo)"}`,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        flexShrink: 0,
                      }}>{section.icon || "📋"}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-strongest)" }}>{section.title}</div>
                        {section.subtitle && <div style={{ fontSize: 11, color: "var(--ps-text-muted)", marginTop: 1 }}>{section.subtitle}</div>}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            }

            const isCollapsed = collapsed[section.id];
            const secEntity = entityType(section.entity);
            const secVariant = inferVariant(section);
            const isAges = section.id === "ages";

            return [
              // ── Age rows (spec §3 Age rows) ──
              isAges && section.rows ? section.rows.map((row, ri) => {
                const et = entityType(row.entity);
                const isCath = et === "cath";
                const isPaul = et === "paul";
                const bgColor = isCath ? "rgba(79,70,229,0.07)" : isPaul ? "rgba(8,145,178,0.07)" : "var(--ps-surface-alt)";
                const textColor = isCath ? "var(--ps-h1-income-text)" : isPaul ? "var(--ps-text-secondary)" : "var(--ps-text-secondary)";
                const blColor = isCath ? "#4F46E5" : isPaul ? "#0891B2" : "var(--ps-text-subtle)";
                return (
                  <tr key={`age-${section.id}-${ri}`}>
                    <td style={{
                      position: "sticky", left: 0, zIndex: 1,
                      background: bgColor, color: textColor,
                      borderLeft: `3px solid ${blColor}`,
                      borderBottom: isPaul ? "2px solid var(--ps-border-mid)" : undefined,
                      fontSize: 11, fontWeight: 600, padding: "6px 12px",
                      whiteSpace: "nowrap",
                    }}>
                      {row.entity && <EntityBadge name={row.entity} size="sm" showIcon={false} />}
                    </td>
                    {row.values.map((age, vi) => (
                      <td key={vi} style={{
                        padding: "6px 12px", textAlign: "right",
                        background: bgColor, color: textColor,
                        fontSize: 11, fontWeight: 600,
                        borderBottom: isPaul ? "2px solid var(--ps-border-mid)" : undefined,
                      }}>
                        {age != null ? (row.retirementAge && age === row.retirementAge ? `${age} 🌴` : age) : "–"}
                      </td>
                    ))}
                  </tr>
                );
              }) : null,

              // ── Section title row — H1 (no entity) or H2 (entity) ──
              !isAges && section.title && (() => {
                const hasEntity = !!secEntity;
                if (!hasEntity) {
                  // H1 — major section break (spec §3 H1)
                  const v = H1V[secVariant] || H1V.slate;
                  return (
                    <tr key={`title-${section.id}`}
                      onClick={() => toggleSection(section.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td colSpan={data.years.length + 1} style={{
                        padding: "10px 16px",
                        fontSize: 11, fontWeight: 800,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        borderTop: "3px solid var(--ps-border)", borderBottom: "1px solid var(--ps-border-mid)",
                        ...v,
                      }}>
                        <span style={{ marginRight: 8, fontSize: 10, opacity: 0.6 }}>
                          {isCollapsed ? "▸" : "▾"}
                        </span>
                        {section.title}
                        {section.isNew && (
                          <span style={{ marginLeft: 8, fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "var(--ps-surface-indigo)", color: "var(--ps-retirement-text)", fontWeight: 700, verticalAlign: "middle" }}>NEW</span>
                        )}
                        {section.source && onNavigate && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate(section.source.nav);
                            }}
                            style={{
                              marginLeft: 10, fontSize: 10, fontWeight: 600,
                              color: "#6366f1", cursor: "pointer",
                              padding: "2px 8px", borderRadius: 4,
                              background: "rgba(99,102,241,0.06)",
                              border: "1px solid rgba(99,102,241,0.15)",
                              verticalAlign: "middle",
                              letterSpacing: "0.02em",
                              textTransform: "none",
                            }}
                            title={`Go to ${section.source.label}`}
                          >
                            ↗ {section.source.label}
                          </span>
                        )}
                        {section.hasDetailPopup && (
                          <span
                            onClick={(e) => { e.stopPropagation(); setPopupOpen(popupOpen === section.id ? null : section.id); }}
                            style={{
                              marginLeft: 10, fontSize: 11, fontWeight: 500,
                              color: "#6366f1", cursor: "pointer",
                              padding: "2px 8px", borderRadius: 4,
                              background: "rgba(99,102,241,0.08)",
                              textTransform: "none",
                            }}
                          >
                            ⓘ View Details
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                } else {
                  // H2 — entity sub-header (spec §3 H2)
                  const h2 = H2V[secEntity] || H2V.neu;
                  const badge = BADGE_STYLES[secEntity];
                  return (
                    <tr key={`title-${section.id}`}
                      onClick={() => toggleSection(section.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td colSpan={data.years.length + 1} style={{
                        padding: "7px 14px 7px 20px",
                        fontSize: 11, fontWeight: 600,
                        background: h2.bg, borderLeft: h2.bl,
                        color: h2.color, borderBottom: h2.bb,
                      }}>
                        {/* Coloured dot (spec §3 H2) */}
                        <span style={{
                          display: "inline-block", width: 5, height: 5, borderRadius: "50%",
                          background: h2.dot, marginRight: 8, verticalAlign: "middle",
                        }} />
                        {section.title}
                        {/* Entity badge (spec §6) */}
                        {section.entity && badge && (
                          <span style={{
                            display: "inline-flex", alignItems: "center",
                            padding: "1px 7px", borderRadius: 4,
                            fontSize: 10, fontWeight: 500, marginLeft: 8,
                            ...badge,
                          }}>
                            {section.entity}
                          </span>
                        )}
                        {section.entity && !badge && (
                          <span style={{ marginLeft: 10, verticalAlign: "middle" }}>
                            <EntityBadge name={section.entity} size="sm" />
                          </span>
                        )}
                        {section.isNew && (
                          <span style={{ marginLeft: 8, fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "var(--ps-surface-indigo)", color: "var(--ps-retirement-text)", fontWeight: 700, verticalAlign: "middle" }}>NEW</span>
                        )}
                        {section.source && onNavigate && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate(section.source.nav);
                            }}
                            style={{
                              marginLeft: 10, fontSize: 10, fontWeight: 600,
                              color: "#6366f1", cursor: "pointer",
                              padding: "2px 8px", borderRadius: 4,
                              background: "rgba(99,102,241,0.06)",
                              border: "1px solid rgba(99,102,241,0.15)",
                              verticalAlign: "middle",
                              letterSpacing: "0.02em",
                            }}
                            title={`Go to ${section.source.label}`}
                          >
                            ↗ {section.source.label}
                          </span>
                        )}
                        {/* Faint caret (spec §3 H2) */}
                        <span style={{ marginLeft: 6, fontSize: 10, color: h2.color, opacity: 0.4 }}>
                          {isCollapsed ? "▸" : "▾"}
                        </span>
                        {section.hasDetailPopup && (
                          <span
                            onClick={(e) => { e.stopPropagation(); setPopupOpen(popupOpen === section.id ? null : section.id); }}
                            style={{
                              marginLeft: 10, fontSize: 11, fontWeight: 500,
                              color: "#6366f1", cursor: "pointer",
                              padding: "2px 8px", borderRadius: 4,
                              background: "rgba(99,102,241,0.08)",
                            }}
                          >
                            ⓘ View Details
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                }
              })(),

              // ── Detail popup ──
              popupOpen === section.id && section.popupData && (
                <tr key={`popup-${section.id}`}>
                  <td colSpan={data.years.length + 1} style={{ padding: 0, background: "var(--ps-surface)" }}>
                    <div style={{
                      margin: "0 16px 12px", padding: "16px 20px",
                      background: "var(--ps-surface-alt)", borderRadius: 10,
                      border: "1px solid var(--ps-border)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "var(--ps-text-primary)" }}>Assets & Liabilities Breakdown</span>
                        <span onClick={() => setPopupOpen(null)} style={{ cursor: "pointer", color: "var(--ps-text-subtle)", fontSize: 16 }}>✕</span>
                      </div>
                      {section.popupData.assets.length > 0 && (
                        <div style={{ marginBottom: section.popupData.debts.length > 0 ? 12 : 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-green)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Assets</div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <tbody>
                              {section.popupData.assets.map((a, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid var(--ps-border)" }}>
                                  <td style={{ padding: "6px 0", color: "var(--ps-text-secondary)" }}>{a.name}</td>
                                  {a.values.map((v, vi) => (
                                    <td key={vi} style={{ padding: "6px 8px", textAlign: "right", color: "var(--ps-text-body)", fontVariantNumeric: "tabular-nums", minWidth: 85 }}>
                                      {v != null ? v.toLocaleString() : ""}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {section.popupData.debts.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-red)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Liabilities</div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <tbody>
                              {section.popupData.debts.map((d, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid var(--ps-border)" }}>
                                  <td style={{ padding: "6px 0", color: "var(--ps-text-secondary)" }}>{d.name}</td>
                                  {d.values.map((v, vi) => (
                                    <td key={vi} style={{ padding: "6px 8px", textAlign: "right", color: "var(--ps-red)", fontVariantNumeric: "tabular-nums", minWidth: 85 }}>
                                      {v != null ? v.toLocaleString() : ""}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {section.popupData.assets.length === 0 && section.popupData.debts.length === 0 && (
                        <div style={{ color: "var(--ps-text-subtle)", fontSize: 13 }}>No assets or liabilities in this account</div>
                      )}
                    </div>
                  </td>
                </tr>
              ),

              // ── SubSections (spec §3 H2 headers + H3 data rows) ──
              ...(!isCollapsed && !isAges && section.subSections ? section.subSections.map((sub) => {
                const subCollapsed = collapsed[sub.id];
                const hasChildren = sub.rows && sub.rows.length > 0;
                const isCollapsible = sub.summaryValues !== null;
                // Determine H2 variant for sub-section header
                const subH2 = H2V.neu;
                return [
                  // Sub-section header row (H2 style with dot + caret)
                  isCollapsible && (
                  <tr key={`sub-${sub.id}`}
                    onClick={hasChildren ? () => toggleSection(sub.id) : undefined}
                    style={{ cursor: hasChildren ? "pointer" : "default" }}
                  >
                    <td style={{
                      position: "sticky", left: 0, zIndex: 1,
                      padding: "7px 14px 7px 20px",
                      fontWeight: 600, fontSize: 11,
                      color: subH2.color,
                      background: subH2.bg,
                      borderLeft: subH2.bl,
                      borderBottom: subH2.bb,
                      whiteSpace: "nowrap",
                    }}>
                      {/* Coloured dot */}
                      <span style={{
                        display: "inline-block", width: 5, height: 5, borderRadius: "50%",
                        background: subH2.dot, marginRight: 8, verticalAlign: "middle",
                      }} />
                      {sub.label}
                      {/* Faint caret */}
                      {hasChildren && (
                        <span style={{ marginLeft: 6, fontSize: 10, color: subH2.color, opacity: 0.4 }}>
                          {subCollapsed ? "▸" : "▾"}
                        </span>
                      )}
                    </td>
                    {sub.summaryValues.map((val, vi) => (
                      <td key={vi} style={{
                        padding: "7px 12px", textAlign: "right",
                        fontWeight: 600, fontSize: 12,
                        color: val !== null && val !== undefined ? subH2.color : "var(--ps-border)",
                        borderBottom: subH2.bb,
                        background: subH2.bg,
                      }}>
                        {val !== null && val !== undefined ? formatNumber(val) : "–"}
                      </td>
                    ))}
                  </tr>
                  ),
                  // Sub-section child rows (H3 style with alternation)
                  ...((!isCollapsible || !subCollapsed) && hasChildren ? sub.rows.flatMap((row, ri) => {
                    // Zero-row suppression (spec §5)
                    if ((row.style === "child" || row.style === "child-negative" || !row.style) && isAllNil(row.values)) return [];

                    const s = STYLE_MAP[row.style] || STYLE_MAP["child"];
                    const hasBreakdown = row.breakdown && row.breakdown.length > 0;
                    const breakdownOpen = collapsed[`bd-${sub.id}-${ri}`];
                    const rows = [];

                    // hl row
                    if (s.isHl) {
                      rows.push(renderHlRow(`${sub.id}-${ri}`, row, row.format));
                      return rows;
                    }
                    // H4 subtotal/total
                    if (s.isSub) {
                      rows.push(renderH4Row(`${sub.id}-${ri}`, row, section.entity, row.format));
                      return rows;
                    }

                    // H3 data row (spec §3 H3)
                    const isAlt = ri % 2 === 1;
                    rows.push(
                      <tr key={`${sub.id}-${ri}`} style={{ background: isAlt ? "var(--ps-surface-alt)" : "var(--ps-surface)" }}>
                        <td style={{
                          position: "sticky", left: 0, zIndex: 1,
                          padding: "5px 12px 5px 36px",
                          fontWeight: 400,
                          color: "var(--ps-text-secondary)",
                          background: isAlt ? "var(--ps-surface-alt)" : "var(--ps-surface)",
                          borderBottom: "1px solid var(--ps-border-light)",
                          whiteSpace: "nowrap",
                          fontSize: 12,
                        }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            {hasBreakdown && (
                              <span
                                onClick={(e) => { e.stopPropagation(); toggleSection(`bd-${sub.id}-${ri}`); }}
                                style={{ cursor: "pointer", fontSize: 9, color: "var(--ps-text-subtle)", width: 12 }}
                              >{breakdownOpen ? "▾" : "▸"}</span>
                            )}
                            {row.label}
                            {row.entity && <EntityBadge name={row.entity} size="sm" showIcon={false} />}
                            {row.source && onNavigate && (
                              <span
                                onClick={(e) => { e.stopPropagation(); onNavigate(row.source.nav); }}
                                style={{
                                  fontSize: 9, fontWeight: 600,
                                  color: "#6366f1", cursor: "pointer",
                                  padding: "1px 6px", borderRadius: 3,
                                  background: "rgba(99,102,241,0.06)",
                                  border: "1px solid rgba(99,102,241,0.12)",
                                  letterSpacing: "0.02em",
                                }}
                                title={`Go to ${row.source.label}`}
                              >↗ {row.source.label}</span>
                            )}
                          </span>
                        </td>
                        {row.editType === "freq-select" && onCellEdit
                          ? row.values.map((val, vi) => (
                              <td key={vi} style={{ padding: "4px 8px", textAlign: "right", background: isAlt ? "var(--ps-surface-alt)" : "var(--ps-surface)", borderBottom: "1px solid var(--ps-border-light)" }}>
                                {vi === 0 ? (
                                  <select
                                    value={row.currentFreq}
                                    onChange={e => onCellEdit(row.debtRef, e.target.value)}
                                    style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, border: "1px solid var(--ps-retirement-text)", background: "var(--ps-surface-indigo)", color: "var(--ps-h1-income-text)", cursor: "pointer", fontWeight: 600 }}
                                  >
                                    {[{v:"52",l:"Weekly"},{v:"26",l:"Fortnightly"},{v:"12",l:"Monthly"},{v:"4",l:"Quarterly"},{v:"1",l:"Annually"}].map(o => (
                                      <option key={o.v} value={o.v}>{o.l}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>{val}</span>
                                )}
                              </td>
                            ))
                          : row.values.map((val, vi) => {
                              const isNil = val === null || val === undefined;
                              return (
                                <td key={vi} style={{
                                  padding: "5px 12px", textAlign: "right",
                                  fontWeight: 400,
                                  color: isNil ? "var(--ps-border-input)" : valColor(val, row.style),
                                  fontSize: isNil ? 11 : 12,
                                  borderBottom: "1px solid var(--ps-border-light)",
                                  background: isAlt ? "var(--ps-surface-alt)" : "var(--ps-surface)",
                                }}>
                                  {isNil ? "–" : renderVal(val, row.format)}
                                </td>
                              );
                            })
                        }
                      </tr>
                    );
                    // Breakdown sub-rows
                    if (hasBreakdown && breakdownOpen) {
                      row.breakdown.forEach((b, bi) => {
                        rows.push(
                          <tr key={`${sub.id}-${ri}-bd-${bi}`} style={{ background: "rgba(99,102,241,0.03)" }}>
                            <td style={{
                              position: "sticky", left: 0, zIndex: 1,
                              padding: "4px 16px 4px 72px",
                              fontWeight: 400, fontSize: 12,
                              color: "#6366f1",
                              background: "rgba(99,102,241,0.03)",
                              borderBottom: "1px solid rgba(99,102,241,0.08)",
                              whiteSpace: "nowrap",
                            }}>
                              {b.nav && onNavigate ? (
                                <span
                                  onClick={(e) => { e.stopPropagation(); onNavigate(b.nav); }}
                                  style={{ cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}
                                >{b.name}</span>
                              ) : b.name}
                              {b.isIO && <span style={{ marginLeft: 6, fontSize: 9, color: "var(--ps-text-subtle)", fontWeight: 500 }}>IO</span>}
                            </td>
                            {row.values.map((_, vi) => (
                              <td key={vi} style={{
                                padding: "4px 12px", textAlign: "right",
                                fontWeight: 400, fontSize: 12,
                                color: "#6366f1",
                                background: "rgba(99,102,241,0.03)",
                                borderBottom: "1px solid rgba(99,102,241,0.08)",
                              }}>
                                {formatNumber(b.value)}
                              </td>
                            ))}
                          </tr>
                        );
                      });
                    }
                    return rows;
                  }) : []),
                ];
              }).flat() : []),

              // ── Footer rows — grand total or hl (spec §3 Grand / hl) ──
              ...(!isCollapsed && !isAges && section.footerRows ? section.footerRows.map((row, ri) => {
                // Grand total for "total" style in footer
                if (row.style === "total") {
                  return renderGrandRow(`footer-${section.id}-${ri}`, row, section);
                }
                // hl for "highlight" style in footer
                if (row.style === "highlight") {
                  return renderHlRow(`footer-${section.id}-${ri}`, row);
                }
                // Other footer styles — use STYLE_MAP
                const s = STYLE_MAP[row.style] || STYLE_MAP["child"];
                return (
                  <tr key={`footer-${section.id}-${ri}`} style={{ background: s.bg }}>
                    <td style={{
                      position: "sticky", left: 0, zIndex: 1,
                      padding: "6px 12px",
                      fontWeight: s.weight,
                      color: s.color,
                      background: s.bg,
                      borderBottom: "1px solid var(--ps-border-light)",
                      borderTop: s.borderTop ? "1px solid var(--ps-border)" : undefined,
                      whiteSpace: "nowrap",
                      fontSize: 12,
                    }}>
                      {row.label}
                    </td>
                    {row.editType === "freq-select" && onCellEdit
                      ? row.values.map((val, vi) => (
                          <td key={vi} style={{ padding: "4px 8px", textAlign: "right", background: s.bg, borderBottom: "1px solid var(--ps-border-light)" }}>
                            {vi === 0 ? (
                              <select
                                value={row.currentFreq}
                                onChange={e => onCellEdit(row.debtRef, e.target.value)}
                                style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, border: "1px solid var(--ps-retirement-text)", background: "var(--ps-surface-indigo)", color: "var(--ps-h1-income-text)", cursor: "pointer", fontWeight: 600 }}
                              >
                                {[{v:"52",l:"Weekly"},{v:"26",l:"Fortnightly"},{v:"12",l:"Monthly"},{v:"4",l:"Quarterly"},{v:"1",l:"Annually"}].map(o => (
                                  <option key={o.v} value={o.v}>{o.l}</option>
                                ))}
                              </select>
                            ) : (
                              <span style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>{val}</span>
                            )}
                          </td>
                        ))
                      : row.values.map((val, vi) => (
                          <td key={vi} style={{
                            padding: "6px 12px", textAlign: "right",
                            fontWeight: s.weight,
                            color: val !== null && val !== undefined ? (val < 0 ? "var(--ps-red)" : s.color) : "var(--ps-border)",
                            borderBottom: "1px solid var(--ps-border-light)",
                            borderTop: s.borderTop ? "1px solid var(--ps-border)" : undefined,
                            background: s.bg,
                            fontSize: (val === null || val === undefined) ? 11 : 12,
                          }}>
                            {renderVal(val)}
                          </td>
                        ))
                    }
                  </tr>
                );
              }) : []),

              // ── Standard data rows (sections without subSections, spec §3 H3/H4/hl) ──
              ...(!isCollapsed && !isAges && !section.subSections && section.rows ? section.rows.flatMap((row, ri) => {
                // Section sub-header — collapsible group label
                if (row.style === "section-header") {
                  const groupKey = `grp-${section.id}-${ri}`;
                  const groupCollapsed = collapsed[groupKey];
                  return [
                    <tr key={groupKey} onClick={() => toggleSection(groupKey)} style={{ cursor: "pointer" }}>
                      <td colSpan={data.years.length + 1} style={{
                        position: "sticky", left: 0, zIndex: 1,
                        background: "var(--ps-surface-alt)",
                        borderLeft: "3px solid var(--ps-text-subtle)",
                        borderTop: "2px solid var(--ps-border)",
                        padding: "7px 14px 7px 20px", fontWeight: 600, fontSize: 11,
                        color: "var(--ps-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>
                        <span style={{
                          display: "inline-block", width: 5, height: 5, borderRadius: "50%",
                          background: "var(--ps-text-subtle)", marginRight: 8, verticalAlign: "middle",
                        }} />
                        {row.label}
                        <span style={{ marginLeft: 6, fontSize: 10, color: "var(--ps-text-secondary)", opacity: 0.4 }}>
                          {groupCollapsed ? "▸" : "▾"}
                        </span>
                      </td>
                    </tr>
                  ];
                }

                // Subheader row (non-collapsible label row)
                if (row.style === "subheader") {
                  return [
                    <tr key={`${section.id}-${ri}`}>
                      <td colSpan={data.years.length + 1} style={{
                        padding: "7px 14px 7px 20px", fontWeight: 600, fontSize: 11,
                        background: "var(--ps-surface-alt)", borderLeft: "3px solid var(--ps-text-subtle)",
                        color: "var(--ps-text-secondary)", borderBottom: "1px solid var(--ps-border-light)",
                      }}>
                        <span style={{
                          display: "inline-block", width: 5, height: 5, borderRadius: "50%",
                          background: "var(--ps-text-subtle)", marginRight: 8, verticalAlign: "middle",
                        }} />
                        {row.label}
                      </td>
                    </tr>
                  ];
                }

                // Check if this row is inside a collapsed section-header group
                let inCollapsedGroup = false;
                for (let gi = ri - 1; gi >= 0; gi--) {
                  if (section.rows[gi].style === "section-header") {
                    const groupKey = `grp-${section.id}-${gi}`;
                    if (collapsed[groupKey]) inCollapsedGroup = true;
                    break;
                  }
                }
                if (inCollapsedGroup) return [];

                // Zero-row suppression (spec §5) — only for data rows
                if ((row.style === "child" || row.style === "child-negative" || !row.style) && isAllNil(row.values)) return [];

                const s = STYLE_MAP[row.style] || STYLE_MAP["child"];

                // hl row
                if (s.isHl) {
                  return [renderHlRow(`${section.id}-${ri}`, row, row.format)];
                }

                // H4 subtotal/total — bracket rule (spec §3 H4)
                if (s.isSub) {
                  return [renderH4Row(`${section.id}-${ri}`, row, section.entity, row.format)];
                }

                const hasBreakdown = row.breakdown && row.breakdown.length > 0;
                const breakdownOpen = collapsed[`bd-${section.id}-${ri}`];
                const rowResults = [];

                // H3 data row (spec §3 H3)
                const isAlt = ri % 2 === 1;
                const rowBg = isAlt ? "var(--ps-surface-alt)" : "var(--ps-surface)";
                // For current-value / end-value, use their specific bg
                const finalBg = (row.style === "current-value" || row.style === "end-value") ? s.bg : rowBg;

                rowResults.push(
                  <tr key={`${section.id}-${ri}`} style={{ background: finalBg }}>
                    <td style={{
                      position: "sticky", left: 0, zIndex: 1,
                      padding: `5px 12px 5px ${12 + s.indent}px`,
                      fontWeight: s.weight,
                      color: s.color,
                      background: finalBg,
                      borderBottom: "1px solid var(--ps-border-light)",
                      borderTop: s.borderTop ? "1px solid var(--ps-border)" : undefined,
                      whiteSpace: "nowrap",
                      fontSize: 12,
                    }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        {hasBreakdown && (
                          <span
                            onClick={(e) => { e.stopPropagation(); toggleSection(`bd-${section.id}-${ri}`); }}
                            style={{ cursor: "pointer", fontSize: 9, color: "var(--ps-text-subtle)", width: 12 }}
                          >{breakdownOpen ? "▾" : "▸"}</span>
                        )}
                        {row.label}
                        {row.tooltip && (() => {
                          const ttId = `tt-${section.id}-${ri}`;
                          return (
                            <span style={{ marginLeft: 6, display: "inline-flex", alignItems: "center" }}
                              onMouseEnter={e => {
                                let el = document.getElementById(ttId);
                                if (!el) {
                                  el = document.createElement("div");
                                  el.id = ttId;
                                  el.textContent = row.tooltip;
                                  Object.assign(el.style, { position: "fixed", zIndex: 9999, background: "#1E293B", color: "#F1F5F9", fontSize: "11px", fontWeight: 400, borderRadius: "8px", padding: "10px 14px", width: "240px", lineHeight: 1.6, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", pointerEvents: "none" });
                                  document.body.appendChild(el);
                                }
                                const r = e.currentTarget.getBoundingClientRect();
                                el.style.top = (r.bottom + 6) + "px";
                                el.style.left = r.left + "px";
                                el.style.display = "block";
                              }}
                              onMouseLeave={() => { const el = document.getElementById(ttId); if(el) el.style.display = "none"; }}
                            >
                              <span style={{ fontSize: 13, cursor: "help", background: "var(--ps-surface-indigo)", border: "1px solid var(--ps-ring-indigo)", borderRadius: 6, padding: "1px 6px", lineHeight: 1 }}>💡</span>
                            </span>
                          );
                        })()}
                        {row.entity && <EntityBadge name={row.entity} size="sm" showIcon={false} />}
                        {row.indexToggle && onToggleIndex && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleIndex(row.indexToggle.fundIndex, row.indexToggle.field, !row.indexToggle.active);
                            }}
                            style={{
                              fontSize: 11, fontWeight: 600, cursor: "pointer",
                              padding: "3px 10px", borderRadius: 6, marginLeft: 8,
                              color: row.indexToggle.active ? "var(--ps-surface)" : "var(--ps-text-muted)",
                              background: row.indexToggle.active ? "var(--ps-green)" : "var(--ps-border-light)",
                              border: `1px solid ${row.indexToggle.active ? "var(--ps-green)" : "var(--ps-border-mid)"}`,
                              userSelect: "none",
                              display: "inline-block",
                            }}
                            title={row.indexToggle.active ? "Indexed to inflation — click to disable" : "Click to index to inflation"}
                          >
                            CPI {row.indexToggle.active ? "ON" : "OFF"}
                          </span>
                        )}
                        {row.source && onNavigate && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate(row.source.nav);
                            }}
                            style={{
                              fontSize: 9, fontWeight: 600,
                              color: "#6366f1", cursor: "pointer",
                              padding: "1px 6px", borderRadius: 3,
                              background: "rgba(99,102,241,0.06)",
                              border: "1px solid rgba(99,102,241,0.12)",
                              letterSpacing: "0.02em",
                            }}
                            title={`Go to ${row.source.label}`}
                          >
                            ↗ {row.source.label}
                          </span>
                        )}
                      </span>
                    </td>
                    {(row.editType === "freq-select" || row.editType === "io-select") && onCellEdit
                      ? row.values.map((val, vi) => (
                          <td key={vi} style={{ padding: "4px 6px", textAlign: "right", background: finalBg, borderBottom: "1px solid var(--ps-border-light)" }}>
                            {row.editType === "io-select" ? (
                              <select
                                value={row.ioForYear[vi] ? "1" : "2"}
                                onChange={e => onCellEdit(row.debtRef, e.target.value, "io", vi)}
                                style={{ fontSize: 10, padding: "1px 4px", borderRadius: 4, border: row.ioYearOverrides[vi] !== undefined ? "1px solid var(--ps-retirement-text)" : "1px solid var(--ps-border-mid)", background: row.ioYearOverrides[vi] !== undefined ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: row.ioYearOverrides[vi] !== undefined ? "var(--ps-h1-income-text)" : "var(--ps-text-secondary)", cursor: "pointer", fontWeight: row.ioYearOverrides[vi] !== undefined ? 700 : 400 }}
                              >
                                {[{v:"2",l:"P & I"},{v:"1",l:"IO"}].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                              </select>
                            ) : vi === 0 ? (
                              <select
                                value={row.currentFreq}
                                onChange={e => onCellEdit(row.debtRef, e.target.value, "freq")}
                                style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, border: "1px solid var(--ps-retirement-text)", background: "var(--ps-surface-indigo)", color: "var(--ps-h1-income-text)", cursor: "pointer", fontWeight: 600 }}
                              >
                                {[{v:"52",l:"Weekly"},{v:"26",l:"Fortnightly"},{v:"12",l:"Monthly"},{v:"4",l:"Quarterly"},{v:"1",l:"Annually"}].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                              </select>
                            ) : (
                              <span style={{ fontSize: 12, color: s.color }}>{val}</span>
                            )}
                          </td>
                        ))
                      : row.values.map((val, vi) => {
                          const isNil = val === null || val === undefined;
                          return (
                            <td key={vi} style={{
                              padding: "5px 12px", textAlign: "right",
                              fontWeight: s.weight,
                              color: isNil ? "var(--ps-border-input)" : valColor(val, row.style),
                              fontSize: isNil ? 11 : 12,
                              borderBottom: "1px solid var(--ps-border-light)",
                              borderTop: s.borderTop ? "1px solid var(--ps-border)" : undefined,
                              background: finalBg,
                            }}>
                              {isNil ? "–" : renderVal(val, row.format)}
                            </td>
                          );
                        })
                    }
                  </tr>
                );

                // Breakdown sub-rows
                if (hasBreakdown && breakdownOpen) {
                  row.breakdown.forEach((b, bi) => {
                    rowResults.push(
                      <tr key={`${section.id}-${ri}-bd-${bi}`} style={{ background: "rgba(99,102,241,0.03)" }}>
                        <td style={{
                          position: "sticky", left: 0, zIndex: 1,
                          padding: `4px 16px 4px ${16 + s.indent + 24}px`,
                          fontWeight: 400, fontSize: 12,
                          color: "#6366f1",
                          background: "rgba(99,102,241,0.03)",
                          borderBottom: "1px solid rgba(99,102,241,0.08)",
                          whiteSpace: "nowrap",
                        }}>
                          {b.nav && onNavigate ? (
                            <span
                              onClick={(e) => { e.stopPropagation(); onNavigate(b.nav); }}
                              style={{ cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}
                            >{b.name}</span>
                          ) : b.name}
                          {b.isIO && <span style={{ marginLeft: 6, fontSize: 9, color: "var(--ps-text-subtle)", fontWeight: 500 }}>IO</span>}
                        </td>
                        {row.values.map((_, vi) => (
                          <td key={vi} style={{
                            padding: "4px 12px", textAlign: "right",
                            fontWeight: 400, fontSize: 12,
                            color: "#6366f1",
                            background: "rgba(99,102,241,0.03)",
                            borderBottom: "1px solid rgba(99,102,241,0.08)",
                          }}>
                            {formatNumber(b.value)}
                          </td>
                        ))}
                      </tr>
                    );
                  });
                }
                return rowResults;
              }) : []),
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
