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

// Reusable Section Table component
export function SectionTable({ data, onNavigate, onToggleIndex, onCellEdit }) {
  const [collapsed, setCollapsed] = useState({});
  const [popupOpen, setPopupOpen] = useState(null); // section id or null

  function toggleSection(id) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const STYLE_MAP = {
    "header": { bg: "var(--ps-border-light)", color: "var(--ps-text-primary)", weight: 600, indent: 0 },
    "child": { bg: "var(--ps-surface)", color: "var(--ps-text-secondary)", weight: 400, indent: 24 },
    "child-negative": { bg: "var(--ps-surface)", color: "var(--ps-red)", weight: 400, indent: 24 },
    "subtotal": { bg: "var(--ps-surface-alt)", color: "var(--ps-text-body)", weight: 600, indent: 16 },
    "total": { bg: "var(--ps-surface-alt)", color: "var(--ps-text-primary)", weight: 700, indent: 0, borderTop: true },
    "highlight": { bg: "var(--ps-surface-indigo)", color: "#4338ca", weight: 700, indent: 0 },
    "current-value": { bg: "rgba(37,99,235,0.08)", color: "#2563eb", weight: 700, indent: 0 },
    "end-value": { bg: "rgba(5,150,105,0.08)", color: "var(--ps-green)", weight: 700, indent: 0 },
  };

  return (
    <div style={{ overflowX: "auto", margin: "0 -4px" }}>
      <table style={{
        width: "100%",
        borderCollapse: "separate",
        borderSpacing: 0,
        fontSize: 13,
        fontFamily: "'DM Sans', sans-serif",
        fontVariantNumeric: "tabular-nums",
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
            {data.years.map((y, i) => (
              <th key={i} style={{
                padding: "10px 12px", textAlign: "right",
                fontWeight: 600, color: "var(--ps-text-secondary)", fontSize: 12,
                borderBottom: "2px solid var(--ps-border)", minWidth: 95,
                background: "var(--ps-surface-alt)", whiteSpace: "nowrap",
              }}>{y}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.sections.map((section) => {
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
                      borderTop: "3px solid #4f46e5",
                      opacity: 0.15,
                    }} />
                  </td>
                </tr>
              );
            }
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
            return [
              // Section title row
              section.title && (
                <tr key={`title-${section.id}`}
                  onClick={() => toggleSection(section.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td colSpan={data.years.length + 1} style={{
                    padding: "12px 16px 6px",
                    fontWeight: 700,
                    fontSize: 13,
                    color: "var(--ps-text-primary)",
                    background: "var(--ps-surface)",
                    borderTop: "2px solid var(--ps-border)",
                    letterSpacing: "0.01em",
                  }}>
                    <span style={{ marginRight: 8, fontSize: 10, color: "var(--ps-text-subtle)" }}>
                      {isCollapsed ? "▸" : "▾"}
                    </span>
                    {section.title}
                    {section.entity && (
                      <span style={{ marginLeft: 10, verticalAlign: "middle" }}>
                        <EntityBadge name={section.entity} size="sm" />
                      </span>
                    )}
                    {section.isNew && (
                      <span style={{ marginLeft: 8, fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "var(--ps-bg-blue-200)", color: "#2563EB", fontWeight: 700, verticalAlign: "middle" }}>NEW</span>
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
              ),
              // Detail popup
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
              // SubSections (independently collapsible categories within a section)
              ...(!isCollapsed && section.subSections ? section.subSections.map((sub) => {
                const subCollapsed = collapsed[sub.id];
                const hasChildren = sub.rows && sub.rows.length > 0;
                const isCollapsible = sub.summaryValues !== null;
                return [
                  // Sub-section header row with summary values (only if collapsible)
                  isCollapsible && (
                  <tr key={`sub-${sub.id}`}
                    onClick={hasChildren ? () => toggleSection(sub.id) : undefined}
                    style={{ cursor: hasChildren ? "pointer" : "default", background: "var(--ps-surface-alt)" }}
                  >
                    <td style={{
                      position: "sticky", left: 0, zIndex: 1,
                      padding: "7px 16px 7px 24px",
                      fontWeight: 600,
                      color: "var(--ps-text-body)",
                      background: "var(--ps-surface-alt)",
                      borderBottom: "1px solid var(--ps-border-light)",
                      whiteSpace: "nowrap",
                      fontSize: 13,
                    }}>
                      {hasChildren && (
                        <span style={{ marginRight: 8, fontSize: 9, color: "var(--ps-text-subtle)" }}>
                          {subCollapsed ? "▸" : "▾"}
                        </span>
                      )}
                      {sub.label}
                    </td>
                    {sub.summaryValues.map((val, vi) => (
                      <td key={vi} style={{
                        padding: "7px 12px", textAlign: "right",
                        fontWeight: 600, color: val !== null ? "var(--ps-text-body)" : "var(--ps-border-input)",
                        borderBottom: "1px solid var(--ps-border-light)",
                        background: "var(--ps-surface-alt)",
                      }}>
                        {val !== null ? formatNumber(val) : "—"}
                      </td>
                    ))}
                  </tr>
                  ),
                  // Sub-section child rows (always show if not collapsible, otherwise respect collapse state)
                  ...((!isCollapsible || !subCollapsed) && hasChildren ? sub.rows.flatMap((row, ri) => {
                    const s = STYLE_MAP[row.style] || STYLE_MAP["child"];
                    const hasBreakdown = row.breakdown && row.breakdown.length > 0;
                    const breakdownOpen = collapsed[`bd-${sub.id}-${ri}`];
                    const rows = [];
                    rows.push(
                      <tr key={`${sub.id}-${ri}`} style={{ background: "var(--ps-surface)" }}>
                        <td style={{
                          position: "sticky", left: 0, zIndex: 1,
                          padding: "5px 16px 5px 48px",
                          fontWeight: 400,
                          color: "var(--ps-text-muted)",
                          background: "var(--ps-surface)",
                          borderBottom: "1px solid var(--ps-border-light)",
                          whiteSpace: "nowrap",
                          fontSize: 13,
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
                              <td key={vi} style={{ padding: "4px 8px", textAlign: "right", background: "var(--ps-surface)", borderBottom: "1px solid var(--ps-border-light)" }}>
                                {vi === 0 ? (
                                  <select
                                    value={row.currentFreq}
                                    onChange={e => onCellEdit(row.debtRef, e.target.value)}
                                    style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, border: "1px solid #6366F1", background: "var(--ps-surface-indigo)", color: "#4338CA", cursor: "pointer", fontWeight: 600 }}
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
                                padding: "5px 12px", textAlign: "right",
                                fontWeight: 400,
                                color: val !== null ? (val < 0 ? "var(--ps-red)" : "var(--ps-text-muted)") : "var(--ps-border-input)",
                                borderBottom: "1px solid var(--ps-border-light)",
                                background: "var(--ps-surface)",
                              }}>
                                {val !== null ? (row.format === "pct" ? `${val}%` : formatNumber(val)) : "—"}
                              </td>
                            ))
                        }
                      </tr>
                    );
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
              // Footer rows (totals that always show)
              ...(!isCollapsed && section.footerRows ? section.footerRows.map((row, ri) => {
                const s = STYLE_MAP[row.style] || STYLE_MAP["child"];
                return (
                  <tr key={`footer-${section.id}-${ri}`} style={{ background: s.bg }}>
                    <td style={{
                      position: "sticky", left: 0, zIndex: 1,
                      padding: `6px 16px`,
                      fontWeight: s.weight,
                      color: s.color,
                      background: s.bg,
                      borderBottom: "1px solid var(--ps-border-light)",
                      borderTop: s.borderTop ? "1px solid var(--ps-border)" : undefined,
                      whiteSpace: "nowrap",
                      fontSize: 13,
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
                                style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, border: "1px solid #6366F1", background: "var(--ps-surface-indigo)", color: "#4338CA", cursor: "pointer", fontWeight: 600 }}
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
                            color: val !== null ? (val < 0 ? "var(--ps-red)" : s.color) : "var(--ps-border-input)",
                            borderBottom: "1px solid var(--ps-border-light)",
                            borderTop: s.borderTop ? "1px solid var(--ps-border)" : undefined,
                            background: s.bg,
                          }}>
                            {val !== null ? formatNumber(val) : "—"}
                          </td>
                        ))
                    }
                  </tr>
                );
              }) : []),
              // Standard data rows (for sections without subSections)
              ...(!isCollapsed && !section.subSections && section.rows ? section.rows.flatMap((row, ri) => {
                // Section sub-header — collapsible group label
                if (row.style === "section-header") {
                  const groupKey = `grp-${section.id}-${ri}`;
                  const groupCollapsed = collapsed[groupKey];
                  // Find all rows until next section-header or end — hide them when collapsed
                  return [
                    <tr key={groupKey} onClick={() => toggleSection(groupKey)} style={{ cursor: "pointer", background: "var(--ps-surface-alt)", borderTop: "2px solid var(--ps-border)" }}>
                      <td colSpan={data.years.length + 1} style={{
                        position: "sticky", left: 0, zIndex: 1, background: "var(--ps-surface-alt)",
                        padding: "8px 16px", fontWeight: 700, fontSize: 12,
                        color: "var(--ps-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>
                        <span style={{ marginRight: 6, fontSize: 10, color: "var(--ps-text-subtle)" }}>{groupCollapsed ? "▸" : "▾"}</span>
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
                const s = STYLE_MAP[row.style] || STYLE_MAP["child"];
                const hasBreakdown = row.breakdown && row.breakdown.length > 0;
                const breakdownOpen = collapsed[`bd-${section.id}-${ri}`];
                const rows = [];
                rows.push(
                  <tr key={`${section.id}-${ri}`} style={{ background: s.bg }}>
                    <td style={{
                      position: "sticky", left: 0, zIndex: 1,
                      padding: `6px 16px 6px ${16 + s.indent}px`,
                      fontWeight: s.weight,
                      color: s.color,
                      background: s.bg,
                      borderBottom: "1px solid var(--ps-border-light)",
                      borderTop: s.borderTop ? "1px solid var(--ps-border)" : undefined,
                      whiteSpace: "nowrap",
                      fontSize: 13,
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
                                  Object.assign(el.style, { position: "fixed", zIndex: 9999, background: "var(--ps-text-primary)", color: "var(--ps-border-light)", fontSize: "11px", fontWeight: 400, borderRadius: "8px", padding: "10px 14px", width: "240px", lineHeight: 1.6, boxShadow: "0 8px 24px var(--ps-shadow-lg)", pointerEvents: "none" });
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
                              background: row.indexToggle.active ? "#059669" : "var(--ps-border-light)",
                              border: `1px solid ${row.indexToggle.active ? "#059669" : "var(--ps-border-mid)"}`,
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
                          <td key={vi} style={{ padding: "4px 6px", textAlign: "right", background: s.bg, borderBottom: "1px solid var(--ps-border-light)" }}>
                            {row.editType === "io-select" ? (
                              <select
                                value={row.ioForYear[vi] ? "1" : "2"}
                                onChange={e => onCellEdit(row.debtRef, e.target.value, "io", vi)}
                                style={{ fontSize: 10, padding: "1px 4px", borderRadius: 4, border: row.ioYearOverrides[vi] !== undefined ? "1px solid #6366F1" : "1px solid var(--ps-border-mid)", background: row.ioYearOverrides[vi] !== undefined ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: row.ioYearOverrides[vi] !== undefined ? "#4338CA" : "var(--ps-text-secondary)", cursor: "pointer", fontWeight: row.ioYearOverrides[vi] !== undefined ? 700 : 400 }}
                              >
                                {[{v:"2",l:"P & I"},{v:"1",l:"IO"}].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                              </select>
                            ) : vi === 0 ? (
                              <select
                                value={row.currentFreq}
                                onChange={e => onCellEdit(row.debtRef, e.target.value, "freq")}
                                style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, border: "1px solid #6366F1", background: "var(--ps-surface-indigo)", color: "#4338CA", cursor: "pointer", fontWeight: 600 }}
                              >
                                {[{v:"52",l:"Weekly"},{v:"26",l:"Fortnightly"},{v:"12",l:"Monthly"},{v:"4",l:"Quarterly"},{v:"1",l:"Annually"}].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                              </select>
                            ) : (
                              <span style={{ fontSize: 12, color: s.color }}>{val}</span>
                            )}
                          </td>
                        ))
                      : row.values.map((val, vi) => (
                          <td key={vi} style={{
                            padding: "6px 12px", textAlign: "right",
                            fontWeight: s.weight,
                            color: val !== null ? (val < 0 ? "var(--ps-red)" : s.color) : "var(--ps-border-input)",
                            borderBottom: "1px solid var(--ps-border-light)",
                            borderTop: s.borderTop ? "1px solid var(--ps-border)" : undefined,
                            background: s.bg,
                          }}>
                            {val !== null ? formatNumber(val) : "—"}
                          </td>
                        ))
                    }
                  </tr>
                );
                // Breakdown sub-rows
                if (hasBreakdown && breakdownOpen) {
                  row.breakdown.forEach((b, bi) => {
                    rows.push(
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
                return rows;
              }) : []),
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
