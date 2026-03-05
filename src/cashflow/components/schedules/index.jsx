import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart, Cell, LineChart, Line, ReferenceLine } from "recharts";
import { EntityBadge, entityColor } from "../../constants/entities.jsx";
import { SectionTable } from "../common/SectionTable.jsx";

// Full Financial Summary data structure
// FINANCIAL_SUMMARY_DATA is now built dynamically inside the component.
// See buildFinancialSummaryData().


// savingsData and cashflowChartData are now built dynamically inside the component.
// See buildSavingsData() and buildCashflowChartData().

export function CashflowSavingsPage({ savingsData, cashflowChartData }) {
  const [showDashboard, setShowDashboard] = useState(true);
  const fC = (v) => {
    if (v === 0) return "$0";
    if (v < 0) return `-$${Math.abs(v).toLocaleString("en-AU")}`;
    return `$${v.toLocaleString("en-AU")}`;
  };

  // KPIs
  if (!cashflowChartData || cashflowChartData.length === 0) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--ps-text-subtle)", fontSize: 14 }}>No cashflow data — add income and expenses in Fact Find</div>;
  }
  const yr1 = cashflowChartData[0];
  const yrL = cashflowChartData[cashflowChartData.length - 1];
  const totalSurplus = cashflowChartData.reduce((s, d) => s + d.surplus, 0);
  const avgSurplus = Math.round(totalSurplus / cashflowChartData.length);
  const deficitYears = cashflowChartData.filter(d => d.surplus < 0).length;

  const kpis = [
    { label: "Year 1 Surplus", value: fC(yr1.surplus), color: yr1.surplus >= 0 ? "var(--ps-green)" : "var(--ps-red)" },
    { label: "Average Annual Surplus", value: fC(avgSurplus), color: avgSurplus >= 0 ? "var(--ps-green)" : "var(--ps-red)" },
    { label: "Final Year Balance", value: fC(yrL.endValue), color: yrL.endValue >= 0 ? "var(--ps-green)" : "var(--ps-red)" },
    { label: "Deficit Years", value: deficitYears === 0 ? "None" : `${deficitYears} of ${cashflowChartData.length}`, color: deficitYears === 0 ? "var(--ps-green)" : "var(--ps-amber)" },
  ];

  const formatTooltip = (v) => {
    if (typeof v !== "number") return v;
    if (v < 0) return `-$${Math.abs(v).toLocaleString("en-AU")}`;
    return `$${v.toLocaleString("en-AU")}`;
  };

  return (
    <div>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            padding: "14px 18px", borderRadius: 12,
            background: "var(--ps-surface)", border: "1px solid var(--ps-border)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{
        background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)",
        padding: "20px 16px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>Annual Cashflow Waterfall</div>
        <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginBottom: 16 }}>
          Start-of-year adjustments + income/expense surplus + end-of-year capital movements
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={cashflowChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v === 0 ? "$0" : `${v < 0 ? "-" : ""}$${Math.abs(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}
              labelFormatter={(label) => `FY ${label}`}
            />
            <Legend
              iconType="square"
              wrapperStyle={{ fontSize: 11, color: "var(--ps-text-muted)" }}
            />
            <ReferenceLine y={0} stroke="var(--ps-text-subtle)" strokeDasharray="3 3" />
            <Bar dataKey="startAdj" name="Adjustments (SOY)" fill="#7C3AED" radius={[2, 2, 0, 0]} />
            <Bar dataKey="surplus" name="Surplus / Deficit" fill="#059669" radius={[2, 2, 0, 0]}>
              {cashflowChartData.map((entry, i) => (
                <Cell key={i} fill={entry.surplus >= 0 ? "var(--ps-green)" : "var(--ps-red)"} />
              ))}
            </Bar>
            <Bar dataKey="endAdj" name="Capital Movements (EOY)" fill="#3B82F6" radius={[2, 2, 0, 0]} />
            <Line dataKey="endValue" name="End Balance" type="monotone" stroke="var(--ps-text-strongest)" strokeWidth={2} dot={{ r: 3, fill: "var(--ps-text-strongest)" }} />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Colour legend explanation */}
        <div style={{ display: "flex", gap: 24, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--ps-border-light)" }}>
          {[
            { color: "#7C3AED", label: "Inheritance, asset sales, bond withdrawals less NCC, bond contributions, asset purchases" },
            { color: "var(--ps-green)", label: "Income minus expenses (green = surplus, red = deficit)" },
            { color: "#3B82F6", label: "Super withdrawals, cashflow adjustments, debt repayments" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, flex: 1 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 11, color: "var(--ps-text-muted)", lineHeight: "1.4" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Income vs Expenses breakdown */}
      <div style={{
        background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)",
        padding: "20px 16px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 16 }}>Income vs Expenses</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={cashflowChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v === 0 ? "$0" : `${v < 0 ? "-" : ""}$${Math.abs(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}
              labelFormatter={(label) => `FY ${label}`}
            />
            <Legend iconType="square" wrapperStyle={{ fontSize: 11, color: "var(--ps-text-muted)" }} />
            <ReferenceLine y={0} stroke="var(--ps-text-subtle)" strokeDasharray="3 3" />
            <Bar dataKey="income" name="Total Income" fill="#059669" radius={[2, 2, 0, 0]} />
            <Bar dataKey="expenses" name="Total Expenses" fill="#DC2626" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      </>)}

      {/* Full data table */}
      <SectionTable data={savingsData} />
    </div>
  );
}

// Cashflow/Tax > Tax > Client 1 data
// TAX_CLIENT1_DATA and TAX_CHART_DATA are now built dynamically inside the component.
// See buildTaxData().

export function TaxSchedulePage({ data, chartData, clientName }) {
  const [showDashboard, setShowDashboard] = useState(true);
  const fC = (v) => {
    if (v === 0) return "$0";
    if (v < 0) return `-$${Math.abs(v).toLocaleString("en-AU")}`;
    return `$${v.toLocaleString("en-AU")}`;
  };

  const yr1 = chartData[0];
  const yrL = chartData[chartData.length - 1];
  const totalFinalTax = chartData.reduce((s, d) => s + d.finalTax, 0);
  const totalLevies = chartData.reduce((s, d) => s + d.levies, 0);
  const totalOffsets = chartData.reduce((s, d) => s + d.offsets, 0);
  const avgEffectiveRate = chartData.reduce((s, d) => s + (d.taxableIncome > 0 ? d.finalTax / d.taxableIncome : 0), 0) / chartData.length;

  const tiles = [
    { label: "Year 1 Taxable Income", value: fC(yr1.taxableIncome), sub: `Final tax: ${fC(yr1.finalTax)}`, color: "#4F46E5" },
    { label: "Total Tax Paid (12 yrs)", value: fC(totalFinalTax), sub: `Avg ${fC(Math.round(totalFinalTax / chartData.length))}/yr`, color: "var(--ps-red)" },
    { label: "Total Levies", value: fC(totalLevies), sub: `Medicare levy + surcharge`, color: "#D97706" },
    { label: "Total Offsets", value: fC(totalOffsets), sub: `LITO, SAPTO, franking`, color: "var(--ps-green)" },
    { label: "Avg Effective Tax Rate", value: `${(avgEffectiveRate * 100).toFixed(1)}%`, sub: `Final tax ÷ taxable income`, color: "#7C3AED" },
    { label: "Retirement Tax Drop", value: fC(yr1.finalTax - yrL.finalTax), sub: `Yr 1 vs Yr ${chartData.length}`, color: yr1.finalTax > yrL.finalTax ? "var(--ps-green)" : "var(--ps-red)" },
  ];

  const formatTooltip = (v) => typeof v === "number" ? fC(v) : v;

  // Effective tax rate per year for the line
  const chartDataWithRate = chartData.map(d => ({
    ...d,
    effectiveRate: d.taxableIncome > 0 ? Math.round(d.finalTax / d.taxableIncome * 1000) / 10 : 0,
  }));

  return (
    <div>
      {/* Tiles */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button onClick={() => setShowDashboard(p => !p)} style={{
          padding: "5px 14px", borderRadius: 6, border: "1px solid var(--ps-border)", background: showDashboard ? "var(--ps-surface-alt)" : "var(--ps-surface-indigo)",
          color: showDashboard ? "var(--ps-text-muted)" : "#4F46E5", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        }}>
          {showDashboard ? "▼ Hide" : "▶ Show"} Dashboard & Charts
        </button>
      </div>
      {showDashboard && (<>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {tiles.map((tile, i) => (
          <div key={i} style={{
            padding: "14px 18px", borderRadius: 12,
            background: "var(--ps-surface)", border: "1px solid var(--ps-border)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{tile.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: tile.color, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{tile.value}</div>
            <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginTop: 2 }}>{tile.sub}</div>
          </div>
        ))}
      </div>

      {/* Final Tax chart */}
      <div style={{
        background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)",
        padding: "20px 16px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>
          Annual Tax Schedule — {clientName || "Client"}
        </div>
        <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginBottom: 16 }}>
          Tax payable, levies, and offsets with effective tax rate overlay
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartDataWithRate} margin={{ top: 10, right: 50, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "#7C3AED" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 50]}
            />
            <Tooltip
              formatter={(v, name) => name === "Effective Rate" ? `${v}%` : fC(v)}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}
              labelFormatter={(label) => `FY ${label}`}
            />
            <Legend iconType="square" wrapperStyle={{ fontSize: 11, color: "var(--ps-text-muted)" }} />
            <Bar yAxisId="left" dataKey="taxPayable" name="Tax Payable" stackId="tax" fill="#DC2626" radius={[0, 0, 0, 0]} />
            <Bar yAxisId="left" dataKey="levies" name="Medicare Levy" stackId="tax" fill="#F59E0B" radius={[0, 0, 0, 0]} />
            <Bar yAxisId="left" dataKey="offsets" name="Offsets (reduction)" stackId="offset" fill="#059669" radius={[2, 2, 0, 0]} />
            <Line yAxisId="right" dataKey="effectiveRate" name="Effective Rate" type="monotone" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3, fill: "#7C3AED" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Income vs Tax waterfall */}
      <div style={{
        background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)",
        padding: "20px 16px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 16 }}>Taxable Income vs Final Tax</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartDataWithRate} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}
              labelFormatter={(label) => `FY ${label}`}
            />
            <Legend iconType="square" wrapperStyle={{ fontSize: 11, color: "var(--ps-text-muted)" }} />
            <Bar dataKey="taxableIncome" name="Taxable Income" fill="#4F46E5" radius={[3, 3, 0, 0]} opacity={0.35} />
            <Bar dataKey="finalTax" name="Final Tax Payable" fill="#DC2626" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      </>)}

      {/* Table */}
      <SectionTable data={data} />
    </div>
  );
}

// CGT and Unrealised CGT data is now computed dynamically in the engine — see buildCGTEngine();

export function CGTPage({ data, chartData, clientName, trustIdx, beneficiaries, streamingConfig, onUpdateStreaming, isTrust }) {
  const [showDashboard, setShowDashboard] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const fC = (v) => {
    if (v === 0) return "$0";
    if (v < 0) return `-$${Math.abs(v).toLocaleString("en-AU")}`;
    return `$${v.toLocaleString("en-AU")}`;
  };

  const totalAssessable = chartData.reduce((s, d) => s + d.assessable, 0);
  const totalFinalNet = chartData.reduce((s, d) => s + d.finalNet, 0);
  const totalDiscount = chartData.reduce((s, d) => s + d.discountApplied, 0);
  const cgtYears = chartData.filter(d => d.assessable > 0).length;

  const kpis = [
    { label: "Total Assessable CGT", value: fC(totalAssessable), color: "#7C3AED" },
    { label: "Total Discount Applied", value: fC(totalDiscount), color: "var(--ps-green)" },
    { label: "Total Final Net CGT", value: fC(totalFinalNet), color: "var(--ps-red)" },
    { label: "CGT Event Years", value: cgtYears === 0 ? "None" : `${cgtYears} of ${chartData.length}`, color: cgtYears === 0 ? "var(--ps-green)" : "var(--ps-amber)" },
  ];

  const formatTooltip = (v) => {
    if (typeof v !== "number") return v;
    return fC(v);
  };

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button onClick={() => setShowDashboard(p => !p)} style={{
          padding: "5px 14px", borderRadius: 6, border: "1px solid var(--ps-border)", background: showDashboard ? "var(--ps-surface-alt)" : "var(--ps-surface-indigo)",
          color: showDashboard ? "var(--ps-text-muted)" : "#4F46E5", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        }}>
          {showDashboard ? "▼ Hide" : "▶ Show"} Dashboard & Charts
        </button>
      </div>
      {showDashboard && (<>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            padding: "14px 18px", borderRadius: 12,
            background: "var(--ps-surface)", border: "1px solid var(--ps-border)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{
        background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)",
        padding: "20px 16px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>
          Capital Gains Tax — {clientName || "Client"}
        </div>
        <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginBottom: 16 }}>
          Assessable CGT before discount vs final net CGT after 50% discount
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barCategoryGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}
              labelFormatter={(label) => `FY ${label}`}
            />
            <Legend iconType="square" wrapperStyle={{ fontSize: 11, color: "var(--ps-text-muted)" }} />
            <Bar dataKey="assessable" name="Assessable CGT" fill="#7C3AED" radius={[3, 3, 0, 0]} barSize={28} />
            <Bar dataKey="finalNet" name="Final Net CGT" fill="#DC2626" radius={[3, 3, 0, 0]} barSize={28} />
            <Line dataKey="carriedLosses" name="Carried Losses" type="monotone" stroke="var(--ps-text-subtle)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      </>)}

      {/* Table */}
      <SectionTable data={data} />

      {/* ── CGT Streaming Distribution (trusts only) ── */}
      {isTrust && beneficiaries && beneficiaries.length > 0 && (() => {
        const config = streamingConfig || { enabled: false, allocations: [] };
        const netCGTVals = chartData.map(d => d.finalNet);
        const years = data?.years || [];
        const hasAnyCGT = netCGTVals.some(v => v > 0);
        if (!hasAnyCGT) return null;

        const toggleEnabled = () => {
          const updated = { ...config, enabled: !config.enabled };
          if (!updated.allocations || updated.allocations.length === 0) {
            updated.allocations = beneficiaries.map(b => ({
              name: b.benef_entity || "Unknown",
              pct: parseFloat(b.benef_entitlement) || 0,
              overrides: {},  // year index → override amount
            }));
          }
          onUpdateStreaming?.(updated);
        };

        const updateAllocPct = (idx, value) => {
          const allocs = [...(config.allocations || [])];
          allocs[idx] = { ...allocs[idx], pct: value };
          onUpdateStreaming?.({ ...config, allocations: allocs });
        };

        const updateAllocOverride = (idx, yearIdx, value) => {
          const allocs = [...(config.allocations || [])];
          const overrides = { ...(allocs[idx].overrides || {}) };
          if (value === "" || value === undefined) delete overrides[yearIdx];
          else overrides[yearIdx] = value;
          allocs[idx] = { ...allocs[idx], overrides };
          onUpdateStreaming?.({ ...config, allocations: allocs });
        };

        const allocs = config.allocations || [];
        const totalPct = allocs.reduce((s, a) => s + (parseFloat(a.pct) || 0), 0);

        // Calculate per-year streamed amounts per beneficiary
        const streamedPerBenef = allocs.map(a => {
          const pct = (parseFloat(a.pct) || 0) / 100;
          const overrides = a.overrides || {};
          return netCGTVals.map((v, y) => {
            const ov = overrides[y];
            if (ov !== undefined && ov !== "") return Math.min(parseFloat(ov) || 0, v);
            return Math.round(v * pct);
          });
        });
        const totalStreamed = netCGTVals.map((_, y) => streamedPerBenef.reduce((s, bVals) => s + bVals[y], 0));
        const remainsOnTrust = netCGTVals.map((v, y) => Math.max(0, v - totalStreamed[y]));

        const cs = { padding: "5px 12px", fontSize: 13, textAlign: "right", whiteSpace: "nowrap", borderBottom: "1px solid var(--ps-border-light)" };
        const hcs = { padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "var(--ps-text-secondary)", fontSize: 12, minWidth: 95, background: "var(--ps-surface-alt)", whiteSpace: "nowrap", borderBottom: "2px solid var(--ps-border)" };
        const stickyLabel = { padding: "5px 16px", fontSize: 13, position: "sticky", left: 0, zIndex: 1, minWidth: 260, borderBottom: "1px solid var(--ps-border-light)" };

        return (
          <div style={{ marginTop: 20, border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden" }}>
            <div style={{
              padding: "14px 18px", background: "var(--ps-bg-amber-200)", borderBottom: "1px solid var(--ps-ring-amber)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>🔀</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-badge-amber)" }}>CGT Streaming to Beneficiaries</div>
                  <div style={{ fontSize: 11, color: "#A16207" }}>% sets the default — click any year to override</div>
                </div>
              </div>
              <button onClick={toggleEnabled} style={{
                padding: "6px 16px", borderRadius: 20,
                border: config.enabled ? "1px solid #059669" : "1px solid var(--ps-border-input)",
                background: config.enabled ? "var(--ps-surface-emerald)" : "#F9FAFB",
                color: config.enabled ? "var(--ps-green)" : "var(--ps-text-muted)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                {config.enabled ? "✓ Streaming On" : "Off"}
              </button>
            </div>

            {config.enabled && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                  <thead>
                    <tr>
                      <th style={{ position: "sticky", left: 0, zIndex: 2, background: "var(--ps-surface-alt)", padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-secondary)", borderBottom: "2px solid var(--ps-border)", minWidth: 260, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Year</th>
                      {years.map((yr, yi) => <th key={yi} style={hcs}>{yr}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Net Capital Gain row */}
                    <tr style={{ borderBottom: "1px solid var(--ps-border)", background: "var(--ps-surface-alt)" }}>
                      <td style={{ ...stickyLabel, background: "var(--ps-surface-alt)", fontWeight: 700, color: "var(--ps-text-primary)" }}>Net Capital Gain (Assessable)</td>
                      {netCGTVals.map((v, y) => <td key={y} style={{ ...cs, fontWeight: 700, color: v > 0 ? "#7C3AED" : "var(--ps-text-subtle)" }}>{fC(v)}</td>)}
                    </tr>

                    {/* Per beneficiary — every cell clickable to override year-by-year */}
                    {allocs.map((a, bi) => {
                      const vals = streamedPerBenef[bi];
                      const overrides = a.overrides || {};
                      const defaultPct = (parseFloat(a.pct) || 0) / 100;
                      return (
                        <tr key={bi} style={{ borderBottom: "1px solid var(--ps-border-light)" }}>
                          <td style={{ ...stickyLabel, background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 600 }}>{a.name}</span>
                              <span style={{ fontSize: 11, color: "var(--ps-text-subtle)", display: "flex", alignItems: "center", gap: 2 }}>
                                default
                                <input type="number" value={a.pct} onChange={e => updateAllocPct(bi, e.target.value)}
                                  style={{ width: 42, padding: "1px 4px", borderRadius: 4, border: "1px solid var(--ps-border)", fontSize: 11, textAlign: "center" }} />%
                              </span>
                            </div>
                          </td>
                          {vals.map((v, y) => {
                            const isOverridden = overrides[y] !== undefined && overrides[y] !== "";
                            const cellKey = `${bi}_${y}`;
                            const isEditing = editingCell === cellKey;
                            return (
                              <td key={y} style={{
                                ...cs, color: v > 0 ? "var(--ps-green)" : "var(--ps-text-subtle)", fontWeight: v > 0 ? 600 : 400,
                                background: isOverridden ? "var(--ps-surface-amber)" : "transparent", cursor: "pointer",
                              }} onClick={() => { if (!isEditing) setEditingCell(cellKey); }}>
                                {isEditing ? (
                                  <input type="number" autoFocus
                                    defaultValue={isOverridden ? overrides[y] : ""}
                                    placeholder={String(Math.round(netCGTVals[y] * defaultPct))}
                                    onBlur={e => { updateAllocOverride(bi, y, e.target.value); setEditingCell(null); }}
                                    onKeyDown={e => { if (e.key === "Enter") { updateAllocOverride(bi, y, e.target.value); setEditingCell(null); } if (e.key === "Escape") setEditingCell(null); }}
                                    style={{ width: 80, padding: "3px 6px", borderRadius: 4, border: "2px solid #4F46E5", fontSize: 13, textAlign: "right", outline: "none" }} />
                                ) : (
                                  <span>{fC(v)}{isOverridden && <span style={{ fontSize: 10, color: "#D97706", marginLeft: 3 }}>✎</span>}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    {/* Total Streamed */}
                    <tr style={{ borderTop: "2px solid var(--ps-border)", background: "var(--ps-surface-green)" }}>
                      <td style={{ ...stickyLabel, background: "var(--ps-surface-green)", fontWeight: 700, color: "var(--ps-green)" }}>Total Streamed to Beneficiaries</td>
                      {totalStreamed.map((v, y) => <td key={y} style={{ ...cs, fontWeight: 700, color: "var(--ps-green)" }}>{fC(v)}</td>)}
                    </tr>

                    {/* Remains on Trust */}
                    <tr style={{ background: "var(--ps-surface-indigo)" }}>
                      <td style={{ ...stickyLabel, background: "var(--ps-surface-indigo)", fontWeight: 700, color: "#7C3AED" }}>Remains on Trust (Assessable)</td>
                      {remainsOnTrust.map((v, y) => <td key={y} style={{ ...cs, fontWeight: 700, color: v > 0 ? "#7C3AED" : "var(--ps-text-subtle)" }}>{fC(v)}</td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

    </div>
  );
}

// Unrealised CGT data is now computed dynamically — see buildCGTEngine();

export function UnrealisedCGTPage({ data, chartData, clientName }) {
  const [showDashboard, setShowDashboard] = useState(true);
  const fC = (v) => {
    if (v === 0) return "$0";
    if (v < 0) return `-$${Math.abs(v).toLocaleString("en-AU")}`;
    return `$${v.toLocaleString("en-AU")}`;
  };

  const yrL = chartData[chartData.length - 1];
  const yr1 = chartData[0];
  const peakGross = Math.max(...chartData.map(d => d.grossCGT));
  const peakYear = chartData.find(d => d.grossCGT === peakGross);

  const tiles = [
    { label: "Current Gross CGT", value: fC(yr1.grossCGT), sub: `Year 1 unrealised gains`, color: "#7C3AED" },
    { label: "Current Discount", value: fC(yr1.discount), sub: `50% CGT discount available`, color: "var(--ps-green)" },
    { label: "Current Tax Liability", value: fC(yr1.taxOnCGT), sub: `If all assets sold today`, color: "var(--ps-red)" },
    { label: "Final Year Gross CGT", value: fC(yrL.grossCGT), sub: `Year ${chartData.length} unrealised`, color: "#4F46E5" },
    { label: "Final Year Tax Liability", value: fC(yrL.taxOnCGT), sub: `Projected tax on disposal`, color: "var(--ps-red)" },
    { label: "Peak Exposure", value: fC(peakGross), sub: `${peakYear?.year || ""} — highest gross CGT`, color: "#D97706" },
  ];

  const formatTooltip = (v) => typeof v === "number" ? fC(v) : v;

  return (
    <div>
      {/* Tiles */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button onClick={() => setShowDashboard(p => !p)} style={{
          padding: "5px 14px", borderRadius: 6, border: "1px solid var(--ps-border)", background: showDashboard ? "var(--ps-surface-alt)" : "var(--ps-surface-indigo)",
          color: showDashboard ? "var(--ps-text-muted)" : "#4F46E5", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        }}>
          {showDashboard ? "▼ Hide" : "▶ Show"} Dashboard & Charts
        </button>
      </div>
      {showDashboard && (<>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {tiles.map((tile, i) => (
          <div key={i} style={{
            padding: "14px 18px", borderRadius: 12,
            background: "var(--ps-surface)", border: "1px solid var(--ps-border)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{tile.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: tile.color, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{tile.value}</div>
            <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginTop: 2 }}>{tile.sub}</div>
          </div>
        ))}
      </div>

      {/* Main chart */}
      <div style={{
        background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)",
        padding: "20px 16px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>
          Unrealised Capital Gains — {clientName || "Client"}
        </div>
        <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginBottom: 16 }}>
          Gross potential CGT, 50% discount applied, and estimated tax liability if all assets disposed
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barCategoryGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}
              labelFormatter={(label) => `FY ${label}`}
            />
            <Legend iconType="square" wrapperStyle={{ fontSize: 11, color: "var(--ps-text-muted)" }} />
            <Area dataKey="grossCGT" name="Gross Unrealised CGT" type="monotone" fill="#7C3AED" fillOpacity={0.12} stroke="#7C3AED" strokeWidth={2} dot={false} />
            <Area dataKey="discount" name="Discount Available" type="monotone" fill="#059669" fillOpacity={0.10} stroke="#059669" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            <Bar dataKey="taxOnCGT" name="Tax on Unrealised CGT" fill="#DC2626" radius={[3, 3, 0, 0]} barSize={24} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      </>)}

      {/* Table */}
      <SectionTable data={data} />
    </div>
  );
}

// Products > Superannuation > Super 1 data
export const SUPER1_DATA = {
  years: ["2025/2026","2026/2027","2027/2028","2028/2029","2029/2030","2030/2031","2031/2032","2032/2033","2033/2034","2034/2035","2035/2036","2036/2037"],
  sections: [
    {
      id: "super-header",
      rows: [
        { label: "Year", values: [1,2,3,4,5,6,7,8,9,10,11,12], style: "header" },
        { label: "Age", values: [60,61,62,63,64,65,66,67,68,69,70,71], style: "header" },
        { label: "Inflation Rate", values: ["3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%"], style: "child" },
        { label: "Revised Growth Rate", values: ["3.59%","5.50%","5.50%","5.50%","5.50%","5.50%","5.50%","5.50%","5.50%","5.50%","5.50%","5.50%"], style: "child" },
      ],
    },
    {
      id: "super-current",
      rows: [
        { label: "Current Value", values: [0,20026,42556,66317,91396,117851,147547,545662,575673,607335,640738,675979], style: "header" },
      ],
    },
    {
      id: "super-transactions",
      title: "Transactions",
      rows: [
        { label: "Non-Concessional", values: [0,0,0,0,0,0,390000,0,0,0,0,0], style: "child" },
        { label: "Lump Sum", values: [0,0,0,0,0,0,0,0,226016,196317,0,0], style: "child" },
      ],
    },
    {
      id: "super-rollovers",
      title: "Rollovers",
      subSections: [
        {
          id: "super-roll-ins",
          label: "Roll-ins",
          summaryValues: [0,null,null,null,null,null,null,null,null,null,null,null],
          rows: [
            { label: "Super 2", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
            { label: "Pension 1", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
            { label: "Annuity 1", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
          ],
        },
        {
          id: "super-roll-outs",
          label: "Roll-outs",
          summaryValues: [0,0,0,0,0,179743,0,0,0,0,0,0],
          rows: [
            { label: "Super 2", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
            { label: "Pension 1", values: [0,0,0,0,0,179743,0,0,0,0,0,0], style: "child" },
            { label: "Annuity 1", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
          ],
        },
      ],
    },
    {
      id: "super-revised",
      rows: [
        { label: "Revised Value", values: [0,20026,42556,66317,91396,117851,147547,545662,575673,607335,640738,675979], style: "subtotal" },
      ],
    },
    {
      id: "super-concessional",
      title: "Concessional Contributions",
      rows: [
        { label: "Super Guarantee", values: [3313,5233,5380,5557,5719,5890,0,0,0,0,0,0], style: "child" },
        { label: "Personal Deductible Contributions", values: [24919,24767,24610,24448,24281,26610,0,0,0,0,0,0], style: "child" },
        { label: "Contributions Tax (15%)", values: [-4235,-4500,-4499,-4501,-4500,-4875,0,0,0,0,0,0], style: "child-negative" },
        { label: "Division 293 Tax (15%)", values: [-4235,-4500,-4499,-4501,-4500,-4875,0,0,0,0,0,0], style: "child-negative" },
        { label: "LISTO", values: [0,0,0,0,0,0,0,0,0,0,0,0], style: "child" },
        { label: "Total Concessional", values: [19762,21000,20992,21003,21000,22750,0,0,0,0,0,0], style: "total" },
      ],
    },
    {
      id: "super-contribution-splitting",
      title: "Contribution Splitting",
      rows: [
        { label: "Contributions Paid", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Contributions Received", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
      ],
    },
    {
      id: "super-non-concessional",
      title: "Non-Concessional Contributions",
      rows: [
        { label: "Non-Concessional", values: [0,0,0,0,0,0,390000,0,0,0,0,0], style: "child" },
        { label: "Downsizer Contribution", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Spouse Received", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Total Non-Concessional", values: [0,0,0,0,0,0,390000,0,0,0,0,0], style: "total" },
      ],
    },
    {
      id: "super-withdrawals",
      rows: [
        { label: "Withdrawals", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
      ],
    },
    {
      id: "super-tax-portions",
      title: "Tax Free Component",
      rows: [
        { label: "Initial", values: [0,0,0,0,0,0,390000,390000,390000,390000,390000,390000], style: "child" },
      ],
    },
    {
      id: "super-tax-portions-transactions",
      title: "Tax Free Adjustments",
      rows: [
        { label: "Tax Free Rolled Over", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Tax Free Rolled In", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Withdrawals", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Non-Concessional", values: [0,0,0,0,0,0,390000,0,0,0,0,0], style: "child" },
      ],
    },
    {
      id: "super-tax-portions-end",
      rows: [
        { label: "End Tax Free Component", values: [0,0,0,0,0,0,390000,390000,390000,390000,390000,390000], style: "highlight" },
      ],
    },
    {
      id: "super-end-values",
      rows: [
        { label: "End Value (FV)", values: [20026,42556,66317,91396,117851,147547,545662,575673,607335,640738,675979,713158], style: "highlight" },
        { label: "End Value (PV)", values: [19443,40113,60689,81204,101659,123568,443673,454442,465472,476770,488341,500195], style: "subtotal" },
      ],
    },
  ],
};

// Products > Pension > Pension 1 data
export const PENSION1_DATA = {
  years: ["2025/2026","2026/2027","2027/2028","2028/2029","2029/2030","2030/2031","2031/2032","2032/2033","2033/2034","2034/2035","2035/2036","2036/2037"],
  sections: [
    {
      id: "pension-header",
      rows: [
        { label: "Year", values: [1,2,3,4,5,6,7,8,9,10,11,12], style: "header" },
        { label: "Age", values: [60,61,62,63,64,65,66,67,68,69,70,71], style: "header" },
        { label: "Inflation Rate", values: ["3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%"], style: "child" },
        { label: "Revised Growth Rate", values: ["4.04%","6.20%","6.20%","6.20%","6.20%","6.20%","6.20%","6.20%","6.20%","6.20%","6.20%","6.20%"], style: "child" },
        { label: "Pension Frequency", values: ["Monthly","Monthly","Monthly","Monthly","Monthly","Monthly","Monthly","Monthly","Monthly","Monthly","Monthly","Monthly"], style: "child" },
        { label: "Minimum Pension Rate", values: ["4.00%","4.00%","4.00%","4.00%","4.00%","5.00%","5.00%","5.00%","5.00%","5.00%","5.00%","5.00%"], style: "child" },
        { label: "Maximum Pension Rate", values: ["10.00%","10.00%","10.00%","10.00%","10.00%","10.00%","10.00%","10.00%","10.00%","10.00%","10.00%","10.00%"], style: "child" },
      ],
    },
    {
      id: "pension-current",
      rows: [
        { label: "Current Value", values: [0,0,0,0,0,0,181944,184173,186429,188713,86332,0], style: "header" },
      ],
    },
    {
      id: "pension-withdrawals",
      rows: [
        { label: "Withdrawals", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
      ],
    },
    {
      id: "pension-rollouts",
      title: "Roll-outs",
      rows: [
        { label: "Super 1", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
      ],
    },
    {
      id: "pension-rollins",
      title: "Roll-ins",
      rows: [
        { label: "Super 1", values: [0,0,0,0,0,0,179743,0,0,0,0,0], style: "child" },
      ],
    },
    {
      id: "pension-revised",
      rows: [
        { label: "Revised Value", values: [0,0,0,0,0,0,179743,181944,184173,186429,188713,86332], style: "subtotal" },
      ],
    },
    {
      id: "pension-payments",
      title: "Payments",
      rows: [
        { label: "Payment", values: [0,0,0,0,0,0,8987,9097,9209,9321,9436,4317], style: "child" },
        { label: "Additional Drawdown", values: [0,0,0,0,0,0,0,0,0,0,104692,87390], style: "child" },
      ],
    },
    {
      id: "pension-end",
      rows: [
        { label: "End Value (FV)", values: [0,0,0,0,0,0,181944,184173,186429,188713,86332,0], style: "highlight" },
        { label: "End Value (PV)", values: [0,0,0,0,0,0,147937,145388,142882,140420,62368,0], style: "subtotal" },
      ],
    },
  ],
};

// Products > Investment Bond > Bond 1 data
const BOND1_DATA = {
  years: ["2025/2026","2026/2027","2027/2028","2028/2029","2029/2030","2030/2031","2031/2032","2032/2033","2033/2034","2034/2035","2035/2036","2036/2037"],
  sections: [
    {
      id: "bond-header",
      rows: [
        { label: "Year", values: [1,2,3,4,5,6,7,8,9,10,11,12], style: "header" },
        { label: "Inflation Rate", values: ["3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%","3.00%"], style: "child" },
        { label: "Investment Return", values: ["6.05%","6.05%","6.05%","6.05%","6.05%","6.05%","6.05%","6.05%","6.05%","6.05%","6.05%","6.05%"], style: "child" },
      ],
    },
    {
      id: "bond-divider-1",
      isDivider: true,
    },
    {
      id: "bond-savings",
      title: "Savings",
      rows: [
        { label: "Current Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Max Contributions", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Contributions", values: [150000,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Sale Proceeds", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Asset Purchases", values: [150000,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Withdrawal", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Revised Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "subtotal" },
        { label: "End Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "highlight" },
      ],
    },
    {
      id: "bond-divider-2",
      isDivider: true,
    },
    {
      id: "bond-assets",
      title: "Assets",
      rows: [
        { label: "Current Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Purchases", values: [150000,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Proceeds", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Revised Value", values: [150000,null,null,null,null,null,null,null,null,null,null,null], style: "subtotal" },
        { label: "End Value (FV)", values: [159075,null,null,null,null,null,null,null,null,null,null,null], style: "highlight" },
        { label: "End Value (PV)", values: [154442,null,null,null,null,null,null,null,null,null,null,null], style: "subtotal" },
      ],
    },
    {
      id: "bond-divider-3",
      isDivider: true,
    },
    {
      id: "bond-value",
      title: "Bond Value",
      rows: [
        { label: "Current Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Revised Value", values: [150000,null,null,null,null,null,null,null,null,null,null,null], style: "subtotal" },
        { label: "End Value (FV)", values: [159075,null,null,null,null,null,null,null,null,null,null,null], style: "highlight" },
        { label: "End Value (PV)", values: [154442,null,null,null,null,null,null,null,null,null,null,null], style: "subtotal" },
      ],
    },
  ],
};

// Asset type definitions
export const PROPERTY_TYPES = ["Principal Residence", "Investment Property", "Commercial Property", "Holiday Home"];
export const DEFENSIVE_ASSET_TYPES = ["Savings Account", "Term Deposits", "Australian Bonds", "International Bonds", "Related Party Loan"];
export const GROWTH_ASSET_TYPES = ["Australian Shares", "International Shares", "Managed Funds", "ETFs", "Other"];
export const LIFESTYLE_ASSET_TYPES = ["Car", "Home & Contents", "Collections", "Art Work", "Boats", "Other Lifestyle Assets"];

// Asset entities, holdings, and debt data are now derived from factFind inside the component.
// See buildAssetHoldings() and buildDebtData() below.

// Holdings and years are now built dynamically from factFind inside the component.
// The builder functions are: buildPropertyHoldings(), buildDefensiveHoldings(), 
// buildGrowthHoldings(), buildLifestyleHoldings()
// Projection years are now built dynamically inside the component based on life expectancy.

// Chart colours for individual assets/debts (distinct, not entity-based)
const ASSET_COLORS = ["#4F46E5","#0891B2","#059669","#D97706","#DC2626","#7C3AED","#0369A1","#C026D3","#DB2777","#9333EA"];

/**
 * Wraps an AssetTable with an end-value chart showing each holding's value over time.
 * Works for both asset and debt pages.
 */
export function AssetChartPage({ holdings, years, assetTypes, title, isDebt }) {
  const [hiddenSeries, setHiddenSeries] = useState({});
  const [showDashboard, setShowDashboard] = useState(true);

  const toggleSeries = (dataKey) => {
    setHiddenSeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };

  const fC = (v) => {
    if (v === 0) return "$0";
    if (v < 0) return `-$${Math.abs(v).toLocaleString("en-AU")}`;
    return `$${v.toLocaleString("en-AU")}`;
  };

  const shortYears = years.map(y => {
    const parts = y.split("/");
    if (parts.length === 2) return parts[0].slice(-2) + "/" + parts[1].slice(-2);
    return y;
  });

  // Extract end value series from each holding
  const series = holdings.map(h => {
    const endRow = h.rows.find(r => r.label === "End Value (FV)" || r.label === "End Value");
    return {
      name: h.name.length > 35 ? h.name.substring(0, 33) + "…" : h.name,
      fullName: h.name,
      entity: h.entity,
      values: endRow ? endRow.values.map(v => (typeof v === "number" ? v : 0)) : new Array(years.length).fill(0),
    };
  }).filter(s => s.values.some(v => v > 0)); // only include series with data

  // Build chart data
  const chartData = shortYears.map((year, i) => {
    const point = { year };
    series.forEach((s, si) => { point[`s${si}`] = hiddenSeries[`s${si}`] ? 0 : s.values[i]; });
    point.total = series.reduce((sum, s, si) => sum + (hiddenSeries[`s${si}`] ? 0 : s.values[i]), 0);
    return point;
  });

  // KPIs
  const yr1Total = chartData[0]?.total || 0;
  const yrLTotal = chartData[chartData.length - 1]?.total || 0;
  const peakTotal = Math.max(...chartData.map(d => d.total));

  const tiles = [
    { label: `Year 1 ${isDebt ? "Total Debt" : "Total Value"}`, value: fC(yr1Total), color: isDebt ? "var(--ps-red)" : "#4F46E5" },
    { label: `Final Year ${isDebt ? "Total Debt" : "Total Value"}`, value: fC(yrLTotal), color: isDebt ? "var(--ps-red)" : "var(--ps-green)" },
    { label: isDebt ? "Peak Debt" : "Peak Value", value: fC(peakTotal), color: "#D97706" },
    { label: "Holdings", value: `${series.length} active`, color: "var(--ps-text-muted)" },
  ];

  return (
    <div>
      {/* Collapse toggle */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button onClick={() => setShowDashboard(p => !p)} style={{
          padding: "5px 14px", borderRadius: 6, border: "1px solid var(--ps-border)", background: showDashboard ? "var(--ps-surface-alt)" : "var(--ps-surface-indigo)",
          color: showDashboard ? "var(--ps-text-muted)" : "#4F46E5", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        }}>
          {showDashboard ? "▼ Hide" : "▶ Show"} Dashboard & Chart
        </button>
      </div>

      {showDashboard && (
        <>
      {/* Tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {tiles.map((tile, i) => (
          <div key={i} style={{
            padding: "14px 18px", borderRadius: 12,
            background: "var(--ps-surface)", border: "1px solid var(--ps-border)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{tile.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: tile.color, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{tile.value}</div>
          </div>
        ))}
      </div>

      {series.length > 0 && (
        <div style={{
          background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)",
          padding: "20px 16px", marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginBottom: 16 }}>
            End-of-year {isDebt ? "balance" : "value"} for each {isDebt ? "debt" : "holding"} over the projection period
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barCategoryGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => fC(v)}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}
                labelFormatter={(label) => `FY ${label}`}
              />
              <Legend
                iconType="square"
                wrapperStyle={{ fontSize: 11, cursor: "pointer" }}
                onClick={(e) => {
                  const idx = series.findIndex(s => s.name === e.value);
                  if (idx >= 0) toggleSeries(`s${idx}`);
                }}
                formatter={(value, entry) => {
                  const idx = series.findIndex(s => s.name === value);
                  const isHidden = idx >= 0 && hiddenSeries[`s${idx}`];
                  return <span style={{ color: isHidden ? "var(--ps-border-mid)" : entry.color, textDecoration: isHidden ? "line-through" : "none" }}>{value}</span>;
                }}
              />
              {series.map((s, si) => (
                <Area
                  key={si}
                  dataKey={`s${si}`}
                  name={s.name}
                  type="monotone"
                  stackId="stack"
                  fill={hiddenSeries[`s${si}`] ? "transparent" : ASSET_COLORS[si % ASSET_COLORS.length]}
                  fillOpacity={hiddenSeries[`s${si}`] ? 0 : 0.65}
                  stroke={hiddenSeries[`s${si}`] ? "transparent" : ASSET_COLORS[si % ASSET_COLORS.length]}
                  strokeWidth={hiddenSeries[`s${si}`] ? 0 : 1.5}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
        </>
      )}

      <AssetTable holdings={holdings} years={years} assetTypes={assetTypes} />
    </div>
  );
}

/**
 * Wraps debt SectionTable with an end-value chart.
 * Extracts "End Value" rows from sections.
 */
export function DebtChartPage({ data, title, onCellEdit }) {
  const [hiddenSeries, setHiddenSeries] = useState({});
  const [showDashboard, setShowDashboard] = useState(true);
  const toggleSeries = (dataKey) => setHiddenSeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));

  const fC = (v) => {
    if (v === 0) return "$0";
    if (v < 0) return `-$${Math.abs(v).toLocaleString("en-AU")}`;
    return `$${v.toLocaleString("en-AU")}`;
  };

  const shortYears = data.years.map(y => { const p = y.split("/"); return p.length === 2 ? p[0].slice(-2) + "/" + p[1].slice(-2) : y; });

  // Extract debt end values from sections with a title (the actual loan sections)
  const series = [];
  data.sections.forEach(s => {
    if (!s.title || !s.rows) return;
    const endRow = s.rows.find(r => r.label === "End Value");
    if (endRow) {
      series.push({
        name: s.title.length > 40 ? s.title.substring(0, 38) + "…" : s.title,
        values: endRow.values.map(v => (typeof v === "number" ? v : 0)),
      });
    }
  });

  const activeSeries = series.filter(s => s.values.some(v => v > 0));

  const chartData = shortYears.map((year, i) => {
    const point = { year };
    activeSeries.forEach((s, si) => { point[`s${si}`] = hiddenSeries[`s${si}`] ? 0 : s.values[i]; });
    point.total = activeSeries.reduce((sum, s, si) => sum + (hiddenSeries[`s${si}`] ? 0 : s.values[i]), 0);
    return point;
  });

  const yr1Total = chartData[0]?.total || 0;
  const yrLTotal = chartData[chartData.length - 1]?.total || 0;

  const tiles = [
    { label: "Year 1 Debt", value: fC(yr1Total), color: "var(--ps-red)" },
    { label: "Final Year Debt", value: fC(yrLTotal), color: yrLTotal === 0 ? "var(--ps-green)" : "var(--ps-red)" },
    { label: yrLTotal === 0 ? "Debt Free By" : "Remaining", value: yrLTotal === 0 ? `Year ${chartData.findIndex(d => d.total === 0) + 1}` : fC(yrLTotal), color: yrLTotal === 0 ? "var(--ps-green)" : "var(--ps-amber)" },
    { label: "Loans", value: `${activeSeries.length} active`, color: "var(--ps-text-muted)" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button onClick={() => setShowDashboard(p => !p)} style={{
          padding: "5px 14px", borderRadius: 6, border: "1px solid var(--ps-border)", background: showDashboard ? "var(--ps-surface-alt)" : "var(--ps-surface-indigo)",
          color: showDashboard ? "var(--ps-text-muted)" : "#4F46E5", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        }}>
          {showDashboard ? "▼ Hide" : "▶ Show"} Dashboard & Charts
        </button>
      </div>

      {showDashboard && (<>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {tiles.map((tile, i) => (
          <div key={i} style={{
            padding: "14px 18px", borderRadius: 12,
            background: "var(--ps-surface)", border: "1px solid var(--ps-border)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{tile.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: tile.color, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{tile.value}</div>
          </div>
        ))}
      </div>

      {activeSeries.length > 0 && (
        <div style={{
          background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)",
          padding: "20px 16px", marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginBottom: 16 }}>Outstanding balance by year — declining to zero when fully repaid</div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barCategoryGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => fC(v)}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}
                labelFormatter={(label) => `FY ${label}`}
              />
              <Legend
                iconType="square"
                wrapperStyle={{ fontSize: 11, cursor: "pointer" }}
                onClick={(e) => {
                  const idx = activeSeries.findIndex(s => s.name === e.value);
                  if (idx >= 0) toggleSeries(`s${idx}`);
                }}
                formatter={(value, entry) => {
                  const idx = activeSeries.findIndex(s => s.name === value);
                  const isHidden = idx >= 0 && hiddenSeries[`s${idx}`];
                  return <span style={{ color: isHidden ? "var(--ps-border-mid)" : entry.color, textDecoration: isHidden ? "line-through" : "none" }}>{value}</span>;
                }}
              />
              {activeSeries.map((s, si) => {
                const color = ["var(--ps-red)","var(--ps-amber)","#9333EA"][si % 3];
                const isHidden = hiddenSeries[`s${si}`];
                return (
                <Area
                  key={si}
                  dataKey={`s${si}`}
                  name={s.name}
                  type="monotone"
                  fill={isHidden ? "transparent" : color}
                  fillOpacity={isHidden ? 0 : 0.20}
                  stroke={isHidden ? "transparent" : color}
                  strokeWidth={isHidden ? 0 : 2}
                  dot={isHidden ? false : { r: 3 }}
                />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      </>)}

      <SectionTable data={data} onCellEdit={onCellEdit} />
    </div>
  );
}

// Filterable Asset Table component
export function AssetTable({ holdings, years, assetTypes, groupBy = "entity" }) {
  const [entityFilter, setEntityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [collapsed, setCollapsed] = useState({});

  const entities = [...new Set(holdings.map(h => h.entity))];
  const types = [...new Set(holdings.map(h => h.assetType))];

  const filtered = holdings.filter(h =>
    (entityFilter === "All" || h.entity === entityFilter) &&
    (typeFilter === "All" || h.assetType === typeFilter)
  );

  // Group by entity
  const grouped = {};
  filtered.forEach(h => {
    const key = h.entity;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(h);
  });

  function toggleSection(id) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const selectStyle = {
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid var(--ps-border)",
    fontSize: 13,
    color: "var(--ps-text-body)",
    background: "var(--ps-surface)",
    cursor: "pointer",
    minWidth: 200,
  };

  // Property type badge config
  const typeBadgeConfig = {
    "Principal Residence": { icon: "🏠", color: "var(--ps-green)", bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.2)" },
    "Investment Property": { icon: "📈", color: "#7C3AED", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.2)" },
    "Car": { icon: "🚗", color: "#D97706", bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.2)" },
    "Lifestyle - Other": { icon: "✨", color: "#0891B2", bg: "rgba(8,145,178,0.08)", border: "rgba(8,145,178,0.2)" },
    "Savings Account": { icon: "🏦", color: "var(--ps-green)", bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.2)" },
    "Term Deposits": { icon: "🔒", color: "#0369A1", bg: "rgba(3,105,161,0.08)", border: "rgba(3,105,161,0.2)" },
    "Australian Shares": { icon: "📊", color: "#4F46E5", bg: "rgba(79,70,229,0.08)", border: "rgba(79,70,229,0.2)" },
    "International Shares": { icon: "🌐", color: "#7C3AED", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.2)" },
    "Managed Funds": { icon: "📁", color: "#0891B2", bg: "rgba(8,145,178,0.08)", border: "rgba(8,145,178,0.2)" },
  };
  const defaultBadge = { icon: "💰", color: "var(--ps-text-muted)", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)" };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ps-text-muted)" }}>Entity:</span>
          <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} style={selectStyle}>
            <option value="All">All Entities</option>
            {entities.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ps-text-muted)" }}>Asset Type:</span>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
            <option value="All">All Types</option>
            {assetTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontVariantNumeric: "tabular-nums" }}>
          <thead>
            <tr>
              <th style={{
                position: "sticky", left: 0, zIndex: 2, background: "var(--ps-surface-alt)",
                textAlign: "left", padding: "10px 16px", minWidth: 260,
                fontWeight: 600, color: "var(--ps-text-secondary)", fontSize: 12,
                textTransform: "uppercase", letterSpacing: "0.05em",
                borderBottom: "2px solid var(--ps-border)",
              }}>Year</th>
              {years.map(y => (
                <th key={y} style={{
                  padding: "10px 12px", textAlign: "right",
                  fontWeight: 600, color: "var(--ps-text-secondary)", fontSize: 12,
                  borderBottom: "2px solid var(--ps-border)", minWidth: 95,
                  background: "var(--ps-surface-alt)", whiteSpace: "nowrap",
                }}>{y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(holding => {
              const badge = typeBadgeConfig[holding.assetType] || defaultBadge;
              return (
              <>
                {/* Property name header */}
                <tr
                  key={`title-${holding.id}`}
                  onClick={() => toggleSection(holding.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td colSpan={years.length + 1} style={{
                    padding: "14px 16px 4px",
                    fontWeight: 700, fontSize: 14, color: "var(--ps-text-primary)",
                    background: "var(--ps-surface)", borderTop: "2px solid var(--ps-border)",
                  }}>
                    <span style={{ marginRight: 8, fontSize: 10, color: "var(--ps-text-subtle)" }}>
                      {collapsed[holding.id] ? "▸" : "▾"}
                    </span>
                    {holding.name}
                  </td>
                </tr>
                {/* Type badge + entity row */}
                <tr key={`badge-${holding.id}`}>
                  <td colSpan={years.length + 1} style={{
                    padding: "2px 16px 8px 34px", background: "var(--ps-surface)",
                  }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "3px 10px", borderRadius: 6,
                      fontSize: 11, fontWeight: 600,
                      color: badge.color, background: badge.bg,
                      border: `1px solid ${badge.border}`,
                    }}>
                      {badge.icon} {holding.assetType}
                    </span>
                    <span style={{ marginLeft: 8 }}>
                      <EntityBadge name={holding.entity} size="sm" />
                    </span>
                    {holding.isOffsetAccount && (
                      <span style={{
                        marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                        color: "#0369A1", background: "#E0F2FE", border: "1px solid var(--ps-ring-sky)",
                      }}>
                        🔗 Offset Account
                      </span>
                    )}
                    {holding.grannyFlatInterest && (
                      <span style={{
                        marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                        color: "#9333EA", background: "#FAF5FF", border: "1px solid #D8B4FE",
                      }}>
                        🏠 Granny Flat Interest — Title transferred {holding.grannyFlatStartYear ? `(${holding.grannyFlatStartYear}/${holding.grannyFlatStartYear + 1})` : ""}
                      </span>
                    )}
                    {holding.moveBackPR && (
                      <span style={{
                        marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                        color: "#059669", background: "#ECFDF5", border: "1px solid #6EE7B7",
                      }}>
                        🏠 Move back — PR restored {holding.moveBackPRYear ? `(FY${holding.moveBackPRYear})` : ""}
                      </span>
                    )}
                  </td>
                </tr>
                {/* Collapsed: show End Value row */}
                {collapsed[holding.id] && (() => {
                  const endRow = holding.rows.find(r => r.label === "End Value (FV)" || r.label === "End Value");
                  const endLabel = endRow?.label || "End Value";
                  return (
                  <tr key={`summary-${holding.id}`} style={{ background: "rgba(5,150,105,0.06)" }}>
                    <td style={{
                      position: "sticky", left: 0, zIndex: 1, background: "rgba(5,150,105,0.06)",
                      padding: "6px 16px 6px 34px", color: "var(--ps-green)", fontWeight: 600,
                    }}>{endLabel}</td>
                    {(endRow?.values || []).map((v, i) => (
                      <td key={i} style={{ padding: "6px 12px", textAlign: "right", fontWeight: 600, color: "var(--ps-green)", fontVariantNumeric: "tabular-nums" }}>
                        {v != null ? (typeof v === "number" ? v.toLocaleString() : v) : ""}
                      </td>
                    ))}
                  </tr>
                  );
                })()}
                {/* Expanded: show all rows */}
                {!collapsed[holding.id] && holding.rows.map((row, ri) => {
                  // Section header sub-group (e.g. "Assets Held as Security", "Tax")
                  if (row.style === "section-header") {
                    return (
                      <tr key={`${holding.id}-${ri}`} style={{ borderTop: "2px solid var(--ps-border)", background: "var(--ps-surface-alt)" }}>
                        <td colSpan={years.length + 1} style={{
                          position: "sticky", left: 0, zIndex: 1, background: "var(--ps-surface-alt)",
                          padding: "10px 16px 6px 24px", fontWeight: 700, fontSize: 12,
                          color: "var(--ps-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em",
                        }}>
                          {row.label}
                        </td>
                      </tr>
                    );
                  }
                  const isCurrentValue = row.style === "current-value";
                  const isEndValue = row.style === "end-value";
                  const rowBg = isCurrentValue ? "rgba(37,99,235,0.08)" : isEndValue ? "rgba(5,150,105,0.08)" : "transparent";
                  const stickyBg = isCurrentValue ? "rgba(37,99,235,0.08)" : isEndValue ? "rgba(5,150,105,0.08)" : "var(--ps-surface)";
                  const labelColor = isCurrentValue ? "#2563eb" : isEndValue ? "var(--ps-green)" : row.style === "highlight" ? "#4338ca" : row.style === "child-negative" ? "var(--ps-red)" : "var(--ps-text-muted)";
                  const valueColor = isCurrentValue ? "#2563eb" : isEndValue ? "var(--ps-green)" : (typeof row.values?.[0] === "number" && row.values?.[0] < 0) || row.style === "child-negative" ? "var(--ps-red)" : row.style === "highlight" ? "#4338ca" : "var(--ps-text-body)";
                  const isBold = isCurrentValue || isEndValue || row.style === "highlight" || row.style === "total" || row.style === "subtotal";
                  return (
                  <tr key={`${holding.id}-${ri}`} style={{ borderBottom: "1px solid var(--ps-border-light)", background: rowBg }}>
                    <td style={{
                      position: "sticky", left: 0, background: stickyBg, zIndex: 1,
                      padding: "6px 16px 6px 34px", color: labelColor,
                      fontWeight: isBold ? 600 : 400,
                    }}>
                      {row.label}
                    </td>
                    {row.values.map((v, i) => (
                      <td key={i} style={{
                        padding: "6px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums",
                        color: (typeof v === "number" && v < 0) || row.style === "child-negative" ? "var(--ps-red)" : valueColor,
                        fontWeight: isBold ? 600 : 400,
                      }}>
                        {v != null ? (typeof v === "number" ? v.toLocaleString() : v) : ""}
                      </td>
                    ))}
                  </tr>
                  );
                })}
              </>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--ps-text-subtle)", fontSize: 14 }}>
          No holdings match the selected filters
        </div>
      )}
    </div>
  );
}

// Assets & Liabilities > Debts > Home Loan data
// HOME_LOAN_DATA, INVESTMENT_LOANS_DATA, OTHER_DEBTS_DATA are now built dynamically
// from factFind.liabilities inside the component. See buildDebtData().

// TRUST1_DATA and TRUST1_CHART_DATA deleted — now built dynamically from factFind.trusts

export function TrustPage({ data, chartData, trustName, trustEntity }) {
  const [showDashboard, setShowDashboard] = useState(true);
  const fC = (v) => {
    if (v === 0) return "$0";
    if (v < 0) return `-$${Math.abs(v).toLocaleString("en-AU")}`;
    return `$${v.toLocaleString("en-AU")}`;
  };

  const yr1 = chartData[0];
  const yrL = chartData[chartData.length - 1];
  const totalDist = chartData.reduce((s, d) => s + d.totalDist, 0);
  const totalRental = chartData.reduce((s, d) => s + d.rentalIncome, 0);

  const tiles = [
    { label: "Year 1 Net Worth", value: fC(yr1.netWorth), sub: `Assets ${fC(yr1.totalAssets)} less debt ${fC(yr1.debt)}`, color: "#D97706" },
    { label: "Final Year Net Worth", value: fC(yrL.netWorth), sub: `${yrL.debt === 0 ? "Debt free" : `Debt ${fC(yrL.debt)}`}`, color: "var(--ps-green)" },
    { label: "Net Worth Growth", value: fC(yrL.netWorth - yr1.netWorth), sub: `${((yrL.netWorth / yr1.netWorth - 1) * 100).toFixed(0)}% over ${chartData.length} years`, color: "#4F46E5" },
    { label: "Total Distributions", value: fC(totalDist), sub: `Avg ${fC(Math.round(totalDist / chartData.length))}/yr`, color: "#7C3AED" },
    { label: "Total Rental Income", value: fC(totalRental), sub: `Primary income source`, color: "#0891B2" },
    { label: "Debt Payoff", value: yr1.debt > 0 && yrL.debt === 0 ? `Year ${chartData.findIndex(d => d.debt === 0) + 1}` : "N/A", sub: yr1.debt > 0 ? `Starting debt ${fC(yr1.debt)}` : "No debt", color: yr1.debt > 0 && yrL.debt === 0 ? "#059669" : "var(--ps-text-subtle)" },
  ];

  const formatTooltip = (v) => typeof v === "number" ? fC(v) : v;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button onClick={() => setShowDashboard(p => !p)} style={{
          padding: "5px 14px", borderRadius: 6, border: "1px solid var(--ps-border)", background: showDashboard ? "var(--ps-surface-alt)" : "var(--ps-surface-indigo)",
          color: showDashboard ? "var(--ps-text-muted)" : "#4F46E5", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        }}>
          {showDashboard ? "▼ Hide" : "▶ Show"} Dashboard & Charts
        </button>
      </div>
      {showDashboard && (<>
      {/* Trust header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <EntityBadge name={trustEntity || trustName} />
        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--ps-text-primary)" }}>{trustName}</span>
      </div>

      {/* Tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {tiles.map((tile, i) => (
          <div key={i} style={{
            padding: "14px 18px", borderRadius: 12,
            background: "var(--ps-surface)", border: "1px solid var(--ps-border)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{tile.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: tile.color, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{tile.value}</div>
            <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginTop: 2 }}>{tile.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart 1: Distributions */}
      <div style={{
        background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)",
        padding: "20px 16px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>Trust Distributions</div>
        <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginBottom: 16 }}>
          Annual income distributed to beneficiaries
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barCategoryGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}
              labelFormatter={(label) => `FY ${label}`}
            />
            <Legend iconType="square" wrapperStyle={{ fontSize: 11, color: "var(--ps-text-muted)" }} />
            <Bar dataKey="distCath" name="Catherine" stackId="dist" fill={entityColor("Catherine")} radius={[0, 0, 0, 0]} />
            <Bar dataKey="distPaul" name="Paul Andrew" stackId="dist" fill={entityColor("Paul Andrew")} radius={[2, 2, 0, 0]} />
            <Line dataKey="taxableIncome" name="Taxable Income" type="monotone" stroke="#D97706" strokeWidth={2} dot={{ r: 3, fill: "#D97706" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2: Net Worth */}
      <div style={{
        background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)",
        padding: "20px 16px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>Trust Net Worth</div>
        <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginBottom: 16 }}>
          Asset values, outstanding debt, and net equity position
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barCategoryGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}
              labelFormatter={(label) => `FY ${label}`}
            />
            <Legend iconType="square" wrapperStyle={{ fontSize: 11, color: "var(--ps-text-muted)" }} />
            <Area dataKey="totalAssets" name="Total Assets" type="monotone" fill="#D97706" fillOpacity={0.10} stroke="#D97706" strokeWidth={2} />
            <Area dataKey="debt" name="Outstanding Debt" type="monotone" fill="#DC2626" fillOpacity={0.08} stroke="#DC2626" strokeWidth={1.5} strokeDasharray="4 4" />
            <Line dataKey="netWorth" name="Net Worth" type="monotone" stroke="#059669" strokeWidth={2.5} dot={{ r: 4, fill: "#059669", stroke: "var(--ps-surface)", strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      </>)}
      {/* Table */}
      <SectionTable data={data} />
    </div>
  );
}

export function TrustDistOverride({ data, beneficiaries, config, onUpdate }) {
  const [editingCell, setEditingCell] = useState(null);
  const fC = (v) => {
    if (v === 0) return "$0";
    if (v < 0) return `-$${Math.abs(v).toLocaleString("en-AU")}`;
    return `$${v.toLocaleString("en-AU")}`;
  };
  if (!beneficiaries || beneficiaries.length === 0 || !onUpdate) return null;
  const years = data?.years || [];
  const distSection = (data?.sections || []).find(s => s.id === "trust-distribution");
  if (!distSection) return null;
  const distRows = (distSection.rows || []).filter(r => r.style === "child");
  const totalRow = (distSection.rows || []).find(r => r.label === "Total Distributions");
  const totalVals = totalRow?.values || new Array(years.length).fill(0);
  if (!totalVals.some(v => v > 0)) return null;

  const cfg = config || {};
  const allocs = (cfg.allocations && cfg.allocations.length > 0) ? cfg.allocations : beneficiaries.map(b => ({
    name: (b.benef_entity || "Unknown").trim(),
    defaultPct: parseFloat(b.benef_entitlement) || 0,
    overrides: {},
  }));

  const updatePct = (bi, val) => {
    const a = [...allocs];
    a[bi] = { ...a[bi], defaultPct: val };
    onUpdate({ ...cfg, allocations: a });
  };
  const updateOverride = (bi, yIdx, val) => {
    const a = [...allocs];
    const ov = { ...(a[bi].overrides || {}) };
    if (val === "" || val === undefined) delete ov[yIdx]; else ov[yIdx] = val;
    a[bi] = { ...a[bi], overrides: ov };
    onUpdate({ ...cfg, allocations: a });
  };

  const cs = { padding: "5px 12px", fontSize: 13, textAlign: "right", whiteSpace: "nowrap", borderBottom: "1px solid var(--ps-border-light)" };
  const hcs = { padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "var(--ps-text-secondary)", fontSize: 12, minWidth: 95, background: "var(--ps-surface-alt)", whiteSpace: "nowrap", borderBottom: "2px solid var(--ps-border)" };
  const sl = { padding: "5px 16px", fontSize: 13, position: "sticky", left: 0, zIndex: 1, minWidth: 260, borderBottom: "1px solid var(--ps-border-light)" };

  return (
    <div style={{ marginTop: 20, border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", background: "var(--ps-bg-amber-200)", borderBottom: "1px solid var(--ps-ring-amber)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>📊</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-badge-amber)" }}>Trust Distribution Override</div>
          <div style={{ fontSize: 11, color: "#A16207" }}>Adjust default % or click any year cell to set a specific dollar amount</div>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
          <thead>
            <tr>
              <th style={{ position: "sticky", left: 0, zIndex: 2, background: "var(--ps-surface-alt)", padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-secondary)", borderBottom: "2px solid var(--ps-border)", minWidth: 260, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Year</th>
              {years.map((yr, yi) => <th key={yi} style={hcs}>{yr}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--ps-border)", background: "var(--ps-surface-alt)" }}>
              <td style={{ ...sl, background: "var(--ps-surface-alt)", fontWeight: 700, color: "var(--ps-text-primary)" }}>Total Distributable Income</td>
              {totalVals.map((v, y) => <td key={y} style={{ ...cs, fontWeight: 700, color: v > 0 ? "#7C3AED" : "var(--ps-text-subtle)" }}>{fC(v)}</td>)}
            </tr>
            {allocs.map((a, bi) => {
              const baseVals = distRows[bi]?.values || new Array(years.length).fill(0);
              const overrides = a.overrides || {};
              return (
                <tr key={bi} style={{ borderBottom: "1px solid var(--ps-border-light)" }}>
                  <td style={{ ...sl, background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{a.name}</span>
                      <span style={{ fontSize: 11, color: "var(--ps-text-subtle)", display: "flex", alignItems: "center", gap: 2 }}>
                        default
                        <input type="number" value={a.defaultPct} onChange={e => updatePct(bi, e.target.value)}
                          style={{ width: 42, padding: "1px 4px", borderRadius: 4, border: "1px solid var(--ps-border)", fontSize: 11, textAlign: "center" }} />%
                      </span>
                    </div>
                  </td>
                  {baseVals.map((v, y) => {
                    const isOv = overrides[y] !== undefined && overrides[y] !== "";
                    const displayVal = isOv ? (parseFloat(overrides[y]) || 0) : v;
                    const ck = `${bi}_${y}`;
                    const isEd = editingCell === ck;
                    return (
                      <td key={y} style={{
                        ...cs, color: displayVal > 0 ? "var(--ps-green)" : "var(--ps-text-subtle)", fontWeight: displayVal > 0 ? 600 : 400,
                        background: isOv ? "var(--ps-surface-amber)" : "transparent", cursor: "pointer",
                      }} onClick={() => { if (!isEd) setEditingCell(ck); }}>
                        {isEd ? (
                          <input type="number" autoFocus defaultValue={isOv ? overrides[y] : ""}
                            placeholder={String(v)}
                            onBlur={e => { updateOverride(bi, y, e.target.value); setEditingCell(null); }}
                            onKeyDown={e => { if (e.key === "Enter") { updateOverride(bi, y, e.target.value); setEditingCell(null); } if (e.key === "Escape") setEditingCell(null); }}
                            style={{ width: 80, padding: "3px 6px", borderRadius: 4, border: "2px solid #4F46E5", fontSize: 13, textAlign: "right", outline: "none" }} />
                        ) : (
                          <span>{fC(displayVal)}{isOv && <span style={{ fontSize: 10, color: "#D97706", marginLeft: 3 }}>✎</span>}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr style={{ borderTop: "2px solid var(--ps-border)", background: "var(--ps-surface-green)" }}>
              <td style={{ ...sl, background: "var(--ps-surface-green)", fontWeight: 700, color: "var(--ps-green)" }}>Total Distributed</td>
              {totalVals.map((v, y) => {
                const sum = allocs.reduce((s, a, bi) => {
                  const ov = (a.overrides || {})[y];
                  return s + (ov !== undefined && ov !== "" ? (parseFloat(ov) || 0) : (distRows[bi]?.values[y] || 0));
                }, 0);
                return <td key={y} style={{ ...cs, fontWeight: 700, color: "var(--ps-green)" }}>{fC(sum)}</td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}


export function CompanyPage({ data, chartData, companyName, companyIdx, factFind, updateFF }) {
  const [showDashboard, setShowDashboard] = useState(true);
  const [showPnl, setShowPnl] = useState(true);
  const fC = (v) => {
    if (v === 0) return "$0";
    if (v < 0) return `-$${Math.abs(v).toLocaleString("en-AU")}`;
    return `$${v.toLocaleString("en-AU")}`;
  };

  // P&L editor helpers
  const company = (factFind?.companies || [])[companyIdx];
  const pnl = company?.pnl || {};
  const incomeLines = pnl.income_lines || [];
  const expenseLines = pnl.expense_lines || [];

  const updatePnl = (field, value) => {
    if (!factFind || companyIdx === undefined) return;
    const companies = [...(factFind.companies || [])];
    companies[companyIdx] = { ...companies[companyIdx], pnl: { ...(companies[companyIdx]?.pnl || {}), [field]: value } };
    updateFF("companies", companies);
  };
  const updateIncomeLine = (lineIdx, field, value) => {
    const lines = [...incomeLines];
    lines[lineIdx] = { ...lines[lineIdx], [field]: value };
    updatePnl("income_lines", lines);
  };
  const updateExpenseLine = (lineIdx, field, value) => {
    const lines = [...expenseLines];
    lines[lineIdx] = { ...lines[lineIdx], [field]: value };
    updatePnl("expense_lines", lines);
  };
  const addIncomeLine = () => {
    const id = `inc_custom_${Date.now()}`;
    updatePnl("income_lines", [...incomeLines, { id, label: "", amount: "", growth_rate: "3", start_year: "", end_year: "" }]);
  };
  const removeIncomeLine = (lineIdx) => updatePnl("income_lines", incomeLines.filter((_, i) => i !== lineIdx));
  const addExpenseLine = () => {
    const id = `exp_custom_${Date.now()}`;
    updatePnl("expense_lines", [...expenseLines, { id, label: "", amount: "", growth_rate: "3", start_year: "", end_year: "" }]);
  };
  const removeExpenseLine = (lineIdx) => updatePnl("expense_lines", expenseLines.filter((_, i) => i !== lineIdx));

  const totalInc = incomeLines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const totalExp = expenseLines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const taxRate = parseFloat(company?.co_tax_rate || 25) / 100;
  const npbt = totalInc - totalExp;
  const npat = npbt - Math.max(0, Math.round(npbt * taxRate));

  const pnlInputStyle = { padding: "5px 8px", border: "1px solid var(--ps-border-light)", borderRadius: 5, fontSize: 11, width: "100%", background: "var(--ps-surface)", color: "var(--ps-text-primary)", outline: "none" };
  const pnlThStyle = { padding: "5px 8px", textAlign: "left", fontWeight: 600, fontSize: 10, color: "var(--ps-text-subtle)", textTransform: "uppercase" };
  const pnlTdStyle = { padding: "3px 6px" };

  const yr1 = chartData[0];
  const yrL = chartData[chartData.length - 1];
  const totalDivs = chartData.reduce((s, d) => s + d.totalDividends, 0);
  const totalTax = chartData.reduce((s, d) => s + d.taxPaid, 0);

  const tiles = [
    { label: "Current Net Worth", value: fC(yr1.netWorth), sub: "Year 1 entity value", color: "#0369A1" },
    { label: "Final Net Worth", value: fC(yrL.netWorth), sub: `Year ${chartData.length} projected`, color: "#4F46E5" },
    { label: "Year 1 Dividends", value: fC(yr1.totalDividends), sub: `Catherine ${fC(yr1.divCatherine)} · Paul ${fC(yr1.divPaul)}`, color: "var(--ps-green)" },
    { label: "Total Dividends (12 yrs)", value: fC(totalDivs), sub: `Avg ${fC(Math.round(totalDivs / chartData.length))}/yr`, color: "var(--ps-green)" },
    { label: "Total Tax Paid (25%)", value: fC(totalTax), sub: `Company tax rate`, color: "var(--ps-red)" },
    { label: "Net Worth Growth", value: `${((yrL.netWorth / yr1.netWorth - 1) * 100).toFixed(0)}%`, sub: `${fC(yr1.netWorth)} → ${fC(yrL.netWorth)}`, color: "#7C3AED" },
  ];

    const formatTooltip = (v) => typeof v === "number" ? fC(v) : v;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: 8 }}>
        <button onClick={() => setShowPnl(p => !p)} style={{
          padding: "5px 14px", borderRadius: 6, border: "1px solid var(--ps-border)", background: showPnl ? "var(--ps-surface-amber)" : "var(--ps-surface-alt)",
          color: showPnl ? "#B45309" : "var(--ps-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        }}>
          {showPnl ? "\u25bc Hide" : "\u25b6 Show"} P&L Editor
        </button>
        <button onClick={() => setShowDashboard(p => !p)} style={{
          padding: "5px 14px", borderRadius: 6, border: "1px solid var(--ps-border)", background: showDashboard ? "var(--ps-surface-alt)" : "var(--ps-surface-indigo)",
          color: showDashboard ? "var(--ps-text-muted)" : "#4F46E5", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        }}>
          {showDashboard ? "\u25bc Hide" : "\u25b6 Show"} Dashboard & Charts
        </button>
      </div>

      {/* P&L EDITOR */}
      {showPnl && company && (
        <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", marginBottom: 16, overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", background: "var(--ps-surface-amber)", borderBottom: "1px solid var(--ps-ring-amber)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>Profit & Loss  {companyName}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: npat >= 0 ? "var(--ps-green)" : "var(--ps-red)" }}>NPAT: {fC(npat)}</div>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#0369A1", textTransform: "uppercase", marginBottom: 6 }}>Income</div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
              <thead><tr style={{ background: "var(--ps-surface-alt)" }}>
                <th style={{ ...pnlThStyle, width: "30%" }}>Category</th>
                <th style={{ ...pnlThStyle, width: "20%" }}>Annual Amount</th>
                <th style={{ ...pnlThStyle, width: "12%" }}>Growth %</th>
                <th style={{ ...pnlThStyle, width: "12%" }}>Start Year</th>
                <th style={{ ...pnlThStyle, width: "12%" }}>End Year</th>
                <th style={{ ...pnlThStyle, width: "10%", textAlign: "center" }}></th>
              </tr></thead>
              <tbody>
                {incomeLines.map((line, li) => (
                  <tr key={line.id || li} style={{ borderTop: "1px solid var(--ps-border-light)" }}>
                    <td style={pnlTdStyle}><input style={pnlInputStyle} value={line.label} onChange={e => updateIncomeLine(li, "label", e.target.value)} placeholder="Category name" /></td>
                    <td style={pnlTdStyle}><input style={{ ...pnlInputStyle, textAlign: "right" }} type="number" value={line.amount} onChange={e => updateIncomeLine(li, "amount", e.target.value)} placeholder="$0" /></td>
                    <td style={pnlTdStyle}><input style={{ ...pnlInputStyle, textAlign: "center" }} type="number" value={line.growth_rate} onChange={e => updateIncomeLine(li, "growth_rate", e.target.value)} placeholder="3" /></td>
                    <td style={pnlTdStyle}><input style={{ ...pnlInputStyle, textAlign: "center" }} type="number" value={line.start_year} onChange={e => updateIncomeLine(li, "start_year", e.target.value)} placeholder="2025" /></td>
                    <td style={pnlTdStyle}><input style={{ ...pnlInputStyle, textAlign: "center" }} type="number" value={line.end_year} onChange={e => updateIncomeLine(li, "end_year", e.target.value)} placeholder="Ongoing" /></td>
                    <td style={{ ...pnlTdStyle, textAlign: "center" }}><button onClick={() => removeIncomeLine(li)} style={{ fontSize: 10, color: "var(--ps-red)", cursor: "pointer", background: "none", border: "none", fontWeight: 600 }}>x</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <button onClick={addIncomeLine} style={{ padding: "4px 10px", borderRadius: 5, border: "1px dashed #0369A1", background: "var(--ps-surface-sky)", cursor: "pointer", fontSize: 10, fontWeight: 600, color: "#0369A1" }}>+ Add Income Line</button>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0369A1" }}>Total: {fC(totalInc)}</div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", textTransform: "uppercase", marginBottom: 6 }}>Expenses</div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
              <thead><tr style={{ background: "var(--ps-surface-alt)" }}>
                <th style={{ ...pnlThStyle, width: "30%" }}>Category</th>
                <th style={{ ...pnlThStyle, width: "20%" }}>Annual Amount</th>
                <th style={{ ...pnlThStyle, width: "12%" }}>Growth %</th>
                <th style={{ ...pnlThStyle, width: "12%" }}>Start Year</th>
                <th style={{ ...pnlThStyle, width: "12%" }}>End Year</th>
                <th style={{ ...pnlThStyle, width: "10%", textAlign: "center" }}></th>
              </tr></thead>
              <tbody>
                {expenseLines.map((line, li) => (
                  <tr key={line.id || li} style={{ borderTop: "1px solid var(--ps-border-light)" }}>
                    <td style={pnlTdStyle}><input style={pnlInputStyle} value={line.label} onChange={e => updateExpenseLine(li, "label", e.target.value)} placeholder="Category name" /></td>
                    <td style={pnlTdStyle}><input style={{ ...pnlInputStyle, textAlign: "right" }} type="number" value={line.amount} onChange={e => updateExpenseLine(li, "amount", e.target.value)} placeholder="$0" /></td>
                    <td style={pnlTdStyle}><input style={{ ...pnlInputStyle, textAlign: "center" }} type="number" value={line.growth_rate} onChange={e => updateExpenseLine(li, "growth_rate", e.target.value)} placeholder="3" /></td>
                    <td style={pnlTdStyle}><input style={{ ...pnlInputStyle, textAlign: "center" }} type="number" value={line.start_year} onChange={e => updateExpenseLine(li, "start_year", e.target.value)} placeholder="2025" /></td>
                    <td style={pnlTdStyle}><input style={{ ...pnlInputStyle, textAlign: "center" }} type="number" value={line.end_year} onChange={e => updateExpenseLine(li, "end_year", e.target.value)} placeholder="Ongoing" /></td>
                    <td style={{ ...pnlTdStyle, textAlign: "center" }}><button onClick={() => removeExpenseLine(li)} style={{ fontSize: 10, color: "var(--ps-red)", cursor: "pointer", background: "none", border: "none", fontWeight: 600 }}>x</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <button onClick={addExpenseLine} style={{ padding: "4px 10px", borderRadius: 5, border: "1px dashed #DC2626", background: "var(--ps-surface-red)", cursor: "pointer", fontSize: 10, fontWeight: 600, color: "#DC2626" }}>+ Add Expense Line</button>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626" }}>Total: {fC(totalExp)}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, padding: "8px 12px", borderRadius: 6, background: npbt >= 0 ? "var(--ps-surface-emerald)" : "var(--ps-surface-red)", textAlign: "center" }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: npbt >= 0 ? "#065F46" : "#991B1B", textTransform: "uppercase" }}>NPBT</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: npbt >= 0 ? "#065F46" : "#991B1B" }}>{fC(npbt)}</div>
              </div>
              <div style={{ flex: 1, padding: "8px 12px", borderRadius: 6, background: "var(--ps-surface-amber)", textAlign: "center" }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: "#92400E", textTransform: "uppercase" }}>Tax ({company.co_tax_rate || 25}%)</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#92400E" }}>{fC(Math.max(0, Math.round(npbt * taxRate)))}</div>
              </div>
              <div style={{ flex: 1, padding: "8px 12px", borderRadius: 6, background: npat >= 0 ? "#ECFDF5" : "#FEF2F2", textAlign: "center" }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: npat >= 0 ? "#065F46" : "#991B1B", textTransform: "uppercase" }}>NPAT</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: npat >= 0 ? "#065F46" : "#991B1B" }}>{fC(npat)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDashboard && (<>
      {/* Tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {tiles.map((tile, i) => (
          <div key={i} style={{
            padding: "14px 18px", borderRadius: 12,
            background: "var(--ps-surface)", border: "1px solid var(--ps-border)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{tile.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: tile.color, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{tile.value}</div>
            <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginTop: 2 }}>{tile.sub}</div>
          </div>
        ))}
      </div>

      {/* Net Worth + Dividends chart */}
      <div style={{
        background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)",
        padding: "20px 16px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>
          {companyName || "Company"} — Net Worth & Dividends
        </div>
        <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginBottom: 16 }}>
          Entity net worth growth with dividend distributions by beneficiary
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barCategoryGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}
              labelFormatter={(label) => `FY ${label}`}
            />
            <Legend iconType="square" wrapperStyle={{ fontSize: 11, color: "var(--ps-text-muted)" }} />
            <Area dataKey="netWorth" name="Net Worth" type="monotone" fill="#0369A1" fillOpacity={0.12} stroke="#0369A1" strokeWidth={2.5} dot={{ r: 3, fill: "#0369A1" }} />
            <Bar dataKey="divCatherine" name="Dividend — Catherine" stackId="div" fill={entityColor("Catherine")} radius={[0, 0, 0, 0]} />
            <Bar dataKey="divPaul" name="Dividend — Paul Andrew" stackId="div" fill={entityColor("Paul Andrew")} radius={[3, 3, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Profit, Tax, Dividends breakdown */}
      <div style={{
        background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)",
        padding: "20px 16px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 16 }}>Profit Distribution — Tax vs Dividends vs Retained</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData.map(d => ({
            ...d,
            retained: d.operatingProfit - d.taxPaid - d.totalDividends,
          }))} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barCategoryGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }}
              labelFormatter={(label) => `FY ${label}`}
            />
            <Legend iconType="square" wrapperStyle={{ fontSize: 11, color: "var(--ps-text-muted)" }} />
            <Bar dataKey="taxPaid" name="Company Tax (25%)" stackId="profit" fill="#DC2626" />
            <Bar dataKey="totalDividends" name="Dividends Paid" stackId="profit" fill="#059669" />
            <Bar dataKey="retained" name="Retained Earnings" stackId="profit" fill="#0369A1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      </>)}
      {/* Table */}
      <SectionTable data={data} />
    </div>
  );
}

// Entities > SMSF > Acc - Catherine
export const SMSF_ACC_CATHY_DATA = {
  years: ["2025/2026","2026/2027","2027/2028","2028/2029","2029/2030","2030/2031","2031/2032","2032/2033","2033/2034","2034/2035","2035/2036","2036/2037"],
  sections: [
    {
      id: "smsf-acc-cathy-header",
      rows: [
        { label: "Year", values: [1,2,3,4,5,6,7,8,9,10,11,12], style: "header" },
      ],
    },
    { id: "smsf-acc-cathy-d1", isDivider: true },
    {
      id: "smsf-acc-cathy-savings",
      title: "Savings",
      rows: [
        { label: "Current Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "current-value" },
      ],
    },
    {
      id: "smsf-acc-cathy-inflows",
      title: "Inflows",
      rows: [
        { label: "Assets Sold", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Non-Concessional Contributions", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
      ],
    },
    {
      id: "smsf-acc-cathy-outflows",
      title: "Outflows",
      rows: [
        { label: "Assets Purchased", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Withdrawals", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
      ],
    },
    {
      id: "smsf-acc-cathy-revised",
      rows: [
        { label: "Revised Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "highlight" },
      ],
    },
    {
      id: "smsf-acc-cathy-contributions",
      title: "Concessional Contributions",
      rows: [
        { label: "SGC", values: [4537,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Personal Deductible", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Concessional Total", values: [4537,4673,4813,4958,5107,5260,0,0,0,0,0,0], style: "subtotal" },
      ],
    },
    {
      id: "smsf-acc-cathy-during-year",
      title: "During Year",
      rows: [
        { label: "Investment Income", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Rental Income", values: [19266,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Debt Servicing", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Insurance Premiums", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Product Fees", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Accounting & Compliance Costs", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Tax", values: [3600,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
      ],
    },
    {
      id: "smsf-acc-cathy-eoy",
      title: "End of Year",
      rows: [
        { label: "Asset Sales - End of Year", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Asset Purchases - End of Year", values: [20202,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Non-Concessional Contributions", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Withdrawals", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "End Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "end-value" },
      ],
    },
    { id: "smsf-acc-cathy-d2", isDivider: true },
    {
      id: "smsf-acc-cathy-tax",
      title: "Tax",
      rows: [
        { label: "Investment Income", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Rental Income", values: [24000,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Franking Credits", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Assessable Income", values: [24000,null,null,null,null,null,null,null,null,null,null,null], style: "subtotal" },
      ],
    },
    {
      id: "smsf-acc-cathy-tax-deductions",
      title: "Deductions",
      rows: [
        { label: "Deductible Interest", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Insurance Premiums", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Product Fees", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Accounting & Compliance Costs", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
      ],
    },
    {
      id: "smsf-acc-cathy-tax-result",
      rows: [
        { label: "Franking Credits Rebate", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Tax", values: [3600,null,null,null,null,null,null,null,null,null,null,null], style: "subtotal" },
      ],
    },
    { id: "smsf-acc-cathy-d3", isDivider: true },
    {
      id: "smsf-acc-cathy-balance",
      title: "Account Balance",
      hasDetailPopup: true,
      popupData: {
        assets: [
          { name: "Defensive Assets - Savings Account", values: [20202,null,null,null,null,null,null,null,null,null,null,null] },
          { name: "Investment Property - SMSF", values: [275990,null,null,null,null,null,null,null,null,null,null,null] },
        ],
        debts: [],
      },
      rows: [
        { label: "End Account Balance", values: [296192,315420,335860,357580,380640,405120,378900,354200,330900,309000,288400,269000], style: "end-value" },
      ],
    }
  ],
};

// Entities > SMSF > Pen - Catherine
export const SMSF_PEN_CATHY_DATA = {
  years: ["2025/2026","2026/2027","2027/2028","2028/2029","2029/2030","2030/2031","2031/2032","2032/2033","2033/2034","2034/2035","2035/2036","2036/2037"],
  sections: [
    {
      id: "smsf-pen-cathy-header",
      rows: [
        { label: "Year", values: [1,2,3,4,5,6,7,8,9,10,11,12], style: "header" },
      ],
    },
    { id: "smsf-pen-cathy-d1", isDivider: true },
    {
      id: "smsf-pen-cathy-savings",
      title: "Savings",
      rows: [
        { label: "Current Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "current-value" },
      ],
    },
    {
      id: "smsf-pen-cathy-inflows",
      title: "Inflows",
      rows: [
        { label: "Assets Sold", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
      ],
    },
    {
      id: "smsf-pen-cathy-outflows",
      title: "Outflows",
      rows: [
        { label: "Assets Purchased", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Withdrawals", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
      ],
    },
    {
      id: "smsf-pen-cathy-revised",
      rows: [
        { label: "Revised Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "highlight" },
      ],
    },
    {
      id: "smsf-pen-cathy-during-year",
      title: "During Year",
      rows: [
        { label: "Investment Income", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Rental Income", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Debt Servicing", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Insurance Premiums", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Product Fees", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Accounting & Compliance Costs", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Pension Drawdown", values: [0,0,0,0,0,0,-42000,-43260,-44558,-45895,-47271,-48689], style: "child-negative" },
        { label: "Tax", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
      ],
    },
    {
      id: "smsf-pen-cathy-eoy",
      title: "End of Year",
      rows: [
        { label: "Asset Sales - End of Year", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Asset Purchases - End of Year", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Non-Concessional Contributions", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Withdrawals", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "End Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "end-value" },
      ],
    },
    { id: "smsf-pen-cathy-d2", isDivider: true },
    {
      id: "smsf-pen-cathy-tax",
      title: "Tax",
      rows: [
        { label: "Investment Income", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Rental Income", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Franking Credits", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Assessable Income", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "subtotal" },
      ],
    },
    {
      id: "smsf-pen-cathy-tax-deductions",
      title: "Deductions",
      rows: [
        { label: "Deductible Interest", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Insurance Premiums", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Product Fees", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Accounting & Compliance Costs", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
      ],
    },
    {
      id: "smsf-pen-cathy-tax-result",
      rows: [
        { label: "Franking Credits Rebate", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Tax", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "subtotal" },
      ],
    },
    { id: "smsf-pen-cathy-d3", isDivider: true },
    {
      id: "smsf-pen-cathy-balance",
      title: "Account Balance",
      hasDetailPopup: true,
      popupData: {
        assets: [],
        debts: [],
      },
      rows: [
        { label: "End Account Balance", values: [0,0,0,0,0,0,420000,398500,378200,359000,340800,323600], style: "end-value" },
      ],
    }
  ],
};

// Entities > SMSF > Acc - Paul Andrew
export const SMSF_ACC_PAUL_DATA = {
  years: ["2025/2026","2026/2027","2027/2028","2028/2029","2029/2030","2030/2031","2031/2032","2032/2033","2033/2034","2034/2035","2035/2036","2036/2037"],
  sections: [
    {
      id: "smsf-acc-paul-header",
      rows: [
        { label: "Year", values: [1,2,3,4,5,6,7,8,9,10,11,12], style: "header" },
      ],
    },
    { id: "smsf-acc-paul-d1", isDivider: true },
    {
      id: "smsf-acc-paul-savings",
      title: "Savings",
      rows: [
        { label: "Current Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "current-value" },
      ],
    },
    {
      id: "smsf-acc-paul-inflows",
      title: "Inflows",
      rows: [
        { label: "Assets Sold", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Non-Concessional Contributions", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
      ],
    },
    {
      id: "smsf-acc-paul-outflows",
      title: "Outflows",
      rows: [
        { label: "Assets Purchased", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Withdrawals", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
      ],
    },
    {
      id: "smsf-acc-paul-revised",
      rows: [
        { label: "Revised Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "highlight" },
      ],
    },
    {
      id: "smsf-acc-paul-contributions",
      title: "Concessional Contributions",
      rows: [
        { label: "SGC", values: [16385,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Personal Deductible", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Concessional Total", values: [16385,16877,17383,17904,18441,18994,19564,20151,20756,21378,22019,22680], style: "subtotal" },
      ],
    },
    {
      id: "smsf-acc-paul-during-year",
      title: "During Year",
      rows: [
        { label: "Investment Income", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Rental Income", values: [19266,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Debt Servicing", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Insurance Premiums", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Product Fees", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Accounting & Compliance Costs", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Tax", values: [3600,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
      ],
    },
    {
      id: "smsf-acc-paul-eoy",
      title: "End of Year",
      rows: [
        { label: "Asset Sales - End of Year", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Asset Purchases - End of Year", values: [32050,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Non-Concessional Contributions", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Withdrawals", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "End Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "end-value" },
      ],
    },
    { id: "smsf-acc-paul-d2", isDivider: true },
    {
      id: "smsf-acc-paul-tax",
      title: "Tax",
      rows: [
        { label: "Investment Income", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Rental Income", values: [24000,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Franking Credits", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Assessable Income", values: [24000,null,null,null,null,null,null,null,null,null,null,null], style: "subtotal" },
      ],
    },
    {
      id: "smsf-acc-paul-tax-deductions",
      title: "Deductions",
      rows: [
        { label: "Deductible Interest", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Insurance Premiums", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Product Fees", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Accounting & Compliance Costs", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
      ],
    },
    {
      id: "smsf-acc-paul-tax-result",
      rows: [
        { label: "Franking Credits Rebate", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Tax", values: [3600,null,null,null,null,null,null,null,null,null,null,null], style: "subtotal" },
      ],
    },
    { id: "smsf-acc-paul-d3", isDivider: true },
    {
      id: "smsf-acc-paul-balance",
      title: "Account Balance",
      hasDetailPopup: true,
      popupData: {
        assets: [
          { name: "Defensive Assets - Savings Account", values: [32050,null,null,null,null,null,null,null,null,null,null,null] },
          { name: "Investment Property - SMSF", values: [275991,null,null,null,null,null,null,null,null,null,null,null] },
        ],
        debts: [],
      },
      rows: [
        { label: "End Account Balance", values: [308041,340280,374620,411200,450150,491620,535780,582800,632860,686160,742920,803380], style: "end-value" },
      ],
    }
  ],
};

// Entities > SMSF > Pen - Paul Andrew
export const SMSF_PEN_PAUL_DATA = {
  years: ["2025/2026","2026/2027","2027/2028","2028/2029","2029/2030","2030/2031","2031/2032","2032/2033","2033/2034","2034/2035","2035/2036","2036/2037"],
  sections: [
    {
      id: "smsf-pen-paul-header",
      rows: [
        { label: "Year", values: [1,2,3,4,5,6,7,8,9,10,11,12], style: "header" },
      ],
    },
    { id: "smsf-pen-paul-d1", isDivider: true },
    {
      id: "smsf-pen-paul-savings",
      title: "Savings",
      rows: [
        { label: "Current Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "current-value" },
      ],
    },
    {
      id: "smsf-pen-paul-inflows",
      title: "Inflows",
      rows: [
        { label: "Assets Sold", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
      ],
    },
    {
      id: "smsf-pen-paul-outflows",
      title: "Outflows",
      rows: [
        { label: "Assets Purchased", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Withdrawals", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
      ],
    },
    {
      id: "smsf-pen-paul-revised",
      rows: [
        { label: "Revised Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "highlight" },
      ],
    },
    {
      id: "smsf-pen-paul-during-year",
      title: "During Year",
      rows: [
        { label: "Investment Income", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Rental Income", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Debt Servicing", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Insurance Premiums", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Product Fees", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Accounting & Compliance Costs", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Pension Drawdown", values: [0,0,0,0,0,0,0,0,0,-48000,-49440,-50923], style: "child-negative" },
        { label: "Tax", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
      ],
    },
    {
      id: "smsf-pen-paul-eoy",
      title: "End of Year",
      rows: [
        { label: "Asset Sales - End of Year", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Asset Purchases - End of Year", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Non-Concessional Contributions", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Withdrawals", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "End Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "end-value" },
      ],
    },
    { id: "smsf-pen-paul-d2", isDivider: true },
    {
      id: "smsf-pen-paul-tax",
      title: "Tax",
      rows: [
        { label: "Investment Income", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Rental Income", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Franking Credits", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Assessable Income", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "subtotal" },
      ],
    },
    {
      id: "smsf-pen-paul-tax-deductions",
      title: "Deductions",
      rows: [
        { label: "Deductible Interest", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Insurance Premiums", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Product Fees", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Accounting & Compliance Costs", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
      ],
    },
    {
      id: "smsf-pen-paul-tax-result",
      rows: [
        { label: "Franking Credits Rebate", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Tax", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "subtotal" },
      ],
    },
    { id: "smsf-pen-paul-d3", isDivider: true },
    {
      id: "smsf-pen-paul-balance",
      title: "Account Balance",
      hasDetailPopup: true,
      popupData: {
        assets: [],
        debts: [],
      },
      rows: [
        { label: "End Account Balance", values: [0,0,0,0,0,0,0,0,0,520000,492800,466900], style: "end-value" },
      ],
    }
  ],
};

/**
 * Generic SMSF page — works for both accumulation and pension accounts.
 * Dynamically extracts contributions, pension drawdowns, and balance from the section data.
 * Only shows bars for series that have non-zero data.
 */
export function SMSFPage({ data, accountName, entityName, memberChartData, memberPctData, segChartData }) {
  const [showDashboard, setShowDashboard] = useState(true);
  const [hiddenSeries, setHiddenSeries] = useState({});
  const fC = (v) => {
    if (v === 0) return "$0";
    if (v < 0) return `-$${Math.abs(v).toLocaleString("en-AU")}`;
    return `$${v.toLocaleString("en-AU")}`;
  };

  const years = data.years.map(y => { const p = y.split("/"); return p.length === 2 ? p[0].slice(-2) + "/" + p[1].slice(-2) : y; });
  const findRow = (label) => {
    for (const s of data.sections) {
      if (s.rows) {
        const row = s.rows.find(r => r.label === label);
        if (row) return row.values;
      }
    }
    return new Array(years.length).fill(0);
  };

  const totalFundBal = findRow("Total Fund Balance");
  const yr1Bal = totalFundBal[0] || 0;
  const yrLBal = totalFundBal[totalFundBal.length - 1] || 0;
  const peakBal = Math.max(...totalFundBal);

  const tiles = memberPctData ? [] : [
    { label: "Year 1 Balance", value: fC(yr1Bal), color: "#6366F1" },
    { label: "Final Balance", value: fC(yrLBal), color: "#4F46E5" },
    { label: "Peak Balance", value: fC(peakBal), color: "#0369A1" },
    { label: "Balance Change", value: yrLBal >= yr1Bal ? `+${fC(yrLBal - yr1Bal)}` : fC(yrLBal - yr1Bal), color: yrLBal >= yr1Bal ? "var(--ps-green)" : "var(--ps-red)" },
  ];

  const formatTooltip = (v, name) => {
    if (memberPctData) return typeof v === "number" ? `${v}%` : v;
    return typeof v === "number" ? fC(v) : v;
  };

  const toggleSeries = (key) => {
    setHiddenSeries(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Custom interactive legend
  const InteractiveLegend = ({ keys, colors }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", justifyContent: "center", marginTop: 12 }}>
      {keys.map((key, i) => {
        const color = colors[i % colors.length];
        const isHidden = hiddenSeries[key];
        return (
          <div key={key} onClick={() => toggleSeries(key)} style={{
            display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            opacity: isHidden ? 0.35 : 1, transition: "opacity 0.2s",
            padding: "3px 8px", borderRadius: 6,
            background: isHidden ? "var(--ps-border-light)" : "transparent",
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: 2,
              background: isHidden ? "var(--ps-border-mid)" : color,
              transition: "background 0.2s",
            }} />
            <span style={{ fontSize: 11, color: isHidden ? "var(--ps-text-subtle)" : "var(--ps-text-secondary)", fontWeight: 500, userSelect: "none" }}>{key}</span>
          </div>
        );
      })}
    </div>
  );

  // Determine which chart to show
  const hasMemberChart = memberChartData && memberChartData.data?.length > 0;
  const hasPctChart = memberPctData && memberPctData.data?.length > 0;
  const hasSegChart = segChartData && segChartData.data?.length > 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button onClick={() => setShowDashboard(p => !p)} style={{
          padding: "5px 14px", borderRadius: 6, border: "1px solid var(--ps-border)", background: showDashboard ? "var(--ps-surface-alt)" : "var(--ps-surface-indigo)",
          color: showDashboard ? "var(--ps-text-muted)" : "#4F46E5", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
        }}>
          {showDashboard ? "▼ Hide" : "▶ Show"} Dashboard & Charts
        </button>
      </div>
      {showDashboard && (<>
      {/* Tiles — only for fund view */}
      {tiles.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(tiles.length, 4)}, 1fr)`, gap: 12, marginBottom: 20 }}>
          {tiles.map((tile, i) => (
            <div key={i} style={{
              padding: "14px 18px", borderRadius: 12,
              background: "var(--ps-surface)", border: "1px solid var(--ps-border)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ps-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{tile.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: tile.color, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{tile.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div style={{
        background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)",
        padding: "20px 16px", marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>{accountName}</span>
          {entityName && <EntityBadge name={entityName} size="sm" />}
        </div>
        <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginBottom: 16 }}>
          {hasSegChart ? "Account balance & contributions/drawdowns" : hasPctChart ? "Member allocation % over time" : hasMemberChart ? "Member account balances (stacked)" : "Fund balance"}
          {(hasMemberChart || hasPctChart || hasSegChart) && <span style={{ color: "var(--ps-text-subtle)", marginLeft: 8 }}>— click legend to toggle</span>}
        </div>

        {hasSegChart ? (
          <>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={segChartData.data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barCategoryGap={0}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} interval={Math.floor(segChartData.data.length / 10)} />
                <YAxis yAxisId="balance" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="flows" orientation="right" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={formatTooltip} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} labelFormatter={(label) => `FY ${label}`} />
                {!hiddenSeries["Account Balance"] && (
                  <Area yAxisId="balance" dataKey="balance" name="Account Balance" type="monotone" fill="#6366F1" fillOpacity={0.08} stroke="#6366F1" strokeWidth={2.5} />
                )}
                {segChartData.barKeys.map((key, i) => (
                  !hiddenSeries[key] && <Bar key={key} yAxisId="flows" dataKey={key} stackId="flows" fill={segChartData.barColors[i]} radius={[0, 0, 0, 0]} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
            <InteractiveLegend
              keys={["Account Balance", ...segChartData.barKeys]}
              colors={["#6366F1", ...segChartData.barColors]}
            />
          </>
        ) : hasMemberChart ? (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={memberChartData.data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} interval={Math.floor(memberChartData.data.length / 10)} />
                <YAxis tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={formatTooltip} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} labelFormatter={(label) => `FY ${label}`} />
                {memberChartData.keys.map((key, i) => (
                  !hiddenSeries[key] && <Area key={key} dataKey={key} type="monotone" stackId="members" fill={memberChartData.colors[i % memberChartData.colors.length]} fillOpacity={0.6} stroke={memberChartData.colors[i % memberChartData.colors.length]} strokeWidth={1.5} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
            <InteractiveLegend keys={memberChartData.keys} colors={memberChartData.colors} />
          </>
        ) : hasPctChart ? (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={memberPctData.data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} interval={Math.floor(memberPctData.data.length / 10)} />
                <YAxis tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Tooltip formatter={formatTooltip} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} labelFormatter={(label) => `FY ${label}`} />
                {memberPctData.keys.map((key, i) => (
                  !hiddenSeries[key] && <Area key={key} dataKey={key} type="monotone" stackId="pct" fill={memberPctData.colors[i % memberPctData.colors.length]} fillOpacity={0.6} stroke={memberPctData.colors[i % memberPctData.colors.length]} strokeWidth={1.5} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
            <InteractiveLegend keys={memberPctData.keys} colors={memberPctData.colors} />
          </>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={years.map((year, i) => ({ year, balance: totalFundBal[i] || 0 }))} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={formatTooltip} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} labelFormatter={(label) => `FY ${label}`} />
              <Area dataKey="balance" name="Fund Balance" type="monotone" fill="#6366F1" fillOpacity={0.10} stroke="#6366F1" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      </>)}
      {/* Table */}
      <SectionTable data={data} />
    </div>
  );
}

