import React from "react";

// ─────────────────────────────────────────────────────────────
// THEME — CSS Custom Properties for Light / Dark mode
// ─────────────────────────────────────────────────────────────
export const THEME_STYLE_ID = "ps-theme-style";
export const _psInitialDark = false;
export function injectThemeCSS(dark) {
  let el = document.getElementById(THEME_STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = THEME_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = dark ? `
    :root {
      --ps-surface: #0F172A;
      --ps-surface-input: #1E293B;
      --ps-surface-alt: #1E293B;
      --ps-surface-indigo: #1E1B4B;
      --ps-surface-green: #052E16;
      --ps-surface-emerald: #022C22;
      --ps-surface-red: #450A0A;
      --ps-surface-amber: #451A03;
      --ps-surface-purple: #2E1065;
      --ps-surface-blue: #172554;
      --ps-surface-teal: #042F2E;
      --ps-surface-orange: #431407;
      --ps-surface-sky: #0C4A6E;
      --ps-surface-violet: #2E1065;
      --ps-bg-green-200: #14532D;
      --ps-bg-red-200: #7F1D1D;
      --ps-bg-amber-200: #78350F;
      --ps-bg-indigo-200: #312E81;
      --ps-bg-blue-200: #1E3A5F;
      --ps-ring-indigo: #3730A3;
      --ps-ring-blue: #1E40AF;
      --ps-ring-green: #166534;
      --ps-ring-emerald: #065F46;
      --ps-ring-orange: #9A3412;
      --ps-ring-sky: #075985;
      --ps-ring-red: #991B1B;
      --ps-ring-amber: #92400E;
      --ps-ring-purple: #5B21B6;
      --ps-border: #334155;
      --ps-border-light: #1E293B;
      --ps-border-input: #475569;
      --ps-border-mid: #475569;
      --ps-text-strongest: #F8FAFC;
      --ps-text-primary: #F1F5F9;
      --ps-text-body: #E2E8F0;
      --ps-text-secondary: #CBD5E1;
      --ps-text-muted: #94A3B8;
      --ps-text-subtle: #64748B;
      --ps-shadow-xs: rgba(0,0,0,0.2);
      --ps-shadow-sm: rgba(0,0,0,0.3);
      --ps-shadow-md: rgba(0,0,0,0.4);
      --ps-shadow-lg: rgba(0,0,0,0.5);
      --ps-overlay: rgba(0,0,0,0.5);
      --ps-red: #F87171;
      --ps-red-bold: #FCA5A5;
      --ps-green: #34D399;
      --ps-green-bold: #6EE7B7;
      --ps-amber: #FBBF24;
      --ps-section-bg: #1a2436;
      --ps-retirement-wash: rgba(99,102,241,0.10);
      --ps-retirement-border: rgba(129,140,248,0.5);
      --ps-retirement-text: #818CF8;
      --ps-badge-green: #4ADE80;
      --ps-badge-red: #FCA5A5;
      --ps-badge-amber: #FCD34D;
      --ps-badge-blue: #93C5FD;
      --ps-badge-dark-red: #F87171;
      --ps-tile-dark: linear-gradient(135deg, #1E293B 0%, #334155 100%);
      --ps-tile-dark-text: #F1F5F9;
      --ps-tile-slate: linear-gradient(135deg, #475569 0%, #334155 100%);
      --ps-surface-cyan: #164E63;
      --ps-ring-cyan: #155E75;
      --ps-ring-red-soft: #7F1D1D;
      --ps-h1-income-bg:   #1a1f3a;
      --ps-h1-income-text: #A5B4FC;
      --ps-h1-income-border: #4F46E5;
      --ps-h1-expense-bg:  #2a1a0e;
      --ps-h1-expense-text: #FED7AA;
      --ps-h1-expense-border: #EA580C;
      --ps-h1-super-bg:    #1e1433;
      --ps-h1-super-text:  #DDD6FE;
      --ps-h1-super-border: #7C3AED;
      --ps-h1-nw-bg:       #0a2016;
      --ps-h1-nw-text:     #A7F3D0;
      --ps-h1-nw-border:   #059669;
      --ps-h1-debt-bg:     #2d0a0a;
      --ps-h1-debt-text:   #FECACA;
      --ps-h1-debt-border: #DC2626;
      --ps-h1-amb-bg:      #271a05;
      --ps-h1-amb-text:    #FDE68A;
      --ps-h1-amb-border:  #D97706;
      --ps-h1-slate-bg:    #1a2030;
      --ps-h1-slate-text:  #CBD5E1;
      --ps-h1-slate-border: #64748B;
      --ps-grand-total-bg: #0F172A;
      --ps-thead-bg: #1E293B;
      --ps-thead-text: #CBD5E1;
      color-scheme: dark;
    }
  ` : `
    :root {
      --ps-surface: #ffffff;
      --ps-surface-input: #ffffff;
      --ps-surface-alt: #F8FAFC;
      --ps-surface-indigo: #EEF2FF;
      --ps-surface-green: #F0FDF4;
      --ps-surface-emerald: #ECFDF5;
      --ps-surface-red: #FEF2F2;
      --ps-surface-amber: #FFFBEB;
      --ps-surface-purple: #F5F3FF;
      --ps-surface-blue: #EFF6FF;
      --ps-surface-teal: #F0FDFA;
      --ps-surface-orange: #FFF7ED;
      --ps-surface-sky: #F0F9FF;
      --ps-surface-violet: #FAF5FF;
      --ps-bg-green-200: #DCFCE7;
      --ps-bg-red-200: #FEE2E2;
      --ps-bg-amber-200: #FEF3C7;
      --ps-bg-indigo-200: #E0E7FF;
      --ps-bg-blue-200: #DBEAFE;
      --ps-ring-indigo: #C7D2FE;
      --ps-ring-blue: #BFDBFE;
      --ps-ring-green: #A7F3D0;
      --ps-ring-emerald: #BBF7D0;
      --ps-ring-orange: #FED7AA;
      --ps-ring-sky: #BAE6FD;
      --ps-ring-red: #FCA5A5;
      --ps-ring-amber: #FDE68A;
      --ps-ring-purple: #DDD6FE;
      --ps-border: #E2E8F0;
      --ps-border-light: #F1F5F9;
      --ps-border-input: #d1d5db;
      --ps-border-mid: #CBD5E1;
      --ps-text-strongest: #0F172A;
      --ps-text-primary: #1E293B;
      --ps-text-body: #334155;
      --ps-text-secondary: #475569;
      --ps-text-muted: #64748B;
      --ps-text-subtle: #94A3B8;
      --ps-shadow-xs: rgba(0,0,0,0.06);
      --ps-shadow-sm: rgba(0,0,0,0.08);
      --ps-shadow-md: rgba(0,0,0,0.1);
      --ps-shadow-lg: rgba(0,0,0,0.25);
      --ps-overlay: rgba(15,23,42,0.15);
      --ps-red: #DC2626;
      --ps-red-bold: #DC2626;
      --ps-green: #059669;
      --ps-green-bold: #059669;
      --ps-amber: #D97706;
      --ps-section-bg: #F8FAFC;
      --ps-retirement-wash: rgba(67,56,202,0.04);
      --ps-retirement-border: rgba(67,56,202,0.3);
      --ps-retirement-text: #6366F1;
      --ps-badge-green: #166534;
      --ps-badge-red: #991B1B;
      --ps-badge-amber: #92400E;
      --ps-badge-blue: #1D4ED8;
      --ps-badge-dark-red: #B91C1C;
      --ps-tile-dark: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      --ps-tile-dark-text: #F8FAFC;
      --ps-tile-slate: linear-gradient(135deg, #64748B 0%, #475569 100%);
      --ps-surface-cyan: #ECFEFF;
      --ps-ring-cyan: #A5F3FC;
      --ps-ring-red-soft: #FECACA;
      --ps-h1-income-bg:   #E2E5F5;
      --ps-h1-income-text: #312E81;
      --ps-h1-income-border: #4F46E5;
      --ps-h1-expense-bg:  #F5E8E0;
      --ps-h1-expense-text: #7C2D12;
      --ps-h1-expense-border: #EA580C;
      --ps-h1-super-bg:    #EDE5F5;
      --ps-h1-super-text:  #4C1D95;
      --ps-h1-super-border: #7C3AED;
      --ps-h1-nw-bg:       #E0F0EA;
      --ps-h1-nw-text:     #064E3B;
      --ps-h1-nw-border:   #059669;
      --ps-h1-debt-bg:     #F5E0E0;
      --ps-h1-debt-text:   #7F1D1D;
      --ps-h1-debt-border: #DC2626;
      --ps-h1-amb-bg:      #F5EFE0;
      --ps-h1-amb-text:    #78350F;
      --ps-h1-amb-border:  #D97706;
      --ps-h1-slate-bg:    #E8ECF2;
      --ps-h1-slate-text:  #1E293B;
      --ps-h1-slate-border: #64748B;
      --ps-grand-total-bg: #1E293B;
      --ps-thead-bg: #0F172A;
      --ps-thead-text: rgba(255,255,255,0.9);
      color-scheme: light;
    }
  `;
}
// Inject immediately at module load to prevent FOUC
injectThemeCSS(_psInitialDark);

// Shared table styles
export const T = {
  font: "'DM Sans', sans-serif",
  // Full-width table (≤6 cols)
  fullTable: { width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif" },
  // Scrollable table (7+ cols)
  scrollTable: { borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif" },
  // Outer wrapper
  wrap: { background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", overflow: "hidden" },
  scrollWrap: { background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", overflowX: "auto", overflowY: "visible" },
  // Header row
  headRow: { background: "var(--ps-surface-alt)" },
  // Header cell base
  th: { padding: "12px 18px", fontSize: 14, fontWeight: 600, color: "var(--ps-text-secondary)", borderBottom: "1px solid var(--ps-border)" },
  // Body cell base
  td: { padding: "12px 18px", fontSize: 14, borderBottom: "1px solid var(--ps-border-light)", color: "var(--ps-text-body)" },
  // Section header
  section: { padding: "12px 18px", fontWeight: 700, fontSize: 14, color: "var(--ps-text-primary)", background: "var(--ps-section-bg)", borderBottom: "1px solid var(--ps-border)", textTransform: "uppercase", letterSpacing: "0.02em", cursor: "pointer" },
  // Sticky first col for scroll tables
  stickyTh: { position: "sticky", left: 0, background: "var(--ps-surface-alt)", zIndex: 3, borderRight: "2px solid var(--ps-border)" },
  stickyTd: (bg) => ({ position: "sticky", left: 0, background: bg, zIndex: 1, borderRight: "2px solid var(--ps-border)" }),
  // Alternating row bg
  rowBg: (i) => i % 2 === 0 ? "var(--ps-surface)" : "var(--ps-surface-alt)",
  // Scroll year header cell
  yearTh: { padding: "12px 10px", fontSize: 12, fontWeight: 600, color: "var(--ps-text-secondary)", textAlign: "center", borderBottom: "1px solid var(--ps-border)", minWidth: 88, whiteSpace: "nowrap" },
  yearTd: { padding: "10px 10px", fontSize: 13, textAlign: "center", borderBottom: "1px solid var(--ps-border-light)", minWidth: 88 },
  // Collapse arrow
  arrow: (collapsed) => <span style={{ marginRight: 8, fontSize: 11, color: "var(--ps-text-subtle)" }}>{collapsed ? "▸" : "▾"}</span>,
};
