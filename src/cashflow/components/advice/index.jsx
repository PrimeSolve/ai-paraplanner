import React, { useState } from "react";
import { ffRowStyle, ffSelectStyle, FFInput, FFSelect, FFRadioRow } from "../common/FormFields.jsx";
import { STRAT_DRAWDOWN, STRAT_PORTFOLIO, STRAT_SURPLUS, STRAT_GROUPS, STRAT_OPTIONS, STRAT_YEARS, STRAT_END_YEARS, stratId, stratLbl, EMPTY_MODEL, EMPTY_STRATEGY } from "../../constants/strategyOptions.js";

export function TransactionsForm({ factFind, updateFF, updateAdvice, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab === "retirement" ? "super" : initialTab === "investment" ? "wraps" : (initialTab || "buy"));
  const [editId, setEditId] = useState(null);

  const txns = factFind.advice_request?.transactions || { buy: [], sell: [], debts: [] };
  const buyList = txns.buy || [];
  const sellList = txns.sell || [];
  const debtList = txns.debts || [];

  const save = (newTxns) => {
    updateFF("advice_request.transactions", newTxns);
    if (typeof updateAdvice === "function") updateAdvice("advice_request.transactions", newTxns);
  };

  // Owner options from principals
  const ownerOpts = [];
  const c1 = factFind.client1;
  const c2 = factFind.client2;
  const c1Name = c1 ? ((c1.first_name || "") + " " + (c1.last_name || "")).trim() || "Client 1" : null;
  const c2Name = c2 ? ((c2.first_name || "") + " " + (c2.last_name || "")).trim() || "Client 2" : null;
  // For strategy 67, build enhanced owner opts showing net salary
  const calcNetSalaryFF = (inc) => {
    const gross = parseFloat(inc?.i_gross) || 0;
    if (!gross) return 0;
    const taxable = (inc?.i_super_inc === "1") ? Math.round(gross / 1.115) : gross;
    let tax = 0;
    if (taxable <= 18200) tax = 0;
    else if (taxable <= 45000) tax = (taxable - 18200) * 0.16;
    else if (taxable <= 135000) tax = 4288 + (taxable - 45000) * 0.30;
    else if (taxable <= 190000) tax = 31288 + (taxable - 135000) * 0.37;
    else tax = 51638 + (taxable - 190000) * 0.45;
    let lito = 0;
    if (taxable <= 37500) lito = 700;
    else if (taxable <= 45000) lito = 700 - (taxable - 37500) * 0.05;
    else if (taxable <= 66667) lito = 325 - (taxable - 45000) * 0.015;
    const medicare = taxable > 26000 ? taxable * 0.02 : 0;
    return Math.round(taxable - Math.max(0, tax - lito) - medicare);
  };
  const c1Net = calcNetSalaryFF(factFind.income?.client1);
  const c2Net = calcNetSalaryFF(factFind.income?.client2);
  const fmtNet = (net, freq) => {
    if (!net) return "";
    const f = parseFloat(freq) || 26;
    const perPeriod = Math.round(net / f);
    const freqLabel = f === 52 ? "wk" : f === 26 ? "fn" : "mo";
    return ` — $${perPeriod.toLocaleString()}/${freqLabel} net`;
  };
  if (c1Name) ownerOpts.push({ value: "client1", label: c1Name, labelWithSalary: c1Name + fmtNet(c1Net, factFind.income?.client1?.i_pay_freq) });
  if (c2Name) ownerOpts.push({ value: "client2", label: c2Name, labelWithSalary: c2Name + fmtNet(c2Net, factFind.income?.client2?.i_pay_freq) });
  if (c1Name && c2Name) ownerOpts.push({ value: "joint", label: c1Name + " & " + c2Name + " (Joint)", labelWithSalary: c1Name + " & " + c2Name + " (Joint)" + (c1Net && c2Net ? ` — combined $${Math.round((c1Net + c2Net) / 12).toLocaleString()}/mo net` : "") });

  // All owner options including entities (for debts)
  const allOwnerOpts = [...ownerOpts];
  (factFind.trusts || []).forEach((t, i) => { if (t.trust_name) allOwnerOpts.push({ value: `trust_${i}`, label: t.trust_name, type: "Trust" }); });
  (factFind.companies || []).forEach((c, i) => { if (c.company_name) allOwnerOpts.push({ value: `company_${i}`, label: c.company_name, type: "Company" }); });
  (factFind.smsfs || []).forEach((s, i) => { if (s.smsf_name) allOwnerOpts.push({ value: `smsf_${i}`, label: s.smsf_name, type: "SMSF" }); });

  const getOwnerLabel = (id) => allOwnerOpts.find(o => o.value === id)?.label || ownerOpts.find(o => o.value === id)?.label || "—";

  // ── BUY ──
  const addBuy = () => { const b = { ...EMPTY_BUY, id: txnId() }; save({ ...txns, buy: [...buyList, b] }); setEditId(b.id); };
  const updateBuy = (id, f, v) => save({ ...txns, buy: buyList.map(b => b.id === id ? { ...b, [f]: v } : b) });
  const removeBuy = (id) => { save({ ...txns, buy: buyList.filter(b => b.id !== id) }); if (editId === id) setEditId(null); };

  // ── SELL ──
  const addSell = () => { const s = { ...EMPTY_SELL, id: txnId() }; save({ ...txns, sell: [...sellList, s] }); setEditId(s.id); };
  const updateSell = (id, f, v) => save({ ...txns, sell: sellList.map(s => s.id === id ? { ...s, [f]: v } : s) });
  const removeSell = (id) => { save({ ...txns, sell: sellList.filter(s => s.id !== id) }); if (editId === id) setEditId(null); };

  // ── DEBTS ──
  const addDebt = () => { const d = { ...EMPTY_DEBT, id: txnId() }; save({ ...txns, debts: [...debtList, d] }); setEditId(d.id); };
  const updateDebt = (id, f, v) => save({ ...txns, debts: debtList.map(d => d.id === id ? { ...d, [f]: v } : d) });
  const removeDebt = (id) => { save({ ...txns, debts: debtList.filter(d => d.id !== id) }); if (editId === id) setEditId(null); };

  // ── NEW SUPER PRODUCTS ──
  const superList = txns.newSuper || [];
  const addNewSuper = () => { const s = { ...EMPTY_NEW_SUPER, id: txnId(), contributions: { ...EMPTY_NEW_SUPER.contributions }, tax_components: { ...EMPTY_NEW_SUPER.tax_components }, fees: { ...EMPTY_NEW_SUPER.fees } }; save({ ...txns, newSuper: [...superList, s] }); setEditId(s.id); };
  const updateNewSuper = (id, f, v) => save({ ...txns, newSuper: superList.map(s => s.id === id ? { ...s, [f]: v } : s) });
  const updateNewSuperNested = (id, parent, f, v) => save({ ...txns, newSuper: superList.map(s => s.id === id ? { ...s, [parent]: { ...s[parent], [f]: v } } : s) });
  const removeNewSuper = (id) => { save({ ...txns, newSuper: superList.filter(s => s.id !== id) }); if (editId === id) setEditId(null); };

  // ── NEW PENSION PRODUCTS ──
  const pensionList = txns.newPension || [];
  const addNewPension = () => { const p = { ...EMPTY_NEW_PENSION, id: txnId(), tax_components: { ...EMPTY_NEW_PENSION.tax_components }, fees: { ...EMPTY_NEW_PENSION.fees } }; save({ ...txns, newPension: [...pensionList, p] }); setEditId(p.id); };
  const updateNewPension = (id, f, v) => save({ ...txns, newPension: pensionList.map(p => p.id === id ? { ...p, [f]: v } : p) });
  const updateNewPensionNested = (id, parent, f, v) => save({ ...txns, newPension: pensionList.map(p => p.id === id ? { ...p, [parent]: { ...p[parent], [f]: v } } : p) });
  const removeNewPension = (id) => { save({ ...txns, newPension: pensionList.filter(p => p.id !== id) }); if (editId === id) setEditId(null); };

  const pillTab = (id, icon, label) => (
    <button key={id} onClick={() => { setActiveTab(id); setEditId(null); }} style={{
      padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: activeTab === id ? 600 : 500, transition: "all 0.15s",
      background: activeTab === id ? "var(--ps-surface)" : "transparent", boxShadow: activeTab === id ? "0 2px 8px var(--ps-shadow-md)" : "none", color: activeTab === id ? "var(--ps-text-primary)" : "var(--ps-text-muted)",
    }}>{icon} {label}</button>
  );

  const tableHeaderStyle = { padding: "8px 10px", fontSize: 10, fontWeight: 700, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", textAlign: "left" };
  const tableCellStyle = { padding: "10px 10px", fontSize: 12, color: "var(--ps-text-body)", borderBottom: "1px solid var(--ps-border-light)" };
  const actionBtn = (onClick, color, label) => (
    <button onClick={onClick} style={{ padding: "3px 8px", borderRadius: 4, border: "none", background: "transparent", color, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{label}</button>
  );

  // Empty state
  const emptyState = (icon, title, sub, onAdd, btnLabel) => (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--ps-text-subtle)", marginBottom: 16 }}>{sub}</div>
      <button onClick={onAdd} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#D97706", color: "var(--ps-surface)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ {btnLabel}</button>
    </div>
  );

  // Detail editor wrapper
  const detailCard = (icon, title, onClose, children) => (
    <div style={{ marginTop: 12, border: "2px solid #D97706", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", background: "var(--ps-surface-amber)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-badge-amber)" }}>{icon} {title}</div>
        <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: "var(--ps-text-subtle)" }}>✕</button>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );

  // Toggle pill helper
  const togglePill = (label, active, onClick) => (
    <button onClick={onClick} style={{
      padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s",
      background: active ? "#D97706" : "var(--ps-border-light)", color: active ? "var(--ps-surface)" : "var(--ps-text-muted)",
    }}>{label}</button>
  );

  // ── EDIT PANELS ──
  const editingBuy = buyList.find(b => b.id === editId);
  const editingSell = sellList.find(s => s.id === editId);
  const editingDebt = debtList.find(d => d.id === editId);
  const editingNewSuper = superList.find(s => s.id === editId);
  const editingNewPension = pensionList.find(p => p.id === editId);
  const isProperty = editingBuy ? TXN_PROPERTY_TYPES.includes(editingBuy.asset_type) : false;

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: "inline-flex", padding: 4, background: "var(--ps-surface-alt)", borderRadius: 12, border: "1px solid var(--ps-border)", marginBottom: 16 }}>
        {initialTab === "retirement" ? (<>
          {pillTab("super", "🏦", "Super")}
          {pillTab("pension", "🏖️", "Pension")}
        </>) : initialTab === "investment" ? (<>
          {pillTab("wraps", "💼", "Wraps")}
          {pillTab("bonds", "📄", "Investment Bonds")}
        </>) : (<>
          {pillTab("buy", "🛒", "Buy")}
          {pillTab("sell", "📤", "Sell")}
          {pillTab("debts", "🏦", "Debts")}
        </>)}
      </div>

      {/* ════════ BUY TAB ════════ */}
      {activeTab === "buy" && (
        buyList.length === 0 ? emptyState("🛒", "No purchases yet", "Add assets to buy as part of this advice", addBuy, "Add Purchase") : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>Asset Purchases</div>
              <button onClick={addBuy} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#D97706", color: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Purchase</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={tableHeaderStyle}>Description</th><th style={tableHeaderStyle}>Asset Type</th><th style={tableHeaderStyle}>Owner</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Amount</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Actions</th>
              </tr></thead>
              <tbody>{buyList.map(b => (
                <tr key={b.id} style={{ background: editId === b.id ? "var(--ps-surface-amber)" : "transparent", cursor: "pointer" }} onClick={() => setEditId(editId === b.id ? null : b.id)}>
                  <td style={tableCellStyle}>{b.description || "(No description)"}</td>
                  <td style={tableCellStyle}>{txnLbl(TXN_BUY_ASSET_TYPES, b.asset_type)}</td>
                  <td style={tableCellStyle}>{getOwnerLabel(b.owner_id)}</td>
                  <td style={{ ...tableCellStyle, textAlign: "right" }}>{txnFmt(b.amount)}</td>
                  <td style={{ ...tableCellStyle, textAlign: "right" }}>{actionBtn(() => setEditId(editId === b.id ? null : b.id), "#D97706", "✎")}{actionBtn(() => { removeBuy(b.id); }, "#DC2626", "✕")}</td>
                </tr>
              ))}</tbody>
            </table>
            {editingBuy && detailCard("🛒", "Purchase Details", () => setEditId(null), (
              <div>
                <FFInput label="Description" value={editingBuy.description} onChange={v => updateBuy(editingBuy.id, "description", v)} placeholder="e.g. Purchase BHP shares" />
                <div style={ffRowStyle}>
                  <FFSelect label="New asset type" value={editingBuy.asset_type} onChange={v => updateBuy(editingBuy.id, "asset_type", v)} options={TXN_BUY_ASSET_TYPES} />
                  <FFSelect label="Ownership type" value={editingBuy.ownership_type} onChange={v => updateBuy(editingBuy.id, "ownership_type", v)} options={TXN_OWNERSHIP_TYPES} />
                </div>
                <div style={ffRowStyle}>
                  <FFSelect label="Owner" value={editingBuy.owner_id} onChange={v => updateBuy(editingBuy.id, "owner_id", v)} options={ownerOpts} />
                  <FFInput label="ASX holding" value={editingBuy.asx_code} onChange={v => updateBuy(editingBuy.id, "asx_code", v)} placeholder="e.g. BHP" />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="International stock" value={editingBuy.international_code} onChange={v => updateBuy(editingBuy.id, "international_code", v)} placeholder="e.g. AAPL" />
                  <FFInput label="APIR code" value={editingBuy.apir_code} onChange={v => updateBuy(editingBuy.id, "apir_code", v)} />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Purchase amount" value={editingBuy.amount} onChange={v => updateBuy(editingBuy.id, "amount", v)} type="number" prefix="$" />
                  <FFInput label="Purchase date" value={editingBuy.purchase_date} onChange={v => updateBuy(editingBuy.id, "purchase_date", v)} type="date" />
                </div>
                {isProperty && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-secondary)", margin: "12px 0 6px", borderTop: "1px solid var(--ps-border)", paddingTop: 10 }}>Property Details</div>
                    <div style={ffRowStyle}>
                      <FFInput label="Net rental income" value={editingBuy.rental_income} onChange={v => updateBuy(editingBuy.id, "rental_income", v)} type="number" prefix="$" />
                      <FFSelect label="Rent frequency" value={editingBuy.rent_frequency} onChange={v => updateBuy(editingBuy.id, "rent_frequency", v)} options={TXN_RENT_FREQ} />
                    </div>
                  </>
                )}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 6 }}>Is the purchase price in today's dollars?</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {togglePill("Yes", editingBuy.is_today_dollars, () => updateBuy(editingBuy.id, "is_today_dollars", true))}
                    {togglePill("No", !editingBuy.is_today_dollars, () => updateBuy(editingBuy.id, "is_today_dollars", false))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ════════ SELL TAB ════════ */}
      {activeTab === "sell" && (
        sellList.length === 0 ? emptyState("📤", "No sales yet", "Add assets to sell as part of this advice", addSell, "Add Sale") : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>Asset Sales</div>
              <button onClick={addSell} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#D97706", color: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Sale</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={tableHeaderStyle}>Asset</th><th style={tableHeaderStyle}>Entity</th><th style={tableHeaderStyle}>Year</th><th style={tableHeaderStyle}>Timing</th><th style={tableHeaderStyle}>Sell Entire?</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Amount</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Actions</th>
              </tr></thead>
              <tbody>{sellList.map(s => {
                const assetIdx = parseInt(s.asset_idx);
                const asset = !isNaN(assetIdx) ? (factFind.assets || [])[assetIdx] : null;
                const entityLabel = s.entity_type === "3" ? "Trust" : s.entity_type === "4" ? "Company" : s.entity_type === "5" ? "SMSF" : "Personal";
                return (
                <tr key={s.id} style={{ background: editId === s.id ? "var(--ps-surface-amber)" : "transparent", cursor: "pointer" }} onClick={() => setEditId(editId === s.id ? null : s.id)}>
                  <td style={{ ...tableCellStyle, fontWeight: 600 }}>{s.description || "(No description)"}</td>
                  <td style={tableCellStyle}><span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: s.entity_type === "3" ? "#EDE9FE" : s.entity_type === "4" ? "var(--ps-bg-amber-200)" : s.entity_type === "5" ? "var(--ps-bg-blue-200)" : "var(--ps-border-light)", color: s.entity_type === "3" ? "#7C3AED" : s.entity_type === "4" ? "#D97706" : s.entity_type === "5" ? "#2563EB" : "var(--ps-text-muted)", fontWeight: 600 }}>{entityLabel}</span></td>
                  <td style={tableCellStyle}>{s.sell_year || "—"}</td>
                  <td style={tableCellStyle}><span style={{ fontSize: 10, padding: "2px 5px", borderRadius: 4, background: s.sell_timing === "end" ? "var(--ps-bg-blue-200)" : "var(--ps-surface-green)", color: s.sell_timing === "end" ? "#2563EB" : "#059669", fontWeight: 600 }}>{s.sell_timing === "end" ? "End of Year" : "Start of Year"}</span></td>
                  <td style={tableCellStyle}>{s.sell_entire_amount ? "Yes" : "No"}</td>
                  <td style={{ ...tableCellStyle, textAlign: "right" }}>{s.sell_entire_amount ? (asset ? "$" + Number(asset.a_value || 0).toLocaleString() : "Full") : txnFmt(s.amount)}</td>
                  <td style={{ ...tableCellStyle, textAlign: "right" }}>{actionBtn(() => setEditId(editId === s.id ? null : s.id), "#D97706", "✎")}{actionBtn(() => removeSell(s.id), "#DC2626", "✕")}</td>
                </tr>
                );
              })}</tbody>
            </table>
            {editingSell && detailCard("📤", "Sale Details", () => setEditId(null), (
              <div>
                {/* Asset selector grouped by entity */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Select asset to sell</div>
                  <select value={editingSell.asset_idx ?? ""} onChange={e => {
                    const idx = parseInt(e.target.value);
                    const asset = (factFind.assets || [])[idx];
                    if (asset) {
                      updateSell(editingSell.id, "asset_idx", String(idx));
                      updateSell(editingSell.id, "description", asset.a_name || "");
                      updateSell(editingSell.id, "owner_id", asset.a_owner || "");
                      updateSell(editingSell.id, "entity_type", asset.a_ownType || "");
                    }
                  }} style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)" }}>
                    <option value="">— Select an asset —</option>
                    {(() => {
                      const assets = factFind.assets || [];
                      const groups = {};
                      assets.forEach((a, i) => {
                        let gLabel = "Personal";
                        if (a.a_ownType === "3") {
                          const tIdx = parseInt((a.a_owner || "").replace("trust_", ""));
                          gLabel = "🏛 Trust — " + ((factFind.trusts || [])[tIdx]?.trust_name || `Trust ${tIdx + 1}`);
                        } else if (a.a_ownType === "4") {
                          const cIdx = parseInt((a.a_owner || "").replace("company_", ""));
                          gLabel = "🏢 Company — " + ((factFind.companies || [])[cIdx]?.company_name || `Company ${cIdx + 1}`);
                        } else if (a.a_ownType === "5") {
                          gLabel = "🏦 SMSF";
                        } else if (a.a_owner === "joint") {
                          gLabel = "👫 Joint";
                        } else if (a.a_owner === "client1") {
                          gLabel = "👤 " + c1Name;
                        } else if (a.a_owner === "client2") {
                          gLabel = "👤 " + c2Name;
                        }
                        if (!groups[gLabel]) groups[gLabel] = [];
                        groups[gLabel].push({ idx: i, asset: a });
                      });
                      return Object.entries(groups).map(([label, items]) => (
                        <optgroup key={label} label={label}>
                          {items.map(({ idx, asset }) => (
                            <option key={idx} value={idx}>{asset.a_name} — ${Number(asset.a_value || 0).toLocaleString()}</option>
                          ))}
                        </optgroup>
                      ));
                    })()}
                  </select>
                </div>
                <FFInput label="Description" value={editingSell.description} onChange={v => updateSell(editingSell.id, "description", v)} placeholder="e.g. Sell Vanguard ETF" />
                <div style={ffRowStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Sell entire amount?</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {togglePill("Yes", editingSell.sell_entire_amount, () => updateSell(editingSell.id, "sell_entire_amount", true))}
                      {togglePill("No", !editingSell.sell_entire_amount, () => updateSell(editingSell.id, "sell_entire_amount", false))}
                    </div>
                  </div>
                  {!editingSell.sell_entire_amount && <FFInput label="Sell amount ($)" value={editingSell.amount} onChange={v => updateSell(editingSell.id, "amount", v)} type="number" prefix="$" />}
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Transaction costs %" value={editingSell.transaction_costs_pct} onChange={v => updateSell(editingSell.id, "transaction_costs_pct", v)} type="number" suffix="%" />
                  <FFSelect label="Sell year" value={editingSell.sell_year} onChange={v => updateSell(editingSell.id, "sell_year", v)} options={STRAT_YEARS} />
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Timing</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {togglePill("Start of Year", editingSell.sell_timing !== "end", () => updateSell(editingSell.id, "sell_timing", "start"))}
                    {togglePill("End of Year", editingSell.sell_timing === "end", () => updateSell(editingSell.id, "sell_timing", "end"))}
                  </div>
                </div>
                {/* Small Business CGT Concessions — show for company/trust owned assets */}
                {(() => {
                  const selAsset = ffAssets[parseInt(editingSell.asset_idx)];
                  const isEntityOwned = selAsset && (selAsset.a_ownType === "4" || selAsset.a_ownType === "3");
                  if (!isEntityOwned) return null;
                  return (
                    <div style={{ marginTop: 12, padding: 12, borderRadius: 8, border: "1px solid var(--ps-ring-amber)", background: "var(--ps-surface-amber)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", marginBottom: 8 }}>Small Business CGT Concessions (Div 152)</div>
                      <div style={{ marginBottom: 8 }}>
                        <FFRadioRow label="Eligible for SB concessions?" value={editingSell.sbc_eligible || ""} onChange={v => updateSell(editingSell.id, "sbc_eligible", v)}
                          options={[{ value: "1", label: "Yes" }, { value: "0", label: "No" }]} />
                      </div>
                      {editingSell.sbc_eligible === "1" && (<>
                        <div style={{ fontSize: 10, color: "#92400E", marginBottom: 6 }}>Select applicable concessions:</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {togglePill("15-Year Exemption", editingSell.sbc_15yr === "1", () => updateSell(editingSell.id, "sbc_15yr", editingSell.sbc_15yr === "1" ? "" : "1"))}
                            <span style={{ fontSize: 9, color: "var(--ps-text-muted)" }}>Owner 55+, held 15+ yrs — full exemption</span>
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {togglePill("50% Active Asset Reduction", editingSell.sbc_active_asset === "1", () => updateSell(editingSell.id, "sbc_active_asset", editingSell.sbc_active_asset === "1" ? "" : "1"))}
                            <span style={{ fontSize: 9, color: "var(--ps-text-muted)" }}>Reduces gain by 50%</span>
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {togglePill("Retirement Exemption", editingSell.sbc_retirement === "1", () => updateSell(editingSell.id, "sbc_retirement", editingSell.sbc_retirement === "1" ? "" : "1"))}
                            <span style={{ fontSize: 9, color: "var(--ps-text-muted)" }}>Up to $500K lifetime cap</span>
                          </div>
                          {editingSell.sbc_retirement === "1" && (
                            <FFInput label="Retirement exemption amount" value={editingSell.sbc_retirement_amt} onChange={v => updateSell(editingSell.id, "sbc_retirement_amt", v)} type="number" prefix="$" placeholder="Up to $500,000" />
                          )}
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {togglePill("Small Business Rollover", editingSell.sbc_rollover === "1", () => updateSell(editingSell.id, "sbc_rollover", editingSell.sbc_rollover === "1" ? "" : "1"))}
                            <span style={{ fontSize: 9, color: "var(--ps-text-muted)" }}>Defer gain — acquire replacement asset</span>
                          </div>
                        </div>
                      </>)}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )
      )}

      {/* ════════ DEBTS TAB ════════ */}
      {activeTab === "debts" && (
        debtList.length === 0 ? emptyState("🏦", "No new debts yet", "Add debts to support your recommendations", addDebt, "Add Debt") : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>New Debts</div>
              <button onClick={addDebt} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#D97706", color: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Debt</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={tableHeaderStyle}>Description</th><th style={tableHeaderStyle}>Debt Type</th><th style={tableHeaderStyle}>Owner</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Rate</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Loan Amount</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Actions</th>
              </tr></thead>
              <tbody>{debtList.map(d => (
                <tr key={d.id} style={{ background: editId === d.id ? "var(--ps-surface-amber)" : "transparent", cursor: "pointer" }} onClick={() => setEditId(editId === d.id ? null : d.id)}>
                  <td style={{ ...tableCellStyle, fontWeight: 600 }}>{d.description || "(No description)"} <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "var(--ps-bg-blue-200)", color: "#2563EB", fontWeight: 700, marginLeft: 4 }}>NEW</span></td>
                  <td style={tableCellStyle}>{txnLbl(TXN_DEBT_TYPES, d.debt_type)}</td>
                  <td style={tableCellStyle}>{getOwnerLabel(d.owner_id)}</td>
                  <td style={{ ...tableCellStyle, textAlign: "right" }}>{d.interest_rate ? d.interest_rate + "%" : "—"}</td>
                  <td style={{ ...tableCellStyle, textAlign: "right" }}>{txnFmt(d.loan_amount)}</td>
                  <td style={{ ...tableCellStyle, textAlign: "right" }}>{actionBtn(() => setEditId(editId === d.id ? null : d.id), "#D97706", "✎")}{actionBtn(() => removeDebt(d.id), "#DC2626", "✕")}</td>
                </tr>
              ))}</tbody>
            </table>
            {editingDebt && detailCard("🏦", "New Debt Details", () => setEditId(null), (
              <div>
                <FFInput label="Description" value={editingDebt.description} onChange={v => updateDebt(editingDebt.id, "description", v)} placeholder="e.g. New investment loan" />
                <div style={ffRowStyle}>
                  <FFSelect label="Debt type" value={editingDebt.debt_type} onChange={v => updateDebt(editingDebt.id, "debt_type", v)} options={TXN_DEBT_TYPES} />
                  <FFSelect label="Owner" value={editingDebt.owner_id} onChange={v => {
                    updateDebt(editingDebt.id, "owner_id", v);
                    const ownerMatch = allOwnerOpts.find(o => o.value === v);
                    if (ownerMatch?.type === "Trust") updateDebt(editingDebt.id, "entity_type", "3");
                    else if (ownerMatch?.type === "Company") updateDebt(editingDebt.id, "entity_type", "4");
                    else if (ownerMatch?.type === "SMSF") updateDebt(editingDebt.id, "entity_type", "5");
                    else updateDebt(editingDebt.id, "entity_type", "");
                  }} options={allOwnerOpts} />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Loan amount" value={editingDebt.loan_amount} onChange={v => updateDebt(editingDebt.id, "loan_amount", v)} type="number" prefix="$" />
                  <FFInput label="Interest rate %" value={editingDebt.interest_rate} onChange={v => updateDebt(editingDebt.id, "interest_rate", v)} type="number" suffix="%" />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Term of loan (years)" value={editingDebt.term_years} onChange={v => updateDebt(editingDebt.id, "term_years", v)} type="number" />
                  <FFInput label="Repayment amount" value={editingDebt.repayments} onChange={v => updateDebt(editingDebt.id, "repayments", v)} type="number" prefix="$" />
                </div>
                <div style={ffRowStyle}>
                  <FFSelect label="Repayment frequency" value={editingDebt.repayment_freq} onChange={v => updateDebt(editingDebt.id, "repayment_freq", v)} options={[{ value: "52", label: "Weekly" }, { value: "26", label: "Fortnightly" }, { value: "12", label: "Monthly" }, { value: "4", label: "Quarterly" }, { value: "1", label: "Annually" }]} />
                  <FFInput label="Establishment cost" value={editingDebt.establishment_cost} onChange={v => updateDebt(editingDebt.id, "establishment_cost", v)} type="number" prefix="$" />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Debt start date" value={editingDebt.start_date} onChange={v => updateDebt(editingDebt.id, "start_date", v)} type="date" />
                  <div />
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 6 }}>Interest only?</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {togglePill("Yes", editingDebt.is_interest_only, () => updateDebt(editingDebt.id, "is_interest_only", true))}
                      {togglePill("No", !editingDebt.is_interest_only, () => updateDebt(editingDebt.id, "is_interest_only", false))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 6 }}>Redraw available?</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {togglePill("Yes", editingDebt.is_redraw_available, () => updateDebt(editingDebt.id, "is_redraw_available", true))}
                      {togglePill("No", !editingDebt.is_redraw_available, () => updateDebt(editingDebt.id, "is_redraw_available", false))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 6 }}>Offset available?</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {togglePill("Yes", editingDebt.is_offset_available, () => updateDebt(editingDebt.id, "is_offset_available", true))}
                      {togglePill("No", !editingDebt.is_offset_available, () => updateDebt(editingDebt.id, "is_offset_available", false))}
                    </div>
                  </div>
                </div>
                {editingDebt.is_interest_only && (
                  <div style={{ marginTop: 8 }}><FFInput label="Interest only end date" value={editingDebt.interest_only_end_date} onChange={v => updateDebt(editingDebt.id, "interest_only_end_date", v)} type="date" /></div>
                )}
                {editingDebt.is_redraw_available && (
                  <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                    <FFInput label="Current Redraw Balance" value={editingDebt.redraw_balance} onChange={v => updateDebt(editingDebt.id, "redraw_balance", v)} type="number" prefix="$" placeholder="e.g. 12,500" />
                    <FFInput label="Redraw Facility Limit" value={editingDebt.redraw_limit} onChange={v => updateDebt(editingDebt.id, "redraw_limit", v)} type="number" prefix="$" placeholder="e.g. 50,000" />
                  </div>
                )}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 6 }}>Use purchase as security for this loan?</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {togglePill("Yes", editingDebt.is_purchase_security, () => updateDebt(editingDebt.id, "is_purchase_security", true))}
                    {togglePill("No", !editingDebt.is_purchase_security, () => updateDebt(editingDebt.id, "is_purchase_security", false))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ════════ SUPER TAB ════════ */}
      {activeTab === "super" && (
        superList.length === 0 ? emptyState("🏦", "No new super products yet", "Add new super fund products as part of this advice", addNewSuper, "Add Super Product") : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>New Super Products</div>
              <button onClick={addNewSuper} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#D97706", color: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Super Product</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={tableHeaderStyle}>Fund</th><th style={tableHeaderStyle}>Product</th><th style={tableHeaderStyle}>Owner</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Balance</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Actions</th>
              </tr></thead>
              <tbody>{superList.map(s => (
                <tr key={s.id} style={{ background: editId === s.id ? "var(--ps-surface-amber)" : "transparent", cursor: "pointer" }} onClick={() => setEditId(editId === s.id ? null : s.id)}>
                  <td style={{ ...tableCellStyle, fontWeight: 600 }}>{s.fund_name || "(No fund)"} <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "var(--ps-bg-blue-200)", color: "#2563EB", fontWeight: 700, marginLeft: 4 }}>NEW</span></td>
                  <td style={tableCellStyle}>{s.product || "—"}</td>
                  <td style={tableCellStyle}>{getOwnerLabel(s.owner)}</td>
                  <td style={{ ...tableCellStyle, textAlign: "right" }}>{txnFmt(s.balance)}</td>
                  <td style={{ ...tableCellStyle, textAlign: "right" }}>{actionBtn(() => setEditId(editId === s.id ? null : s.id), "#D97706", "✎")}{actionBtn(() => removeNewSuper(s.id), "#DC2626", "✕")}</td>
                </tr>
              ))}</tbody>
            </table>
            {editingNewSuper && detailCard("🏦", "New Super Product Details", () => setEditId(null), (
              <div>
                <div style={ffRowStyle}>
                  <FFInput label="Fund name" value={editingNewSuper.fund_name} onChange={v => updateNewSuper(editingNewSuper.id, "fund_name", v)} placeholder="e.g. AustralianSuper" />
                  <FFInput label="Product" value={editingNewSuper.product} onChange={v => updateNewSuper(editingNewSuper.id, "product", v)} placeholder="e.g. Balanced - MySuper" />
                </div>
                <div style={ffRowStyle}>
                  <FFSelect label="Owner" value={editingNewSuper.owner} onChange={v => updateNewSuper(editingNewSuper.id, "owner", v)} options={ownerOpts} />
                  <FFInput label="Opening balance" value={editingNewSuper.balance} onChange={v => updateNewSuper(editingNewSuper.id, "balance", v)} type="number" prefix="$" />
                </div>
                {/* SG Fund toggle — only one fund per owner can receive SG */}
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: editingNewSuper.is_sg_fund ? "var(--ps-surface-green)" : "var(--ps-surface-alt)", border: `1px solid ${editingNewSuper.is_sg_fund ? "#86EFAC" : "var(--ps-border)"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)" }}>SG / Employer Contributions Fund</div>
                    <div style={{ fontSize: 11, color: "var(--ps-text-muted)", marginTop: 2 }}>Employer super guarantee contributions will be directed to this fund. Only one fund per member can receive SG.</div>
                  </div>
                  <button
                    onClick={() => {
                      const owner = editingNewSuper.owner;
                      const newVal = !editingNewSuper.is_sg_fund;
                      // If turning ON: clear is_sg_fund from all other funds with same owner (base + advice)
                      let updatedList = superList.map(s => {
                        if (s.id === editingNewSuper.id) return { ...s, is_sg_fund: newVal };
                        // Clear SG flag from other funds with same owner when turning on
                        if (newVal && s.owner === owner) return { ...s, is_sg_fund: false };
                        return s;
                      });
                      save({ ...txns, newSuper: updatedList });
                    }}
                    style={{ padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", background: editingNewSuper.is_sg_fund ? "#16A34A" : "var(--ps-border)", color: editingNewSuper.is_sg_fund ? "var(--ps-surface)" : "var(--ps-text-muted)" }}
                  >
                    {editingNewSuper.is_sg_fund ? "✓ SG Fund" : "Set as SG Fund"}
                  </button>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)", marginTop: 14, marginBottom: 6 }}>Contributions</div>
                <div style={ffRowStyle}>
                  <FFInput label="Salary sacrifice (p.a.)" value={editingNewSuper.contributions?.salary_sacrifice} onChange={v => updateNewSuperNested(editingNewSuper.id, "contributions", "salary_sacrifice", v)} type="number" prefix="$" />
                  <FFInput label="After-tax (p.a.)" value={editingNewSuper.contributions?.after_tax} onChange={v => updateNewSuperNested(editingNewSuper.id, "contributions", "after_tax", v)} type="number" prefix="$" />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)", marginTop: 14, marginBottom: 6 }}>Tax Components</div>
                <div style={ffRowStyle}>
                  <FFInput label="Taxable portion" value={editingNewSuper.tax_components?.taxable_portion} onChange={v => updateNewSuperNested(editingNewSuper.id, "tax_components", "taxable_portion", v)} type="number" prefix="$" />
                  <FFInput label="Tax-free portion" value={editingNewSuper.tax_components?.tax_free_portion} onChange={v => updateNewSuperNested(editingNewSuper.id, "tax_components", "tax_free_portion", v)} type="number" prefix="$" />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)", marginTop: 14, marginBottom: 6 }}>Fees</div>
                <div style={ffRowStyle}>
                  <FFInput label="Admin fee (p.a.)" value={editingNewSuper.fees?.admin_fee} onChange={v => updateNewSuperNested(editingNewSuper.id, "fees", "admin_fee", v)} type="number" prefix="$" />
                  <FFInput label="Investment fee (%)" value={editingNewSuper.fees?.percent_fee} onChange={v => updateNewSuperNested(editingNewSuper.id, "fees", "percent_fee", v)} type="number" suffix="%" />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Insurance fee (p.a.)" value={editingNewSuper.fees?.insurance_fee} onChange={v => updateNewSuperNested(editingNewSuper.id, "fees", "insurance_fee", v)} type="number" prefix="$" />
                  <div />
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ════════ PENSION TAB ════════ */}
      {activeTab === "pension" && (
        pensionList.length === 0 ? emptyState("🏖️", "No new pension products yet", "Add new pension products as part of this advice", addNewPension, "Add Pension Product") : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>New Pension Products</div>
              <button onClick={addNewPension} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#D97706", color: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Pension Product</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={tableHeaderStyle}>Fund</th><th style={tableHeaderStyle}>Product</th><th style={tableHeaderStyle}>Owner</th><th style={tableHeaderStyle}>Type</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Balance</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Actions</th>
              </tr></thead>
              <tbody>{pensionList.map(p => (
                <tr key={p.id} style={{ background: editId === p.id ? "var(--ps-surface-amber)" : "transparent", cursor: "pointer" }} onClick={() => setEditId(editId === p.id ? null : p.id)}>
                  <td style={{ ...tableCellStyle, fontWeight: 600 }}>{p.fund_name || "(No fund)"} <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "var(--ps-bg-blue-200)", color: "#2563EB", fontWeight: 700, marginLeft: 4 }}>NEW</span></td>
                  <td style={tableCellStyle}>{p.product || "—"}</td>
                  <td style={tableCellStyle}>{getOwnerLabel(p.owner)}</td>
                  <td style={tableCellStyle}><span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "var(--ps-surface-orange)", color: "#D97706", fontWeight: 600 }}>{p.pension_type === "ttr" ? "TTR" : p.pension_type === "lifetime" ? "Lifetime" : "Account-Based"}</span></td>
                  <td style={{ ...tableCellStyle, textAlign: "right" }}>{txnFmt(p.balance)}</td>
                  <td style={{ ...tableCellStyle, textAlign: "right" }}>{actionBtn(() => setEditId(editId === p.id ? null : p.id), "#D97706", "✎")}{actionBtn(() => removeNewPension(p.id), "#DC2626", "✕")}</td>
                </tr>
              ))}</tbody>
            </table>
            {editingNewPension && detailCard("🏖️", "New Pension Product Details", () => setEditId(null), (
              <div>
                <div style={ffRowStyle}>
                  <FFInput label="Fund name" value={editingNewPension.fund_name} onChange={v => updateNewPension(editingNewPension.id, "fund_name", v)} placeholder="e.g. AustralianSuper" />
                  <FFInput label="Product" value={editingNewPension.product} onChange={v => updateNewPension(editingNewPension.id, "product", v)} placeholder="e.g. Balanced - Pension" />
                </div>
                <div style={ffRowStyle}>
                  <FFSelect label="Owner" value={editingNewPension.owner} onChange={v => updateNewPension(editingNewPension.id, "owner", v)} options={ownerOpts} />
                  <FFInput label="Opening balance" value={editingNewPension.balance} onChange={v => updateNewPension(editingNewPension.id, "balance", v)} type="number" prefix="$" />
                </div>
                <div style={ffRowStyle}>
                  <FFSelect label="Pension type" value={editingNewPension.pension_type} onChange={v => updateNewPension(editingNewPension.id, "pension_type", v)} options={[{ value: "account-based", label: "Account-Based Pension" }, { value: "ttr", label: "Transition to Retirement (TTR)" }, { value: "lifetime", label: "Lifetime Pension" }]} />
                  <FFSelect label="Drawdown type" value={editingNewPension.drawdown_type} onChange={v => updateNewPension(editingNewPension.id, "drawdown_type", v)} options={[{ value: "percentage", label: "Percentage" }, { value: "dollar", label: "Dollar Amount" }]} />
                </div>
                <div style={ffRowStyle}>
                  {editingNewPension.drawdown_type === "percentage" ? (
                    <FFInput label="Drawdown rate (%)" value={editingNewPension.drawdown_rate} onChange={v => updateNewPension(editingNewPension.id, "drawdown_rate", v)} type="number" suffix="%" />
                  ) : (
                    <FFInput label="Drawdown amount (p.a.)" value={editingNewPension.drawdown_amount} onChange={v => updateNewPension(editingNewPension.id, "drawdown_amount", v)} type="number" prefix="$" />
                  )}
                  <FFSelect label="Drawdown frequency" value={editingNewPension.drawdown_frequency} onChange={v => updateNewPension(editingNewPension.id, "drawdown_frequency", v)} options={[{ value: "monthly", label: "Monthly" }, { value: "quarterly", label: "Quarterly" }, { value: "annually", label: "Annually" }]} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)", marginTop: 14, marginBottom: 6 }}>Tax Components</div>
                <div style={ffRowStyle}>
                  <FFInput label="Taxable portion" value={editingNewPension.tax_components?.taxable_portion} onChange={v => updateNewPensionNested(editingNewPension.id, "tax_components", "taxable_portion", v)} type="number" prefix="$" />
                  <FFInput label="Tax-free portion" value={editingNewPension.tax_components?.tax_free_portion} onChange={v => updateNewPensionNested(editingNewPension.id, "tax_components", "tax_free_portion", v)} type="number" prefix="$" />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)", marginTop: 14, marginBottom: 6 }}>Fees</div>
                <div style={ffRowStyle}>
                  <FFInput label="Admin fee (p.a.)" value={editingNewPension.fees?.admin_fee} onChange={v => updateNewPensionNested(editingNewPension.id, "fees", "admin_fee", v)} type="number" prefix="$" />
                  <FFInput label="Investment fee (%)" value={editingNewPension.fees?.percent_fee} onChange={v => updateNewPensionNested(editingNewPension.id, "fees", "percent_fee", v)} type="number" suffix="%" />
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ════════ WRAPS TAB ════════ */}
      {activeTab === "wraps" && (
        (() => {
          const wrapList = txns.newWraps || [];
          const addWrap = () => { const w = { id: txnId(), platform_name: "", product: "", owner: "", balance: "", fees: { admin_fee: "", percent_fee: "" }, portfolio: [] }; save({ ...txns, newWraps: [...wrapList, w] }); setEditId(w.id); };
          const updateWrap = (id, f, v) => save({ ...txns, newWraps: wrapList.map(w => w.id === id ? { ...w, [f]: v } : w) });
          const updateWrapNested = (id, p, f, v) => save({ ...txns, newWraps: wrapList.map(w => w.id === id ? { ...w, [p]: { ...w[p], [f]: v } } : w) });
          const removeWrap = (id) => { save({ ...txns, newWraps: wrapList.filter(w => w.id !== id) }); if (editId === id) setEditId(null); };
          const editW = wrapList.find(w => w.id === editId);
          return wrapList.length === 0 ? emptyState("💼", "No new wrap accounts yet", "Add new wrap/platform accounts as part of this advice", addWrap, "Add Wrap") : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>New Wrap Accounts</div>
                <button onClick={addWrap} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#D97706", color: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Wrap</button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={tableHeaderStyle}>Platform</th><th style={tableHeaderStyle}>Product</th><th style={tableHeaderStyle}>Owner</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Balance</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Actions</th></tr></thead>
                <tbody>{wrapList.map(w => (
                  <tr key={w.id} style={{ background: editId === w.id ? "var(--ps-surface-amber)" : "transparent", cursor: "pointer" }} onClick={() => setEditId(editId === w.id ? null : w.id)}>
                    <td style={{ ...tableCellStyle, fontWeight: 600 }}>{w.platform_name || "(No platform)"} <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "var(--ps-bg-blue-200)", color: "#2563EB", fontWeight: 700, marginLeft: 4 }}>NEW</span></td>
                    <td style={tableCellStyle}>{w.product || "—"}</td>
                    <td style={tableCellStyle}>{getOwnerLabel(w.owner)}</td>
                    <td style={{ ...tableCellStyle, textAlign: "right" }}>{txnFmt(w.balance)}</td>
                    <td style={{ ...tableCellStyle, textAlign: "right" }}>{actionBtn(() => setEditId(editId === w.id ? null : w.id), "#D97706", "✎")}{actionBtn(() => removeWrap(w.id), "#DC2626", "✕")}</td>
                  </tr>
                ))}</tbody>
              </table>
              {editW && detailCard("💼", "New Wrap Details", () => setEditId(null), (
                <div>
                  <div style={ffRowStyle}>
                    <FFInput label="Platform name" value={editW.platform_name} onChange={v => updateWrap(editW.id, "platform_name", v)} placeholder="e.g. Netwealth, HUB24" />
                    <FFInput label="Product" value={editW.product} onChange={v => updateWrap(editW.id, "product", v)} placeholder="e.g. Super & Pension Wrap" />
                  </div>
                  <div style={ffRowStyle}>
                    <FFSelect label="Owner" value={editW.owner} onChange={v => updateWrap(editW.id, "owner", v)} options={ownerOpts} />
                    <FFInput label="Opening balance" value={editW.balance} onChange={v => updateWrap(editW.id, "balance", v)} type="number" prefix="$" />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)", marginTop: 14, marginBottom: 6 }}>Fees</div>
                  <div style={ffRowStyle}>
                    <FFInput label="Admin fee (p.a.)" value={editW.fees?.admin_fee} onChange={v => updateWrapNested(editW.id, "fees", "admin_fee", v)} type="number" prefix="$" />
                    <FFInput label="Investment fee (%)" value={editW.fees?.percent_fee} onChange={v => updateWrapNested(editW.id, "fees", "percent_fee", v)} type="number" suffix="%" />
                  </div>
                </div>
              ))}
            </div>
          );
        })()
      )}

      {/* ════════ BONDS TAB ════════ */}
      {activeTab === "bonds" && (
        (() => {
          const bondList = txns.newBonds || [];
          const addBond = () => { const b = { id: txnId(), issuer: "", product: "", owner: "", balance: "", maturity_date: "", interest_rate: "" }; save({ ...txns, newBonds: [...bondList, b] }); setEditId(b.id); };
          const updateBond = (id, f, v) => save({ ...txns, newBonds: bondList.map(b => b.id === id ? { ...b, [f]: v } : b) });
          const removeBond = (id) => { save({ ...txns, newBonds: bondList.filter(b => b.id !== id) }); if (editId === id) setEditId(null); };
          const editB = bondList.find(b => b.id === editId);
          return bondList.length === 0 ? emptyState("📄", "No new investment bonds yet", "Add new investment bonds as part of this advice", addBond, "Add Investment Bond") : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>New Investment Bonds</div>
                <button onClick={addBond} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#D97706", color: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Bond</button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={tableHeaderStyle}>Issuer</th><th style={tableHeaderStyle}>Product</th><th style={tableHeaderStyle}>Owner</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Balance</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Actions</th></tr></thead>
                <tbody>{bondList.map(b => (
                  <tr key={b.id} style={{ background: editId === b.id ? "var(--ps-surface-amber)" : "transparent", cursor: "pointer" }} onClick={() => setEditId(editId === b.id ? null : b.id)}>
                    <td style={{ ...tableCellStyle, fontWeight: 600 }}>{b.issuer || "(No issuer)"} <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "var(--ps-bg-blue-200)", color: "#2563EB", fontWeight: 700, marginLeft: 4 }}>NEW</span></td>
                    <td style={tableCellStyle}>{b.product || "—"}</td>
                    <td style={tableCellStyle}>{getOwnerLabel(b.owner)}</td>
                    <td style={{ ...tableCellStyle, textAlign: "right" }}>{txnFmt(b.balance)}</td>
                    <td style={{ ...tableCellStyle, textAlign: "right" }}>{actionBtn(() => setEditId(editId === b.id ? null : b.id), "#D97706", "✎")}{actionBtn(() => removeBond(b.id), "#DC2626", "✕")}</td>
                  </tr>
                ))}</tbody>
              </table>
              {editB && detailCard("📄", "New Investment Bond Details", () => setEditId(null), (
                <div>
                  <div style={ffRowStyle}>
                    <FFInput label="Issuer" value={editB.issuer} onChange={v => updateBond(editB.id, "issuer", v)} placeholder="e.g. Australian Unity" />
                    <FFInput label="Product" value={editB.product} onChange={v => updateBond(editB.id, "product", v)} placeholder="e.g. Growth Bond" />
                  </div>
                  <div style={ffRowStyle}>
                    <FFSelect label="Owner" value={editB.owner} onChange={v => updateBond(editB.id, "owner", v)} options={ownerOpts} />
                    <FFInput label="Opening balance" value={editB.balance} onChange={v => updateBond(editB.id, "balance", v)} type="number" prefix="$" />
                  </div>
                  <div style={ffRowStyle}>
                    <FFInput label="Maturity date" value={editB.maturity_date} onChange={v => updateBond(editB.id, "maturity_date", v)} type="date" />
                    <FFInput label="Interest rate (%)" value={editB.interest_rate} onChange={v => updateBond(editB.id, "interest_rate", v)} type="number" suffix="%" />
                  </div>
                </div>
              ))}
            </div>
          );
        })()
      )}
    </div>
  );
}

// ===========================================================================
// ADVICE — Product Replacement / Rollovers Form
// ===========================================================================
export function ProductReplacementForm({ factFind, updateFF, updateAdvice }) {
  const [editId, setEditId] = useState(null);

  const txns = factFind.advice_request?.transactions || {};
  const rollovers = txns.rollovers || [];
  const startYear = (() => { const now = new Date(); return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1; })();
  const inflRate = 0.03; // default growth assumption for projections

  const save = (newRollovers) => {
    const newTxns = { ...txns, rollovers: newRollovers };
    updateFF("advice_request.transactions", newTxns);
    if (typeof updateAdvice === "function") updateAdvice("advice_request.transactions", newTxns);
  };

  // Helper to get fund data for projection
  const getFundData = (id) => {
    const superMatch = id?.match(/^super_(\d+)$/);
    if (superMatch) {
      const sp = (factFind.superProducts || [])[parseInt(superMatch[1])];
      if (!sp) return null;
      const bal = parseFloat(sp.balance) || 0;
      const sgRate = 0.115; // current SG rate
      const owner = sp.owner;
      const cl = owner === "client1" ? factFind.client1 : factFind.client2;
      const salary = parseFloat(cl?.employment?.salary) || parseFloat(cl?.employment?.income) || 0;
      const sg = salary * sgRate;
      const ss = parseFloat(sp.contributions?.salary_sacrifice) || 0;
      const at = parseFloat(sp.contributions?.after_tax) || 0;
      const adminFee = parseFloat(sp.fees?.admin_fee) || 0;
      const pctFee = (parseFloat(sp.fees?.percent_fee) || 0) / 100;
      const insFee = parseFloat(sp.fees?.insurance_fee) || 0;
      const growthRate = 0.07; // balanced default
      return { bal, sg, ss, at, adminFee, pctFee, insFee, growthRate };
    }
    const penMatch = id?.match(/^pension_(\d+)$/);
    if (penMatch) {
      const pen = (factFind.pensions || [])[parseInt(penMatch[1])];
      if (!pen) return null;
      const bal = parseFloat(pen.balance) || 0;
      const drawRate = (parseFloat(pen.drawdown_rate) || 5) / 100;
      const adminFee = parseFloat(pen.fees?.admin_fee) || 0;
      const pctFee = (parseFloat(pen.fees?.percent_fee) || 0) / 100;
      const growthRate = 0.06;
      return { bal, sg: 0, ss: 0, at: 0, adminFee, pctFee, insFee: 0, growthRate, drawRate };
    }
    return null;
  };

  // Project balance forward N years
  const projectBalance = (fundId, years) => {
    const fd = getFundData(fundId);
    if (!fd) {
      // Fallback: just return current balance
      const opt = productOpts.find(o => o.value === fundId);
      return parseFloat(opt?.balance) || 0;
    }
    let running = fd.bal;
    for (let y = 0; y < years; y++) {
      const totalContribs = fd.sg + fd.ss + fd.at;
      const contribTax = fd.ss * 0.15 + (fd.sg > 0 ? fd.sg * 0.15 : 0); // 15% contributions tax
      const netContribs = totalContribs - contribTax;
      running += netContribs;
      const growth = running * fd.growthRate;
      running += growth;
      const fees = fd.adminFee + (running * fd.pctFee) + fd.insFee;
      running -= fees;
      if (fd.drawRate) running -= running * fd.drawRate;
      running = Math.max(0, running);
    }
    return Math.round(running);
  };

  // Build list of all existing + new products
  const productOpts = [];
  (factFind.superProducts || []).forEach((s, i) => {
    const cl = (s.owner === "client1" || !s.owner) ? factFind.client1 : factFind.client2;
    const name = ((cl?.first_name || "") + " " + (cl?.last_name || "")).trim();
    productOpts.push({ value: `super_${i}`, label: `${s.fund_name || "Super"} — ${s.product || ""} (${name})`.trim(), balance: s.balance, type: "Super", owner: s.owner || "client1" });
  });
  (factFind.pensions || []).forEach((p, i) => {
    const cl = (p.owner === "client1" || !p.owner) ? factFind.client1 : factFind.client2;
    const name = ((cl?.first_name || "") + " " + (cl?.last_name || "")).trim();
    productOpts.push({ value: `pension_${i}`, label: `${p.fund_name || "Pension"} — ${p.product || ""} (${name})`.trim(), balance: p.balance, type: "Pension", owner: p.owner });
  });
  (txns.newSuper || []).forEach(s => {
    const ownerOpt = (s.owner === "client1" || !s.owner) ? factFind.client1 : factFind.client2;
    const name = ((ownerOpt?.first_name || "") + " " + (ownerOpt?.last_name || "")).trim();
    productOpts.push({ value: `new_super_${s.id}`, label: `${s.fund_name || "New Super"} — ${s.product || ""} (${name}) ⬥ NEW`.trim(), balance: s.balance, type: "Super", isNew: true, owner: s.owner || "client1" });
  });
  (txns.newPension || []).forEach(p => {
    const ownerOpt = (p.owner === "client1" || !p.owner) ? factFind.client1 : factFind.client2;
    const name = ((ownerOpt?.first_name || "") + " " + (ownerOpt?.last_name || "")).trim();
    productOpts.push({ value: `new_pension_${p.id}`, label: `${p.fund_name || "New Pension"} — ${p.product || ""} (${name}) ⬥ NEW`.trim(), balance: p.balance, type: "Pension", isNew: true, owner: p.owner });
  });
  (factFind.wraps || []).forEach((w, i) => {
    const cl = w.owner === "client1" ? factFind.client1 : factFind.client2;
    const name = ((cl?.first_name || "") + " " + (cl?.last_name || "")).trim();
    productOpts.push({ value: `wrap_${i}`, label: `${w.platform_name || "Wrap"} — ${w.product || ""} (${name})`.trim(), balance: w.balance, type: "Wrap", owner: w.owner });
  });

  const getProductLabel = (id) => productOpts.find(o => o.value === id)?.label || "—";

  // Build year options
  const yearOpts = Array.from({ length: 15 }, (_, i) => ({ value: String(startYear + i), label: `${startYear + i}/${String(startYear + i + 1).slice(-2)} (Year ${i + 1})` }));

  const addRollover = () => { const r = { id: txnId(), owner_id: "client1", rollout_fund: "", rollin_fund: "", rollover_entire: true, amount_type: "dollar", amount: "", amount_pct: "", rollover_date: "", rollover_year: String(startYear), transfer_contributions: false }; save([...rollovers, r]); setEditId(r.id); };
  const updateRollover = (id, f, v) => save(rollovers.map(r => r.id === id ? { ...r, [f]: v } : r));
  const removeRollover = (id) => { save(rollovers.filter(r => r.id !== id)); if (editId === id) setEditId(null); };

  // Get contribution details from a fund ref
  const getContribsFromFundRef = (fundRef) => {
    const superMatch = fundRef?.match(/^super_(\d+)$/);
    if (superMatch) {
      const sp = (factFind.superProducts || [])[parseInt(superMatch[1])];
      if (!sp) return null;
      return {
        salary_sacrifice: sp.contributions?.salary_sacrifice || "",
        salary_sacrifice_indexed: sp.contributions?.salary_sacrifice_indexed || false,
        after_tax: sp.contributions?.after_tax || "",
        after_tax_indexed: sp.contributions?.after_tax_indexed || false,
        spouse_received: sp.contributions?.spouse_received || "",
        spouse_received_indexed: sp.contributions?.spouse_received_indexed || false,
        split_out_pct: sp.contributions?.split_out_pct || "",
        is_sg_fund: sp.is_sg_fund || false,
        fundName: `${sp.fund_name} — ${sp.product}`,
      };
    }
    const newSuperMatch = fundRef?.match(/^new_super_(.+)$/);
    if (newSuperMatch) {
      const s = (txns.newSuper || []).find(s => s.id === newSuperMatch[1]);
      if (!s) return null;
      return {
        salary_sacrifice: s.contributions?.salary_sacrifice || "",
        salary_sacrifice_indexed: s.contributions?.salary_sacrifice_indexed || false,
        after_tax: s.contributions?.after_tax || "",
        after_tax_indexed: s.contributions?.after_tax_indexed || false,
        spouse_received: s.contributions?.spouse_received || "",
        spouse_received_indexed: s.contributions?.spouse_received_indexed || false,
        split_out_pct: s.contributions?.split_out_pct || "",
        is_sg_fund: s.is_sg_fund || false,
        fundName: `${s.fund_name} — ${s.product}`,
      };
    }
    return null;
  };

  // Apply contribution transfer: copy contributions from roll-out to roll-in fund
  // The roll-out fund's contributions are NOT wiped from stored data — the engine
  // handles stopping them at the rollover year based on transfer_contributions flag
  const applyContribTransfer = (rollover) => {
    const src = getContribsFromFundRef(rollover.rollout_fund);
    if (!src) return;

    const rollYear = rollover.rollover_year || String(new Date().getFullYear());
    const owner = rollover.owner_id || src.owner || (() => {
      const sm = rollover.rollout_fund?.match(/^super_(\d+)$/);
      if (sm) return (factFind.superProducts || [])[parseInt(sm[1])]?.owner || "client1";
      const nsm = rollover.rollout_fund?.match(/^new_super_(.+)$/);
      if (nsm) return (txns.newSuper || []).find(s => s.id === nsm[1])?.owner || "client1";
      return "client1";
    })();

    // Calculate SS eligibility end year = min(retirement year, year client turns 75)
    // Salary sacrifice stops at the earlier of retirement or age 75 (ATO concessional contribution rule)
    const calcSsEndYear = () => {
      const clientData = owner === "client1" ? factFind.client1 : factFind.client2;
      const retAge = parseFloat(factFind.advice_reason?.quick?.[owner]?.ret_age) || 67;
      const dob = clientData?.date_of_birth;
      const currentCalYear = new Date().getFullYear();

      let retYear = parseInt(rollYear) + 40; // fallback far future
      let age75Year = parseInt(rollYear) + 40;

      if (dob) {
        const dobDate = new Date(dob);
        const birthYear = dobDate.getFullYear();
        const birthMonth = dobDate.getMonth(); // 0-indexed
        // Age at start of rollYear FY (FY starts July 1)
        const fyStartYear = parseInt(rollYear);
        const ageAtRollYear = fyStartYear - birthYear - (birthMonth >= 6 ? 0 : 1);
        const currentAge = currentCalYear - birthYear - (new Date().getMonth() >= birthMonth ? 0 : 1);

        // Year they reach retirement age
        const yearsToRet = Math.max(0, retAge - currentAge);
        retYear = currentCalYear + yearsToRet;

        // Year they turn 75 — SS contributions must stop
        const yearsTo75 = Math.max(0, 75 - currentAge);
        age75Year = currentCalYear + yearsTo75;
      } else {
        // No DOB — use retirement age from rollover year as proxy
        retYear = parseInt(rollYear) + Math.max(0, retAge - 60);
        age75Year = parseInt(rollYear) + 15; // rough estimate
      }

      const ssEligEndYear = Math.min(retYear, age75Year);
      // Convert to FY string matching STRAT_YEARS format (just the calendar year)
      return String(ssEligEndYear);
    };

    const ssEndYear = calcSsEndYear();

    // NCC end year: age 75 (no work test required under 75, but NCCs prohibited at 75+)
    const calcNccEndYear = () => {
      const clientData = owner === "client1" ? factFind.client1 : factFind.client2;
      const dob = clientData?.date_of_birth;
      const currentCalYear = new Date().getFullYear();
      if (dob) {
        const birthYear = new Date(dob).getFullYear();
        const currentAge = currentCalYear - birthYear;
        return String(currentCalYear + Math.max(0, 75 - currentAge));
      }
      return String(parseInt(rollYear) + 15);
    };
    const nccEndYear = calcNccEndYear();

    // Contribution split end year: same as SS (needs gainful employment)
    const splitEndYear = ssEndYear;

    // Spouse contribution end year: receiving spouse must be under 75, contributing spouse under 75
    // Use the more conservative of the two — both need to be under 75
    const calcSpouseEndYear = () => {
      const otherOwner = owner === "client1" ? "client2" : "client1";
      const clientData = factFind[otherOwner]; // contributing spouse
      const dob = clientData?.date_of_birth;
      const currentCalYear = new Date().getFullYear();
      if (dob) {
        const birthYear = new Date(dob).getFullYear();
        const currentAge = currentCalYear - birthYear;
        return String(currentCalYear + Math.max(0, 75 - currentAge));
      }
      return nccEndYear;
    };
    const spouseEndYear = calcSpouseEndYear();

    // Build strategy entries
    const newStrategies = [];

    // Salary sacrifice → strategy 101
    const ss = parseFloat(src.salary_sacrifice) || 0;
    if (ss > 0) {
      const retAge = parseFloat(factFind.advice_reason?.quick?.[owner]?.ret_age) || 67;
      newStrategies.push({
        ...EMPTY_STRATEGY,
        id: "str_xfr_ss_" + rollover.id,
        strategy_id: "101",
        owner_id: owner,
        start_year: rollYear,
        end_year: ssEndYear,
        amount: String(ss),
        notes: `Salary sacrifice transferred from ${src.fundName}. Ends at earlier of retirement (age ${retAge}) or age 75.${src.salary_sacrifice_indexed ? " (was CPI indexed)" : ""}`,
      });
    }

    // NCC (after-tax) → strategy 55
    const at = parseFloat(src.after_tax) || 0;
    if (at > 0) {
      newStrategies.push({
        ...EMPTY_STRATEGY,
        id: "str_xfr_ncc_" + rollover.id,
        strategy_id: "55",
        owner_id: owner,
        start_year: rollYear,
        end_year: nccEndYear,
        amount: String(at),
        notes: `Non-concessional contribution transferred from ${src.fundName}. Stops at age 75.${src.after_tax_indexed ? " (was CPI indexed)" : ""}`,
      });
    }

    // Spouse contribution → strategy 109s (on receiving spouse = owner)
    const spouse = parseFloat(src.spouse_received) || 0;
    if (spouse > 0) {
      newStrategies.push({
        ...EMPTY_STRATEGY,
        id: "str_xfr_spouse_" + rollover.id,
        strategy_id: "109s",
        owner_id: owner,
        start_year: rollYear,
        end_year: spouseEndYear,
        amount: String(spouse),
        notes: `Spouse contribution transferred from ${src.fundName}. Receiving member must be under 75.`,
      });
    }

    // Contribution split → strategy 63 (amount = % as a number, e.g. "15" for 15%)
    const splitPct = parseFloat(src.split_out_pct) || 0;
    if (splitPct > 0) {
      newStrategies.push({
        ...EMPTY_STRATEGY,
        id: "str_xfr_split_" + rollover.id,
        strategy_id: "63",
        owner_id: owner,
        start_year: rollYear,
        end_year: splitEndYear,
        amount: String(splitPct),
        notes: `Contribution split (${splitPct}% of CC) transferred from ${src.fundName}. Requires gainful employment.`,
      });
    }

    // SG fund designation transfer — update roll-in fund's is_sg_fund flag directly
    if (src.is_sg_fund) {
      const dst = rollover.rollin_fund;
      const newSuperMatch = dst?.match(/^new_super_(.+)$/);
      const superMatch = dst?.match(/^super_(\d+)$/);
      let updatedTxns = { ...txns };
      if (newSuperMatch) {
        const advId = newSuperMatch[1];
        updatedTxns = { ...updatedTxns, newSuper: (txns.newSuper || []).map(s =>
          s.id === advId ? { ...s, is_sg_fund: true } : (s.owner === owner ? { ...s, is_sg_fund: false } : s)
        )};
      } else if (superMatch) {
        const fi = parseInt(superMatch[1]);
        const prods = [...(factFind.superProducts || [])];
        if (prods[fi]) {
          prods.forEach((p, i) => { prods[i] = { ...p, is_sg_fund: i === fi }; });
          updateFF("superProducts", prods);
        }
      }
      const updatedRollovers = (updatedTxns.rollovers || rollovers).map(r =>
        r.id === rollover.id ? { ...r, transfer_contributions: true } : r
      );
      const finalTxns = { ...updatedTxns, rollovers: updatedRollovers };
      updateFF("advice_request.transactions", finalTxns);
      if (typeof updateAdvice === "function") updateAdvice("advice_request.transactions", finalTxns);
    } else {
      const updatedRollovers = rollovers.map(r =>
        r.id === rollover.id ? { ...r, transfer_contributions: true } : r
      );
      const finalTxns = { ...txns, rollovers: updatedRollovers };
      updateFF("advice_request.transactions", finalTxns);
      if (typeof updateAdvice === "function") updateAdvice("advice_request.transactions", finalTxns);
    }

    // Write all generated strategies to advice_request.strategy.strategies
    if (newStrategies.length > 0) {
      const writeFF = typeof updateAdvice === "function" ? updateAdvice : updateFF;
      const adviceData = factFind.advice_request?.strategy || { models: [], strategies: [] };
      const existingStrats = adviceData.strategies || [];
      const filtered = existingStrats.filter(s =>
        !s.id.startsWith("str_xfr_ss_" + rollover.id) &&
        !s.id.startsWith("str_xfr_ncc_" + rollover.id) &&
        !s.id.startsWith("str_xfr_spouse_" + rollover.id) &&
        !s.id.startsWith("str_xfr_split_" + rollover.id)
      );
      const updatedStrategy = { ...adviceData, strategies: [...filtered, ...newStrategies] };
      writeFF("advice_request.strategy", updatedStrategy);
    }
  };

  // Check if both sides of a rollover are super-type
  const isSuperToSuper = (r) => {
    const out = r.rollout_fund || "";
    const inn = r.rollin_fund || "";
    return (out.startsWith("super_") || out.startsWith("new_super_")) &&
           (inn.startsWith("super_") || inn.startsWith("new_super_"));
  };

  const fmtBal = (v) => { const n = parseFloat(v); return isNaN(n) ? "$0" : "$" + n.toLocaleString("en-AU", { maximumFractionDigits: 0 }); };

  const tableHeaderStyle = { padding: "8px 10px", fontSize: 10, fontWeight: 700, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", textAlign: "left" };
  const tableCellStyle = { padding: "10px 10px", fontSize: 12, color: "var(--ps-text-body)", borderBottom: "1px solid var(--ps-border-light)" };
  const actionBtn = (onClick, color, label) => <button onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ padding: "3px 8px", borderRadius: 4, border: "none", background: "transparent", color, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{label}</button>;
  const ffRowStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 };
  const togglePill = (label, active, onClick) => (
    <button onClick={onClick} style={{ padding: "4px 12px", borderRadius: 6, border: active ? "2px solid #4F46E5" : "1px solid var(--ps-border)", background: active ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: active ? "#4F46E5" : "var(--ps-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{label}</button>
  );

  const editingRollover = rollovers.find(r => r.id === editId);

  // Compute projected balance for display
  const getProjectedBalance = (r) => {
    if (!r.rollout_fund) return 0;
    const yearsOut = Math.max(0, (parseInt(r.rollover_year) || startYear) - startYear);
    return projectBalance(r.rollout_fund, yearsOut);
  };

  const getRolloverAmount = (r) => {
    const projBal = getProjectedBalance(r);
    if (r.rollover_entire) return projBal;
    if (r.amount_type === "percentage") return Math.round(projBal * ((parseFloat(r.amount_pct) || 0) / 100));
    return parseFloat(r.amount) || 0;
  };

  if (rollovers.length === 0) {
    return (
      <div style={{ border: "2px dashed var(--ps-border)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🔁</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>No product replacements yet</div>
        <div style={{ fontSize: 12, color: "var(--ps-text-subtle)", maxWidth: 360, margin: "0 auto", marginBottom: 16 }}>Add rollovers to move funds between super, pension and investment products</div>
        <button onClick={addRollover} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#DC2626", color: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Rollover</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>Product Replacements</div>
        <button onClick={addRollover} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#DC2626", color: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Rollover</button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>
          <th style={tableHeaderStyle}>Roll Out</th><th style={{ ...tableHeaderStyle, width: 30, textAlign: "center" }}>→</th><th style={tableHeaderStyle}>Roll In</th><th style={tableHeaderStyle}>Year</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Amount</th><th style={{ ...tableHeaderStyle, textAlign: "right" }}>Actions</th>
        </tr></thead>
        <tbody>{rollovers.map(r => {
          const rollAmt = getRolloverAmount(r);
          return (
            <tr key={r.id} style={{ background: editId === r.id ? "var(--ps-surface-red)" : "transparent", cursor: "pointer" }} onClick={() => setEditId(editId === r.id ? null : r.id)}>
              <td style={{ ...tableCellStyle, fontWeight: 600 }}>{getProductLabel(r.rollout_fund)}</td>
              <td style={{ ...tableCellStyle, textAlign: "center", fontSize: 16, color: "var(--ps-red)" }}>→</td>
              <td style={{ ...tableCellStyle, fontWeight: 600 }}>{getProductLabel(r.rollin_fund)}</td>
              <td style={tableCellStyle}>{r.rollover_year || "—"}</td>
              <td style={{ ...tableCellStyle, textAlign: "right", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{r.rollover_entire ? fmtBal(rollAmt) + " (Full)" : fmtBal(rollAmt)}{!r.rollover_entire && r.amount_type === "percentage" ? ` (${r.amount_pct || 0}%)` : ""}</td>
              <td style={{ ...tableCellStyle, textAlign: "right" }}>{actionBtn(() => setEditId(editId === r.id ? null : r.id), "#D97706", "✎")}{actionBtn(() => removeRollover(r.id), "#DC2626", "✕")}</td>
            </tr>
          );
        })}</tbody>
      </table>

      {editingRollover && (() => {
        const projBal = getProjectedBalance(editingRollover);
        const yearsOut = Math.max(0, (parseInt(editingRollover.rollover_year) || startYear) - startYear);
        const currentBal = productOpts.find(o => o.value === editingRollover.rollout_fund)?.balance;
        return (
        <div style={{ marginTop: 12, padding: 16, background: "var(--ps-surface-red)", border: "1px solid var(--ps-ring-red)", borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🔁</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>Rollover Details</span>
            </div>
            <button onClick={() => setEditId(null)} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", fontSize: 10, cursor: "pointer", color: "var(--ps-text-muted)" }}>✕</button>
          </div>

          <div style={ffRowStyle}>
            <FFSelect label="Owner" value={editingRollover.owner_id || "client1"} onChange={v => { updateRollover(editingRollover.id, "owner_id", v); updateRollover(editingRollover.id, "rollout_fund", ""); updateRollover(editingRollover.id, "rollin_fund", ""); }} options={[...(factFind.client1 ? [{ value: "client1", label: ((factFind.client1.first_name || "") + " " + (factFind.client1.last_name || "")).trim() || "Client 1" }] : []), ...(factFind.client2 ? [{ value: "client2", label: ((factFind.client2.first_name || "") + " " + (factFind.client2.last_name || "")).trim() || "Client 2" }] : [])]} />
          </div>
          <div style={ffRowStyle}>
            {(() => {
              const owner = editingRollover.owner_id || "client1";
              const ownerOpts2 = productOpts.filter(o => o.owner === owner);
              return (<>
                <FFSelect label="Roll Out Fund (FROM)" value={editingRollover.rollout_fund} onChange={v => updateRollover(editingRollover.id, "rollout_fund", v)} options={[{ value: "", label: "— Select fund —" }, ...ownerOpts2.map(o => ({ value: o.value, label: o.label }))]} />
                <FFSelect label="Roll In Fund (TO)" value={editingRollover.rollin_fund} onChange={v => updateRollover(editingRollover.id, "rollin_fund", v)} options={[{ value: "", label: "— Select fund —" }, ...ownerOpts2.map(o => ({ value: o.value, label: o.label }))]} />
              </>);
            })()}
          </div>

          <div style={ffRowStyle}>
            <FFSelect label="Rollover year" value={editingRollover.rollover_year} onChange={v => updateRollover(editingRollover.id, "rollover_year", v)} options={yearOpts} />
            <FFInput label="Rollover date (optional)" value={editingRollover.rollover_date} onChange={v => updateRollover(editingRollover.id, "rollover_date", v)} type="date" />
          </div>

          {editingRollover.rollout_fund && (
            <div style={{ display: "grid", gridTemplateColumns: yearsOut > 0 ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 10 }}>
              {yearsOut > 0 && (
                <div style={{ padding: "8px 12px", background: "var(--ps-surface)", borderRadius: 6, border: "1px solid var(--ps-border)" }}>
                  <div style={{ fontSize: 11, color: "var(--ps-text-muted)", marginBottom: 2 }}>Current Balance (Today)</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>{fmtBal(currentBal)}</div>
                </div>
              )}
              <div style={{ padding: "8px 12px", background: "var(--ps-surface)", borderRadius: 6, border: "1px solid #059669" }}>
                <div style={{ fontSize: 11, color: "var(--ps-green)", marginBottom: 2 }}>{yearsOut > 0 ? `Projected Balance at ${editingRollover.rollover_year} (Year ${yearsOut + 1})` : "Current Balance"}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{fmtBal(projBal)}</div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 6 }}>Rollover entire balance?</div>
            <div style={{ display: "flex", gap: 6 }}>
              {togglePill("Yes — Full Balance", editingRollover.rollover_entire, () => updateRollover(editingRollover.id, "rollover_entire", true))}
              {togglePill("No — Partial Amount", !editingRollover.rollover_entire, () => updateRollover(editingRollover.id, "rollover_entire", false))}
            </div>
          </div>

          {!editingRollover.rollover_entire && (
            <div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 6 }}>Amount type</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {togglePill("$ Dollar Amount", editingRollover.amount_type === "dollar", () => updateRollover(editingRollover.id, "amount_type", "dollar"))}
                  {togglePill("% of Balance", editingRollover.amount_type === "percentage", () => updateRollover(editingRollover.id, "amount_type", "percentage"))}
                </div>
              </div>
              {editingRollover.amount_type === "percentage" ? (
                <div>
                  <FFInput label="Percentage to rollover" value={editingRollover.amount_pct} onChange={v => updateRollover(editingRollover.id, "amount_pct", v)} type="number" suffix="%" />
                  {editingRollover.amount_pct && projBal > 0 && (
                    <div style={{ fontSize: 11, color: "var(--ps-green)", marginTop: 4 }}>= {fmtBal(Math.round(projBal * ((parseFloat(editingRollover.amount_pct) || 0) / 100)))} of projected balance</div>
                  )}
                </div>
              ) : (
                <FFInput label="Amount to rollover" value={editingRollover.amount} onChange={v => updateRollover(editingRollover.id, "amount", v)} type="number" prefix="$" />
              )}
            </div>
          )}

          {/* ── Transfer Existing Contributions ── */}
          {isSuperToSuper(editingRollover) && editingRollover.rollout_fund && editingRollover.rollin_fund && (() => {
            const src = getContribsFromFundRef(editingRollover.rollout_fund);
            const applied = editingRollover.transfer_contributions === true;
            if (!src) return null;
            const hasSS = parseFloat(src.salary_sacrifice) > 0;
            const hasAT = parseFloat(src.after_tax) > 0;
            const hasSpouse = parseFloat(src.spouse_received) > 0;
            const hasSplit = parseFloat(src.split_out_pct) > 0;
            const hasSG = src.is_sg_fund;
            const hasAnything = hasSS || hasAT || hasSpouse || hasSplit || hasSG;
            return (
              <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 8, background: applied ? "var(--ps-surface-green)" : "var(--ps-surface-alt)", border: `1px solid ${applied ? "#86EFAC" : "var(--ps-border)"}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 3 }}>
                      {applied ? "✓ Contributions Transferred" : "Transfer Existing Contributions"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ps-text-muted)", marginBottom: applied || !hasAnything ? 0 : 8 }}>
                      {applied
                        ? `Strategy created — contributions transferred from ${src.fundName}. Edit amounts or dates in Modelling Strategies.`
                        : hasAnything
                          ? `Creates modelling strategies to redirect contributions to the roll-in fund from ${editingRollover.rollover_year}. Old fund contributions stop at rollover.`
                          : "No contributions are set on the roll-out fund to transfer."}
                    </div>
                    {!applied && hasAnything && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                        {hasSG && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "var(--ps-bg-blue-200)", color: "var(--ps-badge-blue)" }}>⚡ SG Fund → new fund</span>}
                        {hasSS && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "var(--ps-surface-indigo)", color: "#4338CA" }}>⚡ Strategy 101 — Salary Sacrifice ${parseFloat(src.salary_sacrifice).toLocaleString()}{src.salary_sacrifice_indexed ? " (CPI)" : ""} from {editingRollover.rollover_year} → ends at min(retirement, age 75)</span>}
                        {hasAT && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "var(--ps-surface-indigo)", color: "#4338CA" }}>⚡ Strategy 55 — NCC ${parseFloat(src.after_tax).toLocaleString()}{src.after_tax_indexed ? " (CPI)" : ""} from {editingRollover.rollover_year} → ends at age 75</span>}
                        {hasSpouse && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "var(--ps-surface-indigo)", color: "#4338CA" }}>⚡ Strategy 109s — Spouse Contribution ${parseFloat(src.spouse_received).toLocaleString()} from {editingRollover.rollover_year} → ends at age 75</span>}
                        {hasSplit && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "var(--ps-surface-indigo)", color: "#4338CA" }}>⚡ Strategy 63 — Contribution Split {src.split_out_pct}% from {editingRollover.rollover_year} → ends at min(retirement, age 75)</span>}
                      </div>
                    )}
                  </div>
                  {!applied && hasAnything && (
                    <button
                      onClick={() => applyContribTransfer(editingRollover)}
                      style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#4F46E5", color: "var(--ps-surface)", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                      Transfer →
                    </button>
                  )}
                  {applied && (
                    <button
                      onClick={() => updateRollover(editingRollover.id, "transfer_contributions", false)}
                      style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--ps-ring-green)", background: "var(--ps-surface)", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "var(--ps-text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

        </div>
        );
      })()}
    </div>
  );
}
// ===========================================================================

// ===========================================================================
// AI PARAPLANNER — Chat panel wired to Anthropic API
// ===========================================================================
export function AiFactFind({ factFind, updateFF, embedded }) {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hi! I'm your AI Fact Find assistant. I can conduct a guided interview with your client to gather their financial information — income, assets, super, debts, insurance, goals and more.\n\nI'll ask the right questions and populate the fact find forms automatically as we go. You can review and edit anything I capture.\n\nHow would you like to start?",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = React.useRef(null);

  React.useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const c1 = factFind.client1 || {};
  const c2 = factFind.client2 || {};
  const c1Name = ((c1.first_name || "") + " " + (c1.last_name || "")).trim() || "Client 1";
  const c2Name = factFind.client2 ? ((c2.first_name || "") + " " + (c2.last_name || "")).trim() : null;

  const buildContext = () => {
    const sections = [];
    if (c1.first_name) sections.push(`Client 1: ${c1Name}, DOB: ${c1.date_of_birth || "unknown"}`);
    if (c2Name) sections.push(`Client 2: ${c2Name}, DOB: ${c2.date_of_birth || "unknown"}`);
    const supers = (factFind.superProducts || []).map(s => `${s.fund_name}: $${(parseFloat(s.balance)||0).toLocaleString()}`);
    if (supers.length) sections.push("Super: " + supers.join(", "));
    const assets = (factFind.assets || []).map(a => `${a.description}: $${(parseFloat(a.value)||0).toLocaleString()}`);
    if (assets.length) sections.push("Assets: " + assets.join(", "));
    const debts = (factFind.liabilities || []).map(d => `${d.description}: $${(parseFloat(d.balance)||0).toLocaleString()}`);
    if (debts.length) sections.push("Debts: " + debts.join(", "));
    return sections.join("\n") || "No client data entered yet.";
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are an AI Fact Find assistant for an Australian financial planner. You conduct guided interviews to gather client financial information. Current client data:\n${buildContext()}\n\nAsk clear, specific questions one at a time. When the client provides information, acknowledge it and ask the next relevant question. Cover: personal details, employment & income, superannuation, investments, assets, liabilities, insurance, expenses, goals & objectives, risk profile.\n\nIf the user provides data that should be captured, note what field it maps to. Be warm, professional, and thorough.`,
          messages: [...messages.slice(1), userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await resp.json();
      const reply = data.content?.map(b => b.text || "").join("") || "I couldn't process that. Could you try again?";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const bubble = (role) => ({
    maxWidth: "88%", padding: "10px 14px", borderRadius: role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
    background: role === "user" ? "#0D9488" : "var(--ps-border-light)",
    color: role === "user" ? "var(--ps-surface)" : "var(--ps-text-primary)",
    fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap",
    alignSelf: role === "user" ? "flex-end" : "flex-start",
  });

  const QUICK = [
    "Start a new client interview from scratch",
    "Review and fill gaps in the current fact find",
    "Walk me through the super and pension details",
    "Help capture income and expense information",
  ];

  return (
    <div style={embedded ? { display: "flex", flexDirection: "column", height: "100%", background: "var(--ps-surface)" } : { position: "fixed", top: 0, right: 0, width: 480, height: "100vh", background: "var(--ps-surface)", boxShadow: "-4px 0 24px rgba(0,0,0,0.14)", display: "flex", flexDirection: "column", zIndex: 1000, borderLeft: "1px solid var(--ps-border)" }}>
      <div style={{ padding: embedded ? "12px 16px" : "16px 20px", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0D9488" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: embedded ? 32 : 38, height: embedded ? 32 : 38, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: embedded ? 16 : 20 }}>🎙️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: embedded ? 13 : 15, color: "#fff" }}>AI Fact Find</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>Guided interview · Auto-populates forms</div>
          </div>
        </div>
      </div>

      {c1Name !== "Client 1" && (
        <div style={{ padding: "8px 14px", background: "var(--ps-surface-teal)", borderBottom: "1px solid var(--ps-border)", display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ background: "var(--ps-surface)", border: "1px solid #0D948830", borderRadius: 12, padding: "2px 8px", fontSize: 11, color: "#0D9488" }}>
            👤 {c1Name}
          </span>
          {c2Name && (
            <span style={{ background: "var(--ps-surface)", border: "1px solid #0D948830", borderRadius: 12, padding: "2px 8px", fontSize: 11, color: "#0D9488" }}>
              👤 {c2Name}
            </span>
          )}
          <span style={{ background: "var(--ps-surface)", border: "1px solid #0D948830", borderRadius: 12, padding: "2px 8px", fontSize: 11, color: "#0D9488" }}>
            {(factFind.superProducts || []).length} super funds · {(factFind.assets || []).length} assets · {(factFind.liabilities || []).length} debts
          </span>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
            <div style={bubble(m.role)}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", padding: "10px 14px", background: "var(--ps-border-light)", borderRadius: "14px 14px 14px 4px", fontSize: 13, color: "var(--ps-text-muted)" }}>
            🎙️ Listening...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {messages.length <= 1 && (
        <div style={{ padding: "0 14px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 2 }}>QUICK START</div>
          {QUICK.map((q, i) => (
            <button key={i} onClick={() => setInput(q)}
              style={{ textAlign: "left", padding: "8px 12px", background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)", borderRadius: 8, fontSize: 12, color: "var(--ps-text-secondary)", cursor: "pointer" }}>
              {q}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--ps-border)", display: "flex", gap: 8, background: "var(--ps-surface-alt)" }}>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Type client responses... (Enter to send)"
          rows={2}
          style={{ flex: 1, padding: "9px 12px", border: "1.5px solid var(--ps-border-mid)", borderRadius: 10, fontSize: 13, resize: "none", fontFamily: "inherit", outline: "none", background: "var(--ps-surface)" }}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          style={{ padding: "10px 18px", background: loading || !input.trim() ? "var(--ps-border)" : "#0D9488", color: loading || !input.trim() ? "var(--ps-text-subtle)" : "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: loading || !input.trim() ? "default" : "pointer", alignSelf: "flex-end" }}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export function AiParaplanner({ factFind, engineData, updateAdvice, summaryMeta, isOpen, onClose, embedded }) {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hi! I'm your AI Paraplanner. I have full visibility of your clients' current position — balances, income, ages, tax components and existing strategies.\n\nTell me what you'd like to achieve and I'll recommend specific strategies with amounts and timing. I can write them directly into the model for you.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = React.useRef(null);

  React.useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const buildContext = () => {
    const c1 = factFind.client1 || {};
    const c2 = factFind.client2 || {};
    const c1Name = ((c1.first_name || "") + " " + (c1.last_name || "")).trim() || "Client 1";
    const c2Name = factFind.client2 ? ((c2.first_name || "") + " " + (c2.last_name || "")).trim() || "Client 2" : null;
    const currentFY = summaryMeta?.currentFY || new Date().getFullYear();
    const c1Age = summaryMeta?.c1AgeNow || "unknown";
    const c2Age = summaryMeta?.c2AgeNow || null;
    const income = engineData.income || {};
    const c1Gross = parseFloat(income.client1?.i_gross) || 0;
    const c2Gross = parseFloat(income.client2?.i_gross) || 0;
    const LOW_RATE_CAP = 235000;
    const lrtUsed = {
      client1: parseFloat(engineData.tax_super_planning?.client1?.low_rate_used) || 0,
      client2: parseFloat(engineData.tax_super_planning?.client2?.low_rate_used) || 0,
    };
    const superFunds = (engineData.superProducts || []).map((s, i) => ({
      id: "super_" + i, owner: s.owner === "client1" ? c1Name : (c2Name || s.owner),
      fund: s.fund_name, balance: parseFloat(s.balance) || 0,
      tfPct: parseFloat(s.tax_components?.tax_free_pct) || 0,
    }));
    const pensions = (engineData.pensions || []).map((p, i) => ({
      id: "pension_" + i, owner: p.owner === "client1" ? c1Name : (c2Name || p.owner),
      fund: p.fund_name, balance: parseFloat(p.balance) || 0,
      type: p.pension_type || "account-based",
      drawdown: p.drawdown_type === "dollar" ? "$" + p.drawdown_amount : (p.drawdown_rate || "5") + "%",
    }));
    const existing = (engineData.advice_request?.strategy?.strategies || []);
    const stratList = STRAT_GROUPS.flatMap(g => g.items.map(i => i.value + ": " + i.label)).join("\n");
    return "CLIENT CONTEXT (FY" + currentFY + ")\n\n" +
      "CLIENTS:\n" +
      "- " + c1Name + ": Age " + c1Age + ", income $" + c1Gross.toLocaleString() + ", LRT remaining $" + (LOW_RATE_CAP - lrtUsed.client1).toLocaleString() + "\n" +
      (c2Name ? "- " + c2Name + ": Age " + c2Age + ", income $" + c2Gross.toLocaleString() + ", LRT remaining $" + (LOW_RATE_CAP - lrtUsed.client2).toLocaleString() + "\n" : "") +
      "\nSUPER FUNDS:\n" + superFunds.map(f => "- " + f.fund + " (" + f.id + ", " + f.owner + "): $" + f.balance.toLocaleString() + ", " + f.tfPct + "% tax-free").join("\n") +
      "\nPENSIONS:\n" + (pensions.length ? pensions.map(p => "- " + p.fund + " (" + p.id + ", " + p.owner + "): $" + p.balance.toLocaleString() + ", " + p.type + ", drawdown " + p.drawdown).join("\n") : "None") +
      "\nEXISTING STRATEGIES:\n" + (existing.length ? existing.map(s => "- " + stratLbl(s.strategy_id) + " | " + s.owner_id + " | $" + s.amount + " | " + s.start_year + "-" + s.end_year).join("\n") : "None") +
      "\nAVAILABLE STRATEGY IDs:\n" + stratList;
  };

  const systemPrompt = "You are an expert Australian financial paraplanner inside a cashflow modelling tool. Analyse the client context and recommend strategies.\n\nWhen recommending strategies respond with a JSON block:\n<strategies>[{strategy_id, owner_id, amount, start_year, end_year, timing, product_id, notes}]</strategies>\n\nRules:\n- strategy_id from available list\n- owner_id: client1 or client2\n- timing: SOY or EOY\n- product_id: e.g. super_0, pension_0\n- end_year: year or Ongoing\n- amount: number string no $ sign\n- Always explain reasoning before the JSON block\n- Ask if you need more info";

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const context = buildContext();
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: systemPrompt,
          messages: [
            { role: "user", content: context + "\n\n---\n\nUser: " + userMsg.content },
          ],
        }),
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || "Sorry, could not generate a response.";
      const stratMatch = text.match(/<strategies>([\s\S]*?)<\/strategies>/);
      let parsed = null;
      if (stratMatch) {
        try { parsed = JSON.parse(stratMatch[1].trim()); if (!Array.isArray(parsed)) parsed = [parsed]; } catch(e) {}
      }
      const cleanText = text.replace(/<strategies>[\s\S]*?<\/strategies>/, "").trim();
      setMessages(prev => [...prev, { role: "assistant", content: cleanText, strategies: parsed }]);
    } catch(err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error connecting to AI. Please try again." }]);
    }
    setLoading(false);
  };

  const applyStrategies = (strats) => {
    const current = factFind.advice_request?.strategy || { models: [], strategies: [] };
    const existing = current.strategies || [];
    const newStrats = strats.map(s => ({ ...s, id: stratId() }));
    updateAdvice("advice_request.strategy", { ...current, strategies: [...existing, ...newStrats] });
    setMessages(prev => [...prev, { role: "assistant", content: "Added " + newStrats.length + " strategy" + (newStrats.length > 1 ? "s" : "") + " to the model. Switch to Modelling Strategies to review." }]);
  };

  if (!isOpen) return null;

  const bubble = (role) => ({
    maxWidth: "88%", padding: "10px 14px",
    borderRadius: role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
    background: role === "user" ? "#4F46E5" : "var(--ps-border-light)",
    color: role === "user" ? "var(--ps-surface)" : "var(--ps-text-primary)",
    fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap",
    alignSelf: role === "user" ? "flex-end" : "flex-start",
  });

  const QUICK = [
    "What recontribution strategies would reduce taxable super?",
    "Recommend strategies to maximise super before retirement",
    "How should we structure pension drawdown to minimise tax?",
    "What contribution strategies are available this year?",
  ];

  return (
    <div style={embedded ? { display: "flex", flexDirection: "column", height: "100%", background: "var(--ps-surface)" } : { position: "fixed", top: 0, right: 0, width: 480, height: "100vh", background: "var(--ps-surface)", boxShadow: "-4px 0 24px rgba(0,0,0,0.14)", display: "flex", flexDirection: "column", zIndex: 1000, borderLeft: "1px solid var(--ps-border)" }}>
      <div style={{ padding: embedded ? "12px 16px" : "16px 20px", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#4F46E5" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: embedded ? 32 : 38, height: embedded ? 32 : 38, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: embedded ? 16 : 20 }}>🧠</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: embedded ? 13 : 15, color: "var(--ps-surface)" }}>AI Paraplanner</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>Powered by Claude · Live model context</div>
          </div>
        </div>
        {!embedded && <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "var(--ps-surface)", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>}
      </div>

      <div style={{ padding: "8px 14px", background: "var(--ps-surface-indigo)", borderBottom: "1px solid var(--ps-border)", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(factFind.superProducts || []).map((s, i) => (
          <span key={i} style={{ background: "var(--ps-surface)", border: "1px solid var(--ps-ring-indigo)", borderRadius: 12, padding: "2px 8px", fontSize: 11, color: "#4338CA" }}>
            🏦 {s.fund_name}: ${(parseFloat(s.balance)||0).toLocaleString()}
          </span>
        ))}
        {(factFind.pensions || []).map((p, i) => (
          <span key={i} style={{ background: "var(--ps-surface)", border: "1px solid var(--ps-ring-indigo)", borderRadius: 12, padding: "2px 8px", fontSize: 11, color: "#4338CA" }}>
            💸 {p.fund_name}: ${(parseFloat(p.balance)||0).toLocaleString()}
          </span>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
            <div style={bubble(m.role)}>{m.content}</div>
            {m.strategies && m.strategies.length > 0 && (
              <div style={{ background: "var(--ps-surface-green)", border: "1px solid var(--ps-ring-emerald)", borderRadius: 10, padding: "12px 14px", width: "92%", fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: "var(--ps-badge-green)", marginBottom: 8 }}>📋 Proposed {m.strategies.length} strategy{m.strategies.length > 1 ? "s" : ""}</div>
                {m.strategies.map((s, si) => (
                  <div key={si} style={{ background: "var(--ps-surface)", border: "1px solid var(--ps-ring-green)", borderRadius: 7, padding: "8px 10px", marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, color: "var(--ps-text-primary)" }}>{stratLbl(s.strategy_id)}</div>
                    <div style={{ color: "var(--ps-text-muted)", fontSize: 11, marginTop: 2 }}>
                      {s.owner_id} · ${parseFloat(s.amount||0).toLocaleString()} · {s.start_year}–{s.end_year} · {s.timing || "SOY"}{s.product_id ? " · " + s.product_id : ""}
                    </div>
                    {s.notes && <div style={{ color: "var(--ps-green)", fontSize: 11, marginTop: 3, fontStyle: "italic" }}>{s.notes}</div>}
                  </div>
                ))}
                <button onClick={() => applyStrategies(m.strategies)}
                  style={{ width: "100%", marginTop: 4, padding: "9px", background: "#16A34A", color: "var(--ps-surface)", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  ✅ Add all to model
                </button>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", padding: "10px 14px", background: "var(--ps-border-light)", borderRadius: "14px 14px 14px 4px", fontSize: 13, color: "var(--ps-text-muted)" }}>
            ⚙️ Analysing client position...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {messages.length <= 1 && (
        <div style={{ padding: "0 14px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 2 }}>QUICK START</div>
          {QUICK.map((q, i) => (
            <button key={i} onClick={() => setInput(q)}
              style={{ textAlign: "left", padding: "8px 12px", background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)", borderRadius: 8, fontSize: 12, color: "var(--ps-text-secondary)", cursor: "pointer" }}>
              {q}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--ps-border)", display: "flex", gap: 8, background: "var(--ps-surface-alt)" }}>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Ask the paraplanner... (Enter to send, Shift+Enter for new line)"
          rows={2}
          style={{ flex: 1, padding: "9px 12px", border: "1.5px solid var(--ps-border-mid)", borderRadius: 10, fontSize: 13, resize: "none", fontFamily: "inherit", outline: "none", background: "var(--ps-surface)" }}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          style={{ padding: "10px 18px", background: loading || !input.trim() ? "var(--ps-border)" : "#4F46E5", color: loading || !input.trim() ? "var(--ps-text-subtle)" : "var(--ps-surface)", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: loading || !input.trim() ? "default" : "pointer", alignSelf: "flex-end" }}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export function StrategyForm({ factFind, baseFf, updateFF, tab: forcedTab, onSyncStrat14 }) {
  const [tab, setTab] = useState(forcedTab || "models");
  const [editId, setEditId] = useState(null);

  const togglePill = (label, active, onClick) => (
    <button onClick={onClick} style={{ padding: "4px 12px", borderRadius: 6, border: active ? "2px solid #4F46E5" : "1px solid var(--ps-border)", background: active ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: active ? "#4F46E5" : "var(--ps-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{label}</button>
  );

  const data = factFind.advice_request?.strategy || { models: [], strategies: [] };
  const modelList = data.models || [];
  const stratList = data.strategies || [];

  const save = (d) => updateFF("advice_request.strategy", d);

  // Owner options
  const ownerOpts = [];
  const c1 = factFind.client1;
  const c2 = factFind.client2;
  const c1Name = c1 ? ((c1.first_name || "") + " " + (c1.last_name || "")).trim() || "Client 1" : null;
  const c2Name = c2 ? ((c2.first_name || "") + " " + (c2.last_name || "")).trim() || "Client 2" : null;
  if (c1Name) ownerOpts.push({ value: "client1", label: c1Name });
  if (c2Name) ownerOpts.push({ value: "client2", label: c2Name });
  if (c1Name && c2Name) ownerOpts.push({ value: "joint", label: c1Name + " & " + c2Name + " (Joint)" });

  const getOwnerLabel = (id) => ownerOpts.find(o => o.value === id)?.label || "—";

  // Model CRUD
  const addModel = () => { const m = { ...EMPTY_MODEL, id: stratId() }; save({ ...data, models: [...modelList, m] }); setEditId(m.id); };
  const updateModel = (id, f, v) => save({ ...data, models: modelList.map(m => m.id === id ? { ...m, [f]: v } : m) });
  const removeModel = (id) => { if (id === "model_default") return; save({ ...data, models: modelList.filter(m => m.id !== id) }); if (editId === id) setEditId(null); };

  // Strategy CRUD
  const addStrat = () => { const s = { ...EMPTY_STRATEGY, id: stratId() }; save({ ...data, strategies: [...stratList, s] }); setEditId(s.id); };
  const applyStrat14Sync = (s, updatedStrategies) => {
    const id = s.id;
    // transactions live at advice_request.transactions, separate from advice_request.strategy
    const fullAdvice = factFind.advice_request || {};
    const txns = fullAdvice.transactions || {};
    const rollovers = (txns.rollovers || []).filter(r => r._strategy_id !== id);
    let newPensions = (txns.newPension || []).filter(p => p._strategy_id !== id);
    const rolloutFund = s.rollout_fund || "";
    const productName = s.pension_product_name || "";
    const rolloverType = s.rollover_type || "entire";
    const retainAmt = s.rollover_retain || "";
    const startYear = s.start_year || "2025";
    const ownerKey = s.owner_id || "client1";
    // Always save updated strategies first
    updateFF("advice_request.strategy", { ...data, strategies: updatedStrategies });
    if (rolloutFund) {
      const newPenId = "abp_" + id;
      const defaultPenName = s.strategy_id === "15" ? "Transition to Retirement Pension" : "Account Based Pension";
      const fundName = productName ? productName.split("—")[0].trim() : defaultPenName;
      const product = productName && productName.includes("—") ? productName.split("—").slice(1).join("—").trim() : defaultPenName;
      const pensionType = s.strategy_id === "15" ? "ttr" : "account-based";
    const newPen = { ...EMPTY_NEW_PENSION, id: newPenId, fund_name: fundName, product, owner: ownerKey, balance: "0", pension_type: pensionType, drawdown_rate: "5", drawdown_type: "percentage", tax_components: { taxable_portion: "0", tax_free_portion: "0", tax_free_pct: "calc" }, fees: { admin_fee: "0", percent_fee: "0", insurance_fee: "0" }, _strategy_id: id };
      newPensions = [...newPensions, newPen];
      const isPartial = rolloverType === "partial" && parseFloat(retainAmt) > 0;
      const rollover = { id: "r1415_" + id, rollout_fund: rolloutFund, rollin_fund: "new_pension_" + newPenId, rollover_entire: !isPartial, amount_type: isPartial ? "retain" : "dollar", amount: isPartial ? retainAmt : "", amount_pct: "", rollover_date: "", rollover_year: startYear, transfer_contributions: false, _strategy_id: id };
      updateFF("advice_request.transactions", { ...txns, rollovers: [...rollovers, rollover], newPension: newPensions });
    } else {
      updateFF("advice_request.transactions", { ...txns, rollovers, newPension: newPensions });
    }
  };

  // Strategy 96: existing pension → new pension rollover sync
  const applyStrat96Sync = (s, updatedStrategies) => {
    const id = s.id;
    const fullAdvice = factFind.advice_request || {};
    const txns = fullAdvice.transactions || {};
    const rollovers = (txns.rollovers || []).filter(r => r._strategy_id !== id);
    let newPensions = (txns.newPension || []).filter(p => p._strategy_id !== id);
    const rolloutFund = s.rollout_fund || "";
    const productName = s.pension_product_name || "";
    const rolloverType = s.rollover_type || "entire";
    const retainAmt = s.rollover_retain || "";
    const startYear = s.start_year || String(currentFY);
    const ownerKey = s.owner_id || "client1";
    updateFF("advice_request.strategy", { ...data, strategies: updatedStrategies });
    if (rolloutFund) {
      const newPenId = "abp96_" + id;
      const fundName = productName ? productName.split("—")[0].trim() : "Account Based Pension";
      const product = productName && productName.includes("—") ? productName.split("—").slice(1).join("—").trim() : "Account Based Pension";
      // Inherit tax_free_pct from source pension
      const srcPenIdx = rolloutFund.match(/^pension_(\d+)$/)?.[1];
      const srcPen = srcPenIdx !== undefined ? (factFind.pensions || [])[parseInt(srcPenIdx)] : null;
      const srcTfPct = srcPen?.tax_components?.tax_free_pct || "0";
      const newPen = { ...EMPTY_NEW_PENSION, id: newPenId, fund_name: fundName, product, owner: ownerKey, balance: "0", pension_type: "account-based", drawdown_rate: "5", drawdown_type: "percentage", tax_components: { taxable_portion: "0", tax_free_portion: "0", tax_free_pct: "calc" }, fees: { admin_fee: "0", percent_fee: "0", insurance_fee: "0" }, _strategy_id: id };
      newPensions = [...newPensions, newPen];
      const isPartial = rolloverType === "partial" && parseFloat(retainAmt) > 0;
      const rollover = { id: "r96_" + id, rollout_fund: rolloutFund, rollin_fund: "new_pension_" + newPenId, rollover_entire: !isPartial, amount_type: isPartial ? "retain" : "dollar", amount: isPartial ? retainAmt : "", amount_pct: "", rollover_date: "", rollover_year: startYear, transfer_contributions: false, _strategy_id: id };
      updateFF("advice_request.transactions", { ...txns, rollovers: [...rollovers, rollover], newPension: newPensions });
    } else {
      updateFF("advice_request.transactions", { ...txns, rollovers, newPension: newPensions });
    }
  };

  // Strategy 97: pension → super rollover sync
  const applyStrat97Sync = (s, updatedStrategies) => {
    const id = s.id;
    const fullAdvice = factFind.advice_request || {};
    const txns = fullAdvice.transactions || {};
    const rollovers = (txns.rollovers || []).filter(r => r._strategy_id !== id);
    updateFF("advice_request.strategy", { ...data, strategies: updatedStrategies });
    const rolloutFund = s.rollout_fund || "";
    const rollinFund = s.rollin_fund || "";
    const rolloverType = s.rollover_type || "entire";
    const retainAmt = s.rollover_retain || "";
    const startYear = s.start_year || String(currentFY);
    if (rolloutFund && rollinFund) {
      const isPartial = rolloverType === "partial" && parseFloat(retainAmt) > 0;
      const rollover = { id: "r97_" + id, rollout_fund: rolloutFund, rollin_fund: rollinFund, rollover_entire: !isPartial, amount_type: isPartial ? "retain" : "dollar", amount: isPartial ? retainAmt : "", amount_pct: "", rollover_date: "", rollover_year: startYear, transfer_contributions: false, _strategy_id: id };
      updateFF("advice_request.transactions", { ...txns, rollovers: [...rollovers, rollover] });
    } else {
      updateFF("advice_request.transactions", { ...txns, rollovers });
    }
  };

  // Strategy 184: multi-source → new pension sync
  const applyStrat184Sync = (s, updatedStrategies) => {
    const id = s.id;
    const fullAdvice = factFind.advice_request || {};
    const txns = fullAdvice.transactions || {};
    const rollovers = (txns.rollovers || []).filter(r => r._strategy_id !== id);
    let newPensions = (txns.newPension || []).filter(p => p._strategy_id !== id);
    const sources = s.rollover_sources || [];
    const productName = s.pension_product_name || "";
    const startYear = s.start_year || String(currentFY);
    const ownerKey = s.owner_id || "client1";
    updateFF("advice_request.strategy", { ...data, strategies: updatedStrategies });
    if (sources.length > 0 && productName) {
      const newPenId = "abp184_" + id;
      const fundName = productName.split("—")[0].trim();
      const product = productName.includes("—") ? productName.split("—").slice(1).join("—").trim() : productName;
      // Inherit TF% from first pension source if any, else 0
      const firstPenSrc = sources.find(src => src.fund.startsWith("pension_"));
      const srcPenIdx = firstPenSrc?.fund.match(/^pension_(\d+)$/)?.[1];
      const srcPen = srcPenIdx !== undefined ? (factFind.pensions || [])[parseInt(srcPenIdx)] : null;
      const srcTfPct = srcPen?.tax_components?.tax_free_pct || "0";
      const newPen = { ...EMPTY_NEW_PENSION, id: newPenId, fund_name: fundName, product, owner: ownerKey, balance: "0", pension_type: "account-based", drawdown_rate: "5", drawdown_type: "percentage", tax_components: { taxable_portion: "0", tax_free_portion: "0", tax_free_pct: "calc" }, fees: { admin_fee: "0", percent_fee: "0", insurance_fee: "0" }, _strategy_id: id };
      newPensions = [...newPensions, newPen];
      const newRollovers = sources.map((src, si) => {
        const isPartial = src.rollover_type === "partial" && parseFloat(src.retain_amt) > 0;
        return { id: `r184_${id}_${si}`, rollout_fund: src.fund, rollin_fund: "new_pension_" + newPenId, rollover_entire: !isPartial, amount_type: isPartial ? "retain" : "dollar", amount: isPartial ? src.retain_amt : "", amount_pct: "", rollover_date: "", rollover_year: startYear, transfer_contributions: false, _strategy_id: id };
      });
      updateFF("advice_request.transactions", { ...txns, rollovers: [...rollovers, ...newRollovers], newPension: newPensions });
    } else {
      updateFF("advice_request.transactions", { ...txns, rollovers, newPension: newPensions });
    }
  };

  const updateStrat = (id, f, v) => {
    const updated = stratList.map(s => s.id === id ? { ...s, [f]: v } : s);
    const s = updated.find(s => s.id === id);
    // Strategy 14/15: sync rollover + new pension when key fields change
    if (s && (s.strategy_id === "14" || s.strategy_id === "15") && ["rollout_fund","pension_product_name","rollover_type","rollover_retain","start_year","owner_id"].includes(f)) {
      applyStrat14Sync(s, updated);
      return;
    }
    // Strategy 96: sync pension→new pension rollover
    if (s && s.strategy_id === "96" && ["rollout_fund","pension_product_name","rollover_type","rollover_retain","start_year","owner_id"].includes(f)) {
      applyStrat96Sync(s, updated);
      return;
    }
    // Strategy 97: sync pension→super rollover
    if (s && s.strategy_id === "97" && ["rollout_fund","rollin_fund","rollover_type","rollover_retain","start_year","owner_id"].includes(f)) {
      applyStrat97Sync(s, updated);
      return;
    }
    // Strategy 184: sync multi-source→new pension
    if (s && s.strategy_id === "184" && ["rollover_sources","pension_product_name","start_year","owner_id"].includes(f)) {
      applyStrat184Sync(s, updated);
      return;
    }
    save({ ...data, strategies: updated });
  };
  const removeStrat = (id) => { save({ ...data, strategies: stratList.filter(s => s.id !== id) }); if (editId === id) setEditId(null); };

  const pillTab = (id, icon, label) => (
    <button key={id} onClick={() => { setTab(id); setEditId(null); }} style={{
      padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: tab === id ? 600 : 500, transition: "all 0.15s",
      background: tab === id ? "var(--ps-surface)" : "transparent", boxShadow: tab === id ? "0 2px 8px var(--ps-shadow-md)" : "none", color: tab === id ? "var(--ps-text-primary)" : "var(--ps-text-muted)",
    }}>{icon} {label}</button>
  );
  const thS = { padding: "8px 10px", fontSize: 10, fontWeight: 700, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", textAlign: "left" };
  const tdS = { padding: "10px 10px", fontSize: 12, color: "var(--ps-text-body)", borderBottom: "1px solid var(--ps-border-light)" };
  const actBtn = (onClick, color, label) => <button onClick={onClick} style={{ padding: "3px 8px", borderRadius: 4, border: "none", background: "transparent", color, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{label}</button>;

  const editingModel = modelList.find(m => m.id === editId);
  const editingStrat = stratList.find(s => s.id === editId);

  // Colored section helper
  const colorSection = (bg, border, titleColor, subColor, title, sub, children) => (
    <div style={{ padding: 14, background: bg, border: "1px solid " + border, borderRadius: 10, marginTop: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: titleColor, marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 10, color: subColor, marginBottom: 10 }}>{sub}</div>
      {children}
    </div>
  );

  return (
    <div>

      {/* ════════ MODELS TAB ════════ */}
      {tab === "models" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>Advice Models</div>
            <button onClick={addModel} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#4F46E5", color: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Model</button>
          </div>
          {modelList.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", border: "2px dashed var(--ps-border)", borderRadius: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
              <div style={{ fontSize: 13, color: "var(--ps-text-subtle)" }}>No models yet. Click "Add Model" to get started.</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={thS}>Model Name</th><th style={thS}>Drawdown P1</th><th style={thS}>Surplus P1</th><th style={thS}>Portfolio Priority</th><th style={{ ...thS, textAlign: "right" }}>Actions</th>
              </tr></thead>
              <tbody>{modelList.map(m => (
                <tr key={m.id} style={{ background: editId === m.id ? "var(--ps-surface-indigo)" : "transparent", cursor: "pointer" }} onClick={() => setEditId(editId === m.id ? null : m.id)}>
                  <td style={{ ...tdS, fontWeight: 600 }}>
                    {m.name || "(Unnamed)"}
                    {m.id === "model_default" && <span style={{ marginLeft: 8, fontSize: 9, fontWeight: 700, color: "#4F46E5", background: "var(--ps-surface-indigo)", padding: "2px 6px", borderRadius: 4, border: "1px solid var(--ps-ring-indigo)" }}>DEFAULT</span>}
                  </td>
                  <td style={tdS}>{m.drawdown_priority_1 || "—"}</td>
                  <td style={tdS}>{m.surplus_priority_1 || "—"}</td>
                  <td style={tdS}>{m.portfolio_priority || "—"}</td>
                  <td style={{ ...tdS, textAlign: "right" }}>
                    {actBtn(() => setEditId(editId === m.id ? null : m.id), "#4F46E5", "✎")}
                    {m.id !== "model_default" && actBtn(() => removeModel(m.id), "#DC2626", "✕")}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}

          {/* Model Detail */}
          {editingModel && (
            <div style={{ marginTop: 12, border: "2px solid #4F46E5", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", background: "var(--ps-surface-indigo)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#4338CA" }}>📊 Model Details</div>
                <button onClick={() => setEditId(null)} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: "var(--ps-text-subtle)" }}>✕</button>
              </div>
              <div style={{ padding: 16 }}>
                <FFInput label="Model name" value={editingModel.name} onChange={v => updateModel(editingModel.id, "name", v)} placeholder="e.g. Base plan, Model 2 — Debt recycle" />
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Model description</div>
                  <textarea value={editingModel.description || ""} onChange={e => updateModel(editingModel.id, "description", e.target.value)} rows={2} placeholder="High level description of this model..."
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, resize: "vertical" }} />
                </div>

                {colorSection("var(--ps-surface-blue)", "var(--ps-ring-blue)", "#1E40AF", "#3B82F6", "Drawdown Priorities", "Rank where to access funds from first when covering a shortfall.", (
                  <div>
                    <div style={ffRowStyle}>
                      <FFSelect label="Priority 1" value={editingModel.drawdown_priority_1} onChange={v => updateModel(editingModel.id, "drawdown_priority_1", v)} options={STRAT_DRAWDOWN} />
                      <FFSelect label="Priority 2" value={editingModel.drawdown_priority_2} onChange={v => updateModel(editingModel.id, "drawdown_priority_2", v)} options={STRAT_DRAWDOWN} />
                      <FFSelect label="Priority 3" value={editingModel.drawdown_priority_3} onChange={v => updateModel(editingModel.id, "drawdown_priority_3", v)} options={STRAT_DRAWDOWN} />
                    </div>
                    <FFSelect label="Portfolio Priority" value={editingModel.portfolio_priority} onChange={v => updateModel(editingModel.id, "portfolio_priority", v)} options={STRAT_PORTFOLIO} />
                    <div style={{ fontSize: 10, color: "#3B82F6", marginTop: 2 }}>Controls sell-down order within a portfolio.</div>
                  </div>
                ))}

                {colorSection("var(--ps-surface-violet)", "#E9D5FF", "#6B21A8", "#9333EA", "Surplus Cashflow Priorities", "When income exceeds expenses, surplus funds are allocated in this order.", (
                  <div style={ffRowStyle}>
                    <FFSelect label="Priority 1" value={editingModel.surplus_priority_1} onChange={v => updateModel(editingModel.id, "surplus_priority_1", v)} options={STRAT_SURPLUS} />
                    <FFSelect label="Priority 2" value={editingModel.surplus_priority_2} onChange={v => updateModel(editingModel.id, "surplus_priority_2", v)} options={STRAT_SURPLUS} />
                    <FFSelect label="Priority 3" value={editingModel.surplus_priority_3} onChange={v => updateModel(editingModel.id, "surplus_priority_3", v)} options={STRAT_SURPLUS} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════ STRATEGIES TAB ════════ */}
      {tab === "strategies" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>Strategies</div>
            <button onClick={addStrat} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#4F46E5", color: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Strategy</button>
          </div>
          {stratList.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", border: "2px dashed var(--ps-border)", borderRadius: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⚡</div>
              <div style={{ fontSize: 13, color: "var(--ps-text-subtle)" }}>No strategies yet. Click "Add Strategy" to get started.</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={thS}>Strategy</th><th style={thS}>Category</th><th style={thS}>Start</th><th style={thS}>End</th><th style={thS}>Owner</th><th style={{ ...thS, textAlign: "right" }}>Actions</th>
              </tr></thead>
              <tbody>{stratList.map(s => {
                const stratOpt = STRAT_OPTIONS.find(o => o.value === s.strategy_id);
                return (
                <tr key={s.id} style={{ background: editId === s.id ? "var(--ps-surface-indigo)" : "transparent", cursor: "pointer" }} onClick={() => setEditId(editId === s.id ? null : s.id)}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{stratOpt?.groupIcon || "⚡"} {stratLbl(s.strategy_id)}</td>
                  <td style={{ ...tdS, fontSize: 10, color: "var(--ps-text-muted)" }}>{stratOpt?.groupLabel || "—"}</td>
                  <td style={tdS}>{s.start_year || "—"}</td>
                  <td style={tdS}>{s.end_year || "—"}</td>
                  <td style={tdS}>{getOwnerLabel(s.owner_id)}</td>
                  <td style={{ ...tdS, textAlign: "right" }}>{actBtn(() => setEditId(editId === s.id ? null : s.id), "#4F46E5", "✎")}{actBtn(() => removeStrat(s.id), "#DC2626", "✕")}</td>
                </tr>
                );
              })}</tbody>
            </table>
          )}

          {/* Strategy Detail */}
          {editingStrat && (
            <div style={{ marginTop: 12, border: "2px solid #4F46E5", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", background: "var(--ps-surface-indigo)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#4338CA" }}>⚡ Strategy Details</div>
                <button onClick={() => setEditId(null)} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: "var(--ps-text-subtle)" }}>✕</button>
              </div>
              <div style={{ padding: 16 }}>
                <div style={ffRowStyle}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Select strategy</div>
                    <select value={editingStrat.strategy_id} onChange={e => updateStrat(editingStrat.id, "strategy_id", e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}>
                      <option value="">Select...</option>
                      {STRAT_GROUPS.map(g => (
                        <optgroup key={g.id} label={`${g.icon} ${g.label}`}>
                          {g.items.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <FFSelect label="Owner" value={editingStrat.owner_id} onChange={v => updateStrat(editingStrat.id, "owner_id", v)}
                  options={editingStrat.strategy_id === "67"
                    ? ownerOpts.map(o => ({ value: o.value, label: o.labelWithSalary || o.label }))
                    : ownerOpts} />
                </div>
                <div style={ffRowStyle}>
                  <FFSelect label="Start year" value={editingStrat.start_year} onChange={v => updateStrat(editingStrat.id, "start_year", v)} options={STRAT_YEARS} />
                  {(editingStrat.strategy_id === "1" || editingStrat.strategy_id === "69" || editingStrat.strategy_id === "137" || editingStrat.strategy_id === "138" || editingStrat.strategy_id === "56" || editingStrat.strategy_id === "118" || editingStrat.strategy_id === "119" || editingStrat.strategy_id === "120" || editingStrat.strategy_id === "58" || editingStrat.strategy_id === "86" || editingStrat.strategy_id === "130" || editingStrat.strategy_id === "131" || editingStrat.strategy_id === "190" || editingStrat.strategy_id === "123" || editingStrat.strategy_id === "20" || editingStrat.strategy_id === "191" || editingStrat.strategy_id === "192" || editingStrat.strategy_id === "193" || editingStrat.strategy_id === "194" || editingStrat.strategy_id === "51" || editingStrat.strategy_id === "195" || editingStrat.strategy_id === "196" || editingStrat.strategy_id === "263" || editingStrat.strategy_id === "198" || editingStrat.strategy_id === "270" || editingStrat.strategy_id === "271" || editingStrat.strategy_id === "83" || editingStrat.strategy_id === "272") ? (
                    <div style={{ flex: 1 }} />
                  ) : (
                    <FFSelect label="End year" value={editingStrat.end_year} onChange={v => updateStrat(editingStrat.id, "end_year", v)} options={STRAT_END_YEARS} />
                  )}
                </div>
                {(editingStrat.strategy_id === "14" || editingStrat.strategy_id === "15" || editingStrat.strategy_id === "96" || editingStrat.strategy_id === "97" || editingStrat.strategy_id === "184" || editingStrat.strategy_id === "48" || editingStrat.strategy_id === "62" || editingStrat.strategy_id === "1" || editingStrat.strategy_id === "210" || editingStrat.strategy_id === "219" || editingStrat.strategy_id === "145" || editingStrat.strategy_id === "69" || editingStrat.strategy_id === "137" || editingStrat.strategy_id === "138" || editingStrat.strategy_id === "56" || editingStrat.strategy_id === "87" || editingStrat.strategy_id === "88" || editingStrat.strategy_id === "118" || editingStrat.strategy_id === "119" || editingStrat.strategy_id === "120" || editingStrat.strategy_id === "58" || editingStrat.strategy_id === "86" || editingStrat.strategy_id === "130" || editingStrat.strategy_id === "131" || editingStrat.strategy_id === "190" || editingStrat.strategy_id === "123" || editingStrat.strategy_id === "20" || editingStrat.strategy_id === "191" || editingStrat.strategy_id === "192" || editingStrat.strategy_id === "193" || editingStrat.strategy_id === "194" || editingStrat.strategy_id === "51" || editingStrat.strategy_id === "195" || editingStrat.strategy_id === "196" || editingStrat.strategy_id === "263" || editingStrat.strategy_id === "198" || editingStrat.strategy_id === "270" || editingStrat.strategy_id === "271" || editingStrat.strategy_id === "83" || editingStrat.strategy_id === "272") ? null : editingStrat.strategy_id === "23" ? (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 6 }}>Payment type</div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      {[{ value: "dollar", label: "$ Amount" }, { value: "percentage", label: "% of balance" }].map(opt => (
                        <button key={opt.value} onClick={() => updateStrat(editingStrat.id, "amount_type", opt.value)}
                          style={{ padding: "4px 14px", borderRadius: 6, border: (editingStrat.amount_type || "dollar") === opt.value ? "2px solid #4F46E5" : "1px solid var(--ps-border)", background: (editingStrat.amount_type || "dollar") === opt.value ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: (editingStrat.amount_type || "dollar") === opt.value ? "#4F46E5" : "var(--ps-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{opt.label}</button>
                      ))}
                    </div>
                    <FFInput
                      label={(editingStrat.amount_type || "dollar") === "percentage" ? "Percentage (% of balance p.a.)" : "Annual amount ($)"}
                      value={editingStrat.amount}
                      onChange={v => updateStrat(editingStrat.id, "amount", v)}
                      placeholder={(editingStrat.amount_type || "dollar") === "percentage" ? "e.g. 6" : "e.g. 30000"}
                    />
                  </div>
                ) : (
                  <FFInput
                    label={editingStrat.strategy_id === "67" ? "% of Net Salary into Offset" : "Amount"}
                    value={editingStrat.amount}
                    onChange={v => updateStrat(editingStrat.id, "amount", v)}
                    placeholder={editingStrat.strategy_id === "67" ? "e.g. 100 (= 100% of net salary)" : "e.g. $20,000 p.a."}
                    suffix={editingStrat.strategy_id === "67" ? "%" : undefined}
                  />
                )}
                {(["107","108","110","130","180","23","55","109s","52"].includes(editingStrat.strategy_id)) && editingStrat.strategy_id !== "14" && editingStrat.strategy_id !== "15" && editingStrat.strategy_id !== "96" && editingStrat.strategy_id !== "97" && editingStrat.strategy_id !== "184" && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 6 }}>Timing</div>
                    {editingStrat.strategy_id !== "52" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      {[{ value: "SOY", label: "Start of Year" }, { value: "EOY", label: "End of Year" }].map(opt => (
                        <button key={opt.value} onClick={() => updateStrat(editingStrat.id, "timing", opt.value)}
                          style={{ padding: "4px 14px", borderRadius: 6, border: (editingStrat.timing || "SOY") === opt.value ? "2px solid #4F46E5" : "1px solid var(--ps-border)", background: (editingStrat.timing || "SOY") === opt.value ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: (editingStrat.timing || "SOY") === opt.value ? "#4F46E5" : "var(--ps-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{opt.label}</button>
                      ))}
                    </div>
                    )}
                    {editingStrat.strategy_id === "52" && (
                      <div style={{ padding: "4px 12px", background: "var(--ps-border-light)", borderRadius: 6, fontSize: 11, color: "var(--ps-text-muted)", display: "inline-block" }}>Always EOY</div>
                    )}
                    <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", marginTop: 4 }}>
                      {editingStrat.strategy_id === "107" ? "Withdrawal from this member's fund, re-contribution to partner's fund as NCC (100% tax-free)." : editingStrat.strategy_id === "110" ? "Pure lump sum withdrawal — no recontribution. Net amount (after tax) paid to member." : editingStrat.strategy_id === "130" ? "Lump sum withdrawal from superannuation — net amount (after tax) paid to member. No recontribution." : editingStrat.strategy_id === "23" ? "Override the pension drawdown amount or percentage for the selected years. Clamped between minimum and maximum allowable drawdown." : editingStrat.strategy_id === "180" ? "Lump sum withdrawal from pension account. Reduces pension balance. Age 60+: tax-free." : editingStrat.strategy_id === "55" ? "One-off non-concessional contribution. Choose SOY or EOY timing." : editingStrat.strategy_id === "109s" ? "One-off spouse contribution (NCC to partner). Choose SOY or EOY timing." : editingStrat.strategy_id === "52" ? "Personal deductible contribution — always applied at end of financial year." : "Withdrawal and re-contribution to same fund as NCC (100% tax-free). Resets taxable component."}
                    </div>
                  </div>
                )}
                {(["107","108","110","130","180","23","55","109s","52"].includes(editingStrat.strategy_id)) && editingStrat.strategy_id !== "14" && editingStrat.strategy_id !== "15" && editingStrat.strategy_id !== "96" && editingStrat.strategy_id !== "97" && editingStrat.strategy_id !== "184" && (() => {
                  // Build list of super funds for the selected owner
                  const ownerKey = editingStrat.owner_id;
                  if (editingStrat.strategy_id === "180" || editingStrat.strategy_id === "23") {
                    // Pension fund selector
                    const pensionOpts = [{ ref: "", label: "— Select pension —" },
                      ...(factFind.pensions || [])
                        .map((p, i) => ({ ref: `pension_${i}`, label: `${p.fund_name || "Pension"} — ${p.product || ""}`.trim() }))
                        .filter((_, i) => (factFind.pensions || [])[i]?.owner === ownerKey)
                    ];
                    return pensionOpts.length <= 1
                      ? <div style={{ marginTop: 8, fontSize: 11, color: "var(--ps-text-subtle)" }}>No pension found for this owner.</div>
                      : <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Withdraw from pension</div>
                          <select value={editingStrat.product_id || ""} onChange={e => updateStrat(editingStrat.id, "product_id", e.target.value)}
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}>
                            {pensionOpts.map(o => <option key={o.ref} value={o.ref}>{o.label}</option>)}
                          </select>
                          <div style={{ marginTop: 6, padding: "6px 10px", background: "var(--ps-bg-amber-200)", borderRadius: 6, border: "1px solid var(--ps-ring-amber)", fontSize: 11, color: "var(--ps-badge-amber)" }}>
                            Lump sum withdrawal from pension — reduces pension balance. Age 60+: tax-free.
                          </div>
                        </div>;
                  }
                  const baseFunds = (factFind.superProducts || [])
                    .map((s, i) => ({ ref: `super_${i}`, label: `${s.fund_name || "Super"} — ${s.product || ""}`.trim() }))
                    .filter((_, i) => (factFind.superProducts || [])[i]?.owner === ownerKey);
                  const advFunds = (factFind.advice_request?.transactions?.newSuper || [])
                    .filter(s => s.owner === ownerKey)
                    .map(s => ({ ref: `new_super_${s.id}`, label: `${s.fund_name || "New Super"} — ${s.product || ""} ⬥ NEW`.trim() }));
                  const fundOpts = [{ ref: "", label: "— Select fund —" }, ...baseFunds, ...advFunds];
                  if (fundOpts.length <= 1) return (
                    <div style={{ marginTop: 8, fontSize: 11, color: "var(--ps-text-subtle)" }}>No super funds found for this owner.</div>
                  );
                  return (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>
                        {editingStrat.strategy_id === "107" || editingStrat.strategy_id === "110" ? "Withdraw from fund" : editingStrat.strategy_id === "23" ? "Pension" : "Fund"}
                      </div>
                      <select value={editingStrat.product_id || ""} onChange={e => updateStrat(editingStrat.id, "product_id", e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}>
                        {fundOpts.map(o => <option key={o.ref} value={o.ref}>{o.label}</option>)}
                      </select>
                      {(editingStrat.strategy_id === "107") && (() => {
                        // Show partner fund for recontribution (read-only info)
                        const partnerKey = ownerKey === "client1" ? "client2" : "client1";
                        const partnerFunds = [
                          ...(factFind.superProducts || []).filter(s => s.owner === partnerKey).map(s => `${s.fund_name || "Super"} — ${s.product || ""}`.trim()),
                          ...(factFind.advice_request?.transactions?.newSuper || []).filter(s => s.owner === partnerKey).map(s => `${s.fund_name || "New Super"} — ${s.product || ""} ⬥ NEW`.trim()),
                        ];
                        if (partnerFunds.length === 0) return null;
                        return (
                          <div style={{ marginTop: 6, padding: "6px 10px", background: "var(--ps-surface-green)", borderRadius: 6, border: "1px solid var(--ps-ring-emerald)" }}>
                            <div style={{ fontSize: 10, color: "var(--ps-green)", fontWeight: 600 }}>Re-contributes into partner's fund:</div>
                            <div style={{ fontSize: 11, color: "var(--ps-text-primary)", marginTop: 2 }}>{partnerFunds[0]}</div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
                {editingStrat.strategy_id === "67" && (() => {
                  const ffLiabilities = (baseFf || factFind).liabilities || [];
                  const offsetDebts = ffLiabilities.filter(d => ["1","2","3"].includes(d.d_type));
                  const debtOpts = [{ ref: "", label: "— Select debt —" }, ...offsetDebts.map((d) => {
                    const realIdx = ffLiabilities.indexOf(d);
                    const hasOffset = (d.d_offset || []).length > 0;
                    return { ref: `debt_${realIdx}`, label: `${d.d_name || "Debt " + (realIdx + 1)}${hasOffset ? "" : " ⚠ no offset linked"}` };
                  })];
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Debt with offset account</div>
                        <select value={editingStrat.product_id || ""} onChange={e => updateStrat(editingStrat.id, "product_id", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}>
                          {debtOpts.map(o => <option key={o.ref} value={o.ref}>{o.label}</option>)}
                        </select>
                      </div>

                      <div style={{ padding: "8px 10px", background: "var(--ps-surface-blue)", borderRadius: 6, border: "1px solid var(--ps-ring-blue)", fontSize: 10, color: "#1E40AF" }}>
                        Enter a <strong>percentage of net salary</strong> in the Amount field above (e.g. 100 = full salary, 80 = 80% of net pay).
                        {editingStrat.owner_id === "joint" && " Joint selection routes both salaries into the offset at their respective frequencies."}
                        Interest saving uses weighted average daily balance — capped at normal interest.
                      </div>
                    </div>
                  );
                })()}
                {editingStrat.strategy_id === "158" && (() => {
                  const ownerKey = editingStrat.owner_id || "client1";
                  const clientData = ownerKey === "client2" ? factFind.client2 : factFind.client1;
                  const empData = ownerKey === "client2"
                    ? (baseFf || factFind).client2
                    : (baseFf || factFind).client1;
                  const fbtExempt = empData?.fbt_exempt === "1";
                  const fbtCat = empData?.fbt_category || "";
                  const fbtOther = parseFloat(empData?.fbt_other_benefits) || 0;
                  const grossCap = fbtCat === "hospital" ? 9010 : fbtCat === "pbi" ? 15900 : fbtCat === "religious" ? null : 0;
                  const capAvailable = grossCap === null ? null : Math.max(0, grossCap - fbtOther);
                  // Home/investment loans only
                  const ffLiabs = (baseFf || factFind).liabilities || [];
                  const homeLoanOpts = ffLiabs
                    .map((d, i) => ["1","2"].includes(d.d_type) ? { ref: `debt_${i}`, label: `${d.d_name || "Debt " + (i+1)} — $${parseFloat(d.d_balance||0).toLocaleString()}` } : null)
                    .filter(Boolean);
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      {!fbtExempt ? (
                        <div style={{ padding: "10px 12px", background: "var(--ps-surface-red)", borderRadius: 6, border: "1px solid var(--ps-ring-red)", fontSize: 11, color: "var(--ps-badge-red)" }}>
                          ⚠ {((baseFf || factFind)[ownerKey === "client2" ? "client2" : "client1"]?.first_name) || "This client"} is not recorded as working for an FBT exempt employer.
                          Update their Employment section in the Fact Find to enable this strategy.
                        </div>
                      ) : (
                        <>
                          <div style={{ padding: "10px 12px", background: "var(--ps-surface-green)", borderRadius: 6, border: "1px solid var(--ps-ring-green)", fontSize: 11, color: "var(--ps-badge-green)" }}>
                            <div style={{ fontWeight: 700, marginBottom: 4 }}>
                              ✓ FBT Exempt — {fbtCat === "hospital" ? "Public Hospital / Ambulance" : fbtCat === "pbi" ? "PBI / Health Promotion Charity" : "Religious Institution"}
                            </div>
                            <div>Cap: {grossCap === null ? "Unlimited" : `$${grossCap.toLocaleString()} actual benefit`}</div>
                            {grossCap !== null && <div>Other packaged benefits: ${fbtOther.toLocaleString()}</div>}
                            <div style={{ fontWeight: 700, marginTop: 4, fontSize: 12 }}>
                              Available for mortgage packaging: {capAvailable === null ? "Unlimited" : `$${capAvailable.toLocaleString()}`}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Loan to package into</div>
                            <select value={editingStrat.product_id || ""} onChange={e => updateStrat(editingStrat.id, "product_id", e.target.value)}
                              style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}>
                              <option value="">— Select loan —</option>
                              {homeLoanOpts.map(o => <option key={o.ref} value={o.ref}>{o.label}</option>)}
                            </select>
                          </div>
                          <FFInput
                            label={`Annual package amount ($)${capAvailable !== null ? ` — max $${capAvailable.toLocaleString()}` : ""}`}
                            value={editingStrat.amount}
                            onChange={v => updateStrat(editingStrat.id, "amount", v)}
                            type="number" prefix="$"
                            placeholder={capAvailable !== null ? `Max $${capAvailable.toLocaleString()}` : "e.g. 9,010"} />
                          {capAvailable !== null && parseFloat(editingStrat.amount) > capAvailable && (
                            <div style={{ padding: "6px 10px", background: "var(--ps-surface-red)", borderRadius: 6, border: "1px solid var(--ps-ring-red)", fontSize: 10, color: "var(--ps-badge-red)" }}>
                              ⚠ Amount exceeds cap. Will be clamped to ${capAvailable.toLocaleString()} in the engine.
                            </div>
                          )}
                          <div style={{ padding: "6px 10px", background: "var(--ps-surface-blue)", borderRadius: 6, border: "1px solid var(--ps-ring-blue)", fontSize: 10, color: "#1E40AF" }}>
                            Pre-tax dollars fund mortgage repayments — reduces assessable income AND pays down the loan. Double benefit.
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
                {editingStrat.strategy_id === "54" && (() => {
                  const allDebts = [
                    ...(factFind.liabilities || []).map((d, i) => ({ ref: `debt_${i}`, label: `${d.d_name || "Debt " + (i+1)}${d.d_balance ? " — $" + parseFloat(d.d_balance).toLocaleString() : ""}` })),
                    ...(factFind.advice_request?.transactions?.debts || []).map((d, i) => ({ ref: `advice_debt_${i}`, label: `${d.description || "New Debt " + (i+1)} ⬥ NEW` })),
                  ];
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Debt</div>
                        <select value={editingStrat.product_id || ""} onChange={e => updateStrat(editingStrat.id, "product_id", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}>
                          <option value="">— Select debt —</option>
                          {allDebts.map(o => <option key={o.ref} value={o.ref}>{o.label}</option>)}
                        </select>
                      </div>
                      <div style={{ padding: "6px 10px", background: "#FEF9C3", borderRadius: 6, border: "1px solid var(--ps-ring-amber)", fontSize: 10, color: "var(--ps-badge-amber)" }}>
                        Enter the annual repayment in the Amount field above. Clamped between minimum repayment (floor) and outstanding balance (ceiling). Applies from Start Year onwards.
                      </div>
                    </div>
                  );
                })()}
                {editingStrat.strategy_id === "42" && (() => {
                  const ffLiabs = (baseFf || factFind).liabilities || [];
                  // Home/investment loans: redraw only (capped). Margin loans: free drawdown. Others: excluded.
                  const eligibleDebts = [
                    ...ffLiabs.map((d, i) => {
                      const isHomeInv = ["1","2","3"].includes(d.d_type);
                      const isMargin = d.d_type === "4";
                      if (!isHomeInv && !isMargin) return null;
                      const redraw = isHomeInv ? (parseFloat(d.d_redraw) || 0) : null;
                      const hasRedraw = isHomeInv ? d.d_has_redraw === "1" : true;
                      if (isHomeInv && !hasRedraw) return null;
                      const label = `${d.d_name || "Debt " + (i+1)}` +
                        (isHomeInv ? ` — Redraw: $${(redraw||0).toLocaleString()}` : ` — $${parseFloat(d.d_balance||0).toLocaleString()}`);
                      return { ref: `debt_${i}`, label, isMargin, redraw };
                    }).filter(Boolean),
                    ...(factFind.advice_request?.transactions?.debts || []).map((d, i) => {
                      const isMargin = d.debt_type === "margin";
                      const isHomeInv = ["home","investment"].includes(d.debt_type);
                      if (!isHomeInv && !isMargin) return null;
                      if (isHomeInv && !d.is_redraw_available) return null;
                      return { ref: `advice_debt_${i}`, label: `${d.description || "New Debt " + (i+1)} ⬥ NEW`, isMargin };
                    }).filter(Boolean),
                  ];
                  const selectedDebt = eligibleDebts.find(d => d.ref === editingStrat.product_id);
                  const isMarginSelected = selectedDebt?.isMargin;
                  const redrawnCap = selectedDebt?.redraw;
                  const debtOpts = [{ ref: "", label: "— Select debt —" }, ...eligibleDebts];
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>
                          {isMarginSelected ? "Debt to draw down" : "Loan to redraw from"}
                        </div>
                        <select value={editingStrat.product_id || ""} onChange={e => updateStrat(editingStrat.id, "product_id", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}>
                          {debtOpts.map(o => <option key={o.ref} value={o.ref}>{o.label}</option>)}
                        </select>
                      </div>
                      <FFInput
                        label={isMarginSelected ? "Drawdown amount ($)" : "Redraw amount ($)"}
                        value={editingStrat.amount} onChange={v => updateStrat(editingStrat.id, "amount", v)}
                        type="number" prefix="$"
                        placeholder={redrawnCap != null ? `Max $${redrawnCap.toLocaleString()} redraw available` : "e.g. 50,000"} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Timing</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {[{ value: "SOY", label: "Start of Year" }, { value: "EOY", label: "End of Year" }].map(opt => (
                            <button key={opt.value} onClick={() => updateStrat(editingStrat.id, "timing", opt.value)}
                              style={{ padding: "4px 14px", borderRadius: 6, border: (editingStrat.timing || "SOY") === opt.value ? "2px solid #4F46E5" : "1px solid var(--ps-border)", background: (editingStrat.timing || "SOY") === opt.value ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: (editingStrat.timing || "SOY") === opt.value ? "#4F46E5" : "var(--ps-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{opt.label}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ padding: "6px 10px", background: isMarginSelected ? "var(--ps-bg-amber-200)" : "var(--ps-surface-green)", borderRadius: 6, border: `1px solid ${isMarginSelected ? "#FCD34D" : "#86EFAC"}`, fontSize: 10, color: isMarginSelected ? "var(--ps-badge-amber)" : "var(--ps-badge-green)" }}>
                        {isMarginSelected
                          ? "Drawdown increases debt balance and flows into savings."
                          : "Redraw accesses extra principal already paid — capped at redraw available. Flows into savings."}
                      </div>
                    </div>
                  );
                })()}
                {editingStrat.strategy_id === "66" && (() => {
                  const ownerKey = editingStrat.owner_id;
                  const allDebts = [
                    ...(factFind.liabilities || []).map((d, i) => ({ ref: `debt_${i}`, label: `${d.d_name || d.description || "Debt " + (i+1)}${d.d_balance ? " — $" + parseFloat(d.d_balance).toLocaleString() : ""}` })),
                    ...(factFind.advice_request?.transactions?.debts || []).map((d, i) => ({ ref: `advice_debt_${i}`, label: `${d.description || "New Debt " + (i+1)} ⬥ NEW` })),
                  ];
                  const debtOpts = [{ ref: "", label: "— Select debt —" }, ...allDebts];
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Debt to repay</div>
                        <select value={editingStrat.product_id || ""} onChange={e => updateStrat(editingStrat.id, "product_id", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}>
                          {debtOpts.map(o => <option key={o.ref} value={o.ref}>{o.label}</option>)}
                        </select>
                      </div>
                      <FFInput label="Lump sum amount ($)" value={editingStrat.amount} onChange={v => updateStrat(editingStrat.id, "amount", v)} type="number" prefix="$" placeholder="e.g. 50000" />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Timing</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {[{ value: "SOY", label: "Start of Year" }, { value: "EOY", label: "End of Year" }].map(opt => (
                            <button key={opt.value} onClick={() => updateStrat(editingStrat.id, "timing", opt.value)}
                              style={{ padding: "4px 14px", borderRadius: 6, border: (editingStrat.timing || "SOY") === opt.value ? "2px solid #4F46E5" : "1px solid var(--ps-border)", background: (editingStrat.timing || "SOY") === opt.value ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: (editingStrat.timing || "SOY") === opt.value ? "#4F46E5" : "var(--ps-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{opt.label}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ padding: "6px 10px", background: "var(--ps-bg-amber-200)", borderRadius: 6, border: "1px solid var(--ps-ring-amber)", fontSize: 10, color: "var(--ps-badge-amber)" }}>
                        Lump sum reduces debt balance and is paid from savings.
                      </div>
                    </div>
                  );
                })()}
                {editingStrat.strategy_id === "82" && (() => {
                  const ownerKey = editingStrat.owner_id;
                  const annuityOpts = [
                    { ref: "", label: "— Select annuity —" },
                    ...(factFind.annuities || [])
                      .filter(a => a.owner === ownerKey)
                      .map(a => { const i = (factFind.annuities || []).indexOf(a); return { ref: `annuity_${i}`, label: `${a.product || "Annuity " + (i+1)}${a.income?.annual_income ? " — $" + parseFloat(a.income.annual_income).toLocaleString() + " p.a." : ""}` }; }),
                  ];
                  const selectedAnn = editingStrat.product_id?.match(/^annuity_(\d+)$/);
                  const ann = selectedAnn ? (factFind.annuities || [])[parseInt(selectedAnn[1])] : null;
                  const purchasePrice = ann ? parseFloat(ann.purchase_price) || 0 : 0;
                  const exitPct = parseFloat(editingStrat.exit_cost_pct) || 0;
                  const isPartial = editingStrat.redemption_type === "partial";
                  const partialPct = parseFloat(editingStrat.partial_pct) || 100;
                  const redemptionBase = purchasePrice * (partialPct / 100);
                  const exitCost = Math.round(redemptionBase * exitPct / 100);
                  const netProceeds = Math.round(redemptionBase - exitCost);
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Annuity to redeem</div>
                        <select value={editingStrat.product_id || ""} onChange={e => updateStrat(editingStrat.id, "product_id", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}>
                          {annuityOpts.map(o => <option key={o.ref} value={o.ref}>{o.label}</option>)}
                        </select>
                      </div>
                      {ann && (
                        <div style={{ padding: "8px 12px", background: "var(--ps-surface-alt)", borderRadius: 6, border: "1px solid var(--ps-border)", fontSize: 11 }}>
                          <div style={{ color: "var(--ps-text-muted)" }}>Purchase price: <strong style={{ color: "var(--ps-text-primary)" }}>${purchasePrice.toLocaleString()}</strong></div>
                          <div style={{ color: "var(--ps-text-muted)", marginTop: 2 }}>Annual income: <strong style={{ color: "var(--ps-text-primary)" }}>${(parseFloat(ann.income?.annual_income) || 0).toLocaleString()}</strong></div>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Redemption type</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {[{ value: "full", label: "Full" }, { value: "partial", label: "Partial" }].map(opt => (
                            <button key={opt.value} onClick={() => updateStrat(editingStrat.id, "redemption_type", opt.value)}
                              style={{ padding: "4px 14px", borderRadius: 6, border: (editingStrat.redemption_type || "full") === opt.value ? "2px solid #4F46E5" : "1px solid var(--ps-border)", background: (editingStrat.redemption_type || "full") === opt.value ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: (editingStrat.redemption_type || "full") === opt.value ? "#4F46E5" : "var(--ps-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{opt.label}</button>
                          ))}
                        </div>
                      </div>
                      {isPartial && (
                        <FFInput label="Partial redemption (%)" value={editingStrat.partial_pct} onChange={v => updateStrat(editingStrat.id, "partial_pct", v)} type="number" suffix="%" placeholder="e.g. 50" />
                      )}
                      <FFInput label="Exit cost (%)" value={editingStrat.exit_cost_pct} onChange={v => updateStrat(editingStrat.id, "exit_cost_pct", v)} type="number" suffix="%" placeholder="e.g. 2" />
                      {ann && (
                        <div style={{ padding: "8px 12px", background: "var(--ps-surface-green)", borderRadius: 6, border: "1px solid var(--ps-ring-emerald)", fontSize: 11 }}>
                          <div style={{ color: "var(--ps-text-muted)" }}>Redemption amount: <strong style={{ color: "var(--ps-text-primary)" }}>${Math.round(redemptionBase).toLocaleString()}</strong></div>
                          <div style={{ color: "var(--ps-red)", marginTop: 2 }}>Exit cost: <strong>-${exitCost.toLocaleString()}</strong></div>
                          <div style={{ color: "var(--ps-green)", marginTop: 2, fontWeight: 700 }}>Net to savings: ${netProceeds.toLocaleString()}</div>
                          {isPartial && <div style={{ color: "var(--ps-text-muted)", marginTop: 2 }}>Remaining income: <strong style={{ color: "var(--ps-text-primary)" }}>${Math.round((parseFloat(ann.income?.annual_income)||0) * (1 - partialPct/100)).toLocaleString()} p.a.</strong></div>}
                        </div>
                      )}
                      <div style={{ padding: "6px 10px", background: "var(--ps-bg-amber-200)", borderRadius: 6, border: "1px solid var(--ps-ring-amber)", fontSize: 10, color: "var(--ps-badge-amber)" }}>
                        Net proceeds land in savings at SOY. {isPartial ? "Future annuity payments reduced proportionally." : "All future annuity payments stop."}
                      </div>
                    </div>
                  );
                })()}
                {(editingStrat.strategy_id === "14" || editingStrat.strategy_id === "15") && (() => {
                  const ownerKey = editingStrat.owner_id;
                  const superOpts = [
                    { ref: "", label: "— Select super fund —" },
                    ...(factFind.superProducts || [])
                      .filter(s => s.owner === ownerKey)
                      .map(s => { const i = (factFind.superProducts || []).indexOf(s); return { ref: `super_${i}`, label: `${s.fund_name || "Super"}${s.product ? " — " + s.product : ""}`.trim() }; }),
                  ];
                  const rollAmt = editingStrat.rollover_type || "entire";
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Roll out from (Super fund)</div>
                        <select value={editingStrat.rollout_fund || ""} onChange={e => { updateStrat(editingStrat.id, "rollout_fund", e.target.value); }}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}>
                          {superOpts.map(o => <option key={o.ref} value={o.ref}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>New pension product name</div>
                        <input type="text" value={editingStrat.pension_product_name || ""} onChange={e => updateStrat(editingStrat.id, "pension_product_name", e.target.value)}
                          placeholder="e.g. AustralianSuper — Account Based Pension"
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 6 }}>Rollover amount</div>
                        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                          {[{ value: "entire", label: "Entire balance" }, { value: "partial", label: "Leave amount in super" }].map(opt => (
                            <button key={opt.value} onClick={() => updateStrat(editingStrat.id, "rollover_type", opt.value)}
                              style={{ padding: "5px 12px", borderRadius: 6, border: rollAmt === opt.value ? "2px solid #4F46E5" : "1px solid var(--ps-border)", background: rollAmt === opt.value ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: rollAmt === opt.value ? "#4F46E5" : "var(--ps-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{opt.label}</button>
                          ))}
                        </div>
                        {rollAmt === "partial" && (
                          <FFInput label="Amount to leave in super ($)" value={editingStrat.rollover_retain || ""} onChange={v => updateStrat(editingStrat.id, "rollover_retain", v)} placeholder="e.g. 50000" />
                        )}
                      </div>
                      <div style={{ padding: "8px 12px", background: "var(--ps-surface-indigo)", borderRadius: 8, border: "1px solid var(--ps-ring-indigo)", fontSize: 11, color: "#4338CA" }}>
                        💸 A new <strong>{editingStrat.strategy_id === "15" ? "Transition to Retirement Pension" : "Account Based Pension"}</strong> will appear in Products → Pension. Configure drawdown rate and fees there. {editingStrat.strategy_id === "15" ? "Earnings taxed at 15%. Max drawdown 10%." : ""}
                      </div>
                    </div>
                  );
                })()}

                {editingStrat.strategy_id === "97" && (() => {
                  const ownerKey = editingStrat.owner_id;
                  const pensionOpts = [
                    { ref: "", label: "— Select pension fund —" },
                    ...(factFind.pensions || [])
                      .filter(p => p.owner === ownerKey)
                      .map(p => { const i = (factFind.pensions || []).indexOf(p); return { ref: `pension_${i}`, label: `${p.fund_name || "Pension"}${p.product ? " — " + p.product : ""}`.trim() }; }),
                  ];
                  const superOpts = [
                    { ref: "", label: "— Select super fund —" },
                    ...(factFind.superProducts || [])
                      .filter(s => s.owner === ownerKey)
                      .map(s => { const i = (factFind.superProducts || []).indexOf(s); return { ref: `super_${i}`, label: `${s.fund_name || "Super"}${s.product ? " — " + s.product : ""}`.trim() }; }),
                  ];
                  const rollAmt = editingStrat.rollover_type || "entire";
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Roll out from (Pension fund)</div>
                        <select value={editingStrat.rollout_fund || ""} onChange={e => updateStrat(editingStrat.id, "rollout_fund", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}>
                          {pensionOpts.map(o => <option key={o.ref} value={o.ref}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Roll in to (Super fund)</div>
                        <select value={editingStrat.rollin_fund || ""} onChange={e => updateStrat(editingStrat.id, "rollin_fund", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}>
                          {superOpts.map(o => <option key={o.ref} value={o.ref}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 6 }}>Rollover amount</div>
                        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                          {[{ value: "entire", label: "Entire balance" }, { value: "partial", label: "Leave amount in pension" }].map(opt => (
                            <button key={opt.value} onClick={() => updateStrat(editingStrat.id, "rollover_type", opt.value)}
                              style={{ padding: "5px 12px", borderRadius: 6, border: rollAmt === opt.value ? "2px solid #4F46E5" : "1px solid var(--ps-border)", background: rollAmt === opt.value ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: rollAmt === opt.value ? "#4F46E5" : "var(--ps-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{opt.label}</button>
                          ))}
                        </div>
                        {rollAmt === "partial" && (
                          <FFInput label="Amount to leave in pension ($)" value={editingStrat.rollover_retain || ""} onChange={v => updateStrat(editingStrat.id, "rollover_retain", v)} placeholder="e.g. 50000" />
                        )}
                      </div>
                      <div style={{ padding: "8px 12px", background: "var(--ps-surface-orange)", borderRadius: 8, border: "1px solid var(--ps-ring-orange)", fontSize: 11, color: "#9A3412" }}>
                        ↩️ Rolling back to accumulation phase. TBC will not be reduced — commutation must be reported to ATO. Earnings in super taxed at 15%.
                      </div>
                    </div>
                  );
                })()}

                {editingStrat.strategy_id === "96" && (() => {
                  const ownerKey = editingStrat.owner_id;
                  const pensionOpts = [
                    { ref: "", label: "— Select pension fund —" },
                    ...(factFind.pensions || [])
                      .filter(p => p.owner === ownerKey)
                      .map(p => { const i = (factFind.pensions || []).indexOf(p); return { ref: `pension_${i}`, label: `${p.fund_name || "Pension"}${p.product ? " — " + p.product : ""}`.trim() }; }),
                  ];
                  const rollAmt = editingStrat.rollover_type || "entire";
                  // Show inherited TF% from selected source pension
                  const srcPenIdx = (editingStrat.rollout_fund || "").match(/^pension_(\d+)$/)?.[1];
                  const srcPen = srcPenIdx !== undefined ? (factFind.pensions || [])[parseInt(srcPenIdx)] : null;
                  const srcTfPct = srcPen?.tax_components?.tax_free_pct || null;
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Roll out from (existing pension)</div>
                        <select value={editingStrat.rollout_fund || ""} onChange={e => updateStrat(editingStrat.id, "rollout_fund", e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}>
                          {pensionOpts.map(o => <option key={o.ref} value={o.ref}>{o.label}</option>)}
                        </select>
                        {srcTfPct && (
                          <div style={{ marginTop: 4, fontSize: 11, color: "#6366F1" }}>Tax-free % {srcTfPct}% will carry to new pension</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>New pension product name</div>
                        <input type="text" value={editingStrat.pension_product_name || ""} onChange={e => updateStrat(editingStrat.id, "pension_product_name", e.target.value)}
                          placeholder="e.g. AustralianSuper — Account Based Pension"
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 6 }}>Rollover amount</div>
                        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                          {[{ value: "entire", label: "Entire balance" }, { value: "partial", label: "Leave amount in pension" }].map(opt => (
                            <button key={opt.value} onClick={() => updateStrat(editingStrat.id, "rollover_type", opt.value)}
                              style={{ padding: "5px 12px", borderRadius: 6, border: rollAmt === opt.value ? "2px solid #4F46E5" : "1px solid var(--ps-border)", background: rollAmt === opt.value ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: rollAmt === opt.value ? "#4F46E5" : "var(--ps-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{opt.label}</button>
                          ))}
                        </div>
                        {rollAmt === "partial" && (
                          <FFInput label="Amount to leave in existing pension ($)" value={editingStrat.rollover_retain || ""} onChange={v => updateStrat(editingStrat.id, "rollover_retain", v)} placeholder="e.g. 50000" />
                        )}
                      </div>
                      <div style={{ padding: "8px 12px", background: "var(--ps-surface-indigo)", borderRadius: 8, border: "1px solid var(--ps-ring-indigo)", fontSize: 11, color: "#4338CA" }}>
                        💸 A new <strong>Account Based Pension</strong> will appear in Products → Pension. Configure drawdown rate and fees there. Tax-free % carried from source pension.
                      </div>
                    </div>
                  );
                })()}

                {editingStrat.strategy_id === "184" && (() => {
                  const ownerKey = editingStrat.owner_id || "client1";
                  const sources = editingStrat.rollover_sources || [];
                  // Build all available fund options — pensions + super filtered to owner
                  const allFundOpts = [
                    ...(factFind.pensions || [])
                      .filter(p => p.owner === ownerKey)
                      .map((p, i) => {
                        const realIdx = (factFind.pensions || []).indexOf(p);
                        return { ref: `pension_${realIdx}`, label: `${p.fund_name || "Pension"}${p.product ? " — " + p.product : ""}`.trim(), type: "pension" };
                      }),
                    ...(factFind.superProducts || [])
                      .filter(s => s.owner === ownerKey)
                      .map((s, i) => {
                        const realIdx = (factFind.superProducts || []).indexOf(s);
                        return { ref: `super_${realIdx}`, label: `${s.fund_name || "Super"}${s.product ? " — " + s.product : ""}`.trim(), type: "super" };
                      }),
                  ];
                  // Already-selected fund refs (to grey out duplicates)
                  const selectedRefs = sources.map(s => s.fund);
                  const addSource = () => {
                    const firstAvail = allFundOpts.find(o => !selectedRefs.includes(o.ref));
                    if (!firstAvail) return;
                    const newSources = [...sources, { fund: firstAvail.ref, rollover_type: "entire", retain_amt: "" }];
                    updateStrat(editingStrat.id, "rollover_sources", newSources);
                  };
                  const updateSource = (si, key, val) => {
                    const newSources = sources.map((s, i) => i === si ? { ...s, [key]: val } : s);
                    updateStrat(editingStrat.id, "rollover_sources", newSources);
                  };
                  const removeSource = (si) => {
                    const newSources = sources.filter((_, i) => i !== si);
                    updateStrat(editingStrat.id, "rollover_sources", newSources);
                  };
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 12 }}>
                      {/* Source funds list */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)" }}>Rollover sources</div>
                          <button onClick={addSource} disabled={allFundOpts.length === 0 || selectedRefs.length >= allFundOpts.length}
                            style={{ padding: "4px 10px", borderRadius: 6, border: "1px dashed #6366F1", background: "var(--ps-surface-indigo)", color: "#4F46E5", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            + Add source
                          </button>
                        </div>
                        {sources.length === 0 && (
                          <div style={{ padding: "12px 14px", background: "var(--ps-surface-alt)", borderRadius: 8, border: "1px dashed var(--ps-border-mid)", fontSize: 11, color: "var(--ps-text-subtle)", textAlign: "center" }}>
                            No sources added yet. Click "+ Add source" to begin.
                          </div>
                        )}
                        {sources.map((src, si) => {
                          return (
                            <div key={si} style={{ marginBottom: 8, padding: "10px 12px", background: "var(--ps-surface-alt)", borderRadius: 8, border: "1px solid var(--ps-border)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <select value={src.fund} onChange={e => updateSource(si, "fund", e.target.value)}
                                  style={{ flex: 1, padding: "6px 8px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)" }}>
                                  {allFundOpts.map(o => (
                                    <option key={o.ref} value={o.ref} disabled={selectedRefs.includes(o.ref) && o.ref !== src.fund}>[{o.type === "pension" ? "Pension" : "Super"}] {o.label}</option>
                                  ))}
                                </select>
                                <button onClick={() => removeSource(si)} style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: "var(--ps-bg-red-200)", color: "var(--ps-red)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✕</button>
                              </div>
                              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                {[{ value: "entire", label: "Entire balance" }, { value: "partial", label: "Leave amount" }].map(opt => (
                                  <button key={opt.value} onClick={() => updateSource(si, "rollover_type", opt.value)}
                                    style={{ padding: "3px 10px", borderRadius: 6, border: src.rollover_type === opt.value ? "2px solid #4F46E5" : "1px solid var(--ps-border)", background: src.rollover_type === opt.value ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: src.rollover_type === opt.value ? "#4F46E5" : "var(--ps-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{opt.label}</button>
                                ))}
                                {src.rollover_type === "partial" && (
                                  <input type="number" value={src.retain_amt || ""} onChange={e => updateSource(si, "retain_amt", e.target.value)}
                                    placeholder="Leave ($)" style={{ width: 100, padding: "4px 8px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12 }} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* New pension name */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>New pension product name</div>
                        <input type="text" value={editingStrat.pension_product_name || ""} onChange={e => updateStrat(editingStrat.id, "pension_product_name", e.target.value)}
                          placeholder="e.g. AustralianSuper — Account Based Pension"
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, boxSizing: "border-box" }} />
                      </div>
                      <div style={{ padding: "8px 12px", background: "var(--ps-surface-indigo)", borderRadius: 8, border: "1px solid var(--ps-ring-indigo)", fontSize: 11, color: "#4338CA" }}>
                        💸 A new <strong>Account Based Pension</strong> will appear in Products → Pension. All selected sources will roll into it. Tax-free % inherited from first pension source.
                      </div>
                    </div>
                  );
                })()}
                {editingStrat.strategy_id === "57" && (() => {
                  const radPct = parseFloat(editingStrat.rad_pct) || 100;
                  const totalRAD = parseFloat(editingStrat.amount) || 0;
                  const radPaid = Math.round(totalRAD * radPct / 100);
                  const dapPortion = totalRAD - radPaid;
                  const MPIR = 0.082;
                  const dapAnnual = Math.round(dapPortion * MPIR);
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 2 }}>RAD / DAP Split</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <input type="range" min="0" max="100" step="5" value={radPct}
                          onChange={e => updateStrat(editingStrat.id, "rad_pct", e.target.value)}
                          style={{ flex: 1, accentColor: "#4F46E5" }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#4F46E5", minWidth: 48, textAlign: "right" }}>{radPct}%</span>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "var(--ps-surface-indigo)", border: "1px solid var(--ps-ring-indigo)" }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>RAD (lump sum)</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#4F46E5", fontFamily: "'JetBrains Mono', monospace" }}>${radPaid.toLocaleString()}</div>
                        </div>
                        <div style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "var(--ps-surface-amber)", border: "1px solid var(--ps-ring-amber)" }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>DAP (ongoing)</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#D97706", fontFamily: "'JetBrains Mono', monospace" }}>${dapAnnual.toLocaleString()}/yr</div>
                          <div style={{ fontSize: 10, color: "var(--ps-text-subtle)" }}>on ${dapPortion.toLocaleString()} @ {(MPIR*100).toFixed(2)}% MPIR</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ps-text-muted)", padding: "6px 10px", background: "var(--ps-surface-alt)", borderRadius: 6 }}>
                        💡 Amount field = total room price. RAD % controls how much is paid as lump sum vs ongoing DAP.
                      </div>
                    </div>
                  );
                })()}
                {/* ── Granny Flat Interest — Property Transfer (137) ── */}
                {editingStrat.strategy_id === "137" && (() => {
                  // Get principal residences from fact find
                  const ffA = (baseFf || factFind).assets || [];
                  const homes = ffA.map((a, i) => ({ ...a, idx: i })).filter(a => a.a_type === "1");
                  const selIdx = parseInt(editingStrat.granny_property_idx) || 0;
                  const selHome = ffA[selIdx];
                  const homeVal = selHome ? (parseFloat(selHome.a_value) || 0) : 0;
                  const extraCash = parseFloat(editingStrat.granny_extra_cash) || 0;
                  const totalTransferred = homeVal + extraCash;

                  // Client age next birthday for conversion factor
                  const ownerKey = editingStrat.owner_id || "client1";
                  const clientDob = ownerKey === "client2" ? factFind.client2?.date_of_birth : factFind.client1?.date_of_birth;
                  const partnerDob = ownerKey === "client2" ? factFind.client1?.date_of_birth : factFind.client2?.date_of_birth;
                  const ageNext = (dob) => { if (!dob) return null; const d = new Date(dob); const now = new Date(); let a = now.getFullYear() - d.getFullYear(); return a + 1; };
                  const clientAgeNext = ageNext(clientDob);
                  // For couples, use younger partner's age
                  const partnerAgeNext = ageNext(partnerDob);
                  const relevantAge = (partnerAgeNext && partnerAgeNext < clientAgeNext) ? partnerAgeNext : clientAgeNext;

                  // Conversion factor table from DSS Guide 4.6.4.60 (age next birthday → factor)
                  // Based on Australian Life Tables 2010-2012. For couples, use younger partner's age next birthday.
                  const CF_TABLE = {65:21.48,66:20.64,67:19.80,68:18.98,69:18.16,70:17.36,71:16.56,72:15.77,73:15.01,74:14.25,75:13.50,76:12.78,77:12.07,78:11.37,79:10.70,80:10.04,81:9.41,82:8.80,83:8.21,84:7.65,85:7.11,86:6.60,87:6.13,88:5.68,89:5.26,90:4.87,91:4.52,92:4.19,93:3.89,94:3.63,95:3.40,96:3.19,97:3.01,98:2.86,99:2.72,100:2.60};
                  const cf = CF_TABLE[relevantAge] || (relevantAge > 100 ? 2.60 : relevantAge < 65 ? 21.48 : 21.48);

                  // Combined annual partnered pension rate (2025-26) — used irrespective of marital status
                  const COMBINED_PARTNERED_RATE = 46202;
                  const reasonablenessAmt = Math.round(COMBINED_PARTNERED_RATE * cf);

                  // Determine if reasonableness test applies
                  const hasExtraCash = extraCash > 0;
                  // Property transfer only = no reasonableness test, value = home value
                  // Property transfer + extra cash = reasonableness test applies
                  let grannyFlatValue, deprivationAmt, reasonablenessApplies;
                  if (!hasExtraCash) {
                    reasonablenessApplies = false;
                    grannyFlatValue = homeVal;
                    deprivationAmt = 0;
                  } else {
                    reasonablenessApplies = true;
                    // Value = greater of (home value) and (reasonableness test amount)
                    grannyFlatValue = Math.max(homeVal, reasonablenessAmt);
                    deprivationAmt = Math.max(0, totalTransferred - grannyFlatValue);
                  }

                  // Gifting allowance reduces deprivation
                  const giftFreeArea = 10000;
                  const deprivedAsset = Math.max(0, deprivationAmt - giftFreeArea);

                  // Entry contribution for homeowner determination
                  const EAA = 258000; // Extra Allowable Amount from 1 July 2025
                  const entryContribution = reasonablenessApplies
                    ? (totalTransferred > reasonablenessAmt ? grannyFlatValue : totalTransferred)
                    : grannyFlatValue;
                  const isHomeowner = entryContribution > EAA;

                  const kpiStyle = { flex: 1, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" };
                  const kpiLabel = { fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" };
                  const kpiVal = { fontSize: 16, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" };
                  const selStyle = { width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" };
                  const inputStyle = { ...selStyle, width: 140 };

                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      {/* Property selector */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Principal residence to transfer</div>
                        <select value={editingStrat.granny_property_idx || "0"} onChange={e => updateStrat(editingStrat.id, "granny_property_idx", e.target.value)} style={selStyle}>
                          {homes.length === 0 && <option value="">— No principal residence found —</option>}
                          {homes.map(h => <option key={h.idx} value={String(h.idx)}>{h.a_name || `Property ${h.idx + 1}`} — ${(parseFloat(h.a_value) || 0).toLocaleString()}</option>)}
                        </select>
                      </div>

                      {/* Additional cash */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Additional cash transferred (optional)</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-secondary)" }}>$</span>
                          <input type="number" value={editingStrat.granny_extra_cash || ""} onChange={e => updateStrat(editingStrat.id, "granny_extra_cash", e.target.value)} placeholder="0" style={inputStyle} />
                        </div>
                        <div style={{ fontSize: 9, color: "var(--ps-text-subtle)", marginTop: 2 }}>Cash paid on top of property transfer. Triggers reasonableness test.</div>
                      </div>

                      {/* KPI tiles row 1: Home value + Extra cash + Total */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={kpiStyle}>
                          <div style={kpiLabel}>Home Value</div>
                          <div style={{ ...kpiVal, color: "var(--ps-text-primary)" }}>${homeVal.toLocaleString()}</div>
                        </div>
                        {extraCash > 0 && <div style={kpiStyle}>
                          <div style={kpiLabel}>Extra Cash</div>
                          <div style={{ ...kpiVal, color: "var(--ps-text-primary)" }}>${extraCash.toLocaleString()}</div>
                        </div>}
                        <div style={kpiStyle}>
                          <div style={kpiLabel}>Total Transferred</div>
                          <div style={{ ...kpiVal, color: "var(--ps-text-primary)" }}>${totalTransferred.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* KPI tiles row 2: Reasonableness + Granny Flat Value + Deprivation */}
                      <div style={{ display: "flex", gap: 8 }}>
                        {reasonablenessApplies && <div style={kpiStyle}>
                          <div style={kpiLabel}>Reasonableness Test</div>
                          <div style={{ ...kpiVal, color: "#2563EB" }}>${reasonablenessAmt.toLocaleString()}</div>
                          <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>Factor {cf} × $46,202 (age {relevantAge})</div>
                        </div>}
                        <div style={{ ...kpiStyle, background: "var(--ps-surface-green)", border: "1px solid var(--ps-ring-emerald)" }}>
                          <div style={kpiLabel}>Granny Flat Interest Value</div>
                          <div style={{ ...kpiVal, color: "var(--ps-green)" }}>${grannyFlatValue.toLocaleString()}</div>
                        </div>
                        <div style={{ ...kpiStyle, background: deprivedAsset > 0 ? "#FEF2F2" : "var(--ps-surface-green)", border: deprivedAsset > 0 ? "1px solid #FECACA" : "1px solid var(--ps-ring-emerald)" }}>
                          <div style={kpiLabel}>Deprived Asset</div>
                          <div style={{ ...kpiVal, color: deprivedAsset > 0 ? "#DC2626" : "var(--ps-green)" }}>${deprivedAsset.toLocaleString()}</div>
                          {deprivationAmt > 0 && deprivationAmt <= giftFreeArea && <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>Within $10k gifting free area</div>}
                          {deprivedAsset > 0 && <div style={{ fontSize: 9, color: "#DC2626" }}>Assessed for 5 years (assets + deemed)</div>}
                        </div>
                      </div>

                      {/* Homeowner status + Max Cash */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={kpiStyle}>
                          <div style={kpiLabel}>Entry Contribution</div>
                          <div style={{ ...kpiVal, color: "var(--ps-text-primary)" }}>${entryContribution.toLocaleString()}</div>
                        </div>
                        <div style={kpiStyle}>
                          <div style={kpiLabel}>Extra Allowable Amount</div>
                          <div style={{ ...kpiVal, color: "var(--ps-text-primary)" }}>${EAA.toLocaleString()}</div>
                        </div>
                        <div style={{ ...kpiStyle, background: isHomeowner ? "var(--ps-surface-green)" : "#FFF7ED", border: isHomeowner ? "1px solid var(--ps-ring-emerald)" : "1px solid #FED7AA" }}>
                          <div style={kpiLabel}>Centrelink Status</div>
                          <div style={{ ...kpiVal, fontSize: 14, color: isHomeowner ? "var(--ps-green)" : "#EA580C" }}>{isHomeowner ? "✓ Homeowner" : "Non-homeowner"}</div>
                          <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>{isHomeowner ? "EC exempt from assets test" : "EC assessed under assets test"}</div>
                        </div>
                      </div>

                      {/* Max additional cash headroom */}
                      {(() => {
                        const maxCash = Math.max(0, reasonablenessAmt - homeVal);
                        return (
                          <div style={{ ...kpiStyle, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
                            <div style={kpiLabel}>Maximum Additional Cash (no deprivation)</div>
                            <div style={{ ...kpiVal, color: "#2563EB" }}>${maxCash.toLocaleString()}</div>
                            <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>Reasonableness amount (${reasonablenessAmt.toLocaleString()}) minus home value (${homeVal.toLocaleString()})</div>
                          </div>
                        );
                      })()}

                      {/* Deprivation warning */}
                      {deprivedAsset > 0 && (
                        <div style={{ padding: "8px 12px", background: "#FEF2F2", borderRadius: 6, border: "1px solid #FECACA", fontSize: 11, color: "#991B1B", display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 16, lineHeight: 1 }}>⚠️</span>
                          <div>
                            <strong>Deprivation warning</strong>: The additional cash of ${extraCash.toLocaleString()} exceeds the headroom by ${deprivedAsset.toLocaleString()} (after $10k gifting free area).
                            This amount will be assessed as a <strong>deprived asset</strong> in Centrelink's assets test AND deemed for the income test for <strong>5 years</strong> from the date of the granny flat arrangement.
                            Consider reducing the additional cash to stay within the reasonableness amount.
                          </div>
                        </div>
                      )}

                      {/* Info box */}
                      <div style={{ padding: "6px 10px", background: "var(--ps-surface-blue)", borderRadius: 6, border: "1px solid var(--ps-ring-blue)", fontSize: 10, color: "#1E40AF" }}>
                        <strong>Property transfer</strong>: Client transfers title of principal residence to child in exchange for a lifetime right to live there.
                        {!hasExtraCash ? " No additional assets = no reasonableness test. Value of granny flat interest equals the home value." : " Extra cash triggers the reasonableness test. Value = greater of home value and reasonableness amount."}
                        {isHomeowner ? " Homeowner: entry contribution is exempt from the Age Pension assets test." : " Non-homeowner: entry contribution is assessable under the assets test (higher threshold applies)."}
                        {" "}Client must NOT have any ownership interest in the new home.
                      </div>
                    </div>
                  );
                })()}
                {/* ── Granny Flat Interest — Funds Transfer (138) ── */}
                {editingStrat.strategy_id === "138" && (() => {
                  const ffA = (baseFf || factFind).assets || [];
                  const homes = ffA.map((a, i) => ({ ...a, idx: i })).filter(a => a.a_type === "1");
                  const selIdx = parseInt(editingStrat.granny_property_idx) || 0;
                  const selHome = ffA[selIdx];
                  const homeVal = selHome ? (parseFloat(selHome.a_value) || 0) : 0;
                  const cashAmount = parseFloat(editingStrat.granny_cash_amount) || 0;

                  // Client age next birthday for conversion factor
                  const ownerKey = editingStrat.owner_id || "client1";
                  const clientDob = ownerKey === "client2" ? factFind.client2?.date_of_birth : factFind.client1?.date_of_birth;
                  const partnerDob = ownerKey === "client2" ? factFind.client1?.date_of_birth : factFind.client2?.date_of_birth;
                  const ageNext = (dob) => { if (!dob) return null; const d = new Date(dob); const now = new Date(); return now.getFullYear() - d.getFullYear() + 1; };
                  const clientAgeNext = ageNext(clientDob);
                  const partnerAgeNext = ageNext(partnerDob);
                  const relevantAge = (partnerAgeNext && partnerAgeNext < clientAgeNext) ? partnerAgeNext : clientAgeNext;

                  const CF_TABLE = {65:21.48,66:20.64,67:19.80,68:18.98,69:18.16,70:17.36,71:16.56,72:15.77,73:15.01,74:14.25,75:13.50,76:12.78,77:12.07,78:11.37,79:10.70,80:10.04,81:9.41,82:8.80,83:8.21,84:7.65,85:7.11,86:6.60,87:6.13,88:5.68,89:5.26,90:4.87,91:4.52,92:4.19,93:3.89,94:3.63,95:3.40,96:3.19,97:3.01,98:2.86,99:2.72,100:2.60};
                  const cf = CF_TABLE[relevantAge] || (relevantAge > 100 ? 2.60 : 21.48);
                  const COMBINED_PARTNERED_RATE = 46202;
                  const reasonablenessAmt = Math.round(COMBINED_PARTNERED_RATE * cf);

                  // Funds transfer: value is indeterminate → reasonableness test always applies
                  // Value = lesser of (amount paid) and (reasonableness test amount)
                  const grannyFlatValue = Math.min(cashAmount, reasonablenessAmt);
                  const deprivationAmt = Math.max(0, cashAmount - reasonablenessAmt);
                  const giftFreeArea = 10000;
                  const deprivedAsset = Math.max(0, deprivationAmt - giftFreeArea);

                  // Homeowner status
                  const EAA = 258000;
                  const entryContribution = cashAmount <= reasonablenessAmt ? cashAmount : grannyFlatValue;
                  const isHomeowner = entryContribution > EAA;

                  const kpiStyle = { flex: 1, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" };
                  const kpiLabel = { fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" };
                  const kpiVal = { fontSize: 16, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" };
                  const selStyle = { width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" };
                  const inputStyle = { ...selStyle, width: 180 };

                  // Auto-create sell transaction for the selected property
                  const autoCreateSell = (propIdx) => {
                    const txns = factFind.advice_request?.transactions || { buy: [], sell: [], debts: [] };
                    const existing = (txns.sell || []).find(s => s.description === "Auto: Granny flat funds transfer" && String(s.asset_idx) === String(propIdx));
                    if (existing) return; // Already created
                    const newSell = {
                      id: "txn_gf138_" + Math.random().toString(36).slice(2),
                      description: "Auto: Granny flat funds transfer",
                      asset_idx: String(propIdx),
                      owner_id: ffA[propIdx]?.a_owner || "client1",
                      entity_type: ffA[propIdx]?.a_ownType || "1",
                      sell_entire_amount: true,
                      amount: "",
                      transaction_costs_pct: "0",
                      sell_year: editingStrat.start_year || "2025",
                      sell_timing: "start",
                      sell_date: "",
                    };
                    const newTxns = { ...txns, sell: [...(txns.sell || []), newSell] };
                    updateFF("advice_request.transactions", newTxns);
                    updateStrat(editingStrat.id, "granny_sell_created", "true");
                  };

                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      {/* Property to sell */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Property to sell (funds source)</div>
                        <select value={editingStrat.granny_property_idx || "0"} onChange={e => {
                          updateStrat(editingStrat.id, "granny_property_idx", e.target.value);
                          autoCreateSell(parseInt(e.target.value) || 0);
                        }} style={selStyle}>
                          {homes.length === 0 && <option value="">— No principal residence found —</option>}
                          {homes.map(h => <option key={h.idx} value={String(h.idx)}>{h.a_name || `Property ${h.idx + 1}`} — ${(parseFloat(h.a_value) || 0).toLocaleString()}</option>)}
                        </select>
                      </div>

                      {/* Cash amount to pay child */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Cash paid to child for life interest</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-secondary)" }}>$</span>
                          <input type="number" value={editingStrat.granny_cash_amount || ""} onChange={e => updateStrat(editingStrat.id, "granny_cash_amount", e.target.value)} placeholder="e.g. 750000" style={inputStyle} />
                        </div>
                        <div style={{ fontSize: 9, color: "var(--ps-text-subtle)", marginTop: 2 }}>Total cash paid to child. Typically funded from property sale proceeds.</div>
                      </div>

                      {/* Auto-sell confirmation */}
                      {editingStrat.granny_sell_created === "true" && (
                        <div style={{ padding: "6px 10px", background: "#F0FDF4", borderRadius: 6, border: "1px solid #BBF7D0", fontSize: 10, color: "#166534", display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 14 }}>✅</span>
                          <span>A <strong>sell transaction</strong> for {selHome?.a_name || "the property"} has been auto-created in Transactions → Sell. Sale proceeds will flow to cash.</span>
                        </div>
                      )}
                      {editingStrat.granny_sell_created !== "true" && homes.length > 0 && (
                        <div style={{ padding: "6px 10px", background: "#FFFBEB", borderRadius: 6, border: "1px solid #FDE68A", fontSize: 10, color: "#92400E", display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 14 }}>💡</span>
                          <span>Select a property above to auto-create a sell transaction. Sale proceeds fund the granny flat contribution.</span>
                        </div>
                      )}

                      {cashAmount > 0 && (<>
                      {/* KPI tiles row 1 */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={kpiStyle}>
                          <div style={kpiLabel}>Property Sale Value</div>
                          <div style={{ ...kpiVal, color: "var(--ps-text-primary)" }}>${homeVal.toLocaleString()}</div>
                        </div>
                        <div style={kpiStyle}>
                          <div style={kpiLabel}>Cash to Child</div>
                          <div style={{ ...kpiVal, color: "var(--ps-text-primary)" }}>${cashAmount.toLocaleString()}</div>
                        </div>
                        <div style={kpiStyle}>
                          <div style={kpiLabel}>Retained Cash</div>
                          <div style={{ ...kpiVal, color: homeVal - cashAmount >= 0 ? "var(--ps-green)" : "#DC2626" }}>${(homeVal - cashAmount).toLocaleString()}</div>
                        </div>
                      </div>

                      {/* KPI tiles row 2: Reasonableness + Value + Deprivation */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={kpiStyle}>
                          <div style={kpiLabel}>Reasonableness Test</div>
                          <div style={{ ...kpiVal, color: "#2563EB" }}>${reasonablenessAmt.toLocaleString()}</div>
                          <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>Factor {cf} × $46,202 (age {relevantAge})</div>
                        </div>
                        <div style={{ ...kpiStyle, background: "var(--ps-surface-green)", border: "1px solid var(--ps-ring-emerald)" }}>
                          <div style={kpiLabel}>Granny Flat Interest Value</div>
                          <div style={{ ...kpiVal, color: "var(--ps-green)" }}>${grannyFlatValue.toLocaleString()}</div>
                          <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>Lesser of cash paid &amp; reasonableness</div>
                        </div>
                        <div style={{ ...kpiStyle, background: deprivedAsset > 0 ? "#FEF2F2" : "var(--ps-surface-green)", border: deprivedAsset > 0 ? "1px solid #FECACA" : "1px solid var(--ps-ring-emerald)" }}>
                          <div style={kpiLabel}>Deprived Asset</div>
                          <div style={{ ...kpiVal, color: deprivedAsset > 0 ? "#DC2626" : "var(--ps-green)" }}>${deprivedAsset.toLocaleString()}</div>
                          {deprivationAmt > 0 && deprivationAmt <= giftFreeArea && <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>Within $10k gifting free area</div>}
                          {deprivedAsset > 0 && <div style={{ fontSize: 9, color: "#DC2626" }}>Assessed for 5 years (assets + deemed)</div>}
                        </div>
                      </div>

                      {/* Homeowner status + Max cash */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={kpiStyle}>
                          <div style={kpiLabel}>Entry Contribution</div>
                          <div style={{ ...kpiVal, color: "var(--ps-text-primary)" }}>${entryContribution.toLocaleString()}</div>
                        </div>
                        <div style={kpiStyle}>
                          <div style={kpiLabel}>Extra Allowable Amount</div>
                          <div style={{ ...kpiVal, color: "var(--ps-text-primary)" }}>${EAA.toLocaleString()}</div>
                        </div>
                        <div style={{ ...kpiStyle, background: isHomeowner ? "var(--ps-surface-green)" : "#FFF7ED", border: isHomeowner ? "1px solid var(--ps-ring-emerald)" : "1px solid #FED7AA" }}>
                          <div style={kpiLabel}>Centrelink Status</div>
                          <div style={{ ...kpiVal, fontSize: 14, color: isHomeowner ? "var(--ps-green)" : "#EA580C" }}>{isHomeowner ? "✓ Homeowner" : "Non-homeowner"}</div>
                          <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>{isHomeowner ? "EC exempt from assets test" : "EC assessed under assets test"}</div>
                        </div>
                      </div>

                      {/* Max cash without deprivation */}
                      <div style={{ ...kpiStyle, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
                        <div style={kpiLabel}>Maximum Cash (no deprivation)</div>
                        <div style={{ ...kpiVal, color: "#2563EB" }}>${reasonablenessAmt.toLocaleString()}</div>
                        <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>Any cash above this is a deprived asset for 5 years</div>
                      </div>

                      {/* Deprivation warning */}
                      {deprivedAsset > 0 && (
                        <div style={{ padding: "8px 12px", background: "#FEF2F2", borderRadius: 6, border: "1px solid #FECACA", fontSize: 11, color: "#991B1B", display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 16, lineHeight: 1 }}>⚠️</span>
                          <div>
                            <strong>Deprivation warning</strong>: Cash of ${cashAmount.toLocaleString()} exceeds the reasonableness amount by ${deprivedAsset.toLocaleString()} (after $10k gifting free area).
                            This amount will be assessed as a <strong>deprived asset</strong> in Centrelink's assets test AND deemed for the income test for <strong>5 years</strong>.
                            Consider reducing the cash amount to ${reasonablenessAmt.toLocaleString()} or below.
                          </div>
                        </div>
                      )}
                      </>)}

                      {/* Info box */}
                      <div style={{ padding: "6px 10px", background: "var(--ps-surface-blue)", borderRadius: 6, border: "1px solid var(--ps-ring-blue)", fontSize: 10, color: "#1E40AF" }}>
                        <strong>Funds transfer</strong>: Client sells principal residence and pays cash to child in exchange for a lifetime right to live in the child's property.
                        Reasonableness test always applies (value is indeterminate). Value = lesser of cash paid and reasonableness amount.
                        Excess over reasonableness amount is a deprived asset for 5 years.
                        {isHomeowner ? " Homeowner: entry contribution exempt from assets test." : " Non-homeowner: entry contribution assessed (higher threshold applies)."}
                        {" "}Client must NOT have any ownership interest in the child's property.
                      </div>
                    </div>
                  );
                })()}
                {/* ── JobSeeker Payment (210) ── */}
                {editingStrat.strategy_id === "210" && (() => {
                  const FORTNIGHTLY_RATE = 789.90; // Single 22+, no children, Mar 2025
                  const ANNUAL_RATE = Math.round(FORTNIGHTLY_RATE * 26);
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-green)", border: "1px solid var(--ps-ring-emerald)" }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>Annual Payment (pre-tax)</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ps-green)", fontFamily: "'JetBrains Mono', monospace" }}>${ANNUAL_RATE.toLocaleString()}</div>
                        </div>
                        <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>Fortnightly Rate</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>${FORTNIGHTLY_RATE.toFixed(2)}</div>
                          <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>Indexed twice yearly (Mar & Sep)</div>
                        </div>
                      </div>
                      <div style={{ padding: "6px 10px", background: "var(--ps-surface-blue)", borderRadius: 6, border: "1px solid var(--ps-ring-blue)", fontSize: 10, color: "#1E40AF" }}>
                        Single rate, 22+, no children (2025-26). Payment is taxable income. Means tested — income &amp; assets tests apply. Automatically ceases at Age Pension age (67). Indexed with CPI in the projection.
                      </div>
                    </div>
                  );
                })()}
                {/* ── Pledge Asset as Security (69) ── */}
                {editingStrat.strategy_id === "69" && (() => {
                  const allDebts = (baseFf || factFind).liabilities || [];
                  const allAssets = (baseFf || factFind).assets || [];
                  // Only show home loan (1), investment loan (2), margin loan (3)
                  const eligibleDebts = allDebts.map((d, i) => ({ ...d, _idx: i })).filter(d => ["1","2","3"].includes(d.d_type));
                  const selStyle = { width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" };
                  const selDebtIdx = editingStrat.pledge_debt_idx !== "" ? parseInt(editingStrat.pledge_debt_idx) : null;
                  const selDebt = selDebtIdx !== null ? allDebts[selDebtIdx] : null;
                  const debtBalance = selDebt ? (parseFloat(selDebt.d_balance) || 0) : 0;
                  const debtType = selDebt ? selDebt.d_type : "";
                  const debtTypeMap = { "1": "Home loan", "2": "Investment loan", "3": "Margin loan" };

                  // Asset category function (inline)
                  const aCat = (t) => { if (["1","18","21"].includes(t)) return "property"; if (["12","13","26","42"].includes(t)) return "growth"; if (["8","9","10","11"].includes(t)) return "defensive"; return "lifestyle"; };
                  // Filter assets by debt type: Home→property, Margin→growth, Investment→property+growth. Never defensive.
                  const eligibleAssets = allAssets.map((a, i) => ({ ...a, _idx: i, _cat: aCat(a.a_type) })).filter(a => {
                    if (a._cat === "defensive") return false;
                    if (a._cat === "lifestyle") return false;
                    if (debtType === "1") return a._cat === "property";       // Home loan → property only
                    if (debtType === "3") return a._cat === "growth";         // Margin loan → growth only
                    if (debtType === "2") return a._cat === "property" || a._cat === "growth"; // Investment → either
                    return false;
                  });

                  // Selected asset indices (array)
                  const selectedIdxs = editingStrat.pledge_asset_idxs || [];
                  const toggleAsset = (idx) => {
                    const key = String(idx);
                    const next = selectedIdxs.includes(key) ? selectedIdxs.filter(s => s !== key) : [...selectedIdxs, key];
                    updateStrat(editingStrat.id, "pledge_asset_idxs", next);
                  };
                  const selectAll = () => {
                    const allIdxs = eligibleAssets.map(a => String(a._idx));
                    updateStrat(editingStrat.id, "pledge_asset_idxs", allIdxs);
                  };
                  const clearAll = () => updateStrat(editingStrat.id, "pledge_asset_idxs", []);
                  const allSelected = eligibleAssets.length > 0 && eligibleAssets.every(a => selectedIdxs.includes(String(a._idx)));

                  // Calculate totals
                  const pledgedTotal = selectedIdxs.reduce((sum, sIdx) => {
                    const a = allAssets[parseInt(sIdx)];
                    return sum + (a ? (parseFloat(a.a_value) || 0) : 0);
                  }, 0);
                  const existingSecTotal = selDebt ? (selDebt.d_security || []).reduce((sum, sIdx) => {
                    const a = allAssets[parseInt(sIdx)];
                    return sum + (a ? (parseFloat(a.a_value) || 0) : 0);
                  }, 0) : 0;
                  const currentLVR = existingSecTotal > 0 ? ((debtBalance / existingSecTotal) * 100) : null;
                  const newSecTotal = existingSecTotal + pledgedTotal;
                  const newLVR = newSecTotal > 0 ? ((debtBalance / newSecTotal) * 100) : null;
                  const catLabel = { property: "🏠 Property", growth: "📈 Growth" };

                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Debt (loan to secure)</div>
                        <select value={editingStrat.pledge_debt_idx ?? ""} onChange={e => { updateStrat(editingStrat.id, "pledge_debt_idx", e.target.value); updateStrat(editingStrat.id, "pledge_asset_idxs", []); }} style={selStyle}>
                          <option value="">— Select debt —</option>
                          {eligibleDebts.map(d => <option key={d._idx} value={String(d._idx)}>{d.d_name || `Liability ${d._idx + 1}`} — {debtTypeMap[d.d_type]} — ${(parseFloat(d.d_balance) || 0).toLocaleString()}</option>)}
                        </select>
                      </div>
                      {selDebt && (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)" }}>
                              Assets to pledge {debtType === "1" ? "(property only)" : debtType === "3" ? "(growth assets only)" : "(property & growth)"}
                            </div>
                            <button onClick={allSelected ? clearAll : selectAll} style={{ background: "none", border: "none", color: "#4F46E5", fontSize: 10, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
                              {allSelected ? "Clear all" : "Select all"}
                            </button>
                          </div>
                          {eligibleAssets.length === 0 ? (
                            <div style={{ padding: "10px", background: "var(--ps-surface-alt)", borderRadius: 6, fontSize: 11, color: "var(--ps-text-muted)", textAlign: "center" }}>
                              No eligible assets found for this loan type.
                            </div>
                          ) : (
                            <div style={{ border: "1px solid var(--ps-border)", borderRadius: 8, overflow: "hidden" }}>
                              {eligibleAssets.map((a, i) => {
                                const isChecked = selectedIdxs.includes(String(a._idx));
                                return (
                                  <label key={a._idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", background: isChecked ? "var(--ps-surface-indigo)" : i % 2 === 0 ? "var(--ps-surface)" : "var(--ps-surface-alt)", borderBottom: i < eligibleAssets.length - 1 ? "1px solid var(--ps-border-light)" : "none", transition: "background 0.1s" }}>
                                    <input type="checkbox" checked={isChecked} onChange={() => toggleAsset(a._idx)} style={{ accentColor: "#4F46E5" }} />
                                    <span style={{ fontSize: 11, color: "var(--ps-text-muted)", minWidth: 90 }}>{catLabel[a._cat] || a._cat}</span>
                                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "var(--ps-text-primary)" }}>{a.a_name || `Asset ${a._idx + 1}`}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-secondary)", fontFamily: "'JetBrains Mono', monospace" }}>${(parseFloat(a.a_value) || 0).toLocaleString()}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                      {selDebt && selectedIdxs.length > 0 && (
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: 120, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>Debt Balance</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>${debtBalance.toLocaleString()}</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 120, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-green)", border: "1px solid var(--ps-ring-emerald)" }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>Pledged Security ({selectedIdxs.length} asset{selectedIdxs.length > 1 ? "s" : ""})</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ps-green)", fontFamily: "'JetBrains Mono', monospace" }}>${pledgedTotal.toLocaleString()}</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 120, padding: "10px 14px", borderRadius: 8, background: currentLVR !== null ? "var(--ps-surface-alt)" : "#FEF3C7", border: currentLVR !== null ? "1px solid var(--ps-border)" : "1px solid #F59E0B" }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>Current LVR</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{currentLVR !== null ? currentLVR.toFixed(1) + "%" : "No security"}</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 120, padding: "10px 14px", borderRadius: 8, background: newLVR !== null && newLVR < (currentLVR || 999) ? "#ECFDF5" : "var(--ps-surface-alt)", border: newLVR !== null && newLVR < (currentLVR || 999) ? "1px solid #10B981" : "1px solid var(--ps-border)" }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>New LVR (after pledge)</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: newLVR !== null && newLVR < (currentLVR || 999) ? "#059669" : "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{newLVR !== null ? newLVR.toFixed(1) + "%" : "—"}</div>
                          </div>
                        </div>
                      )}
                      {selDebt && selectedIdxs.length > 0 && newLVR !== null && newLVR > 80 && (
                        <div style={{ padding: "6px 10px", background: "#FEF2F2", borderRadius: 6, border: "1px solid #FECACA", fontSize: 10, color: "#991B1B" }}>
                          ⚠️ LVR exceeds 80% — lender may require Lenders Mortgage Insurance (LMI) or decline the security arrangement.
                        </div>
                      )}
                      <div style={{ padding: "6px 10px", background: "var(--ps-surface-blue)", borderRadius: 6, border: "1px solid var(--ps-ring-blue)", fontSize: 10, color: "#1E40AF" }}>
                        Pledging assets as security may improve borrowing terms, reduce interest rates, or satisfy lender requirements. Pledged assets appear in the Debt Schedule with projected LVR. No direct cashflow impact — structural change to loan arrangement.
                      </div>
                    </div>
                  );
                })()}
                {/* ── Support at Home / Home Care (145) ── */}
                {editingStrat.strategy_id === "145" && (() => {
                  // Support at Home 8 classifications — annual amounts (from 1 Nov 2025, indexed 1 July)
                  const SAH_LEVELS = [
                    { level: "1", label: "Classification 1 — Basic", annual: 10731, quarterly: 2682.75 },
                    { level: "2", label: "Classification 2 — Low", annual: 16034, quarterly: 4008.61 },
                    { level: "3", label: "Classification 3 — Low-moderate", annual: 21966, quarterly: 5491.43 },
                    { level: "4", label: "Classification 4 — Moderate", annual: 29696, quarterly: 7424.10 },
                    { level: "5", label: "Classification 5 — Moderate-high", annual: 39697, quarterly: 9924.35 },
                    { level: "6", label: "Classification 6 — High", annual: 48114, quarterly: 12028.58 },
                    { level: "7", label: "Classification 7 — High-complex", annual: 58148, quarterly: 14537.04 },
                    { level: "8", label: "Classification 8 — Complex", annual: 78106, quarterly: 19526.59 },
                  ];
                  // Client contribution rates by pensioner status (% of service price)
                  // Clinical = 0% for all. Independence: full=5%, part=10%, SFR-CSHC=17.5%, SFR=80%
                  // Everyday living: full=5%, part=17.5%, SFR-CSHC=32.5%, SFR=80%
                  // We model a blended average out-of-pocket as % of total budget (ex care mgmt)
                  const CONTRIB_RATES = {
                    "full": { label: "Full pensioner", pct: 0.05, color: "var(--ps-green)" },
                    "part": { label: "Part pensioner / CSHC", pct: 0.125, color: "#F59E0B" },
                    "sfr": { label: "Self-funded retiree", pct: 0.50, color: "#EF4444" },
                  };
                  const sel = SAH_LEVELS.find(l => l.level === editingStrat.hcp_classification);
                  const contrib = CONTRIB_RATES[editingStrat.hcp_pensioner_status] || null;
                  const usableBudget = sel ? Math.round(sel.annual * 0.90) : 0; // 90% after care mgmt
                  const estOOP = sel && contrib ? Math.round(usableBudget * contrib.pct) : 0;
                  const selStyle = { width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" };
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Classification Level</div>
                        <select value={editingStrat.hcp_classification || ""} onChange={e => updateStrat(editingStrat.id, "hcp_classification", e.target.value)} style={selStyle}>
                          <option value="">— Select level —</option>
                          {SAH_LEVELS.map(l => <option key={l.level} value={l.level}>{l.label} — ${l.annual.toLocaleString()}/yr</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Pensioner Status (determines contribution)</div>
                        <select value={editingStrat.hcp_pensioner_status || ""} onChange={e => updateStrat(editingStrat.id, "hcp_pensioner_status", e.target.value)} style={selStyle}>
                          <option value="">— Select status —</option>
                          <option value="full">Full pensioner (lowest contributions)</option>
                          <option value="part">Part pensioner / CSHC holder</option>
                          <option value="sfr">Self-funded retiree (highest contributions)</option>
                        </select>
                      </div>
                      {sel && contrib && (
                        <>
                          <div style={{ display: "flex", gap: 10 }}>
                            <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-green)", border: "1px solid var(--ps-ring-emerald)" }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>Govt Subsidy (annual)</div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ps-green)", fontFamily: "'JetBrains Mono', monospace" }}>${sel.annual.toLocaleString()}</div>
                              <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>incl. 10% care management</div>
                            </div>
                            <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>Usable Budget (90%)</div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>${usableBudget.toLocaleString()}</div>
                              <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>after care management</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 10 }}>
                            <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA" }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>Est. Client Contribution (annual)</div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: "#DC2626", fontFamily: "'JetBrains Mono', monospace" }}>${estOOP.toLocaleString()}</div>
                              <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>{contrib.label} — blended ~{Math.round(contrib.pct * 100)}% of services</div>
                            </div>
                            <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>Quarterly Budget</div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>${sel.quarterly.toLocaleString()}</div>
                              <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>4 quarters per year</div>
                            </div>
                          </div>
                        </>
                      )}
                      <div style={{ padding: "6px 10px", background: "var(--ps-surface-blue)", borderRadius: 6, border: "1px solid var(--ps-ring-blue)", fontSize: 10, color: "#1E40AF" }}>
                        Support at Home (from 1 Nov 2025) — 8 classification levels. Govt subsidy paid to provider. Client pays out-of-pocket contribution based on pensioner status & service type. Clinical care (nursing, physio) = no contribution. Independence & everyday living services attract contributions. No impact on Age Pension means test. Lifetime contribution cap: $135,319. Indexed annually.
                      </div>
                    </div>
                  );
                })()}
                {/* ── Disability Support Pension (219) ── */}
                {editingStrat.strategy_id === "219" && (() => {
                  const DSP_SINGLE_FN = 1149.00; // Single 21+, Sep 2025
                  const DSP_COUPLE_FN = 866.80;  // Each, Sep 2025
                  const ownerAge = (() => {
                    const dob = (editingStrat.owner_id || "client1") === "client1" ? factFind.client1?.date_of_birth : factFind.client2?.date_of_birth;
                    if (!dob) return null;
                    const [d,m,yy] = dob.split("/"); const bd = new Date(+yy, +m - 1, +d); const now = new Date();
                    let a = now.getFullYear() - bd.getFullYear(); if (now < new Date(now.getFullYear(), bd.getMonth(), bd.getDate())) a--;
                    return a;
                  })();
                  const hasPartner = factFind.client2?.first_name;
                  const fnRate = hasPartner ? DSP_COUPLE_FN : DSP_SINGLE_FN;
                  const annualRate = Math.round(fnRate * 26);
                  const startYr = parseInt(editingStrat.start_year) || currentFY;
                  const endYr = editingStrat.end_year === "Ongoing" ? 9999 : (parseInt(editingStrat.end_year) || currentFY + 30);
                  const agePensionAge = 67;
                  const willTransition = ownerAge !== null && (ownerAge + (endYr - currentFY)) >= agePensionAge;
                  const transitionYr = ownerAge !== null ? currentFY + (agePensionAge - ownerAge) : null;
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-green)", border: "1px solid var(--ps-ring-emerald)" }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>Annual Payment (pre-tax)</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ps-green)", fontFamily: "'JetBrains Mono', monospace" }}>${annualRate.toLocaleString()}</div>
                        </div>
                        <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>Fortnightly Rate</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>${fnRate.toFixed(2)}</div>
                          <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>{hasPartner ? "Partnered (each)" : "Single"} rate</div>
                        </div>
                      </div>
                      {willTransition && transitionYr && (
                        <div style={{ padding: "8px 10px", background: "#FEF3C7", borderRadius: 6, border: "1px solid #F59E0B", fontSize: 10, color: "#92400E", display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 14 }}>🔄</span>
                          <span><strong>Age Pension transition:</strong> DSP ceases in FY{transitionYr} when owner reaches {agePensionAge}. Payment automatically transitions to Age Pension (means tested via Social Security module).</span>
                        </div>
                      )}
                      <div style={{ padding: "6px 10px", background: "var(--ps-surface-blue)", borderRadius: 6, border: "1px solid var(--ps-ring-blue)", fontSize: 10, color: "#1E40AF" }}>
                        {hasPartner ? "Partnered" : "Single"} rate, 21+ (Sep 2025). Same rate & means testing as Age Pension. Payment is taxable income. Indexed with CPI in the projection. Automatically ceases at Age Pension age (67) and transitions to Age Pension.
                      </div>
                    </div>
                  );
                })()}
                {/* ── Move Back into Principal Residence (56) ── */}
                {editingStrat.strategy_id === "56" && (() => {
                  const baseAssets = (baseFf || factFind).assets || [];
                  const ffA = baseAssets;
                  const absentPRs = ffA.map((a, i) => ({ ...a, idx: i })).filter(a => a.a_type === "19");
                  const selIdx = editingStrat.moveback_property_idx !== "" ? parseInt(editingStrat.moveback_property_idx) : NaN;
                  const selProp = !isNaN(selIdx) ? ffA[selIdx] : null;
                  const propVal = selProp ? (parseFloat(selProp.a_value) || 0) : 0;
                  const costBase = selProp ? (parseFloat(selProp.a_purchase_price) || 0) : 0;
                  const purchaseDate = selProp?.a_purchase_date ? new Date(selProp.a_purchase_date) : null;
                  const moveOutDate = selProp?.a_move_out_date ? new Date(selProp.a_move_out_date) : null;
                  const moveBackFY = parseInt(editingStrat.start_year) || currentFY;
                  const moveBackDate = new Date(moveBackFY, 6, 1); // approx start of FY (1 Jul)

                  // Calculate absence period & CGT apportionment preview
                  const totalOwnershipDays = purchaseDate ? Math.round((moveBackDate - purchaseDate) / (24*60*60*1000)) : null;
                  const absenceDays = moveOutDate ? Math.round((moveBackDate - moveOutDate) / (24*60*60*1000)) : null;
                  const absenceYears = absenceDays !== null ? (absenceDays / 365.25) : null;
                  const daysAsPR = totalOwnershipDays !== null && absenceDays !== null ? (totalOwnershipDays - absenceDays) : null;
                  const SIX_YEARS_DAYS = Math.round(6 * 365.25); // 2191.5 → 2192
                  const within6yr = absenceDays !== null && absenceDays <= SIX_YEARS_DAYS;
                  // Deemed PR days = min(absenceDays, 6 years)
                  const deemedPRDays = absenceDays !== null ? Math.min(absenceDays, SIX_YEARS_DAYS) : null;
                  const totalPRDays = daysAsPR !== null && deemedPRDays !== null ? (daysAsPR + deemedPRDays) : null;
                  const investDays = totalOwnershipDays !== null && totalPRDays !== null ? Math.max(0, totalOwnershipDays - totalPRDays) : null;
                  const exemptPct = totalOwnershipDays && totalPRDays ? Math.min(1, totalPRDays / totalOwnershipDays) : null;
                  const taxablePct = exemptPct !== null ? (1 - exemptPct) : null;
                  const unrealisedGain = propVal - costBase;
                  const taxableGain = taxablePct !== null ? Math.round(unrealisedGain * taxablePct) : null;

                  const kpiStyle = { flex: 1, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" };
                  const kpiLabel = { fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" };
                  const kpiVal = { fontSize: 16, fontWeight: 800, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" };
                  const selStyle = { width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" };

                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      {/* Property selector — only absent PRs */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Select property to move back into</div>
                        <select value={editingStrat.moveback_property_idx} onChange={e => updateStrat(editingStrat.id, "moveback_property_idx", e.target.value)} style={selStyle}>
                          <option value="">— Select absent principal residence —</option>
                          {absentPRs.map(a => <option key={a.idx} value={String(a.idx)}>{a.a_name || `Property ${a.idx + 1}`} (${(parseFloat(a.a_value) || 0).toLocaleString()})</option>)}
                        </select>
                        {absentPRs.length === 0 && (
                          <div style={{ padding: "6px 10px", background: "#FEF3C7", borderRadius: 6, border: "1px solid #F59E0B", fontSize: 10, color: "#92400E", marginTop: 4 }}>
                            ⚠️ No absent principal residences found. Add a property with type "Principal residence (absent)" first.
                          </div>
                        )}
                      </div>

                      {selProp && (
                        <>
                          {/* Confirmation banner */}
                          <div style={{ padding: "8px 10px", background: "var(--ps-surface-green)", borderRadius: 6, border: "1px solid var(--ps-ring-emerald)", fontSize: 10, color: "#065F46", display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 14 }}>🏠</span>
                            <span><strong>Move back:</strong> Property will be reclassified from "Principal residence (absent)" → "Principal residence" in FY{moveBackFY}. Centrelink homeowner status restored. Rental income ceases. 6-year CGT clock resets.</span>
                          </div>

                          {/* KPI Row 1 — Property details */}
                          <div style={{ display: "flex", gap: 10 }}>
                            <div style={kpiStyle}>
                              <div style={kpiLabel}>Current Value</div>
                              <div style={kpiVal}>${propVal.toLocaleString()}</div>
                            </div>
                            <div style={kpiStyle}>
                              <div style={kpiLabel}>Cost Base</div>
                              <div style={kpiVal}>${costBase.toLocaleString()}</div>
                            </div>
                            <div style={kpiStyle}>
                              <div style={kpiLabel}>Unrealised Gain</div>
                              <div style={{ ...kpiVal, color: unrealisedGain >= 0 ? "var(--ps-green)" : "#DC2626" }}>${unrealisedGain.toLocaleString()}</div>
                            </div>
                          </div>

                          {/* KPI Row 2 — Absence period */}
                          <div style={{ display: "flex", gap: 10 }}>
                            <div style={kpiStyle}>
                              <div style={kpiLabel}>Absence Period</div>
                              <div style={kpiVal}>{absenceYears !== null ? `${absenceYears.toFixed(1)} yrs` : "—"}</div>
                              <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>{moveOutDate ? `${moveOutDate.toLocaleDateString("en-AU")} → FY${moveBackFY}` : "No move-out date"}</div>
                            </div>
                            <div style={{ ...kpiStyle, background: within6yr ? "var(--ps-surface-green)" : "#FEF2F2", border: within6yr ? "1px solid var(--ps-ring-emerald)" : "1px solid #FECACA" }}>
                              <div style={kpiLabel}>6 Year Rule</div>
                              <div style={{ ...kpiVal, fontSize: 14, color: within6yr ? "var(--ps-green)" : "#DC2626" }}>{within6yr ? "✅ Within 6 years" : "⚠️ EXCEEDED"}</div>
                              <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>{within6yr ? "100% CGT exempt on sale" : "Partial CGT applies"}</div>
                            </div>
                          </div>

                          {/* CGT Apportionment — only show if 6yr exceeded */}
                          {!within6yr && totalOwnershipDays && (
                            <>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ps-text-secondary)", marginTop: 2 }}>CGT Apportionment (s118-185)</div>
                              <div style={{ display: "flex", gap: 10 }}>
                                <div style={{ ...kpiStyle, background: "var(--ps-surface-green)", border: "1px solid var(--ps-ring-emerald)" }}>
                                  <div style={kpiLabel}>Days as PR (lived in)</div>
                                  <div style={{ ...kpiVal, color: "var(--ps-green)" }}>{daysAsPR?.toLocaleString()}</div>
                                  <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>{daysAsPR ? `${(daysAsPR / 365.25).toFixed(1)} yrs` : ""}</div>
                                </div>
                                <div style={{ ...kpiStyle, background: "var(--ps-surface-green)", border: "1px solid var(--ps-ring-emerald)" }}>
                                  <div style={kpiLabel}>+ 6yr Deemed PR</div>
                                  <div style={{ ...kpiVal, color: "var(--ps-green)" }}>{SIX_YEARS_DAYS.toLocaleString()}</div>
                                  <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>6.0 yrs (s118-145)</div>
                                </div>
                                <div style={{ ...kpiStyle, background: "#FEF2F2", border: "1px solid #FECACA" }}>
                                  <div style={kpiLabel}>Investment Days</div>
                                  <div style={{ ...kpiVal, color: "#DC2626" }}>{investDays?.toLocaleString()}</div>
                                  <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>{investDays ? `${(investDays / 365.25).toFixed(1)} yrs (excess beyond 6yr)` : ""}</div>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 10 }}>
                                <div style={{ ...kpiStyle, background: "var(--ps-surface-green)", border: "1px solid var(--ps-ring-emerald)" }}>
                                  <div style={kpiLabel}>Exempt Fraction</div>
                                  <div style={{ ...kpiVal, color: "var(--ps-green)" }}>{exemptPct !== null ? `${(exemptPct * 100).toFixed(1)}%` : "—"}</div>
                                  <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>{totalPRDays?.toLocaleString()} / {totalOwnershipDays?.toLocaleString()} days</div>
                                </div>
                                <div style={{ ...kpiStyle, background: "#FEF2F2", border: "1px solid #FECACA" }}>
                                  <div style={kpiLabel}>Taxable Fraction</div>
                                  <div style={{ ...kpiVal, color: "#DC2626" }}>{taxablePct !== null ? `${(taxablePct * 100).toFixed(1)}%` : "—"}</div>
                                </div>
                                <div style={{ ...kpiStyle, background: "#FEF2F2", border: "1px solid #FECACA" }}>
                                  <div style={kpiLabel}>Taxable Gain (if sold today)</div>
                                  <div style={{ ...kpiVal, color: "#DC2626" }}>${(taxableGain || 0).toLocaleString()}</div>
                                  <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>Before 50% CGT discount</div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Info box */}
                          <div style={{ padding: "6px 10px", background: "var(--ps-surface-blue)", borderRadius: 6, border: "1px solid var(--ps-ring-blue)", fontSize: 10, color: "#1E40AF" }}>
                            <strong>Move back into principal residence:</strong> Reclassifies absent PR back to principal residence. Restores Centrelink homeowner exemption, ceases rental income, and resets the 6-year CGT clock (s118-145 ITAA 1997). If absence exceeded 6 years, CGT apportionment applies on future sale — exempt fraction = (days lived in + 6 years deemed) / total ownership days. Moving back in, even briefly, resets the clock for any future absence period.
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
                {/* ── Rent Out Principal Residence (88) ── */}
                {editingStrat.strategy_id === "88" && (() => {
                  const baseAssets = (baseFf || factFind).assets || [];
                  const prs = baseAssets.map((a, i) => ({ ...a, idx: i })).filter(a => a.a_type === "1" || a.a_type === "19");
                  const selIdx = editingStrat.rentout_property_idx !== "" ? parseInt(editingStrat.rentout_property_idx) : NaN;
                  const selProp = !isNaN(selIdx) ? baseAssets[selIdx] : null;
                  const propVal = selProp ? (parseFloat(selProp.a_value) || 0) : 0;
                  const rentalInc = parseFloat(editingStrat.rentout_rental_income) || 0;
                  const rentalFreq = parseFloat(editingStrat.rentout_rental_freq) || 52;
                  const annualRental = rentalInc * rentalFreq;
                  const rentalYield = propVal > 0 ? ((annualRental / propVal) * 100).toFixed(2) : "0.00";
                  const startFY = parseInt(editingStrat.start_year) || currentFY;
                  const endFY = editingStrat.end_year && editingStrat.end_year !== "Ongoing" ? parseInt(editingStrat.end_year) : null;

                  const selStyle = { width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" };
                  const kpiStyle = { flex: 1, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" };
                  const kpiLabel = { fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" };
                  const kpiVal = { fontSize: 16, fontWeight: 800, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" };

                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Select property to rent out</div>
                        <select value={editingStrat.rentout_property_idx} onChange={e => updateStrat(editingStrat.id, "rentout_property_idx", e.target.value)} style={selStyle}>
                          <option value="">— Select principal residence —</option>
                          {prs.map(a => <option key={a.idx} value={String(a.idx)}>{a.a_name || `Property ${a.idx + 1}`} (${(parseFloat(a.a_value) || 0).toLocaleString()})</option>)}
                        </select>
                        {prs.length === 0 && (
                          <div style={{ padding: "6px 10px", background: "#FEF3C7", borderRadius: 6, border: "1px solid #F59E0B", fontSize: 10, color: "#92400E", marginTop: 4 }}>
                            No principal residences found. Add a property with type PR or PR (absent) first.
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Expected Rental Income</div>
                          <input type="number" value={editingStrat.rentout_rental_income} onChange={e => updateStrat(editingStrat.id, "rentout_rental_income", e.target.value)} placeholder="e.g. 550" style={{ ...selStyle, appearance: "none" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Frequency</div>
                          <select value={editingStrat.rentout_rental_freq} onChange={e => updateStrat(editingStrat.id, "rentout_rental_freq", e.target.value)} style={selStyle}>
                            <option value="52">Weekly</option>
                            <option value="26">Fortnightly</option>
                            <option value="12">Monthly</option>
                          </select>
                        </div>
                      </div>
                      {selProp && (
                        <div style={{ display: "flex", gap: 10 }}>
                          <div style={kpiStyle}>
                            <div style={kpiLabel}>Property Value</div>
                            <div style={kpiVal}>${propVal.toLocaleString()}</div>
                          </div>
                          <div style={kpiStyle}>
                            <div style={kpiLabel}>Annual Rental</div>
                            <div style={{ ...kpiVal, color: "var(--ps-green)" }}>${annualRental.toLocaleString()}</div>
                          </div>
                          <div style={kpiStyle}>
                            <div style={kpiLabel}>Rental Yield</div>
                            <div style={kpiVal}>{rentalYield}%</div>
                          </div>
                        </div>
                      )}
                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--ps-surface-indigo)", border: "1px solid var(--ps-ring-indigo)", fontSize: 11, color: "var(--ps-text-secondary)" }}>
                        Property status changes to PR (absent) from FY{startFY}/{startFY + 1 - 2000}. Rental income flows from start year{endFY ? ` and ceases FY${endFY}/${endFY + 1 - 2000} when clients move back in` : " (ongoing)"}.
                      </div>
                    </div>
                  );
                })()}
                {/* ── Rent Out Holiday Home (87) ── */}
                {editingStrat.strategy_id === "87" && (() => {
                  const baseAssets = (baseFf || factFind).assets || [];
                  const holidayHomes = baseAssets.map((a, i) => ({ ...a, idx: i })).filter(a => a.a_type === "20");
                  const selIdx = editingStrat.hh_property_idx !== "" ? parseInt(editingStrat.hh_property_idx) : NaN;
                  const selProp = !isNaN(selIdx) ? baseAssets[selIdx] : null;
                  const propVal = selProp ? (parseFloat(selProp.a_value) || 0) : 0;
                  const rentalInc = parseFloat(editingStrat.hh_rental_income) || 0;
                  const rentalFreq = parseFloat(editingStrat.hh_rental_freq) || 52;
                  const annualRental = rentalInc * rentalFreq;
                  const days = parseFloat(editingStrat.hh_days_available) || 0;
                  const pctRented = parseFloat(editingStrat.hh_pct_rented) || 100;
                  const deductiblePct = ((days / 365) * (pctRented / 100) * 100).toFixed(1);
                  const rentalYield = propVal > 0 ? ((annualRental / propVal) * 100).toFixed(2) : "0.00";

                  const selStyle = { width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" };
                  const kpiStyle = { flex: 1, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" };
                  const kpiLabel = { fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" };
                  const kpiVal = { fontSize: 16, fontWeight: 800, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" };

                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Select holiday home</div>
                        <select value={editingStrat.hh_property_idx} onChange={e => updateStrat(editingStrat.id, "hh_property_idx", e.target.value)} style={selStyle}>
                          <option value="">— Select holiday home —</option>
                          {holidayHomes.map(a => <option key={a.idx} value={String(a.idx)}>{a.a_name || `Holiday Home ${a.idx + 1}`} (${(parseFloat(a.a_value) || 0).toLocaleString()})</option>)}
                        </select>
                        {holidayHomes.length === 0 && (
                          <div style={{ padding: "6px 10px", background: "#FEF3C7", borderRadius: 6, border: "1px solid #F59E0B", fontSize: 10, color: "#92400E", marginTop: 4 }}>
                            No holiday homes found. Add a property with type Holiday Home in the Fact Find first.
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Rental type</div>
                        <select value={editingStrat.hh_rented} onChange={e => updateStrat(editingStrat.id, "hh_rented", e.target.value)} style={selStyle}>
                          <option value="">— Select —</option>
                          <option value="longterm">Long-term rental</option>
                          <option value="airbnb">Airbnb / short-term</option>
                          <option value="mixed">Mixed — partial rental</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Expected Rental Income</div>
                          <input type="number" value={editingStrat.hh_rental_income} onChange={e => updateStrat(editingStrat.id, "hh_rental_income", e.target.value)} placeholder="e.g. 450" style={{ ...selStyle, appearance: "none" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Frequency</div>
                          <select value={editingStrat.hh_rental_freq} onChange={e => updateStrat(editingStrat.id, "hh_rental_freq", e.target.value)} style={selStyle}>
                            <option value="52">Weekly</option>
                            <option value="26">Fortnightly</option>
                            <option value="12">Monthly</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tax Deductibility</div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Days Available for Rent (per year)</div>
                          <input type="number" value={editingStrat.hh_days_available} onChange={e => updateStrat(editingStrat.id, "hh_days_available", e.target.value)} placeholder="e.g. 200" style={{ ...selStyle, appearance: "none" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>% of Property Rented</div>
                          <input type="number" value={editingStrat.hh_pct_rented} onChange={e => updateStrat(editingStrat.id, "hh_pct_rented", e.target.value)} placeholder="100" style={{ ...selStyle, appearance: "none" }} />
                        </div>
                      </div>
                      {selProp && (
                        <div style={{ display: "flex", gap: 10 }}>
                          <div style={kpiStyle}>
                            <div style={kpiLabel}>Annual Rental</div>
                            <div style={{ ...kpiVal, color: "var(--ps-green)" }}>${annualRental.toLocaleString()}</div>
                          </div>
                          <div style={kpiStyle}>
                            <div style={kpiLabel}>Rental Yield</div>
                            <div style={kpiVal}>{rentalYield}%</div>
                          </div>
                          <div style={kpiStyle}>
                            <div style={kpiLabel}>Deductible %</div>
                            <div style={kpiVal}>{deductiblePct}%</div>
                            <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>{days} days / 365 x {pctRented}%</div>
                          </div>
                          <div style={kpiStyle}>
                            <div style={kpiLabel}>Personal Use</div>
                            <div style={kpiVal}>{365 - days} days</div>
                          </div>
                        </div>
                      )}
                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--ps-surface-indigo)", border: "1px solid var(--ps-ring-indigo)", fontSize: 11, color: "var(--ps-text-secondary)" }}>
                        Interest, rates, insurance and depreciation deductible at {deductiblePct}%. Direct rental costs (management, cleaning, advertising) are 100% deductible. All rental income is assessable in full.
                      </div>
                    </div>
                  );
                })()}
                {/* ── Paid Parental Leave (1) ── */}
                {editingStrat.strategy_id === "1" && (() => {
                  const MAX_WEEKS = 26;
                  const WEEKLY_RATE = 948.10; // 2025-26 national minimum wage rate
                  const DAILY_RATE = 189.62;
                  const weeks = parseInt(editingStrat.ppl_weeks) || 0;
                  const totalPay = Math.round(weeks * WEEKLY_RATE);
                  const weekOpts = [{ value: "", label: "— Select weeks —" }];
                  for (let w = 1; w <= MAX_WEEKS; w++) weekOpts.push({ value: String(w), label: `${w} week${w > 1 ? "s" : ""} ($${(w * WEEKLY_RATE).toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })})` });
                  const selStyle = { width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" };
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Number of weeks</div>
                        <select value={editingStrat.ppl_weeks || ""} onChange={e => updateStrat(editingStrat.id, "ppl_weeks", e.target.value)} style={selStyle}>
                          {weekOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      {weeks > 0 && (
                        <div style={{ display: "flex", gap: 10 }}>
                          <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-green)", border: "1px solid var(--ps-ring-emerald)" }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>Total Payment (pre-tax)</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ps-green)", fontFamily: "'JetBrains Mono', monospace" }}>${totalPay.toLocaleString()}</div>
                          </div>
                          <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>Weekly Rate</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>${WEEKLY_RATE.toFixed(2)}</div>
                            <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>${DAILY_RATE}/day × 5 days</div>
                          </div>
                        </div>
                      )}
                      <div style={{ padding: "6px 10px", background: "var(--ps-surface-blue)", borderRadius: 6, border: "1px solid var(--ps-ring-blue)", fontSize: 10, color: "#1E40AF" }}>
                        Paid at the national minimum wage rate (2025-26). Maximum 26 weeks (130 days) from 1 July 2026. Payment is taxable income. 12% SG super contribution paid by ATO on top.
                      </div>
                    </div>
                  );
                })()}
                {/* ── Gifting Strategy (33) ── */}
                {editingStrat.strategy_id === "33" && (() => {
                  const isMax = editingStrat.max_gifting === true || editingStrat.max_gifting === "true";
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: isMax ? "var(--ps-surface-green)" : "var(--ps-surface-alt)", borderRadius: 8, border: isMax ? "1px solid var(--ps-ring-emerald)" : "1px solid var(--ps-border)", cursor: "pointer" }}
                        onClick={() => { updateStrat(editingStrat.id, "max_gifting", !isMax); if (!isMax) updateStrat(editingStrat.id, "amount", ""); }}>
                        <div style={{ width: 36, height: 20, borderRadius: 10, background: isMax ? "#10B981" : "var(--ps-border-mid)", position: "relative", transition: "background 0.15s", flexShrink: 0 }}>
                          <div style={{ width: 16, height: 16, borderRadius: 8, background: "white", position: "absolute", top: 2, left: isMax ? 18 : 2, transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isMax ? "var(--ps-green)" : "var(--ps-text-secondary)" }}>Maximise Gifting</div>
                          <div style={{ fontSize: 10, color: "var(--ps-text-muted)" }}>Auto-calculates $10k/yr up to $30k rolling 5-year limit, then pauses and repeats</div>
                        </div>
                      </div>
                      {!isMax && (
                        <div style={{ padding: "6px 10px", background: "var(--ps-surface-alt)", borderRadius: 6, fontSize: 10, color: "var(--ps-text-muted)" }}>
                          Enter a custom annual amount in the Amount field above. Amounts exceeding $10k/yr or $30k/5yr will be treated as deprived assets by Centrelink for 5 years.
                        </div>
                      )}
                      {isMax && (
                        <div style={{ padding: "6px 10px", background: "var(--ps-surface-blue)", borderRadius: 6, border: "1px solid var(--ps-ring-blue)", fontSize: 10, color: "#1E40AF" }}>
                          Pattern: $10,000 → $10,000 → $10,000 → $0 → $0 → repeat. Stays within Centrelink gifting limits ($10k/yr, $30k rolling 5yr). Amount field is ignored when max gifting is on.
                        </div>
                      )}
                    </div>
                  );
                })()}
                {/* ── Binding Nomination (48) / Reversionary Beneficiary (62) ── */}
                {(editingStrat.strategy_id === "48" || editingStrat.strategy_id === "62") && (() => {
                  const ownerKey = editingStrat.owner_id || "client1";
                  const isReversionary = editingStrat.strategy_id === "62";

                  // Build fund list: super + SMSF for 48, pension + SMSF pensions for 62
                  const fundOpts = [{ ref: "", label: isReversionary ? "— Select pension account —" : "— Select super/SMSF account —" }];
                  if (isReversionary) {
                    (factFind.pensions || []).forEach((p, i) => {
                      if (p.owner === ownerKey) fundOpts.push({ ref: `pension_${i}`, label: `${p.fund_name || "Pension"} — ${p.product || ""}`.trim() });
                    });
                  } else {
                    (factFind.superProducts || []).forEach((s, i) => {
                      if (s.owner === ownerKey) fundOpts.push({ ref: `super_${i}`, label: `${s.fund_name || "Super"} — ${s.product || ""}`.trim() });
                    });
                  }
                  // SMSF accounts for both
                  const smsfList = (factFind.advice_request?.entities?.smsf || []).length > 0
                    ? (factFind.advice_request?.entities?.smsf || [])
                    : (factFind.smsf || []);
                  smsfList.forEach((s, i) => {
                    const smsfName = s.smsf_name || s.e_name || `SMSF ${i + 1}`;
                    // Check if this owner is a member
                    const members = s.members || [];
                    const isMember = members.length === 0 || members.some(m => m.member === ownerKey || m.name === ownerKey);
                    if (isMember) fundOpts.push({ ref: `smsf_${i}`, label: `${smsfName} (SMSF)` });
                  });

                  // Beneficiary options: principals + dependants + estate
                  const c1 = factFind.client1 || {};
                  const c2 = factFind.client2 || {};
                  const c1Name = [c1.first_name, c1.last_name].filter(Boolean).join(" ") || "Client 1";
                  const c2Name = [c2.first_name, c2.last_name].filter(Boolean).join(" ") || "Client 2";
                  const benefOpts = [{ value: "", label: "— Select —" }];
                  if (c1.first_name && ownerKey !== "client1") benefOpts.push({ value: "client1", label: c1Name });
                  if (c2.first_name && ownerKey !== "client2") benefOpts.push({ value: "client2", label: c2Name });
                  (factFind.dependants || []).forEach((d, i) => { if (d.name) benefOpts.push({ value: `dep_${i}`, label: d.name }); });
                  benefOpts.push({ value: "estate", label: "Legal Personal Representative / Estate" });

                  // Nomination type options (for binding nom only)
                  const nomTypeOpts = [
                    { value: "", label: "— Select —" },
                    { value: "binding", label: "Binding" },
                    { value: "non-binding", label: "Non-binding" },
                    { value: "lapsing", label: "Lapsing binding" },
                    { value: "non-lapsing", label: "Non-lapsing binding" },
                  ];

                  const nominations = editingStrat.nominations || [];
                  const updateNoms = (newNoms) => updateStrat(editingStrat.id, "nominations", newNoms);
                  const addBenef = () => updateNoms([...nominations, { beneficiary: "", pct: "", ...(isReversionary ? {} : { nom_type: "" }) }]);
                  const updateBenef = (bi, field, val) => { const u = [...nominations]; u[bi] = { ...u[bi], [field]: val }; updateNoms(u); };
                  const removeBenef = (bi) => updateNoms(nominations.filter((_, i) => i !== bi));
                  const totalPct = nominations.reduce((s, n) => s + (parseFloat(n.pct) || 0), 0);
                  const selStyle = { width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)", color: "var(--ps-text-primary)" };

                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      {/* Fund selector */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>
                          {isReversionary ? "Pension account" : "Super / SMSF account"}
                        </div>
                        <select value={editingStrat.product_id || ""} onChange={e => updateStrat(editingStrat.id, "product_id", e.target.value)} style={selStyle}>
                          {fundOpts.map(o => <option key={o.ref} value={o.ref}>{o.label}</option>)}
                        </select>
                      </div>

                      {/* Nomination type — only for binding nomination */}
                      {!isReversionary && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Nomination type</div>
                          <select value={editingStrat.nom_type || ""} onChange={e => updateStrat(editingStrat.id, "nom_type", e.target.value)} style={selStyle}>
                            {nomTypeOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      )}

                      {/* Beneficiaries table */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)" }}>
                            {isReversionary ? "Reversionary beneficiary" : "Beneficiaries"}
                          </div>
                          {totalPct > 0 && (
                            <div style={{ fontSize: 10, fontWeight: 700, color: totalPct === 100 ? "var(--ps-green)" : "var(--ps-red)" }}>
                              Total: {totalPct}%{totalPct !== 100 ? " (must equal 100%)" : " ✓"}
                            </div>
                          )}
                        </div>

                        {nominations.map((n, bi) => (
                          <div key={bi} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
                            <div style={{ flex: 1 }}>
                              <select value={n.beneficiary || ""} onChange={e => updateBenef(bi, "beneficiary", e.target.value)}
                                style={{ ...selStyle, width: "100%" }}>
                                {benefOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, width: 90 }}>
                              <input type="number" min="0" max="100" value={n.pct || ""} onChange={e => updateBenef(bi, "pct", e.target.value)}
                                style={{ ...selStyle, width: 60, textAlign: "right" }} placeholder="%" />
                              <span style={{ fontSize: 12, color: "var(--ps-text-muted)", fontWeight: 600 }}>%</span>
                            </div>
                            <button onClick={() => removeBenef(bi)} style={{ background: "none", border: "none", color: "var(--ps-red)", cursor: "pointer", fontSize: 16, padding: "4px 6px", flexShrink: 0 }}>✕</button>
                          </div>
                        ))}

                        <button onClick={addBenef} style={{ width: "100%", padding: "6px 14px", borderRadius: 6, border: "1px dashed var(--ps-border-mid)", background: "var(--ps-surface)", color: "#4F46E5", fontSize: 11, fontWeight: 600, cursor: "pointer", marginTop: 4 }}>
                          + Add Beneficiary
                        </button>
                      </div>

                      <div style={{ padding: "6px 10px", background: "var(--ps-surface-blue)", borderRadius: 6, border: "1px solid var(--ps-ring-blue)", fontSize: 10, color: "#1E40AF" }}>
                        {isReversionary
                          ? "A reversionary nomination ensures the pension income stream automatically continues to the nominated beneficiary on the member's death without forming part of the estate."
                          : "A binding death benefit nomination directs the trustee to pay the super balance to the nominated beneficiaries. Lapsing nominations expire after 3 years; non-lapsing remain in force until changed."}
                      </div>
                    </div>
                  );
                })()}
                {editingStrat.strategy_id === "86" && (() => {
                  const DRP_TYPES = ["12", "13", "26", "42"];
                  const typeLabels = { "12": "AU Shares", "13": "Intl Shares", "26": "Managed Funds", "42": "Investment Other" };
                  const c1Name = factFind.client1?.first_name || "Client 1";
                  const c2Name = factFind.client2?.first_name || "Client 2";
                  // Gather all DRP-eligible investments: direct assets, wrap holdings, bond holdings
                  const eligibleItems = [];
                  (factFind.assets || []).forEach((a, i) => {
                    if (!DRP_TYPES.includes(a.a_type)) return;
                    const owner = a.a_owner === "client1" ? c1Name : a.a_owner === "client2" ? c2Name : "Joint";
                    const currentDRP = a.a_drp === "yes";
                    eligibleItems.push({ key: `asset_${i}`, name: a.a_name || `Asset ${i + 1}`, type: typeLabels[a.a_type] || a.a_type, owner, currentDRP, entity: "Personal" });
                  });
                  (factFind.wraps || []).forEach((w, wi) => {
                    (w.portfolio || []).forEach((p, pi) => {
                      const owner = w.owner === "client1" ? c1Name : w.owner === "client2" ? c2Name : "Joint";
                      eligibleItems.push({ key: `wrap_${wi}_${pi}`, name: p.asset_name || `Wrap ${wi + 1} Holding ${pi + 1}`, type: "Wrap", owner, currentDRP: p.drp === "yes", entity: w.platform_name || `Wrap ${wi + 1}` });
                    });
                  });
                  const drpOverrides = editingStrat.drp_selections || {};
                  const getState = (item) => {
                    if (drpOverrides[item.key] !== undefined) return drpOverrides[item.key];
                    return item.currentDRP;
                  };
                  const toggleItem = (key, current) => {
                    const newSelections = { ...drpOverrides, [key]: !current };
                    updateStrat(editingStrat.id, "drp_selections", newSelections);
                  };
                  return (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 8 }}>Select investments to reinvest dividends</div>
                      <div style={{ border: "1px solid var(--ps-border)", borderRadius: 8, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                          <thead>
                            <tr style={{ background: "var(--ps-surface-alt)" }}>
                              <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-secondary)" }}>Investment</th>
                              <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-secondary)" }}>Type</th>
                              <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-secondary)" }}>Owner</th>
                              <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-secondary)" }}>Current</th>
                              <th style={{ padding: "6px 10px", textAlign: "center", fontWeight: 600, color: "var(--ps-text-secondary)" }}>Reinvest</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eligibleItems.length === 0 ? (
                              <tr><td colSpan={5} style={{ padding: "12px", textAlign: "center", color: "var(--ps-text-muted)" }}>No eligible investments found</td></tr>
                            ) : eligibleItems.map(item => {
                              const isOn = getState(item);
                              const changed = drpOverrides[item.key] !== undefined && drpOverrides[item.key] !== item.currentDRP;
                              return (
                                <tr key={item.key} style={{ borderTop: "1px solid var(--ps-border-light)", background: changed ? "var(--ps-surface-amber)" : "transparent" }}>
                                  <td style={{ padding: "6px 10px", fontWeight: 500 }}>{item.name}</td>
                                  <td style={{ padding: "6px 10px", color: "var(--ps-text-muted)" }}>{item.type}</td>
                                  <td style={{ padding: "6px 10px", color: "var(--ps-text-muted)" }}>{item.owner}</td>
                                  <td style={{ padding: "6px 10px" }}>
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                                      background: item.currentDRP ? "var(--ps-surface-emerald)" : "var(--ps-surface-alt)",
                                      color: item.currentDRP ? "var(--ps-green)" : "var(--ps-text-muted)",
                                      border: `1px solid ${item.currentDRP ? "var(--ps-ring-green)" : "var(--ps-border)"}` }}>
                                      {item.currentDRP ? "DRP" : "Cash"}
                                    </span>
                                  </td>
                                  <td style={{ padding: "6px 10px", textAlign: "center" }}>
                                    <button onClick={() => toggleItem(item.key, isOn)}
                                      style={{ width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer", position: "relative",
                                        background: isOn ? "#4F46E5" : "var(--ps-border-mid)", transition: "background 0.2s" }}>
                                      <span style={{ position: "absolute", top: 2, left: isOn ? 18 : 2, width: 16, height: 16, borderRadius: "50%",
                                        background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {Object.keys(drpOverrides).some(k => drpOverrides[k] !== (eligibleItems.find(i => i.key === k)?.currentDRP)) && (
                        <div style={{ fontSize: 10, color: "#B45309", marginTop: 6, fontStyle: "italic" }}>
                          ⚡ Highlighted rows show changes from current fact find settings
                        </div>
                      )}
                    </div>
                  );
                })()}
                {editingStrat.strategy_id === "130" && (() => {
                  const trusts = factFind.trusts || [];
                  const trustOptions = trusts.map((t, i) => ({
                    value: String(i), label: t.trust_name || `Trust ${i + 1}`
                  }));
                  return (
                    <div style={{ marginTop: 8 }}>
                      <FFSelect label="Trust to wind up" value={editingStrat.trust_idx || "0"}
                        onChange={v => updateStrat(editingStrat.id, "trust_idx", v)}
                        options={trustOptions.length > 0 ? trustOptions : [{ value: "0", label: "No trusts in fact find" }]} />
                    </div>
                  );
                })()}
                {editingStrat.strategy_id === "131" && (() => {
                  const companies = factFind.companies || [];
                  const companyOptions = companies.map((c, i) => ({
                    value: String(i), label: c.company_name || `Company ${i + 1}`
                  }));
                  const currentFY = new Date().getFullYear();
                  const yearOpts = Array.from({ length: 20 }, (_, i) => ({ value: String(currentFY + i), label: String(currentFY + i) }));
                  const exitMethod = editingStrat.exit_method || "liquidate";
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Company" value={editingStrat.company_idx || "0"}
                        onChange={v => updateStrat(editingStrat.id, "company_idx", v)}
                        options={companyOptions.length > 0 ? companyOptions : [{ value: "0", label: "No companies in fact find" }]} />
                      <FFSelect label="Exit Year" value={editingStrat.sell_year || String(currentFY + 1)}
                        onChange={v => updateStrat(editingStrat.id, "sell_year", v)}
                        options={yearOpts} />
                      <FFRadioRow label="Exit Method" value={exitMethod}
                        onChange={v => updateStrat(editingStrat.id, "exit_method", v)}
                        options={[{ value: "liquidate", label: "Liquidate all assets" }, { value: "agreed_price", label: "Agreed sale price" }]} />
                      {exitMethod === "agreed_price" && (
                        <FFInput label="Sale Price" value={editingStrat.sale_price || ""} onChange={v => updateStrat(editingStrat.id, "sale_price", v)} type="number" prefix="$" placeholder="Total consideration" />
                      )}
                      <FFInput label="Transaction / Wind-up Costs" value={editingStrat.windup_costs || ""} onChange={v => updateStrat(editingStrat.id, "windup_costs", v)} type="number" prefix="$" placeholder="Legal, accounting, ASIC fees" />
                      <FFRadioRow label="Distribution Method" value={editingStrat.dist_method || "auto"}
                        onChange={v => updateStrat(editingStrat.id, "dist_method", v)}
                        options={[{ value: "auto", label: "Pro-rata by shareholding" }, { value: "manual", label: "Custom split" }]} />
                      <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontStyle: "italic", padding: "8px 10px", background: "var(--ps-surface-alt)", borderRadius: 6, lineHeight: 1.5 }}>
                        On exit: final P&L computed for exit year, all company assets realised, liabilities settled, remaining funds distributed to shareholders as franked dividends (up to franking balance), capital return (up to share capital), then liquidator distribution (CGT event for shareholders).
                      </div>
                      {/* Small Business CGT Concessions for share sale */}
                      {(() => {
                        const coIdx = parseInt(editingStrat.company_idx) || 0;
                        const co = (factFind.companies || [])[coIdx];
                        const shs = co?.shareholders || [];
                        const exitYr = parseInt(editingStrat.sell_year) || (new Date().getFullYear() + 1);
                        // Build super fund options for each shareholder
                        const getSuperFunds = (shName) => {
                          const c1Name = ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim();
                          const c2Name = ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim();
                          const funds = [];
                          (factFind.superProducts || []).forEach((sp, i) => {
                            const ownerName = sp.owner === "client1" ? c1Name : sp.owner === "client2" ? c2Name : "";
                            if (ownerName === shName || !shName) funds.push({ value: `super_${i}`, label: sp.fund_name || `Super ${i + 1}` });
                          });
                          (factFind.smsfs || []).forEach((sf, i) => {
                            const members = sf.members || [];
                            if (members.some(m => m.member_name === shName) || !shName) funds.push({ value: `smsf_${i}`, label: sf.smsf_name || `SMSF ${i + 1}` });
                          });
                          return funds.length > 0 ? funds : [{ value: "", label: "No funds available" }];
                        };
                        const getAge = (shName) => {
                          const c1Name = ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim();
                          const c2Name = ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim();
                          let dob = null;
                          if (shName === c1Name) dob = factFind.client1?.date_of_birth;
                          else if (shName === c2Name) dob = factFind.client2?.date_of_birth;
                          if (!dob) return null;
                          const bd = new Date(dob);
                          const ageAtExit = exitYr - bd.getFullYear();
                          return ageAtExit;
                        };
                        // Get/set per-shareholder retirement config
                        const retConfig = editingStrat.sbc_retirement_config || {};
                        const updateRetConfig = (shIdx, field, val) => {
                          const cfg = { ...(editingStrat.sbc_retirement_config || {}) };
                          cfg[shIdx] = { ...(cfg[shIdx] || {}), [field]: val };
                          updateStrat(editingStrat.id, "sbc_retirement_config", cfg);
                        };
                        return (
                          <div style={{ padding: 12, borderRadius: 8, border: "1px solid var(--ps-ring-amber)", background: "var(--ps-surface-amber)" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", marginBottom: 8 }}>Small Business CGT Concessions (Div 152)</div>
                            <FFRadioRow label="Eligible for SB concessions?" value={editingStrat.sbc_eligible || ""} onChange={v => updateStrat(editingStrat.id, "sbc_eligible", v)}
                              options={[{ value: "1", label: "Yes" }, { value: "0", label: "No" }]} />
                            {editingStrat.sbc_eligible === "1" && (<>
                              <div style={{ fontSize: 10, color: "#92400E", marginBottom: 6, marginTop: 8 }}>Concessions applied to liquidator distribution (CGT event at shareholder level):</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <FFRadioRow label="15-Year Exemption" value={editingStrat.sbc_15yr || ""} onChange={v => updateStrat(editingStrat.id, "sbc_15yr", v)}
                                  options={[{ value: "1", label: "Yes — full exemption" }, { value: "", label: "No" }]} />
                                {editingStrat.sbc_15yr === "1" && (
                                  <div style={{ padding: "8px 10px", borderRadius: 6, background: "#ECFDF5", border: "1px solid #6EE7B7" }}>
                                    <div style={{ fontSize: 10, fontWeight: 600, color: "#065F46" }}>✓ Entire capital gain exempt. No further concessions required.</div>
                                    <div style={{ fontSize: 9, color: "#065F46", marginTop: 4 }}>Proceeds can be contributed to super under the CGT cap ($1.78M lifetime).</div>
                                    {/* Per-shareholder super contribution for 15yr */}
                                    <div style={{ marginTop: 8 }}>
                                      {shs.map((sh, si) => {
                                        const age = getAge(sh.sh_entity);
                                        const under55 = age !== null && age < 55;
                                        const cfg = retConfig[si] || {};
                                        const funds = getSuperFunds(sh.sh_entity);
                                        return (
                                          <div key={si} style={{ padding: "6px 8px", marginTop: 4, background: "white", borderRadius: 6, border: "1px solid #D1FAE5" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                              <span style={{ fontSize: 10, fontWeight: 700, color: "#065F46" }}>{sh.sh_entity || `Shareholder ${si + 1}`}</span>
                                              <span style={{ fontSize: 9, color: "#065F46" }}>{age !== null ? `Age at exit: ${age}` : ""} {under55 ? "— must contribute to super" : age !== null ? "— super optional" : ""}</span>
                                            </div>
                                            {under55 ? (
                                              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                <div style={{ flex: 1 }}><FFInput label="Amount to super" value={cfg.super_amt || ""} onChange={v => updateRetConfig(si, "super_amt", v)} type="number" prefix="$" placeholder="Exempt amount" /></div>
                                                <div style={{ flex: 1 }}><FFSelect label="Fund" value={cfg.super_fund || ""} onChange={v => updateRetConfig(si, "super_fund", v)} options={funds} /></div>
                                              </div>
                                            ) : (
                                              <div>
                                                <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                                                  {[["1","Yes — contribute to super"],["","No"]].map(([v,l]) => (
                                                    <button key={v} onClick={() => updateRetConfig(si, "contribute_super", v)} style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid var(--ps-border)", background: (cfg.contribute_super || "") === v ? "#4F46E5" : "white", color: (cfg.contribute_super || "") === v ? "white" : "var(--ps-text-muted)", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{l}</button>
                                                  ))}
                                                </div>
                                                {cfg.contribute_super === "1" && (
                                                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                    <div style={{ flex: 1 }}><FFInput label="Amount to super" value={cfg.super_amt || ""} onChange={v => updateRetConfig(si, "super_amt", v)} type="number" prefix="$" placeholder="CGT cap amount" /></div>
                                                    <div style={{ flex: 1 }}><FFSelect label="Fund" value={cfg.super_fund || ""} onChange={v => updateRetConfig(si, "super_fund", v)} options={funds} /></div>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                {editingStrat.sbc_15yr !== "1" && (<>
                                  <FFRadioRow label="50% Active Asset Reduction" value={editingStrat.sbc_active_asset || ""} onChange={v => updateStrat(editingStrat.id, "sbc_active_asset", v)}
                                    options={[{ value: "1", label: "Yes" }, { value: "", label: "No" }]} />
                                  <FFRadioRow label="Retirement Exemption ($500K lifetime cap)" value={editingStrat.sbc_retirement || ""} onChange={v => updateStrat(editingStrat.id, "sbc_retirement", v)}
                                    options={[{ value: "1", label: "Yes" }, { value: "", label: "No" }]} />
                                  {editingStrat.sbc_retirement === "1" && (
                                    <div style={{ padding: 8, borderRadius: 6, background: "white", border: "1px solid #FDE68A" }}>
                                      <div style={{ fontSize: 10, fontWeight: 600, color: "#92400E", marginBottom: 6 }}>Per-shareholder retirement exemption & super contribution</div>
                                      {shs.map((sh, si) => {
                                        const age = getAge(sh.sh_entity);
                                        const under55 = age !== null && age < 55;
                                        const cfg = retConfig[si] || {};
                                        const funds = getSuperFunds(sh.sh_entity);
                                        return (
                                          <div key={si} style={{ padding: "6px 8px", marginTop: 4, background: "var(--ps-surface-alt)", borderRadius: 6, border: "1px solid var(--ps-border-light)" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                              <span style={{ fontSize: 10, fontWeight: 700 }}>{sh.sh_entity || `Shareholder ${si + 1}`} ({sh.sh_pct || 0}%)</span>
                                              <span style={{ fontSize: 9, color: "var(--ps-text-muted)" }}>{age !== null ? `Age at exit: ${age}` : "Age unknown"} {under55 ? " — must contribute to super" : age !== null ? " — super optional" : ""}</span>
                                            </div>
                                            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: under55 ? 0 : 4 }}>
                                              <div style={{ flex: 1 }}><FFInput label="Exempt amount" value={cfg.retirement_amt || ""} onChange={v => updateRetConfig(si, "retirement_amt", v)} type="number" prefix="$" placeholder="Up to $500,000" /></div>
                                            </div>
                                            {under55 ? (
                                              <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                                                <div style={{ flex: 1 }}><FFSelect label="Contribute to fund (mandatory)" value={cfg.super_fund || ""} onChange={v => updateRetConfig(si, "super_fund", v)} options={funds} /></div>
                                              </div>
                                            ) : (
                                              <div>
                                                <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                                                  {[["1","Contribute to super"],["","No super contribution"]].map(([v,l]) => (
                                                    <button key={v} onClick={() => updateRetConfig(si, "contribute_super", v)} style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid var(--ps-border)", background: (cfg.contribute_super || "") === v ? "#4F46E5" : "white", color: (cfg.contribute_super || "") === v ? "white" : "var(--ps-text-muted)", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{l}</button>
                                                  ))}
                                                </div>
                                                {cfg.contribute_super === "1" && (
                                                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                    <div style={{ flex: 1 }}><FFSelect label="Fund" value={cfg.super_fund || ""} onChange={v => updateRetConfig(si, "super_fund", v)} options={funds} /></div>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                      <div style={{ fontSize: 9, color: "#92400E", marginTop: 6, fontStyle: "italic" }}>Contributions made under the CGT cap ($1.78M lifetime limit, indexed). Under 55s must contribute exempt amount to super.</div>
                                    </div>
                                  )}
                                </>)}
                              </div>
                            </>)}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
                {editingStrat.strategy_id === "190" && (() => {
                  const currentFY = new Date().getFullYear();
                  const STRAT_YRS = Array.from({ length: 20 }, (_, i) => ({ value: String(currentFY + i), label: `FY${String(currentFY + i).slice(-2)}` }));
                  // Only commercial property (type 21) is eligible — SMSF can only acquire business real property from related parties
                  const allAssets = factFind.assets || [];
                  const properties = allAssets.map((a, i) => ({ idx: i, asset: a })).filter(({ asset }) => asset.a_type === "21");
                  const getOwnerLabel = (a) => {
                    if (a.a_owner === "client1") return factFind.client1?.first_name || "Client 1";
                    if (a.a_owner === "client2") return factFind.client2?.first_name || "Client 2";
                    if (a.a_owner === "joint") return "Joint";
                    if (a.a_owner?.startsWith("trust_")) { const ti = parseInt(a.a_owner.replace("trust_", "")); return (factFind.trusts || [])[ti]?.trust_name || `Trust ${ti + 1}`; }
                    if (a.a_owner?.startsWith("company_")) { const ci = parseInt(a.a_owner.replace("company_", "")); return (factFind.companies || [])[ci]?.company_name || `Company ${ci + 1}`; }
                    if (a.a_owner?.startsWith("smsf_")) return "SMSF";
                    return a.a_owner || "Unknown";
                  };
                  // SMSFs
                  const smsfs = factFind.smsfs || [];
                  const smsfOptions = [];
                  smsfs.forEach((sf, si) => {
                    if (sf.acct_type === "2" || sf.acct_type === "segregated") {
                      // Segregated: show individual accounts
                      (sf.accounts || []).forEach((acc, ai) => {
                        const ownerName = acc.owner === "client1" ? (factFind.client1?.first_name || "Client 1") : acc.owner === "client2" ? (factFind.client2?.first_name || "Client 2") : `Member ${ai + 1}`;
                        const envLabel = acc.tax_environment === "pension" ? "Pension" : "Accumulation";
                        smsfOptions.push({ value: `smsf_${si}_${ai}`, label: `${sf.smsf_name || "SMSF"} — ${ownerName} (${envLabel})` });
                      });
                    } else {
                      // Pooled: show the SMSF as a whole
                      smsfOptions.push({ value: `smsf_${si}`, label: sf.smsf_name || `SMSF ${si + 1}` });
                    }
                  });
                  const selectedPropIdx = parseInt(editingStrat.property_idx);
                  const selectedProp = !isNaN(selectedPropIdx) ? allAssets[selectedPropIdx] : null;
                  const propValue = selectedProp ? (parseFloat(selectedProp.a_value) || 0) : 0;
                  const transferPct = parseFloat(editingStrat.transfer_pct) || 100;
                  const purchasePrice = editingStrat.purchase_price_override ? (parseFloat(editingStrat.purchase_price) || 0) : Math.round(propValue * transferPct / 100);
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Commercial property to purchase" value={editingStrat.property_idx || ""}
                        onChange={v => updateStrat(editingStrat.id, "property_idx", v)}
                        options={[{ value: "", label: "Select commercial property..." }, ...properties.map(({ idx, asset }) => ({
                          value: String(idx), label: `${asset.a_name || "Property"} — ${getOwnerLabel(asset)} — $${Number(asset.a_value || 0).toLocaleString()}`
                        }))]} />
                      {properties.length === 0 && (
                        <div style={{ padding: "8px 10px", borderRadius: 6, background: "#FEF3C7", border: "1px solid #FDE68A", fontSize: 10, color: "#92400E" }}>
                          ⚠️ No commercial properties found. Add a commercial property (type "Commercial property") to the Assets & Liabilities schedule first, owned by the entity selling to the SMSF.
                        </div>
                      )}
                      {selectedProp && (
                        <div style={{ padding: "8px 10px", borderRadius: 6, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border-light)" }}>
                          <div style={{ fontSize: 10, color: "var(--ps-text-muted)" }}>
                            Current owner: <strong>{getOwnerLabel(selectedProp)}</strong> | Type: <strong>{{ "1": "Principal Residence", "18": "Investment Property", "21": "Commercial Property", "20": "Holiday Home", "19": "PR (Absent)" }[selectedProp.a_type] || selectedProp.a_type}</strong> | Value: <strong>${propValue.toLocaleString()}</strong>
                          </div>
                        </div>
                      )}
                      <FFSelect label="Purchasing SMSF" value={editingStrat.smsf_ref || ""}
                        onChange={v => updateStrat(editingStrat.id, "smsf_ref", v)}
                        options={[{ value: "", label: "Select SMSF..." }, ...smsfOptions]} />
                      <FFSelect label="Transfer year" value={editingStrat.transfer_year || String(currentFY + 1)}
                        onChange={v => updateStrat(editingStrat.id, "transfer_year", v)}
                        options={STRAT_YRS} />
                      <div style={ffRowStyle}>
                        <FFInput label="Transfer %" value={editingStrat.transfer_pct || "100"} onChange={v => updateStrat(editingStrat.id, "transfer_pct", v)} type="number" suffix="%" placeholder="100" />
                        <FFInput label="Transaction costs %" value={editingStrat.transaction_costs_pct || "2"} onChange={v => updateStrat(editingStrat.id, "transaction_costs_pct", v)} type="number" suffix="%" />
                      </div>
                      {transferPct < 100 && (
                        <div style={{ padding: "6px 10px", borderRadius: 6, background: "#EFF6FF", border: "1px solid #93C5FD", fontSize: 10, color: "#1E40AF" }}>
                          ℹ️ Partial purchase creates <strong>tenants in common</strong> — SMSF will own {transferPct}%, original owner retains {100 - transferPct}%.
                        </div>
                      )}
                      <div style={{ marginTop: 4 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                          {[["", "Market value"], ["1", "Override price"]].map(([v, l]) => (
                            <button key={v} onClick={() => updateStrat(editingStrat.id, "purchase_price_override", v)} style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid var(--ps-border)", background: (editingStrat.purchase_price_override || "") === v ? "#4F46E5" : "white", color: (editingStrat.purchase_price_override || "") === v ? "white" : "var(--ps-text-muted)", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{l}</button>
                          ))}
                        </div>
                        {editingStrat.purchase_price_override === "1" ? (
                          <FFInput label="Purchase price" value={editingStrat.purchase_price || ""} onChange={v => updateStrat(editingStrat.id, "purchase_price", v)} type="number" prefix="$" placeholder="Market value required for related parties" />
                        ) : (
                          <div style={{ fontSize: 10, color: "var(--ps-text-muted)" }}>Purchase price: <strong>${purchasePrice.toLocaleString()}</strong> ({transferPct}% of ${propValue.toLocaleString()})</div>
                        )}
                      </div>
                      {/* Small Business CGT Concessions for the seller */}
                      {selectedProp && (selectedProp.a_ownType === "3" || selectedProp.a_ownType === "4") && (
                        <div style={{ padding: 10, borderRadius: 8, border: "1px solid var(--ps-ring-amber)", background: "var(--ps-surface-amber)" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", marginBottom: 6 }}>Seller CGT Concessions (Div 152)</div>
                          <FFRadioRow label="Eligible for SB concessions?" value={editingStrat.sbc_eligible || ""} onChange={v => updateStrat(editingStrat.id, "sbc_eligible", v)}
                            options={[{ value: "1", label: "Yes" }, { value: "0", label: "No" }]} />
                          {editingStrat.sbc_eligible === "1" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                              <FFRadioRow label="15-Year Exemption" value={editingStrat.sbc_15yr || ""} onChange={v => updateStrat(editingStrat.id, "sbc_15yr", v)}
                                options={[{ value: "1", label: "Yes — full exemption" }, { value: "", label: "No" }]} />
                              {editingStrat.sbc_15yr !== "1" && (<>
                                <FFRadioRow label="50% Active Asset Reduction" value={editingStrat.sbc_active_asset || ""} onChange={v => updateStrat(editingStrat.id, "sbc_active_asset", v)}
                                  options={[{ value: "1", label: "Yes" }, { value: "", label: "No" }]} />
                                <FFRadioRow label="Retirement Exemption" value={editingStrat.sbc_retirement || ""} onChange={v => updateStrat(editingStrat.id, "sbc_retirement", v)}
                                  options={[{ value: "1", label: "Yes" }, { value: "", label: "No" }]} />
                                {editingStrat.sbc_retirement === "1" && (
                                  <FFInput label="Retirement exemption amount" value={editingStrat.sbc_retirement_amt || ""} onChange={v => updateStrat(editingStrat.id, "sbc_retirement_amt", v)} type="number" prefix="$" placeholder="Up to $500,000" />
                                )}
                              </>)}
                            </div>
                          )}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontStyle: "italic", padding: "8px 10px", background: "var(--ps-surface-alt)", borderRadius: 6, lineHeight: 1.5 }}>
                        SMSF purchases commercial property from a related party at market value (independent valuation required). Only business real property (commercial) is permitted — residential property from related parties is prohibited under in-house asset rules (s66). The seller receives cash proceeds and a CGT event is triggered. The SMSF pays from its cash balance — not a contribution, so NCC caps are unaffected.
                      </div>
                    </div>
                  );
                })()}
                {editingStrat.strategy_id === "123" && (() => {
                  const currentFY = new Date().getFullYear();
                  const STRAT_YRS = Array.from({ length: 20 }, (_, i) => ({ value: String(currentFY + i), label: `FY${String(currentFY + i).slice(-2)}` }));
                  // Eligible asset types: AU Shares, Intl Shares, Managed Funds, Investment Other (listed securities & managed funds only)
                  const eligibleTypes = ["12", "13", "26", "42"];
                  const allAssets = factFind.assets || [];
                  const eligibleAssets = allAssets.map((a, i) => ({ idx: i, asset: a })).filter(({ asset }) => eligibleTypes.includes(asset.a_type));
                  const typeLabels = { "12": "AU Shares", "13": "Intl Shares", "26": "Managed Funds", "42": "Investment Other" };
                  const getOwnerLabel = (a) => {
                    if (a.a_owner === "client1") return factFind.client1?.first_name || "Client 1";
                    if (a.a_owner === "client2") return factFind.client2?.first_name || "Client 2";
                    if (a.a_owner === "joint") return "Joint";
                    if (a.a_owner?.startsWith("trust_")) { const ti = parseInt(a.a_owner.replace("trust_", "")); return (factFind.trusts || [])[ti]?.trust_name || `Trust ${ti + 1}`; }
                    if (a.a_owner?.startsWith("company_")) { const ci = parseInt(a.a_owner.replace("company_", "")); return (factFind.companies || [])[ci]?.company_name || `Company ${ci + 1}`; }
                    return a.a_owner || "Unknown";
                  };
                  // Member/principal options
                  const c1Name = ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim();
                  const c2Name = ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim();
                  const memberOptions = [{ value: "", label: "Select member..." }];
                  if (c1Name) memberOptions.push({ value: "client1", label: c1Name });
                  if (c2Name) memberOptions.push({ value: "client2", label: c2Name });
                  // Destination fund options — accumulation accounts in SMSFs + retail super
                  const fundOptions = [{ value: "", label: "Select fund..." }];
                  (factFind.superProducts || []).forEach((sp, i) => {
                    const ownerKey = sp.owner || "";
                    if (ownerKey !== editingStrat.member) return;
                    fundOptions.push({ value: `super_${i}`, label: sp.fund_name || `Super ${i + 1}` });
                  });
                  (factFind.smsfs || []).forEach((sf, si) => {
                    if (sf.acct_type === "2" || sf.acct_type === "segregated") {
                      (sf.accounts || []).forEach((acc, ai) => {
                        const accOwner = acc.owner || "";
                        if (accOwner !== editingStrat.member) return;
                        if (acc.tax_environment === "pension") return; // accumulation only
                        fundOptions.push({ value: `smsf_${si}_${ai}`, label: `${sf.smsf_name || "SMSF"} — ${acc.owner === "client1" ? (factFind.client1?.first_name || "Client 1") : (factFind.client2?.first_name || "Client 2")} (Accumulation)` });
                      });
                    } else {
                      // Pooled SMSF — check if member is a member
                      const members = sf.members || [];
                      const memberName = editingStrat.member === "client1" ? c1Name : c2Name;
                      if (members.some(m => m.member_name === memberName) || members.length === 0) {
                        fundOptions.push({ value: `smsf_${si}`, label: `${sf.smsf_name || `SMSF ${si + 1}`} (Pooled)` });
                      }
                    }
                  });
                  const selectedAssetIdx = parseInt(editingStrat.asset_idx);
                  const selectedAsset = !isNaN(selectedAssetIdx) ? allAssets[selectedAssetIdx] : null;
                  const assetValue = selectedAsset ? (parseFloat(selectedAsset.a_value) || 0) : 0;
                  const transferPct = parseFloat(editingStrat.transfer_pct) || 100;
                  const transferValue = editingStrat.transfer_value_override === "1" ? (parseFloat(editingStrat.transfer_value) || 0) : Math.round(assetValue * transferPct / 100);
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Asset to transfer" value={editingStrat.asset_idx || ""}
                        onChange={v => updateStrat(editingStrat.id, "asset_idx", v)}
                        options={[{ value: "", label: "Select asset..." }, ...eligibleAssets.map(({ idx, asset }) => ({
                          value: String(idx), label: `${asset.a_name || "Asset"} (${typeLabels[asset.a_type] || asset.a_type}) — ${getOwnerLabel(asset)} — $${Number(asset.a_value || 0).toLocaleString()}`
                        }))]} />
                      {eligibleAssets.length === 0 && (
                        <div style={{ padding: "8px 10px", borderRadius: 6, background: "#FEF3C7", border: "1px solid #FDE68A", fontSize: 10, color: "#92400E" }}>
                          ⚠️ No eligible assets found. In-specie transfers are available for Australian Shares, International Shares, Managed Funds, and ETFs. Add these to the Assets & Liabilities schedule.
                        </div>
                      )}
                      {selectedAsset && (
                        <div style={{ padding: "8px 10px", borderRadius: 6, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border-light)" }}>
                          <div style={{ fontSize: 10, color: "var(--ps-text-muted)" }}>
                            Current owner: <strong>{getOwnerLabel(selectedAsset)}</strong> | Type: <strong>{typeLabels[selectedAsset.a_type] || selectedAsset.a_type}</strong> | Value: <strong>${assetValue.toLocaleString()}</strong>
                          </div>
                        </div>
                      )}
                      <div style={ffRowStyle}>
                        <FFSelect label="Member / principal" value={editingStrat.member || ""}
                          onChange={v => { updateStrat(editingStrat.id, "member", v); updateStrat(editingStrat.id, "dest_fund", ""); }}
                          options={memberOptions} />
                        <FFSelect label="Destination fund (accumulation)" value={editingStrat.dest_fund || ""}
                          onChange={v => updateStrat(editingStrat.id, "dest_fund", v)}
                          options={fundOptions} />
                      </div>
                      <FFSelect label="Transfer year" value={editingStrat.transfer_year || String(currentFY + 1)}
                        onChange={v => updateStrat(editingStrat.id, "transfer_year", v)}
                        options={STRAT_YRS} />
                      <div style={ffRowStyle}>
                        <FFInput label="Transfer %" value={editingStrat.transfer_pct || "100"} onChange={v => updateStrat(editingStrat.id, "transfer_pct", v)} type="number" suffix="%" placeholder="100" />
                        <FFInput label="Transaction costs %" value={editingStrat.transaction_costs_pct || "0"} onChange={v => updateStrat(editingStrat.id, "transaction_costs_pct", v)} type="number" suffix="%" />
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                          {[["", "Market value"], ["1", "Override value"]].map(([v, l]) => (
                            <button key={v} onClick={() => updateStrat(editingStrat.id, "transfer_value_override", v)} style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid var(--ps-border)", background: (editingStrat.transfer_value_override || "") === v ? "#4F46E5" : "white", color: (editingStrat.transfer_value_override || "") === v ? "white" : "var(--ps-text-muted)", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{l}</button>
                          ))}
                        </div>
                        {editingStrat.transfer_value_override === "1" ? (
                          <FFInput label="Transfer value" value={editingStrat.transfer_value || ""} onChange={v => updateStrat(editingStrat.id, "transfer_value", v)} type="number" prefix="$" placeholder="Market value at transfer" />
                        ) : (
                          <div style={{ fontSize: 10, color: "var(--ps-text-muted)" }}>Transfer value: <strong>${transferValue.toLocaleString()}</strong> ({transferPct}% of ${assetValue.toLocaleString()})</div>
                        )}
                      </div>
                      {transferValue > 0 && (
                        <div style={{ padding: "8px 10px", borderRadius: 6, background: "#EFF6FF", border: "1px solid #93C5FD" }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#1E40AF", marginBottom: 4 }}>Transfer Summary</div>
                          <div style={{ fontSize: 10, color: "#1E40AF", lineHeight: 1.6 }}>
                            • Transfer value: <strong>${transferValue.toLocaleString()}</strong> counts as NCC for {editingStrat.member === "client1" ? (factFind.client1?.first_name || "Client 1") : editingStrat.member === "client2" ? (factFind.client2?.first_name || "Client 2") : "member"}<br/>
                            • CGT event triggered for current owner ({selectedAsset ? getOwnerLabel(selectedAsset) : "seller"})<br/>
                            • SMSF cost base = ${transferValue.toLocaleString()} (market value at transfer)<br/>
                            • No cash movement — asset transfers directly
                          </div>
                        </div>
                      )}
                      {transferValue > 120000 && (
                        <div style={{ padding: "8px 10px", borderRadius: 6, background: "#FEF3C7", border: "1px solid #FDE68A", fontSize: 10, color: "#92400E" }}>
                          ⚠️ Transfer value exceeds the standard NCC cap ($120K). Ensure the member has bring-forward cap available ($360K over 3 years) or the excess will be subject to excess contributions tax.
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontStyle: "italic", padding: "8px 10px", background: "var(--ps-surface-alt)", borderRadius: 6, lineHeight: 1.5 }}>
                        In-specie transfer of listed securities / managed funds into super. The transfer counts as a non-concessional contribution (NCC) for the receiving member. A CGT event is triggered for the transferring entity at market value. The SMSF acquires the asset with a cost base equal to the transfer value. No cash changes hands.
                      </div>
                    </div>
                  );
                })()}
                {/* ═══ STRATEGY 20: Distribute Dividend ═══ */}
                {editingStrat.strategy_id === "20" && (() => {
                  const currentFY = new Date().getFullYear();
                  const STRAT_YRS = Array.from({ length: 20 }, (_, i) => ({ value: String(currentFY + i), label: `FY${String(currentFY + i).slice(-2)}` }));
                  const companies = factFind.companies || [];
                  const coOptions = [{ value: "", label: "Select company..." }, ...companies.map((c, i) => ({ value: String(i), label: c.company_name || `Company ${i + 1}` }))];
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Company" value={editingStrat.company_idx || ""} onChange={v => updateStrat(editingStrat.id, "company_idx", v)} options={coOptions} />

                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ps-text-secondary)", borderBottom: "1px solid var(--ps-border-light)", paddingBottom: 4 }}>Distribution Rate Override</div>
                      <FFInput label="Distribution rate (% of after-tax profit)" value={editingStrat.dist_pct || "100"} onChange={v => updateStrat(editingStrat.id, "dist_pct", v)} type="number" suffix="%" placeholder="100" />
                      <div style={ffRowStyle}>
                        <FFSelect label="Effective from" value={editingStrat.start_year || String(currentFY)} onChange={v => updateStrat(editingStrat.id, "start_year", v)} options={STRAT_YRS} />
                        <FFSelect label="Until" value={editingStrat.end_year || ""} onChange={v => updateStrat(editingStrat.id, "end_year", v)} options={[{ value: "", label: "Ongoing" }, ...STRAT_YRS]} />
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[["franked", "Fully Franked"], ["unfranked", "Unfranked"], ["partial", "Partially Franked"]].map(([v, l]) => (
                          <button key={v} onClick={() => updateStrat(editingStrat.id, "franking_type", v)} style={{ padding: "4px 12px", borderRadius: 5, border: "1px solid var(--ps-border)", background: (editingStrat.franking_type || "franked") === v ? "#4F46E5" : "white", color: (editingStrat.franking_type || "franked") === v ? "white" : "var(--ps-text-muted)", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{l}</button>
                        ))}
                      </div>
                      {editingStrat.franking_type === "partial" && (
                        <FFInput label="Franking %" value={editingStrat.franking_pct || "50"} onChange={v => updateStrat(editingStrat.id, "franking_pct", v)} type="number" suffix="%" />
                      )}
                      <div style={{ padding: "8px 10px", borderRadius: 6, background: "#EFF6FF", border: "1px solid #93C5FD", fontSize: 10, color: "#1E40AF", lineHeight: 1.5 }}>
                        <strong>Default:</strong> 100% of after-tax profit distributed pro-rata to shareholders. Adjust to retain profits in the company (e.g. 60% distributes 60%, retains 40%).
                      </div>

                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ps-text-secondary)", borderBottom: "1px solid var(--ps-border-light)", paddingBottom: 4, marginTop: 6 }}>Special Dividend</div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                        {[["", "None"], ["1", "Yes — declare special dividend"]].map(([v, l]) => (
                          <button key={v} onClick={() => updateStrat(editingStrat.id, "special_div", v)} style={{ padding: "4px 12px", borderRadius: 5, border: "1px solid var(--ps-border)", background: (editingStrat.special_div || "") === v ? "#4F46E5" : "white", color: (editingStrat.special_div || "") === v ? "white" : "var(--ps-text-muted)", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{l}</button>
                        ))}
                      </div>
                      {editingStrat.special_div === "1" && (
                        <>
                          <FFInput label="Special dividend amount" value={editingStrat.special_div_amount || ""} onChange={v => updateStrat(editingStrat.id, "special_div_amount", v)} type="number" prefix="$" placeholder="One-off amount from retained earnings" />
                          <FFSelect label="In year" value={editingStrat.special_div_year || String(currentFY + 1)} onChange={v => updateStrat(editingStrat.id, "special_div_year", v)} options={STRAT_YRS} />
                          <div style={{ display: "flex", gap: 6 }}>
                            {[["franked", "Fully Franked"], ["unfranked", "Unfranked"], ["partial", "Partially Franked"]].map(([v, l]) => (
                              <button key={v} onClick={() => updateStrat(editingStrat.id, "special_franking_type", v)} style={{ padding: "4px 12px", borderRadius: 5, border: "1px solid var(--ps-border)", background: (editingStrat.special_franking_type || "franked") === v ? "#4F46E5" : "white", color: (editingStrat.special_franking_type || "franked") === v ? "white" : "var(--ps-text-muted)", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{l}</button>
                            ))}
                          </div>
                          {editingStrat.special_franking_type === "partial" && (
                            <FFInput label="Franking %" value={editingStrat.special_franking_pct || "50"} onChange={v => updateStrat(editingStrat.id, "special_franking_pct", v)} type="number" suffix="%" />
                          )}
                          <div style={{ padding: "8px 10px", borderRadius: 6, background: "#FEF3C7", border: "1px solid #FDE68A", fontSize: 10, color: "#92400E", lineHeight: 1.5 }}>
                            Special dividend is a one-off distribution from retained earnings / accumulated profits. Paid pro-rata to all shareholders. This is in addition to the regular distribution rate above.
                          </div>
                        </>
                      )}

                      <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontStyle: "italic", padding: "8px 10px", background: "var(--ps-surface-alt)", borderRadius: 6, lineHeight: 1.5 }}>
                        Dividends are distributed pro-rata to shareholders based on shareholding %. Franked dividends include franking credits (company tax already paid). Assessable income for shareholder with franking credit tax offset.
                      </div>
                    </div>
                  );
                })()}
                {/* ═══ STRATEGY 191: Pay Director Fees / Salary ═══ */}
                {editingStrat.strategy_id === "191" && (() => {
                  const currentFY = new Date().getFullYear();
                  const STRAT_YRS = Array.from({ length: 20 }, (_, i) => ({ value: String(currentFY + i), label: `FY${String(currentFY + i).slice(-2)}` }));
                  const companies = factFind.companies || [];
                  const coOptions = [{ value: "", label: "Select company..." }, ...companies.map((c, i) => ({ value: String(i), label: c.company_name || `Company ${i + 1}` }))];
                  const c1Name = ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim();
                  const c2Name = ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim();
                  const recipOptions = [{ value: "", label: "Select director..." }];
                  if (c1Name) recipOptions.push({ value: "client1", label: c1Name });
                  if (c2Name) recipOptions.push({ value: "client2", label: c2Name });
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Company" value={editingStrat.company_idx || ""} onChange={v => updateStrat(editingStrat.id, "company_idx", v)} options={coOptions} />
                      <FFSelect label="Director / recipient" value={editingStrat.recipient || ""} onChange={v => updateStrat(editingStrat.id, "recipient", v)} options={recipOptions} />
                      <FFInput label="Annual amount (gross)" value={editingStrat.amount || ""} onChange={v => updateStrat(editingStrat.id, "amount", v)} type="number" prefix="$" />
                      <div style={ffRowStyle}>
                        <FFSelect label="Start year" value={editingStrat.start_year || String(currentFY + 1)} onChange={v => updateStrat(editingStrat.id, "start_year", v)} options={STRAT_YRS} />
                        <FFSelect label="End year" value={editingStrat.end_year || ""} onChange={v => updateStrat(editingStrat.id, "end_year", v)} options={[{ value: "", label: "Ongoing" }, ...STRAT_YRS]} />
                      </div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginRight: 6 }}>Timing</div>
                        {togglePill("Start of Year", editingStrat.timing !== "EOY", () => updateStrat(editingStrat.id, "timing", "SOY"))}
                        {togglePill("End of Year", editingStrat.timing === "EOY", () => updateStrat(editingStrat.id, "timing", "EOY"))}
                      </div>
                      <FFInput label="Growth rate %" value={editingStrat.growth_rate || "0"} onChange={v => updateStrat(editingStrat.id, "growth_rate", v)} type="number" suffix="%" />
                      <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontStyle: "italic", padding: "8px 10px", background: "var(--ps-surface-alt)", borderRadius: 6, lineHeight: 1.5 }}>
                        Director fees / salary are a deductible expense for the company. Assessable income for the recipient. Company must pay superannuation guarantee (SG) on director fees — this is auto-calculated. PAYG withholding applies.
                      </div>
                    </div>
                  );
                })()}
                {/* ═══ STRATEGY 192: Shareholder Loan to Company ═══ */}
                {editingStrat.strategy_id === "192" && (() => {
                  const currentFY = new Date().getFullYear();
                  const STRAT_YRS = Array.from({ length: 20 }, (_, i) => ({ value: String(currentFY + i), label: `FY${String(currentFY + i).slice(-2)}` }));
                  const companies = factFind.companies || [];
                  const coOptions = [{ value: "", label: "Select company..." }, ...companies.map((c, i) => ({ value: String(i), label: c.company_name || `Company ${i + 1}` }))];
                  const c1Name = ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim();
                  const c2Name = ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim();
                  const lenderOptions = [{ value: "", label: "Select lender..." }];
                  if (c1Name) lenderOptions.push({ value: "client1", label: c1Name });
                  if (c2Name) lenderOptions.push({ value: "client2", label: c2Name });
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Company (borrower)" value={editingStrat.company_idx || ""} onChange={v => updateStrat(editingStrat.id, "company_idx", v)} options={coOptions} />
                      <FFSelect label="Shareholder (lender)" value={editingStrat.lender || ""} onChange={v => updateStrat(editingStrat.id, "lender", v)} options={lenderOptions} />
                      <FFInput label="Loan amount" value={editingStrat.amount || ""} onChange={v => updateStrat(editingStrat.id, "amount", v)} type="number" prefix="$" />
                      <FFInput label="Interest rate %" value={editingStrat.interest_rate || "0"} onChange={v => updateStrat(editingStrat.id, "interest_rate", v)} type="number" suffix="%" placeholder="0 for interest-free" />
                      <div style={ffRowStyle}>
                        <FFSelect label="Loan year" value={editingStrat.start_year || String(currentFY + 1)} onChange={v => updateStrat(editingStrat.id, "start_year", v)} options={STRAT_YRS} />
                        <FFInput label="Loan term (years)" value={editingStrat.loan_term || "7"} onChange={v => updateStrat(editingStrat.id, "loan_term", v)} type="number" suffix="yrs" />
                      </div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginRight: 6 }}>Timing</div>
                        {togglePill("Start of Year", editingStrat.timing !== "EOY", () => updateStrat(editingStrat.id, "timing", "SOY"))}
                        {togglePill("End of Year", editingStrat.timing === "EOY", () => updateStrat(editingStrat.id, "timing", "EOY"))}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontStyle: "italic", padding: "8px 10px", background: "var(--ps-surface-alt)", borderRadius: 6, lineHeight: 1.5 }}>
                        Shareholder lends money to the company. Creates a debt (type 66 — Shareholder Loan) on the company balance sheet and a receivable for the shareholder. No Div 7A implications (Div 7A only applies company → shareholder). Interest income is assessable to the shareholder.
                      </div>
                    </div>
                  );
                })()}
                {/* ═══ STRATEGY 193: Div 7A Loan (Company → Shareholder) ═══ */}
                {editingStrat.strategy_id === "193" && (() => {
                  const currentFY = new Date().getFullYear();
                  const STRAT_YRS = Array.from({ length: 20 }, (_, i) => ({ value: String(currentFY + i), label: `FY${String(currentFY + i).slice(-2)}` }));
                  const companies = factFind.companies || [];
                  const coOptions = [{ value: "", label: "Select company..." }, ...companies.map((c, i) => ({ value: String(i), label: c.company_name || `Company ${i + 1}` }))];
                  const c1Name = ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim();
                  const c2Name = ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim();
                  const borrowerOptions = [{ value: "", label: "Select borrower..." }];
                  if (c1Name) borrowerOptions.push({ value: "client1", label: c1Name });
                  if (c2Name) borrowerOptions.push({ value: "client2", label: c2Name });
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Company (lender)" value={editingStrat.company_idx || ""} onChange={v => updateStrat(editingStrat.id, "company_idx", v)} options={coOptions} />
                      <FFSelect label="Shareholder (borrower)" value={editingStrat.borrower || ""} onChange={v => updateStrat(editingStrat.id, "borrower", v)} options={borrowerOptions} />
                      <FFInput label="Loan amount" value={editingStrat.amount || ""} onChange={v => updateStrat(editingStrat.id, "amount", v)} type="number" prefix="$" />
                      <FFInput label="Interest rate (ATO benchmark)" value={editingStrat.interest_rate || "8.27"} onChange={v => updateStrat(editingStrat.id, "interest_rate", v)} type="number" suffix="%" placeholder="ATO benchmark rate" />
                      <div style={ffRowStyle}>
                        <FFSelect label="Loan year" value={editingStrat.start_year || String(currentFY + 1)} onChange={v => updateStrat(editingStrat.id, "start_year", v)} options={STRAT_YRS} />
                        <FFSelect label="Loan term" value={editingStrat.loan_term || "7"} onChange={v => updateStrat(editingStrat.id, "loan_term", v)}
                          options={[{ value: "7", label: "7 years (unsecured)" }, { value: "25", label: "25 years (secured)" }]} />
                      </div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginRight: 6 }}>Timing</div>
                        {togglePill("Start of Year", editingStrat.timing !== "EOY", () => updateStrat(editingStrat.id, "timing", "SOY"))}
                        {togglePill("End of Year", editingStrat.timing === "EOY", () => updateStrat(editingStrat.id, "timing", "EOY"))}
                      </div>
                      <div style={{ padding: "8px 10px", borderRadius: 6, background: "#FEF3C7", border: "1px solid #FDE68A" }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#92400E", marginBottom: 4 }}>Div 7A Complying Loan Requirements</div>
                        <div style={{ fontSize: 9, color: "#92400E", lineHeight: 1.6 }}>
                          • Written loan agreement before company tax return lodgement<br/>
                          • Interest at ATO benchmark rate (currently ~8.27%)<br/>
                          • Minimum annual repayments (principal + interest)<br/>
                          • Maximum term: 7 years unsecured / 25 years secured against real property<br/>
                          • Non-compliance → outstanding balance deemed as unfranked dividend
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontStyle: "italic", padding: "8px 10px", background: "var(--ps-surface-alt)", borderRadius: 6, lineHeight: 1.5 }}>
                        Creates a Div 7A complying loan (debt type 60). Company cash → shareholder. Minimum annual repayments auto-calculated. Interest expense deductible for borrower if funds used for income-producing purpose. Interest income assessable to the company.
                      </div>
                    </div>
                  );
                })()}
                {/* ═══ STRATEGY 194: Capital Injection / Share Capital ═══ */}
                {editingStrat.strategy_id === "194" && (() => {
                  const currentFY = new Date().getFullYear();
                  const STRAT_YRS = Array.from({ length: 20 }, (_, i) => ({ value: String(currentFY + i), label: `FY${String(currentFY + i).slice(-2)}` }));
                  const companies = factFind.companies || [];
                  const coOptions = [{ value: "", label: "Select company..." }, ...companies.map((c, i) => ({ value: String(i), label: c.company_name || `Company ${i + 1}` }))];
                  const c1Name = ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim();
                  const c2Name = ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim();
                  const investorOptions = [{ value: "", label: "Select investor..." }];
                  if (c1Name) investorOptions.push({ value: "client1", label: c1Name });
                  if (c2Name) investorOptions.push({ value: "client2", label: c2Name });
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Company" value={editingStrat.company_idx || ""} onChange={v => updateStrat(editingStrat.id, "company_idx", v)} options={coOptions} />
                      <FFSelect label="Investor / shareholder" value={editingStrat.investor || ""} onChange={v => updateStrat(editingStrat.id, "investor", v)} options={investorOptions} />
                      <FFInput label="Capital amount" value={editingStrat.amount || ""} onChange={v => updateStrat(editingStrat.id, "amount", v)} type="number" prefix="$" />
                      <FFSelect label="Injection year" value={editingStrat.start_year || String(currentFY + 1)} onChange={v => updateStrat(editingStrat.id, "start_year", v)} options={STRAT_YRS} />
                      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginRight: 6 }}>Timing</div>
                        {togglePill("Start of Year", editingStrat.timing !== "EOY", () => updateStrat(editingStrat.id, "timing", "SOY"))}
                        {togglePill("End of Year", editingStrat.timing === "EOY", () => updateStrat(editingStrat.id, "timing", "EOY"))}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontStyle: "italic", padding: "8px 10px", background: "var(--ps-surface-alt)", borderRadius: 6, lineHeight: 1.5 }}>
                        Shareholder injects capital into the company as share capital. Increases the company's equity (share capital). No tax event — not income to the company. Can be returned later as a tax-free capital return on wind-up (strategy 131).
                      </div>
                    </div>
                  );
                })()}
                {/* ═══ STRATEGY 51: Cash Injection to Trust ═══ */}
                {editingStrat.strategy_id === "51" && (() => {
                  const currentFY = new Date().getFullYear();
                  const STRAT_YRS = Array.from({ length: 20 }, (_, i) => ({ value: String(currentFY + i), label: `FY${String(currentFY + i).slice(-2)}` }));
                  const trusts = factFind.trusts || [];
                  const trustOptions = [{ value: "", label: "Select trust..." }, ...trusts.map((t, i) => ({ value: String(i), label: t.trust_name || `Trust ${i + 1}` }))];
                  const c1Name = ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim();
                  const c2Name = ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim();
                  const sourceOptions = [{ value: "", label: "Select source..." }];
                  if (c1Name) sourceOptions.push({ value: "client1", label: c1Name });
                  if (c2Name) sourceOptions.push({ value: "client2", label: c2Name });
                  (factFind.companies || []).forEach((c, i) => sourceOptions.push({ value: `company_${i}`, label: c.company_name || `Company ${i + 1}` }));
                  (factFind.trusts || []).forEach((t, i) => sourceOptions.push({ value: `trust_${i}`, label: t.trust_name || `Trust ${i + 1}` }));
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Destination trust" value={editingStrat.trust_idx || ""} onChange={v => updateStrat(editingStrat.id, "trust_idx", v)} options={trustOptions} />
                      <FFSelect label="Source (who is injecting cash)" value={editingStrat.contributor || ""} onChange={v => updateStrat(editingStrat.id, "contributor", v)} options={sourceOptions} />
                      <FFInput label="Amount per year" value={editingStrat.amount || ""} onChange={v => updateStrat(editingStrat.id, "amount", v)} type="number" prefix="$" />
                      <div style={ffRowStyle}>
                        <FFSelect label="Start year" value={editingStrat.start_year || String(currentFY + 1)} onChange={v => updateStrat(editingStrat.id, "start_year", v)} options={STRAT_YRS} />
                        <FFSelect label="End year" value={editingStrat.end_year || ""} onChange={v => updateStrat(editingStrat.id, "end_year", v)} options={[{ value: "", label: "One-off" }, ...STRAT_YRS]} />
                      </div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginRight: 6 }}>Timing</div>
                        {togglePill("Start of Year", editingStrat.timing !== "EOY", () => updateStrat(editingStrat.id, "timing", "SOY"))}
                        {togglePill("End of Year", editingStrat.timing === "EOY", () => updateStrat(editingStrat.id, "timing", "EOY"))}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontStyle: "italic", padding: "8px 10px", background: "var(--ps-surface-alt)", borderRadius: 6, lineHeight: 1.5 }}>
                        Cash injection into trust from a principal, company, or another trust. Cash leaves the source entity and enters the trust's cashflow. Not a distribution — simply a cash movement.
                      </div>
                    </div>
                  );
                })()}
                {/* ═══ STRATEGY 195: Trust Distribution Payout Rate ═══ */}
                {editingStrat.strategy_id === "195" && (() => {
                  const currentFY = new Date().getFullYear();
                  const STRAT_YRS = Array.from({ length: 20 }, (_, i) => ({ value: String(currentFY + i), label: `FY${String(currentFY + i).slice(-2)}` }));
                  const trusts = factFind.trusts || [];
                  const trustOptions = [{ value: "", label: "Select trust..." }, ...trusts.map((t, i) => ({ value: String(i), label: t.trust_name || `Trust ${i + 1}` }))];
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Trust" value={editingStrat.trust_idx || ""} onChange={v => updateStrat(editingStrat.id, "trust_idx", v)} options={trustOptions} />
                      <FFInput label="Distribution payout rate %" value={editingStrat.payout_pct || "0"} onChange={v => updateStrat(editingStrat.id, "payout_pct", v)} type="number" suffix="%" placeholder="0" />
                      <div style={ffRowStyle}>
                        <FFSelect label="Effective from" value={editingStrat.start_year || String(currentFY)} onChange={v => updateStrat(editingStrat.id, "start_year", v)} options={STRAT_YRS} />
                        <FFSelect label="Until" value={editingStrat.end_year || ""} onChange={v => updateStrat(editingStrat.id, "end_year", v)} options={[{ value: "", label: "Ongoing" }, ...STRAT_YRS]} />
                      </div>
                      <div style={{ padding: "8px 10px", borderRadius: 6, background: "#EFF6FF", border: "1px solid #93C5FD", fontSize: 10, color: "#1E40AF", lineHeight: 1.5 }}>
                        <strong>Default:</strong> 0% — trust income is allocated to beneficiaries for tax but cash stays in the trust. Set a payout rate to move cash from the trust to beneficiaries. E.g. 80% pays out 80% of distributable income as cash.
                      </div>
                      <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontStyle: "italic", padding: "8px 10px", background: "var(--ps-surface-alt)", borderRadius: 6, lineHeight: 1.5 }}>
                        Controls what % of trust income is actually paid out as cash to beneficiaries (pro-rata to their distribution %). The tax allocation to beneficiaries is unchanged — this only affects the cash movement.
                      </div>
                    </div>
                  );
                })()}
                {/* ═══ STRATEGY 196: Take Drawings from Trust ═══ */}
                {editingStrat.strategy_id === "196" && (() => {
                  const currentFY = new Date().getFullYear();
                  const STRAT_YRS = Array.from({ length: 20 }, (_, i) => ({ value: String(currentFY + i), label: `FY${String(currentFY + i).slice(-2)}` }));
                  const trusts = factFind.trusts || [];
                  const trustOptions = [{ value: "", label: "Select trust..." }, ...trusts.map((t, i) => ({ value: String(i), label: t.trust_name || `Trust ${i + 1}` }))];
                  const c1Name = ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim();
                  const c2Name = ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim();
                  const recipOptions = [{ value: "", label: "Select recipient..." }];
                  if (c1Name) recipOptions.push({ value: "client1", label: c1Name });
                  if (c2Name) recipOptions.push({ value: "client2", label: c2Name });
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Trust" value={editingStrat.trust_idx || ""} onChange={v => updateStrat(editingStrat.id, "trust_idx", v)} options={trustOptions} />
                      <FFSelect label="Recipient" value={editingStrat.recipient || ""} onChange={v => updateStrat(editingStrat.id, "recipient", v)} options={recipOptions} />
                      <FFInput label="Annual drawing amount" value={editingStrat.amount || ""} onChange={v => updateStrat(editingStrat.id, "amount", v)} type="number" prefix="$" />
                      <div style={ffRowStyle}>
                        <FFSelect label="Start year" value={editingStrat.start_year || String(currentFY + 1)} onChange={v => updateStrat(editingStrat.id, "start_year", v)} options={STRAT_YRS} />
                        <FFSelect label="End year" value={editingStrat.end_year || ""} onChange={v => updateStrat(editingStrat.id, "end_year", v)} options={[{ value: "", label: "Ongoing" }, ...STRAT_YRS]} />
                      </div>
                      <FFInput label="Growth rate %" value={editingStrat.growth_rate || "0"} onChange={v => updateStrat(editingStrat.id, "growth_rate", v)} type="number" suffix="%" />
                      <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontStyle: "italic", padding: "8px 10px", background: "var(--ps-surface-alt)", borderRadius: 6, lineHeight: 1.5 }}>
                        Drawings taken from the trust as cash. This is a cash movement only — not a taxable event. The beneficiary draws against their distribution entitlement. Cash leaves the trust and enters the recipient's personal savings.
                      </div>
                    </div>
                  );
                })()}
                {/* ═══ STRATEGY 198: Wind Up Trust ═══ */}
                {editingStrat.strategy_id === "198" && (() => {
                  const currentFY = new Date().getFullYear();
                  const STRAT_YRS = Array.from({ length: 20 }, (_, i) => ({ value: String(currentFY + i), label: `FY${String(currentFY + i).slice(-2)}` }));
                  const trusts = factFind.trusts || [];
                  const trustOptions = [{ value: "", label: "Select trust..." }, ...trusts.map((t, i) => ({ value: String(i), label: t.trust_name || `Trust ${i + 1}` }))];
                  const selTrustIdx = parseInt(editingStrat.trust_idx);
                  const selTrust = trusts[selTrustIdx];
                  const trustAssets = selTrust ? (factFind.assets || []).filter(a => a.a_owner === `trust_${selTrustIdx}`) : [];
                  const trustDebts = selTrust ? (factFind.liabilities || []).filter(d => d.d_owner === `trust_${selTrustIdx}`) : [];
                  const totalAssetVal = trustAssets.reduce((s, a) => s + (parseFloat(a.a_value) || 0), 0);
                  const totalDebtVal = trustDebts.reduce((s, d) => s + (parseFloat(d.d_balance) || 0), 0);
                  const benefs = selTrust?.beneficiaries || [];

                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Trust to wind up" value={editingStrat.trust_idx || ""} onChange={v => updateStrat(editingStrat.id, "trust_idx", v)} options={trustOptions} />
                      <FFSelect label="Wind-up year" value={editingStrat.windup_year || String(currentFY + 1)} onChange={v => updateStrat(editingStrat.id, "windup_year", v)} options={STRAT_YRS} />
                      <FFInput label="Wind-up costs" value={editingStrat.windup_costs || "2000"} onChange={v => updateStrat(editingStrat.id, "windup_costs", v)} type="number" prefix="$" placeholder="Legal, accounting" />

                      {selTrust && (
                        <>
                          <div style={{ padding: "10px 12px", borderRadius: 6, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border-light)" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ps-text-secondary)", marginBottom: 6 }}>Trust Summary</div>
                            <div style={{ fontSize: 10, color: "var(--ps-text-muted)", lineHeight: 1.8 }}>
                              Assets: <strong>{trustAssets.length}</strong> (${totalAssetVal.toLocaleString()})<br/>
                              Liabilities: <strong>{trustDebts.length}</strong> (${Math.abs(totalDebtVal).toLocaleString()})<br/>
                              Estimated net: <strong>${(totalAssetVal - Math.abs(totalDebtVal)).toLocaleString()}</strong>
                            </div>
                          </div>

                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ps-text-secondary)", borderBottom: "1px solid var(--ps-border-light)", paddingBottom: 4 }}>Beneficiary Distribution</div>
                          {benefs.length > 0 ? (
                            <div style={{ fontSize: 10, color: "var(--ps-text-muted)", lineHeight: 1.8 }}>
                              {benefs.map((b, i) => (
                                <div key={i}>{b.beneficiary_name || "Unknown"} — <strong>{b.dist_pct || 0}%</strong></div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontStyle: "italic" }}>No beneficiaries configured — add in the Trust tab.</div>
                          )}
                        </>
                      )}

                      <div style={{ padding: "8px 10px", borderRadius: 6, background: "#FEF3C7", border: "1px solid #FDE68A" }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#92400E", marginBottom: 4 }}>Wind-Up Process</div>
                        <div style={{ fontSize: 9, color: "#92400E", lineHeight: 1.6 }}>
                          1. All trust assets realised (CGT event for each asset)<br/>
                          2. Outstanding liabilities settled<br/>
                          3. Wind-up costs deducted<br/>
                          4. Net distributable amount paid to beneficiaries pro-rata<br/>
                          5. Trust ceases — all values zero from wind-up year onwards
                        </div>
                      </div>

                      <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontStyle: "italic", padding: "8px 10px", background: "var(--ps-surface-alt)", borderRadius: 6, lineHeight: 1.5 }}>
                        Wind up and distribute trust assets. All assets are deemed sold at market value (CGT events triggered). Remaining cash after settling liabilities and costs is distributed to beneficiaries based on their distribution percentage.
                      </div>
                    </div>
                  );
                })()}
                {/* ═══ STRATEGY 263: Transfer Asset to Related Party ═══ */}
                {editingStrat.strategy_id === "263" && (() => {
                  const currentFY = new Date().getFullYear();
                  const STRAT_YRS = Array.from({ length: 20 }, (_, i) => ({ value: String(currentFY + i), label: `FY${String(currentFY + i).slice(-2)}` }));
                  const allAssets = factFind.assets || [];
                  const typeLabels = { "12": "AU Shares", "13": "Intl Shares", "18": "Inv. Property", "19": "PR Absent", "20": "Holiday Home", "21": "Commercial Property", "26": "Managed Funds", "42": "Investment Other", "10": "Cash", "11": "Term Deposit", "14": "Crypto", "15": "Collectibles", "50": "Primary Residence" };
                  const getOwnerLabel = (a) => {
                    if (a.a_owner === "client1") return factFind.client1?.first_name || "Client 1";
                    if (a.a_owner === "client2") return factFind.client2?.first_name || "Client 2";
                    if (a.a_owner === "joint") return "Joint";
                    if (a.a_owner?.startsWith("trust_")) { const ti = parseInt(a.a_owner.replace("trust_", "")); return (factFind.trusts || [])[ti]?.trust_name || `Trust ${ti + 1}`; }
                    if (a.a_owner?.startsWith("company_")) { const ci = parseInt(a.a_owner.replace("company_", "")); return (factFind.companies || [])[ci]?.company_name || `Company ${ci + 1}`; }
                    return a.a_owner || "Unknown";
                  };
                  const assetOptions = [{ value: "", label: "Select asset..." }, ...allAssets.map((a, i) => ({
                    value: String(i), label: `${a.a_name || "Asset"} (${typeLabels[a.a_type] || a.a_type}) — ${getOwnerLabel(a)} — $${Number(a.a_value || 0).toLocaleString()}`
                  }))];
                  // Receiving party options
                  const c1Name = ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim();
                  const c2Name = ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim();
                  const receiverOptions = [{ value: "", label: "Select receiving party..." }];
                  if (c1Name) receiverOptions.push({ value: "client1", label: c1Name });
                  if (c2Name) receiverOptions.push({ value: "client2", label: c2Name });
                  receiverOptions.push({ value: "joint", label: "Joint" });
                  (factFind.trusts || []).forEach((t, i) => receiverOptions.push({ value: `trust_${i}`, label: t.trust_name || `Trust ${i + 1}` }));
                  (factFind.companies || []).forEach((c, i) => receiverOptions.push({ value: `company_${i}`, label: c.company_name || `Company ${i + 1}` }));
                  receiverOptions.push({ value: "other", label: "Other (child / dependant / third party)" });

                  const selectedAssetIdx = parseInt(editingStrat.asset_idx);
                  const selectedAsset = !isNaN(selectedAssetIdx) ? allAssets[selectedAssetIdx] : null;
                  const assetValue = selectedAsset ? (parseFloat(selectedAsset.a_value) || 0) : 0;
                  const isProperty = selectedAsset && ["18", "19", "20", "21", "50"].includes(selectedAsset.a_type);
                  const transferPct = parseFloat(editingStrat.transfer_pct) || 100;
                  const transferValue = editingStrat.transfer_value_override === "1" ? (parseFloat(editingStrat.transfer_value) || 0) : Math.round(assetValue * transferPct / 100);

                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Asset to transfer" value={editingStrat.asset_idx || ""}
                        onChange={v => updateStrat(editingStrat.id, "asset_idx", v)} options={assetOptions} />
                      {selectedAsset && (
                        <div style={{ padding: "8px 10px", borderRadius: 6, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border-light)" }}>
                          <div style={{ fontSize: 10, color: "var(--ps-text-muted)" }}>
                            Current owner: <strong>{getOwnerLabel(selectedAsset)}</strong> | Type: <strong>{typeLabels[selectedAsset.a_type] || selectedAsset.a_type}</strong> | Value: <strong>${assetValue.toLocaleString()}</strong>
                          </div>
                        </div>
                      )}
                      <FFSelect label="Receiving party" value={editingStrat.receiver || ""}
                        onChange={v => updateStrat(editingStrat.id, "receiver", v)} options={receiverOptions} />
                      {editingStrat.receiver === "other" && (
                        <FFInput label="Recipient name" value={editingStrat.receiver_name || ""} onChange={v => updateStrat(editingStrat.id, "receiver_name", v)} placeholder="e.g. Sarah Smith (daughter)" />
                      )}
                      <FFSelect label="Transfer year" value={editingStrat.transfer_year || String(currentFY + 1)}
                        onChange={v => updateStrat(editingStrat.id, "transfer_year", v)} options={STRAT_YRS} />
                      <FFInput label="Transfer %" value={editingStrat.transfer_pct || "100"} onChange={v => updateStrat(editingStrat.id, "transfer_pct", v)} type="number" suffix="%" placeholder="100" />
                      <div style={{ marginTop: 4 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                          {[["", "Market value"], ["1", "Override value"]].map(([v, l]) => (
                            <button key={v} onClick={() => updateStrat(editingStrat.id, "transfer_value_override", v)} style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid var(--ps-border)", background: (editingStrat.transfer_value_override || "") === v ? "#4F46E5" : "white", color: (editingStrat.transfer_value_override || "") === v ? "white" : "var(--ps-text-muted)", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{l}</button>
                          ))}
                        </div>
                        {editingStrat.transfer_value_override === "1" ? (
                          <FFInput label="Transfer value" value={editingStrat.transfer_value || ""} onChange={v => updateStrat(editingStrat.id, "transfer_value", v)} type="number" prefix="$" />
                        ) : (
                          <div style={{ fontSize: 10, color: "var(--ps-text-muted)" }}>Transfer value: <strong>${transferValue.toLocaleString()}</strong> ({transferPct}% of ${assetValue.toLocaleString()})</div>
                        )}
                      </div>
                      <FFInput label="Transaction costs %" value={editingStrat.transaction_costs_pct || "0"} onChange={v => updateStrat(editingStrat.id, "transaction_costs_pct", v)} type="number" suffix="%" placeholder="Legal fees etc." />
                      {isProperty && (
                        <FFInput label="Stamp duty %" value={editingStrat.stamp_duty_pct || "0"} onChange={v => updateStrat(editingStrat.id, "stamp_duty_pct", v)} type="number" suffix="%" placeholder="Stamp duty on property transfer" />
                      )}
                      {transferValue > 0 && (
                        <div style={{ padding: "8px 10px", borderRadius: 6, background: "#EFF6FF", border: "1px solid #93C5FD" }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#1E40AF", marginBottom: 4 }}>Transfer Summary</div>
                          <div style={{ fontSize: 10, color: "#1E40AF", lineHeight: 1.6 }}>
                            • Transfer value: <strong>${transferValue.toLocaleString()}</strong><br/>
                            • CGT event triggered for {selectedAsset ? getOwnerLabel(selectedAsset) : "transferor"} (deemed disposal at market value)<br/>
                            • Receiver's cost base = ${transferValue.toLocaleString()}<br/>
                            • No cash changes hands
                            {isProperty && parseFloat(editingStrat.stamp_duty_pct) > 0 && (<><br/>• Stamp duty: <strong>${Math.round(transferValue * parseFloat(editingStrat.stamp_duty_pct) / 100).toLocaleString()}</strong> (payable by receiver)</>)}
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", fontStyle: "italic", padding: "8px 10px", background: "var(--ps-surface-alt)", borderRadius: 6, lineHeight: 1.5 }}>
                        Transfer of asset to a related party at market value. A CGT event is triggered for the transferor — even gifts are deemed disposals at market value. No cash changes hands. The receiver acquires the asset with a cost base equal to the transfer value.
                      </div>
                    </div>
                  );
                })()}
                {/* ═══ STRATEGY 270: Adjust Work Hours ═══ */}
                {editingStrat.strategy_id === "270" && (() => {
                  const c1Name = factFind.client1?.first_name || "Client 1";
                  const c2Name = factFind.client2?.first_name || "Client 2";
                  const c1Gross = parseFloat(factFind.income?.client1?.i_gross) || 0;
                  const c2Gross = parseFloat(factFind.income?.client2?.i_gross) || 0;
                  const principal = editingStrat.owner_id || "client1";
                  const gross = principal === "client2" ? c2Gross : c1Gross;
                  const pctReduction = parseFloat(editingStrat.reduction_pct) || 0;
                  const adjustedSalary = Math.round(gross * (1 - pctReduction / 100));
                  const reduction = gross - adjustedSalary;
                  const principalOpts = [{ value: "client1", label: c1Name }];
                  if (c2Gross > 0 || factFind.client2?.first_name) principalOpts.push({ value: "client2", label: c2Name });
                  const currentFY = new Date().getFullYear();
                  const STRAT_YRS = Array.from({ length: 20 }, (_, i) => ({ value: String(currentFY + i), label: `FY${String(currentFY + i).slice(-2)}` }));
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Principal" value={principal} onChange={v => updateStrat(editingStrat.id, "owner_id", v)}
                        options={principalOpts} />
                      <FFInput label="Reduce hours by (%)" value={editingStrat.reduction_pct || ""} onChange={v => updateStrat(editingStrat.id, "reduction_pct", v)} type="number" suffix="%" />
                      <div style={{ display: "flex", gap: 10 }}>
                        <FFSelect label="Start Year" value={editingStrat.start_year || String(currentFY)} onChange={v => updateStrat(editingStrat.id, "start_year", v)} options={STRAT_YRS} />
                        <FFSelect label="End Year" value={editingStrat.end_year || "Ongoing"} onChange={v => updateStrat(editingStrat.id, "end_year", v)} options={[{ value: "Ongoing", label: "Ongoing" }, ...STRAT_YRS]} />
                      </div>
                      {/* Salary summary */}
                      <div style={{ padding: "12px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)", display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Impact Summary</div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                          <span style={{ color: "var(--ps-text-secondary)" }}>Current salary</span>
                          <span style={{ fontWeight: 600, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>${gross.toLocaleString("en-AU")}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                          <span style={{ color: "var(--ps-red)" }}>Reduction ({pctReduction}%)</span>
                          <span style={{ fontWeight: 600, color: "var(--ps-red)", fontFamily: "'JetBrains Mono', monospace" }}>-${reduction.toLocaleString("en-AU")}</span>
                        </div>
                        <div style={{ borderTop: "1px solid var(--ps-border)", paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                          <span style={{ fontWeight: 700, color: "var(--ps-text-primary)" }}>Adjusted salary</span>
                          <span style={{ fontWeight: 700, color: "var(--ps-green)", fontFamily: "'JetBrains Mono', monospace" }}>${adjustedSalary.toLocaleString("en-AU")}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {/* ═══ STRATEGY 271: Create a Savings Buffer ═══ */}
                {editingStrat.strategy_id === "271" && (() => {
                  const c1Name = factFind.client1?.first_name || "Client 1";
                  const c2Name = factFind.client2?.first_name || "Client 2";
                  const c1Gross = parseFloat(factFind.income?.client1?.i_gross) || 0;
                  const c2Gross = parseFloat(factFind.income?.client2?.i_gross) || 0;
                  const totalSalary = c1Gross + c2Gross;
                  const lifestyleExp = parseFloat(factFind.income?.client1?.i_lifestyle_expenses || factFind.expenses?.total) || 0;
                  const basisType = editingStrat.buffer_basis || "salary";
                  const basisPct = parseFloat(editingStrat.buffer_pct) || 10;
                  const basisAmt = basisType === "salary" ? totalSalary : lifestyleExp;
                  const targetBuffer = editingStrat.buffer_amount_override ? (parseFloat(editingStrat.buffer_amount_override) || 0) : Math.round(basisAmt * basisPct / 100);
                  const rampYears = parseInt(editingStrat.ramp_years) || 1;
                  const annualContrib = rampYears > 0 ? Math.round(targetBuffer / rampYears) : targetBuffer;
                  // Existing savings accounts
                  const savingsAccounts = (factFind.assets || []).map((a, i) => ({ ...a, idx: i })).filter(a => a.a_type === "8");
                  const acctOpts = [
                    { value: "new", label: "➕ Create new account" },
                    ...savingsAccounts.map(a => ({ value: String(a.idx), label: a.a_name || `Savings Account ${a.idx + 1}` })),
                  ];
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Buffer account" value={editingStrat.buffer_account || (savingsAccounts.length > 0 ? String(savingsAccounts[0].idx) : "new")}
                        onChange={v => updateStrat(editingStrat.id, "buffer_account", v)} options={acctOpts} />
                      {(editingStrat.buffer_account === "new" || (!editingStrat.buffer_account && savingsAccounts.length === 0)) && (
                        <FFInput label="Account name" value={editingStrat.new_account_name || ""} onChange={v => updateStrat(editingStrat.id, "new_account_name", v)} placeholder="e.g. Emergency Fund" />
                      )}
                      <FFSelect label="Buffer based on" value={basisType} onChange={v => updateStrat(editingStrat.id, "buffer_basis", v)}
                        options={[{ value: "salary", label: `Combined salary ($${totalSalary.toLocaleString("en-AU")})` }, { value: "lifestyle", label: `Lifestyle expenses ($${lifestyleExp.toLocaleString("en-AU")})` }, { value: "custom", label: "Custom amount" }]} />
                      {basisType !== "custom" && (
                        <FFInput label="Buffer %" value={editingStrat.buffer_pct || ""} onChange={v => updateStrat(editingStrat.id, "buffer_pct", v)} type="number" suffix="%" />
                      )}
                      {basisType === "custom" && (
                        <FFInput label="Target buffer amount ($)" value={editingStrat.buffer_amount_override || ""} onChange={v => updateStrat(editingStrat.id, "buffer_amount_override", v)} type="number" prefix="$" />
                      )}
                      <FFSelect label="Reach target within" value={String(rampYears)}
                        onChange={v => updateStrat(editingStrat.id, "ramp_years", v)}
                        options={[{ value: "1", label: "1 year" }, { value: "2", label: "2 years" }, { value: "3", label: "3 years" }, { value: "4", label: "4 years" }, { value: "5", label: "5 years" }]} />
                      {/* Impact summary */}
                      {(() => {
                        const selAcct = editingStrat.buffer_account || (savingsAccounts.length > 0 ? String(savingsAccounts[0].idx) : "new");
                        const existingBal = (selAcct && selAcct !== "new") ? (parseFloat((factFind.assets || [])[parseInt(selAcct)]?.a_value) || 0) : 0;
                        const shortfall = Math.max(0, targetBuffer - existingBal);
                        const adjAnnual = shortfall > 0 ? Math.round(shortfall / rampYears) : 0;
                        const alreadyMet = shortfall <= 0;
                        return (
                          <div style={{ padding: "12px 14px", borderRadius: 8, background: alreadyMet ? "var(--ps-surface-green)" : "var(--ps-surface-alt)", border: `1px solid ${alreadyMet ? "var(--ps-green)" : "var(--ps-border)"}`, display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Buffer Plan</div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                              <span style={{ color: "var(--ps-text-secondary)" }}>Target buffer</span>
                              <span style={{ fontWeight: 600, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>${targetBuffer.toLocaleString("en-AU")}</span>
                            </div>
                            {existingBal > 0 && (
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                                <span style={{ color: "var(--ps-text-secondary)" }}>Existing balance</span>
                                <span style={{ fontWeight: 600, color: "var(--ps-green)", fontFamily: "'JetBrains Mono', monospace" }}>${existingBal.toLocaleString("en-AU")}</span>
                              </div>
                            )}
                            {!alreadyMet && (
                              <>
                                {existingBal > 0 && (
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                                    <span style={{ color: "#7C3AED" }}>Shortfall to fund</span>
                                    <span style={{ fontWeight: 600, color: "#7C3AED", fontFamily: "'JetBrains Mono', monospace" }}>${shortfall.toLocaleString("en-AU")}</span>
                                  </div>
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                                  <span style={{ color: "var(--ps-text-secondary)" }}>Annual contribution</span>
                                  <span style={{ fontWeight: 600, color: "#7C3AED", fontFamily: "'JetBrains Mono', monospace" }}>${adjAnnual.toLocaleString("en-AU")}/yr × {rampYears}yr</span>
                                </div>
                                <div style={{ borderTop: "1px solid var(--ps-border)", paddingTop: 6, fontSize: 11, color: "var(--ps-text-subtle)", fontStyle: "italic" }}>
                                  ${adjAnnual.toLocaleString("en-AU")} will be diverted from savings each year for {rampYears} year{rampYears > 1 ? "s" : ""}.
                                </div>
                              </>
                            )}
                            {alreadyMet && (
                              <div style={{ borderTop: "1px solid var(--ps-green)", paddingTop: 6, fontSize: 12, color: "var(--ps-green)", fontWeight: 600 }}>
                                ✅ Buffer already met — existing balance of ${existingBal.toLocaleString("en-AU")} covers the ${targetBuffer.toLocaleString("en-AU")} target.
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
                {/* ═══ STRATEGY 83: Adjust Expense Item ═══ */}
                {editingStrat.strategy_id === "83" && (() => {
                  const currentFY = new Date().getFullYear();
                  const STRAT_YRS = Array.from({ length: 20 }, (_, i) => ({ value: String(currentFY + i), label: `FY${String(currentFY + i).slice(-2)}` }));
                  const expTypes = [
                    { value: "", label: "Select..." },
                    { value: "1", label: "Home & Contents" },
                    { value: "2", label: "Personal & Medical" },
                    { value: "3", label: "Transport & Auto" },
                    { value: "4", label: "Entertainment" },
                    { value: "5", label: "Insurance" },
                    { value: "6", label: "Debt Servicing" },
                    { value: "7", label: "Education" },
                    { value: "8", label: "Childcare" },
                    { value: "9", label: "Other" },
                  ];
                  const typeLabel = expTypes.find(t => t.value === editingStrat.adj_type)?.label || "—";
                  const amt = parseFloat(editingStrat.adj_amount) || 0;
                  const dir = editingStrat.adj_direction || "increase";
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Expense Category" value={editingStrat.adj_type || ""} onChange={v => updateStrat(editingStrat.id, "adj_type", v)} options={expTypes} />
                      <FFInput label="Description" value={editingStrat.adj_description || ""} onChange={v => updateStrat(editingStrat.id, "adj_description", v)} placeholder="e.g. School fees for Year 7" />
                      <FFSelect label="Direction" value={dir} onChange={v => updateStrat(editingStrat.id, "adj_direction", v)}
                        options={[{ value: "increase", label: "↑ Increase expense" }, { value: "decrease", label: "↓ Decrease expense" }]} />
                      <FFInput label="Amount ($/year)" value={editingStrat.adj_amount || ""} onChange={v => updateStrat(editingStrat.id, "adj_amount", v)} type="number" prefix="$" />
                      <div style={{ display: "flex", gap: 10 }}>
                        <FFSelect label="Start Year" value={editingStrat.start_year || String(currentFY)} onChange={v => updateStrat(editingStrat.id, "start_year", v)} options={STRAT_YRS} />
                        <FFSelect label="End Year" value={editingStrat.end_year || "Ongoing"} onChange={v => updateStrat(editingStrat.id, "end_year", v)} options={[{ value: "Ongoing", label: "Ongoing" }, ...STRAT_YRS]} />
                      </div>
                      <FFInput label="Notes" value={editingStrat.adj_notes || ""} onChange={v => updateStrat(editingStrat.id, "adj_notes", v)} placeholder="Additional details..." />
                      {amt > 0 && (
                        <div style={{ padding: "10px 14px", borderRadius: 8, background: dir === "increase" ? "var(--ps-surface-red)" : "var(--ps-surface-green)", border: `1px solid ${dir === "increase" ? "var(--ps-red)" : "var(--ps-green)"}`, fontSize: 12, fontWeight: 600, color: dir === "increase" ? "var(--ps-red)" : "var(--ps-green)" }}>
                          {dir === "increase" ? "↑" : "↓"} {typeLabel}: {dir === "increase" ? "+" : "-"}${amt.toLocaleString("en-AU")}/yr
                        </div>
                      )}
                    </div>
                  );
                })()}
                {/* ═══ STRATEGY 272: Adjust Income Item ═══ */}
                {editingStrat.strategy_id === "272" && (() => {
                  const c1Name = factFind.client1?.first_name || "Client 1";
                  const c2Name = factFind.client2?.first_name || "Client 2";
                  const currentFY = new Date().getFullYear();
                  const STRAT_YRS = Array.from({ length: 20 }, (_, i) => ({ value: String(currentFY + i), label: `FY${String(currentFY + i).slice(-2)}` }));
                  const incTypes = [
                    { value: "", label: "Select..." },
                    { value: "1", label: "Salary" },
                    { value: "2", label: "Fringe benefits" },
                    { value: "3", label: "Non-taxable income" },
                    { value: "4", label: "Bonus income" },
                    { value: "5", label: "Inheritance / windfall" },
                    { value: "1000", label: "Business turnover" },
                    { value: "6", label: "Rental income" },
                    { value: "7", label: "Other taxable income" },
                  ];
                  const principalOpts = [{ value: "client1", label: c1Name }];
                  if (factFind.client2?.first_name) principalOpts.push({ value: "client2", label: c2Name });
                  principalOpts.push({ value: "joint", label: "Joint / Household" });
                  const typeLabel = incTypes.find(t => t.value === editingStrat.adj_type)?.label || "—";
                  const amt = parseFloat(editingStrat.adj_amount) || 0;
                  const dir = editingStrat.adj_direction || "increase";
                  const isTaxable = editingStrat.adj_type !== "3"; // non-taxable = type 3
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Principal" value={editingStrat.owner_id || "client1"} onChange={v => updateStrat(editingStrat.id, "owner_id", v)} options={principalOpts} />
                      <FFSelect label="Income Type" value={editingStrat.adj_type || ""} onChange={v => updateStrat(editingStrat.id, "adj_type", v)} options={incTypes} />
                      <FFInput label="Description" value={editingStrat.adj_description || ""} onChange={v => updateStrat(editingStrat.id, "adj_description", v)} placeholder="e.g. Part-time consulting" />
                      <FFSelect label="Direction" value={dir} onChange={v => updateStrat(editingStrat.id, "adj_direction", v)}
                        options={[{ value: "increase", label: "↑ Increase income" }, { value: "decrease", label: "↓ Decrease income" }]} />
                      <FFInput label="Amount ($/year)" value={editingStrat.adj_amount || ""} onChange={v => updateStrat(editingStrat.id, "adj_amount", v)} type="number" prefix="$" />
                      <div style={{ display: "flex", gap: 10 }}>
                        <FFSelect label="Start Year" value={editingStrat.start_year || String(currentFY)} onChange={v => updateStrat(editingStrat.id, "start_year", v)} options={STRAT_YRS} />
                        <FFSelect label="End Year" value={editingStrat.end_year || "Ongoing"} onChange={v => updateStrat(editingStrat.id, "end_year", v)} options={[{ value: "Ongoing", label: "Ongoing" }, ...STRAT_YRS]} />
                      </div>
                      <FFInput label="Notes" value={editingStrat.adj_notes || ""} onChange={v => updateStrat(editingStrat.id, "adj_notes", v)} placeholder="Additional details..." />
                      {amt > 0 && (
                        <div style={{ padding: "10px 14px", borderRadius: 8, background: dir === "increase" ? "var(--ps-surface-green)" : "var(--ps-surface-red)", border: `1px solid ${dir === "increase" ? "var(--ps-green)" : "var(--ps-red)"}`, fontSize: 12, display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontWeight: 600, color: dir === "increase" ? "var(--ps-green)" : "var(--ps-red)" }}>
                            {dir === "increase" ? "↑" : "↓"} {typeLabel}: {dir === "increase" ? "+" : "-"}${amt.toLocaleString("en-AU")}/yr
                          </span>
                          <span style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>{isTaxable ? "Taxable — flows to tax return" : "Non-taxable — cashflow only"}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
                {editingStrat.strategy_id === "17" && (() => {
                  const bondList = (factFind.investmentBonds || []).map((b, i) => ({
                    value: String(i), label: b.product_name || `Bond ${i + 1}`
                  }));
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Investment Bond" value={editingStrat.bond_idx || "0"} onChange={v => updateStrat(editingStrat.id, "bond_idx", v)}
                        options={bondList.length > 0 ? bondList : [{ value: "0", label: "No bonds in fact find" }]} />
                      <FFSelect label="Timing" value={editingStrat.timing || "SOY"}
                        onChange={v => updateStrat(editingStrat.id, "timing", v)}
                        options={[{ value: "SOY", label: "Start of Year" }, { value: "EOY", label: "End of Year" }]} />
                      <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", fontStyle: "italic", padding: "6px 8px", background: "var(--ps-surface-alt)", borderRadius: 6 }}>
                        ⚠️ 125% rule: Annual contributions must not exceed 125% of the prior year's contribution or the 10-year tax-free period resets.
                      </div>
                    </div>
                  );
                })()}
                {editingStrat.strategy_id === "177" && (() => {
                  const c1Name = factFind.client1?.first_name || "Client 1";
                  const c2Name = factFind.client2?.first_name || "Client 2";
                  const productList = [];
                  (factFind.investmentBonds || []).forEach((b, i) => {
                    const owner = b.owner === "client1" ? c1Name : b.owner === "client2" ? c2Name : "Joint";
                    productList.push({ value: `bond_${i}`, label: `${b.product_name || `Bond ${i + 1}`} — ${owner}`, type: "Bond" });
                  });
                  (factFind.wraps || []).forEach((w, i) => {
                    const owner = w.owner === "client1" ? c1Name : w.owner === "client2" ? c2Name : "Joint";
                    productList.push({ value: `wrap_${i}`, label: `${w.platform_name || `Wrap ${i + 1}`} — ${owner}`, type: "Wrap" });
                  });
                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Investment Product" value={editingStrat.product_ref || (productList[0]?.value || "")}
                        onChange={v => {
                          updateStrat(editingStrat.id, "product_ref", v);
                          const isBond = v.startsWith("bond_");
                          updateStrat(editingStrat.id, "bond_idx", isBond ? v.replace("bond_", "") : "");
                          updateStrat(editingStrat.id, "wrap_idx", !isBond ? v.replace("wrap_", "") : "");
                        }}
                        options={productList.length > 0 ? productList : [{ value: "", label: "No investment products" }]} />
                      <FFSelect label="Timing" value={editingStrat.timing || "SOY"}
                        onChange={v => updateStrat(editingStrat.id, "timing", v)}
                        options={[{ value: "SOY", label: "Start of Year" }, { value: "EOY", label: "End of Year" }]} />
                    </div>
                  );
                })()}
                {(editingStrat.strategy_id === "118" || editingStrat.strategy_id === "119" || editingStrat.strategy_id === "120") && (() => {
                  const c1Name = factFind.client1?.first_name || "Client 1";
                  const c2Name = factFind.client2?.first_name || "Client 2";
                  const dbList = factFind.definedBenefits || [];
                  const dbSchemes = dbList.map((db, i) => {
                    const sn = db.scheme === "pss" ? "PSS" : db.scheme === "css" ? "CSS" : (db.other_scheme_name || `DB ${i + 1}`);
                    const ow = db.owner === "client1" ? c1Name : c2Name;
                    return { value: String(i), label: `${sn} — ${ow}` };
                  });
                  const benefitType = editingStrat.strategy_id === "118" ? "lump_sum" : editingStrat.strategy_id === "119" ? "pension" : "combination";
                  const useManual = editingStrat.db_use_manual === "yes";
                  const selIdx = parseInt(editingStrat.db_scheme_idx) || 0;
                  const selDB = dbList[selIdx];

                  return (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <FFSelect label="Defined Benefit Scheme" value={editingStrat.db_scheme_idx || "0"} onChange={v => updateStrat(editingStrat.id, "db_scheme_idx", v)}
                        options={[...dbSchemes.length > 0 ? dbSchemes : [{ value: "0", label: "No DB schemes in fact find" }]]} />

                      {benefitType === "combination" && (
                        <FFInput label="Lump Sum %" value={editingStrat.db_lump_pct || ""} onChange={v => updateStrat(editingStrat.id, "db_lump_pct", v)} type="number" placeholder="e.g. 30" suffix="%" />
                      )}

                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <button onClick={() => updateStrat(editingStrat.id, "db_use_manual", useManual ? "no" : "yes")}
                          style={{ flex: 1, padding: "8px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                            background: !useManual ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: !useManual ? "#6366f1" : "var(--ps-text-muted)",
                            border: !useManual ? "1px solid #6366f1" : "1px solid var(--ps-border-mid)" }}>
                          📊 Use Projected
                        </button>
                        <button onClick={() => updateStrat(editingStrat.id, "db_use_manual", useManual ? "no" : "yes")}
                          style={{ flex: 1, padding: "8px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                            background: useManual ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: useManual ? "#6366f1" : "var(--ps-text-muted)",
                            border: useManual ? "1px solid #6366f1" : "1px solid var(--ps-border-mid)" }}>
                          ✏️ Enter Final Numbers
                        </button>
                      </div>

                      {!useManual && selDB && (
                        <div style={{ background: "var(--ps-surface-alt)", borderRadius: 8, padding: 12, fontSize: 12 }}>
                          <div style={{ fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 8 }}>Using projected values from Fact Find</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", color: "var(--ps-text-muted)" }}>
                            <span>Scheme:</span><span style={{ textAlign: "right" }}>{selDB.scheme === "pss" ? "PSS" : selDB.scheme === "css" ? "CSS" : "Other"}</span>
                            <span>Super Salary:</span><span style={{ textAlign: "right", fontFamily: "monospace" }}>${(parseFloat(selDB.super_salary) || 0).toLocaleString()}</span>
                            <span>Exit Age:</span><span style={{ textAlign: "right", fontFamily: "monospace" }}>{selDB.expected_exit_age || "—"}</span>
                            <span>Fact Find Preference:</span><span style={{ textAlign: "right" }}>{selDB.benefit_preference === "pension" ? "Pension" : selDB.benefit_preference === "lump_sum" ? "Lump Sum" : selDB.benefit_preference === "combination" ? `Combination (${selDB.combination_lump_pct || 0}% lump)` : "—"}</span>
                          </div>
                        </div>
                      )}

                      {useManual && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase" }}>Manual Benefit Override</div>
                          {(benefitType === "pension" || benefitType === "combination") && (
                            <FFInput label="Annual Pension Amount" value={editingStrat.db_manual_pension || ""} onChange={v => updateStrat(editingStrat.id, "db_manual_pension", v)} type="number" prefix="$" placeholder="From CSC estimate" />
                          )}
                          {(benefitType === "lump_sum" || benefitType === "combination") && (
                            <FFInput label="Lump Sum Amount" value={editingStrat.db_manual_lump || ""} onChange={v => updateStrat(editingStrat.id, "db_manual_lump", v)} type="number" prefix="$" placeholder="From CSC estimate" />
                          )}
                        </div>
                      )}

                      <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", fontStyle: "italic", marginTop: 4 }}>
                        {benefitType === "lump_sum" ? "This strategy overrides the fact find — benefit will be taken as 100% lump sum." :
                         benefitType === "pension" ? "This strategy overrides the fact find — benefit will be taken as 100% pension." :
                         "This strategy overrides the fact find — benefit will be taken as combination."}
                      </div>
                    </div>
                  );
                })()}
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Notes</div>
                  <textarea value={editingStrat.notes || ""} onChange={e => updateStrat(editingStrat.id, "notes", e.target.value)} rows={3} placeholder="Additional notes..."
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, resize: "vertical" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// ADVICE — Insurance Form (Base44-aligned: Needs Calculator + Policies)
// ===========================================================================

const INS_REC_OPTIONS = [
  { value: "", label: "— Select —" },
  { value: "Retain", label: "Retain" }, { value: "Cancel", label: "Cancel" }, { value: "Replace", label: "Replace" },
  { value: "Increase", label: "Increase" }, { value: "Decrease", label: "Decrease" }, { value: "New policy", label: "New policy" },
];
const INS_TYPE_OPTIONS = [
  { value: "", label: "— Select —" },
  { value: "Life (stand-alone)", label: "Life (stand-alone)" }, { value: "Life with Linked TPD", label: "Life with Linked TPD" },
  { value: "Life with Linked Trauma", label: "Life with Linked Trauma" }, { value: "Life with Linked TPD/Trauma", label: "Life with Linked TPD/Trauma" },
  { value: "TPD (Stand-alone)", label: "TPD (Stand-alone)" }, { value: "Trauma (Stand alone)", label: "Trauma (Stand alone)" },
  { value: "Trauma with Linked (TPD)", label: "Trauma with Linked (TPD)" }, { value: "Income protection (Stand-alone)", label: "Income Protection (Stand-alone)" },
  { value: "Life with Flexi-linked TPD", label: "Life with Flexi-linked TPD" }, { value: "Life with flexi-linked Trauma", label: "Life with Flexi-linked Trauma" },
  { value: "Super-Linked IP", label: "Super-Linked IP" },
];
const INS_STRUCTURE = [
  { value: "", label: "— Select —" }, { value: "Outside super", label: "Outside super" }, { value: "Inside super", label: "Inside super" },
  { value: "Through SMSF", label: "Through SMSF" }, { value: "Through platform / wrap", label: "Through platform / wrap" },
];
const INS_PREMIUM_TYPE = [{ value: "", label: "— Select —" }, { value: "Stepped", label: "Stepped" }, { value: "Level", label: "Level" }, { value: "Blended", label: "Blended" }];
const INS_PREMIUM_FREQ = [{ value: "", label: "— Select —" }, { value: "Annual", label: "Annual" }, { value: "Half-yearly", label: "Half-yearly" }, { value: "Quarterly", label: "Quarterly" }, { value: "Monthly", label: "Monthly" }, { value: "Fortnightly", label: "Fortnightly" }, { value: "Weekly", label: "Weekly" }];
const INS_POLICY_TYPE = [{ value: "1", label: "Inside super" }, { value: "2", label: "Outside super" }];
const INS_TPD_DEF = [{ value: "", label: "— Select —" }, { value: "Any occupation", label: "Any occupation" }, { value: "Own occupation", label: "Own occupation" }];
const INS_IP_WAIT = [{ value: "", label: "— Select —" }, { value: "14 days", label: "14 days" }, { value: "30 days", label: "30 days" }, { value: "60 days", label: "60 days" }, { value: "90 days", label: "90 days" }, { value: "180 days", label: "180 days" }];
const INS_IP_BENEFIT = [{ value: "", label: "— Select —" }, { value: "2 years", label: "2 years" }, { value: "5 years", label: "5 years" }, { value: "To age 60", label: "To age 60" }, { value: "To age 65", label: "To age 65" }];
const INS_STATUS_BADGE = { Retain: { bg: "var(--ps-surface-emerald)", color: "var(--ps-badge-green)" }, Cancel: { bg: "var(--ps-surface-red)", color: "var(--ps-badge-dark-red)" }, Replace: { bg: "var(--ps-bg-amber-200)", color: "var(--ps-badge-amber)" }, Increase: { bg: "var(--ps-surface-green)", color: "var(--ps-badge-green)" }, Decrease: { bg: "var(--ps-bg-amber-200)", color: "var(--ps-badge-amber)" }, "New policy": { bg: "var(--ps-surface-blue)", color: "var(--ps-badge-blue)" } };
const INS_INCOME_ITEMS = [
  { value: "Living expenses", label: "Living expenses" }, { value: "Education costs", label: "Education costs" },
  { value: "Mortgage repayments", label: "Mortgage repayments" }, { value: "Ongoing care costs", label: "Ongoing care costs" },
  { value: "Partner income replacement", label: "Partner income replacement" }, { value: "Other income needs", label: "Other income needs" },
];

export function getDefaultInsPersonData() {
  return {
    assumptions: { date_of_birth: "", esp_start_date: "", service_end_date: "", retirement_age: 65, tpd_inside_super: true, override_tpd_tax: false, override_uplift_pct: "", mortgage_balance: 0, other_debts: 0, annual_salary: 0, discount_rate: 0 },
    needs: { life: { pct_mortgage: 0, pct_other_debts: 0, emergency_fund: 0, medical_costs: 0, funeral_costs: 0, other_upfront: 0 }, tpd: { pct_mortgage: 0, pct_other_debts: 0, emergency_fund: 0, medical_costs: 0, home_modifications: 0, other_upfront: 0 }, trauma: { emergency_fund: 0, medical_costs: 0, home_modifications: 0, other_upfront: 0 }, ip: { pct_salary: 0, pct_super: 0 } },
    income_rows: [], asset_rows: [],
  };
}

const EMPTY_INS_POLICY = { id: "", person: "client1", owner: "", insurer: "", product_name: "", policy_number: "", insurance_type: "", structure: "", premium_type: "", premium_frequency: "", premium_amount: "", advice_status: "", include_life: false, life_sum_insured: "", life_premium: "", life_recommendation: "", include_tpd: false, tpd_definition: "", tpd_sum_insured: "", tpd_premium: "", tpd_recommendation: "", tpd_notes: "", include_trauma: false, trauma_sum_insured: "", trauma_premium: "", trauma_recommendation: "", trauma_notes: "", include_ip: false, ip_monthly_benefit: "", ip_premium: "", ip_waiting_period: "", ip_benefit_period: "", ip_recommendation: "" };

// ════════════════════════════════════════════════════════════
// ADVICE: Products & Entities Form
// ════════════════════════════════════════════════════════════

const PE_TRUST_TYPES = [
  { value: "", label: "— Select —" }, { value: "discretionary", label: "Discretionary Family Trust" },
  { value: "unit", label: "Unit Trust" }, { value: "hybrid", label: "Hybrid Trust" },
  { value: "testamentary", label: "Testamentary Trust" }, { value: "other", label: "Other" },
];
const PE_COMPANY_PURPOSE = [
  { value: "", label: "— Select —" }, { value: "operating", label: "Operating business" },
  { value: "investment", label: "Investment" }, { value: "beneficiary", label: "Beneficiary of trust" },
];
const PE_COMPANY_TYPE = [
  { value: "", label: "— Select —" }, { value: "pty_ltd", label: "Pty Ltd" },
  { value: "partnership", label: "Partnership" }, { value: "sole_trader", label: "Sole trader" },
  { value: "charity", label: "Charity" },
];
const PE_SMSF_FUND_TYPE = [{ value: "", label: "— Select —" }, { value: "SMSF", label: "SMSF" }, { value: "SAFT", label: "SAFT" }];
const PE_SMSF_TRUSTEE = [{ value: "", label: "— Select —" }, { value: "corporate", label: "Corporate trustee" }, { value: "individual", label: "Individual trustee" }];
const PE_SMSF_ACCT_TYPE = [{ value: "", label: "— Select —" }, { value: "pooled", label: "Pooled" }, { value: "segregate", label: "Segregate" }];
const PE_SMSF_TAX_ENV = [{ value: "", label: "— Select —" }, { value: "accumulation", label: "Accumulation" }, { value: "pension", label: "Pension" }];
const PE_SMSF_BENEF_TYPE = [{ value: "", label: "— Select —" }, { value: "binding", label: "Binding" }, { value: "non_binding", label: "Non-binding" }, { value: "lapsing_binding", label: "Lapsing binding" }, { value: "non_lapsing_binding", label: "Non-lapsing binding" }];
const PE_PENSION_TYPE = [{ value: "", label: "— Select —" }, { value: "account_based", label: "Account based" }, { value: "term_allocated", label: "Term allocated" }];
const PE_ANNUITY_TAX = [{ value: "", label: "— Select —" }, { value: "superannuation", label: "Superannuation" }, { value: "non_superannuation", label: "Non-superannuation" }];

export function AdviceProductsEntitiesForm({ factFind, updateFF }) {
  const [mainTab, setMainTab] = useState("entities");
  const [entityTab, setEntityTab] = useState("trust");
  const [productTab, setProductTab] = useState("superannuation");
  const [activeIdx, setActiveIdx] = useState(0);

  const pe = factFind.advice_request?.products_entities || { new_trusts: [], new_companies: [], new_smsf: [], products: {} };
  const save = (d) => updateFF("advice_request.products_entities", d);

  const trusts = pe.new_trusts || [];
  const companies = pe.new_companies || [];
  const smsfs = pe.new_smsf || [];
  const prods = pe.products || {};
  const superP = prods.superannuation || [];
  const pensionP = prods.pension || [];
  const annuityP = prods.annuity || [];
  const wrapP = prods.wrap || [];
  const bondP = prods.investment_bond || [];

  // Owner options from factFind principals
  const cn = (id) => {
    if (id === "client1") return ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim() || "Client 1";
    if (id === "client2") return ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim() || "Client 2";
    return id;
  };
  const hasPartner = factFind.client2 !== null;
  const principalOpts = [{ value: "", label: "— Select —" }, { value: "client1", label: cn("client1") }];
  if (hasPartner) principalOpts.push({ value: "client2", label: cn("client2") });

  // Broader owner options (principals + trusts + companies + smsfs from this page)
  const allOwnerOpts = [...principalOpts];
  trusts.forEach((t, i) => { if (t.trust_name) allOwnerOpts.push({ value: `trust_${i}`, label: t.trust_name }); });
  companies.forEach((c, i) => { if (c.company_name) allOwnerOpts.push({ value: `company_${i}`, label: c.company_name }); });
  smsfs.forEach((s, i) => { if (s.smsf_name) allOwnerOpts.push({ value: `smsf_${i}`, label: s.smsf_name }); });

  // Beneficiary options (principals + children/dependants + estate)
  const benefOpts = [...principalOpts];
  (factFind.dependants || []).forEach((d, i) => { if (d.name) benefOpts.push({ value: `dep_${i}`, label: d.name }); });
  benefOpts.push({ value: "estate", label: "Estate" });

  // Generic array helpers
  const uArr = (key, arr) => save({ ...pe, [key]: arr });
  const uProd = (type, arr) => save({ ...pe, products: { ...prods, [type]: arr } });

  // Pill tab helper
  const pill = (id, icon, label, active, onClick) => (
    <button onClick={onClick} style={{ padding: "10px 16px", borderRadius: 8, border: active ? "2px solid #2563EB" : "1px solid var(--ps-border)", background: active ? "var(--ps-surface-blue)" : "var(--ps-surface-alt)", color: active ? "#1E40AF" : "var(--ps-text-muted)", fontSize: 13, fontWeight: active ? 600 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>{icon} {label}</button>
  );

  // Empty state
  const empty = (icon, title, desc, onAdd, btnLabel) => (
    <div style={{ padding: "48px 24px", textAlign: "center", border: "2px dashed var(--ps-border)", borderRadius: 12 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--ps-text-subtle)", maxWidth: 400, margin: "0 auto 16px" }}>{desc}</div>
      <button onClick={onAdd} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "linear-gradient(180deg,#2563EB,#1D4ED8)", color: "var(--ps-surface)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ {btnLabel}</button>
    </div>
  );

  // Index pills for multiple items
  const idxPills = (arr, labelFn) => arr.length > 1 && (
    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
      {arr.map((_, i) => (
        <button key={i} onClick={() => setActiveIdx(i)} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: activeIdx === i ? "#2563EB" : "var(--ps-border)", color: activeIdx === i ? "var(--ps-surface)" : "var(--ps-text-muted)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{labelFn(i)}</button>
      ))}
    </div>
  );

  // Section card with colored left border
  const secCard = (color, icon, title, children) => (
    <div style={{ borderLeft: `4px solid ${color}`, background: color + "10", padding: "14px 16px", borderRadius: "0 10px 10px 0", marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-body)", marginBottom: 10 }}>{icon} {title}</div>
      {children}
    </div>
  );

  // Delete button
  const delBtn = (onClick) => (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
      <button onClick={onClick} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--ps-ring-red)", background: "var(--ps-surface-red)", color: "var(--ps-red)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✕ Remove</button>
    </div>
  );

  // ═══ ENTITY: TRUSTS ═══
  const renderTrust = (t, idx) => {
    const uT = (f, v) => { const a = [...trusts]; a[idx] = { ...a[idx], [f]: v }; uArr("new_trusts", a); };
    const uBenef = (bi, f, v) => { const a = [...trusts]; const b = [...(a[idx].beneficiaries || [])]; b[bi] = { ...b[bi], [f]: v }; a[idx] = { ...a[idx], beneficiaries: b }; uArr("new_trusts", a); };
    return (
      <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, padding: 16 }}>
        {secCard("#3B82F6", "🏛", "New Trust Details", (
          <div>
            <div style={ffRowStyle}><FFInput label="Trust name" value={t.trust_name} onChange={v => uT("trust_name", v)} placeholder="e.g., The Smith Family Trust" /><FFSelect label="Trust type" value={t.trust_type} onChange={v => uT("trust_type", v)} options={PE_TRUST_TYPES} /></div>
          </div>
        ))}
        {secCard("#F59E0B", "👤", "Trustee Beneficiaries", (
          <div>
            {(t.beneficiaries || []).map((b, bi) => (
              <div key={bi} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, padding: 8, background: "var(--ps-surface)", borderRadius: 8, border: "1px solid var(--ps-ring-amber)" }}>
                <div style={{ flex: 1 }}><FFSelect label="" value={b.benef_entity} onChange={v => uBenef(bi, "benef_entity", v)} options={benefOpts} /></div>
                <div style={{ width: 100 }}><FFInput label="" value={b.benef_entitlement} onChange={v => uBenef(bi, "benef_entitlement", v)} placeholder="e.g. 25%" /></div>
                <button onClick={() => { const a = [...trusts]; a[idx].beneficiaries = a[idx].beneficiaries.filter((_, i) => i !== bi); uArr("new_trusts", a); }} style={{ border: "none", background: "var(--ps-bg-red-200)", color: "var(--ps-red)", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>×</button>
              </div>
            ))}
            <button onClick={() => { const a = [...trusts]; if (!a[idx].beneficiaries) a[idx].beneficiaries = []; a[idx].beneficiaries.push({ benef_entity: "", benef_entitlement: "" }); uArr("new_trusts", a); }} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--ps-border-mid)", background: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 6 }}>+ Add Beneficiary</button>
          </div>
        ))}
        {delBtn(() => { uArr("new_trusts", trusts.filter((_, i) => i !== idx)); setActiveIdx(0); })}
      </div>
    );
  };

  // ═══ ENTITY: COMPANIES ═══
  const renderCompany = (c, idx) => {
    const uC = (f, v) => { const a = [...companies]; a[idx] = { ...a[idx], [f]: v }; uArr("new_companies", a); };
    const uSh = (si, f, v) => { const a = [...companies]; const s = [...(a[idx].shareholders || [])]; s[si] = { ...s[si], [f]: v }; a[idx] = { ...a[idx], shareholders: s }; uArr("new_companies", a); };
    return (
      <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, padding: 16 }}>
        {secCard("#3B82F6", "🏢", "New Company Details", (
          <div>
            <FFInput label="Company name" value={c.company_name} onChange={v => uC("company_name", v)} placeholder="e.g., Smith Investments Pty Ltd" />
            <div style={ffRowStyle}><FFSelect label="Purpose" value={c.co_purpose} onChange={v => uC("co_purpose", v)} options={PE_COMPANY_PURPOSE} /><FFSelect label="Company type" value={c.co_type} onChange={v => uC("co_type", v)} options={PE_COMPANY_TYPE} /></div>
            <div style={ffRowStyle}><FFInput label="Pre-existing losses ($)" value={c.co_losses} onChange={v => uC("co_losses", v)} type="number" prefix="$" /><FFInput label="Annual profit ($)" value={c.co_profit} onChange={v => uC("co_profit", v)} type="number" prefix="$" /></div>
          </div>
        ))}
        {secCard("#F59E0B", "👤", "Shareholders", (
          <div>
            {(c.shareholders || []).map((s, si) => (
              <div key={si} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, padding: 8, background: "var(--ps-surface)", borderRadius: 8, border: "1px solid var(--ps-ring-amber)" }}>
                <div style={{ flex: 1 }}><FFSelect label="" value={s.sh_entity} onChange={v => uSh(si, "sh_entity", v)} options={allOwnerOpts} /></div>
                <div style={{ width: 100 }}><FFInput label="" value={s.sh_pct} onChange={v => uSh(si, "sh_pct", v)} placeholder="e.g. 50%" /></div>
                <button onClick={() => { const a = [...companies]; a[idx].shareholders = a[idx].shareholders.filter((_, i) => i !== si); uArr("new_companies", a); }} style={{ border: "none", background: "var(--ps-bg-red-200)", color: "var(--ps-red)", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>×</button>
              </div>
            ))}
            <button onClick={() => { const a = [...companies]; if (!a[idx].shareholders) a[idx].shareholders = []; a[idx].shareholders.push({ sh_entity: "", sh_pct: "" }); uArr("new_companies", a); }} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--ps-border-mid)", background: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 6 }}>+ Add Shareholder</button>
          </div>
        ))}
        {delBtn(() => { uArr("new_companies", companies.filter((_, i) => i !== idx)); setActiveIdx(0); })}
      </div>
    );
  };

  // ═══ ENTITY: SMSF ═══
  const renderSMSF = (sf, idx) => {
    const uS = (f, v) => { const a = [...smsfs]; a[idx] = { ...a[idx], [f]: v }; uArr("new_smsf", a); };
    const uAcct = (ai, f, v) => { const a = [...smsfs]; const ac = [...(a[idx].accounts || [])]; ac[ai] = { ...ac[ai], [f]: v }; a[idx] = { ...a[idx], accounts: ac }; uArr("new_smsf", a); };
    const uBenef = (bi, f, v) => { const a = [...smsfs]; const b = [...(a[idx].beneficiaries || [])]; b[bi] = { ...b[bi], [f]: v }; a[idx] = { ...a[idx], beneficiaries: b }; uArr("new_smsf", a); };
    const acctLabel = (ai) => { const ac = (sf.accounts || [])[ai]; return principalOpts.find(o => o.value === ac?.owner)?.label || `Account ${ai + 1}`; };
    const acctOpts = (sf.accounts || []).map((ac, ai) => ({ value: `account_${ai}`, label: `${acctLabel(ai)} - ${ac.tax_environment || "?"}` }));
    return (
      <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, padding: 16 }}>
        {secCard("#3B82F6", "🏦", "New SMSF Details", (
          <div>
            <FFInput label="SMSF name" value={sf.smsf_name} onChange={v => uS("smsf_name", v)} placeholder="e.g., Smith Family SMSF" />
            <div style={ffRowStyle}><FFSelect label="Fund type" value={sf.fund_type} onChange={v => uS("fund_type", v)} options={PE_SMSF_FUND_TYPE} /><FFSelect label="Trustee type" value={sf.trustee_type} onChange={v => uS("trustee_type", v)} options={PE_SMSF_TRUSTEE} /></div>
            <div style={ffRowStyle}><FFSelect label="Account type" value={sf.acct_type} onChange={v => uS("acct_type", v)} options={PE_SMSF_ACCT_TYPE} /><FFInput label="SMSF balance ($)" value={sf.smsf_balance} onChange={v => uS("smsf_balance", v)} type="number" prefix="$" /></div>
            <FFInput label="Individual trustee" value={sf.individual_trustee} onChange={v => uS("individual_trustee", v)} placeholder="e.g., John Smith" />
          </div>
        ))}
        {secCard("#F59E0B", "💰", "Account Information", (
          <div>
            {(sf.accounts || []).map((ac, ai) => (
              <div key={ai} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, padding: 8, background: "var(--ps-surface)", borderRadius: 8, border: "1px solid var(--ps-ring-amber)", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 120 }}><FFSelect label="" value={ac.owner} onChange={v => uAcct(ai, "owner", v)} options={principalOpts} /></div>
                <div style={{ width: 130 }}><FFSelect label="" value={ac.tax_environment} onChange={v => uAcct(ai, "tax_environment", v)} options={PE_SMSF_TAX_ENV} /></div>
                <div style={{ width: 80 }}><FFInput label="" value={ac.fund_percentage} onChange={v => uAcct(ai, "fund_percentage", v)} type="number" suffix="%" /></div>
                <div style={{ width: 110 }}><FFInput label="" value={ac.balance} onChange={v => uAcct(ai, "balance", v)} type="number" prefix="$" /></div>
                <button onClick={() => { const a = [...smsfs]; a[idx].accounts = a[idx].accounts.filter((_, i) => i !== ai); uArr("new_smsf", a); }} style={{ border: "none", background: "var(--ps-bg-red-200)", color: "var(--ps-red)", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>×</button>
              </div>
            ))}
            <button onClick={() => { const a = [...smsfs]; if (!a[idx].accounts) a[idx].accounts = []; a[idx].accounts.push({ owner: "", tax_environment: "", fund_percentage: "", balance: "" }); uArr("new_smsf", a); }} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--ps-border-mid)", background: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 6 }}>+ Add Account</button>
          </div>
        ))}
        {(sf.accounts || []).length > 0 && secCard("#EAB308", "👤", "Beneficiaries", (
          <div>
            {(sf.beneficiaries || []).map((b, bi) => (
              <div key={bi} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, padding: 8, background: "var(--ps-surface)", borderRadius: 8, border: "1px solid var(--ps-ring-amber)", flexWrap: "wrap" }}>
                <div style={{ width: 140 }}><FFSelect label="" value={b.benef_account} onChange={v => uBenef(bi, "benef_account", v)} options={[{ value: "", label: "— Account —" }, ...acctOpts]} /></div>
                <div style={{ flex: 1, minWidth: 120 }}><FFSelect label="" value={b.benef_who} onChange={v => uBenef(bi, "benef_who", v)} options={benefOpts} /></div>
                <div style={{ width: 130 }}><FFSelect label="" value={b.benef_type} onChange={v => uBenef(bi, "benef_type", v)} options={PE_SMSF_BENEF_TYPE} /></div>
                <div style={{ width: 80 }}><FFInput label="" value={b.benef_entitlement} onChange={v => uBenef(bi, "benef_entitlement", v)} placeholder="25%" /></div>
                <button onClick={() => { const a = [...smsfs]; a[idx].beneficiaries = a[idx].beneficiaries.filter((_, i) => i !== bi); uArr("new_smsf", a); }} style={{ border: "none", background: "var(--ps-bg-red-200)", color: "var(--ps-red)", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>×</button>
              </div>
            ))}
            <button onClick={() => { const a = [...smsfs]; if (!a[idx].beneficiaries) a[idx].beneficiaries = []; a[idx].beneficiaries.push({ benef_account: "", benef_who: "", benef_type: "", benef_entitlement: "" }); uArr("new_smsf", a); }} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--ps-border-mid)", background: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 6 }}>+ Add Beneficiary</button>
          </div>
        ))}
        {delBtn(() => { uArr("new_smsf", smsfs.filter((_, i) => i !== idx)); setActiveIdx(0); })}
      </div>
    );
  };

  // ═══ PRODUCTS ═══
  const renderProduct = (type, arr, setArr, icon, title, fields) => {
    const item = arr[activeIdx];
    if (!item) return null;
    const uP = (f, v) => { const a = [...arr]; a[activeIdx] = { ...a[activeIdx], [f]: v }; uProd(type, a); };
    return (
      <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, padding: 16 }}>
        {secCard("#3B82F6", icon, title, (
          <div>
            <div style={ffRowStyle}><FFInput label="Product name" value={item.product_name} onChange={v => uP("product_name", v)} placeholder={`e.g., ${title} product`} /><FFInput label="Product provider" value={item.provider} onChange={v => uP("provider", v)} placeholder="e.g., Provider name" /></div>
            {fields(item, uP)}
          </div>
        ))}
        {delBtn(() => { const a = arr.filter((_, i) => i !== activeIdx); uProd(type, a); setActiveIdx(Math.max(0, activeIdx - 1)); })}
      </div>
    );
  };

  // Product-specific extra fields
  const superFields = (item, uP) => (
    <FFSelect label="Owner" value={item.owner} onChange={v => uP("owner", v)} options={principalOpts} />
  );
  const pensionFields = (item, uP) => (
    <div style={ffRowStyle}><FFSelect label="Owner" value={item.owner} onChange={v => uP("owner", v)} options={principalOpts} /><FFSelect label="Type of pension" value={item.pension_type} onChange={v => uP("pension_type", v)} options={PE_PENSION_TYPE} /></div>
  );
  const annuityFields = (item, uP) => (
    <div>
      <div style={ffRowStyle}><FFSelect label="Owner" value={item.owner} onChange={v => uP("owner", v)} options={principalOpts} /><FFSelect label="Tax environment" value={item.annuity_tax_env} onChange={v => uP("annuity_tax_env", v)} options={PE_ANNUITY_TAX} /></div>
      <div style={ffRowStyle}><FFInput label="Joint holder" value={item.annuity_joint} onChange={v => uP("annuity_joint", v)} placeholder="e.g., Joint with spouse" /><div style={{ flex: 1, display: "flex", alignItems: "flex-end", paddingBottom: 6 }}><label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={!!item.annuity_lifetime} onChange={e => uP("annuity_lifetime", e.target.checked)} style={{ width: 16, height: 16 }} /> Lifetime annuity</label></div></div>
      {!item.annuity_lifetime && <FFInput label="Term of annuity (years)" value={item.annuity_term} onChange={v => uP("annuity_term", v)} type="number" />}
      <div style={ffRowStyle}><FFInput label="Purchase price ($)" value={item.annuity_purchase_price} onChange={v => uP("annuity_purchase_price", v)} type="number" prefix="$" /><FFInput label="Purchase date" value={item.annuity_purchase_date} onChange={v => uP("annuity_purchase_date", v)} type="date" /></div>
      <div style={ffRowStyle}><FFInput label="Annuity income (per period $)" value={item.annuity_income} onChange={v => uP("annuity_income", v)} type="number" prefix="$" /><FFInput label="Index rate (%)" value={item.annuity_index_rate} onChange={v => uP("annuity_index_rate", v)} type="number" suffix="%" /></div>
      <div style={ffRowStyle}><FFInput label="Residual value ($)" value={item.annuity_residual_value} onChange={v => uP("annuity_residual_value", v)} type="number" prefix="$" /><FFInput label="Deductible income ($)" value={item.annuity_deductible_income} onChange={v => uP("annuity_deductible_income", v)} type="number" prefix="$" /></div>
    </div>
  );
  const wrapFields = (item, uP) => (
    <FFSelect label="Owner" value={item.owner} onChange={v => uP("owner", v)} options={allOwnerOpts} />
  );
  const bondFields = (item, uP) => (
    <FFSelect label="Owner" value={item.owner} onChange={v => uP("owner", v)} options={[...principalOpts, ...trusts.filter(t => t.trust_name).map((t, i) => ({ value: `trust_${i}`, label: t.trust_name }))]} />
  );

  // Product empty templates
  const emptySuper = { product_name: "", provider: "", owner: "" };
  const emptyPension = { product_name: "", provider: "", owner: "", pension_type: "" };
  const emptyAnnuity = { product_name: "", provider: "", owner: "", annuity_tax_env: "", annuity_joint: "", annuity_lifetime: false, annuity_term: "", annuity_purchase_price: "", annuity_purchase_date: "", annuity_income: "", annuity_index_rate: "", annuity_residual_value: "", annuity_deductible_income: "" };
  const emptyWrap = { product_name: "", provider: "", owner: "" };
  const emptyBond = { product_name: "", provider: "", owner: "" };

  const addBtn = (label, onClick) => (
    <button onClick={onClick} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "linear-gradient(180deg,#2563EB,#1D4ED8)", color: "var(--ps-surface)", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 12 }}>+ {label}</button>
  );

  return (
    <div>
      {/* Main tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {pill("entities", "📦", "Entities", mainTab === "entities", () => { setMainTab("entities"); setActiveIdx(0); })}
        {pill("products", "💰", "Products", mainTab === "products", () => { setMainTab("products"); setActiveIdx(0); })}
      </div>

      {/* ═══ ENTITIES TAB ═══ */}
      {mainTab === "entities" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {pill("trust", "🏛", "New Trusts", entityTab === "trust", () => { setEntityTab("trust"); setActiveIdx(0); })}
            {pill("company", "🏢", "New Companies", entityTab === "company", () => { setEntityTab("company"); setActiveIdx(0); })}
            {pill("smsf", "🏦", "New SMSF", entityTab === "smsf", () => { setEntityTab("smsf"); setActiveIdx(0); })}
          </div>

          {entityTab === "trust" && (trusts.length === 0
            ? empty("🏛", "Are you recommending a new trust?", "Add details about new family trusts, unit trusts, or other trust structures.", () => { uArr("new_trusts", [...trusts, { trust_name: "", trust_type: "", beneficiaries: [] }]); setActiveIdx(0); }, "Add New Trust")
            : <div>{idxPills(trusts, i => `Trust ${i + 1}`)}{renderTrust(trusts[activeIdx] || trusts[0], activeIdx)}{addBtn("Add Another Trust", () => { uArr("new_trusts", [...trusts, { trust_name: "", trust_type: "", beneficiaries: [] }]); setActiveIdx(trusts.length); })}</div>
          )}

          {entityTab === "company" && (companies.length === 0
            ? empty("🏢", "Are you recommending a new company?", "Add details about new private companies or corporate entities.", () => { uArr("new_companies", [...companies, { company_name: "", co_purpose: "", co_type: "", co_losses: "", co_profit: "", shareholders: [] }]); setActiveIdx(0); }, "Add New Company")
            : <div>{idxPills(companies, i => `Company ${i + 1}`)}{renderCompany(companies[activeIdx] || companies[0], activeIdx)}{addBtn("Add Another Company", () => { uArr("new_companies", [...companies, { company_name: "", co_purpose: "", co_type: "", co_losses: "", co_profit: "", shareholders: [] }]); setActiveIdx(companies.length); })}</div>
          )}

          {entityTab === "smsf" && (smsfs.length === 0
            ? empty("🏦", "Are you recommending a new SMSF?", "Add details about new Self-Managed Super Funds.", () => { uArr("new_smsf", [...smsfs, { smsf_name: "", fund_type: "", trustee_type: "", acct_type: "", smsf_balance: "", individual_trustee: "", accounts: [], beneficiaries: [] }]); setActiveIdx(0); }, "Add New SMSF")
            : <div>{idxPills(smsfs, i => `SMSF ${i + 1}`)}{renderSMSF(smsfs[activeIdx] || smsfs[0], activeIdx)}{addBtn("Add Another SMSF", () => { uArr("new_smsf", [...smsfs, { smsf_name: "", fund_type: "", trustee_type: "", acct_type: "", smsf_balance: "", individual_trustee: "", accounts: [], beneficiaries: [] }]); setActiveIdx(smsfs.length); })}</div>
          )}
        </div>
      )}

      {/* ═══ PRODUCTS TAB ═══ */}
      {mainTab === "products" && (
        <div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {pill("super", "🏦", "Superannuation", productTab === "superannuation", () => { setProductTab("superannuation"); setActiveIdx(0); })}
            {pill("pension", "💳", "Pension", productTab === "pension", () => { setProductTab("pension"); setActiveIdx(0); })}
            {pill("annuity", "📋", "Annuity", productTab === "annuity", () => { setProductTab("annuity"); setActiveIdx(0); })}
            {pill("wrap", "📊", "Wrap", productTab === "wrap", () => { setProductTab("wrap"); setActiveIdx(0); })}
            {pill("bond", "🔒", "Investment Bond", productTab === "investment_bond", () => { setProductTab("investment_bond"); setActiveIdx(0); })}
          </div>

          {productTab === "superannuation" && (superP.length === 0
            ? empty("🏦", "Are you recommending a new super fund?", "Add details about new superannuation funds.", () => { uProd("superannuation", [...superP, emptySuper]); setActiveIdx(0); }, "Add Superannuation")
            : <div>{idxPills(superP, i => `Super ${i + 1}`)}{renderProduct("superannuation", superP, null, "🏦", "Superannuation Details", superFields)}{addBtn("Add Another Superannuation", () => { uProd("superannuation", [...superP, emptySuper]); setActiveIdx(superP.length); })}</div>
          )}

          {productTab === "pension" && (pensionP.length === 0
            ? empty("💳", "Are you recommending a new pension?", "Add details about account-based or allocated pensions.", () => { uProd("pension", [...pensionP, emptyPension]); setActiveIdx(0); }, "Add Pension")
            : <div>{idxPills(pensionP, i => `Pension ${i + 1}`)}{renderProduct("pension", pensionP, null, "💳", "Pension Details", pensionFields)}{addBtn("Add Another Pension", () => { uProd("pension", [...pensionP, emptyPension]); setActiveIdx(pensionP.length); })}</div>
          )}

          {productTab === "annuity" && (annuityP.length === 0
            ? empty("📋", "Are you recommending a new annuity?", "Add details about annuity products.", () => { uProd("annuity", [...annuityP, emptyAnnuity]); setActiveIdx(0); }, "Add Annuity")
            : <div>{idxPills(annuityP, i => `Annuity ${i + 1}`)}{renderProduct("annuity", annuityP, null, "📋", "Annuity Details", annuityFields)}{addBtn("Add Another Annuity", () => { uProd("annuity", [...annuityP, emptyAnnuity]); setActiveIdx(annuityP.length); })}</div>
          )}

          {productTab === "wrap" && (wrapP.length === 0
            ? empty("📊", "Are you recommending a new wrap platform?", "Add details about wrap or platform accounts.", () => { uProd("wrap", [...wrapP, emptyWrap]); setActiveIdx(0); }, "Add Wrap")
            : <div>{idxPills(wrapP, i => `Wrap ${i + 1}`)}{renderProduct("wrap", wrapP, null, "📊", "Wrap Platform Details", wrapFields)}{addBtn("Add Another Wrap", () => { uProd("wrap", [...wrapP, emptyWrap]); setActiveIdx(wrapP.length); })}</div>
          )}

          {productTab === "investment_bond" && (bondP.length === 0
            ? empty("🔒", "Are you recommending a new investment bond?", "Add details about investment bond products.", () => { uProd("investment_bond", [...bondP, emptyBond]); setActiveIdx(0); }, "Add Investment Bond")
            : <div>{idxPills(bondP, i => `Bond ${i + 1}`)}{renderProduct("investment_bond", bondP, null, "🔒", "Investment Bond Details", bondFields)}{addBtn("Add Another Bond", () => { uProd("investment_bond", [...bondP, emptyBond]); setActiveIdx(bondP.length); })}</div>
          )}
        </div>
      )}
    </div>
  );
}

// Modal overlay — defined outside component to prevent unmount/remount on re-render
export function InsModal({ show, onClose, title, children, wide }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div style={{ background: "var(--ps-surface)", borderRadius: 16, width: wide ? "90%" : "560px", maxWidth: wide ? 900 : 560, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px var(--ps-shadow-lg)", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--ps-border)", background: "var(--ps-surface-alt)", flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ps-text-strongest)" }}>{title}</span>
          <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 18, color: "var(--ps-text-subtle)", cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}>✕</button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function AdviceInsuranceForm({ factFind, updateFF, tab: forcedTab }) {
  const [tab, setTab] = useState(forcedTab || "needs");
  const [person, setPerson] = useState("client1");
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showIncome, setShowIncome] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [editPolIdx, setEditPolIdx] = useState(null);
  const [localIR, setLocalIR] = useState([]);
  const [localAR, setLocalAR] = useState([]);
  const [localAssumptions, setLocalAssumptions] = useState(null);

  const insData = factFind.advice_request?.adv_insurance || { client1: getDefaultInsPersonData(), client2: getDefaultInsPersonData(), policies: [] };
  const pd = insData[person] || getDefaultInsPersonData();
  const a = pd.assumptions; const n = pd.needs;
  const policies = insData.policies || [];
  const save = (d) => updateFF("advice_request.adv_insurance", d);
  const hasPartner = factFind.client2 !== null;
  const cn = (id) => { if (id === "client1") return ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim() || "Client 1"; if (id === "client2") return ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim() || "Client 2"; return id; };

  const uN = (type, field, value) => save({ ...insData, [person]: { ...pd, needs: { ...n, [type]: { ...n[type], [field]: parseFloat(value) || 0 } } } });
  const uA = (field, value) => save({ ...insData, [person]: { ...pd, assumptions: { ...a, [field]: value } } });

  const addIR = () => save({ ...insData, [person]: { ...pd, income_rows: [...pd.income_rows, { id: Date.now(), item: "", life: false, tpd: false, growth: 0, annual_income: 0, years: 0, pv: 0 }] } });
  const rmIR = (i) => save({ ...insData, [person]: { ...pd, income_rows: pd.income_rows.filter((_, idx) => idx !== i) } });
  const uIR = (i, f, v) => { const rows = [...pd.income_rows]; rows[i] = { ...rows[i], [f]: v }; const r = rows[i]; const ann = parseFloat(r.annual_income) || 0; const yrs = parseFloat(r.years) || 0; const net = ((parseFloat(r.growth) || 0) - (parseFloat(a.discount_rate) || 0)) / 100; rows[i].pv = (yrs > 0 && ann > 0) ? (Math.abs(net) < 0.0001 ? ann * yrs : ann * (1 - Math.pow(1 + net, -yrs)) / net) : 0; save({ ...insData, [person]: { ...pd, income_rows: rows } }); };

  // Local state helpers for assumptions modal
  const la = localAssumptions || a;
  const openAssumptionsModal = () => { setLocalAssumptions({ ...a }); setShowAssumptions(true); };
  const localUA = (field, value) => setLocalAssumptions(prev => ({ ...prev, [field]: value }));
  const saveAssumptionsModal = () => { save({ ...insData, [person]: { ...pd, assumptions: localAssumptions } }); setShowAssumptions(false); setLocalAssumptions(null); };

  // Local state helpers for income modal
  const openIncomeModal = () => { setLocalIR(JSON.parse(JSON.stringify(pd.income_rows))); setShowIncome(true); };
  const localUIR = (i, f, v) => { const rows = [...localIR]; rows[i] = { ...rows[i], [f]: v }; const r = rows[i]; const ann = parseFloat(r.annual_income) || 0; const yrs = parseFloat(r.years) || 0; const net = ((parseFloat(r.growth) || 0) - (parseFloat(a.discount_rate) || 0)) / 100; rows[i].pv = (yrs > 0 && ann > 0) ? (Math.abs(net) < 0.0001 ? ann * yrs : ann * (1 - Math.pow(1 + net, -yrs)) / net) : 0; setLocalIR(rows); };
  const localAddIR = () => setLocalIR([...localIR, { id: Date.now(), item: "Living expenses", life: false, tpd: false, growth: "", annual_income: "", years: "", pv: 0 }]);
  const localRmIR = (i) => setLocalIR(localIR.filter((_, idx) => idx !== i));
  const saveIncomeModal = () => { save({ ...insData, [person]: { ...pd, income_rows: localIR } }); setShowIncome(false); };
  const localIRLifePV = localIR.filter(r => r.life).reduce((s, r) => s + (parseFloat(r.pv) || 0), 0);
  const localIRTpdPV = localIR.filter(r => r.tpd).reduce((s, r) => s + (parseFloat(r.pv) || 0), 0);

  // Local state helpers for assets modal
  const openAssetsModal = () => { setLocalAR(JSON.parse(JSON.stringify(pd.asset_rows))); setShowAssets(true); };
  const localUAR = (i, f, v) => { const rows = [...localAR]; rows[i] = { ...rows[i], [f]: v }; setLocalAR(rows); };
  const localAddAR = () => setLocalAR([...localAR, { id: Date.now(), description: "", life: false, tpd: false, value: "" }]);
  const localRmAR = (i) => setLocalAR(localAR.filter((_, idx) => idx !== i));
  const saveAssetsModal = () => { save({ ...insData, [person]: { ...pd, asset_rows: localAR } }); setShowAssets(false); };
  const localARLife = localAR.filter(r => r.life).reduce((s, r) => s + (parseFloat(r.value) || 0), 0);
  const localARTpd = localAR.filter(r => r.tpd).reduce((s, r) => s + (parseFloat(r.value) || 0), 0);

  const addAR = () => save({ ...insData, [person]: { ...pd, asset_rows: [...pd.asset_rows, { id: Date.now(), description: "", life: false, tpd: false, value: 0 }] } });
  const rmAR = (i) => save({ ...insData, [person]: { ...pd, asset_rows: pd.asset_rows.filter((_, idx) => idx !== i) } });
  const uAR = (i, f, v) => { const rows = [...pd.asset_rows]; rows[i] = { ...rows[i], [f]: v }; save({ ...insData, [person]: { ...pd, asset_rows: rows } }); };

  const addPol = () => { const p = { ...EMPTY_INS_POLICY, id: "pol_" + Date.now(), person }; save({ ...insData, policies: [...policies, p] }); setEditPolIdx(policies.length); };
  const uPol = (idx, f, v) => { const ps = [...policies]; ps[idx] = { ...ps[idx], [f]: v }; save({ ...insData, policies: ps }); };
  const uPolBatch = (idx, updates) => { const ps = [...policies]; ps[idx] = { ...ps[idx], ...updates }; save({ ...insData, policies: ps }); };
  const rmPol = (idx) => { save({ ...insData, policies: policies.filter((_, i) => i !== idx) }); if (editPolIdx === idx) setEditPolIdx(null); };

  const mb = parseFloat(a.mortgage_balance) || 0; const od = parseFloat(a.other_debts) || 0; const sal = parseFloat(a.annual_salary) || 0;
  const lC = (n.life.pct_mortgage / 100) * mb + (n.life.pct_other_debts / 100) * od + (n.life.emergency_fund || 0) + (n.life.medical_costs || 0) + (n.life.funeral_costs || 0) + (n.life.other_upfront || 0);
  const tC = (n.tpd.pct_mortgage / 100) * mb + (n.tpd.pct_other_debts / 100) * od + (n.tpd.emergency_fund || 0) + (n.tpd.medical_costs || 0) + (n.tpd.home_modifications || 0) + (n.tpd.other_upfront || 0);
  const trC = (n.trauma.emergency_fund || 0) + (n.trauma.medical_costs || 0) + (n.trauma.home_modifications || 0) + (n.trauma.other_upfront || 0);
  const lPV = pd.income_rows.filter(r => r.life).reduce((s, r) => s + (parseFloat(r.pv) || 0), 0);
  const tPV = pd.income_rows.filter(r => r.tpd).reduce((s, r) => s + (parseFloat(r.pv) || 0), 0);
  const lAs = pd.asset_rows.filter(r => r.life).reduce((s, r) => s + (parseFloat(r.value) || 0), 0);
  const tAs = pd.asset_rows.filter(r => r.tpd).reduce((s, r) => s + (parseFloat(r.value) || 0), 0);
  const tTax = (tC + tPV) * 0.15;
  const ipM = (sal * ((n.ip.pct_salary + n.ip.pct_super) / 100)) / 12;
  const lI = lC + lPV; const tI = tC + tPV + tTax;
  const lF = Math.max(0, lI - lAs); const tF = Math.max(0, tI - tAs);
  const $ = (v) => "$" + (parseFloat(v) || 0).toLocaleString("en-AU", { maximumFractionDigits: 0 });

  const pillTab = (id, icon, label) => (<button key={id} onClick={() => { setTab(id); setEditPolIdx(null); }} style={{ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: tab === id ? 600 : 500, background: tab === id ? "var(--ps-surface)" : "transparent", boxShadow: tab === id ? "0 2px 8px var(--ps-shadow-md)" : "none", color: tab === id ? "var(--ps-text-primary)" : "var(--ps-text-muted)", transition: "all 0.15s" }}>{icon} {label}</button>);
  const pp = (id) => (<button onClick={() => setPerson(id)} style={{ padding: "7px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: person === id ? "#7C3AED" : "var(--ps-border-light)", color: person === id ? "var(--ps-surface)" : "var(--ps-text-muted)" }}>{cn(id)}</button>);

  const thS = { padding: "14px 16px", fontSize: 13, fontWeight: 600, color: "var(--ps-surface)", textAlign: "center", background: "#0F4A8A" };
  const tdS = { padding: "12px 16px", fontSize: 14, color: "var(--ps-text-body)", borderTop: "1px solid var(--ps-border)", textAlign: "center", verticalAlign: "middle" };
  const tdL = { ...tdS, textAlign: "left", fontWeight: 500, width: "280px" };
  const tdD = { ...tdS, color: "var(--ps-text-subtle)" };
  const tdB = { ...tdS, fontWeight: 700, background: "var(--ps-surface-alt)" };
  const ic = (value, onChange, placeholder) => (<input type="number" value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder || ""} style={{ width: "100%", maxWidth: 140, padding: "10px 12px", border: "1px solid var(--ps-border)", borderRadius: 8, fontSize: 14, textAlign: "center", background: "var(--ps-surface-input)", color: "var(--ps-text-body)" }} />);
  const secR = (label, bg, color) => (<tr><td colSpan={5} style={{ padding: "14px 16px", fontWeight: 700, fontSize: 14, color, background: bg, borderTop: "1px solid var(--ps-border)" }}>{label}</td></tr>);
  const totR = (label, l, t, tr2, ip, bg, col) => (<tr style={{ background: bg || "var(--ps-border-light)" }}><td style={{ ...tdL, fontWeight: 700, color: col || "var(--ps-text-strongest)", background: bg || "var(--ps-border-light)" }}>{label}</td><td style={{ ...tdB, color: col, background: bg || "var(--ps-border-light)" }}>{$(l)}</td><td style={{ ...tdB, color: col, background: bg || "var(--ps-border-light)" }}>{$(t)}</td><td style={{ ...tdB, color: col, background: bg || "var(--ps-border-light)" }}>{tr2 !== null ? $(tr2) : "—"}</td><td style={{ ...tdB, color: col, background: bg || "var(--ps-border-light)" }}>{ip !== null ? ip : "—"}</td></tr>);
  const blueBtn = (onClick, label) => (<button onClick={onClick} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "linear-gradient(180deg,#2563EB,#1D4ED8)", color: "var(--ps-surface)", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 4px rgba(37,99,235,0.3)" }}>{label}</button>);
  const chk = (val, onChange) => (<div onClick={() => onChange(!val)} style={{ width: 16, height: 16, borderRadius: 3, border: val ? "2px solid #7C3AED" : "2px solid var(--ps-border-mid)", background: val ? "#7C3AED" : "var(--ps-surface)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ps-surface)", fontSize: 10, fontWeight: 700 }}>{val ? "✓" : ""}</div>);


  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {pp("client1")}{hasPartner && pp("client2")}
        {tab === "needs" && <button onClick={openAssumptionsModal} style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 6, border: "1px solid var(--ps-border-mid)", background: "var(--ps-surface)", fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", cursor: "pointer" }}>⚙️ Key assumptions</button>}
      </div>

      {/* ═══ KEY ASSUMPTIONS MODAL ═══ */}
      <InsModal show={showAssumptions && tab === "needs"} onClose={saveAssumptionsModal} title={"Key Assumptions — " + cn(person)} wide>
        <div style={{ padding: 10, borderRadius: 8, background: "var(--ps-surface-blue)", border: "1px solid var(--ps-ring-blue)", fontSize: 12, color: "#1E40AF", marginBottom: 14 }}>Configure key assumptions for the insurance needs calculation.</div>
        {/* Personal Details */}
        <div style={{ border: "1px solid var(--ps-border)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--ps-text-muted)", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--ps-border)" }}>Personal Details</div>
          <div style={ffRowStyle}><FFInput label="Date of birth" value={la.date_of_birth} onChange={v => localUA("date_of_birth", v)} type="date" /><FFInput label="ESP start date" value={la.esp_start_date} onChange={v => localUA("esp_start_date", v)} type="date" /></div>
          <div style={ffRowStyle}><FFInput label="Service end date" value={la.service_end_date} onChange={v => localUA("service_end_date", v)} type="date" /><FFInput label="Retirement age" value={la.retirement_age} onChange={v => localUA("retirement_age", v)} type="number" /></div>
        </div>
        {/* TPD Tax Settings */}
        <div style={{ border: "1px solid var(--ps-border)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--ps-text-muted)", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--ps-border)" }}>TPD Tax Settings</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-body)", marginBottom: 8 }}>TPD held inside super?</div>
            <div style={{ display: "flex", gap: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}><input type="radio" checked={la.tpd_inside_super !== false} onChange={() => localUA("tpd_inside_super", true)} /> Yes</label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}><input type="radio" checked={la.tpd_inside_super === false} onChange={() => localUA("tpd_inside_super", false)} /> No</label>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <input type="checkbox" checked={!!la.override_tpd_tax} onChange={e => localUA("override_tpd_tax", e.target.checked)} style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-body)" }}>Override TPD tax uplift manually</span>
          </div>
          {la.override_tpd_tax && <FFInput label="Override uplift % (optional)" value={la.override_uplift_pct} onChange={v => localUA("override_uplift_pct", v)} type="number" suffix="%" />}
        </div>
        {/* Financial References */}
        <div style={{ border: "1px solid var(--ps-border)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--ps-text-muted)", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--ps-border)" }}>Financial References</div>
          <div style={ffRowStyle}><FFInput label="Mortgage balance" value={la.mortgage_balance} onChange={v => localUA("mortgage_balance", v)} type="number" prefix="$" /><FFInput label="Other debts" value={la.other_debts} onChange={v => localUA("other_debts", v)} type="number" prefix="$" /></div>
          <div style={ffRowStyle}><FFInput label="Annual salary" value={la.annual_salary} onChange={v => localUA("annual_salary", v)} type="number" prefix="$" /><FFInput label="Discount rate (% p.a.)" value={la.discount_rate} onChange={v => localUA("discount_rate", v)} type="number" suffix="%" /></div>
        </div>
        {/* Calculated Metrics (read-only) */}
        {(() => {
          const dob = la.date_of_birth ? new Date(la.date_of_birth) : null;
          const esp = la.esp_start_date ? new Date(la.esp_start_date) : null;
          const end = la.service_end_date ? new Date(la.service_end_date) : null;
          const retAge = parseFloat(la.retirement_age) || 65;
          const retDate = dob ? new Date(dob.getFullYear() + retAge, dob.getMonth(), dob.getDate()) : null;
          const daysBtw = (x, y) => (x && y && y > x) ? Math.round((y - x) / 86400000) : 0;
          const servDays = daysBtw(esp, end);
          const daysToRet = daysBtw(end, retDate);
          const denom = servDays + daysToRet;
          const taxProp = denom > 0 ? daysToRet / denom : 0;
          const calcUplift = la.tpd_inside_super !== false ? taxProp * 0.22 : 0;
          const usedUplift = la.override_tpd_tax && parseFloat(la.override_uplift_pct) > 0 ? parseFloat(la.override_uplift_pct) / 100 : calcUplift;
          const age = dob && end ? Math.floor((end - dob) / (365.25 * 86400000)) : null;
          const mr = (label, value) => (<div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13, color: "var(--ps-text-muted)" }}><span>{label}</span><span style={{ fontWeight: 700, color: "var(--ps-text-strongest)" }}>{value}</span></div>);
          return (
            <div style={{ border: "1px solid var(--ps-border)", borderRadius: 10, padding: 16, background: "var(--ps-surface-alt)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--ps-text-muted)", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--ps-border)" }}>Calculated Metrics (Read-only)</div>
              {mr("Age at service end:", age ? age + " yrs" : "—")}
              {mr("Service days:", servDays ? servDays.toLocaleString() : "—")}
              {mr("Days to retirement:", daysToRet ? daysToRet.toLocaleString() : "—")}
              {mr("Taxable proportion:", taxProp ? (taxProp * 100).toFixed(2) + "%" : "—")}
              <div style={{ borderTop: "1px solid var(--ps-border)", marginTop: 8, paddingTop: 8 }}>
                {mr("Calculated uplift %:", la.tpd_inside_super !== false ? (taxProp ? (taxProp * 22).toFixed(2) + "%" : "—") : "0%")}
                {mr("Uplift % actually applied:", (usedUplift * 100).toFixed(2) + "%")}
              </div>
            </div>
          );
        })()}
      </InsModal>

      {/* ═══ INCOME ROWS MODAL ═══ */}
      <InsModal show={showIncome} onClose={saveIncomeModal} title={"Edit Income Required — " + cn(person)} wide>
        <div style={{ padding: 12, borderRadius: 8, background: "var(--ps-surface-blue)", border: "1px solid var(--ps-ring-blue)", fontSize: 13, color: "#1E40AF", marginBottom: 16 }}>Add income streams to calculate capital required to replace income. PV uses growth − discount rate.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 120px 80px 100px 36px", gap: 10, padding: "10px 0", fontSize: 11, fontWeight: 700, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.3px", borderBottom: "2px solid var(--ps-border)" }}>
          <div>Item to cover</div><div>Insurance type</div><div>Growth (%)</div><div>Annual income ($)</div><div>Years</div><div style={{ textAlign: "right" }}>PV (today)</div><div></div>
        </div>
        {localIR.map((r, i) => (
          <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 120px 80px 100px 36px", gap: 10, padding: "10px 0", alignItems: "center", borderBottom: "1px solid var(--ps-border-light)" }}>
            <select value={r.item} onChange={e => localUIR(i, "item", e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--ps-border)", borderRadius: 8, fontSize: 14, background: "var(--ps-surface-input)", color: "var(--ps-text-body)" }}>{INS_INCOME_ITEMS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>{chk(r.life, v => localUIR(i, "life", v))} Life</label>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>{chk(r.tpd, v => localUIR(i, "tpd", v))} TPD</label>
            </div>
            <input type="number" value={r.growth === 0 ? "" : r.growth} onChange={e => localUIR(i, "growth", e.target.value)} placeholder="e.g. 2" style={{ padding: "10px 12px", border: "1px solid var(--ps-border)", borderRadius: 8, fontSize: 14, textAlign: "center", background: "var(--ps-surface-input)", color: "var(--ps-text-body)" }} />
            <input type="number" value={r.annual_income === 0 ? "" : r.annual_income} onChange={e => localUIR(i, "annual_income", e.target.value)} placeholder="$" style={{ padding: "10px 12px", border: "1px solid var(--ps-border)", borderRadius: 8, fontSize: 14, textAlign: "right", background: "var(--ps-surface-input)", color: "var(--ps-text-body)" }} />
            <input type="number" value={r.years === 0 ? "" : r.years} onChange={e => localUIR(i, "years", e.target.value)} placeholder="Yrs" style={{ padding: "10px 12px", border: "1px solid var(--ps-border)", borderRadius: 8, fontSize: 14, textAlign: "center", background: "var(--ps-surface-input)", color: "var(--ps-text-body)" }} />
            <div style={{ padding: "10px 12px", background: "var(--ps-border-light)", border: "1px solid var(--ps-border)", borderRadius: 8, fontSize: 14, fontWeight: 600, textAlign: "right", color: "var(--ps-text-body)" }}>{$(r.pv)}</div>
            <button onClick={() => localRmIR(i)} style={{ border: "none", background: "var(--ps-bg-red-200)", color: "var(--ps-red)", borderRadius: 8, width: 34, height: 34, cursor: "pointer", fontWeight: 700, fontSize: 16 }}>×</button>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--ps-border)" }}>
          <button onClick={localAddIR} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--ps-border-mid)", background: "var(--ps-surface)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Add row</button>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-body)" }}>Total PV — Life</span>
            <span style={{ padding: "6px 14px", background: "var(--ps-border-light)", borderRadius: 6, fontSize: 13, fontWeight: 700 }}>{$(localIRLifePV)}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-body)", marginLeft: 8 }}>Total PV — TPD</span>
            <span style={{ padding: "6px 14px", background: "var(--ps-border-light)", borderRadius: 6, fontSize: 13, fontWeight: 700 }}>{$(localIRTpdPV)}</span>
          </div>
        </div>
      </InsModal>

      {/* ═══ LESS REALISED ASSETS MODAL ═══ */}
      <InsModal show={showAssets} onClose={saveAssetsModal} title={"Less Realised Assets — " + cn(person)} wide>
        <div style={{ padding: 12, borderRadius: 8, background: "var(--ps-surface-amber)", border: "1px solid var(--ps-ring-amber)", fontSize: 13, color: "var(--ps-badge-amber)", marginBottom: 16 }}>Add assets that would be realised (sold/accessed) in the event of death or TPD to reduce cover required.</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 36px", gap: 12, padding: "10px 0", fontSize: 11, fontWeight: 700, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.3px", borderBottom: "2px solid var(--ps-border)" }}>
          <div>Asset description</div><div>Type</div><div style={{ textAlign: "right" }}>Value ($)</div><div></div>
        </div>
        {localAR.map((r, i) => (
          <div key={r.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 36px", gap: 12, padding: "10px 0", alignItems: "center", borderBottom: "1px solid var(--ps-border-light)" }}>
            <input value={r.description || ""} onChange={e => localUAR(i, "description", e.target.value)} placeholder="Describe the asset" style={{ padding: "10px 12px", border: "1px solid var(--ps-border)", borderRadius: 8, fontSize: 14, background: "var(--ps-surface-input)", color: "var(--ps-text-body)" }} />
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>{chk(r.life, v => localUAR(i, "life", v))} Life</label>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>{chk(r.tpd, v => localUAR(i, "tpd", v))} TPD</label>
            </div>
            <input type="number" value={r.value === 0 ? "" : r.value} onChange={e => localUAR(i, "value", e.target.value)} placeholder="$" style={{ padding: "10px 12px", border: "1px solid var(--ps-border)", borderRadius: 8, fontSize: 14, textAlign: "right", background: "var(--ps-surface-input)", color: "var(--ps-text-body)" }} />
            <button onClick={() => localRmAR(i)} style={{ border: "none", background: "var(--ps-bg-red-200)", color: "var(--ps-red)", borderRadius: 8, width: 34, height: 34, cursor: "pointer", fontWeight: 700, fontSize: 16 }}>×</button>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--ps-border)" }}>
          <button onClick={localAddAR} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--ps-border-mid)", background: "var(--ps-surface)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Add row</button>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-body)" }}>Applied to Life</span>
            <span style={{ padding: "6px 14px", background: "var(--ps-border-light)", borderRadius: 6, fontSize: 13, fontWeight: 700 }}>{$(localARLife)}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-body)", marginLeft: 8 }}>Applied to TPD</span>
            <span style={{ padding: "6px 14px", background: "var(--ps-border-light)", borderRadius: 6, fontSize: 13, fontWeight: 700 }}>{$(localARTpd)}</span>
          </div>
        </div>
      </InsModal>

      {tab === "needs" && (
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid var(--ps-border)", borderRadius: 12, overflow: "hidden" }}>
            <thead><tr><th style={{ ...thS, textAlign: "left", width: "280px" }}></th><th style={thS}>Life ($)</th><th style={thS}>TPD ($)</th><th style={thS}>Trauma ($)</th><th style={thS}>Income Protection (per month)</th></tr></thead>
            <tbody>
              {secR("Capital Needs", "var(--ps-border-light)", "var(--ps-text-strongest)")}
              <tr><td style={tdL}>Repay a % of mortgage</td><td style={tdS}>{ic(n.life.pct_mortgage, v => uN("life", "pct_mortgage", v), "%")}</td><td style={tdS}>{ic(n.tpd.pct_mortgage, v => uN("tpd", "pct_mortgage", v), "%")}</td><td style={tdD}>—</td><td style={tdD}>—</td></tr>
              <tr><td style={tdL}>Repay a % of other debts</td><td style={tdS}>{ic(n.life.pct_other_debts, v => uN("life", "pct_other_debts", v), "%")}</td><td style={tdS}>{ic(n.tpd.pct_other_debts, v => uN("tpd", "pct_other_debts", v), "%")}</td><td style={tdD}>—</td><td style={tdD}>—</td></tr>
              <tr><td style={tdL}>Emergency fund</td><td style={tdS}>{ic(n.life.emergency_fund, v => uN("life", "emergency_fund", v), "$")}</td><td style={tdS}>{ic(n.tpd.emergency_fund, v => uN("tpd", "emergency_fund", v), "$")}</td><td style={tdS}>{ic(n.trauma.emergency_fund, v => uN("trauma", "emergency_fund", v), "$")}</td><td style={tdD}>—</td></tr>
              <tr><td style={tdL}>Medical costs (specific)</td><td style={tdS}>{ic(n.life.medical_costs, v => uN("life", "medical_costs", v), "$")}</td><td style={tdS}>{ic(n.tpd.medical_costs, v => uN("tpd", "medical_costs", v), "$")}</td><td style={tdS}>{ic(n.trauma.medical_costs, v => uN("trauma", "medical_costs", v), "$")}</td><td style={tdD}>—</td></tr>
              <tr><td style={tdL}>Funeral costs</td><td style={tdS}>{ic(n.life.funeral_costs, v => uN("life", "funeral_costs", v), "$")}</td><td style={tdD}>—</td><td style={tdD}>—</td><td style={tdD}>—</td></tr>
              <tr><td style={tdL}>Home modifications / Recovery support</td><td style={tdD}>—</td><td style={tdS}>{ic(n.tpd.home_modifications, v => uN("tpd", "home_modifications", v), "$")}</td><td style={tdS}>{ic(n.trauma.home_modifications, v => uN("trauma", "home_modifications", v), "$")}</td><td style={tdD}>—</td></tr>
              <tr><td style={tdL}>Other upfront capital / Recovery</td><td style={tdS}>{ic(n.life.other_upfront, v => uN("life", "other_upfront", v), "$")}</td><td style={tdS}>{ic(n.tpd.other_upfront, v => uN("tpd", "other_upfront", v), "$")}</td><td style={tdS}>{ic(n.trauma.other_upfront, v => uN("trauma", "other_upfront", v), "$")}</td><td style={tdD}>—</td></tr>
              {totR("Capital needs total", lC, tC, trC, null)}
              {secR("Income Producing Capital Required", "var(--ps-surface)", "var(--ps-text-strongest)")}
              <tr><td style={tdL}>{blueBtn(() => openIncomeModal(), "Edit income required")}</td><td style={tdS}>{$(lPV)}</td><td style={tdS}>{$(tPV)}</td><td style={tdD}>—</td><td style={tdD}>—</td></tr>
              {totR("Capital & income needs", lC + lPV, tC + tPV, trC, null)}
              {secR("Income Protection", "var(--ps-surface-green)", "var(--ps-badge-green)")}
              <tr><td style={tdL}>IP inputs</td><td style={tdD}>—</td><td style={tdD}>—</td><td style={tdD}>—</td><td style={tdS}><div style={{ display: "flex", gap: 8, justifyContent: "center" }}>{ic(n.ip.pct_salary, v => uN("ip", "pct_salary", v), "% salary")}{ic(n.ip.pct_super, v => uN("ip", "pct_super", v), "% super")}</div></td></tr>
              {totR("Initial cover required", lI, tI, trC, $(ipM) + " per month", "var(--ps-surface-green)", "var(--ps-badge-green)")}
              {secR("Adjustments", "var(--ps-surface-amber)", "var(--ps-badge-amber)")}
              <tr><td style={tdL}>TPD tax uplift (estimate)</td><td style={tdD}>—</td><td style={tdB}>{$(tTax)}</td><td style={tdD}>—</td><td style={tdD}>—</td></tr>
              <tr><td style={tdL}>{blueBtn(() => openAssetsModal(), "Less realised assets")}</td><td style={{ ...tdB, color: "var(--ps-red)" }}>-{$(lAs)}</td><td style={{ ...tdB, color: "var(--ps-red)" }}>-{$(tAs)}</td><td style={tdD}>—</td><td style={tdD}>—</td></tr>
              {totR("Final cover required", lF, tF, trC, null, "#0F4A8A", "var(--ps-surface)")}
            </tbody>
          </table>
        </div>
      )}

      {tab === "policies" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>Policies — {cn(person)}</div>
            <button onClick={addPol} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#7C3AED", color: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Policy</button>
          </div>
          <div style={{ padding: 10, borderRadius: 8, background: "var(--ps-surface-blue)", border: "1px solid var(--ps-ring-blue)", fontSize: 12, color: "#1E40AF", marginBottom: 12 }}>
            Record existing and recommended policies. Client/Partner follows the toggle on the Needs tab.
          </div>
          {policies.filter(p => p.person === person).length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", border: "2px dashed var(--ps-border)", borderRadius: 12 }}><div style={{ fontSize: 36, marginBottom: 8 }}>📋</div><div style={{ fontSize: 13, color: "var(--ps-text-subtle)" }}>No policies yet. Click "+ Add Policy" to get started.</div></div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={{ padding: "10px", fontSize: 11, fontWeight: 700, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", textAlign: "left" }}>Owner</th>
                <th style={{ padding: "10px", fontSize: 11, fontWeight: 700, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", textAlign: "left" }}>Insurance Type</th>
                <th style={{ padding: "10px", fontSize: 11, fontWeight: 700, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", textAlign: "left" }}>Structure</th>
                <th style={{ padding: "10px", fontSize: 11, fontWeight: 700, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", textAlign: "left" }}>Frequency</th>
                <th style={{ padding: "10px", fontSize: 11, fontWeight: 700, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", textAlign: "right" }}></th>
              </tr></thead>
              <tbody>{policies.map((p, idx) => { if (p.person !== person) return null;
                const badge = INS_STATUS_BADGE[p.advice_status];
                return (
                <tr key={p.id} style={{ background: editPolIdx === idx ? "var(--ps-surface-purple)" : "transparent", cursor: "pointer" }} onClick={() => setEditPolIdx(editPolIdx === idx ? null : idx)}>
                  <td style={{ padding: "10px", fontSize: 13, borderBottom: "1px solid var(--ps-border-light)" }}>{p.owner || cn(person)}</td>
                  <td style={{ padding: "10px", fontSize: 13, borderBottom: "1px solid var(--ps-border-light)" }}>{p.insurance_type || "—"}</td>
                  <td style={{ padding: "10px", fontSize: 13, borderBottom: "1px solid var(--ps-border-light)" }}>{p.structure || "—"}</td>
                  <td style={{ padding: "10px", fontSize: 13, borderBottom: "1px solid var(--ps-border-light)" }}>{p.premium_frequency || "—"}</td>
                  <td style={{ padding: "10px", borderBottom: "1px solid var(--ps-border-light)", textAlign: "right" }}>
                    <button onClick={e => { e.stopPropagation(); setEditPolIdx(editPolIdx === idx ? null : idx); }} style={{ border: "none", background: "transparent", color: "#7C3AED", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✎</button>
                    <button onClick={e => { e.stopPropagation(); rmPol(idx); }} style={{ border: "none", background: "transparent", color: "var(--ps-red)", fontSize: 12, fontWeight: 600, cursor: "pointer", marginLeft: 6 }}>✕</button>
                  </td>
                </tr>); })}</tbody>
            </table>
          )}

          {editPolIdx !== null && policies[editPolIdx] && (() => { const pol = policies[editPolIdx]; const up = (f, v) => {
            if (f === "insurance_type") {
              const t = (v || "").toLowerCase();
              let life = false, tpd = false, trauma = false, ip = false;
              if (t.includes("life")) life = true;
              if (t.includes("tpd")) tpd = true;
              if (t.includes("trauma")) trauma = true;
              if (t.includes("income protection") || t === "super-linked ip") ip = true;
              if (t === "tpd (stand-alone)") { life = false; trauma = false; ip = false; tpd = true; }
              if (t === "trauma (stand alone)") { life = false; tpd = false; trauma = true; ip = false; }
              if (t === "trauma with linked (tpd)") { life = false; tpd = true; trauma = true; ip = false; }
              if (t === "income protection (stand-alone)" || t === "super-linked ip") { life = false; tpd = false; trauma = false; ip = true; }
              uPolBatch(editPolIdx, { insurance_type: v, include_life: life, include_tpd: tpd, include_trauma: trauma, include_ip: ip });
            } else {
              uPol(editPolIdx, f, v);
            }
          };
            // Section renderer — no checkbox, just shows/hides based on include flag
            const bs = (label, active, children) => {
              if (!active) return null;
              return (<div style={{ border: "1px solid var(--ps-border)", borderRadius: 10, padding: 14, marginTop: 10, background: "var(--ps-surface)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-body)", marginBottom: 10 }}>{label}</div>
                {children}
              </div>);
            };
            return (
              <div style={{ marginTop: 14, border: "2px solid #7C3AED", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", background: "var(--ps-surface-purple)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#6D28D9" }}>📋 Policy Details</div>
                  <span style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>Benefit sections auto-enable based on insurance type</span>
                  <button onClick={() => setEditPolIdx(null)} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: "var(--ps-text-subtle)" }}>✕</button>
                </div>
                <div style={{ padding: 16 }}>
                  {/* Row 1: Owner + Insurer */}
                  <div style={ffRowStyle}>
                    <FFInput label="Owner" value={pol.owner} onChange={v => up("owner", v)} placeholder="e.g. Client, Partner, SMSF" />
                    <FFInput label="Insurer / Product provider" value={pol.insurer} onChange={v => up("insurer", v)} placeholder="e.g. TAL, AIA" />
                  </div>
                  {/* Row 2: Product name + Policy number */}
                  <div style={ffRowStyle}>
                    <FFInput label="Product / Policy name" value={pol.product_name} onChange={v => up("product_name", v)} />
                    <FFInput label="Policy number" value={pol.policy_number} onChange={v => up("policy_number", v)} />
                  </div>
                  {/* Row 3: Insurance type + Structure */}
                  <div style={ffRowStyle}>
                    <FFSelect label="Insurance type" value={pol.insurance_type} onChange={v => up("insurance_type", v)} options={INS_TYPE_OPTIONS} />
                    <FFSelect label="Structure" value={pol.structure} onChange={v => up("structure", v)} options={INS_STRUCTURE} />
                  </div>
                  {/* Row 4: Premium type + frequency */}
                  <div style={ffRowStyle}>
                    <FFSelect label="Premium type" value={pol.premium_type} onChange={v => up("premium_type", v)} options={INS_PREMIUM_TYPE} />
                    <FFSelect label="Premium frequency" value={pol.premium_frequency} onChange={v => up("premium_frequency", v)} options={INS_PREMIUM_FREQ} />
                  </div>

                  {/* ── Benefit sections driven by insurance_type ── */}
                  {!pol.insurance_type && (
                    <div style={{ padding: 14, marginTop: 10, borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)", textAlign: "center", fontSize: 13, color: "var(--ps-text-subtle)" }}>
                      Select an insurance type above to see benefit fields
                    </div>
                  )}
                  {bs("Life cover", pol.include_life, (
                    <div style={ffRowStyle}>
                      <FFInput label="Sum insured (Life)" value={pol.life_sum_insured} onChange={v => up("life_sum_insured", v)} type="number" prefix="$" />
                      <FFInput label="Premium (Life)" value={pol.life_premium} onChange={v => up("life_premium", v)} type="number" prefix="$" />
                    </div>
                  ))}
                  {bs("TPD cover", pol.include_tpd, (
                    <div>
                      <div style={ffRowStyle}>
                        <FFInput label="Sum insured (TPD)" value={pol.tpd_sum_insured} onChange={v => up("tpd_sum_insured", v)} type="number" prefix="$" />
                        <FFInput label="Premium (TPD)" value={pol.tpd_premium} onChange={v => up("tpd_premium", v)} type="number" prefix="$" />
                      </div>
                      <div style={ffRowStyle}>
                        <FFSelect label="TPD definition" value={pol.tpd_definition} onChange={v => up("tpd_definition", v)} options={INS_TPD_DEF} />
                        <FFInput label="Notes (optional)" value={pol.tpd_notes} onChange={v => up("tpd_notes", v)} />
                      </div>
                    </div>
                  ))}
                  {bs("Trauma cover", pol.include_trauma, (
                    <div>
                      <div style={ffRowStyle}>
                        <FFInput label="Sum insured (Trauma)" value={pol.trauma_sum_insured} onChange={v => up("trauma_sum_insured", v)} type="number" prefix="$" />
                        <FFInput label="Premium (Trauma)" value={pol.trauma_premium} onChange={v => up("trauma_premium", v)} type="number" prefix="$" />
                      </div>
                      <FFInput label="Key events / comments" value={pol.trauma_notes} onChange={v => up("trauma_notes", v)} />
                    </div>
                  ))}
                  {bs("Income Protection", pol.include_ip, (
                    <div>
                      <div style={ffRowStyle}>
                        <FFInput label="Monthly benefit" value={pol.ip_monthly_benefit} onChange={v => up("ip_monthly_benefit", v)} type="number" prefix="$" />
                        <FFInput label="Premium (IP)" value={pol.ip_premium} onChange={v => up("ip_premium", v)} type="number" prefix="$" />
                      </div>
                      <div style={ffRowStyle}>
                        <FFSelect label="Waiting period" value={pol.ip_waiting_period} onChange={v => up("ip_waiting_period", v)} options={INS_IP_WAIT} />
                        <FFSelect label="Benefit period" value={pol.ip_benefit_period} onChange={v => up("ip_benefit_period", v)} options={INS_IP_BENEFIT} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ); })()}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// ADVICE — Assumptions Form (Base44-aligned: 5 sub-tabs)
// ===========================================================================

const ASSUM_HORIZON = [
  { value: "le+buffer", label: "Life expectancy + buffer" },
  { value: "age", label: "Specify age" },
  { value: "years", label: "Specify timeframe (years)" },
];
const ASSUM_GROWTH_TYPE = [
  { value: "Use risk profile", label: "Use risk profile" },
  { value: "Use portfolio asset allocation", label: "Use portfolio asset allocation" },
  { value: "Specify growth rate", label: "Specify growth rate" },
];
const ASSUM_RATE_ADJ = [
  { value: "Set to rate", label: "Set to rate" },
  { value: "Increase by Δ", label: "Increase by Δ" },
  { value: "Decrease by Δ", label: "Decrease by Δ" },
  { value: "Ramp to rate", label: "Ramp to rate" },
];
const ASSUM_FEE_TYPE = [{ value: "Upfront", label: "Upfront" }, { value: "Ongoing", label: "Ongoing" }, { value: "SOA fee", label: "SOA fee" }];
const ASSUM_FEE_BASIS = [{ value: "Flat $", label: "Flat $" }, { value: "% of balance", label: "% of balance" }];
const ASSUM_FEE_FREQ = [{ value: "One-off", label: "One-off" }, { value: "Monthly", label: "Monthly" }, { value: "Quarterly", label: "Quarterly" }, { value: "Annually", label: "Annually" }];

const ASSUM_DEFAULT_BASIC = { strategy_start_date: "", inflation_rate: 2.5, horizon_type: "le+buffer", run_until_age: 100, life_expectancy_buffer: 5, years_to_run: "", apply_desired_income: false, stop_expenses_at_retirement: false, centrelink_off: false };

const assumId = () => "asm_" + Math.random().toString(36).slice(2) + Date.now().toString(36);

// ===========================================================================
// TAX & SUPER PLANNING FORM
// ===========================================================================
const LOW_RATE_CAP = 235000;  // 2024/25 — update annually
const BRING_FORWARD_ANNUAL_CAP = 120000;
const TBC_GENERAL_CAP = 1900000; // 2024/25 transfer balance cap

export function TaxSuperPlanningForm({ factFind, updateFF }) {
  const clients = [
    factFind.client1 ? { key: "client1", label: ((factFind.client1.first_name || "") + " " + (factFind.client1.last_name || "")).trim() || "Client 1" } : null,
    factFind.client2 ? { key: "client2", label: ((factFind.client2.first_name || "") + " " + (factFind.client2.last_name || "")).trim() || "Client 2" } : null,
  ].filter(Boolean);

  const data = factFind.tax_super_planning || {};
  const save = (d) => updateFF("tax_super_planning", d);
  const uClient = (clientKey, field, value) => save({ ...data, [clientKey]: { ...(data[clientKey] || {}), [field]: value } });

  const fmtCurrency = (v) => { const n = parseFloat(v); return isNaN(n) ? "—" : "$" + Math.round(n).toLocaleString("en-AU"); };
  const remaining = (cap, used) => { const u = parseFloat(used) || 0; return Math.max(0, cap - u); };

  const sectionHead = (title, sub) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginTop: 2 }}>{sub}</div>}
    </div>
  );

  const infoRow = (label, value, highlight) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--ps-border-light)" }}>
      <span style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: highlight || "var(--ps-text-primary)" }}>{value}</span>
    </div>
  );

  const pillToggle = (val, onChange, opts) => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {opts.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          style={{ padding: "4px 12px", borderRadius: 6, border: val === o.value ? "2px solid #4F46E5" : "1px solid var(--ps-border)", background: val === o.value ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: val === o.value ? "#4F46E5" : "var(--ps-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>Tax & Super Planning</div>
      <div style={{ fontSize: 12, color: "var(--ps-text-subtle)", marginBottom: 28 }}>Low rate threshold, bring-forward, transfer balance cap & conditions of release</div>

      {clients.map(({ key, label }) => {
        const cd = data[key] || {};
        // CGT losses — read from income
        const incomeData = factFind.income?.[key] || {};
        const cgtLosses = parseFloat(incomeData.i_cgt_losses) || 0;

        // Low rate threshold
        const lrtUsed = parseFloat(cd.low_rate_used) || 0;
        const lrtRemaining = remaining(LOW_RATE_CAP, lrtUsed);

        // Bring forward
        const bfTriggered = cd.bring_forward_triggered === true;
        const bfYearTriggered = cd.bring_forward_year || "";
        const bfUsed = parseFloat(cd.bring_forward_used) || 0;
        const bfTotal = BRING_FORWARD_ANNUAL_CAP * 3; // standard 3-year bring-forward
        const bfRemaining = remaining(bfTotal, bfUsed);

        // Transfer balance cap
        const tbcUsed = parseFloat(cd.tbc_used) || 0;
        const tbcRemaining = remaining(TBC_GENERAL_CAP, tbcUsed);

        // Condition of release
        const corMet = cd.condition_of_release === true;

        return (
          <div key={key} style={{ marginBottom: 36, background: "var(--ps-surface-alt)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "20px 24px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#4F46E5", marginBottom: 20, paddingBottom: 10, borderBottom: "2px solid var(--ps-surface-indigo)" }}>
              {label}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>

              {/* ── CGT Losses ── */}
              <div>
                {sectionHead("Capital Gains Tax Losses", "Carried-forward CGT losses from prior years")}
                <div style={{ padding: "10px 14px", background: "var(--ps-surface-alt)", borderRadius: 8, border: "1px solid var(--ps-border)" }}>
                  {infoRow("Existing CGT Losses (from Income)", fmtCurrency(cgtLosses), cgtLosses > 0 ? "#DC2626" : "var(--ps-text-muted)")}
                  <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", marginTop: 6 }}>Edit in Fact Find → Income → Existing CGT Losses</div>
                </div>
              </div>

              {/* ── Condition of Release ── */}
              <div>
                {sectionHead("Condition of Release", "Has a condition of release been met for superannuation access?")}
                <div style={{ marginBottom: 10 }}>
                  {pillToggle(cd.condition_of_release === true ? "yes" : cd.condition_of_release === false ? "no" : "", (v) => uClient(key, "condition_of_release", v === "yes"), [{ value: "yes", label: "✓ Met" }, { value: "no", label: "✗ Not yet met" }])}
                </div>
                {corMet && (
                  <FFInput label="Date met" value={cd.condition_of_release_date || ""} onChange={v => uClient(key, "condition_of_release_date", v)} placeholder="e.g. 01/07/2024" />
                )}
                {!corMet && cd.condition_of_release === false && (
                  <div style={{ fontSize: 11, color: "var(--ps-red)", marginTop: 6 }}>Preservation age restrictions apply. Lump sum tax rates will be applied to withdrawals.</div>
                )}
              </div>

              {/* ── Existing Tax Losses ── */}
              <div style={{ marginBottom: 16 }}>
                {sectionHead("Existing Tax Losses", "Carry-forward losses from prior financial years")}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <FFInput label="Existing CGT Losses" value={(factFind.income?.[key]?.i_cgt_losses) || ""} onChange={v => { const inc = factFind.income || {}; updateFF("income", { ...inc, [key]: { ...(inc[key] || {}), i_cgt_losses: v } }); }} type="number" prefix="$" placeholder="Prior year net capital losses" />
                  <FFInput label="Carry-Forward Revenue Losses" value={(factFind.income?.[key]?.i_revenue_losses) || ""} onChange={v => { const inc = factFind.income || {}; updateFF("income", { ...inc, [key]: { ...(inc[key] || {}), i_revenue_losses: v } }); }} type="number" prefix="$" placeholder="Prior year revenue losses" />
                </div>
              </div>

              {/* ── Low Rate Threshold ── */}
              <div>
                {sectionHead("Low Rate Threshold", `Lifetime cap: ${fmtCurrency(LOW_RATE_CAP)} (2024/25) — applies to taxable component withdrawals between preservation age and 59`)}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <FFInput label="Amount used to date" value={cd.low_rate_used || ""} onChange={v => uClient(key, "low_rate_used", v)} type="number" prefix="$" placeholder="0" />
                  <div style={{ padding: "10px 14px", background: "var(--ps-surface-green)", borderRadius: 8, border: "1px solid var(--ps-ring-emerald)" }}>
                    {infoRow("Cap", fmtCurrency(LOW_RATE_CAP))}
                    {infoRow("Used", fmtCurrency(lrtUsed), lrtUsed > 0 ? "#DC2626" : "var(--ps-text-muted)")}
                    {infoRow("Remaining", fmtCurrency(lrtRemaining), lrtRemaining > 0 ? "var(--ps-green)" : "var(--ps-red)")}
                  </div>
                  {lrtUsed >= LOW_RATE_CAP && (
                    <div style={{ fontSize: 11, color: "var(--ps-red)", fontWeight: 600 }}>⚠ Low rate cap fully exhausted — 15% + Medicare applies to taxable component withdrawals</div>
                  )}
                </div>
              </div>

              {/* ── Bring Forward NCC ── */}
              <div>
                {sectionHead("Bring-Forward NCC Rule", "3-year bring-forward of non-concessional contributions cap ($360k total)")}
                <div style={{ marginBottom: 10 }}>
                  {pillToggle(bfTriggered ? "yes" : "no", (v) => uClient(key, "bring_forward_triggered", v === "yes"), [{ value: "yes", label: "✓ Triggered" }, { value: "no", label: "Not triggered" }])}
                </div>
                {bfTriggered && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <FFInput label="Year triggered" value={bfYearTriggered} onChange={v => uClient(key, "bring_forward_year", v)} placeholder="e.g. 2023" />
                      <FFInput label="Amount used" value={cd.bring_forward_used || ""} onChange={v => uClient(key, "bring_forward_used", v)} type="number" prefix="$" placeholder="0" />
                    </div>
                    <div style={{ padding: "10px 14px", background: "var(--ps-surface-green)", borderRadius: 8, border: "1px solid var(--ps-ring-emerald)" }}>
                      {infoRow("Total 3-year cap", fmtCurrency(bfTotal))}
                      {infoRow("Used", fmtCurrency(bfUsed), bfUsed > 0 ? "#DC2626" : "var(--ps-text-muted)")}
                      {infoRow("Remaining", fmtCurrency(bfRemaining), bfRemaining > 0 ? "var(--ps-green)" : "var(--ps-red)")}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Transfer Balance Cap ── */}
              <div style={{ gridColumn: "1 / -1" }}>
                {sectionHead("Transfer Balance Cap", `General cap: ${fmtCurrency(TBC_GENERAL_CAP)} (2024/25) — maximum amount that can be transferred into retirement phase`)}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <FFInput label="TBC used" value={cd.tbc_used || ""} onChange={v => uClient(key, "tbc_used", v)} type="number" prefix="$" placeholder="0" />
                  <div style={{ padding: "10px 14px", background: "var(--ps-surface-green)", borderRadius: 8, border: "1px solid var(--ps-ring-emerald)", alignSelf: "end" }}>
                    {infoRow("Cap", fmtCurrency(TBC_GENERAL_CAP))}
                    {infoRow("Used", fmtCurrency(tbcUsed), tbcUsed > 0 ? "#D97706" : "var(--ps-text-muted)")}
                    {infoRow("Remaining", fmtCurrency(tbcRemaining), tbcRemaining > 0 ? "var(--ps-green)" : "var(--ps-red)")}
                  </div>
                  <div style={{ padding: "10px 14px", background: tbcRemaining <= 0 ? "var(--ps-surface-red)" : "var(--ps-surface-alt)", borderRadius: 8, border: `1px solid ${tbcRemaining <= 0 ? "var(--ps-ring-red-soft)" : "var(--ps-border)"}`, alignSelf: "end", fontSize: 11, color: "var(--ps-text-muted)" }}>
                    {tbcRemaining <= 0
                      ? <span style={{ color: "var(--ps-red)", fontWeight: 700 }}>⚠ TBC exhausted — no further pension phase transfers permitted</span>
                      : tbcUsed > 0
                        ? <span style={{ color: "#D97706" }}>Partially used — {Math.round((tbcUsed / TBC_GENERAL_CAP) * 100)}% of cap consumed</span>
                        : <span>No pension phase transfers recorded</span>
                    }
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AssumptionsForm({ factFind, updateFF }) {
  const [tab, setTab] = useState("basic");
  const [editId, setEditId] = useState(null);

  const data = factFind.advice_request?.assumptions || { basic: { ...ASSUM_DEFAULT_BASIC }, returns_entities: [], returns_assets: [], rate_adjustments: [], fees: [] };
  const basic = data.basic || { ...ASSUM_DEFAULT_BASIC };
  const retEnts = data.returns_entities || [];
  const retAssets = data.returns_assets || [];
  const rateAdjs = data.rate_adjustments || [];
  const fees = data.fees || [];

  const save = (d) => updateFF("advice_request.assumptions", d);
  const uBasic = (f, v) => save({ ...data, basic: { ...basic, [f]: v } });

  // Returns entities CRUD
  const addRetEnt = () => { const r = { id: assumId(), entityName: "", assumption_type: "Use risk profile", growth_rate: 5, income_rate: 4, franking_rate: 3 }; save({ ...data, returns_entities: [...retEnts, r] }); setEditId(r.id); };
  const uRetEnt = (id, f, v) => {
    save({ ...data, returns_entities: retEnts.map(r => {
      if (r.id !== id) return r;
      if (f === "assumption_type" && v === "Use risk profile") return { ...r, assumption_type: v, growth_rate: 5, income_rate: 4, franking_rate: 3 };
      return { ...r, [f]: v };
    }) });
  };
  const rmRetEnt = (id) => { save({ ...data, returns_entities: retEnts.filter(r => r.id !== id) }); if (editId === id) setEditId(null); };

  // Returns assets CRUD
  const addRetAss = () => { const r = { id: assumId(), asset_name: "", override: "No", growth_rate: "", income_rate: "" }; save({ ...data, returns_assets: [...retAssets, r] }); setEditId(r.id); };
  const uRetAss = (id, f, v) => save({ ...data, returns_assets: retAssets.map(r => r.id === id ? { ...r, [f]: v } : r) });
  const rmRetAss = (id) => { save({ ...data, returns_assets: retAssets.filter(r => r.id !== id) }); if (editId === id) setEditId(null); };

  // Rate adjustments CRUD
  const addRate = () => { const r = { id: assumId(), debt_name: "", adjustment_type: "Set to rate", start_year: "", end_year: "", rate_value: "", rate_change: "" }; save({ ...data, rate_adjustments: [...rateAdjs, r] }); setEditId(r.id); };
  const uRate = (id, f, v) => save({ ...data, rate_adjustments: rateAdjs.map(r => r.id === id ? { ...r, [f]: v } : r) });
  const rmRate = (id) => { save({ ...data, rate_adjustments: rateAdjs.filter(r => r.id !== id) }); if (editId === id) setEditId(null); };

  // Fees CRUD
  const addFee = () => { const f = { id: assumId(), fee_type: "Ongoing", basis: "Flat $", amount: "", frequency: "Annually", start_date: "", end_date: "" }; save({ ...data, fees: [...fees, f] }); setEditId(f.id); };
  const uFee = (id, f, v) => save({ ...data, fees: fees.map(fe => fe.id === id ? { ...fe, [f]: v } : fe) });
  const rmFee = (id) => { save({ ...data, fees: fees.filter(f => f.id !== id) }); if (editId === id) setEditId(null); };

  const accent = "var(--ps-text-muted)";
  const pillTab = (id, icon, label) => (
    <button key={id} onClick={() => { setTab(id); setEditId(null); }} style={{
      padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: tab === id ? 600 : 500, transition: "all 0.15s",
      background: tab === id ? "var(--ps-surface)" : "transparent", boxShadow: tab === id ? "0 2px 8px var(--ps-shadow-md)" : "none", color: tab === id ? "var(--ps-text-primary)" : "var(--ps-text-muted)",
    }}>{icon} {label}</button>
  );
  const thS = { padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", textAlign: "left" };
  const tdS = { padding: "10px 10px", fontSize: 13, color: "var(--ps-text-body)", borderBottom: "1px solid var(--ps-border-light)" };
  const actBtn = (onClick, color, label) => <button onClick={e => { e.stopPropagation(); onClick(); }} style={{ padding: "3px 8px", borderRadius: 4, border: "none", background: "transparent", color, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{label}</button>;
  const addBtn = (onClick, label) => <button onClick={onClick} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: accent, color: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{label}</button>;
  const emptyState = (icon, msg) => (<div style={{ padding: "40px 24px", textAlign: "center", border: "2px dashed var(--ps-border)", borderRadius: 12 }}><div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div><div style={{ fontSize: 13, color: "var(--ps-text-subtle)" }}>{msg}</div></div>);

  // Checkbox toggle
  const chk = (val, onChange, label) => (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ps-text-body)", cursor: "pointer" }}>
      <div onClick={() => onChange(!val)} style={{ width: 18, height: 18, borderRadius: 4, border: val ? "2px solid var(--ps-text-muted)" : "2px solid var(--ps-border-mid)", background: val ? "var(--ps-text-muted)" : "var(--ps-surface)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ps-surface)", fontSize: 11, fontWeight: 700 }}>{val ? "✓" : ""}</div>
      {label}
    </label>
  );

  // Radio
  const radio = (name, val, current, onChange, label) => (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ps-text-body)", cursor: "pointer", marginBottom: 4 }}>
      <div onClick={() => onChange(val)} style={{ width: 16, height: 16, borderRadius: 8, border: current === val ? "2px solid var(--ps-text-muted)" : "2px solid var(--ps-border-mid)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        {current === val && <div style={{ width: 8, height: 8, borderRadius: 4, background: "var(--ps-text-muted)" }} />}
      </div>
      {label}
    </label>
  );

  const detailPanel = (icon, title, color, children) => (
    <div style={{ marginTop: 12, border: "2px solid " + color, borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", background: color + "10", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color }}>{icon} {title}</div>
        <button onClick={() => setEditId(null)} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: "var(--ps-text-subtle)" }}>✕</button>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );

  return (
    <div>
      {/* Tab bar — wraps if needed */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: 4, background: "var(--ps-surface-alt)", borderRadius: 12, border: "1px solid var(--ps-border)", marginBottom: 16 }}>
        {pillTab("basic", "⚙️", "Basic")}
        {pillTab("ret-entity", "🏢", "Returns (Entity)")}
        {pillTab("ret-asset", "📈", "Returns (Asset)")}
        {pillTab("rates", "💹", "Interest Rates")}
        {pillTab("fees", "💵", "Advice Fees")}
      </div>

      {/* ════════ BASIC TAB ════════ */}
      {tab === "basic" && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 10 }}>Basic Assumptions</div>
          <div style={ffRowStyle}>
            <FFInput label="Strategy start date" value={basic.strategy_start_date} onChange={v => uBasic("strategy_start_date", v)} type="date" />
            <FFInput label="Inflation rate (%)" value={basic.inflation_rate} onChange={v => uBasic("inflation_rate", parseFloat(v) || 0)} type="number" suffix="%" />
          </div>
          <div style={{ marginTop: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 6 }}>How long to run model for?</div>
            {ASSUM_HORIZON.map(h => radio("horizon", h.value, basic.horizon_type, v => uBasic("horizon_type", v), h.label))}
          </div>
          <div style={ffRowStyle}>
            <FFInput label="Run until age" value={basic.run_until_age} onChange={v => uBasic("run_until_age", parseInt(v) || 0)} type="number" />
            <FFInput label="Life expectancy buffer (yrs)" value={basic.life_expectancy_buffer} onChange={v => uBasic("life_expectancy_buffer", parseInt(v) || 0)} type="number" />
          </div>
          <FFInput label="Years to run model" value={basic.years_to_run} onChange={v => uBasic("years_to_run", parseInt(v) || "")} type="number" />
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {chk(basic.apply_desired_income, v => uBasic("apply_desired_income", v), "Apply desired income in retirement")}
            {chk(basic.stop_expenses_at_retirement, v => uBasic("stop_expenses_at_retirement", v), "Stop expenses at retirement")}
            {chk(basic.centrelink_off, v => uBasic("centrelink_off", v), "Turn Centrelink calculations off")}
          </div>
        </div>
      )}

      {/* ════════ RETURNS (ENTITY) TAB ════════ */}
      {tab === "ret-entity" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>Returns by Entity / Wrapper</div>
            {addBtn(addRetEnt, "+ Add Entity")}
          </div>
          {retEnts.length === 0 ? emptyState("📈", "No entity returns configured.") : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={thS}>Entity</th><th style={thS}>Assumption</th><th style={{ ...thS, textAlign: "right" }}>Growth %</th><th style={{ ...thS, textAlign: "right" }}>Income %</th><th style={{ ...thS, textAlign: "right" }}>Franking %</th><th style={{ ...thS, textAlign: "right" }}>Actions</th>
              </tr></thead>
              <tbody>{retEnts.map(r => (
                <tr key={r.id} style={{ background: editId === r.id ? "var(--ps-surface-alt)" : "transparent", cursor: "pointer" }} onClick={() => setEditId(editId === r.id ? null : r.id)}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{r.entityName || "(Unnamed)"}</td>
                  <td style={tdS}>{r.assumption_type || "—"}</td>
                  <td style={{ ...tdS, textAlign: "right" }}>{r.growth_rate ?? "—"}</td>
                  <td style={{ ...tdS, textAlign: "right" }}>{r.income_rate ?? "—"}</td>
                  <td style={{ ...tdS, textAlign: "right" }}>{r.franking_rate ?? "—"}</td>
                  <td style={{ ...tdS, textAlign: "right" }}>{actBtn(() => setEditId(editId === r.id ? null : r.id), accent, "✎")}{actBtn(() => rmRetEnt(r.id), "#DC2626", "✕")}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {editId && retEnts.find(r => r.id === editId) && (() => { const r = retEnts.find(x => x.id === editId); const ro = r.assumption_type === "Use risk profile"; return detailPanel("📈", "Return Profile Details", accent, (
            <div>
              <div style={ffRowStyle}>
                <FFInput label="Entity / Wrapper" value={r.entityName} onChange={v => uRetEnt(r.id, "entityName", v)} placeholder="Entity name" />
                <FFSelect label="Growth rate assumption" value={r.assumption_type} onChange={v => uRetEnt(r.id, "assumption_type", v)} options={ASSUM_GROWTH_TYPE} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <FFInput label="Growth rate (net %)" value={r.growth_rate} onChange={v => uRetEnt(r.id, "growth_rate", v)} type="number" disabled={ro} />
                <FFInput label="Income return (%)" value={r.income_rate} onChange={v => uRetEnt(r.id, "income_rate", v)} type="number" disabled={ro} />
                <FFInput label="Franking (%)" value={r.franking_rate} onChange={v => uRetEnt(r.id, "franking_rate", v)} type="number" disabled={ro} />
              </div>
            </div>
          )); })()}
        </div>
      )}

      {/* ════════ RETURNS (ASSET) TAB ════════ */}
      {tab === "ret-asset" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>Returns per Asset (Overrides)</div>
            {addBtn(addRetAss, "+ Add Override")}
          </div>
          {retAssets.length === 0 ? emptyState("📊", "No asset overrides configured.") : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={thS}>Asset</th><th style={thS}>Override?</th><th style={{ ...thS, textAlign: "right" }}>Growth %</th><th style={{ ...thS, textAlign: "right" }}>Income %</th><th style={{ ...thS, textAlign: "right" }}>Actions</th>
              </tr></thead>
              <tbody>{retAssets.map(r => (
                <tr key={r.id} style={{ background: editId === r.id ? "var(--ps-surface-alt)" : "transparent", cursor: "pointer" }} onClick={() => setEditId(editId === r.id ? null : r.id)}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{r.asset_name || "—"}</td>
                  <td style={tdS}>{r.override || "No"}</td>
                  <td style={{ ...tdS, textAlign: "right" }}>{r.growth_rate || "—"}</td>
                  <td style={{ ...tdS, textAlign: "right" }}>{r.income_rate || "—"}</td>
                  <td style={{ ...tdS, textAlign: "right" }}>{actBtn(() => setEditId(editId === r.id ? null : r.id), accent, "✎")}{actBtn(() => rmRetAss(r.id), "#DC2626", "✕")}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {editId && retAssets.find(r => r.id === editId) && (() => { const r = retAssets.find(x => x.id === editId); const ro = r.override !== "Yes"; return detailPanel("📊", "Asset Override Details", accent, (
            <div>
              <div style={ffRowStyle}>
                <FFInput label="Asset name" value={r.asset_name} onChange={v => uRetAss(r.id, "asset_name", v)} placeholder="Asset name" />
                <FFSelect label="Override default?" value={r.override} onChange={v => uRetAss(r.id, "override", v)} options={[{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }]} />
              </div>
              <div style={ffRowStyle}>
                <FFInput label="Growth rate %" value={r.growth_rate} onChange={v => uRetAss(r.id, "growth_rate", v)} type="number" disabled={ro} />
                <FFInput label="Income yield %" value={r.income_rate} onChange={v => uRetAss(r.id, "income_rate", v)} type="number" disabled={ro} />
              </div>
            </div>
          )); })()}
        </div>
      )}

      {/* ════════ INTEREST RATES TAB ════════ */}
      {tab === "rates" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>Interest Rate Adjustments</div>
            {addBtn(addRate, "+ Add Adjustment")}
          </div>
          {rateAdjs.length === 0 ? emptyState("💹", "No rate adjustments configured.") : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={thS}>Debt</th><th style={thS}>Type</th><th style={thS}>Start</th><th style={thS}>End</th><th style={{ ...thS, textAlign: "right" }}>Rate %</th><th style={{ ...thS, textAlign: "right" }}>Actions</th>
              </tr></thead>
              <tbody>{rateAdjs.map(r => (
                <tr key={r.id} style={{ background: editId === r.id ? "var(--ps-surface-alt)" : "transparent", cursor: "pointer" }} onClick={() => setEditId(editId === r.id ? null : r.id)}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{r.debt_name || "—"}</td>
                  <td style={tdS}>{r.adjustment_type || "—"}</td>
                  <td style={tdS}>{r.start_year || "—"}</td>
                  <td style={tdS}>{r.end_year || "Ongoing"}</td>
                  <td style={{ ...tdS, textAlign: "right" }}>{r.rate_value || "—"}</td>
                  <td style={{ ...tdS, textAlign: "right" }}>{actBtn(() => setEditId(editId === r.id ? null : r.id), accent, "✎")}{actBtn(() => rmRate(r.id), "#DC2626", "✕")}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {editId && rateAdjs.find(r => r.id === editId) && (() => { const r = rateAdjs.find(x => x.id === editId); return detailPanel("💹", "Interest Adjustment Details", accent, (
            <div>
              <div style={ffRowStyle}>
                <FFInput label="Debt name" value={r.debt_name} onChange={v => uRate(r.id, "debt_name", v)} placeholder="Debt name" />
                <FFSelect label="Adjustment type" value={r.adjustment_type} onChange={v => uRate(r.id, "adjustment_type", v)} options={ASSUM_RATE_ADJ} />
              </div>
              <div style={ffRowStyle}>
                <FFInput label="Start year" value={r.start_year} onChange={v => uRate(r.id, "start_year", v)} placeholder="e.g. 2025/26" />
                <FFInput label="End year (optional)" value={r.end_year} onChange={v => uRate(r.id, "end_year", v)} placeholder="Ongoing" />
              </div>
              <div style={ffRowStyle}>
                <FFInput label="New rate / Δ (%)" value={r.rate_value} onChange={v => uRate(r.id, "rate_value", v)} type="number" />
                <FFInput label="Rate of change (% p.a.)" value={r.rate_change} onChange={v => uRate(r.id, "rate_change", v)} type="number" />
              </div>
            </div>
          )); })()}
        </div>
      )}

      {/* ════════ ADVICE FEES TAB ════════ */}
      {tab === "fees" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>Advice Fees</div>
            {addBtn(addFee, "+ Add Fee")}
          </div>
          {fees.length === 0 ? emptyState("💵", "No fees configured.") : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={thS}>Type</th><th style={thS}>Basis</th><th style={{ ...thS, textAlign: "right" }}>Amount</th><th style={thS}>Frequency</th><th style={thS}>Start</th><th style={{ ...thS, textAlign: "right" }}>Actions</th>
              </tr></thead>
              <tbody>{fees.map(f => (
                <tr key={f.id} style={{ background: editId === f.id ? "var(--ps-surface-alt)" : "transparent", cursor: "pointer" }} onClick={() => setEditId(editId === f.id ? null : f.id)}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{f.fee_type || "—"}</td>
                  <td style={tdS}>{f.basis || "—"}</td>
                  <td style={{ ...tdS, textAlign: "right" }}>{f.basis === "% of balance" ? (f.amount + "%") : ("$" + (f.amount || 0))}</td>
                  <td style={tdS}>{f.frequency || "—"}</td>
                  <td style={tdS}>{f.start_date || "—"}</td>
                  <td style={{ ...tdS, textAlign: "right" }}>{actBtn(() => setEditId(editId === f.id ? null : f.id), accent, "✎")}{actBtn(() => rmFee(f.id), "#DC2626", "✕")}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {editId && fees.find(f => f.id === editId) && (() => { const f = fees.find(x => x.id === editId); return detailPanel("💵", "Fee Details", accent, (
            <div>
              <div style={ffRowStyle}>
                <FFSelect label="Fee type" value={f.fee_type} onChange={v => uFee(f.id, "fee_type", v)} options={ASSUM_FEE_TYPE} />
                <FFSelect label="Basis" value={f.basis} onChange={v => uFee(f.id, "basis", v)} options={ASSUM_FEE_BASIS} />
              </div>
              <div style={ffRowStyle}>
                <FFInput label="Amount / Rate" value={f.amount} onChange={v => uFee(f.id, "amount", v)} type="number" placeholder="e.g. 3300 or 0.5" />
                <FFSelect label="Frequency" value={f.frequency} onChange={v => uFee(f.id, "frequency", v)} options={ASSUM_FEE_FREQ} />
              </div>
              <div style={ffRowStyle}>
                <FFInput label="Start (date or FY)" value={f.start_date} onChange={v => uFee(f.id, "start_date", v)} placeholder="e.g. 2025/26" />
                <FFInput label="End (optional)" value={f.end_date} onChange={v => uFee(f.id, "end_date", v)} placeholder="Ongoing" />
              </div>
            </div>
          )); })()}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// ADVICE — Portfolio Form (Base44-aligned)
// ===========================================================================

const RISK_PROFILE_ALLOCS = {
  cash: { "Aus Equities": 0, "Intl Equities": 0, "Property & Infra": 0, Alternatives: 0, "Growth Exp": 0, "Aus Fixed Int": 0, "Intl Fixed Int": 0, Cash: 100, "Defensive Exp": 100 },
  conservative: { "Aus Equities": 13, "Intl Equities": 13, "Property & Infra": 4, Alternatives: 0, "Growth Exp": 30, "Aus Fixed Int": 35, "Intl Fixed Int": 15, Cash: 20, "Defensive Exp": 70 },
  moderately_conservative: { "Aus Equities": 22.5, "Intl Equities": 22.5, "Property & Infra": 5, Alternatives: 0, "Growth Exp": 50, "Aus Fixed Int": 25, "Intl Fixed Int": 10, Cash: 15, "Defensive Exp": 50 },
  balanced: { "Aus Equities": 31.5, "Intl Equities": 31.5, "Property & Infra": 7, Alternatives: 0, "Growth Exp": 70, "Aus Fixed Int": 14, "Intl Fixed Int": 7, Cash: 9, "Defensive Exp": 30 },
  growth: { "Aus Equities": 39, "Intl Equities": 39, "Property & Infra": 7, Alternatives: 0, "Growth Exp": 85, "Aus Fixed Int": 7.5, "Intl Fixed Int": 4.5, Cash: 3, "Defensive Exp": 15 },
  high_growth: { "Aus Equities": 45, "Intl Equities": 45, "Property & Infra": 8, Alternatives: 0, "Growth Exp": 98, "Aus Fixed Int": 0, "Intl Fixed Int": 0, Cash: 2, "Defensive Exp": 2 },
};
const RISK_PROFILE_NAMES = { cash: "Cash", conservative: "Conservative", moderately_conservative: "Moderately Conservative", balanced: "Balanced", growth: "Growth", high_growth: "High Growth" };
const GROWTH_CLASSES = ["Aus Equities", "Intl Equities", "Property & Infra", "Alternatives"];
const DEFENSIVE_CLASSES = ["Aus Fixed Int", "Intl Fixed Int", "Cash"];
const PORT_TXN_TYPES = [{ value: "Buy", label: "Buy" }, { value: "Sell", label: "Sell" }, { value: "Switch", label: "Switch" }];

const portId = () => "ptx_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
const portFmt = (v) => { const n = parseFloat(v); if (isNaN(n)) return "—"; return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n); };

export function PortfolioForm({ factFind, updateFF }) {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [editId, setEditId] = useState(null);

  const data = factFind.advice_request?.portfolio || { transactions: [] };
  const txns = data.transactions || [];
  const save = (d) => updateFF("advice_request.portfolio", d);

  // Build product list from fact find
  const products = [];
  // Super funds
  (factFind.superannuation?.funds || []).forEach((f, i) => products.push({ id: `super_${i}`, name: `Super – ${f.fund_name || f.provider || "Super"}`, type: "Superannuation", owner: f.s_owner || f.person }));
  // Pensions
  (factFind.superannuation?.pensions || []).forEach((p, i) => products.push({ id: `pension_${i}`, name: `Pension – ${p.fund_name || p.provider || "Pension"}`, type: "Pension", owner: p.p_owner || p.person }));
  // Investments / wraps
  (factFind.investment?.wraps || []).forEach((w, i) => products.push({ id: `inv_${i}`, name: w.platform_name || w.name || "Investment", type: "Investment", owner: w.w_owner || w.person }));
  // Bonds
  (factFind.investment?.bonds || []).forEach((b, i) => products.push({ id: `bond_${i}`, name: b.bond_name || b.name || "Bond", type: "Investment", owner: b.b_owner || b.person }));
  // SMSF
  (factFind.smsf?.smsf_details || []).forEach((fund, fi) => {
    if (fund.acct_type === "1") products.push({ id: `smsf_${fi}`, name: fund.smsf_name || "SMSF", type: "SMSF", owner: null });
    else (fund.accounts || []).forEach((acc, ai) => products.push({ id: `smsf_${fi}_${ai}`, name: `${fund.smsf_name || "SMSF"} – ${acc.owner || "Account"}`, type: "SMSF", owner: acc.owner }));
  });

  // Resolve owner to risk profile
  const cn = (key) => { const p = factFind.personal; if (!p) return key; if (key === "client" || key === "client1") return (p.first_name || "") + " " + (p.last_name || ""); if (key === "partner" || key === "client2") return (p.partner?.first_name || "") + " " + (p.partner?.last_name || ""); return key || "Unknown"; };

  const getTargetAlloc = () => {
    if (!selectedProduct) return null;
    const prod = products.find(p => p.id === selectedProduct);
    if (!prod?.owner) return null;
    const role = prod.owner === "client" || prod.owner === "client1" ? "client" : prod.owner === "partner" || prod.owner === "client2" ? "partner" : null;
    if (!role) return null;
    const rp = factFind.risk_profile?.[role];
    const prof = rp?.adjustedProfile || rp?.profile;
    if (!prof) return null;
    const key = prof.toLowerCase().replace(/ /g, "_");
    return { alloc: RISK_PROFILE_ALLOCS[key], profileName: RISK_PROFILE_NAMES[key] || prof, ownerName: cn(role) };
  };

  // Holdings from transactions
  const getHoldings = () => {
    if (!selectedProduct) return [];
    const map = {};
    txns.filter(t => t.product_id === selectedProduct).forEach(t => {
      if (!t.investment_option) return;
      if (!map[t.investment_option]) map[t.investment_option] = { name: t.investment_option, amount: 0 };
      const amt = parseFloat(t.amount) || 0;
      if (t.type === "Buy") map[t.investment_option].amount += amt;
      else if (t.type === "Sell") map[t.investment_option].amount -= amt;
    });
    return Object.values(map).filter(h => h.amount > 0);
  };

  const holdings = getHoldings();
  const totalVal = holdings.reduce((s, h) => s + h.amount, 0);
  const target = getTargetAlloc();

  // Transaction CRUD
  const addTxn = () => { const t = { id: portId(), product_id: "", type: "Buy", investment_option: "", amount: "", units: "" }; save({ ...data, transactions: [...txns, t] }); setEditId(t.id); };
  const uTxn = (id, f, v) => save({ ...data, transactions: txns.map(t => t.id === id ? { ...t, [f]: v } : t) });
  const rmTxn = (id) => { save({ ...data, transactions: txns.filter(t => t.id !== id) }); if (editId === id) setEditId(null); };

  const accent = "#059669";
  const thS = { padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--ps-border)", textAlign: "left" };
  const tdS = { padding: "10px 10px", fontSize: 13, color: "var(--ps-text-body)", borderBottom: "1px solid var(--ps-border-light)" };
  const actBtn = (onClick, color, label) => <button onClick={e => { e.stopPropagation(); onClick(); }} style={{ padding: "3px 8px", borderRadius: 4, border: "none", background: "transparent", color, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{label}</button>;

  // Product grouped dropdown
  const prodSelect = (value, onChange, style) => (
    <select value={value || ""} onChange={e => onChange(e.target.value)} style={style || ffSelectStyle}>
      <option value="">Select product...</option>
      {["Superannuation", "Pension", "Investment", "SMSF"].map(type => {
        const items = products.filter(p => p.type === type);
        return items.length > 0 ? <optgroup key={type} label={type}>{items.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup> : null;
      })}
    </select>
  );

  return (
    <div>
      {/* ═══════ TOP: Allocation Analysis (side by side) ═══════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

        {/* LEFT: Current Allocation */}
        <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: "var(--ps-surface-alt)", borderBottom: "1px solid var(--ps-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>📊 Current Allocation</div>
            {prodSelect(selectedProduct, setSelectedProduct, { ...ffSelectStyle, maxWidth: 220, fontSize: 12 })}
          </div>
          <div style={{ padding: 16 }}>
            {!selectedProduct ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "var(--ps-text-subtle)" }}><div style={{ fontSize: 32, marginBottom: 6 }}>📈</div><div style={{ fontSize: 13 }}>Select a product to view allocation</div></div>
            ) : holdings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "var(--ps-text-subtle)" }}><div style={{ fontSize: 32, marginBottom: 6 }}>📊</div><div style={{ fontSize: 13 }}>No holdings — add transactions below</div></div>
            ) : (
              <div>
                {holdings.map((h, i) => {
                  const pct = totalVal > 0 ? (h.amount / totalVal * 100) : 0;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 130, fontSize: 12, fontWeight: 500, color: "var(--ps-text-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.name}</div>
                      <div style={{ flex: 1, height: 10, background: "var(--ps-border)", borderRadius: 5, overflow: "hidden" }}>
                        <div style={{ width: pct + "%", height: "100%", background: accent, borderRadius: 5, transition: "width 0.3s" }} />
                      </div>
                      <div style={{ width: 50, fontSize: 12, textAlign: "right", color: "var(--ps-text-secondary)" }}>{pct.toFixed(1)}%</div>
                      <div style={{ width: 80, fontSize: 12, textAlign: "right", color: "var(--ps-text-muted)" }}>{portFmt(h.amount)}</div>
                    </div>
                  );
                })}
                <div style={{ borderTop: "1px solid var(--ps-border)", paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13, color: "var(--ps-text-primary)" }}>
                  <span>Total</span><span>{portFmt(totalVal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Target vs Current */}
        <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: "var(--ps-surface-alt)", borderBottom: "1px solid var(--ps-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>⚖️ Target vs Current</div>
            {target && <span style={{ padding: "4px 10px", borderRadius: 6, background: "var(--ps-bg-blue-200)", color: "#1E40AF", fontSize: 11, fontWeight: 600 }}>🎯 {target.ownerName} — {target.profileName}</span>}
          </div>
          <div style={{ padding: 16 }}>
            {!selectedProduct ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "var(--ps-text-subtle)" }}><div style={{ fontSize: 32, marginBottom: 6 }}>🎯</div><div style={{ fontSize: 13 }}>Select a product to view targets</div></div>
            ) : !target ? (
              <div style={{ padding: 12, borderRadius: 8, background: "var(--ps-surface-amber)", border: "1px solid var(--ps-ring-amber)", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ps-badge-amber)" }}>⚠️ Set a risk profile in Fact Find to see target allocation</div>
            ) : (
              <div>
                <div style={{ marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid var(--ps-border)" }}>
                  <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Growth / Defensive Split</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ps-text-body)" }}>{target.alloc["Growth Exp"]}% Growth / {target.alloc["Defensive Exp"]}% Defensive</div>
                </div>
                {/* Header */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 70px", gap: 4, padding: "6px 0", borderBottom: "1px solid var(--ps-border)", fontSize: 10, fontWeight: 700, color: "var(--ps-text-subtle)", textTransform: "uppercase" }}>
                  <div>Asset Class</div><div style={{ textAlign: "center" }}>Target</div><div style={{ textAlign: "center" }}>Current</div><div style={{ textAlign: "center" }}>Div</div>
                </div>
                {/* Growth rows */}
                {GROWTH_CLASSES.map(ac => { const t = target.alloc[ac] || 0; return (
                  <div key={ac} style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 70px", gap: 4, padding: "5px 0", borderBottom: "1px solid var(--ps-surface-alt)", fontSize: 12 }}>
                    <div style={{ color: "var(--ps-text-body)" }}>{ac}</div><div style={{ textAlign: "center" }}>{t.toFixed(1)}%</div><div style={{ textAlign: "center", color: "var(--ps-text-subtle)" }}>—</div><div style={{ textAlign: "center", fontWeight: 600, color: t > 0 ? "var(--ps-red)" : "var(--ps-text-muted)" }}>{(-t).toFixed(1)}%</div>
                  </div>
                ); })}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 70px", gap: 4, padding: "5px 0", background: "var(--ps-surface-blue)", fontWeight: 700, fontSize: 12, color: "#1E40AF" }}>
                  <div>Growth Exp</div><div style={{ textAlign: "center" }}>{target.alloc["Growth Exp"]?.toFixed(1)}%</div><div style={{ textAlign: "center" }}>—</div><div style={{ textAlign: "center" }}>—</div>
                </div>
                {/* Defensive rows */}
                {DEFENSIVE_CLASSES.map(ac => { const t = target.alloc[ac] || 0; return (
                  <div key={ac} style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 70px", gap: 4, padding: "5px 0", borderBottom: "1px solid var(--ps-surface-alt)", fontSize: 12 }}>
                    <div style={{ color: "var(--ps-text-body)" }}>{ac}</div><div style={{ textAlign: "center" }}>{t.toFixed(1)}%</div><div style={{ textAlign: "center", color: "var(--ps-text-subtle)" }}>—</div><div style={{ textAlign: "center", fontWeight: 600, color: t > 0 ? "var(--ps-red)" : "var(--ps-text-muted)" }}>{(-t).toFixed(1)}%</div>
                  </div>
                ); })}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 70px", gap: 4, padding: "5px 0", background: "var(--ps-surface-blue)", fontWeight: 700, fontSize: 12, color: "#1E40AF" }}>
                  <div>Def Exp</div><div style={{ textAlign: "center" }}>{target.alloc["Defensive Exp"]?.toFixed(1)}%</div><div style={{ textAlign: "center" }}>—</div><div style={{ textAlign: "center" }}>—</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ BOTTOM: Transactions Table ═══════ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>Portfolio Transactions</div>
        <button onClick={addTxn} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: accent, color: "var(--ps-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Transaction</button>
      </div>
      {txns.length === 0 ? (
        <div style={{ padding: "40px 24px", textAlign: "center", border: "2px dashed var(--ps-border)", borderRadius: 12 }}><div style={{ fontSize: 36, marginBottom: 8 }}>📊</div><div style={{ fontSize: 13, color: "var(--ps-text-subtle)" }}>No transactions yet — click "Add Transaction" to start</div></div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={{ ...thS, width: "22%" }}>Product</th>
            <th style={{ ...thS, width: "10%" }}>Type</th>
            <th style={{ ...thS, width: "28%" }}>Investment Option</th>
            <th style={{ ...thS, width: "15%", textAlign: "right" }}>Amount</th>
            <th style={{ ...thS, width: "13%", textAlign: "right" }}>Units</th>
            <th style={{ ...thS, width: "12%", textAlign: "right" }}>Actions</th>
          </tr></thead>
          <tbody>{txns.map(t => {
            const isEd = editId === t.id;
            const inpS = { width: "100%", padding: "5px 8px", border: "1px solid var(--ps-border-mid)", borderRadius: 5, fontSize: 12 };
            return (
              <tr key={t.id} style={{ background: isEd ? "var(--ps-surface-green)" : "transparent" }}>
                <td style={tdS}>{isEd ? prodSelect(t.product_id, v => uTxn(t.id, "product_id", v), { ...inpS, maxWidth: "100%" }) : (products.find(p => p.id === t.product_id)?.name || "—")}</td>
                <td style={tdS}>{isEd ? (
                  <select value={t.type} onChange={e => uTxn(t.id, "type", e.target.value)} style={inpS}>
                    {PORT_TXN_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : t.type}</td>
                <td style={tdS}>{isEd ? <input value={t.investment_option || ""} onChange={e => uTxn(t.id, "investment_option", e.target.value)} placeholder="e.g. Vanguard Growth" style={inpS} /> : (t.investment_option || "—")}</td>
                <td style={{ ...tdS, textAlign: "right" }}>{isEd ? <input type="number" value={t.amount || ""} onChange={e => uTxn(t.id, "amount", e.target.value)} placeholder="0" style={{ ...inpS, textAlign: "right" }} /> : portFmt(t.amount)}</td>
                <td style={{ ...tdS, textAlign: "right" }}>{isEd ? <input value={t.units || ""} onChange={e => uTxn(t.id, "units", e.target.value)} placeholder="—" style={{ ...inpS, textAlign: "right" }} /> : (t.units || "—")}</td>
                <td style={{ ...tdS, textAlign: "right" }}>
                  {isEd ? (
                    <>{actBtn(() => setEditId(null), accent, "✓")}{actBtn(() => { if (!t.product_id && !t.investment_option && !t.amount) rmTxn(t.id); else setEditId(null); }, "var(--ps-text-subtle)", "✕")}</>
                  ) : (
                    <>{actBtn(() => setEditId(t.id), accent, "✎")}{actBtn(() => rmTxn(t.id), "#DC2626", "✕")}</>
                  )}
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      )}
    </div>
  );
}

