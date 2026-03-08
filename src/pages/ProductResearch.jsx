import { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "sonner";

// ─── API HELPERS ─────────────────────────────────────────────────────────────

function mapFund(apiFund) {
  return {
    id: apiFund.id,
    provider: apiFund.provider,
    type: apiFund.fundType,
    aum: apiFund.aum,
    chantWest: apiFund.chantWestRating,
    members: apiFund.memberCount,
    esg: apiFund.hasEsg,
    schemes: {
      Superannuation: { perf: { fy1: 0, fy3: 0, fy5: 0, fy10: 0 }, fees: { admin_flat: apiFund.fees.super.adminFlat, admin_pct: apiFund.fees.super.adminPct, icr: apiFund.fees.super.icr } },
      Pension:        { perf: { fy1: 0, fy3: 0, fy5: 0, fy10: 0 }, fees: { admin_flat: apiFund.fees.pension.adminFlat, admin_pct: apiFund.fees.pension.adminPct, icr: apiFund.fees.pension.icr } },
      TTR:            { perf: { fy1: 0, fy3: 0, fy5: 0, fy10: 0 }, fees: { admin_flat: apiFund.fees.ttr.adminFlat, admin_pct: apiFund.fees.ttr.adminPct, icr: apiFund.fees.ttr.icr } },
    },
    insurance: {
      tpd: apiFund.insurance.tpdDefinition || "",
      optOut: apiFund.insurance.optOutWindow || "",
      aal: apiFund.insurance.autoAcceptanceLimit || "",
      ipWait: apiFund.insurance.ipWaitPeriod || "",
      ipBenefit: apiFund.insurance.ipBenefitPeriod || "",
    },
    options: [], // lazy-loaded
    _optionsLoaded: false,
  };
}

function mapOption(apiOption) {
  return {
    id: apiOption.id,
    name: apiOption.name,
    risk: apiOption.riskLevel,
    r1: apiOption.return1yr ?? 0,
    r3: apiOption.return3yr ?? 0,
    r5: apiOption.return5yr ?? 0,
    r10: apiOption.return10yr ?? 0,
    icr: apiOption.icr,
    alloc: apiOption.assetAllocation || {},
  };
}

async function loadFundOptions(fund, allFunds, setAllFunds) {
  if (fund._optionsLoaded) return;
  try {
    const res = await axiosInstance.get(`/funds/${fund.id}/options`);
    const options = res.data.map(mapOption);
    // Derive scheme perf from Balanced option (or first option)
    const bal = options.find(o => o.name === "Balanced") || options[0];
    if (bal) {
      const perf = { fy1: bal.r1, fy3: bal.r3, fy5: bal.r5, fy10: bal.r10 };
      setAllFunds(prev => prev.map(f => f.id === fund.id ? { ...f, options, _optionsLoaded: true, schemes: { ...f.schemes, Superannuation: { ...f.schemes.Superannuation, perf }, Pension: { ...f.schemes.Pension, perf }, TTR: { ...f.schemes.TTR, perf } } } : f));
    } else {
      setAllFunds(prev => prev.map(f => f.id === fund.id ? { ...f, options, _optionsLoaded: true } : f));
    }
  } catch (err) {
    console.error("Failed to load options for", fund.provider, err);
  }
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const ASSET_COLORS = { "Aus Equities": "#2563eb", "Int'l Equities": "#7c3aed", "Property": "#db2777", "Alternatives": "#d97706", "Fixed Interest": "#059669", "Cash": "#94a3b8" };
const CW_COLORS = { Gold: { bg: "#fef3c7", color: "#92400e" }, Silver: { bg: "#f1f5f9", color: "#475569" }, Bronze: { bg: "#fff7ed", color: "#c2410c" } };
const RISK_COLORS = { "Very High": { background: "#fee2e2", color: "#b91c1c" }, "High": { background: "#fef3c7", color: "#b45309" }, "Medium-High": { background: "#ffedd5", color: "#c2410c" }, "Medium": { background: "#fef9c3", color: "#854d0e" }, "Low-Medium": { background: "#dcfce7", color: "#166534" }, "Very Low": { background: "#f0fdf4", color: "#15803d" } };
const FUND_COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#db2777"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function blendStats(holdings) {
  if (!holdings.length) return null;
  const tot = holdings.reduce((s, h) => s + h.pct, 0) || 1;
  const w = (key) => holdings.reduce((s, h) => s + (h.option[key] || 0) * h.pct / tot, 0);
  const alloc = {};
  Object.keys(ASSET_COLORS).forEach(k => { alloc[k] = holdings.reduce((s, h) => s + ((h.option.alloc && h.option.alloc[k]) || 0) * h.pct / tot, 0); });
  return { r1: w("r1"), r3: w("r3"), r5: w("r5"), r10: w("r10"), icr: w("icr"), alloc };
}

function projectBalance(start, monthly, rate, years) {
  let v = start;
  return Array.from({ length: years + 1 }, (_, i) => { const val = Math.round(v); if (i < years) v = v * (1 + rate / 100) + monthly * 12; return val; });
}

// ─── MINI PIE ─────────────────────────────────────────────────────────────────

function PieChart({ alloc, size = 100 }) {
  const entries = Object.entries(alloc).filter(([, v]) => v > 0.5);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (!total) return <div style={{ width: size, height: size, background: "#f1f5f9", borderRadius: "50%" }} />;
  let angle = -90;
  const cx = size / 2, cy = size / 2, r = size / 2 - 3;
  const slices = entries.map(([label, val]) => { const sa = angle; angle += (val / total) * 360; return { label, sa, ea: angle }; });
  const xy = (a, rad) => [cx + rad * Math.cos(a * Math.PI / 180), cy + rad * Math.sin(a * Math.PI / 180)];
  return (
    <svg width={size} height={size}>
      {slices.map(({ label, sa, ea }) => {
        const [x1, y1] = xy(sa, r), [x2, y2] = xy(ea, r);
        return <path key={label} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${ea - sa > 180 ? 1 : 0} 1 ${x2},${y2} Z`} fill={ASSET_COLORS[label]} stroke="#fff" strokeWidth={1.5} />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.42} fill="#fff" />
    </svg>
  );
}

function AllocModal({ option, onClose }) {
  const entries = Object.entries(option.alloc).filter(([, v]) => v > 0);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "24px 28px", width: 400, boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{option.name}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Asset Allocation</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "#94a3b8", cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <PieChart alloc={option.alloc} size={140} />
          <div style={{ flex: 1 }}>
            {entries.map(([label, val]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: ASSET_COLORS[label], flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#475569", flex: 1 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>{val.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── OPTION PICKER MODAL (search → fund → options) ───────────────────────────

function OptionPickerModal({ allFunds, setAllFunds, onSelect, onClose, excludeFundId }) {
  const [search, setSearch] = useState("");
  const [selectedFund, setSelectedFund] = useState(null);
  const funds = allFunds.filter(f => f.id !== excludeFundId && f.provider.toLowerCase().includes(search.toLowerCase()));

  const handleSelectFund = async (fund) => {
    await loadFundOptions(fund, allFunds, setAllFunds);
    setSelectedFund(fund);
  };

  // Re-resolve selectedFund from allFunds to get updated options
  const resolvedFund = selectedFund ? allFunds.find(f => f.id === selectedFund.id) : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 14, width: 580, maxHeight: "75vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            {resolvedFund ? `${resolvedFund.provider} — Select Option` : "Select Fund"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {resolvedFund && <button onClick={() => setSelectedFund(null)} style={{ fontSize: 12, padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>← Back</button>}
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "#94a3b8", cursor: "pointer" }}>×</button>
          </div>
        </div>
        {!resolvedFund ? (
          <>
            <div style={{ padding: "12px 22px", borderBottom: "1px solid #f1f5f9" }}>
              <input autoFocus placeholder="Search funds..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc", color: "#1e293b", fontFamily: "inherit", outline: "none" }} />
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {funds.map(fund => (
                <div key={fund.id} onClick={() => handleSelectFund(fund)}
                  style={{ padding: "13px 22px", borderBottom: "1px solid #f8fafc", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#dbeafe,#ede9fe)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#2563eb" }}>{fund.provider[0]}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{fund.provider}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{fund.type} · {fund.options.length} options · CW {fund.chantWest} · {fund.aum}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, color: "#2563eb" }}>Select →</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ overflowY: "auto", flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["Option", "Risk", "1yr", "3yr", "5yr", "10yr", "ICR", ""].map(h => (
                    <th key={h} style={{ padding: "9px 14px", textAlign: h === "Option" || h === "Risk" ? "left" : "right", color: "#475569", fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resolvedFund.options.map(opt => (
                  <tr key={opt.name} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    onClick={() => onSelect(resolvedFund, opt)}>
                    <td style={{ padding: "10px 14px", fontWeight: 500, color: "#1e293b" }}>{opt.name}</td>
                    <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, ...RISK_COLORS[opt.risk] }}>{opt.risk}</span></td>
                    {[opt.r1, opt.r3, opt.r5, opt.r10].map((v, i) => (
                      <td key={i} style={{ padding: "10px 14px", textAlign: "right", fontFamily: "monospace", color: "#15803d", fontWeight: 500 }}>{v}%</td>
                    ))}
                    <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "monospace", color: opt.icr < 0.2 ? "#15803d" : opt.icr < 0.6 ? "#d97706" : "#dc2626" }}>{opt.icr}%</td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}><span style={{ fontSize: 11, color: "#2563eb", fontWeight: 600 }}>+ Add</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PRODUCT RESEARCH ─────────────────────────────────────────────────────────

function ProductResearchTab({ schemeType, onAddToCompare, compareList, allFunds, setAllFunds }) {
  const [selectedFund, setSelectedFund] = useState(null);
  const [activeTab, setActiveTab] = useState("performance");
  const [sortCol, setSortCol] = useState("r1");
  const [allocPopup, setAllocPopup] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  // Select first fund once loaded
  useEffect(() => {
    if (!selectedFund && allFunds.length > 0) {
      const fund = allFunds[0];
      setSelectedFund(fund);
      loadFundOptions(fund, allFunds, setAllFunds);
    }
  }, [allFunds]);

  // Re-resolve selected fund from allFunds (to pick up lazy-loaded options)
  const fund = selectedFund ? allFunds.find(f => f.id === selectedFund.id) || selectedFund : null;
  if (!fund) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading funds...</div>;

  const scheme = fund.schemes[schemeType];
  const filtered = allFunds.filter(f => (typeFilter === "All" || f.type === typeFilter) && f.provider.toLowerCase().includes(search.toLowerCase()));
  const sorted = [...fund.options].sort((a, b) => (b[sortCol] || 0) - (a[sortCol] || 0));

  const handleSelectFund = async (f) => {
    setSelectedFund(f);
    await loadFundOptions(f, allFunds, setAllFunds);
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {allocPopup && <AllocModal option={allocPopup} onClose={() => setAllocPopup(null)} />}
      {/* Sidebar */}
      <div style={{ width: 248, background: "#fff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "12px 12px 10px", borderBottom: "1px solid #f1f5f9" }}>
          <input placeholder="Search funds..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "7px 11px", fontSize: 13, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, color: "#1e293b", fontFamily: "inherit", outline: "none", marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 4 }}>
            {["All", "Industry", "Retail"].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{ flex: 1, padding: "4px 0", fontSize: 11, borderRadius: 6, border: `1px solid ${typeFilter === t ? "#bfdbfe" : "#e2e8f0"}`, background: typeFilter === t ? "#eff6ff" : "#f8fafc", color: typeFilter === t ? "#2563eb" : "#64748b", fontWeight: typeFilter === t ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {filtered.map(f => (
            <div key={f.id} onClick={() => handleSelectFund(f)}
              style={{ padding: "11px 13px", borderBottom: "1px solid #f8fafc", cursor: "pointer", background: fund.id === f.id ? "#f8fafc" : "#fff", borderLeft: `3px solid ${fund.id === f.id ? "#2563eb" : "transparent"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: fund.id === f.id ? "#1d4ed8" : "#1e293b" }}>{f.provider}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: CW_COLORS[f.chantWest]?.bg, color: CW_COLORS[f.chantWest]?.color }}>CW {f.chantWest}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{f.aum} · {f.type}</span>
                <button onClick={e => { e.stopPropagation(); onAddToCompare(f); }}
                  style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, border: `1px solid ${compareList.find(c => c.id === f.id) ? "#bfdbfe" : "#e2e8f0"}`, background: compareList.find(c => c.id === f.id) ? "#eff6ff" : "#f8fafc", color: compareList.find(c => c.id === f.id) ? "#2563eb" : "#94a3b8", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
                  {compareList.find(c => c.id === f.id) ? "✓" : "+ Compare"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Main panel */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "18px 26px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#dbeafe,#ede9fe)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, color: "#2563eb" }}>{fund.provider[0]}</div>
              <div>
                <h1 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>{fund.provider}</h1>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{fund.type} · {fund.members} members · {schemeType}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: CW_COLORS[fund.chantWest]?.bg, color: CW_COLORS[fund.chantWest]?.color }}>Chant West {fund.chantWest}</span>
              <button onClick={() => onAddToCompare(fund)} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 7, border: `1px solid ${compareList.find(f => f.id === fund.id) ? "#bfdbfe" : "#e2e8f0"}`, background: compareList.find(f => f.id === fund.id) ? "#eff6ff" : "#f8fafc", color: compareList.find(f => f.id === fund.id) ? "#2563eb" : "#64748b", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
                {compareList.find(f => f.id === fund.id) ? "✓ In Compare" : "+ Add to Compare"}
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 14 }}>
            {[["1yr", `${scheme.perf.fy1}%`], ["10yr", `${scheme.perf.fy10}%`], ["ICR", `${(scheme.fees.icr * 100).toFixed(2)}%`], ["Admin", scheme.fees.admin_flat > 0 ? `$${scheme.fees.admin_flat}/yr` : "Nil"], ["AUM", fund.aum]].map(([l, v]) => (
              <div key={l} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.4px", fontWeight: 600, marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex" }}>
            {[["performance", "Performance & Fees"], ["insurance", "Insurance"], ["documents", "Documents"]].map(([id, lbl]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ background: "none", border: "none", borderBottom: `2px solid ${activeTab === id ? "#2563eb" : "transparent"}`, color: activeTab === id ? "#2563eb" : "#94a3b8", padding: "9px 18px", fontSize: 13, fontWeight: activeTab === id ? 600 : 500, cursor: "pointer", fontFamily: "inherit" }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div style={{ padding: "20px 26px", background: "#f8fafc" }}>
          {activeTab === "performance" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Investment Options — {schemeType}</h2>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>click column header to sort</span>
              </div>
              {fund.options.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading options...</div>
              ) : (
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                        <th style={{ textAlign: "left", padding: "9px 14px", color: "#475569", fontWeight: 600, fontSize: 12 }}>Option</th>
                        <th style={{ textAlign: "left", padding: "9px 14px", color: "#475569", fontWeight: 600, fontSize: 12 }}>Risk</th>
                        {[["r1","1yr %"],["r3","3yr %"],["r5","5yr %"],["r10","10yr %"],["icr","ICR %"]].map(([col, lbl]) => (
                          <th key={col} onClick={() => setSortCol(col)} style={{ textAlign: "right", padding: "9px 13px", color: sortCol === col ? "#2563eb" : "#475569", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{lbl}{sortCol === col ? " ↓" : ""}</th>
                        ))}
                        <th style={{ textAlign: "center", padding: "9px 10px", color: "#475569", fontWeight: 600, fontSize: 12 }}>Alloc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((opt, i) => (
                        <tr key={opt.name} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 500, color: "#1e293b" }}>{opt.name}</td>
                          <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 4, ...RISK_COLORS[opt.risk] }}>{opt.risk}</span></td>
                          {["r1","r3","r5","r10"].map(col => (
                            <td key={col} style={{ padding: "10px 13px", textAlign: "right", fontFamily: "monospace", color: "#15803d", fontWeight: sortCol === col ? 700 : 500 }}>{Number(opt[col]).toFixed(2)}</td>
                          ))}
                          <td style={{ padding: "10px 13px", textAlign: "right", fontFamily: "monospace", color: opt.icr < 0.2 ? "#15803d" : opt.icr < 0.6 ? "#d97706" : "#dc2626", fontWeight: 600 }}>{Number(opt.icr).toFixed(2)}</td>
                          <td style={{ padding: "10px 10px", textAlign: "center" }}><button onClick={() => setAllocPopup(opt)} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 5, padding: "2px 7px", cursor: "pointer", fontSize: 13 }}>View</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Fee Schedule</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[["ICR (total)", `${(scheme.fees.icr * 100).toFixed(2)}% p.a.`], ["Admin Fee (flat)", scheme.fees.admin_flat > 0 ? `$${scheme.fees.admin_flat}/yr` : "Nil"], ["Admin Fee (%)", scheme.fees.admin_pct > 0 ? `${(scheme.fees.admin_pct * 100).toFixed(2)}% p.a.` : "Nil"], ["Exit Fee", "$0"]].map(([k, v]) => (
                  <div key={k} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#475569" }}>{k}</span>
                    <span style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {activeTab === "insurance" && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
              {schemeType !== "Superannuation" && <div style={{ padding: "10px 16px", background: "#fffbeb", borderBottom: "1px solid #fde68a", fontSize: 12, color: "#d97706" }}>Insurance is generally only available in Superannuation accounts.</div>}
              {[["TPD Definition", fund.insurance.tpd], ["Opt-Out Window", fund.insurance.optOut], ["Auto Acceptance Limit", fund.insurance.aal], ["IP Waiting Period", fund.insurance.ipWait], ["IP Benefit Period", fund.insurance.ipBenefit]].map(([k, v], i, arr) => (
                <div key={k} style={{ display: "flex", padding: "11px 16px", borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <span style={{ width: 200, fontSize: 13, color: "#64748b", flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 13, color: "#1e293b" }}>{v}</span>
                </div>
              ))}
            </div>
          )}
          {activeTab === "documents" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[["Product Disclosure Statement","PDS"],["Investment Guide","Guide"],["Insurance Guide","Guide"],["Application Form","Form"],["Withdrawal Form","Form"],["Binding Death Nomination","Form"]].map(([name, type]) => {
                const tc = { PDS: { background: "#dbeafe", color: "#1d4ed8" }, Guide: { background: "#ede9fe", color: "#6d28d9" }, Form: { background: "#d1fae5", color: "#065f46" } };
                return (
                  <div key={name} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 9, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, ...tc[type] }}>{type}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{name}</span>
                    </div>
                    <div style={{ display: "flex", gap: 7 }}>
                      <button style={{ fontSize: 12, padding: "5px 11px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>Email</button>
                      <button style={{ fontSize: 12, padding: "5px 11px", borderRadius: 6, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", cursor: "pointer", fontFamily: "inherit" }}>Download</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COMPARE ──────────────────────────────────────────────────────────────────

function Compare({ schemeType, compareList, setCompareList, allFunds, setAllFunds }) {
  const [section, setSection] = useState("Performance");
  const [portfolios, setPortfolios] = useState({});
  const [allocPopup, setAllocPopup] = useState(null);
  const [clientMode, setClientMode] = useState(false);
  const [balance, setBalance] = useState(250000);
  const [contrib, setContrib] = useState(1000);
  const [projYears, setProjYears] = useState(10);
  const [age, setAge] = useState(45);
  const [risk, setRisk] = useState("Medium-High");
  const [aiRec, setAiRec] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [sending, setSending] = useState(false);

  // Ensure options are loaded for all compare funds
  useEffect(() => {
    compareList.forEach(fund => {
      const resolved = allFunds.find(f => f.id === fund.id);
      if (resolved && !resolved._optionsLoaded) {
        loadFundOptions(resolved, allFunds, setAllFunds);
      }
    });
  }, [compareList, allFunds]);

  const funds = compareList.slice(0, 5).map(f => allFunds.find(af => af.id === f.id) || f);

  const getPortfolio = (fund) => portfolios[fund.id] || [];
  const setPortfolio = (fund, h) => setPortfolios(p => ({ ...p, [fund.id]: h }));
  const totalPct = (fund) => getPortfolio(fund).reduce((s, h) => s + h.pct, 0);
  const getBlended = (fund) => {
    const port = getPortfolio(fund);
    if (port.length === 0) {
      const o = fund.options.find(x => x.name === "Balanced") || fund.options[0];
      if (!o) return { r1: 0, r3: 0, r5: 0, r10: 0, icr: 0, alloc: {}, label: "No options" };
      return { r1: o.r1, r3: o.r3, r5: o.r5, r10: o.r10, icr: o.icr, alloc: o.alloc, label: o.name };
    }
    return { ...blendStats(port), label: port.length === 1 ? port[0].option.name : `${port.length} options blended` };
  };

  const calcFee = (fund) => { const s = fund.schemes[schemeType]; return Math.round(s.fees.admin_flat + s.fees.admin_pct * balance + s.fees.icr * balance); };

  const handleSendToSOA = async (fund) => {
    const port = getPortfolio(fund);
    if (port.length === 0 || totalPct(fund) !== 100) {
      toast.error("Portfolio must total 100% before sending to SOA");
      return;
    }
    setSending(true);
    try {
      await axiosInstance.post("/portfolios", {
        adviceModelId: "00000000-0000-0000-0000-000000000000", // placeholder — wire to real advice model
        investmentFundId: fund.id,
        schemeType,
        label: `${fund.provider} Portfolio`,
        holdings: port.map(h => ({ optionId: h.option.id || "00000000-0000-0000-0000-000000000000", optionName: h.option.name, weightPct: h.pct })),
      });
      toast.success(`Portfolio for ${fund.provider} sent to SOA`);
    } catch (err) {
      console.error("Failed to save portfolio:", err);
      toast.error("Failed to send portfolio to SOA");
    }
    setSending(false);
  };

  const getAIRec = async () => {
    setAiLoading(true); setAiRec("");
    const summary = funds.map(f => { const b = getBlended(f); return `${f.provider} (${b.label}): 1yr ${Number(b.r1).toFixed(2)}%, 10yr ${Number(b.r10).toFixed(2)}%, blended ICR ${Number(b.icr).toFixed(2)}%, Chant West ${f.chantWest}`; }).join("\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, system: "You are an expert Australian financial adviser. Provide concise best interest duty recommendations for superannuation. Format: 1) Recommended Fund & Portfolio, 2) Key Reasons (3 bullets), 3) Risks/Considerations. Plain text only.", messages: [{ role: "user", content: `Compare these ${schemeType} portfolios${clientMode ? ` for a client aged ${age} with $${balance.toLocaleString()} and ${risk} risk profile` : ""}:\n\n${summary}\n\nWhich would you recommend and why?` }] }) });
      const data = await res.json();
      setAiRec(data.content?.[0]?.text || "Unable to generate.");
    } catch { setAiRec("Error connecting to AI."); }
    setAiLoading(false);
  };

  if (funds.length === 0) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 40 }}>
      <div style={{ fontSize: 40 }}>⚖️</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#475569" }}>No funds in comparison</div>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>Go to Product Research and click "+ Add to Compare"</div>
    </div>
  );

  const SECTIONS = ["Performance", "Fees", "Insurance", "Options", "📊 Portfolio Builder", "✦ Recommendation"];
  const N = funds.length;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {allocPopup && <AllocModal option={allocPopup} onClose={() => setAllocPopup(null)} />}

      {/* Left nav */}
      <div style={{ width: 192, background: "#fff", borderRight: "1px solid #e2e8f0", padding: "14px 10px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 8px", marginBottom: 8 }}>Compare</div>
        {SECTIONS.map(s => (
          <button key={s} onClick={() => setSection(s)} style={{ background: section === s ? "#eff6ff" : "none", border: "none", color: section === s ? "#2563eb" : "#475569", padding: "8px 10px", borderRadius: 7, fontSize: 13, fontWeight: section === s ? 600 : 400, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>{s}</button>
        ))}

        <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 12, paddingTop: 12 }}>
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 8px", marginBottom: 8 }}>Client Context</div>
          <div style={{ padding: "0 6px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", marginBottom: 10 }}>
              <div onClick={() => setClientMode(!clientMode)} style={{ width: 30, height: 17, background: clientMode ? "#2563eb" : "#e2e8f0", borderRadius: 9, position: "relative", cursor: "pointer", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 2, left: clientMode ? 13 : 2, width: 13, height: 13, background: "#fff", borderRadius: 7, transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
              <span style={{ fontSize: 12, color: clientMode ? "#2563eb" : "#64748b", fontWeight: clientMode ? 600 : 400 }}>Client mode</span>
            </label>
            {clientMode && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[["Balance", balance, setBalance], ["Age", age, setAge], ["Monthly contrib", contrib, setContrib], ["Proj. years", projYears, setProjYears]].map(([lbl, val, set]) => (
                  <div key={lbl}>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>{lbl}</div>
                    <input type="number" value={val} onChange={e => set(Number(e.target.value))} style={{ width: "100%", padding: "5px 7px", fontSize: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, color: "#1e293b", fontFamily: "inherit", outline: "none" }} />
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>Risk Profile</div>
                  <select value={risk} onChange={e => setRisk(e.target.value)} style={{ width: "100%", padding: "5px 7px", fontSize: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, color: "#1e293b", fontFamily: "inherit", outline: "none" }}>
                    {["Very High","High","Medium-High","Medium","Low-Medium","Low"].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Fund header chips */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "12px 22px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {funds.map((fund, fi) => {
            const b = getBlended(fund);
            return (
              <div key={fund.id} style={{ background: "#f8fafc", border: `1px solid ${FUND_COLORS[fi]}30`, borderTop: `2px solid ${FUND_COLORS[fi]}`, borderRadius: 8, padding: "7px 12px", display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 24, height: 24, background: `${FUND_COLORS[fi]}18`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: FUND_COLORS[fi] }}>{fund.provider[0]}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{fund.provider.split(" ").slice(0, 2).join(" ")}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{b.label}</div>
                </div>
                <button onClick={() => setCompareList(prev => prev.filter(f => f.id !== fund.id))} style={{ color: "#cbd5e1", background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1, marginLeft: 4 }}>×</button>
              </div>
            );
          })}
          {funds.length < 5 && (
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowAddPicker(!showAddPicker)} style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", color: "#94a3b8", padding: "7px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                + Add Fund ({funds.length}/5)
              </button>
              {showAddPicker && (
                <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 6, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, width: 280, boxShadow: "0 12px 40px rgba(0,0,0,0.12)", zIndex: 50 }}>
                  <input autoFocus placeholder="Search..." value={addSearch} onChange={e => setAddSearch(e.target.value)} style={{ width: "100%", padding: "9px 13px", fontSize: 13, background: "#f8fafc", border: "none", borderBottom: "1px solid #e2e8f0", borderRadius: "10px 10px 0 0", color: "#1e293b", fontFamily: "inherit", outline: "none" }} />
                  {allFunds.filter(f => !compareList.find(c => c.id === f.id) && f.provider.toLowerCase().includes(addSearch.toLowerCase())).map(fund => (
                    <div key={fund.id} onClick={() => { setCompareList(p => [...p, fund]); setShowAddPicker(false); setAddSearch(""); }}
                      style={{ padding: "10px 13px", borderBottom: "1px solid #f8fafc", cursor: "pointer", fontSize: 13, color: "#1e293b" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                      {fund.provider}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: "20px 22px", background: "#f8fafc" }}>

          {/* ── PERFORMANCE TABLE ── */}
          {section === "Performance" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Performance Comparison</h3>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Based on portfolio/selected option per fund. Build portfolios in Portfolio Builder tab.</span>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      {["Fund", "Investment Option", "Risk", "1yr %", "3yr %", "5yr %", "10yr %", "ICR %"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: h === "Fund" || h === "Investment Option" || h === "Risk" ? "left" : "right", color: "#475569", fontWeight: 600, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {funds.map((fund, fi) => {
                      const b = getBlended(fund);
                      const port = getPortfolio(fund);
                      const riskVal = port.length === 1 ? port[0].option.risk : port.length > 1 ? "Blended" : (fund.options.find(o => o.name === "Balanced") || fund.options[0])?.risk || "—";
                      const best = (key) => Math.max(...funds.map(f => getBlended(f)[key]));
                      return (
                        <tr key={fund.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "11px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: FUND_COLORS[fi], flexShrink: 0 }} />
                              <span style={{ fontWeight: 600, color: "#1e293b" }}>{fund.provider.split(" ").slice(0,2).join(" ")}</span>
                            </div>
                          </td>
                          <td style={{ padding: "11px 14px", color: "#64748b" }}>{b.label}</td>
                          <td style={{ padding: "11px 14px" }}><span style={{ fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 4, ...RISK_COLORS[riskVal] || { background: "#f1f5f9", color: "#475569" } }}>{riskVal}</span></td>
                          {["r1","r3","r5","r10"].map(k => {
                            const isBest = b[k] === best(k);
                            return (
                              <td key={k} style={{ padding: "11px 14px", textAlign: "right", background: isBest ? "#f0fdf4" : "transparent" }}>
                                <span style={{ fontFamily: "monospace", fontWeight: isBest ? 700 : 400, color: isBest ? "#15803d" : "#1e293b" }}>{Number(b[k]).toFixed(2)}%</span>
                                {isBest && <span style={{ marginLeft: 4, fontSize: 9, background: "#dcfce7", color: "#15803d", padding: "1px 5px", borderRadius: 8, fontWeight: 700 }}>BEST</span>}
                              </td>
                            );
                          })}
                          {(() => {
                            const minIcr = Math.min(...funds.map(f => getBlended(f).icr));
                            const isBest = b.icr === minIcr;
                            return (
                              <td style={{ padding: "11px 14px", textAlign: "right", background: isBest ? "#f0fdf4" : "transparent" }}>
                                <span style={{ fontFamily: "monospace", fontWeight: isBest ? 700 : 400, color: isBest ? "#15803d" : b.icr > 0.6 ? "#dc2626" : "#1e293b" }}>{Number(b.icr).toFixed(2)}%</span>
                                {isBest && <span style={{ marginLeft: 4, fontSize: 9, background: "#dcfce7", color: "#15803d", padding: "1px 5px", borderRadius: 8, fontWeight: 700 }}>BEST</span>}
                              </td>
                            );
                          })()}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── FEES ── */}
          {section === "Fees" && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Fee Comparison</h3>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ textAlign: "left", padding: "10px 14px", color: "#475569", fontWeight: 600, fontSize: 12 }}>Fund</th>
                      <th style={{ textAlign: "right", padding: "10px 14px", color: "#475569", fontWeight: 600, fontSize: 12 }}>Blended ICR</th>
                      <th style={{ textAlign: "right", padding: "10px 14px", color: "#475569", fontWeight: 600, fontSize: 12 }}>Admin (flat)</th>
                      <th style={{ textAlign: "right", padding: "10px 14px", color: "#475569", fontWeight: 600, fontSize: 12 }}>Admin (%)</th>
                      {clientMode && <th style={{ textAlign: "right", padding: "10px 14px", color: "#475569", fontWeight: 600, fontSize: 12 }}>Total (${balance.toLocaleString()})</th>}
                      {clientMode && <th style={{ textAlign: "right", padding: "10px 14px", color: "#475569", fontWeight: 600, fontSize: 12 }}>vs Cheapest</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const minFee = clientMode ? Math.min(...funds.map(f => calcFee(f))) : 0;
                      return funds.map((fund, fi) => {
                        const s = fund.schemes[schemeType];
                        const b = getBlended(fund);
                        const totalFee = calcFee(fund);
                        const isCheapest = totalFee === minFee;
                        const minIcr = Math.min(...funds.map(f => getBlended(f).icr));
                        return (
                          <tr key={fund.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "11px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: FUND_COLORS[fi], flexShrink: 0 }} />
                                <span style={{ fontWeight: 600, color: "#1e293b" }}>{fund.provider.split(" ").slice(0,2).join(" ")}</span>
                              </div>
                            </td>
                            <td style={{ padding: "11px 14px", textAlign: "right", background: b.icr === minIcr ? "#f0fdf4" : "transparent" }}>
                              <span style={{ fontFamily: "monospace", fontWeight: b.icr === minIcr ? 700 : 400, color: b.icr === minIcr ? "#15803d" : "#1e293b" }}>{Number(b.icr).toFixed(2)}%</span>
                              {b.icr === minIcr && <span style={{ marginLeft: 4, fontSize: 9, background: "#dcfce7", color: "#15803d", padding: "1px 5px", borderRadius: 8, fontWeight: 700 }}>BEST</span>}
                            </td>
                            <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: "monospace", color: "#1e293b" }}>{s.fees.admin_flat > 0 ? `$${s.fees.admin_flat}` : "Nil"}</td>
                            <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: "monospace", color: "#1e293b" }}>{s.fees.admin_pct > 0 ? `${(s.fees.admin_pct * 100).toFixed(2)}%` : "Nil"}</td>
                            {clientMode && (
                              <td style={{ padding: "11px 14px", textAlign: "right", background: isCheapest ? "#f0fdf4" : "transparent" }}>
                                <span style={{ fontFamily: "monospace", fontWeight: isCheapest ? 700 : 400, color: isCheapest ? "#15803d" : "#1e293b" }}>${totalFee.toLocaleString()}/yr</span>
                                {isCheapest && <span style={{ marginLeft: 4, fontSize: 9, background: "#dcfce7", color: "#15803d", padding: "1px 5px", borderRadius: 8, fontWeight: 700 }}>BEST</span>}
                              </td>
                            )}
                            {clientMode && (
                              <td style={{ padding: "11px 14px", textAlign: "right", fontFamily: "monospace", color: isCheapest ? "#94a3b8" : "#dc2626" }}>
                                {isCheapest ? "—" : `+$${(totalFee - minFee).toLocaleString()}/yr`}
                              </td>
                            )}
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
              {!clientMode && <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>Enable Client Mode in the sidebar to see dollar fee comparison for a specific balance</div>}
            </div>
          )}

          {/* ── INSURANCE ── */}
          {section === "Insurance" && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Insurance Comparison</h3>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ textAlign: "left", padding: "10px 14px", color: "#475569", fontWeight: 600, fontSize: 12, width: 160 }}>Feature</th>
                      {funds.map((fund, fi) => (
                        <th key={fund.id} style={{ textAlign: "left", padding: "10px 14px", color: FUND_COLORS[fi], fontWeight: 700, fontSize: 12 }}>{fund.provider.split(" ")[0]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[["tpd","TPD Definition"],["optOut","Opt-Out Window"],["aal","Auto Acceptance"],["ipWait","IP Wait Period"],["ipBenefit","IP Benefit Period"]].map(([key, lbl]) => (
                      <tr key={key} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 14px", color: "#64748b", fontWeight: 500, background: "#fafbfc" }}>{lbl}</td>
                        {funds.map((fund) => (
                          <td key={fund.id} style={{ padding: "10px 14px", color: "#1e293b", background: key === "tpd" && fund.insurance[key]?.includes("Own") ? "#f0fdf4" : "transparent" }}>
                            <span style={{ color: key === "tpd" && fund.insurance[key]?.includes("Own") ? "#15803d" : "#1e293b", fontWeight: key === "tpd" && fund.insurance[key]?.includes("Own") ? 600 : 400 }}>{fund.insurance[key]}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── OPTIONS ── */}
          {section === "Options" && (
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Fund Overview</h3>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      {["Fund","Type","AUM","Members","# Options","ESG","Chant West"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 600, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {funds.map((fund, fi) => (
                      <tr key={fund.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: FUND_COLORS[fi], flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, color: "#1e293b" }}>{fund.provider}</span>
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px", color: "#64748b" }}>{fund.type}</td>
                        <td style={{ padding: "11px 14px", fontFamily: "monospace", color: "#1e293b" }}>{fund.aum}</td>
                        <td style={{ padding: "11px 14px", color: "#1e293b" }}>{fund.members}</td>
                        <td style={{ padding: "11px 14px", fontFamily: "monospace", color: "#1e293b" }}>{fund.options.length}</td>
                        <td style={{ padding: "11px 14px" }}><span style={{ color: fund.esg ? "#15803d" : "#dc2626", fontWeight: 600 }}>{fund.esg ? "Yes" : "No"}</span></td>
                        <td style={{ padding: "11px 14px" }}><span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: CW_COLORS[fund.chantWest]?.bg, color: CW_COLORS[fund.chantWest]?.color }}>CW {fund.chantWest}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PORTFOLIO BUILDER ── */}
          {section === "📊 Portfolio Builder" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Portfolio Builder</h3>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>Allocate across each fund's investment options. Outputs: blended asset allocation and blended fees.</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${N}, 1fr)`, gap: 14 }}>
                {funds.map((fund, fi) => {
                  const port = getPortfolio(fund);
                  const tot = totalPct(fund);
                  const stats = port.length > 0 ? blendStats(port) : null;
                  const color = FUND_COLORS[fi];
                  const pctOk = tot === 100;
                  const scheme = fund.schemes[schemeType];
                  const availableOptions = fund.options.filter(o => !port.find(h => h.option.name === o.name));

                  return (
                    <div key={fund.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: `3px solid ${color}`, borderRadius: "0 0 10px 10px" }}>
                      {/* Card header */}
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{fund.provider}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{fund.type} · CW {fund.chantWest}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                          background: pctOk ? "#f0fdf4" : tot > 100 ? "#fef2f2" : "#fffbeb",
                          color: pctOk ? "#15803d" : tot > 100 ? "#dc2626" : "#d97706",
                          border: `1px solid ${pctOk ? "#bbf7d0" : tot > 100 ? "#fecaca" : "#fde68a"}` }}>
                          {tot}%{pctOk ? " ✓" : " / 100"}
                        </span>
                      </div>

                      {/* Holdings table */}
                      <div style={{ padding: "12px 16px" }}>
                        {port.length > 0 && (
                          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10, fontSize: 13 }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <th style={{ textAlign: "left", padding: "4px 0", fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Option</th>
                                <th style={{ textAlign: "right", padding: "4px 6px", fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>ICR</th>
                                <th style={{ textAlign: "right", padding: "4px 0", fontSize: 11, color: "#94a3b8", fontWeight: 600, width: 80 }}>Allocation</th>
                                <th style={{ width: 20 }} />
                              </tr>
                            </thead>
                            <tbody>
                              {port.map((h, idx) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #f8fafc" }}>
                                  <td style={{ padding: "7px 0", color: "#1e293b", fontWeight: 500 }}>{h.option.name}</td>
                                  <td style={{ padding: "7px 6px", textAlign: "right", fontFamily: "monospace", fontSize: 12, color: h.option.icr < 0.2 ? "#15803d" : h.option.icr < 0.6 ? "#d97706" : "#dc2626" }}>{h.option.icr}%</td>
                                  <td style={{ padding: "7px 0", textAlign: "right" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                                      <input type="number" min={0} max={100} value={h.pct}
                                        onChange={e => setPortfolio(fund, port.map((x, i) => i === idx ? { ...x, pct: Math.max(0, Math.min(100, Number(e.target.value))) } : x))}
                                        style={{ width: 46, padding: "3px 6px", fontSize: 12, fontFamily: "monospace", fontWeight: 700, border: "1px solid #e2e8f0", borderRadius: 5, textAlign: "center", background: "#f8fafc", color: "#0f172a", outline: "none" }} />
                                      <span style={{ fontSize: 12, color: "#94a3b8" }}>%</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: "7px 0 7px 6px" }}>
                                    <button onClick={() => setPortfolio(fund, port.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#cbd5e1", fontSize: 15, cursor: "pointer", lineHeight: 1 }}>×</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        {/* Add option dropdown */}
                        {availableOptions.length > 0 && (
                          <select
                            value=""
                            onChange={e => {
                              const opt = fund.options.find(o => o.name === e.target.value);
                              if (!opt) return;
                              const used = port.reduce((s, h) => s + h.pct, 0);
                              setPortfolio(fund, [...port, { option: opt, pct: Math.max(0, 100 - used) }]);
                            }}
                            style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: "1px dashed #bfdbfe", borderRadius: 7, background: "#f8fbff", color: "#2563eb", fontFamily: "inherit", cursor: "pointer", outline: "none" }}>
                            <option value="">+ Add investment option…</option>
                            {availableOptions.map(o => (
                              <option key={o.name} value={o.name}>{o.name} — ICR {o.icr}% · {o.risk}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Blended output */}
                      {stats && pctOk && (
                        <div style={{ borderTop: "1px solid #f1f5f9", padding: "14px 16px", background: "#fafbfc" }}>
                          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 12 }}>Blended Result</div>
                          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                            <div style={{ flexShrink: 0 }}>
                              <PieChart alloc={stats.alloc} size={80} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>Asset Allocation</div>
                              {Object.entries(stats.alloc).filter(([, v]) => v > 0.5).map(([label, val]) => (
                                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                  <div style={{ width: 8, height: 8, borderRadius: 2, background: ASSET_COLORS[label], flexShrink: 0 }} />
                                  <span style={{ fontSize: 11, color: "#64748b", flex: 1 }}>{label}</span>
                                  <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>{val.toFixed(0)}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>Fees</div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                              <span style={{ color: "#64748b" }}>Blended ICR</span>
                              <span style={{ fontFamily: "monospace", fontWeight: 700, color: stats.icr < 0.3 ? "#15803d" : stats.icr < 0.6 ? "#d97706" : "#dc2626" }}>{stats.icr.toFixed(2)}%</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                              <span style={{ color: "#64748b" }}>Admin fee (flat)</span>
                              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>{scheme.fees.admin_flat > 0 ? `$${scheme.fees.admin_flat}/yr` : "Nil"}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                              <span style={{ color: "#64748b" }}>Admin fee (%)</span>
                              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>{scheme.fees.admin_pct > 0 ? `${(scheme.fees.admin_pct * 100).toFixed(2)}%` : "Nil"}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSendToSOA(fund)}
                            disabled={sending}
                            style={{ marginTop: 12, width: "100%", padding: "8px 14px", fontSize: 12, fontWeight: 600, border: "1px solid #bfdbfe", borderRadius: 7, background: "#eff6ff", color: "#2563eb", cursor: sending ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: sending ? 0.7 : 1 }}>
                            {sending ? "Sending..." : "+ Send to SOA"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── RECOMMENDATION ── */}
          {section === "✦ Recommendation" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Best Interest Analysis</h3>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{clientMode ? `$${balance.toLocaleString()} · age ${age} · ${risk}` : "Enable Client Mode for personalised analysis"}</div>
                </div>
                <button onClick={getAIRec} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, opacity: aiLoading ? 0.7 : 1 }}>
                  {aiLoading ? "Analysing..." : "Generate AI Recommendation"}
                </button>
              </div>
              {(aiRec || aiLoading) && (
                <div style={{ background: "#f8fbff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "18px 22px" }}>
                  <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>AI Best Interest Analysis</div>
                  {aiLoading ? <div style={{ color: "#94a3b8", fontSize: 13 }}>Generating recommendation...</div>
                    : <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{aiRec}</div>}
                  {aiRec && (
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button style={{ fontSize: 12, padding: "6px 13px", borderRadius: 7, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", cursor: "pointer", fontFamily: "inherit" }}>+ Copy to SOA</button>
                      <button style={{ fontSize: 12, padding: "6px 13px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>Export PDF</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState("research");
  const [schemeType, setSchemeType] = useState("Superannuation");
  const [compareList, setCompareList] = useState([]);
  const [allFunds, setAllFunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFunds = async () => {
      try {
        const res = await axiosInstance.get("/funds");
        setAllFunds(res.data.map(mapFund));
      } catch (err) {
        console.error("Failed to load funds:", err);
        toast.error("Failed to load investment funds");
      } finally {
        setLoading(false);
      }
    };
    loadFunds();
  }, []);

  const addToCompare = (fund) => setCompareList(prev =>
    prev.find(f => f.id === fund.id) ? prev.filter(f => f.id !== fund.id) : prev.length < 5 ? [...prev, fund] : prev
  );

  if (loading) {
    return (
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#f8fafc", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
        Loading funds...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#f8fafc", height: "100vh", display: "flex", flexDirection: "column", color: "#1e293b" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #f1f5f9; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }`}</style>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 22px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 50, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginRight: 24 }}>
            <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#2563eb,#7c3aed)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>P</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Product Research</span>
          </div>
          {[["research", "Product Research"], ["compare", `Compare${compareList.length > 0 ? ` (${compareList.length})` : ""}`]].map(([id, lbl]) => (
            <button key={id} onClick={() => setMode(id)}
              style={{ background: "none", border: "none", borderBottom: `2px solid ${mode === id ? "#2563eb" : "transparent"}`, color: mode === id ? "#2563eb" : "#64748b", padding: "0 15px", height: 50, fontSize: 13, fontWeight: mode === id ? 600 : 500, cursor: "pointer", fontFamily: "inherit" }}>
              {lbl}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 12, color: "#94a3b8", marginRight: 3 }}>Account type:</span>
          {["Superannuation", "Pension", "TTR"].map(t => (
            <button key={t} onClick={() => setSchemeType(t)}
              style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: schemeType === t ? 600 : 400, border: `1px solid ${schemeType === t ? "#bfdbfe" : "#e2e8f0"}`, background: schemeType === t ? "#eff6ff" : "#f8fafc", color: schemeType === t ? "#2563eb" : "#64748b", cursor: "pointer", fontFamily: "inherit" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        {mode === "research" && <ProductResearchTab schemeType={schemeType} onAddToCompare={addToCompare} compareList={compareList} allFunds={allFunds} setAllFunds={setAllFunds} />}
        {mode === "compare" && <Compare schemeType={schemeType} compareList={compareList} setCompareList={setCompareList} allFunds={allFunds} setAllFunds={setAllFunds} />}
      </div>
    </div>
  );
}
