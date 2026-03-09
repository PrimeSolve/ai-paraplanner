import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, ReferenceLine, Customized } from "recharts";
import { T } from "../../constants/theme.jsx";
import { EntityBadge, entityColor } from "../../constants/entities.jsx";

// Products > Annuity > Annuity 1 data
export const ANNUITY1_DATA = {
  years: ["2025/2026","2026/2027","2027/2028","2028/2029","2029/2030","2030/2031","2031/2032","2032/2033","2033/2034","2034/2035","2035/2036","2036/2037"],
  sections: [
    {
      id: "annuity-header",
      rows: [
        { label: "Year", values: [1,2,3,4,5,6,7,8,9,10,11,12], style: "header" },
      ],
    },
    {
      id: "annuity-divider-1",
      isDivider: true,
    },
    {
      id: "annuity-assumptions",
      title: "Assumptions",
      rows: [
        { label: "Tax Environment", values: ["Super","Super","Super","Super","Super","Super","Super","Super","Super","Super","Super","Super"], style: "child" },
        { label: "Annuity Type", values: ["Standard","Standard","Standard","Standard","Standard","Standard","Standard","Standard","Standard","Standard","Standard","Standard"], style: "child" },
        { label: "Term", values: ["Lifetime","Lifetime","Lifetime","Lifetime","Lifetime","Lifetime","Lifetime","Lifetime","Lifetime","Lifetime","Lifetime","Lifetime"], style: "child" },
        { label: "Earning Rate", values: ["4.00%","4.00%","4.00%","4.00%","4.00%","4.00%","4.00%","4.00%","4.00%","4.00%","4.00%","4.00%"], style: "child" },
        { label: "Purchase Price", values: [400000,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Purchase Date", values: ["01/07/2015",null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Income Test Assessment", values: ["60%","60%","60%","60%","60%","60%","60%","60%","60%","60%","60%","60%"], style: "child" },
        { label: "Asset Test Assessment", values: ["30%","30%","30%","30%","30%","30%","30%","30%","30%","30%","30%","30%"], style: "child" },
      ],
    },
    {
      id: "annuity-divider-2",
      isDivider: true,
    },
    {
      id: "annuity-tax",
      title: "Tax",
      rows: [
        { label: "Income", values: [15000,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Tax Free Component", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Deductible Component", values: [7000,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Net Assessable", values: [8000,null,null,null,null,null,null,null,null,null,null,null], style: "subtotal" },
        { label: "Rebate Available", values: [1200,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
      ],
    },
    {
      id: "annuity-divider-3",
      isDivider: true,
    },
    {
      id: "annuity-estate",
      title: "Estate",
      rows: [
        { label: "Potential Reversionary Benefit", values: [15000,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Guaranteed Buyback", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
      ],
    },
    {
      id: "annuity-divider-4",
      isDivider: true,
    },
    {
      id: "annuity-centrelink",
      title: "Centrelink",
      rows: [
        { label: "Asset Test", values: [240000,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Income Test", values: [4500,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
      ],
    },
  ],
};

// Summary of Results > Capital > Net Equity Projection data
// Same Net Worth + Debts sections from Financial Summary, without income/expenses/super
export const NET_EQUITY_DATA = {
  years: ["2025/2026","2026/2027","2027/2028","2028/2029","2029/2030","2030/2031","2031/2032","2032/2033","2033/2034","2034/2035","2035/2036","2036/2037"],
  sections: [
    {
      id: "neq-header",
      rows: [
        { label: "Year", values: [1,2,3,4,5,6,7,8,9,10,11,12], style: "header" },
      ],
    },
    {
      id: "neq-divider-1",
      isDivider: true,
    },
    {
      id: "neq-net-worth",
      title: "Net Worth",
      subSections: [
        {
          id: "neq-lifestyle",
          label: "Lifestyle",
          summaryValues: [0,null,null,null,null,null,null,null,null,null,null,null],
          rows: [
            { label: "Motor Vehicle", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
          ],
        },
        {
          id: "neq-principal-residence",
          label: "Principal Residence",
          summaryValues: [715016,null,null,null,null,null,null,null,null,null,null,null],
          rows: [],
        },
        {
          id: "neq-investment-properties",
          label: "Investment Properties",
          summaryValues: [0,null,null,null,null,null,null,null,null,null,null,null],
          rows: [
            { label: "Investment Property 1", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
          ],
        },
        {
          id: "neq-defensive",
          label: "Defensive Assets",
          summaryValues: [67324,null,null,null,null,null,null,null,null,null,null,null],
          rows: [
            { label: "Cash Account - Catherine", values: [67324,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
          ],
        },
        {
          id: "neq-equities",
          label: "Equities/Managed Funds",
          summaryValues: [51788,null,null,null,null,null,null,null,null,null,null,null],
          rows: [
            { label: "Managed Fund - Joint", values: [51788,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
          ],
        },
        {
          id: "neq-super",
          label: "Superannuation",
          summaryValues: [609114,null,null,null,null,null,null,null,null,null,null,null],
          rows: [
            { label: "AustralianSuper - Catherine", values: [517203,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
            { label: "Super Fund - Paul", values: [47870,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
            { label: "SMSF - Catherine", values: [20572,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
            { label: "SMSF - Paul", values: [23469,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
          ],
        },
        {
          id: "neq-other-entities",
          label: "Other Entities",
          summaryValues: [0,null,null,null,null,null,null,null,null,null,null,null],
          rows: [
            { label: "Family Trust", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
          ],
        },
        {
          id: "neq-other",
          label: "Other",
          summaryValues: [0,null,null,null,null,null,null,null,null,null,null,null],
          rows: [
            { label: "Other Asset 1", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
          ],
        },
      ],
      footerRows: [
        { label: "Assets Total", values: [1617034,null,null,null,null,null,null,null,null,null,null,null], style: "total" },
      ],
    },
    {
      id: "neq-debts",
      title: "Debts",
      subSections: [
        {
          id: "neq-lifestyle-debt",
          label: "Lifestyle Debt",
          summaryValues: [0,null,null,null,null,null,null,null,null,null,null,null],
          rows: [
            { label: "Home Loan", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
          ],
        },
        {
          id: "neq-investment-debt",
          label: "Investment Debt",
          summaryValues: [0,null,null,null,null,null,null,null,null,null,null,null],
          rows: [
            { label: "Investment Loan 1", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
          ],
        },
      ],
      footerRows: [
        { label: "Debts Total", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "total" },
        { label: "Net Equity (FV) - Ex PR", values: [902018,null,null,null,null,null,null,null,null,null,null,null], style: "highlight" },
        { label: "Net Equity (FV)", values: [1617034,null,null,null,null,null,null,null,null,null,null,null], style: "highlight" },
        { label: "Net Equity (PV)", values: [1569936,null,null,null,null,null,null,null,null,null,null,null], style: "highlight" },
      ],
    },
  ],
};

// Summary of Results > Model Comparison data and component
// Model Comparison Dashboard data
const MODEL_NAMES = ["No advice", "Current Position", "Advice model 2", "Investment basic"];
const MODEL_COLORS = ["#3b5998", "#93b5e0", "#e8913a", "#4a7c3f"];

const MC_NET_EQUITY = [
  { year: 1, m1: 4525658, m2: 4525658, m3: 4534733, m4: 4525658 },
  { year: 2, m1: 4850000, m2: 4830000, m3: 4860000, m4: 4840000 },
  { year: 3, m1: 5200000, m2: 5160000, m3: 5220000, m4: 5180000 },
  { year: 4, m1: 5500000, m2: 5450000, m3: 5530000, m4: 5480000 },
  { year: 5, m1: 6062120, m2: 6062037, m3: 5989244, m4: 6062037 },
  { year: 6, m1: 6400000, m2: 6350000, m3: 6280000, m4: 6380000 },
  { year: 7, m1: 6800000, m2: 6700000, m3: 6600000, m4: 6750000 },
  { year: 8, m1: 7200000, m2: 7100000, m3: 6900000, m4: 7150000 },
  { year: 9, m1: 7600000, m2: 7450000, m3: 7200000, m4: 7500000 },
  { year: 10, m1: 7994257, m2: 7822395, m3: 7593080, m4: 7983264 },
  { year: 11, m1: 7900000, m2: 7700000, m3: 7400000, m4: 7850000 },
  { year: 12, m1: 7800000, m2: 7550000, m3: 7200000, m4: 7700000 },
  { year: 13, m1: 7700000, m2: 7400000, m3: 7000000, m4: 7550000 },
  { year: 14, m1: 7600000, m2: 7250000, m3: 6800000, m4: 7400000 },
  { year: 15, m1: 7500000, m2: 7100000, m3: 6600000, m4: 7350000 },
  { year: 16, m1: 7400000, m2: 6950000, m3: 6400000, m4: 7300000 },
  { year: 17, m1: 7350000, m2: 6850000, m3: 6200000, m4: 7250000 },
  { year: 18, m1: 7300000, m2: 6750000, m3: 6000000, m4: 7200000 },
  { year: 19, m1: 7200000, m2: 6650000, m3: 5800000, m4: 7100000 },
  { year: 20, m1: 7119781, m2: 6591097, m3: 5645431, m4: 7372344 },
];

const MC_ASSETS = [
  { year: 1, super: 800000, property: 2200000, investment: 1200000, other: 325658 },
  { year: 5, super: 1400000, property: 2600000, investment: 1600000, other: 462037 },
  { year: 10, super: 1800000, property: 3100000, investment: 2400000, other: 694257 },
  { year: 15, super: 1200000, property: 3600000, investment: 2200000, other: 500000 },
  { year: 20, super: 400000, property: 4200000, investment: 2000000, other: 519781 },
];

const MC_DEBT = [
  { year: 1, m1: 436309, m2: 436309, m3: 1072690, m4: 436309 },
  { year: 2, m1: 396235, m2: 396235, m3: 1020000, m4: 396235 },
  { year: 3, m1: 340000, m2: 340000, m3: 960000, m4: 340000 },
  { year: 4, m1: 200000, m2: 200000, m3: 900000, m4: 200000 },
  { year: 5, m1: 62089, m2: 61218, m3: 1006630, m4: 61218 },
  { year: 6, m1: 30000, m2: 30000, m3: 960000, m4: 30000 },
  { year: 7, m1: 0, m2: 0, m3: 900000, m4: 0 },
  { year: 8, m1: 0, m2: 0, m3: 850000, m4: 0 },
  { year: 9, m1: 0, m2: 0, m3: 800000, m4: 0 },
  { year: 10, m1: 0, m2: 0, m3: 898713, m4: 0 },
  { year: 15, m1: 0, m2: 0, m3: 700000, m4: 0 },
  { year: 20, m1: 0, m2: 0, m3: 563975, m4: 0 },
];

const MC_INCOME = [
  { year: 1, m1: 164295, m2: 164295, m3: 164295, m4: 164295 },
  { year: 3, m1: 174700, m2: 174700, m3: 174700, m4: 174700 },
  { year: 5, m1: 185909, m2: 185909, m3: 185909, m4: 185909 },
  { year: 7, m1: 191013, m2: 185000, m3: 195000, m4: 188000 },
  { year: 9, m1: 155000, m2: 148000, m3: 160000, m4: 152000 },
  { year: 10, m1: 131349, m2: 125000, m3: 140000, m4: 128000 },
  { year: 15, m1: 95000, m2: 88000, m3: 100000, m4: 92000 },
  { year: 20, m1: 80000, m2: 75000, m3: 85000, m4: 78000 },
];

const MC_EXPENSES = [
  { year: 1, living: 211121, debtServicing: 124866, tax: 309319, contributions: 28558, goals: 79000, insurance: 5000 },
  { year: 5, living: 237619, debtServicing: 80000, tax: 348000, contributions: 32142, goals: 40000, insurance: 5628 },
  { year: 10, living: 275466, debtServicing: 0, tax: 180000, contributions: 0, goals: 8000, insurance: 6524 },
  { year: 15, living: 319000, debtServicing: 0, tax: 120000, contributions: 0, goals: 5000, insurance: 7200 },
  { year: 20, living: 370000, debtServicing: 0, tax: 80000, contributions: 0, goals: 3000, insurance: 8000 },
];

const MC_TAX = [
  { year: 1, personal: 372195, superannuation: 8520, estate: 2500 },
  { year: 2, personal: 385000, superannuation: 9000, estate: 2600 },
  { year: 3, personal: 398000, superannuation: 9500, estate: 2700 },
  { year: 4, personal: 412000, superannuation: 10000, estate: 2800 },
  { year: 5, personal: 428000, superannuation: 10500, estate: 2900 },
  { year: 6, personal: 440000, superannuation: 11000, estate: 3000 },
  { year: 7, personal: 380000, superannuation: 12000, estate: 3200 },
  { year: 8, personal: 350000, superannuation: 13000, estate: 3400 },
  { year: 9, personal: 300000, superannuation: 14000, estate: 3600 },
  { year: 10, personal: 250000, superannuation: 15000, estate: 3800 },
  { year: 11, personal: 200000, superannuation: 10000, estate: 4000 },
  { year: 12, personal: 160000, superannuation: 5000, estate: 4200 },
];
// Model Comparison Radar data (normalized 0-100 scores)
const MC_RADAR = [
  { metric: "Net Equity", m1: 88, m2: 82, m3: 70, m4: 91 },
  { metric: "Income", m1: 80, m2: 76, m3: 85, m4: 78 },
  { metric: "Low Debt", m1: 95, m2: 95, m3: 45, m4: 95 },
  { metric: "Tax Efficiency", m1: 78, m2: 82, m3: 75, m4: 83 },
  { metric: "Risk Score", m1: 96, m2: 97, m3: 97, m4: 97 },
  { metric: "Retirement", m1: 85, m2: 80, m3: 88, m4: 82 },
];

export function ModelComparisonDashboard() {
  const [h1, setH1] = useState({});
  const [h2, setH2] = useState({});
  const [h3, setH3] = useState({});
  const [h4, setH4] = useState({});
  const [h5, setH5] = useState({});
  const [h6, setH6] = useState({});
  const [hR, setHR] = useState({});
  const toggleFactory = (setFn) => (dataKey) => setFn(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));

  const formatYAxis = (val) => val === 0 ? "0" : val.toLocaleString("en-AU");
  const formatTooltip = (val) => Math.abs(val).toLocaleString("en-AU");

  const makeLegend = (hiddenState, toggleFn) => (props) => (
    <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", paddingTop: 6 }}>
      {props.payload.map((entry) => (
        <span key={entry.dataKey || entry.value} onClick={() => toggleFn(entry.dataKey)}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 11, opacity: hiddenState[entry.dataKey] ? 0.35 : 1 }}>
          <span style={{ width: 10, height: 10, background: entry.color, borderRadius: 2, display: "inline-block" }} />
          {entry.value}
        </span>
      ))}
    </div>
  );

  const chartCard = (title, children) => (
    <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "16px 12px 8px" }}>
      <div style={{ textAlign: "center", fontWeight: 600, fontSize: 13, color: "var(--ps-text-primary)", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );

  const ttStyle = { fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Row 1: Radar scorecard | Net Equity area */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        {chartCard("Model scorecard",
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={MC_RADAR} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="var(--ps-border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--ps-text-subtle)" }} />
              <Tooltip contentStyle={ttStyle} />
              <Legend content={makeLegend(hR, toggleFactory(setHR))} />
              {MODEL_NAMES.map((name, i) => (
                <Radar key={name} dataKey={`m${i+1}`} name={name} stroke={MODEL_COLORS[i]} fill={MODEL_COLORS[i]} fillOpacity={0.12} strokeWidth={1.5} hide={hR[`m${i+1}`]} />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        )}

        {chartCard("Net equity comparison",
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={MC_NET_EQUITY} margin={{ top: 5, right: 15, bottom: 5, left: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <Tooltip formatter={formatTooltip} labelFormatter={(l) => `Year ${l}`} contentStyle={ttStyle} />
              <Legend content={makeLegend(h1, toggleFactory(setH1))} />
              {MODEL_NAMES.map((name, i) => (
                <Area key={name} dataKey={`m${i+1}`} name={name} stroke={MODEL_COLORS[i]} fill={MODEL_COLORS[i]} fillOpacity={0.1} strokeWidth={2} type="monotone" hide={h1[`m${i+1}`]} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 2: Assets (area) | Debt (area) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {chartCard("Assets comparison",
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={MC_ASSETS.length > 0 ? MC_NET_EQUITY.map(d => ({ year: d.year, m1: d.m1 > 0 ? Math.round(d.m1 * 1.08) : 0, m2: d.m2 > 0 ? Math.round(d.m2 * 1.05) : 0, m3: d.m3 > 0 ? Math.round(d.m3 * 1.15) : 0, m4: d.m4 > 0 ? Math.round(d.m4 * 1.06) : 0 })) : []} margin={{ top: 5, right: 15, bottom: 5, left: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <Tooltip formatter={formatTooltip} labelFormatter={(l) => `Year ${l}`} contentStyle={ttStyle} />
              <Legend content={makeLegend(h2, toggleFactory(setH2))} />
              {MODEL_NAMES.map((name, i) => (
                <Area key={name} dataKey={`m${i+1}`} name={name} stroke={MODEL_COLORS[i]} fill={MODEL_COLORS[i]} fillOpacity={0.1} strokeWidth={2} type="monotone" hide={h2[`m${i+1}`]} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {chartCard("Debt comparison",
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={MC_DEBT} margin={{ top: 5, right: 15, bottom: 5, left: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <Tooltip formatter={formatTooltip} labelFormatter={(l) => `Year ${l}`} contentStyle={ttStyle} />
              <Legend content={makeLegend(h3, toggleFactory(setH3))} />
              {MODEL_NAMES.map((name, i) => (
                <Area key={name} dataKey={`m${i+1}`} name={name} stroke={MODEL_COLORS[i]} fill={MODEL_COLORS[i]} fillOpacity={0.15} strokeWidth={2} type="monotone" hide={h3[`m${i+1}`]} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 3: Income (line) | Expenses (line) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {chartCard("Income comparison",
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={MC_INCOME} margin={{ top: 5, right: 15, bottom: 5, left: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <Tooltip formatter={formatTooltip} labelFormatter={(l) => `Year ${l}`} contentStyle={ttStyle} />
              <Legend content={makeLegend(h4, toggleFactory(setH4))} />
              {MODEL_NAMES.map((name, i) => (
                <Line key={name} dataKey={`m${i+1}`} name={name} stroke={MODEL_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} hide={h4[`m${i+1}`]} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartCard("Expenses comparison",
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={MC_EXPENSES.map(d => ({ year: d.year, m1: d.living + d.debtServicing + d.tax + d.contributions + d.goals + d.insurance, m2: Math.round((d.living + d.debtServicing + d.tax + d.contributions + d.goals + d.insurance) * 0.95), m3: Math.round((d.living + d.debtServicing + d.tax + d.contributions + d.goals + d.insurance) * 1.05), m4: Math.round((d.living + d.debtServicing + d.tax + d.contributions + d.goals + d.insurance) * 0.97) }))} margin={{ top: 5, right: 15, bottom: 5, left: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <Tooltip formatter={formatTooltip} labelFormatter={(l) => `Year ${l}`} contentStyle={ttStyle} />
              <Legend content={makeLegend(h5, toggleFactory(setH5))} />
              {MODEL_NAMES.map((name, i) => (
                <Line key={name} dataKey={`m${i+1}`} name={name} stroke={MODEL_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} hide={h5[`m${i+1}`]} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 4: Tax - full width line */}
      {chartCard("Tax comparison",
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={MC_TAX.map(d => ({ year: d.year, m1: d.personal + d.superannuation + d.estate, m2: Math.round((d.personal + d.superannuation + d.estate) * 0.92), m3: Math.round((d.personal + d.superannuation + d.estate) * 1.03), m4: Math.round((d.personal + d.superannuation + d.estate) * 0.94) }))} margin={{ top: 5, right: 15, bottom: 5, left: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
            <Tooltip formatter={formatTooltip} labelFormatter={(l) => `Year ${l}`} contentStyle={ttStyle} />
            <Legend content={makeLegend(h6, toggleFactory(setH6))} />
            {MODEL_NAMES.map((name, i) => (
              <Line key={name} dataKey={`m${i+1}`} name={name} stroke={MODEL_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} hide={h6[`m${i+1}`]} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// Model Comparison Detail table
const MC_DETAIL_TABS = ["Summary"];
const MC_DETAIL_COLUMNS = [
  { label: "No advice", color: "var(--ps-text-muted)", bg: "var(--ps-surface-alt)" },
  { label: "Current Position", color: "var(--ps-text-strongest)", bg: "var(--ps-surface-blue)" },
  { label: "Advice model 2", color: "#7C3AED", bg: "var(--ps-surface-purple)" },
  { label: "Investment basic", color: "var(--ps-green)", bg: "var(--ps-surface-emerald)" },
];
const MC_DETAIL_SECTION_ICONS = {
  "Objectives": "🎯", "Capital": "💰", "Accumulated net income": "📈", "Accumulated salary": "💼",
  "Superannuation": "🏦", "Debt": "💳", "Retirement analysis": "🏖️", "Tax (Personal)": "🧾",
  "Risk": "📊", "Debt to equity": "⚖️",
};

const MC_DETAIL_DATA = {
  "Summary": [
    { title: "Objectives", rows: [
      { label: "Goals met", values: [14, 14, 14, 14] },
      { label: "Goals not met", values: [0, 0, 0, 0] },
    ]},
    { title: "Capital", rows: [
      { label: "Year 1", values: [4525658, 4525658, 4534733, 4525658] },
      { label: "Year 5", values: [6062120, 6062037, 5989244, 6062037] },
      { label: "Year 10", values: [7994257, 7822395, 7593080, 7983264] },
      { label: "Year 20", values: [7119781, 6591097, 5645431, 7372344] },
    ]},
    { title: "Accumulated net income", rows: [
      { label: "Year 1", values: [422744, 422744, 422744, 422744] },
      { label: "Year 5", values: [3006375, 3006464, 3146058, 3006464] },
      { label: "Year 10", values: [5636667, 5534987, 5845710, 5360439] },
      { label: "Year 20", values: [6771514, 6583954, 6609500, 5986584] },
    ]},
    { title: "Accumulated salary", rows: [
      { label: "Year 1", values: [195265, 195265, 195265, 195265] },
      { label: "Year 5", values: [1036688, 1036688, 1036688, 1036688] },
      { label: "Year 10", values: [1827450, 1827450, 1827450, 1827450] },
      { label: "Year 20", values: [1827450, 1827450, 1827450, 1827450] },
    ]},
    { title: "Superannuation", rows: [
      { label: "Year 1", values: [34630, 34830, 34630, 34630] },
      { label: "Year 5", values: [230774, 230774, 96161, 230774] },
      { label: "Year 10", values: [911802, 379361, 0, 383481] },
    ]},
    { title: "Debt", rows: [
      { label: "Year 1", values: [436309, 436309, 1072690, 436309] },
      { label: "Year 5", values: [62089, 61218, 1006630, 61218] },
      { label: "Year 10", values: [0, 0, 898713, 0] },
      { label: "Year 20", values: [0, 0, 563975, 0] },
    ]},
    { title: "Retirement analysis", rows: [
      { label: "Years to retirement", values: [0, 0, 0, 0] },
      { label: "Income in retirement", values: [150477, 141868, 155608, 149027] },
    ]},
    { title: "Tax (Personal)", rows: [
      { label: "Year 1", values: [372195, 372195, 372195, 372195] },
      { label: "Year 5", values: [2142135, 2142213, 2157207, 2142213] },
      { label: "Year 10", values: [3829343, 3955658, 3943968, 3829456] },
      { label: "Lifetime", values: [3969706, 4193308, 4283706, 3973955] },
    ]},
    { title: "Risk", rows: [
      { label: "Probability of funds lasting", values: [96, 97, 97, 97] },
      { label: "Net equity - Best case", values: [49751640, 51389094, 58119025, 50741460] },
      { label: "Net equity - Base case", values: [14971952, 14240989, 15203400, 14931924] },
      { label: "Net equity - Worst case", values: [3721421, 2918739, 3460188, 3864378] },
    ]},
    { title: "Debt to equity", rows: [
      { label: "Year 1", values: ["8.79%", "8.79%", "19.13%", "8.79%"] },
      { label: "Year 5", values: ["1.01%", "1.00%", "14.39%", "1.00%"] },
      { label: "Year 10", values: ["0.00%", "0.00%", "10.58%", "0.00%"] },
      { label: "Year 20", values: ["0.00%", "0.00%", "9.08%", "0.00%"] },
    ]},
  ],
};

export function ModelComparisonDetail() {
  const [collapsed, setCollapsed] = useState({});
  const [hiddenModels, setHiddenModels] = useState({});
  const toggleSection = (title) => setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));
  const sections = MC_DETAIL_DATA["Summary"] || [];

  const formatVal = (val) => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "string") return val;
    return val.toLocaleString("en-AU");
  };

  const toggleModel = (i) => setHiddenModels(prev => ({ ...prev, [i]: !prev[i] }));
  const visibleCols = MC_DETAIL_COLUMNS.map((c, i) => ({ ...c, idx: i })).filter((_, i) => !hiddenModels[i]);

  // ─── Heatmap ranking matrix ───
  // Extract key metrics from data: { label, sectionTitle, rowLabel, values[], higherIsBetter }
  const findRow = (sTitle, rLabel) => {
    const sec = sections.find(s => s.title === sTitle);
    return sec?.rows.find(r => r.label === rLabel)?.values || [];
  };

  const heatMetrics = [
    { label: "Capital Yr 1", values: findRow("Capital", "Year 1"), higher: true },
    { label: "Capital Yr 5", values: findRow("Capital", "Year 5"), higher: true },
    { label: "Capital Yr 10", values: findRow("Capital", "Year 10"), higher: true },
    { label: "Capital Yr 20", values: findRow("Capital", "Year 20"), higher: true },
    { label: "Net Income Yr 1", values: findRow("Accumulated net income", "Year 1"), higher: true },
    { label: "Net Income Yr 5", values: findRow("Accumulated net income", "Year 5"), higher: true },
    { label: "Net Income Yr 10", values: findRow("Accumulated net income", "Year 10"), higher: true },
    { label: "Net Income Yr 20", values: findRow("Accumulated net income", "Year 20"), higher: true },
    { label: "Income in Retirement", values: findRow("Retirement analysis", "Income in retirement"), higher: true },
    { label: "Risk (Worst case)", values: findRow("Risk", "Net equity - Worst case"), higher: true },
    { label: "Debt Yr 10", values: findRow("Debt", "Year 10"), higher: false },
    { label: "Tax (Lifetime)", values: findRow("Tax (Personal)", "Lifetime"), higher: false },
  ];

  // Rank values 1-4 (1=best). Handle ties.
  const rankRow = (values, higherIsBetter) => {
    const numVals = values.map(v => typeof v === "string" ? parseFloat(v) || 0 : (v || 0));
    const sorted = [...numVals].sort((a, b) => higherIsBetter ? b - a : a - b);
    return numVals.map(v => {
      const rank = sorted.indexOf(v) + 1;
      return rank;
    });
  };

  const rankColors = (rank, total) => {
    if (total <= 1) return { bg: "var(--ps-border-light)", text: "var(--ps-text-muted)" };
    if (rank === 1) return { bg: "var(--ps-bg-green-200)", text: "var(--ps-badge-green)" };
    if (rank === total) return { bg: "var(--ps-bg-red-200)", text: "var(--ps-badge-red)" };
    if (rank === 2) return { bg: "#FEF9C3", text: "#854D0E" };
    return { bg: "#FFEDD5", text: "#9A3412" };
  };

  // Compute overall model scores (average rank across all metrics)
  const modelScores = MC_DETAIL_COLUMNS.map((_, ci) => {
    let totalRank = 0, count = 0;
    heatMetrics.forEach(m => {
      if (m.values.length > ci) {
        const ranks = rankRow(m.values, m.higher);
        totalRank += ranks[ci];
        count++;
      }
    });
    return count > 0 ? (totalRank / count).toFixed(2) : "—";
  });

  return (
    <div>
      {/* Model filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-text-muted)", marginRight: 4 }}>Models:</span>
        {MC_DETAIL_COLUMNS.map((col, i) => (
          <button key={i} onClick={() => toggleModel(i)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8,
            background: hiddenModels[i] ? "var(--ps-border-light)" : col.bg,
            border: hiddenModels[i] ? "1px solid var(--ps-border)" : `2px solid ${col.color}44`,
            opacity: hiddenModels[i] ? 0.5 : 1, cursor: "pointer", transition: "all 0.15s",
          }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.color }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: hiddenModels[i] ? "var(--ps-text-subtle)" : col.color }}>{col.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Heatmap ranking matrix ─── */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-strongest)", marginBottom: 4 }}>Model Ranking Heatmap</div>
        <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginBottom: 14 }}>Each model ranked 1 (best) to {visibleCols.length} (worst) per metric. Lower average rank = better overall.</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--ps-text-muted)", textTransform: "uppercase", borderBottom: "2px solid var(--ps-border)", width: "22%" }}>Metric</th>
                {visibleCols.map(col => (
                  <th key={col.idx} style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, fontWeight: 700, borderBottom: "2px solid var(--ps-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                      <span style={{ color: col.color }}>{col.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatMetrics.map((m, mi) => {
                const allRanks = rankRow(m.values, m.higher);
                return (
                  <tr key={mi} style={{ borderBottom: "1px solid var(--ps-border-light)" }}>
                    <td style={{ padding: "9px 14px", fontSize: 13, fontWeight: 500, color: "var(--ps-text-body)" }}>{m.label}</td>
                    {visibleCols.map(col => {
                      const rank = allRanks[col.idx];
                      const rc = rankColors(rank, visibleCols.length);
                      return (
                        <td key={col.idx} style={{ padding: "6px 14px", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 30, borderRadius: 8, background: rc.bg, color: rc.text, fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
                            {rank}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {/* Average rank row */}
              <tr style={{ borderTop: "2px solid var(--ps-border)", background: "var(--ps-surface-alt)" }}>
                <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "var(--ps-text-strongest)" }}>Average Rank</td>
                {visibleCols.map(col => {
                  const avg = parseFloat(modelScores[col.idx]);
                  const best = Math.min(...visibleCols.map(c => parseFloat(modelScores[c.idx]) || 99));
                  const worst = Math.max(...visibleCols.map(c => parseFloat(modelScores[c.idx]) || 0));
                  const isBest = avg === best;
                  const isWorst = avg === worst && best !== worst;
                  return (
                    <td key={col.idx} style={{ padding: "8px 14px", textAlign: "center" }}>
                      <div style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        padding: "4px 14px", borderRadius: 8,
                        background: isBest ? "var(--ps-bg-green-200)" : isWorst ? "var(--ps-bg-red-200)" : "var(--ps-border-light)",
                        color: isBest ? "var(--ps-badge-green)" : isWorst ? "var(--ps-badge-red)" : "var(--ps-text-body)",
                        fontSize: 14, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace",
                      }}>
                        {modelScores[col.idx]}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Detail table ─── */}
      <div style={T.scrollWrap}>
        <table style={{ ...T.scrollTable, borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: visibleCols.length <= 4 ? "fixed" : undefined }}>
          <thead>
            <tr>
              <th style={{ ...T.th, textAlign: "left", width: visibleCols.length <= 4 ? "22%" : 220, background: "var(--ps-surface-alt)", color: "var(--ps-text-secondary)", position: "sticky", left: 0, zIndex: 3, borderBottom: "2px solid var(--ps-border)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }} />
              {visibleCols.map(col => (
                <th key={col.idx} style={{ ...T.th, textAlign: "right", background: "var(--ps-surface-alt)", borderBottom: "2px solid var(--ps-border)", padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-text-secondary)" }}>{col.label}</span>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color === "var(--ps-text-strongest)" ? "#60A5FA" : col.color, opacity: 0.9 }} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => {
              const isCollapsed = collapsed[section.title];
              const icon = MC_DETAIL_SECTION_ICONS[section.title] || "📋";
              return [
                <tr key={`t-${section.title}`} onClick={() => toggleSection(section.title)} style={{ cursor: "pointer" }}>
                  <td colSpan={visibleCols.length + 1} style={{ padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "var(--ps-text-strongest)", background: "var(--ps-border-light)", borderBottom: "1px solid var(--ps-border)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    <span style={{ marginRight: 8 }}>{icon}</span>
                    <span style={{ marginRight: 6, fontSize: 10, color: "var(--ps-text-subtle)", transition: "transform 0.2s", display: "inline-block", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>▼</span>
                    {section.title}
                  </td>
                </tr>,
                ...(!isCollapsed ? section.rows.map((row, i) => {
                  const bg = "var(--ps-surface)";
                  return (
                    <tr key={`${section.title}-${i}`} style={{ background: bg }}>
                      <td style={{ padding: "10px 16px 10px 40px", fontSize: 13, fontWeight: 500, color: "var(--ps-text-secondary)", position: "sticky", left: 0, background: bg, zIndex: 1, borderRight: "1px solid var(--ps-border-light)", borderBottom: "1px solid var(--ps-border-light)", whiteSpace: "nowrap" }}>{row.label}</td>
                      {visibleCols.map(col => (
                        <td key={col.idx} style={{ padding: "10px 16px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 500, color: MC_DETAIL_COLUMNS[col.idx]?.color || "var(--ps-text-secondary)", borderBottom: "1px solid var(--ps-border-light)", background: bg, whiteSpace: "nowrap" }}>{formatVal(row.values[col.idx])}</td>
                      ))}
                    </tr>
                  );
                }) : []),
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Summary of Results > Advice Summary data and component
const ADVICE_SUMMARY_DATA = {
  sections: [
    {
      id: "insurance",
      title: "Insurance Needs",
      icon: "🛡️",
      accentColor: "#3B82F6",
      bgColor: "var(--ps-surface-blue)",
      borderColor: "var(--ps-ring-blue)",
      rows: [],
      note: "Insurance recommendations are covered in the insurance projection section of this SOA.",
    },
    {
      id: "estate",
      title: "Estate Planning",
      icon: "📜",
      accentColor: "#7C3AED",
      bgColor: "var(--ps-surface-purple)",
      borderColor: "var(--ps-ring-purple)",
      rows: [
        { recommendation: "Tax distribution (Paul Andrew)", owner: "RPUT trust", product: "Trust - RPUT trust", amount: 39612 },
      ],
    },
    {
      id: "debt",
      title: "Debt Management",
      icon: "💳",
      accentColor: "#DC2626",
      bgColor: "var(--ps-surface-red)",
      borderColor: "var(--ps-ring-red-soft)",
      rows: [
        { recommendation: "Repayments", owner: "Joint", product: "Debt - Primary Residence Debt", amount: 29186 },
        { recommendation: "Repayments", owner: "Paul Andrew", product: "Debt - Rental Property Debt", amount: 72241 },
        { recommendation: "Repayments", owner: "RPUT trust", product: "Debt - RPUT Business Property", amount: 22359 },
      ],
    },
    {
      id: "super",
      title: "Superannuation",
      icon: "🏦",
      accentColor: "#059669",
      bgColor: "var(--ps-surface-emerald)",
      borderColor: "var(--ps-ring-green)",
      rows: [
        { recommendation: "Super guarantee", owner: "Catherine", product: "Superannuation - Default super", amount: 3313 },
        { recommendation: "Super guarantee", owner: "Paul Andrew", product: "Superannuation - Default super", amount: 11966 },
      ],
    },
    {
      id: "wealth",
      title: "Wealth Creation",
      icon: "📈",
      accentColor: "#D97706",
      bgColor: "var(--ps-surface-amber)",
      borderColor: "var(--ps-ring-amber)",
      rows: [
        { recommendation: "Rental income", owner: "Paul Andrew", product: "Property - Rental Property 63 Rosebery Ave", amount: 9403 },
        { recommendation: "Rental income", owner: "RPUT trust", product: "Property - RPUT Business Premises", amount: 58000 },
        { recommendation: "Rental income", owner: "Smith Family SMSF - Paul Andrew", product: "RPUT Business Premises - SMSF share", amount: 24000 },
        { recommendation: "Rental income", owner: "Smith Family SMSF - Catherine", product: "RPUT Business Premises - SMSF share", amount: 24000 },
      ],
    },
  ],
};

export function AdviceSummaryTable({ navigateTo }) {
  const fC = (v) => {
    const abs = Math.abs(v || 0);
    if (abs >= 1000000) return (v < 0 ? "-" : "") + "$" + (abs / 1000000).toFixed(2) + "M";
    if (abs >= 1000)    return (v < 0 ? "-" : "") + "$" + Math.round(abs / 1000) + "k";
    return (v < 0 ? "-$" : "$") + Math.round(abs).toLocaleString("en-AU");
  };

  // ── Headline KPIs ──
  const yr1Base   = BOA_NET_EQUITY[0]?.m1 || 0;
  const yr1Advice = BOA_NET_EQUITY[0]?.m2 || 0;
  const yr20Base  = BOA_NET_EQUITY[BOA_NET_EQUITY.length - 1]?.m1 || 0;
  const yr20Advice= BOA_NET_EQUITY[BOA_NET_EQUITY.length - 1]?.m2 || 0;
  const netBenefit = yr20Advice - yr20Base;
  const yr1Uplift  = yr1Advice - yr1Base;
  const incomeBase   = BOA_INCOME[BOA_INCOME.length - 1]?.m1 || 0;
  const incomeAdvice = BOA_INCOME[BOA_INCOME.length - 1]?.m2 || 0;
  const incomeUplift = incomeAdvice - incomeBase;
  const taxBase   = BOA_TAX[0]?.m1 || 0;
  const taxAdvice = BOA_TAX[0]?.m2 || 0;
  const totalRecs = ADVICE_SUMMARY_DATA.sections.reduce((s, sec) => s + sec.rows.length, 0);

  const kpis = [
    { label: "Net Equity Uplift (Yr 20)", value: fC(netBenefit), sub: "Advice vs no advice", ok: netBenefit >= 0, icon: "📈" },
    { label: "Year 1 Net Equity Uplift",  value: fC(yr1Uplift),  sub: "Immediate impact",    ok: yr1Uplift >= 0,  icon: "🚀" },
    { label: "Retirement Income Uplift",   value: fC(incomeUplift), sub: "Per annum improvement", ok: incomeUplift >= 0, icon: "💰" },
    { label: "Strategies Recommended",    value: totalRecs,      sub: "Across all categories", ok: true,           icon: "✅" },
  ];

  // ── Strategy scorecard ──
  const strategies = ADVICE_SUMMARY_DATA.sections.filter(s => s.rows.length > 0).map(sec => ({
    ...sec,
    total: sec.rows.reduce((a, r) => a + r.amount, 0),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Row 1: KPI tiles ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{
            background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)",
            padding: "18px 20px", borderTop: `3px solid ${k.ok ? "#6366F1" : "#EF4444"}`,
          }}>
            <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              {k.icon} {k.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Before / After Net Equity chart + Strategy scorecard ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>

        {/* Before/After chart */}
        <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "20px 16px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingLeft: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ps-text-primary)" }}>Net Equity — Base vs Advice</div>
            <div style={{ display: "flex", gap: 16 }}>
              {[["No Advice", "var(--ps-text-subtle)"], ["With Advice", "#6366F1"]].map(([label, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ps-text-muted)" }}>
                  <div style={{ width: 24, height: 3, background: color, borderRadius: 2 }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={BOA_NET_EQUITY} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: "var(--ps-text-subtle)" }} axisLine={false} tickLine={false} label={{ value: "Year", position: "insideBottom", offset: -2, fontSize: 10, fill: "var(--ps-text-subtle)" }} />
              <YAxis tickFormatter={v => fC(v)} tick={{ fontSize: 10, fill: "var(--ps-text-subtle)" }} axisLine={false} tickLine={false} width={68} />
              <Tooltip
                formatter={(val, name) => [fC(val), name === "m1" ? "No Advice" : "With Advice"]}
                labelFormatter={l => `Year ${l}`}
                contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid var(--ps-border)", boxShadow: "0 8px 24px var(--ps-shadow-md)" }}
              />
              {/* Shaded area between the two lines */}
              <defs>
                <linearGradient id="adviceGain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area dataKey="m2" name="With Advice" fill="url(#adviceGain)" stroke="#6366F1" strokeWidth={2.5} dot={false} />
              <Line dataKey="m1" name="No Advice" stroke="var(--ps-text-subtle)" strokeWidth={2} dot={false} strokeDasharray="5 4" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Strategy scorecard */}
        <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "20px" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ps-text-primary)", marginBottom: 16 }}>Strategy Scorecard</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ADVICE_SUMMARY_DATA.sections.map(sec => {
              const total = sec.rows.reduce((a, r) => a + r.amount, 0);
              const isEmpty = sec.rows.length === 0;
              const [hovered, setHovered] = React.useState(false);
              return (
                <div key={sec.id}
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", borderRadius: 10,
                    background: isEmpty ? "var(--ps-surface-alt)" : sec.bgColor,
                    border: `1px solid ${isEmpty ? "var(--ps-border-light)" : sec.borderColor}`,
                    opacity: isEmpty ? 0.5 : 1,
                    transition: "box-shadow 0.15s",
                    boxShadow: hovered && !isEmpty ? "0 2px 8px var(--ps-shadow-sm)" : "none",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{sec.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isEmpty ? "var(--ps-text-subtle)" : "var(--ps-text-primary)" }}>{sec.title}</div>
                      <div style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>
                        {isEmpty ? "No recommendations" : `${sec.rows.length} recommendation${sec.rows.length !== 1 ? "s" : ""}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {!isEmpty && (
                      <div style={{ fontSize: 14, fontWeight: 700, color: sec.accentColor, fontFamily: "'JetBrains Mono', monospace" }}>
                        {fC(total)}
                      </div>
                    )}
                    {isEmpty && (
                      <div style={{ fontSize: 11, color: "var(--ps-border-mid)", fontWeight: 500 }}>—</div>
                    )}
                    {!isEmpty && (
                      <button
                        onClick={() => navigateTo?.(["Advice Detail", "Recommendations"])}
                        style={{
                          fontSize: 11, fontWeight: 600, color: "#6366F1",
                          background: "transparent", border: "1px solid #6366F1",
                          borderRadius: 6, padding: "3px 10px", cursor: "pointer",
                          opacity: hovered ? 1 : 0,
                          transition: "opacity 0.15s",
                          whiteSpace: "nowrap",
                        }}>
                        View detail →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: Income comparison | Tax comparison ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          { title: "Income — Base vs Advice", data: BOA_INCOME, color: "var(--ps-green)", label: "Income" },
          { title: "Tax — Base vs Advice",    data: BOA_TAX,    color: "var(--ps-red)", label: "Tax" },
        ].map(({ title, data, color, label }) => (
          <div key={title} style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "20px 16px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingLeft: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ps-text-primary)" }}>{title}</div>
              <div style={{ display: "flex", gap: 14 }}>
                {[["No Advice", "var(--ps-text-subtle)"], ["With Advice", color]].map(([l, c]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--ps-text-muted)" }}>
                    <div style={{ width: 18, height: 3, background: c, borderRadius: 2 }} />{l}
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={data} margin={{ top: 5, right: 16, bottom: 5, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "var(--ps-text-subtle)" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fC(v)} tick={{ fontSize: 10, fill: "var(--ps-text-subtle)" }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  formatter={(val, name) => [fC(val), name === "m1" ? "No Advice" : "With Advice"]}
                  labelFormatter={l => `Year ${l}`}
                  contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid var(--ps-border)" }}
                />
                <Line dataKey="m2" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} />
                <Line dataKey="m1" stroke="var(--ps-text-subtle)" strokeWidth={2} dot={false} strokeDasharray="5 4" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}

// Advice Detail > Scope
const SCOPE_SECTIONS = [
  {
    title: "Cash Flow & Budgeting", icon: "💰", accentColor: "#059669", bgColor: "var(--ps-surface-emerald)", borderColor: "var(--ps-ring-green)",
    items: [
      { description: "Budgeting advice", scope: "in", owner: "Joint" },
      { description: "Where to invest excess cash flow", scope: "in", owner: "Joint" },
    ],
  },
  {
    title: "Debt Management", icon: "💳", accentColor: "#DC2626", bgColor: "var(--ps-surface-red)", borderColor: "var(--ps-ring-red-soft)",
    items: [
      { description: "Review debt levels", scope: "in", owner: "Joint" },
      { description: "Increase debt", scope: "in", owner: "Joint" },
      { description: "Review debt structure", scope: "in", owner: "Joint" },
      { description: "Review debt products", scope: "in", owner: "Joint" },
    ],
  },
  {
    title: "Superannuation", icon: "🏦", accentColor: "#2563EB", bgColor: "var(--ps-surface-blue)", borderColor: "var(--ps-ring-blue)",
    items: [
      { description: "Review superannuation funds", scope: "out", owner: "Catherine" },
      { description: "Review superannuation funds", scope: "out", owner: "Paul Andrew" },
      { description: "Review superannuation contribution strategy", scope: "in", owner: "Joint" },
      { description: "Self-managed superannuation funds", scope: "in", owner: "Joint" },
      { description: "Defined super benefits", scope: "out", owner: "Catherine" },
      { description: "Defined super benefits", scope: "out", owner: "Paul Andrew" },
    ],
  },
  {
    title: "Investments & Wealth", icon: "📈", accentColor: "#D97706", bgColor: "var(--ps-surface-amber)", borderColor: "var(--ps-ring-amber)",
    items: [
      { description: "Review investment strategy", scope: "in", owner: "Joint" },
      { description: "Wealth creation", scope: "in", owner: "Joint" },
      { description: "Review tax structures", scope: "in", owner: "Joint" },
    ],
  },
  {
    title: "Retirement & Pension", icon: "🏖️", accentColor: "#0891B2", bgColor: "var(--ps-surface-cyan)", borderColor: "var(--ps-ring-cyan)",
    items: [
      { description: "Pension/annuity options", scope: "in", owner: "Joint" },
      { description: "Retirement planning", scope: "in", owner: "Joint" },
      { description: "Centrelink/DVA benefits", scope: "in", owner: "Joint" },
    ],
  },
  {
    title: "Estate Planning", icon: "📜", accentColor: "#7C3AED", bgColor: "var(--ps-surface-purple)", borderColor: "var(--ps-ring-purple)",
    items: [
      { description: "Estate planning", scope: "in", owner: "Joint" },
    ],
  },
  {
    title: "Insurance", icon: "🛡️", accentColor: "#3B82F6", bgColor: "var(--ps-surface-blue)", borderColor: "var(--ps-ring-blue)",
    items: [
      { description: "Review insurance needs", scope: "out", owner: "Joint" },
    ],
  },
];

export function ScopeDashboard() {
  const allItems = SCOPE_SECTIONS.flatMap(s => s.items);
  const inScopeCount = allItems.filter(i => i.scope === "in").length;
  const outOfScopeCount = allItems.filter(i => i.scope === "out").length;
  const inScopeSections = SCOPE_SECTIONS.filter(s => s.items.some(i => i.scope === "in")).length;
  const outScopeSections = SCOPE_SECTIONS.filter(s => s.items.some(i => i.scope === "out")).length;

  return (
    <div>
      {/* Summary tiles */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{
          flex: 1, minWidth: 180, padding: "18px 24px", borderRadius: 12,
          background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "var(--ps-tile-dark-text)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ps-ring-green)" }}>In Scope</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{inScopeCount}</div>
          <div style={{ fontSize: 12, color: "#6EE7B7", marginTop: 2 }}>across {inScopeSections} categories</div>
        </div>
        <div style={{
          flex: 1, minWidth: 180, padding: "18px 24px", borderRadius: 12,
          background: "var(--ps-tile-slate)", color: "var(--ps-tile-dark-text)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ps-border-mid)" }}>Out of Scope</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{outOfScopeCount}</div>
          <div style={{ fontSize: 12, color: "var(--ps-text-subtle)", marginTop: 2 }}>across {outScopeSections} categories</div>
        </div>
        {SCOPE_SECTIONS.filter(s => s.items.length > 0).map(sec => {
          const inCount = sec.items.filter(i => i.scope === "in").length;
          const outCount = sec.items.filter(i => i.scope === "out").length;
          return (
            <div key={sec.title} style={{
              flex: 1, minWidth: 140, padding: "14px 18px", borderRadius: 12,
              background: sec.bgColor, border: `1px solid ${sec.borderColor}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>{sec.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: sec.accentColor, textTransform: "uppercase", letterSpacing: "0.04em" }}>{sec.title}</span>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                {inCount > 0 && <div><span style={{ fontSize: 16, fontWeight: 800, color: "var(--ps-green)", fontFamily: "'JetBrains Mono', monospace" }}>{inCount}</span><span style={{ fontSize: 10, color: "var(--ps-text-muted)", marginLeft: 3 }}>in</span></div>}
                {outCount > 0 && <div><span style={{ fontSize: 16, fontWeight: 800, color: "var(--ps-text-subtle)", fontFamily: "'JetBrains Mono', monospace" }}>{outCount}</span><span style={{ fontSize: 10, color: "var(--ps-text-muted)", marginLeft: 3 }}>out</span></div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Section cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {SCOPE_SECTIONS.map((sec) => {
          const inItems = sec.items.filter(i => i.scope === "in");
          const outItems = sec.items.filter(i => i.scope === "out");

          return (
            <div key={sec.title} style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${sec.borderColor}`, background: "var(--ps-surface)" }}>
              {/* Header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", background: sec.bgColor, borderBottom: `1px solid ${sec.borderColor}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "var(--ps-surface)", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, border: `1px solid ${sec.borderColor}`, boxShadow: "0 1px 3px var(--ps-shadow-xs)",
                  }}>{sec.icon}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-strongest)" }}>{sec.title}</div>
                    <div style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>{sec.items.length} item{sec.items.length !== 1 ? "s" : ""}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {inItems.length > 0 && (
                    <div style={{ padding: "4px 12px", borderRadius: 8, background: "var(--ps-bg-green-200)", border: "1px solid var(--ps-ring-emerald)" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-badge-green)" }}>{inItems.length}</span>
                      <span style={{ fontSize: 11, color: "var(--ps-badge-green)", marginLeft: 4 }}>in scope</span>
                    </div>
                  )}
                  {outItems.length > 0 && (
                    <div style={{ padding: "4px 12px", borderRadius: 8, background: "var(--ps-border-light)", border: "1px solid var(--ps-border)" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-muted)" }}>{outItems.length}</span>
                      <span style={{ fontSize: 11, color: "var(--ps-text-muted)", marginLeft: 4 }}>out of scope</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rows */}
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {sec.items.map((item, ri) => {
                    const isIn = item.scope === "in";
                    return (
                      <tr key={ri} style={{ borderBottom: ri < sec.items.length - 1 ? "1px solid var(--ps-border-light)" : "none", background: "var(--ps-surface)" }}>
                        <td style={{ padding: "11px 20px", fontSize: 13, color: "var(--ps-text-primary)", fontWeight: 500, width: "50%" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 4, height: 4, borderRadius: "50%", background: sec.accentColor, flexShrink: 0 }} />
                            {item.description}
                          </div>
                        </td>
                        <td style={{ padding: "11px 16px", width: "25%" }}>
                          <EntityBadge name={item.owner} size="sm" />
                        </td>
                        <td style={{ padding: "11px 20px", textAlign: "right", width: "25%" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 6,
                            fontSize: 11, fontWeight: 600,
                            background: isIn ? "var(--ps-bg-green-200)" : "var(--ps-bg-red-200)",
                            color: isIn ? "var(--ps-badge-green)" : "var(--ps-badge-red)",
                          }}>
                            <span style={{ fontSize: 10 }}>{isIn ? "✓" : "✕"}</span>
                            {isIn ? "In scope" : "Out of scope"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Advice Detail > Objectives
const OBJECTIVE_SECTIONS = [
  {
    title: "Retirement", icon: "🏖️", accentColor: "#0891B2", bgColor: "var(--ps-surface-cyan)", borderColor: "var(--ps-ring-cyan)",
    items: [
      { goal: "Desired Income In Retirement", owner: "Catherine", value: 60000, timeframe: "2031", frequency: "Yearly", importance: "Not Set", projected: 150477, met: true },
      { goal: "Desired Income In Retirement", owner: "Paul Andrew", value: 60000, timeframe: "2034", frequency: "Yearly", importance: "Not Set", projected: 150477, met: true },
      { goal: "Age You Wish To Retire", owner: "Catherine", value: 65, timeframe: "2031", frequency: "Yearly", importance: "Not Set", projected: 60, met: true, isCurrency: false },
      { goal: "Age You Wish To Retire", owner: "Paul Andrew", value: 65, timeframe: "2034", frequency: "Yearly", importance: "Not Set", projected: 65, met: true, isCurrency: false },
    ],
  },
  {
    title: "Lifestyle", icon: "✨", accentColor: "#7C3AED", bgColor: "var(--ps-surface-purple)", borderColor: "var(--ps-ring-purple)",
    items: [
      { goal: "Travel Dreams", owner: "Catherine", value: 60000, timeframe: "2025 – 2045", frequency: "Every year", importance: "Important", projected: 60000, met: true },
      { goal: "Health Maintenance", owner: "Catherine", value: 27000, timeframe: "2025 – 2057", frequency: "Every year", importance: "Important", projected: 27000, met: true },
      { goal: "Golf Membership", owner: "Paul Andrew", value: 19000, timeframe: "2025 – 2040", frequency: "Every year", importance: "Important", projected: 19000, met: true },
      { goal: "Family holidays", owner: "Catherine", value: 50000, timeframe: "2030 – 2045", frequency: "Every year", importance: "Important", projected: 50000, met: true },
      { goal: "Cars – Volvo", owner: "Catherine", value: 60000, timeframe: "2030 – 2040", frequency: "Every 5 years", importance: "Important", projected: 60000, met: true },
      { goal: "Cars – Honda", owner: "Catherine", value: 60000, timeframe: "2026 – 2041", frequency: "Every 5 years", importance: "Important", projected: 60000, met: true },
      { goal: "Kids – Sarah", owner: "Catherine", value: 20000, timeframe: "2028 – 2032", frequency: "Every year", importance: "Important", projected: 20000, met: true },
      { goal: "Kids – Matthew", owner: "Joint", value: 20000, timeframe: "2026 – 2030", frequency: "Every year", importance: "Important", projected: 20000, met: true },
      { goal: "Kids – Madeline", owner: "Joint", value: 20000, timeframe: "2026 – 2030", frequency: "Every year", importance: "Important", projected: 20000, met: true },
      { goal: "Kids – Harrison", owner: "Joint", value: 20000, timeframe: "2026 – 2030", frequency: "Every year", importance: "Important", projected: 20000, met: true },
    ],
  },
  {
    title: "Wealth Creation", icon: "📈", accentColor: "#D97706", bgColor: "var(--ps-surface-amber)", borderColor: "var(--ps-ring-amber)",
    items: [],
    note: "No specific wealth creation objectives defined. Wealth creation strategies are addressed in the recommendations section.",
  },
  {
    title: "Tax / Cashflow", icon: "🧾", accentColor: "#059669", bgColor: "var(--ps-surface-emerald)", borderColor: "var(--ps-ring-green)",
    items: [],
    note: "Tax and cashflow objectives are managed through the debt management and superannuation contribution strategies.",
  },
  {
    title: "Wealth Protection", icon: "🛡️", accentColor: "#3B82F6", bgColor: "var(--ps-surface-blue)", borderColor: "var(--ps-ring-blue)",
    items: [],
    note: "Insurance needs are assessed separately in the insurance projection section of this SOA.",
  },
];

export function ObjectivesDashboard() {
  const allItems = OBJECTIVE_SECTIONS.flatMap(s => s.items);
  const metCount = allItems.filter(i => i.met).length;
  const notMetCount = allItems.filter(i => !i.met).length;
  const totalVal = allItems.reduce((s, i) => s + (i.value || 0), 0);
  const fC = (v) => `$${v.toLocaleString("en-AU")}`;

  return (
    <div>
      {/* Summary tiles */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{
          flex: 1, minWidth: 160, padding: "18px 24px", borderRadius: 12,
          background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "var(--ps-tile-dark-text)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ps-ring-green)" }}>Objectives Met</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{metCount} / {allItems.length}</div>
          <div style={{ fontSize: 12, color: "#6EE7B7", marginTop: 2 }}>{metCount === allItems.length ? "All objectives on track" : `${notMetCount} not met`}</div>
        </div>
        <div style={{
          flex: 1, minWidth: 160, padding: "18px 24px", borderRadius: 12,
          background: "var(--ps-tile-dark)", color: "var(--ps-tile-dark-text)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ps-text-subtle)" }}>Total Objective Value</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{fC(totalVal)}</div>
          <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginTop: 2 }}>combined annual targets</div>
        </div>
        {OBJECTIVE_SECTIONS.map(sec => {
          const secMet = sec.items.filter(i => i.met).length;
          const secNotMet = sec.items.filter(i => !i.met).length;
          const isEmpty = sec.items.length === 0;
          return (
            <div key={sec.title} style={{
              flex: 1, minWidth: 140, padding: "14px 18px", borderRadius: 12,
              background: sec.bgColor, border: `1px solid ${sec.borderColor}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>{sec.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: sec.accentColor, textTransform: "uppercase", letterSpacing: "0.04em" }}>{sec.title}</span>
              </div>
              {isEmpty ? (
                <div style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>No objectives</div>
              ) : (
                <div style={{ display: "flex", gap: 12 }}>
                  <div><span style={{ fontSize: 16, fontWeight: 800, color: "var(--ps-green)", fontFamily: "'JetBrains Mono', monospace" }}>{secMet}</span><span style={{ fontSize: 10, color: "var(--ps-text-muted)", marginLeft: 3 }}>met</span></div>
                  {secNotMet > 0 && <div><span style={{ fontSize: 16, fontWeight: 800, color: "var(--ps-red)", fontFamily: "'JetBrains Mono', monospace" }}>{secNotMet}</span><span style={{ fontSize: 10, color: "var(--ps-text-muted)", marginLeft: 3 }}>not met</span></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Section cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {OBJECTIVE_SECTIONS.map((sec) => {
          const isEmpty = sec.items.length === 0;
          const secMet = sec.items.filter(i => i.met).length;
          const secNotMet = sec.items.filter(i => !i.met).length;
          const secVal = sec.items.reduce((s, i) => s + (i.value || 0), 0);

          return (
            <div key={sec.title} style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${sec.borderColor}`, background: "var(--ps-surface)" }}>
              {/* Header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", background: sec.bgColor, borderBottom: `1px solid ${sec.borderColor}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "var(--ps-surface)", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, border: `1px solid ${sec.borderColor}`, boxShadow: "0 1px 3px var(--ps-shadow-xs)",
                  }}>{sec.icon}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-strongest)" }}>{sec.title}</div>
                    <div style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>
                      {isEmpty ? "No objectives defined" : `${sec.items.length} objective${sec.items.length !== 1 ? "s" : ""}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {secMet > 0 && (
                    <div style={{ padding: "4px 12px", borderRadius: 8, background: "var(--ps-bg-green-200)", border: "1px solid var(--ps-ring-emerald)" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-badge-green)" }}>{secMet}</span>
                      <span style={{ fontSize: 11, color: "var(--ps-badge-green)", marginLeft: 4 }}>met</span>
                    </div>
                  )}
                  {secNotMet > 0 && (
                    <div style={{ padding: "4px 12px", borderRadius: 8, background: "var(--ps-bg-red-200)", border: "1px solid var(--ps-ring-red)" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-badge-red)" }}>{secNotMet}</span>
                      <span style={{ fontSize: 11, color: "var(--ps-badge-red)", marginLeft: 4 }}>not met</span>
                    </div>
                  )}
                  {!isEmpty && (
                    <div style={{ padding: "4px 12px", borderRadius: 8, background: "var(--ps-surface)", border: `1px solid ${sec.borderColor}` }}>
                      <span style={{ fontSize: 11, color: "var(--ps-text-muted)", fontWeight: 500, marginRight: 4 }}>Target</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: sec.accentColor, fontFamily: "'JetBrains Mono', monospace" }}>{fC(secVal)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Note for empty */}
              {isEmpty && sec.note && (
                <div style={{ padding: "12px 20px 14px 68px", fontSize: 13, color: "var(--ps-text-muted)", fontStyle: "italic" }}>{sec.note}</div>
              )}

              {/* Rows */}
              {!isEmpty && (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "8px 20px", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--ps-border-light)" }}>Objective</th>
                      <th style={{ padding: "8px 16px", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--ps-border-light)" }}>Owner</th>
                      <th style={{ padding: "8px 16px", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--ps-border-light)" }}>Timeframe</th>
                      <th style={{ padding: "8px 16px", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--ps-border-light)" }}>Frequency</th>
                      <th style={{ padding: "8px 16px", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", textAlign: "right", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--ps-border-light)" }}>Target</th>
                      <th style={{ padding: "8px 16px", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", textAlign: "right", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--ps-border-light)" }}>Projected</th>
                      <th style={{ padding: "8px 20px", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--ps-border-light)" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.items.map((item, ri) => {
                      const pct = item.value > 0 ? Math.min(100, Math.round((item.projected / item.value) * 100)) : 100;
                      const fmt = item.isCurrency === false ? (v) => v.toLocaleString("en-AU") : fC;
                      return (
                        <tr key={ri} style={{ borderBottom: ri < sec.items.length - 1 ? "1px solid var(--ps-border-light)" : "none", background: "var(--ps-surface)" }}>
                          <td style={{ padding: "11px 20px", fontSize: 13, color: "var(--ps-text-primary)", fontWeight: 500 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 4, height: 4, borderRadius: "50%", background: sec.accentColor, flexShrink: 0 }} />
                              {item.goal}
                            </div>
                          </td>
                          <td style={{ padding: "11px 16px" }}><EntityBadge name={item.owner || "Joint"} size="sm" /></td>
                          <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--ps-text-muted)", textAlign: "center" }}>{item.timeframe}</td>
                          <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--ps-text-muted)", textAlign: "center" }}>{item.frequency}</td>
                          <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 600, color: "var(--ps-text-strongest)", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{fmt(item.value)}</td>
                          <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>{fmt(item.projected)}</td>
                          <td style={{ padding: "11px 20px", textAlign: "center" }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 6,
                              fontSize: 11, fontWeight: 600,
                              background: item.met ? "var(--ps-bg-green-200)" : "var(--ps-bg-red-200)",
                              color: item.met ? "var(--ps-badge-green)" : "var(--ps-badge-red)",
                            }}>
                              <span style={{ fontSize: 10 }}>{item.met ? "✓" : "✕"}</span>
                              {item.met ? `${pct}%` : `${pct}%`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Advice Detail > Recommendations (year-by-year)
const RECOMMENDATIONS_BY_YEAR = {
  "Year 1": [
    { title: "INSURANCE NEEDS", rows: [] },
    { title: "ESTATE PLANNING", rows: [
      { recommendation: "Tax distribution (Paul Andrew)", owner: "RPUT trust", product: "Trust - RPUT trust", amount: 39612 },
    ]},
    { title: "DEBT", rows: [
      { recommendation: "Repayments", owner: "Joint", product: "Debt - Primary Residence Debt", amount: 29186 },
      { recommendation: "Repayments", owner: "Paul Andrew", product: "Debt - Rental Property Debt", amount: 72241 },
      { recommendation: "Repayments", owner: "RPUT trust", product: "Debt - RPUT Business Property", amount: 22359 },
    ]},
    { title: "SUPERANNUATION", rows: [
      { recommendation: "Super guarantee", owner: "Catherine", product: "Superannuation - Default super", amount: 3313 },
      { recommendation: "Super guarantee", owner: "Paul Andrew", product: "Superannuation - Default super", amount: 11966 },
      { recommendation: "Salary sacrifice", owner: "Paul Andrew", product: "Superannuation - Default super", amount: 15534 },
    ]},
    { title: "WEALTH CREATION", rows: [
      { recommendation: "Rental income", owner: "Paul Andrew", product: "Property - Rental Property", amount: 9403 },
      { recommendation: "Rental income", owner: "RPUT trust", product: "Property - RPUT Business Premises", amount: 58000 },
      { recommendation: "Rental income", owner: "SMSF - Paul Andrew", product: "Property - RPUT Business Premises - SMSF share", amount: 24000 },
      { recommendation: "Rental income", owner: "SMSF - Catherine", product: "Property - RPUT Business Premises - SMSF share", amount: 24000 },
      { recommendation: "SMSF contribution", owner: "Paul Andrew", product: "Smith Family SMSF - Super account", amount: 12049 },
      { recommendation: "SMSF contribution", owner: "Catherine", product: "Smith Family SMSF - Super account", amount: 12049 },
    ]},
  ],
  "Year 2": [
    { title: "INSURANCE NEEDS", rows: [] },
    { title: "ESTATE PLANNING", rows: [
      { recommendation: "Tax distribution (Paul Andrew)", owner: "RPUT trust", product: "Trust - RPUT trust", amount: 39612 },
    ]},
    { title: "DEBT", rows: [
      { recommendation: "Repayments", owner: "Paul Andrew", product: "Debt - Rental Property Debt", amount: 72241 },
      { recommendation: "Repayments", owner: "RPUT trust", product: "Debt - RPUT Business Property", amount: 22359 },
    ]},
    { title: "SUPERANNUATION", rows: [
      { recommendation: "Super guarantee", owner: "Catherine", product: "Superannuation - Default super", amount: 3412 },
      { recommendation: "Super guarantee", owner: "Paul Andrew", product: "Superannuation - Default super", amount: 12321 },
      { recommendation: "Salary sacrifice", owner: "Paul Andrew", product: "Superannuation - Default super", amount: 15534 },
    ]},
    { title: "WEALTH CREATION", rows: [
      { recommendation: "Rental income", owner: "Paul Andrew", product: "Property - Rental Property", amount: 9685 },
      { recommendation: "Rental income", owner: "RPUT trust", product: "Property - RPUT Business Premises", amount: 59740 },
      { recommendation: "Rental income", owner: "SMSF - Paul Andrew", product: "Property - RPUT Business Premises - SMSF share", amount: 24720 },
      { recommendation: "Rental income", owner: "SMSF - Catherine", product: "Property - RPUT Business Premises - SMSF share", amount: 24720 },
      { recommendation: "SMSF contribution", owner: "Paul Andrew", product: "Smith Family SMSF - Super account", amount: 21355 },
      { recommendation: "SMSF contribution", owner: "Catherine", product: "Smith Family SMSF - Super account", amount: 22354 },
    ]},
  ],
  "Year 3": [
    { title: "ESTATE PLANNING", rows: [
      { recommendation: "Tax distribution (Paul Andrew)", owner: "RPUT trust", product: "Trust - RPUT trust", amount: 39612 },
    ]},
    { title: "DEBT", rows: [
      { recommendation: "Repayments", owner: "Paul Andrew", product: "Debt - Rental Property Debt", amount: 72241 },
      { recommendation: "Repayments", owner: "RPUT trust", product: "Debt - RPUT Business Property", amount: 22359 },
    ]},
    { title: "SUPERANNUATION", rows: [
      { recommendation: "Super guarantee", owner: "Catherine", product: "Superannuation - Default super", amount: 3515 },
      { recommendation: "Super guarantee", owner: "Paul Andrew", product: "Superannuation - Default super", amount: 12693 },
      { recommendation: "Salary sacrifice", owner: "Paul Andrew", product: "Superannuation - Default super", amount: 15534 },
    ]},
    { title: "WEALTH CREATION", rows: [
      { recommendation: "Rental income", owner: "Paul Andrew", product: "Property - Rental Property", amount: 9975 },
      { recommendation: "Rental income", owner: "RPUT trust", product: "Property - RPUT Business Premises", amount: 61532 },
      { recommendation: "Rental income", owner: "SMSF - Paul Andrew", product: "Property - RPUT Business Premises - SMSF share", amount: 25462 },
      { recommendation: "Rental income", owner: "SMSF - Catherine", product: "Property - RPUT Business Premises - SMSF share", amount: 25462 },
    ]},
  ],
  "Year 7": [
    { title: "DEBT", rows: [
      { recommendation: "Repayments", owner: "RPUT trust", product: "Debt - RPUT Business Property", amount: 22359 },
    ]},
    { title: "SUPERANNUATION", rows: [
      { recommendation: "Super guarantee", owner: "Paul Andrew", product: "Superannuation - Default super", amount: 14286 },
    ]},
    { title: "RETIREMENT", rows: [
      { recommendation: "Commence pension", owner: "Catherine", product: "Smith Family SMSF - Pension", amount: 0 },
      { recommendation: "Pension drawdown", owner: "Catherine", product: "Smith Family SMSF - Pension", amount: 35000 },
      { recommendation: "Rollover to pension", owner: "Catherine", product: "Smith Family SMSF", amount: 111442 },
    ]},
    { title: "WEALTH CREATION", rows: [
      { recommendation: "Rental income", owner: "Paul Andrew", product: "Property - Rental Property", amount: 11227 },
      { recommendation: "Rental income", owner: "RPUT trust", product: "Property - RPUT Business Premises", amount: 69255 },
      { recommendation: "Rental income", owner: "SMSF - Paul Andrew", product: "Property - RPUT Business Premises - SMSF share", amount: 28658 },
      { recommendation: "Rental income", owner: "SMSF - Catherine", product: "Property - RPUT Business Premises - SMSF share", amount: 28658 },
    ]},
  ],
  "Year 10": [
    { title: "RETIREMENT", rows: [
      { recommendation: "Commence pension", owner: "Paul Andrew", product: "Smith Family SMSF - Pension", amount: 0 },
      { recommendation: "Pension drawdown", owner: "Catherine", product: "Smith Family SMSF - Pension", amount: 38245 },
      { recommendation: "Pension drawdown", owner: "Paul Andrew", product: "Smith Family SMSF - Pension", amount: 42000 },
      { recommendation: "Rollover to pension", owner: "Paul Andrew", product: "Smith Family SMSF", amount: 372380 },
    ]},
    { title: "WEALTH CREATION", rows: [
      { recommendation: "Rental income", owner: "Paul Andrew", product: "Property - Rental Property", amount: 12268 },
      { recommendation: "Rental income", owner: "RPUT trust", product: "Property - RPUT Business Premises", amount: 75677 },
      { recommendation: "Rental income", owner: "SMSF - Paul Andrew", product: "Property - RPUT Business Premises - SMSF share", amount: 31315 },
      { recommendation: "Rental income", owner: "SMSF - Catherine", product: "Property - RPUT Business Premises - SMSF share", amount: 31315 },
    ]},
  ],
};

// Fill in missing years with simplified data
[4,5,6,8,9].forEach(y => {
  const key = `Year ${y}`;
  if (!RECOMMENDATIONS_BY_YEAR[key]) {
    RECOMMENDATIONS_BY_YEAR[key] = [
      ...(y <= 6 ? [{ title: "ESTATE PLANNING", rows: [
        { recommendation: "Tax distribution (Paul Andrew)", owner: "RPUT trust", product: "Trust - RPUT trust", amount: 39612 },
      ]}] : []),
      ...(y <= 6 ? [{ title: "DEBT", rows: [
        { recommendation: "Repayments", owner: "Paul Andrew", product: "Debt - Rental Property Debt", amount: 72241 },
        ...(y <= 7 ? [{ recommendation: "Repayments", owner: "RPUT trust", product: "Debt - RPUT Business Property", amount: 22359 }] : []),
      ]}] : []),
      ...(y <= 7 ? [{ title: "SUPERANNUATION", rows: [
        ...(y <= 6 ? [{ recommendation: "Super guarantee", owner: "Catherine", product: "Superannuation - Default super", amount: Math.round(3313 * Math.pow(1.03, y - 1)) }] : []),
        { recommendation: "Super guarantee", owner: "Paul Andrew", product: "Superannuation - Default super", amount: Math.round(11966 * Math.pow(1.03, y - 1)) },
      ]}] : []),
      ...(y >= 7 ? [{ title: "RETIREMENT", rows: [
        { recommendation: "Pension drawdown", owner: "Catherine", product: "Smith Family SMSF - Pension", amount: Math.round(35000 * Math.pow(1.03, y - 7)) },
        ...(y >= 10 ? [{ recommendation: "Pension drawdown", owner: "Paul Andrew", product: "Smith Family SMSF - Pension", amount: Math.round(42000 * Math.pow(1.03, y - 10)) }] : []),
      ]}] : []),
      { title: "WEALTH CREATION", rows: [
        { recommendation: "Rental income", owner: "Paul Andrew", product: "Property - Rental Property", amount: Math.round(9403 * Math.pow(1.03, y - 1)) },
        { recommendation: "Rental income", owner: "RPUT trust", product: "Property - RPUT Business Premises", amount: Math.round(58000 * Math.pow(1.03, y - 1)) },
        { recommendation: "Rental income", owner: "SMSF - Paul Andrew", product: "Property - RPUT Business Premises - SMSF share", amount: Math.round(24000 * Math.pow(1.03, y - 1)) },
        { recommendation: "Rental income", owner: "SMSF - Catherine", product: "Property - RPUT Business Premises - SMSF share", amount: Math.round(24000 * Math.pow(1.03, y - 1)) },
      ]},
    ];
  }
});

const RECOMMENDED_STRATEGIES = [
  { strategy: "Debt reduction - Primary Residence", owner: "Joint" },
  { strategy: "Debt reduction - Rental Property", owner: "Paul Andrew" },
  { strategy: "Debt reduction - RPUT Business", owner: "RPUT trust" },
  { strategy: "Salary sacrifice to super", owner: "Paul Andrew" },
  { strategy: "Super guarantee optimisation", owner: "Catherine" },
  { strategy: "Super guarantee optimisation", owner: "Paul Andrew" },
  { strategy: "SMSF contributions", owner: "Catherine" },
  { strategy: "SMSF contributions", owner: "Paul Andrew" },
  { strategy: "Trust distribution strategy", owner: "RPUT trust" },
  { strategy: "Pension commencement - Catherine", owner: "Catherine" },
  { strategy: "Pension commencement - Paul Andrew", owner: "Paul Andrew" },
  { strategy: "Rental income strategy", owner: "Joint" },
];

const NON_RECOMMENDED_STRATEGIES = [
  { strategy: "Margin lending", owner: "Joint" },
  { strategy: "Gearing into super", owner: "Joint" },
  { strategy: "Insurance inside super", owner: "Catherine" },
  { strategy: "Insurance inside super", owner: "Paul Andrew" },
  { strategy: "Transition to retirement", owner: "Catherine" },
];

export function RecommendationsTable() {
  const [selectedYear, setSelectedYear] = useState("Year 1");
  const sections = RECOMMENDATIONS_BY_YEAR[selectedYear] || [];
  const fC = (v) => `$${v.toLocaleString("en-AU")}`;

  // Section styling map matching the Advice Summary design
  const SEC_STYLE = {
    "INSURANCE NEEDS": { icon: "🛡️", accentColor: "#3B82F6", bgColor: "var(--ps-surface-blue)", borderColor: "var(--ps-ring-blue)", note: "Insurance recommendations are covered in the insurance projection section." },
    "ESTATE PLANNING": { icon: "📜", accentColor: "#7C3AED", bgColor: "var(--ps-surface-purple)", borderColor: "var(--ps-ring-purple)" },
    "DEBT": { icon: "💳", accentColor: "#DC2626", bgColor: "var(--ps-surface-red)", borderColor: "var(--ps-ring-red-soft)" },
    "SUPERANNUATION": { icon: "🏦", accentColor: "#059669", bgColor: "var(--ps-surface-emerald)", borderColor: "var(--ps-ring-green)" },
    "WEALTH CREATION": { icon: "📈", accentColor: "#D97706", bgColor: "var(--ps-surface-amber)", borderColor: "var(--ps-ring-amber)" },
    "RETIREMENT": { icon: "🏖️", accentColor: "#0891B2", bgColor: "var(--ps-surface-cyan)", borderColor: "var(--ps-ring-cyan)" },
  };
  const defaultStyle = { icon: "📋", accentColor: "var(--ps-text-muted)", bgColor: "var(--ps-surface-alt)", borderColor: "var(--ps-border)" };

  // Totals for tiles
  const totalRecs = sections.reduce((s, sec) => s + sec.rows.length, 0);
  const totalAmount = sections.reduce((s, sec) => s + sec.rows.reduce((a, r) => a + r.amount, 0), 0);
  const activeSections = sections.filter(s => s.rows.length > 0);

  return (
    <div>
      {/* Year selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <button onClick={() => {
          const num = parseInt(selectedYear.split(" ")[1]);
          if (num > 1) setSelectedYear(`Year ${num - 1}`);
        }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--ps-border-input)", background: "var(--ps-surface)", cursor: "pointer", fontSize: 14, color: "var(--ps-text-secondary)" }}>‹</button>
        <div style={{ display: "flex", gap: 0, flex: 1 }}>
          {Array.from({ length: 10 }, (_, i) => `Year ${i + 1}`).map(year => (
            <button key={year} onClick={() => setSelectedYear(year)}
              style={{
                flex: 1, padding: "8px 4px", border: "none", cursor: "pointer",
                background: selectedYear === year ? "#4338ca" : "transparent",
                color: selectedYear === year ? "var(--ps-surface)" : "var(--ps-text-muted)",
                fontWeight: selectedYear === year ? 600 : 400, fontSize: 12,
                borderRadius: selectedYear === year ? 6 : 0,
                transition: "all 0.15s ease",
              }}>
              {year.replace("Year ", "Yr ")}
            </button>
          ))}
        </div>
        <button onClick={() => {
          const num = parseInt(selectedYear.split(" ")[1]);
          if (num < 10) setSelectedYear(`Year ${num + 1}`);
        }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--ps-border-input)", background: "var(--ps-surface)", cursor: "pointer", fontSize: 14, color: "var(--ps-text-secondary)" }}>›</button>
      </div>

      {/* Dashboard tiles */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{
          flex: 1, minWidth: 180, padding: "18px 24px", borderRadius: 12,
          background: "var(--ps-tile-dark)", color: "var(--ps-tile-dark-text)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ps-text-subtle)" }}>Total Recommendations</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{totalRecs}</div>
          <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginTop: 2 }}>across {activeSections.length} categories</div>
        </div>
        <div style={{
          flex: 1, minWidth: 180, padding: "18px 24px", borderRadius: 12,
          background: "var(--ps-tile-dark)", color: "var(--ps-tile-dark-text)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ps-text-subtle)" }}>Total Annual Value</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{fC(totalAmount)}</div>
          <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginTop: 2 }}>{selectedYear} recommendation value</div>
        </div>
        {activeSections.map((sec, si) => {
          const st = SEC_STYLE[sec.title] || defaultStyle;
          const secTotal = sec.rows.reduce((a, r) => a + r.amount, 0);
          return (
            <div key={si} style={{
              flex: 1, minWidth: 140, padding: "14px 18px", borderRadius: 12,
              background: st.bgColor, border: `1px solid ${st.borderColor}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>{st.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: st.accentColor, textTransform: "uppercase", letterSpacing: "0.04em" }}>{sec.title}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ps-text-strongest)", fontFamily: "'JetBrains Mono', monospace" }}>{fC(secTotal)}</div>
              <div style={{ fontSize: 11, color: "var(--ps-text-muted)", marginTop: 2 }}>{sec.rows.length} recommendation{sec.rows.length !== 1 ? "s" : ""}</div>
            </div>
          );
        })}
      </div>

      {/* Section cards — matching Advice Summary style */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {sections.map((sec, si) => {
          const st = SEC_STYLE[sec.title] || defaultStyle;
          const isEmpty = sec.rows.length === 0;
          const secTotal = sec.rows.reduce((a, r) => a + r.amount, 0);

          return (
            <div key={si} style={{
              borderRadius: 12, overflow: "hidden",
              border: `1px solid ${st.borderColor}`, background: "var(--ps-surface)",
            }}>
              {/* Section header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", background: st.bgColor,
                borderBottom: isEmpty ? "none" : `1px solid ${st.borderColor}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "var(--ps-surface)", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, border: `1px solid ${st.borderColor}`,
                    boxShadow: "0 1px 3px var(--ps-shadow-xs)",
                  }}>
                    {st.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-strongest)" }}>{sec.title}</div>
                    <div style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>
                      {isEmpty ? "No recommendations" : `${sec.rows.length} recommendation${sec.rows.length !== 1 ? "s" : ""}`}
                    </div>
                  </div>
                </div>
                {!isEmpty && (
                  <div style={{ padding: "6px 14px", borderRadius: 8, background: "var(--ps-surface)", border: `1px solid ${st.borderColor}` }}>
                    <span style={{ fontSize: 11, color: "var(--ps-text-muted)", fontWeight: 500, marginRight: 6 }}>Total</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: st.accentColor, fontFamily: "'JetBrains Mono', monospace" }}>{fC(secTotal)}</span>
                  </div>
                )}
              </div>

              {/* Note for empty sections */}
              {isEmpty && st.note && (
                <div style={{ padding: "12px 20px 14px 68px", fontSize: 13, color: "var(--ps-text-muted)", fontStyle: "italic" }}>{st.note}</div>
              )}

              {/* Rows */}
              {!isEmpty && (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "8px 20px", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--ps-border-light)" }}>Recommendation</th>
                      <th style={{ padding: "8px 16px", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--ps-border-light)" }}>Owner</th>
                      <th style={{ padding: "8px 16px", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--ps-border-light)" }}>Product</th>
                      <th style={{ padding: "8px 20px", fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", textAlign: "right", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--ps-border-light)" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.rows.map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: ri < sec.rows.length - 1 ? "1px solid var(--ps-border-light)" : "none", background: "var(--ps-surface)" }}>
                        <td style={{ padding: "11px 20px", fontSize: 13, color: "var(--ps-text-primary)", fontWeight: 500 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 4, height: 4, borderRadius: "50%", background: st.accentColor, flexShrink: 0 }} />
                            {row.recommendation}
                          </div>
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 13, color: "var(--ps-text-secondary)" }}><EntityBadge name={row.owner} size="sm" /></td>
                        <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--ps-text-muted)" }}>{row.product}</td>
                        <td style={{ padding: "11px 20px", fontSize: 14, fontWeight: 700, color: "var(--ps-text-strongest)", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>
                          {row.amount === 0 ? "—" : fC(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Advice Detail > Advice Projection
const PROJECTION_YEARS = ["2025/2026","2026/2027","2027/2028","2028/2029","2029/2030","2030/2031","2031/2032","2032/2033","2033/2034","2034/2035","2035/2036","2036/2037","2037/2038","2038/2039","2039/2040","2040/2041"];

const PRODUCT_PROJECTION_DATA = [
  { entity: "Catherine", rows: [
    { description: "MP", growthRate: "2.58%", values: [0,0,0,0,0,0,31314,108812,-144569,0,52346,1680,-40334,-16897,0,0] },
  ]},
  { entity: "Paul Andrew", rows: [
    { description: "MP", growthRate: "2.58%", values: [0,0,0,0,0,0,31314,108812,-144569,0,52346,1680,-40334,-16897,0,0] },
  ]},
  { entity: "RPUT trust", rows: [
    { description: "MP", growthRate: "0.00%", values: [15460,27637,31976,43166,52743,12883,0,0,-183865,0,0,0,0,0,0,0] },
  ]},
  { entity: "Smith Family SMSF", rows: [
    { description: "MP - Smith Family SMSF - Catherine pension (Default)", growthRate: "2.58%", values: [0,0,0,0,0,0,151279,59797,30786,31216,31655,8739,0,259655,-285100,32442] },
    { description: "MP - Smith Family SMSF - Paul Andrew pension (Default)", growthRate: "2.58%", values: [0,0,0,0,0,0,0,0,0,401672,29713,30142,30580,434538,8690,382061] },
    { description: "MP - Smith Family SMSF - Paul Andrew super account", growthRate: "2.58%", values: [12049,21355,22602,23919,25311,55356,58579,61984,65580,-372380,0,0,0,0,0,0] },
    { description: "MP - Smith Family SMSF - Catherine super account", growthRate: "2.58%", values: [12049,22354,22630,23949,25342,26814,-111442,-29433,0,0,0,0,0,0,0,0] },
  ]},
];

const PORTFOLIO_TRANSACTIONS_DATA = [
  { product: "Debt - Primary Residence Debt", rows: [
    { description: "Repayments", values: [29186,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
  ]},
  { product: "Debt - Rental Property Debt", rows: [
    { description: "Repayments", values: [72241,72241,72241,72241,72241,72241,0,0,0,0,0,0,0,0,0,0] },
  ]},
  { product: "Debt - RPUT Business Property", rows: [
    { description: "Repayments", values: [22359,22359,22359,22359,22359,22359,22359,0,0,0,0,0,0,0,0,0] },
  ]},
  { product: "Superannuation - Default super", entity: "Catherine", rows: [
    { description: "Super guarantee", values: [3313,3412,3515,3621,3729,3842,0,0,0,0,0,0,0,0,0,0] },
    { description: "Salary sacrifice", values: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
  ]},
  { product: "Superannuation - Default super", entity: "Paul Andrew", rows: [
    { description: "Super guarantee", values: [11966,12321,12693,13074,13466,13870,14286,0,0,0,0,0,0,0,0,0] },
    { description: "Salary sacrifice", values: [15534,15534,15534,15534,15534,15534,15534,0,0,0,0,0,0,0,0,0] },
  ]},
  { product: "Smith Family SMSF - Pension account (Default)", entity: "Catherine", rows: [
    { description: "Pension drawdown", values: [0,0,0,0,0,0,35000,36050,37132,38245,39393,40575,0,0,0,0] },
  ]},
  { product: "Smith Family SMSF - Pension account (Default)", entity: "Paul Andrew", rows: [
    { description: "Pension drawdown", values: [0,0,0,0,0,0,0,0,0,42000,43260,44558,45894,47271,48689,50150] },
  ]},
  { product: "Smith Family SMSF - Super account", entity: "Paul Andrew", rows: [
    { description: "Contributions", values: [12049,21355,22602,23919,25311,55356,58579,61984,65580,0,0,0,0,0,0,0] },
    { description: "Rollover to pension", values: [0,0,0,0,0,0,0,0,0,-372380,0,0,0,0,0,0] },
  ]},
  { product: "Smith Family SMSF - Super account", entity: "Catherine", rows: [
    { description: "Contributions", values: [12049,22354,22630,23949,25342,26814,0,0,0,0,0,0,0,0,0,0] },
    { description: "Rollover to pension", values: [0,0,0,0,0,0,-111442,0,0,0,0,0,0,0,0,0] },
  ]},
  { product: "Pension - Default pension", entity: "Catherine", rows: [
    { description: "Pension drawdown", values: [0,0,0,0,0,0,0,0,0,0,52346,1680,0,0,0,0] },
  ]},
  { product: "Pension - Default pension", entity: "Paul Andrew", rows: [
    { description: "Pension drawdown", values: [0,0,0,0,0,0,0,0,0,0,0,0,40334,16897,0,0] },
  ]},
];

export function ProductProjectionTable() {
  const [collapsed, setCollapsed] = useState({});
  const toggleSection = (e) => setCollapsed(prev => ({ ...prev, [e]: !prev[e] }));
  const formatVal = (v) => {
    if (v === 0) return <span style={{ color: "var(--ps-border-mid)" }}>0</span>;
    if (v < 0) return <span style={{ color: "var(--ps-red)" }}>{v.toLocaleString("en-AU")}</span>;
    return v.toLocaleString("en-AU");
  };

  return (
    <div style={T.scrollWrap}>
      <table style={T.scrollTable}>
        <thead>
          <tr style={T.headRow}>
            <th style={{ ...T.th, textAlign: "left", minWidth: 200, ...T.stickyTh }}>Description</th>
            <th style={{ ...T.th, textAlign: "right", minWidth: 80, position: "sticky", left: 200, background: "var(--ps-surface-alt)", zIndex: 3, borderRight: "1px solid var(--ps-border)" }}>Growth rate</th>
            {PROJECTION_YEARS.map(y => (
              <th key={y} style={T.yearTh}>{y}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PRODUCT_PROJECTION_DATA.map((group) => {
            const isCollapsed = collapsed[group.entity];
            return [
              <tr key={`e-${group.entity}`} onClick={() => toggleSection(group.entity)} style={{ cursor: "pointer" }}>
                <td colSpan={PROJECTION_YEARS.length + 2} style={{ ...T.section, background: "#f0f1f8" }}>
                  {T.arrow(isCollapsed)}
                  {group.entity}
                </td>
              </tr>,
              ...(!isCollapsed ? group.rows.map((row, ri) => {
                const bg = T.rowBg(ri);
                return (
                  <tr key={`${group.entity}-${ri}`} style={{ background: bg }}>
                    <td style={{ ...T.td, textAlign: "left", paddingLeft: 24, ...T.stickyTd(bg), minWidth: 200, fontSize: 12 }}>{row.description}</td>
                    <td style={{ ...T.td, textAlign: "right", color: "var(--ps-text-muted)", fontSize: 12, position: "sticky", left: 200, background: bg, zIndex: 1, borderRight: "1px solid var(--ps-border)", minWidth: 80 }}>{row.growthRate}</td>
                    {row.values.map((v, vi) => (
                      <td key={vi} style={{ ...T.yearTd }}>{formatVal(v)}</td>
                    ))}
                  </tr>
                );
              }) : []),
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PortfolioTransactionsTable() {
  const [collapsed, setCollapsed] = useState({});
  const toggleSection = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  const formatVal = (v) => {
    if (v === 0) return <span style={{ color: "var(--ps-border-mid)" }}>0</span>;
    if (v < 0) return <span style={{ color: "var(--ps-red)" }}>{v.toLocaleString("en-AU")}</span>;
    return v.toLocaleString("en-AU");
  };

  return (
    <div style={T.scrollWrap}>
      <table style={T.scrollTable}>
        <thead>
          <tr style={T.headRow}>
            <th style={{ ...T.th, textAlign: "left", minWidth: 220, ...T.stickyTh }}>{""}</th>
            {PROJECTION_YEARS.map(y => (
              <th key={y} style={T.yearTh}>{y}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PORTFOLIO_TRANSACTIONS_DATA.map((group, gi) => {
            const key = group.product + (group.entity ? ` (${group.entity})` : "");
            const isCollapsed = collapsed[key];
            return [
              <tr key={`p-${gi}`} onClick={() => toggleSection(key)} style={{ cursor: "pointer" }}>
                <td colSpan={PROJECTION_YEARS.length + 1} style={{ ...T.section, background: "#f0f1f8", borderLeft: "3px solid #6366f1" }}>
                  {T.arrow(isCollapsed)}
                  {group.product}{group.entity ? <span style={{ marginLeft: 8 }}><EntityBadge name={group.entity} size="sm" /></span> : ""}
                </td>
              </tr>,
              ...(!isCollapsed ? group.rows.map((row, ri) => {
                const bg = T.rowBg(ri);
                return (
                  <tr key={`${gi}-${ri}`} style={{ background: bg }}>
                    <td style={{ ...T.td, textAlign: "left", paddingLeft: 28, fontSize: 12, ...T.stickyTd(bg), minWidth: 220 }}>{row.description}</td>
                    {row.values.map((v, vi) => (
                      <td key={vi} style={T.yearTd}>{formatVal(v)}</td>
                    ))}
                  </tr>
                );
              }) : []),
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}

// Advice Detail > Benefit of Advice Dashboard
const BOA_NAMES = ["No advice", "With advice"];
const BOA_COLORS = ["var(--ps-text-subtle)", "#4338ca"];

const BOA_RADAR = [
  { metric: "Net Equity", m1: 82, m2: 92 },
  { metric: "Income", m1: 80, m2: 85 },
  { metric: "Low Debt", m1: 95, m2: 45 },
  { metric: "Tax Efficiency", m1: 78, m2: 72 },
  { metric: "Risk Score", m1: 96, m2: 94 },
  { metric: "Retirement", m1: 80, m2: 88 },
];

const BOA_NET_EQUITY = [
  { year: 1, m1: 4525658, m2: 4571608 },
  { year: 2, m1: 4850000, m2: 4820000 },
  { year: 3, m1: 5200000, m2: 5100000 },
  { year: 4, m1: 5500000, m2: 5350000 },
  { year: 5, m1: 6062120, m2: 5881279 },
  { year: 6, m1: 6400000, m2: 6150000 },
  { year: 7, m1: 6800000, m2: 6500000 },
  { year: 8, m1: 7200000, m2: 6850000 },
  { year: 9, m1: 7600000, m2: 7050000 },
  { year: 10, m1: 7994257, m2: 7218194 },
  { year: 11, m1: 7900000, m2: 7050000 },
  { year: 12, m1: 7800000, m2: 6900000 },
  { year: 13, m1: 7700000, m2: 6750000 },
  { year: 14, m1: 7600000, m2: 6600000 },
  { year: 15, m1: 7500000, m2: 6450000 },
  { year: 16, m1: 7400000, m2: 6300000 },
  { year: 17, m1: 7350000, m2: 6200000 },
  { year: 18, m1: 7300000, m2: 6100000 },
  { year: 19, m1: 7200000, m2: 6000000 },
  { year: 20, m1: 7119781, m2: 5919725 },
];

const BOA_DEBT = [
  { year: 1, m1: 436309, m2: 2584884 },
  { year: 2, m1: 396235, m2: 2500000 },
  { year: 3, m1: 340000, m2: 2450000 },
  { year: 4, m1: 200000, m2: 2420000 },
  { year: 5, m1: 62089, m2: 2426538 },
  { year: 6, m1: 30000, m2: 2380000 },
  { year: 7, m1: 0, m2: 2300000 },
  { year: 8, m1: 0, m2: 2250000 },
  { year: 9, m1: 0, m2: 2200000 },
  { year: 10, m1: 0, m2: 2168832 },
  { year: 15, m1: 0, m2: 1800000 },
  { year: 20, m1: 0, m2: 1363296 },
];

const BOA_INCOME = [
  { year: 1, m1: 164295, m2: 170000 },
  { year: 3, m1: 174700, m2: 182000 },
  { year: 5, m1: 185909, m2: 195000 },
  { year: 7, m1: 191013, m2: 198000 },
  { year: 9, m1: 155000, m2: 165000 },
  { year: 10, m1: 131349, m2: 145000 },
  { year: 15, m1: 95000, m2: 110000 },
  { year: 20, m1: 80000, m2: 95000 },
];

const BOA_EXPENSES = [
  { year: 1, m1: 650000, m2: 758000 },
  { year: 3, m1: 580000, m2: 700000 },
  { year: 5, m1: 520000, m2: 660000 },
  { year: 7, m1: 420000, m2: 580000 },
  { year: 9, m1: 350000, m2: 500000 },
  { year: 10, m1: 320000, m2: 470000 },
  { year: 15, m1: 380000, m2: 450000 },
  { year: 20, m1: 420000, m2: 461000 },
];

const BOA_TAX = [
  { year: 1, m1: 383215, m2: 409808 },
  { year: 2, m1: 395000, m2: 415000 },
  { year: 3, m1: 408000, m2: 420000 },
  { year: 4, m1: 420000, m2: 425000 },
  { year: 5, m1: 440000, m2: 432000 },
  { year: 6, m1: 450000, m2: 438000 },
  { year: 7, m1: 390000, m2: 395000 },
  { year: 8, m1: 360000, m2: 365000 },
  { year: 9, m1: 310000, m2: 320000 },
  { year: 10, m1: 265000, m2: 280000 },
  { year: 11, m1: 210000, m2: 225000 },
  { year: 12, m1: 170000, m2: 185000 },
];

export function BenefitOfAdviceDashboard() {
  const [collapsed, setCollapsed] = useState({});
  const toggleSection = (title) => setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));

  const BOA_COLS = [
    { label: "No Advice", color: "var(--ps-text-muted)", bg: "var(--ps-surface-alt)", idx: 0 },
    { label: "With Advice", color: "#4338CA", bg: "var(--ps-surface-indigo)", idx: 1 },
  ];

  // Pull No Advice (col 0) and Current Position (col 1) from MC_DETAIL_DATA
  const sections = MC_DETAIL_DATA["Summary"] || [];

  const formatVal = (val) => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "string") return val;
    return val.toLocaleString("en-AU");
  };
  const fC = (v) => `$${Math.round(v).toLocaleString("en-AU")}`;

  // ─── Heatmap metrics (same as Model Comparison but 2-col) ───
  const findRow = (sTitle, rLabel) => {
    const sec = sections.find(s => s.title === sTitle);
    const vals = sec?.rows.find(r => r.label === rLabel)?.values || [];
    return [vals[0] || 0, vals[1] || 0]; // No advice, Current Position
  };

  const heatMetrics = [
    { label: "Capital Yr 1", values: findRow("Capital", "Year 1"), higher: true },
    { label: "Capital Yr 5", values: findRow("Capital", "Year 5"), higher: true },
    { label: "Capital Yr 10", values: findRow("Capital", "Year 10"), higher: true },
    { label: "Capital Yr 20", values: findRow("Capital", "Year 20"), higher: true },
    { label: "Net Income Yr 5", values: findRow("Accumulated net income", "Year 5"), higher: true },
    { label: "Net Income Yr 10", values: findRow("Accumulated net income", "Year 10"), higher: true },
    { label: "Net Income Yr 20", values: findRow("Accumulated net income", "Year 20"), higher: true },
    { label: "Income in Retirement", values: findRow("Retirement analysis", "Income in retirement"), higher: true },
    { label: "Risk (Worst case)", values: findRow("Risk", "Net equity - Worst case"), higher: true },
    { label: "Debt Yr 10", values: findRow("Debt", "Year 10"), higher: false },
    { label: "Tax (Lifetime)", values: findRow("Tax (Personal)", "Lifetime"), higher: false },
  ];

  const rankRow = (values, higherIsBetter) => {
    const numVals = values.map(v => typeof v === "string" ? parseFloat(v) || 0 : (v || 0));
    const sorted = [...numVals].sort((a, b) => higherIsBetter ? b - a : a - b);
    return numVals.map(v => sorted.indexOf(v) + 1);
  };

  const rankColors = (rank, total) => {
    if (rank === 1) return { bg: "var(--ps-bg-green-200)", text: "var(--ps-badge-green)" };
    return { bg: "var(--ps-bg-red-200)", text: "var(--ps-badge-red)" };
  };

  // Compute differences
  const diffMetrics = heatMetrics.map(m => {
    const diff = m.higher ? m.values[1] - m.values[0] : m.values[0] - m.values[1];
    return { ...m, diff, positive: diff > 0 };
  });

  const adviceWins = diffMetrics.filter(d => d.positive).length;
  const noAdviceWins = diffMetrics.filter(d => !d.positive && d.diff !== 0).length;
  const ties = diffMetrics.filter(d => d.diff === 0).length;

  const [showRank, setShowRank] = useState(false);

  // Chart helpers
  const formatYAxis = (val) => val === 0 ? "0" : val >= 1000000 ? `$${(val/1e6).toFixed(1)}m` : val >= 1000 ? `$${Math.round(val/1000)}k` : `$${val}`;
  const formatTooltip = (val) => `$${Math.abs(val).toLocaleString("en-AU")}`;
  const ttStyle = { background: "var(--ps-text-strongest)", border: "none", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--ps-tile-dark-text)" };

  const rankLabel = (rank) => rank === 1 ? "1st 🥇" : rank === 2 ? "2nd" : `${rank}th`;

  return (
    <div>
      {/* Summary tiles */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{
          flex: 1, minWidth: 180, padding: "18px 24px", borderRadius: 12,
          background: "linear-gradient(135deg, #4338CA 0%, #3730A3 100%)", color: "var(--ps-tile-dark-text)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ps-ring-indigo)" }}>Advice Wins</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{adviceWins} / {heatMetrics.length}</div>
          <div style={{ fontSize: 12, color: "#A5B4FC", marginTop: 2 }}>metrics where advice outperforms</div>
        </div>
        <div style={{
          flex: 1, minWidth: 180, padding: "18px 24px", borderRadius: 12,
          background: "var(--ps-tile-slate)", color: "var(--ps-tile-dark-text)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ps-border-mid)" }}>No Advice Wins</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{noAdviceWins} / {heatMetrics.length}</div>
          <div style={{ fontSize: 12, color: "var(--ps-text-subtle)", marginTop: 2 }}>metrics without advice advantage</div>
        </div>
        {ties > 0 && (
          <div style={{ flex: 1, minWidth: 140, padding: "14px 18px", borderRadius: 12, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase" }}>Tied</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ps-text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>{ties}</div>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 140, padding: "14px 18px", borderRadius: 12, background: "var(--ps-surface-emerald)", border: "1px solid var(--ps-ring-green)" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-green)", textTransform: "uppercase" }}>Yr 20 Net Equity Uplift</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ps-green)", fontFamily: "'JetBrains Mono', monospace" }}>{fC((findRow("Capital", "Year 20")[1] || 0) - (findRow("Capital", "Year 20")[0] || 0))}</div>
        </div>
        <div style={{ flex: 1, minWidth: 140, padding: "14px 18px", borderRadius: 12, background: "var(--ps-bg-amber-200)", border: "1px solid var(--ps-ring-amber)" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#D97706", textTransform: "uppercase" }}>Retirement Income Uplift</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#D97706", fontFamily: "'JetBrains Mono', monospace" }}>{fC((findRow("Retirement analysis", "Income in retirement")[1] || 0) - (findRow("Retirement analysis", "Income in retirement")[0] || 0))}</div>
        </div>
      </div>

      {/* ─── Heatmap ─── */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-strongest)" }}>Advice vs No Advice — Ranking Heatmap</div>
          {/* Amount / Rank toggle */}
          <div style={{ display: "flex", background: "var(--ps-border-light)", borderRadius: 8, padding: 3, gap: 2 }}>
            {[["Amount", false], ["Rank", true]].map(([label, val]) => (
              <button key={label} onClick={() => setShowRank(val)} style={{
                padding: "5px 16px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600,
                background: showRank === val ? "var(--ps-surface)" : "transparent",
                color: showRank === val ? "var(--ps-text-primary)" : "var(--ps-text-subtle)",
                boxShadow: showRank === val ? "0 1px 3px var(--ps-shadow-md)" : "none",
                transition: "all 0.15s",
              }}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginBottom: 14 }}>
          {showRank ? "Rank 1 = best performing model on that metric." : "Green = better performing model on that metric. Shows actual values and the difference."}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--ps-text-muted)", textTransform: "uppercase", borderBottom: "2px solid var(--ps-border)", width: "25%" }}>Metric</th>
              {BOA_COLS.map(col => (
                <th key={col.idx} style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, fontWeight: 700, borderBottom: "2px solid var(--ps-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                    <span style={{ color: col.color }}>{col.label}</span>
                  </div>
                </th>
              ))}
              {!showRank && (
                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--ps-text-muted)", textTransform: "uppercase", borderBottom: "2px solid var(--ps-border)", width: "18%" }}>Difference</th>
              )}
            </tr>
          </thead>
          <tbody>
            {diffMetrics.map((m, mi) => {
              const ranks = rankRow(m.values, m.higher);
              return (
                <tr key={mi} style={{ borderBottom: "1px solid var(--ps-border-light)" }}>
                  <td style={{ padding: "9px 14px", fontSize: 13, fontWeight: 500, color: "var(--ps-text-body)" }}>{m.label}</td>
                  {m.values.map((v, vi) => {
                    const rc = rankColors(ranks[vi], 2);
                    const rank = ranks[vi];
                    return (
                      <td key={vi} style={{ padding: "6px 14px", textAlign: "center" }}>
                        {showRank ? (
                          <div style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            gap: 6, padding: "4px 16px", borderRadius: 8, background: rc.bg, minWidth: 64,
                          }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: rc.text, fontFamily: "'JetBrains Mono',monospace" }}>
                              {rank === 1 ? "🥇 1st" : "2nd"}
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 8, background: rc.bg }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: rc.text, fontFamily: "'JetBrains Mono',monospace" }}>
                              {typeof v === "string" ? v : v.toLocaleString("en-AU")}
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  {!showRank && (
                    <td style={{ padding: "6px 14px", textAlign: "center" }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace",
                        color: m.diff > 0 ? "var(--ps-green)" : m.diff < 0 ? "var(--ps-red)" : "var(--ps-text-subtle)",
                      }}>
                        {m.diff > 0 ? "+" : ""}{typeof m.diff === "number" ? m.diff.toLocaleString("en-AU") : m.diff}
                        {m.diff !== 0 && <span style={{ marginLeft: 4, fontSize: 10 }}>{m.positive ? "▲" : "▼"}</span>}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Charts ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {[
          { title: "Net Equity", data: BOA_NET_EQUITY },
          { title: "Debt", data: BOA_DEBT },
        ].map(ch => (
          <div key={ch.title} style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, marginTop: 0 }}>{ch.title} Comparison</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={ch.data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gBoa1${ch.title}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--ps-text-subtle)" stopOpacity={0.2} /><stop offset="95%" stopColor="var(--ps-text-subtle)" stopOpacity={0.02} /></linearGradient>
                  <linearGradient id={`gBoa2${ch.title}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4338CA" stopOpacity={0.2} /><stop offset="95%" stopColor="#4338CA" stopOpacity={0.02} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
                <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
                <Tooltip formatter={formatTooltip} labelFormatter={l => `Year ${l}`} contentStyle={ttStyle} labelStyle={{ color: "var(--ps-text-subtle)" }} />
                <Area type="monotone" dataKey="m1" name="No Advice" stroke="var(--ps-text-subtle)" strokeWidth={2} fill={`url(#gBoa1${ch.title})`} dot={false} />
                <Area type="monotone" dataKey="m2" name="With Advice" stroke="#4338CA" strokeWidth={2.5} fill={`url(#gBoa2${ch.title})`} dot={false} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {[
          { title: "Income", data: BOA_INCOME },
          { title: "Tax", data: BOA_TAX },
        ].map(ch => (
          <div key={ch.title} style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, marginTop: 0 }}>{ch.title} Comparison</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={ch.data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={{ stroke: "var(--ps-border)" }} />
                <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "var(--ps-text-subtle)" }} tickLine={false} axisLine={false} width={60} />
                <Tooltip formatter={formatTooltip} labelFormatter={l => `Year ${l}`} contentStyle={ttStyle} labelStyle={{ color: "var(--ps-text-subtle)" }} />
                <Line type="monotone" dataKey="m1" name="No Advice" stroke="var(--ps-text-subtle)" strokeWidth={2} dot={{ r: 3, fill: "var(--ps-text-subtle)" }} />
                <Line type="monotone" dataKey="m2" name="With Advice" stroke="#4338CA" strokeWidth={2.5} dot={{ r: 3, fill: "#4338CA" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* ─── Detail table ─── */}
      <div style={T.scrollWrap}>
        <table style={{ ...T.scrollTable, borderCollapse: "separate", borderSpacing: 0, width: "100%", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ ...T.th, textAlign: "left", width: "25%", background: "var(--ps-surface-alt)", color: "var(--ps-text-secondary)", position: "sticky", left: 0, zIndex: 3, borderBottom: "2px solid var(--ps-border)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }} />
              {BOA_COLS.map(col => (
                <th key={col.idx} style={{ ...T.th, textAlign: "right", background: "var(--ps-surface-alt)", borderBottom: "2px solid var(--ps-border)", padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-text-secondary)" }}>{col.label}</span>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color === "var(--ps-text-muted)" ? "var(--ps-text-subtle)" : col.color, opacity: 0.9 }} />
                  </div>
                </th>
              ))}
              <th style={{ ...T.th, textAlign: "right", background: "var(--ps-surface-alt)", borderBottom: "2px solid var(--ps-border)", padding: "12px 16px" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-text-secondary)" }}>Difference</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => {
              const isCollapsed = collapsed[section.title];
              const icon = MC_DETAIL_SECTION_ICONS[section.title] || "📋";
              return [
                <tr key={`t-${section.title}`} onClick={() => toggleSection(section.title)} style={{ cursor: "pointer" }}>
                  <td colSpan={4} style={{ padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "var(--ps-text-strongest)", background: "var(--ps-border-light)", borderBottom: "1px solid var(--ps-border)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    <span style={{ marginRight: 8 }}>{icon}</span>
                    <span style={{ marginRight: 6, fontSize: 10, color: "var(--ps-text-subtle)", display: "inline-block", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
                    {section.title}
                  </td>
                </tr>,
                ...(!isCollapsed ? section.rows.map((row, i) => {
                  const bg = "var(--ps-surface)";
                  const v0 = row.values[0]; // No advice
                  const v1 = row.values[1]; // With advice
                  const n0 = typeof v0 === "string" ? parseFloat(v0) || 0 : v0 || 0;
                  const n1 = typeof v1 === "string" ? parseFloat(v1) || 0 : v1 || 0;
                  const diff = n1 - n0;
                  return (
                    <tr key={`${section.title}-${i}`} style={{ background: bg }}>
                      <td style={{ padding: "10px 16px 10px 40px", fontSize: 13, fontWeight: 500, color: "var(--ps-text-secondary)", position: "sticky", left: 0, background: bg, zIndex: 1, borderRight: "1px solid var(--ps-border-light)", borderBottom: "1px solid var(--ps-border-light)", whiteSpace: "nowrap" }}>{row.label}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 500, color: "var(--ps-text-muted)", borderBottom: "1px solid var(--ps-border-light)", background: bg }}>{formatVal(v0)}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 500, color: "#4338CA", borderBottom: "1px solid var(--ps-border-light)", background: bg }}>{formatVal(v1)}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600, color: diff > 0 ? "var(--ps-green)" : diff < 0 ? "var(--ps-red)" : "var(--ps-text-subtle)", borderBottom: "1px solid var(--ps-border-light)", background: bg }}>
                        {diff === 0 ? "—" : `${diff > 0 ? "+" : ""}${typeof v0 === "string" ? (diff > 0 ? "+" : "") + diff.toFixed(2) + "%" : diff.toLocaleString("en-AU")}`}
                      </td>
                    </tr>
                  );
                }) : []),
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Portfolio data
const PORTFOLIO_PRODUCTS = [
  {
    name: "Catherine - Default Super",
    entity: "Catherine",
    totalValue: 485000,
    holdings: [
      { name: "Vanguard Australian Shares Index", value: 194000, weight: 40.0, fee: 0.18 },
      { name: "Vanguard International Shares Index", value: 145500, weight: 30.0, fee: 0.18 },
      { name: "Vanguard Diversified Bond Fund", value: 97000, weight: 20.0, fee: 0.26 },
      { name: "IFM Australian Infrastructure Fund", value: 48500, weight: 10.0, fee: 0.65 },
    ],
  },
  {
    name: "Paul Andrew - Default Super",
    entity: "Paul Andrew",
    totalValue: 620000,
    holdings: [
      { name: "Magellan Global Fund", value: 186000, weight: 30.0, fee: 1.35 },
      { name: "Vanguard Australian Shares Index", value: 155000, weight: 25.0, fee: 0.18 },
      { name: "Platinum International Fund", value: 124000, weight: 20.0, fee: 1.10 },
      { name: "Dimensional Global Real Return", value: 93000, weight: 15.0, fee: 0.55 },
      { name: "Pendal Sustainable Fixed Interest", value: 62000, weight: 10.0, fee: 0.48 },
    ],
  },
  {
    name: "Catherine - Default Pension",
    entity: "Catherine",
    totalValue: 350000,
    holdings: [
      { name: "Vanguard Australian Shares Index", value: 105000, weight: 30.0, fee: 0.18 },
      { name: "Antipodes Global Fund", value: 87500, weight: 25.0, fee: 1.20 },
      { name: "Vanguard Diversified Bond Fund", value: 70000, weight: 20.0, fee: 0.26 },
      { name: "Australian Foundation Inv Co (AFIC)", value: 52500, weight: 15.0, fee: 0.14 },
      { name: "IFM Australian Infrastructure Fund", value: 35000, weight: 10.0, fee: 0.65 },
    ],
  },
  {
    name: "Joint - Investment Portfolio",
    entity: "Joint",
    totalValue: 280000,
    holdings: [
      { name: "Vanguard International Shares Index", value: 84000, weight: 30.0, fee: 0.18 },
      { name: "Vanguard Australian Shares Index", value: 70000, weight: 25.0, fee: 0.18 },
      { name: "Magellan Global Fund", value: 56000, weight: 20.0, fee: 1.35 },
      { name: "Vanguard Diversified Bond Fund", value: 42000, weight: 15.0, fee: 0.26 },
      { name: "Dimensional Global Real Return", value: 28000, weight: 10.0, fee: 0.55 },
    ],
  },
  {
    name: "Smith Family SMSF",
    entity: "SMSF",
    totalValue: 410000,
    holdings: [
      { name: "Vanguard Australian Shares Index", value: 123000, weight: 30.0, fee: 0.18 },
      { name: "Platinum International Fund", value: 82000, weight: 20.0, fee: 1.10 },
      { name: "Australian Foundation Inv Co (AFIC)", value: 82000, weight: 20.0, fee: 0.14 },
      { name: "IFM Australian Infrastructure Fund", value: 61500, weight: 15.0, fee: 0.65 },
      { name: "Pendal Sustainable Fixed Interest", value: 61500, weight: 15.0, fee: 0.48 },
    ],
  },
];

// Compute aggregated data
const ALL_HOLDINGS = PORTFOLIO_PRODUCTS.flatMap(p => p.holdings);
const TOTAL_PORTFOLIO_VALUE = PORTFOLIO_PRODUCTS.reduce((s, p) => s + p.totalValue, 0);

// Asset allocation by type
const ASSET_CLASSES = [
  { name: "Australian Equities", color: "#3b5998" },
  { name: "International Equities", color: "#93b5e0" },
  { name: "Fixed Interest", color: "#e8913a" },
  { name: "Infrastructure", color: "#4a7c3f" },
  { name: "Alternatives", color: "#8b6cc1" },
];

const ASSET_ALLOCATION = (() => {
  const ausEq = ALL_HOLDINGS.filter(h => h.name.includes("Australian Shares") || h.name.includes("AFIC")).reduce((s, h) => s + h.value, 0);
  const intEq = ALL_HOLDINGS.filter(h => h.name.includes("International") || h.name.includes("Magellan") || h.name.includes("Platinum") || h.name.includes("Antipodes")).reduce((s, h) => s + h.value, 0);
  const fi = ALL_HOLDINGS.filter(h => h.name.includes("Bond") || h.name.includes("Fixed")).reduce((s, h) => s + h.value, 0);
  const infra = ALL_HOLDINGS.filter(h => h.name.includes("Infrastructure")).reduce((s, h) => s + h.value, 0);
  const alt = ALL_HOLDINGS.filter(h => h.name.includes("Dimensional")).reduce((s, h) => s + h.value, 0);
  return [
    { name: "Australian Equities", value: ausEq },
    { name: "International Equities", value: intEq },
    { name: "Fixed Interest", value: fi },
    { name: "Infrastructure", value: infra },
    { name: "Alternatives", value: alt },
  ];
})();

const ALLOCATION_COLORS = ["#3b5998", "#93b5e0", "#e8913a", "#4a7c3f", "#8b6cc1"];

// Fee attribution - aggregate fees by fund, top 5 + other
const FEE_BY_FUND = (() => {
  const map = {};
  ALL_HOLDINGS.forEach(h => {
    const fee = h.value * h.fee / 100;
    map[h.name] = (map[h.name] || 0) + fee;
  });
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const top5 = sorted.slice(0, 5).map(([name, fee]) => ({ name: name.length > 25 ? name.substring(0, 22) + "..." : name, value: Math.round(fee) }));
  const otherFee = sorted.slice(5).reduce((s, [, f]) => s + f, 0);
  if (otherFee > 0) top5.push({ name: "Other", value: Math.round(otherFee) });
  return top5;
})();

const FEE_COLORS = ["#3b5998", "#93b5e0", "#e8913a", "#4a7c3f", "#8b6cc1", "#a8c4e0"];

export function PortfolioDashboard() {
  const [expandedProduct, setExpandedProduct] = useState(null);

  const chartCard = (title, children, style = {}) => (
    <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "16px 12px 8px", ...style }}>
      <div style={{ textAlign: "center", fontWeight: 600, fontSize: 13, color: "var(--ps-text-primary)", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return percent > 0.05 ? (
      <text x={x} y={y} fill="var(--ps-surface)" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {(percent * 100).toFixed(0)}%
      </text>
    ) : null;
  };

  const totalFees = FEE_BY_FUND.reduce((s, f) => s + f.value, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginBottom: 4 }}>Total Portfolio Value</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--ps-text-primary)" }}>${TOTAL_PORTFOLIO_VALUE.toLocaleString("en-AU")}</div>
        </div>
        <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginBottom: 4 }}>Total Annual Fees</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#e8913a" }}>${totalFees.toLocaleString("en-AU")}</div>
        </div>
        <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginBottom: 4 }}>Weighted Avg Fee</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--ps-text-primary)" }}>{(totalFees / TOTAL_PORTFOLIO_VALUE * 100).toFixed(2)}%</div>
        </div>
      </div>

      {/* Row 1: Asset Allocation donut | Fee Attribution donut */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {chartCard("Asset allocation",
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={ASSET_ALLOCATION} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={110} labelLine={false} label={renderCustomLabel}>
                {ASSET_ALLOCATION.map((_, i) => <Cell key={i} fill={ALLOCATION_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => "$" + v.toLocaleString("en-AU")} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} />
              <Legend iconType="square" wrapperStyle={{ fontSize: 11, color: "var(--ps-text-muted)" }} />
            </PieChart>
          </ResponsiveContainer>
        )}

        {chartCard("Fee attribution (top 5)",
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={FEE_BY_FUND} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => "$" + v.toLocaleString("en-AU")} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} width={130} />
              <Tooltip formatter={(v) => "$" + v.toLocaleString("en-AU")} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} />
              <Bar dataKey="value" name="Annual Fee" radius={[0, 4, 4, 0]}>
                {FEE_BY_FUND.map((_, i) => <Cell key={i} fill={FEE_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Product cards */}
      {PORTFOLIO_PRODUCTS.map((product, pi) => {
        const isExpanded = expandedProduct === pi;
        const productFee = product.holdings.reduce((s, h) => s + h.value * h.fee / 100, 0);
        const avgFee = (productFee / product.totalValue * 100).toFixed(2);
        return (
          <div key={pi} style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", overflow: "hidden" }}>
            <div onClick={() => setExpandedProduct(isExpanded ? null : pi)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", cursor: "pointer", background: isExpanded ? "var(--ps-surface-alt)" : "var(--ps-surface)",
                borderBottom: isExpanded ? "1px solid var(--ps-border)" : "none",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 10, color: "var(--ps-text-subtle)" }}>{isExpanded ? "▾" : "▸"}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ps-text-primary)" }}>{product.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                    <EntityBadge name={product.entity} size="sm" />
                    <span>· {product.holdings.length} holdings</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>Value</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ps-text-primary)" }}>${product.totalValue.toLocaleString("en-AU")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>Avg Fee</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#e8913a" }}>{avgFee}%</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>Annual Cost</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ps-text-muted)" }}>${Math.round(productFee).toLocaleString("en-AU")}</div>
                </div>
              </div>
            </div>
            {isExpanded && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--ps-surface-alt)" }}>
                    <th style={{ padding: "8px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", borderBottom: "1px solid var(--ps-border)" }}>Investment</th>
                    <th style={{ padding: "8px 20px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", borderBottom: "1px solid var(--ps-border)" }}>Value</th>
                    <th style={{ padding: "8px 20px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", borderBottom: "1px solid var(--ps-border)" }}>Weight</th>
                    <th style={{ padding: "8px 20px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", borderBottom: "1px solid var(--ps-border)" }}>MER</th>
                    <th style={{ padding: "8px 20px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", borderBottom: "1px solid var(--ps-border)" }}>Annual Fee</th>
                    <th style={{ padding: "8px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", borderBottom: "1px solid var(--ps-border)", width: 120 }}>Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {product.holdings.map((h, hi) => (
                    <tr key={hi} style={{ background: hi % 2 === 0 ? "var(--ps-surface)" : "var(--ps-surface-alt)" }}>
                      <td style={{ padding: "10px 20px", fontSize: 13, color: "var(--ps-text-body)" }}>{h.name}</td>
                      <td style={{ padding: "10px 20px", fontSize: 13, color: "var(--ps-text-body)", textAlign: "right", fontWeight: 500 }}>${h.value.toLocaleString("en-AU")}</td>
                      <td style={{ padding: "10px 20px", fontSize: 13, color: "var(--ps-text-muted)", textAlign: "right" }}>{h.weight.toFixed(1)}%</td>
                      <td style={{ padding: "10px 20px", fontSize: 13, color: "#e8913a", textAlign: "right", fontWeight: 500 }}>{h.fee.toFixed(2)}%</td>
                      <td style={{ padding: "10px 20px", fontSize: 13, color: "var(--ps-text-muted)", textAlign: "right" }}>${Math.round(h.value * h.fee / 100).toLocaleString("en-AU")}</td>
                      <td style={{ padding: "10px 20px" }}>
                        <div style={{ background: "var(--ps-border)", borderRadius: 4, height: 8, width: 100 }}>
                          <div style={{ background: "#4338ca", borderRadius: 4, height: 8, width: h.weight }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Retirement > Comparison chart data
const INCOME_IN_RET_COMPARISON = [
  { category: "Projected", value: 150477 },
  { category: "Required", value: 120000 },
  { category: "Shortfall/Surplus", value: 30477 },
];

const RETIREMENT_AGE_COMPARISON = [
  { category: "Projected", catherine: 60, paulAndrew: 60 },
  { category: "Target", catherine: 65, paulAndrew: 65 },
  { category: "Shortfall/Surplus", catherine: 5, paulAndrew: 5 },
];

const REQUIRED_RETURN_COMPARISON = [
  { category: "Required return", value: -3.76 },
  { category: "Target return", value: 5 },
  { category: "Surplus/Deficit", value: 8.76 },
];

export function RetirementDashboard({ meta, superProj, pensionFunds, contribData }) {
  const [hidden1, setHidden1] = useState({});
  const [hidden2, setHidden2] = useState({});
  const toggleFactory = (setFn) => (dataKey) => setFn(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  const toggle1 = toggleFactory(setHidden1);
  const toggle2 = toggleFactory(setHidden2);

  const formatYAxis = (val) => val === 0 ? "0" : val.toLocaleString("en-AU");
  const formatTooltip = (val) => val.toLocaleString("en-AU");
  const fC = (v) => {
    const abs = Math.abs(v || 0);
    if (abs >= 1000000) return "$" + (abs / 1000000).toFixed(2) + "M";
    if (abs >= 1000)    return "$" + Math.round(abs / 1000) + "k";
    return "$" + Math.round(abs).toLocaleString("en-AU");
  };

  const makeLegend = (hiddenState, toggleFn) => (props) => (
    <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", paddingTop: 6 }}>
      {props.payload.map((entry) => (
        <span key={entry.dataKey} onClick={() => toggleFn(entry.dataKey)}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 11, opacity: hiddenState[entry.dataKey] ? 0.35 : 1 }}>
          <span style={{ width: 10, height: 10, background: entry.color, borderRadius: 2, display: "inline-block" }} />
          {entry.value}
        </span>
      ))}
    </div>
  );

  const chartCard = (title, children, style = {}) => (
    <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "16px 12px 8px", ...style }}>
      <div style={{ textAlign: "center", fontWeight: 600, fontSize: 13, color: "var(--ps-text-primary)", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );

  // ── KPI calculations ──
  const c1Name  = meta?.c1Name  || "Client 1";
  const c2Name  = meta?.c2Name  || "Client 2";
  const c1RetAge = meta?.c1RetAge || 67;
  const c2RetAge = meta?.c2RetAge || 67;
  const c1RetYr  = meta?.c1RetYr  || 0;
  const c2RetYr  = meta?.c2RetYr  || 0;
  const currentFY = meta?.currentFY || new Date().getFullYear();
  const c1RetFY = `${currentFY + c1RetYr}/${String(currentFY + c1RetYr + 1).slice(-2)}`;
  const c2RetFY = `${currentFY + c2RetYr}/${String(currentFY + c2RetYr + 1).slice(-2)}`;

  // Total pension drawdown across all pension funds
  const totalPensionDrawdown = (pensionFunds || []).reduce((sum, pf) => {
    const bal = parseFloat(pf.balance) || 0;
    const drawdownRate = (parseFloat(pf.drawdown_rate) || 5) / 100;
    const N = 30;
    let running = bal, total = 0;
    for (let y = 0; y < N; y++) {
      if (running <= 0) break;
      const draw = Math.round(running * drawdownRate);
      total += draw;
      running = running * 1.07 - draw;
    }
    return sum + total;
  }, 0);

  // Super balance at retirement (sum of all super closing vals at retirement year)
  const superAtRetirement = (superProj || []).reduce((sum, proj) => {
    const retY = Math.min(c1RetYr, c2RetYr);
    return sum + (proj.closingVals?.[retY] || 0);
  }, 0);

  // Total contributions (both clients)
  const totalContrib = (contribData?.c1Total || 0) + (contribData?.c2Total || 0);

  const kpis = [
    {
      label: `${c1Name} Retires`,
      value: c1RetFY,
      sub: `Age ${c1RetAge}`,
      color: "#6366F1",
      icon: "🌴",
    },
    {
      label: `${c2Name} Retires`,
      value: c2RetFY,
      sub: `Age ${c2RetAge}`,
      color: "#0891B2",
      icon: "🌴",
    },
    {
      label: "Super at Retirement",
      value: fC(superAtRetirement),
      sub: "Combined balance",
      color: "var(--ps-green)",
      icon: "🏦",
    },
    {
      label: "Total Contributions",
      value: fC(totalContrib),
      sub: "Over projection period",
      color: "#D97706",
      icon: "💰",
    },
    {
      label: "Lifetime Pension Income",
      value: fC(totalPensionDrawdown),
      sub: "Estimated drawdowns",
      color: "#7C3AED",
      icon: "📈",
    },
  ];

  // Health check tile data from HEALTH_CHECK_DATA
  const incomeSection  = HEALTH_CHECK_DATA.sections.find(s => s.title === "Income");
  const capitalSection = HEALTH_CHECK_DATA.sections.find(s => s.title === "Capital");
  const durationSection= HEALTH_CHECK_DATA.sections.find(s => s.title === "Duration");
  const shortfallSection = HEALTH_CHECK_DATA.sections.find(s => s.title === "Shortfall requirements");

  const getRow = (section, label) => section?.rows.find(r => r.label.toLowerCase().includes(label.toLowerCase()));

  const maxIncome    = getRow(incomeSection, "max")?.joint;
  const targetIncome = getRow(incomeSection, "target")?.joint;
  const incomeSurplus = getRow(incomeSection, "shortfall")?.joint;

  const targetCap    = getRow(capitalSection, "target")?.joint;
  const expectedCap  = getRow(capitalSection, "expected")?.joint;
  const capSurplus   = getRow(capitalSection, "shortfall")?.joint;

  const equityYrs    = getRow(durationSection, "years equity")?.client;
  const lifeExp      = getRow(durationSection, "life expectancy")?.client;
  const durationBuf  = getRow(durationSection, "shortfall")?.client;

  const reqReturn    = getRow(shortfallSection, "required return")?.joint;

  const healthTiles = [
    {
      label: "Retirement Income",
      value: fC(maxIncome || 0),
      sub: `Target: ${fC(targetIncome || 0)}`,
      surplus: incomeSurplus,
      surplusLabel: incomeSurplus >= 0 ? `+${fC(incomeSurplus)} surplus` : `${fC(incomeSurplus)} shortfall`,
      ok: (incomeSurplus || 0) >= 0,
      color: "#6366F1",
      icon: "💰",
    },
    {
      label: "Capital at Retirement",
      value: fC(expectedCap || 0),
      sub: `Target: ${fC(targetCap || 0)}`,
      surplus: capSurplus,
      surplusLabel: capSurplus >= 0 ? `+${fC(capSurplus)} surplus` : `${fC(capSurplus)} shortfall`,
      ok: (capSurplus || 0) >= 0,
      color: "#0891B2",
      icon: "🏦",
    },
    {
      label: "Equity Duration",
      value: `${equityYrs || 0} yrs`,
      sub: `Life expectancy: ${lifeExp || 0} yrs`,
      surplus: durationBuf,
      surplusLabel: durationBuf >= 0 ? `+${durationBuf} yr buffer` : `${durationBuf} yr shortfall`,
      ok: (durationBuf || 0) >= 0,
      color: "var(--ps-green)",
      icon: "⏳",
    },
    {
      label: "Required Return",
      value: typeof reqReturn === "string" ? reqReturn : `${reqReturn || 0}%`,
      sub: "To meet retirement goals",
      surplus: null,
      surplusLabel: null,
      ok: typeof reqReturn === "string" ? !reqReturn.startsWith("-") : (reqReturn || 0) >= 0,
      color: "#D97706",
      icon: "📊",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Row 1: Retirement date KPI tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "16px 18px", borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{k.icon} {k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Health check verdict tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {healthTiles.map((k, i) => (
          <div key={i} style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "16px 18px", borderTop: `3px solid ${k.ok ? "var(--ps-green)" : "var(--ps-red)"}` }}>
            <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{k.icon} {k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginTop: 2 }}>{k.sub}</div>
            {k.surplusLabel && (
              <div style={{ marginTop: 8, display: "inline-block", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                background: k.ok ? "rgba(5,150,105,0.08)" : "rgba(239,68,68,0.08)",
                color: k.ok ? "var(--ps-green)" : "var(--ps-red)" }}>
                {k.ok ? "✓" : "⚠"} {k.surplusLabel}
              </div>
            )}
            {!k.surplusLabel && (
              <div style={{ marginTop: 8, display: "inline-block", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                background: k.ok ? "rgba(5,150,105,0.08)" : "rgba(239,68,68,0.08)",
                color: k.ok ? "var(--ps-green)" : "var(--ps-red)" }}>
                {k.ok ? "✓ Achievable" : "⚠ Review needed"}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Row 1: Super Breakdown - full width */}
      {chartCard("Super breakdown",
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={RETIREMENT_BALANCE_DATA} margin={{ top: 5, right: 15, bottom: 5, left: 15 }} barCategoryGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
            <Tooltip formatter={formatTooltip} labelFormatter={(l) => `Year ${l}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} />
            <Legend content={makeLegend(hidden1, toggle1)} />
            <Bar dataKey="cathSuper"   name={`${c1Name} - Super`}    stackId="ret" fill="#6366F1" hide={hidden1.cathSuper}   radius={[0,0,0,0]} />
            <Bar dataKey="paulSuper"   name={`${c2Name} - Super`}    stackId="ret" fill="#0891B2" hide={hidden1.paulSuper}   radius={[0,0,0,0]} />
            <Bar dataKey="cathPension" name={`${c1Name} - Pension`}  stackId="ret" fill="#059669" hide={hidden1.cathPension} radius={[0,0,0,0]} />
            <Bar dataKey="paulPension" name={`${c2Name} - Pension`}  stackId="ret" fill="#D97706" hide={hidden1.paulPension} radius={[0,0,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Row 2: Income in Retirement | Retirement Age | Required Return */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {chartCard("Income in retirement",
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={INCOME_IN_RET_COMPARISON} margin={{ top: 5, right: 10, bottom: 5, left: 10 }} barSize={50}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <Tooltip formatter={formatTooltip} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} />
              <Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]}>
                {INCOME_IN_RET_COMPARISON.map((e, i) => <Cell key={i} fill={["#6366F1", "#0891B2", "#059669"][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartCard("Retirement Age",
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={RETIREMENT_AGE_COMPARISON} margin={{ top: 5, right: 10, bottom: 5, left: 10 }} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} />
              <Legend content={makeLegend(hidden2, toggle2)} />
              <Bar dataKey="catherine"  name={c1Name}  fill="#6366F1" hide={hidden2.catherine}  radius={[4,4,0,0]} />
              <Bar dataKey="paulAndrew" name={c2Name}  fill="#0891B2" hide={hidden2.paulAndrew} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartCard("Required return",
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={REQUIRED_RETURN_COMPARISON} margin={{ top: 5, right: 10, bottom: 5, left: 10 }} barSize={50}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} unit="%" />
              <Tooltip formatter={(val) => val + "%"} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} />
              <Bar dataKey="value" name="Return %" radius={[4, 4, 0, 0]}>
                {REQUIRED_RETURN_COMPARISON.map((e, i) => <Cell key={i} fill={["#6366F1", "#0891B2", "#059669"][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 3: Contributions | Retirement Age vs Return */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {chartCard("Contributions breakdown",
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={CONTRIBUTIONS_DATA} margin={{ top: 5, right: 15, bottom: 5, left: 15 }} barCategoryGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <Tooltip formatter={formatTooltip} labelFormatter={(l) => `Year ${l}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} />
              <Legend content={makeLegend(hidden1, toggle1)} />
              <Bar dataKey="cathConcessional"    name={`${c1Name} - Concessional`}    stackId="c" fill="#6366F1" hide={hidden1.cathConcessional}    radius={[0,0,0,0]} />
              <Bar dataKey="paulConcessional"    name={`${c2Name} - Concessional`}    stackId="c" fill="#0891B2" hide={hidden1.paulConcessional}    radius={[0,0,0,0]} />
              <Bar dataKey="cathNonConcessional" name={`${c1Name} - Non-Concessional`} stackId="c" fill="#059669" hide={hidden1.cathNonConcessional} radius={[0,0,0,0]} />
              <Bar dataKey="paulNonConcessional" name={`${c2Name} - Non-Concessional`} stackId="c" fill="#D97706" hide={hidden1.paulNonConcessional} radius={[0,0,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartCard("Retirement Age v Return",
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={[
              { year: "2025/2026", value: 0 }, { year: "2026/2027", value: 0 }, { year: "2027/2028", value: 0 },
              { year: "2028/2029", value: 0 }, { year: "2029/2030", value: 0 }, { year: "2030/2031", value: 0 },
              { year: "2031/2032", value: 0 }, { year: "2032/2033", value: 0 },
            ]} margin={{ top: 5, right: 15, bottom: 5, left: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} domain={[0, 1]} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// Retirement > Health Check data and component
const HEALTH_CHECK_DATA = {
  sections: [
    {
      title: "Income",
      rows: [
        { label: "Max income", client: null, partner: null, joint: 150477 },
        { label: "Target income", client: null, partner: null, joint: 120000 },
        { label: "Shortfall/surplus", client: null, partner: null, joint: 30477 },
      ],
    },
    {
      title: "Capital",
      rows: [
        { label: "Target capital", client: null, partner: null, joint: 2396892 },
        { label: "Expected capital at retirement", client: null, partner: null, joint: 3005644 },
        { label: "Shortfall/surplus", client: null, partner: null, joint: 608752 },
      ],
    },
    {
      title: "Duration",
      rows: [
        { label: "Years equity lasts", client: 40, partner: 40, joint: null },
        { label: "Life expectancy", client: 27, partner: 26, joint: null },
        { label: "Shortfall/surplus", client: 13, partner: 13, joint: null },
      ],
    },
    {
      title: "Retirement age",
      rows: [
        { label: "Desired retirement age", client: 65, partner: 65, joint: null },
        { label: "Minimum retirement age", client: 60, partner: 60, joint: null },
        { label: "Shortfall/surplus", client: 5, partner: 5, joint: null },
      ],
    },
    {
      title: "Shortfall requirements",
      rows: [
        { label: "Investment (annual)", client: null, partner: null, joint: -80932 },
        { label: "Required return", client: null, partner: null, joint: "-3.76%" },
      ],
    },
  ],
};

export function HealthCheckTable() {
  const [collapsed, setCollapsed] = useState({});
  const toggleSection = (title) => setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));

  const fC = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === "string") return val;
    if (val < 0) return `-$${Math.abs(val).toLocaleString("en-AU")}`;
    return `$${val.toLocaleString("en-AU")}`;
  };
  const fN = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === "string") return val;
    return val.toLocaleString("en-AU");
  };

  const sectionMeta = {
    "Income": { icon: "💰", color: "var(--ps-green)", format: fC, description: "Annual retirement income capacity vs target" },
    "Capital": { icon: "🏦", color: "#4F46E5", format: fC, description: "Projected wealth at retirement vs required capital" },
    "Duration": { icon: "⏳", color: "#D97706", format: fN, description: "How long retirement savings will last" },
    "Retirement age": { icon: "🎯", color: "#0891B2", format: fN, description: "Desired vs minimum achievable retirement age" },
    "Shortfall requirements": { icon: "⚠️", color: "var(--ps-red)", format: fC, description: "Additional investment needed to close any gap" },
  };

  const findShortfall = (title) => {
    const sec = HEALTH_CHECK_DATA.sections.find(s => s.title === title);
    const row = sec?.rows.find(r => r.label.toLowerCase().includes("shortfall"));
    return row ? (row.joint ?? row.client ?? null) : null;
  };
  const incSurplus = findShortfall("Income");
  const capSurplus = findShortfall("Capital");
  const durSurplus = findShortfall("Duration");

  const kpis = [
    incSurplus !== null ? { label: "Income Surplus", value: fC(incSurplus), ok: incSurplus >= 0, sub: "vs target income" } : null,
    capSurplus !== null ? { label: "Capital Surplus", value: fC(capSurplus), ok: capSurplus >= 0, sub: "At retirement" } : null,
    durSurplus !== null ? { label: "Equity Outlasts By", value: `${durSurplus} yrs`, ok: durSurplus >= 0, sub: "Beyond life expectancy" } : null,
  ].filter(Boolean);

  return (
    <div>
      {/* KPI Strip */}
      {kpis.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${kpis.length}, 1fr)`, gap: 12, marginBottom: 20 }}>
          {kpis.map((s, i) => (
            <div key={i} style={{
              padding: "16px 20px", borderRadius: 12, textAlign: "center",
              background: s.ok ? "rgba(5,150,105,0.04)" : "rgba(220,38,38,0.04)",
              border: `1px solid ${s.ok ? "rgba(5,150,105,0.15)" : "rgba(220,38,38,0.15)"}`,
            }}>
              <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.ok ? "var(--ps-green)" : "var(--ps-red)", fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr style={{ background: "var(--ps-surface-alt)" }}>
              <th style={{ padding: "12px 18px", fontSize: 12, fontWeight: 600, color: "var(--ps-text-secondary)", textAlign: "left", borderBottom: "2px solid var(--ps-border)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Retirement Outcome</th>
              <th style={{ padding: "12px 18px", borderBottom: "2px solid var(--ps-border)", width: "18%" }}><div style={{ display: "flex", justifyContent: "flex-end" }}><EntityBadge name="Catherine" size="sm" /></div></th>
              <th style={{ padding: "12px 18px", borderBottom: "2px solid var(--ps-border)", width: "18%" }}><div style={{ display: "flex", justifyContent: "flex-end" }}><EntityBadge name="Paul" size="sm" /></div></th>
              <th style={{ padding: "12px 18px", borderBottom: "2px solid var(--ps-border)", width: "18%" }}><div style={{ display: "flex", justifyContent: "flex-end" }}><EntityBadge name="Joint" size="sm" /></div></th>
            </tr>
          </thead>
          <tbody>
            {HEALTH_CHECK_DATA.sections.map((section) => {
              const isCollapsed = collapsed[section.title];
              const meta = sectionMeta[section.title] || { icon: "📋", color: "var(--ps-text-secondary)", format: fN, description: "" };
              const shortfallRow = section.rows.find(r => r.label.toLowerCase().includes("shortfall"));
              const shortfallVal = shortfallRow ? (shortfallRow.joint ?? shortfallRow.client ?? null) : null;
              const isPositive = typeof shortfallVal === "number" ? shortfallVal >= 0 : null;

              return [
                <tr key={`title-${section.title}`} onClick={() => toggleSection(section.title)} style={{ cursor: "pointer", background: "var(--ps-surface-alt)" }}>
                  <td colSpan={3} style={{ padding: "12px 18px", borderBottom: "1px solid var(--ps-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>{isCollapsed ? "▸" : "▾"}</span>
                      <span style={{ fontSize: 16 }}>{meta.icon}</span>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: "0.02em" }}>{section.title}</span>
                        <span style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginLeft: 12 }}>{meta.description}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 18px", textAlign: "right", borderBottom: "1px solid var(--ps-border)" }}>
                    {isPositive !== null && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                        background: isPositive ? "rgba(5,150,105,0.08)" : "rgba(220,38,38,0.08)",
                        color: isPositive ? "var(--ps-green)" : "var(--ps-red)",
                      }}>
                        {isPositive ? "✓ On Track" : "⚠ Shortfall"}
                      </span>
                    )}
                  </td>
                </tr>,
                ...(!isCollapsed ? section.rows.map((row, i) => {
                  const isShortfall = row.label.toLowerCase().includes("shortfall") || row.label.toLowerCase().includes("required");
                  const fmt = meta.format;
                  const renderCell = (val) => {
                    if (val === null || val === undefined) return <span style={{ color: "var(--ps-border-input)" }}>—</span>;
                    const formatted = fmt(val);
                    if (isShortfall && typeof val === "number") return <span style={{ fontWeight: 700, color: val >= 0 ? "var(--ps-green)" : "var(--ps-red)" }}>{formatted}</span>;
                    return <span style={{ color: "var(--ps-text-body)" }}>{formatted}</span>;
                  };
                  return (
                    <tr key={`${section.title}-${i}`} style={{ background: isShortfall ? "var(--ps-surface-alt)" : "var(--ps-surface)", borderBottom: "1px solid var(--ps-border-light)" }}>
                      <td style={{ padding: "10px 18px 10px 52px", fontSize: 13, color: isShortfall ? "var(--ps-text-primary)" : "var(--ps-text-secondary)", fontWeight: isShortfall ? 600 : 400 }}>{row.label}</td>
                      <td style={{ padding: "10px 18px", textAlign: "right", fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>{renderCell(row.client)}</td>
                      <td style={{ padding: "10px 18px", textAlign: "right", fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>{renderCell(row.partner)}</td>
                      <td style={{ padding: "10px 18px", textAlign: "right", fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>{renderCell(row.joint)}</td>
                    </tr>
                  );
                }) : []),
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Retirement > Retirement Balance chart data
const RETIREMENT_BALANCE_DATA = [
  { year: 1, cathSuper: 20000, paulSuper: 15000, cathPension: 0, paulPension: 0 },
  { year: 2, cathSuper: 45000, paulSuper: 35000, cathPension: 0, paulPension: 0 },
  { year: 3, cathSuper: 72000, paulSuper: 58000, cathPension: 0, paulPension: 0 },
  { year: 4, cathSuper: 100000, paulSuper: 82000, cathPension: 0, paulPension: 0 },
  { year: 5, cathSuper: 130000, paulSuper: 95000, cathPension: 0, paulPension: 0 },
  { year: 6, cathSuper: 162000, paulSuper: 128000, cathPension: 0, paulPension: 0 },
  { year: 7, cathSuper: 175000, paulSuper: 165000, cathPension: 0, paulPension: 0 },
  { year: 8, cathSuper: 180000, paulSuper: 170000, cathPension: 0, paulPension: 0 },
  { year: 9, cathSuper: 0, paulSuper: 380000, cathPension: 370000, paulPension: 0 },
  { year: 10, cathSuper: 0, paulSuper: 530000, cathPension: 380000, paulPension: 200000 },
  { year: 11, cathSuper: 0, paulSuper: 0, cathPension: 350000, paulPension: 160000 },
  { year: 12, cathSuper: 0, paulSuper: 0, cathPension: 150000, paulPension: 50000 },
  { year: 13, cathSuper: 0, paulSuper: 0, cathPension: 130000, paulPension: 80000 },
  { year: 14, cathSuper: 0, paulSuper: 0, cathPension: 50000, paulPension: 20000 },
  { year: 15, cathSuper: 0, paulSuper: 0, cathPension: 0, paulPension: 0 },
  { year: 16, cathSuper: 0, paulSuper: 0, cathPension: 0, paulPension: 0 },
  { year: 17, cathSuper: 0, paulSuper: 0, cathPension: 0, paulPension: 0 },
  { year: 18, cathSuper: 0, paulSuper: 0, cathPension: 0, paulPension: 0 },
  { year: 19, cathSuper: 0, paulSuper: 0, cathPension: 0, paulPension: 0 },
  { year: 20, cathSuper: 0, paulSuper: 0, cathPension: 0, paulPension: 0 },
  { year: 21, cathSuper: 0, paulSuper: 0, cathPension: 0, paulPension: 0 },
  { year: 22, cathSuper: 0, paulSuper: 0, cathPension: 0, paulPension: 0 },
  { year: 23, cathSuper: 0, paulSuper: 0, cathPension: 0, paulPension: 0 },
  { year: 24, cathSuper: 0, paulSuper: 0, cathPension: 0, paulPension: 0 },
  { year: 25, cathSuper: 0, paulSuper: 0, cathPension: 0, paulPension: 0 },
  { year: 26, cathSuper: 0, paulSuper: 0, cathPension: 0, paulPension: 0 },
  { year: 27, cathSuper: 0, paulSuper: 0, cathPension: 0, paulPension: 0 },
  { year: 28, cathSuper: 0, paulSuper: 0, cathPension: 0, paulPension: 0 },
];

// Retirement > Contributions chart data
const CONTRIBUTIONS_DATA = [
  { year: 1, cathConcessional: 14279, paulConcessional: 14279, cathNonConcessional: 0, paulNonConcessional: 0 },
  { year: 2, cathConcessional: 14707, paulConcessional: 14707, cathNonConcessional: 0, paulNonConcessional: 0 },
  { year: 3, cathConcessional: 15148, paulConcessional: 15148, cathNonConcessional: 0, paulNonConcessional: 0 },
  { year: 4, cathConcessional: 15602, paulConcessional: 15602, cathNonConcessional: 0, paulNonConcessional: 0 },
  { year: 5, cathConcessional: 16070, paulConcessional: 16070, cathNonConcessional: 0, paulNonConcessional: 0 },
  { year: 6, cathConcessional: 16553, paulConcessional: 16553, cathNonConcessional: 0, paulNonConcessional: 0 },
  { year: 7, cathConcessional: 12500, paulConcessional: 17050, cathNonConcessional: 0, paulNonConcessional: 0 },
  { year: 8, cathConcessional: 0, paulConcessional: 17561, cathNonConcessional: 0, paulNonConcessional: 0 },
  { year: 9, cathConcessional: 0, paulConcessional: 18088, cathNonConcessional: 0, paulNonConcessional: 0 },
  { year: 10, cathConcessional: 0, paulConcessional: 0, cathNonConcessional: 0, paulNonConcessional: 0 },
  { year: 11, cathConcessional: 0, paulConcessional: 0, cathNonConcessional: 0, paulNonConcessional: 0 },
  { year: 12, cathConcessional: 0, paulConcessional: 0, cathNonConcessional: 0, paulNonConcessional: 0 },
];

// Retirement > Income in Retirement chart data
const INCOME_IN_RETIREMENT_DATA = [
  { year: 1, salary: 156747, pension: 0, agePension: 0, investment: 0 },
  { year: 2, salary: 161444, pension: 0, agePension: 0, investment: 200 },
  { year: 3, salary: 166287, pension: 0, agePension: 0, investment: 450 },
  { year: 4, salary: 171276, pension: 0, agePension: 0, investment: 700 },
  { year: 5, salary: 176414, pension: 0, agePension: 0, investment: 1000 },
  { year: 6, salary: 181707, pension: 0, agePension: 0, investment: 1500 },
  { year: 7, salary: 100000, pension: 45000, agePension: 0, investment: 2000 },
  { year: 8, salary: 103000, pension: 50000, agePension: 0, investment: 2500 },
  { year: 9, salary: 0, pension: 120000, agePension: 0, investment: 3000 },
  { year: 10, salary: 0, pension: 130000, agePension: 0, investment: 3500 },
  { year: 11, salary: 0, pension: 110000, agePension: 0, investment: 4000 },
  { year: 12, salary: 0, pension: 90000, agePension: 0, investment: 4500 },
  { year: 13, salary: 0, pension: 70000, agePension: 10000, investment: 5000 },
  { year: 14, salary: 0, pension: 50000, agePension: 20000, investment: 5500 },
  { year: 15, salary: 0, pension: 30000, agePension: 25000, investment: 6000 },
  { year: 16, salary: 0, pension: 0, agePension: 30000, investment: 6500 },
  { year: 17, salary: 0, pension: 0, agePension: 32000, investment: 7000 },
  { year: 18, salary: 0, pension: 0, agePension: 34000, investment: 7500 },
  { year: 19, salary: 0, pension: 0, agePension: 36000, investment: 8000 },
  { year: 20, salary: 0, pension: 0, agePension: 38000, investment: 8500 },
];

export function RetirementBalanceChart() {
  const [hidden, setHidden] = useState({});
  const toggleSeries = (dataKey) => setHidden(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  const formatYAxis = (val) => val === 0 ? "0" : val.toLocaleString("en-AU");
  const formatTooltip = (val) => val.toLocaleString("en-AU");
  const renderLegend = (props) => (
    <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", paddingTop: 8 }}>
      {props.payload.map((entry) => (
        <span key={entry.dataKey} onClick={() => toggleSeries(entry.dataKey)}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: hidden[entry.dataKey] ? 0.35 : 1 }}>
          <span style={{ width: 12, height: 12, background: entry.color, borderRadius: 2, display: "inline-block" }} />
          {entry.value}
        </span>
      ))}
    </div>
  );
  return (
    <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "24px 16px 16px" }}>
      <div style={{ textAlign: "center", fontWeight: 600, fontSize: 14, color: "var(--ps-text-primary)", marginBottom: 16 }}>Super breakdown</div>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={RETIREMENT_BALANCE_DATA} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--ps-text-muted)" }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
          <Tooltip formatter={formatTooltip} labelFormatter={(l) => `Year ${l}`} contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid var(--ps-border)" }} />
          <Legend content={renderLegend} />
          <Bar dataKey="cathSuper" name="Catherine - Default super" stackId="ret" fill="#3b5998" hide={hidden.cathSuper} />
          <Bar dataKey="paulSuper" name="Paul Andrew - Default super" stackId="ret" fill="#93b5e0" hide={hidden.paulSuper} />
          <Bar dataKey="cathPension" name="Catherine - Default pension" stackId="ret" fill="#e8913a" hide={hidden.cathPension} />
          <Bar dataKey="paulPension" name="Paul Andrew - Default pension" stackId="ret" fill="#f5bd6e" radius={[2, 2, 0, 0]} hide={hidden.paulPension} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ContributionsChart() {
  const [hidden, setHidden] = useState({});
  const toggleSeries = (dataKey) => setHidden(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  const formatYAxis = (val) => val === 0 ? "0" : val.toLocaleString("en-AU");
  const formatTooltip = (val) => val.toLocaleString("en-AU");
  const renderLegend = (props) => (
    <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", paddingTop: 8 }}>
      {props.payload.map((entry) => (
        <span key={entry.dataKey} onClick={() => toggleSeries(entry.dataKey)}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: hidden[entry.dataKey] ? 0.35 : 1 }}>
          <span style={{ width: 12, height: 12, background: entry.color, borderRadius: 2, display: "inline-block" }} />
          {entry.value}
        </span>
      ))}
    </div>
  );
  return (
    <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "24px 16px 16px" }}>
      <div style={{ textAlign: "center", fontWeight: 600, fontSize: 14, color: "var(--ps-text-primary)", marginBottom: 16 }}>Contributions breakdown</div>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={CONTRIBUTIONS_DATA} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--ps-text-muted)" }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
          <Tooltip formatter={formatTooltip} labelFormatter={(l) => `Year ${l}`} contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid var(--ps-border)" }} />
          <Legend content={renderLegend} />
          <Bar dataKey="cathConcessional" name="Catherine - Concessional" stackId="contrib" fill="#3b5998" hide={hidden.cathConcessional} />
          <Bar dataKey="paulConcessional" name="Paul Andrew - Concessional" stackId="contrib" fill="#93b5e0" hide={hidden.paulConcessional} />
          <Bar dataKey="cathNonConcessional" name="Catherine - Non-Concessional" stackId="contrib" fill="#e8913a" hide={hidden.cathNonConcessional} />
          <Bar dataKey="paulNonConcessional" name="Paul Andrew - Non-Concessional" stackId="contrib" fill="#f5bd6e" radius={[2, 2, 0, 0]} hide={hidden.paulNonConcessional} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IncomeInRetirementChart() {
  const [hidden, setHidden] = useState({});
  const toggleSeries = (dataKey) => setHidden(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  const formatYAxis = (val) => val === 0 ? "0" : val.toLocaleString("en-AU");
  const formatTooltip = (val) => val.toLocaleString("en-AU");
  const renderLegend = (props) => (
    <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", paddingTop: 8 }}>
      {props.payload.map((entry) => (
        <span key={entry.dataKey} onClick={() => toggleSeries(entry.dataKey)}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: hidden[entry.dataKey] ? 0.35 : 1 }}>
          <span style={{ width: 12, height: 12, background: entry.color, borderRadius: 2, display: "inline-block" }} />
          {entry.value}
        </span>
      ))}
    </div>
  );
  return (
    <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "24px 16px 16px" }}>
      <div style={{ textAlign: "center", fontWeight: 600, fontSize: 14, color: "var(--ps-text-primary)", marginBottom: 16 }}>Income in retirement</div>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={INCOME_IN_RETIREMENT_DATA} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--ps-text-muted)" }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
          <Tooltip formatter={formatTooltip} labelFormatter={(l) => `Year ${l}`} contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid var(--ps-border)" }} />
          <Legend content={renderLegend} />
          <Bar dataKey="salary" name="Salary" stackId="inc" fill="#3b5998" hide={hidden.salary} />
          <Bar dataKey="pension" name="Pension Drawdown" stackId="inc" fill="#e8913a" hide={hidden.pension} />
          <Bar dataKey="agePension" name="Age Pension" stackId="inc" fill="#4a7c3f" hide={hidden.agePension} />
          <Bar dataKey="investment" name="Investment Income" stackId="inc" fill="#93b5e0" radius={[2, 2, 0, 0]} hide={hidden.investment} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Summary of Results > Cashflow > Transactions data
const CASHFLOW_TRANSACTIONS_DATA = {
  years: ["2025/2026","2026/2027","2027/2028","2028/2029","2029/2030","2030/2031","2031/2032","2032/2033","2033/2034","2034/2035","2035/2036","2036/2037"],
  sections: [
    {
      id: "cft-header",
      rows: [
        { label: "Year", values: [1,2,3,4,5,6,7,8,9,10,11,12], style: "header" },
      ],
    },
    {
      id: "cft-divider-1",
      isDivider: true,
    },
    {
      id: "cft-start-value",
      rows: [
        { label: "Start Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "current-value" },
      ],
    },
    {
      id: "cft-soy",
      title: "Start of Year Adjustments",
      rows: [
        { label: "Asset Sales", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Lump Sum Withdrawal", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Investment Bond Withdrawal", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Inheritance Received", values: [150000,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Related Party Contribution", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Non-Concessional Contribution", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Downsizer Contribution", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Investment Bond Contributions", values: [150000,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Asset Purchases", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Related Party Payment", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
      ],
    },
    {
      id: "cft-revised",
      rows: [
        { label: "Revised Start Value", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "highlight" },
      ],
    },
    {
      id: "cft-divider-2",
      isDivider: true,
    },
    {
      id: "cft-income",
      title: "Income",
      rows: [
        { label: "Salary", values: [156747,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Rental Income", values: [7548,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Investment Income", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Age Pension", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Taxable Pension", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Trust Distribution", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Company Dividend", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Total Income", values: [164295,null,null,null,null,null,null,null,null,null,null,null], style: "subtotal" },
      ],
    },
    {
      id: "cft-divider-3",
      isDivider: true,
    },
    {
      id: "cft-expenses",
      title: "Expenses",
      rows: [
        { label: "Living", values: [211121,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Debt Servicing", values: [124866,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Taxes Payable", values: [309319,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Contributions", values: [28558,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Goals", values: [79000,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Insurance", values: [5000,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Total Expenses", values: [757864,null,null,null,null,null,null,null,null,null,null,null], style: "subtotal" },
      ],
    },
    {
      id: "cft-divider-4",
      isDivider: true,
    },
    {
      id: "cft-net",
      rows: [
        { label: "Net Cashflow", values: [-593569,null,null,null,null,null,null,null,null,null,null,null], style: "highlight" },
      ],
    },
    {
      id: "cft-divider-5",
      isDivider: true,
    },
    {
      id: "cft-eoy",
      title: "End of Year Adjustments",
      rows: [
        { label: "Asset Sales", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Asset Purchases", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Debt Repayment", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Debt Drawdown", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
        { label: "Entity Contributions", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child-negative" },
        { label: "Entity Drawdowns", values: [0,null,null,null,null,null,null,null,null,null,null,null], style: "child" },
      ],
    },
    {
      id: "cft-divider-6",
      isDivider: true,
    },
    {
      id: "cft-end",
      rows: [
        { label: "End Value", values: [-593569,null,null,null,null,null,null,null,null,null,null,null], style: "end-value" },
      ],
    },
  ],
};

// Cashflow > Transactions stacked chart data
const CASHFLOW_TRANSACTIONS_CHART_DATA = [
  { year: 1, soyAdjustments: 150000, income: 164295, expenses: -757864, eoyAdjustments: 0 },
  { year: 2, soyAdjustments: 0, income: 169418, expenses: -780000, eoyAdjustments: 0 },
  { year: 3, soyAdjustments: 0, income: 174700, expenses: -803000, eoyAdjustments: 0 },
  { year: 4, soyAdjustments: 0, income: 180200, expenses: -765000, eoyAdjustments: 0 },
  { year: 5, soyAdjustments: 0, income: 185909, expenses: -743000, eoyAdjustments: 0 },
  { year: 6, soyAdjustments: 0, income: 191957, expenses: -701000, eoyAdjustments: 0 },
  { year: 7, soyAdjustments: 0, income: 191013, expenses: -578000, eoyAdjustments: -50000 },
  { year: 8, soyAdjustments: 0, income: 200783, expenses: -546000, eoyAdjustments: -40000 },
  { year: 9, soyAdjustments: 0, income: 210652, expenses: -528000, eoyAdjustments: -30000 },
  { year: 10, soyAdjustments: 500000, income: 131349, expenses: -470000, eoyAdjustments: -20000 },
  { year: 11, soyAdjustments: 0, income: 138144, expenses: -458000, eoyAdjustments: 0 },
  { year: 12, soyAdjustments: 0, income: 144949, expenses: -447000, eoyAdjustments: 0 },
];

export function CashflowDashboard({ txnChartData }) {
  const [hidden1, setHidden1] = useState({});
  const [hidden2, setHidden2] = useState({});
  const [hidden3, setHidden3] = useState({});
  const [hidden4, setHidden4] = useState({});
  const toggleFactory = (setFn) => (dataKey) => setFn(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));

  const formatYAxis = (val) => val === 0 ? "0" : val.toLocaleString("en-AU");
  const formatTooltip = (val) => Math.abs(val).toLocaleString("en-AU");
  const fC = (v) => {
    const abs = Math.abs(v);
    if (abs >= 1000000) return (v < 0 ? "-" : "") + "$" + (abs / 1000000).toFixed(2) + "M";
    if (abs >= 1000)    return (v < 0 ? "-" : "") + "$" + Math.round(abs / 1000) + "k";
    return (v < 0 ? "-$" : "$") + Math.round(abs).toLocaleString("en-AU");
  };

  const makeLegend = (hiddenState, toggleFn) => (props) => (
    <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", paddingTop: 6 }}>
      {props.payload.map((entry) => (
        <span key={entry.dataKey} onClick={() => toggleFn(entry.dataKey)}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 11, opacity: hiddenState[entry.dataKey] ? 0.35 : 1 }}>
          <span style={{ width: 10, height: 10, background: entry.color, borderRadius: 2, display: "inline-block" }} />
          {entry.value}
        </span>
      ))}
    </div>
  );

  const chartCard = (title, children, style = {}) => (
    <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "16px 12px 8px", ...style }}>
      <div style={{ textAlign: "center", fontWeight: 600, fontSize: 13, color: "var(--ps-text-primary)", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );

  // Transactions chart — legend pills
  const txnSeries = [
    { key: "surplus",   label: "Surplus",            color: "var(--ps-green)" },
    { key: "deficit",   label: "Deficit",             color: "var(--ps-red)" },
    { key: "capitalIn", label: "Capital Adjustments", color: "#6366F1" },
  ];
  const [txnHidden, setTxnHidden] = useState({});
  const toggleTxn = (key) => setTxnHidden(h => ({ ...h, [key]: !h[key] }));

  const TxnTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload || {};
    return (
      <div style={{ background: "var(--ps-surface)", border: "1px solid var(--ps-border)", borderRadius: 10, padding: "12px 16px", fontSize: 12, boxShadow: "0 8px 24px var(--ps-shadow-md)", minWidth: 210 }}>
        <div style={{ fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 8, fontSize: 13 }}>{label}</div>
        {!txnHidden.surplus && d.surplus > 0 && <div style={{ display: "flex", justifyContent: "space-between", gap: 24, marginBottom: 4 }}>
          <span style={{ color: "var(--ps-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#059669", display: "inline-block" }} />Surplus</span>
          <span style={{ fontWeight: 600, color: "var(--ps-green)" }}>{fC(d.surplus)}</span>
        </div>}
        {!txnHidden.deficit && d.deficit < 0 && <div style={{ display: "flex", justifyContent: "space-between", gap: 24, marginBottom: 4 }}>
          <span style={{ color: "var(--ps-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#EF4444", display: "inline-block" }} />Deficit</span>
          <span style={{ fontWeight: 600, color: "var(--ps-red)" }}>{fC(d.deficit)}</span>
        </div>}
        {!txnHidden.endBalance && d.capitalIn > 0 && <div style={{ display: "flex", justifyContent: "space-between", gap: 24, marginBottom: 4 }}>
          <span style={{ color: "var(--ps-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#6366F1", display: "inline-block" }} />Capital In</span>
          <span style={{ fontWeight: 600 }}>{fC(d.capitalIn)}</span>
        </div>}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Row 1: Transactions - full width */}
      {chartCard("Cashflow transactions",
        <div>
          {/* Legend pills */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {txnSeries.map(s => (
              <div key={s.key} onClick={() => toggleTxn(s.key)}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, cursor: "pointer", padding: "3px 10px", borderRadius: 6,
                  border: `1px solid ${txnHidden[s.key] ? "var(--ps-border-light)" : "var(--ps-border)"}`,
                  background: txnHidden[s.key] ? "var(--ps-surface-alt)" : "var(--ps-surface)",
                  color: txnHidden[s.key] ? "var(--ps-border-mid)" : "var(--ps-text-muted)",
                  opacity: txnHidden[s.key] ? 0.6 : 1 }}>
                <span style={{ width: s.key === "endBalance" ? 16 : 8, height: s.key === "endBalance" ? 2 : 8, borderRadius: s.key === "endBalance" ? 1 : 2, background: s.color, display: "inline-block" }} />
                <span style={{ textDecoration: txnHidden[s.key] ? "line-through" : "none" }}>{s.label}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={txnChartData || []} margin={{ top: 5, right: 15, bottom: 5, left: 15 }} barCategoryGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: "var(--ps-text-subtle)" }} interval={1} angle={-35} textAnchor="end" height={44} axisLine={{ stroke: "var(--ps-border)" }} tickLine={false} />
              <YAxis tickFormatter={v => v === 0 ? "0" : fC(v)} tick={{ fontSize: 10, fill: "var(--ps-text-subtle)" }} width={72} axisLine={false} tickLine={false} />
              <Tooltip content={<TxnTooltip />} cursor={{ stroke: "var(--ps-border)", strokeWidth: 1 }} />
              <ReferenceLine y={0} stroke="var(--ps-text-subtle)" strokeWidth={1} />

              <Bar dataKey="surplus"   stackId="txn" fill="#059669" fillOpacity={0.75} hide={!!txnHidden.surplus}   radius={[0,0,0,0]} name="Surplus" />
              <Bar dataKey="capitalIn" stackId="txn" fill="#6366F1" fillOpacity={0.75} hide={!!txnHidden.capitalIn} radius={[2,2,0,0]} name="Capital Adjustments" />
              <Bar dataKey="deficit"   stackId="txn" fill="#EF4444" fillOpacity={0.75} hide={!!txnHidden.deficit}   radius={[0,0,2,2]} name="Deficit" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Row 2: Income | Expenses */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {chartCard("Income breakdown",
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={INCOME_CHART_DATA.slice(0, 20)} margin={{ top: 5, right: 15, bottom: 5, left: 15 }} barCategoryGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <Tooltip formatter={(v) => v.toLocaleString("en-AU")} labelFormatter={(l) => `Year ${l}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} />
              <Legend content={makeLegend(hidden2, toggleFactory(setHidden2))} />
              <Bar dataKey="salary" name="Salary" stackId="i" fill="#3b5998" hide={hidden2.salary} radius={[0,0,0,0]} />
              <Bar dataKey="rentalIncome" name="Rental Income" stackId="i" fill="#93b5e0" hide={hidden2.rentalIncome} radius={[0,0,0,0]} />
              <Bar dataKey="investmentIncome" name="Investment Income" stackId="i" fill="#a8c4e0" hide={hidden2.investmentIncome} radius={[0,0,0,0]} />
              <Bar dataKey="agePension" name="Age Pension" stackId="i" fill="#4a7c3f" hide={hidden2.agePension} radius={[0,0,0,0]} />
              <Bar dataKey="taxablePension" name="Taxable Pension" stackId="i" fill="#e8913a" hide={hidden2.taxablePension} radius={[0,0,0,0]} />
              <Bar dataKey="trustDistribution" name="Trust Distribution" stackId="i" fill="#f5bd6e" hide={hidden2.trustDistribution} radius={[0,0,0,0]} />
              <Bar dataKey="companyDividend" name="Company Dividend" stackId="i" fill="#8b6cc1" hide={hidden2.companyDividend} radius={[0,0,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartCard("Expenses breakdown",
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={EXPENSES_CHART_DATA.slice(0, 20)} margin={{ top: 5, right: 15, bottom: 5, left: 15 }} barCategoryGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <Tooltip formatter={(v) => v.toLocaleString("en-AU")} labelFormatter={(l) => `Year ${l}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} />
              <Legend content={makeLegend(hidden3, toggleFactory(setHidden3))} />
              <Bar dataKey="living" name="Living" stackId="e" fill="#3b5998" hide={hidden3.living} radius={[0,0,0,0]} />
              <Bar dataKey="debtServicing" name="Debt Servicing" stackId="e" fill="#93b5e0" hide={hidden3.debtServicing} radius={[0,0,0,0]} />
              <Bar dataKey="taxesPayable" name="Taxes Payable" stackId="e" fill="#e8913a" hide={hidden3.taxesPayable} radius={[0,0,0,0]} />
              <Bar dataKey="contributions" name="Contributions" stackId="e" fill="#f5bd6e" hide={hidden3.contributions} radius={[0,0,0,0]} />
              <Bar dataKey="goals" name="Goals" stackId="e" fill="#4a7c3f" hide={hidden3.goals} radius={[0,0,0,0]} />
              <Bar dataKey="insurance" name="Insurance" stackId="e" fill="#8b6cc1" hide={hidden3.insurance} radius={[0,0,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 3: Retirement Income - full width */}
      {chartCard("Retirement income",
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={INCOME_IN_RETIREMENT_DATA} margin={{ top: 5, right: 15, bottom: 5, left: 15 }} barCategoryGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
            <Tooltip formatter={(v) => v.toLocaleString("en-AU")} labelFormatter={(l) => `Year ${l}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} />
            <Legend content={makeLegend(hidden4, toggleFactory(setHidden4))} />
            <Bar dataKey="salary" name="Salary" stackId="r" fill="#3b5998" hide={hidden4.salary} radius={[0,0,0,0]} />
            <Bar dataKey="pension" name="Pension Drawdown" stackId="r" fill="#e8913a" hide={hidden4.pension} radius={[0,0,0,0]} />
            <Bar dataKey="agePension" name="Age Pension" stackId="r" fill="#4a7c3f" hide={hidden4.agePension} radius={[0,0,0,0]} />
            <Bar dataKey="investment" name="Investment Income" stackId="r" fill="#93b5e0" hide={hidden4.investment} radius={[0,0,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// Cashflow > Income chart data
const INCOME_CHART_DATA = [
  { year: 1, salary: 156747, rentalIncome: 7548, investmentIncome: 0, agePension: 0, taxablePension: 0, trustDistribution: 0, companyDividend: 0 },
  { year: 2, salary: 161444, rentalIncome: 7774, investmentIncome: 200, agePension: 0, taxablePension: 0, trustDistribution: 0, companyDividend: 0 },
  { year: 3, salary: 166287, rentalIncome: 8007, investmentIncome: 450, agePension: 0, taxablePension: 0, trustDistribution: 0, companyDividend: 0 },
  { year: 4, salary: 171276, rentalIncome: 8248, investmentIncome: 700, agePension: 0, taxablePension: 0, trustDistribution: 0, companyDividend: 0 },
  { year: 5, salary: 176414, rentalIncome: 8495, investmentIncome: 1000, agePension: 0, taxablePension: 0, trustDistribution: 0, companyDividend: 0 },
  { year: 6, salary: 181707, rentalIncome: 8750, investmentIncome: 1500, agePension: 0, taxablePension: 0, trustDistribution: 0, companyDividend: 0 },
  { year: 7, salary: 100000, rentalIncome: 9013, investmentIncome: 2000, agePension: 0, taxablePension: 45000, trustDistribution: 35274, companyDividend: 0 },
  { year: 8, salary: 103000, rentalIncome: 9283, investmentIncome: 2500, agePension: 0, taxablePension: 50000, trustDistribution: 36000, companyDividend: 0 },
  { year: 9, salary: 106090, rentalIncome: 9562, investmentIncome: 3000, agePension: 0, taxablePension: 55000, trustDistribution: 37000, companyDividend: 0 },
  { year: 10, salary: 0, rentalIncome: 9849, investmentIncome: 3500, agePension: 0, taxablePension: 80000, trustDistribution: 38000, companyDividend: 0 },
  { year: 11, salary: 0, rentalIncome: 10144, investmentIncome: 4000, agePension: 0, taxablePension: 85000, trustDistribution: 39000, companyDividend: 0 },
  { year: 12, salary: 0, rentalIncome: 10449, investmentIncome: 4500, agePension: 0, taxablePension: 90000, trustDistribution: 40000, companyDividend: 0 },
];

export function IncomeChart() {
  const [hidden, setHidden] = useState({});
  const toggleSeries = (dataKey) => setHidden(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  const formatYAxis = (val) => {
    if (val === 0) return "0";
    return val.toLocaleString("en-AU");
  };
  const formatTooltip = (val) => val.toLocaleString("en-AU");
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", paddingTop: 8 }}>
        {payload.map((entry) => (
          <span key={entry.dataKey} onClick={() => toggleSeries(entry.dataKey)}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: hidden[entry.dataKey] ? 0.35 : 1 }}>
            <span style={{ width: 12, height: 12, background: entry.color, borderRadius: 2, display: "inline-block" }} />
            {entry.value}
          </span>
        ))}
      </div>
    );
  };
  return (
    <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "24px 16px 16px" }}>
      <div style={{ textAlign: "center", fontWeight: 600, fontSize: 14, color: "var(--ps-text-primary)", marginBottom: 16 }}>
        Income projection
      </div>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={INCOME_CHART_DATA} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--ps-text-muted)" }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
          <Tooltip formatter={formatTooltip} labelFormatter={(label) => `Year ${label}`} contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid var(--ps-border)" }} />
          <Legend content={renderLegend} />
          <Bar dataKey="salary" name="Salary" stackId="income" fill="#3b5998" hide={hidden.salary} />
          <Bar dataKey="rentalIncome" name="Rental Income" stackId="income" fill="#93b5e0" hide={hidden.rentalIncome} />
          <Bar dataKey="investmentIncome" name="Investment Income" stackId="income" fill="#a8c4e0" hide={hidden.investmentIncome} />
          <Bar dataKey="agePension" name="Age Pension" stackId="income" fill="#4a7c3f" hide={hidden.agePension} />
          <Bar dataKey="taxablePension" name="Taxable Pension" stackId="income" fill="#e8913a" hide={hidden.taxablePension} />
          <Bar dataKey="trustDistribution" name="Trust Distribution" stackId="income" fill="#f5bd6e" hide={hidden.trustDistribution} />
          <Bar dataKey="companyDividend" name="Company Dividend" stackId="income" fill="#8b6cc1" radius={[2, 2, 0, 0]} hide={hidden.companyDividend} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Cashflow > Expenses chart data
const EXPENSES_CHART_DATA = [
  { year: 1, living: 211121, debtServicing: 124866, taxesPayable: 309319, contributions: 28558, goals: 79000, insurance: 5000 },
  { year: 2, living: 217455, debtServicing: 124866, taxesPayable: 318500, contributions: 29415, goals: 81000, insurance: 5150 },
  { year: 3, living: 223979, debtServicing: 124866, taxesPayable: 328000, contributions: 30297, goals: 83000, insurance: 5305 },
  { year: 4, living: 230698, debtServicing: 100000, taxesPayable: 338000, contributions: 31206, goals: 60000, insurance: 5464 },
  { year: 5, living: 237619, debtServicing: 80000, taxesPayable: 348000, contributions: 32142, goals: 40000, insurance: 5628 },
  { year: 6, living: 244748, debtServicing: 40000, taxesPayable: 358000, contributions: 33106, goals: 20000, insurance: 5797 },
  { year: 7, living: 252090, debtServicing: 0, taxesPayable: 280000, contributions: 25000, goals: 15000, insurance: 5970 },
  { year: 8, living: 259653, debtServicing: 0, taxesPayable: 250000, contributions: 20000, goals: 10000, insurance: 6150 },
  { year: 9, living: 267443, debtServicing: 0, taxesPayable: 230000, contributions: 15000, goals: 10000, insurance: 6334 },
  { year: 10, living: 275466, debtServicing: 0, taxesPayable: 180000, contributions: 0, goals: 8000, insurance: 6524 },
  { year: 11, living: 283730, debtServicing: 0, taxesPayable: 160000, contributions: 0, goals: 8000, insurance: 6720 },
  { year: 12, living: 292242, debtServicing: 0, taxesPayable: 140000, contributions: 0, goals: 8000, insurance: 6921 },
];

export function ExpensesChart() {
  const [hidden, setHidden] = useState({});
  const toggleSeries = (dataKey) => setHidden(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  const formatYAxis = (val) => {
    if (val === 0) return "0";
    return val.toLocaleString("en-AU");
  };
  const formatTooltip = (val) => val.toLocaleString("en-AU");
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", paddingTop: 8 }}>
        {payload.map((entry) => (
          <span key={entry.dataKey} onClick={() => toggleSeries(entry.dataKey)}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: hidden[entry.dataKey] ? 0.35 : 1 }}>
            <span style={{ width: 12, height: 12, background: entry.color, borderRadius: 2, display: "inline-block" }} />
            {entry.value}
          </span>
        ))}
      </div>
    );
  };
  return (
    <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "24px 16px 16px" }}>
      <div style={{ textAlign: "center", fontWeight: 600, fontSize: 14, color: "var(--ps-text-primary)", marginBottom: 16 }}>
        Expenses projection
      </div>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={EXPENSES_CHART_DATA} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--ps-text-muted)" }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
          <Tooltip formatter={formatTooltip} labelFormatter={(label) => `Year ${label}`} contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid var(--ps-border)" }} />
          <Legend content={renderLegend} />
          <Bar dataKey="living" name="Living" stackId="expenses" fill="#3b5998" hide={hidden.living} />
          <Bar dataKey="debtServicing" name="Debt Servicing" stackId="expenses" fill="#93b5e0" hide={hidden.debtServicing} />
          <Bar dataKey="taxesPayable" name="Taxes Payable" stackId="expenses" fill="#e8913a" hide={hidden.taxesPayable} />
          <Bar dataKey="contributions" name="Contributions" stackId="expenses" fill="#f5bd6e" hide={hidden.contributions} />
          <Bar dataKey="goals" name="Goals" stackId="expenses" fill="#4a7c3f" hide={hidden.goals} />
          <Bar dataKey="insurance" name="Insurance" stackId="expenses" fill="#8b6cc1" radius={[2, 2, 0, 0]} hide={hidden.insurance} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CapitalDashboard({ dynamicChartData }) {
  const [showDashboard, setShowDashboard] = useState(true);
  const [h1, setH1] = useState({});
  const [h2, setH2] = useState({});
  const [h3, setH3] = useState({});
  const [h4, setH4] = useState({});
  const [h5, setH5] = useState({});
  const toggleFactory = (setFn) => (dataKey) => setFn(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));

  const formatYAxis = (val) => val === 0 ? "0" : val.toLocaleString("en-AU");
  const formatTooltip = (val) => Math.abs(val).toLocaleString("en-AU");

  const assetTypeData = dynamicChartData || ASSET_TYPE_CHART_DATA;

  const makeLegend = (hiddenState, toggleFn) => (props) => (
    <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", paddingTop: 6 }}>
      {props.payload.map((entry) => (
        <span key={entry.dataKey} onClick={() => toggleFn(entry.dataKey)}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 11, opacity: hiddenState[entry.dataKey] ? 0.35 : 1 }}>
          <span style={{ width: 10, height: 10, background: entry.color, borderRadius: 2, display: "inline-block" }} />
          {entry.value}
        </span>
      ))}
    </div>
  );

  const chartCard = (title, children) => (
    <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "16px 12px 8px" }}>
      <div style={{ textAlign: "center", fontWeight: 600, fontSize: 13, color: "var(--ps-text-primary)", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Hide toggle — top right */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => setShowDashboard(v => !v)}
          style={{
            padding: "5px 14px", borderRadius: 6,
            border: "1px solid var(--ps-border)",
            background: showDashboard ? "var(--ps-surface-alt)" : "var(--ps-surface-indigo)",
            color: showDashboard ? "var(--ps-text-muted)" : "#4F46E5",
            fontSize: 11, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          {showDashboard ? "▼ Hide" : "▶ Show"} Dashboard & Charts
        </button>
      </div>

      {showDashboard && (<>
      {/* Row 1: Assets & Liabilities - full width */}
      {chartCard("Net equity projection",
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={ASSETS_LIABILITIES_CHART_DATA} margin={{ top: 5, right: 15, bottom: 5, left: 15 }} barCategoryGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
            <YAxis tickFormatter={(v) => v === 0 ? "0" : (v / 1000000).toFixed(0) + ",000,000"} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
            <Tooltip formatter={formatTooltip} labelFormatter={(l) => `Year ${l}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} />
            <Legend content={makeLegend(h1, toggleFactory(setH1))} />
            <Bar dataKey="assets" name="Assets" fill="#3b5998" fillOpacity={0.75} stackId="ne" radius={[0,0,0,0]} hide={h1.assets} />
            <Area dataKey="liabilities" name="Liabilities" fill="#ef4444" fillOpacity={0.35} stroke="#ef4444" strokeWidth={1.5} type="monotone" hide={h1.liabilities} />
            {!h1.netEquity && (() => {
              const CustomNELine2 = (props) => {
                const { xAxisMap, yAxisMap } = props;
                if (!xAxisMap || !yAxisMap) return null;
                const xAxis = Object.values(xAxisMap)[0];
                const yAxis = Object.values(yAxisMap)[0];
                if (!xAxis || !yAxis || !xAxis.bandSize) return null;
                const bandWidth = xAxis.bandSize;
                return (
                  <g>
                    {ASSETS_LIABILITIES_CHART_DATA.map((d, i) => {
                      if (d.netEquity == null) return null;
                      const x = xAxis.x + i * bandWidth;
                      const y = yAxis.scale(d.netEquity);
                      return <line key={i} x1={x} y1={y} x2={x + bandWidth} y2={y} stroke="#000" strokeWidth={2.5} />;
                    })}
                  </g>
                );
              };
              return <Customized component={CustomNELine2} />;
            })()}
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Row 2: Asset Type | Assets per Entity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {chartCard("Asset type breakdown",
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={assetTypeData.slice(0, 20)} margin={{ top: 5, right: 15, bottom: 5, left: 15 }} barCategoryGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <Tooltip formatter={(v) => v.toLocaleString("en-AU")} labelFormatter={(l) => `Year ${l}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} />
              <Legend content={makeLegend(h2, toggleFactory(setH2))} />
              <Bar dataKey="investmentProperties" name="Investment Properties" stackId="a" fill="#3b5998" hide={h2.investmentProperties} radius={[0,0,0,0]} />
              <Bar dataKey="super" name="Super / SMSF" stackId="a" fill="#93b5e0" hide={h2.super} radius={[0,0,0,0]} />
              <Bar dataKey="pension" name="Pension" stackId="a" fill="#e8913a" hide={h2.pension} radius={[0,0,0,0]} />
              <Bar dataKey="investmentBond" name="Investment Bond" stackId="a" fill="#7C3AED" hide={h2.investmentBond} radius={[0,0,0,0]} />
              <Bar dataKey="investmentAssets" name="Investment Assets" stackId="a" fill="#f5bd6e" hide={h2.investmentAssets} radius={[0,0,0,0]} />
              <Bar dataKey="defensive" name="Defensive Assets" stackId="a" fill="#a8c4e0" hide={h2.defensive} radius={[0,0,0,0]} />
              <Bar dataKey="entities" name="Trusts / Companies" stackId="a" fill="#059669" hide={h2.entities} radius={[0,0,0,0]} />
              <Bar dataKey="lifestyleAssets" name="Lifestyle Assets" stackId="a" fill="#4a7c3f" hide={h2.lifestyleAssets} radius={[0,0,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartCard("Assets per entity",
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ASSETS_PER_ENTITY_CHART_DATA.slice(0, 20)} margin={{ top: 5, right: 15, bottom: 5, left: 15 }} barCategoryGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <Tooltip formatter={(v) => v.toLocaleString("en-AU")} labelFormatter={(l) => `Year ${l}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} />
              <Legend content={makeLegend(h3, toggleFactory(setH3))} />
              <Bar dataKey="catherine" name="Catherine" stackId="e" fill="#3b5998" hide={h3.catherine} radius={[0,0,0,0]} />
              <Bar dataKey="paulAndrew" name="Paul Andrew" stackId="e" fill="#93b5e0" hide={h3.paulAndrew} radius={[0,0,0,0]} />
              <Bar dataKey="joint" name="Joint" stackId="e" fill="#e8913a" hide={h3.joint} radius={[0,0,0,0]} />
              <Bar dataKey="trust" name="Trusts" stackId="e" fill="#f5bd6e" hide={h3.trust} radius={[0,0,0,0]} />
              <Bar dataKey="company" name="Companies" stackId="e" fill="#a8c4e0" hide={h3.company} radius={[0,0,0,0]} />
              <Bar dataKey="smsf" name="SMSF" stackId="e" fill="#4a7c3f" hide={h3.smsf} radius={[0,0,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 3: Property | Debt */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {chartCard("Property projection",
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={PROPERTY_CHART_DATA.slice(0, 20)} margin={{ top: 5, right: 15, bottom: 5, left: 15 }} barCategoryGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <Tooltip formatter={formatTooltip} labelFormatter={(l) => `Year ${l}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} />
              <Legend content={makeLegend(h4, toggleFactory(setH4))} />
              <Bar dataKey="rentalProperty" name="Rental Property" stackId="p" fill="#3b5998" hide={h4.rentalProperty} radius={[0,0,0,0]} />
              <Bar dataKey="principalResidence" name="Principal Residence" stackId="p" fill="#93b5e0" hide={h4.principalResidence} radius={[0,0,0,0]} />
              <Bar dataKey="rputBusiness" name="RPUT Business" stackId="p" fill="#e8913a" hide={h4.rputBusiness} radius={[0,0,0,0]} />
              <Bar dataKey="rputSmsf" name="RPUT SMSF share" stackId="p" fill="#f5bd6e" hide={h4.rputSmsf} radius={[0,0,0,0]} />
              <Bar dataKey="rputBusinessPremises" name="RPUT Premises" stackId="p" fill="#4a7c3f" hide={h4.rputBusinessPremises} radius={[0,0,0,0]} />
              <Area dataKey="debt" name="Debt" fill="#a8d5a0" fillOpacity={0.6} stroke="#4a7c3f" strokeWidth={2} type="monotone" hide={h4.debt} />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {chartCard("Debt projection",
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={DEBT_CHART_DATA.slice(0, 20)} margin={{ top: 5, right: 15, bottom: 5, left: 15 }} barCategoryGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
              <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: "var(--ps-text-muted)" }} />
              <Tooltip formatter={(v) => v.toLocaleString("en-AU")} labelFormatter={(l) => `Year ${l}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", color: "var(--ps-text-primary)" }} />
              <Legend content={makeLegend(h5, toggleFactory(setH5))} />
              <Area dataKey="homeLoan" name="Home Loan" fill="#3b5998" fillOpacity={0.5} stroke="#3b5998" strokeWidth={2} type="monotone" stackId="d" hide={h5.homeLoan} />
              <Area dataKey="investmentLoan" name="Investment Loan" fill="#e8913a" fillOpacity={0.5} stroke="#e8913a" strokeWidth={2} type="monotone" stackId="d" hide={h5.investmentLoan} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
      </>)}
    </div>
  );
}

// Capital > Debt chart data
const DEBT_CHART_DATA = [
  { year: 1, homeLoan: 0, investmentLoan: 436309 },
  { year: 2, homeLoan: 0, investmentLoan: 396235 },
  { year: 3, homeLoan: 0, investmentLoan: 267013 },
  { year: 4, homeLoan: 0, investmentLoan: 163013 },
  { year: 5, homeLoan: 0, investmentLoan: 62089 },
  { year: 6, homeLoan: 0, investmentLoan: 60957 },
  { year: 7, homeLoan: 0, investmentLoan: 0 },
  { year: 8, homeLoan: 0, investmentLoan: 0 },
  { year: 9, homeLoan: 0, investmentLoan: 0 },
  { year: 10, homeLoan: 0, investmentLoan: 0 },
  { year: 11, homeLoan: 0, investmentLoan: 0 },
  { year: 12, homeLoan: 0, investmentLoan: 0 },
];

export function DebtChart() {
  const [hidden, setHidden] = useState({});
  const toggleSeries = (dataKey) => setHidden(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  const formatYAxis = (val) => {
    if (val === 0) return "0";
    return val.toLocaleString("en-AU");
  };
  const formatTooltip = (val) => val.toLocaleString("en-AU");
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", paddingTop: 8 }}>
        {payload.map((entry) => (
          <span key={entry.dataKey} onClick={() => toggleSeries(entry.dataKey)}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: hidden[entry.dataKey] ? 0.35 : 1 }}>
            <span style={{ width: 12, height: 12, background: entry.color, borderRadius: 2, display: "inline-block" }} />
            {entry.value}
          </span>
        ))}
      </div>
    );
  };
  return (
    <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "24px 16px 16px" }}>
      <div style={{ textAlign: "center", fontWeight: 600, fontSize: 14, color: "var(--ps-text-primary)", marginBottom: 16 }}>
        Debt projection
      </div>
      <ResponsiveContainer width="100%" height={450}>
        <ComposedChart data={DEBT_CHART_DATA.slice(0, 20)} margin={{ top: 10, right: 20, bottom: 10, left: 20 }} barCategoryGap={0}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--ps-text-muted)" }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
          <Tooltip
            formatter={formatTooltip}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid var(--ps-border)" }}
          />
          <Legend content={renderLegend} />
          <Area dataKey="homeLoan" name="Home Loan" fill="#3b5998" fillOpacity={0.5} stroke="#3b5998" strokeWidth={2} type="monotone" stackId="debt" hide={hidden.homeLoan} />
          <Area dataKey="investmentLoan" name="Investment Loan - 63 Rosebery Avenue" fill="#e8913a" fillOpacity={0.5} stroke="#e8913a" strokeWidth={2} type="monotone" stackId="debt" hide={hidden.investmentLoan} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Capital > Property chart data
const PROPERTY_CHART_DATA = [
  { year: 1, rentalProperty: 3850000, principalResidence: 715000, rputBusiness: 300000, rputSmsf: 150000, rputBusinessPremises: 0, debt: -250000, netProperty: 4765000 },
  { year: 2, rentalProperty: 4042500, principalResidence: 750750, rputBusiness: 315000, rputSmsf: 157500, rputBusinessPremises: 0, debt: -200000, netProperty: 5065750 },
  { year: 3, rentalProperty: 4244625, principalResidence: 788288, rputBusiness: 330750, rputSmsf: 165375, rputBusinessPremises: 0, debt: -160000, netProperty: 5369038 },
  { year: 4, rentalProperty: 4456856, principalResidence: 827702, rputBusiness: 347288, rputSmsf: 173644, rputBusinessPremises: 0, debt: -120000, netProperty: 5685490 },
  { year: 5, rentalProperty: 4400000, principalResidence: 869087, rputBusiness: 364652, rputSmsf: 182326, rputBusinessPremises: 0, debt: -80000, netProperty: 5736065 },
  { year: 6, rentalProperty: 4400000, principalResidence: 912541, rputBusiness: 382884, rputSmsf: 191442, rputBusinessPremises: 0, debt: -40000, netProperty: 5846867 },
  { year: 7, rentalProperty: 4620000, principalResidence: 958168, rputBusiness: 402029, rputSmsf: 201014, rputBusinessPremises: 0, debt: 0, netProperty: 6181211 },
  { year: 8, rentalProperty: 4851000, principalResidence: 1006077, rputBusiness: 422130, rputSmsf: 211065, rputBusinessPremises: 0, debt: 0, netProperty: 6490272 },
  { year: 9, rentalProperty: 5093550, principalResidence: 1056381, rputBusiness: 443237, rputSmsf: 221618, rputBusinessPremises: 0, debt: 0, netProperty: 6814786 },
  { year: 10, rentalProperty: 5093550, principalResidence: 1109200, rputBusiness: 465398, rputSmsf: 232699, rputBusinessPremises: 0, debt: 0, netProperty: 6900847 },
  { year: 11, rentalProperty: 5093550, principalResidence: 1164660, rputBusiness: 488668, rputSmsf: 244334, rputBusinessPremises: 350000, debt: 0, netProperty: 7341212 },
  { year: 12, rentalProperty: 5093550, principalResidence: 1222893, rputBusiness: 513102, rputSmsf: 256551, rputBusinessPremises: 500000, debt: 0, netProperty: 7586096 },
  { year: 13, rentalProperty: 5093550, principalResidence: 1284038, rputBusiness: 538757, rputSmsf: 269378, rputBusinessPremises: 700000, debt: 0, netProperty: 7885723 },
  { year: 14, rentalProperty: 5093550, principalResidence: 1348240, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 6441790 },
  { year: 15, rentalProperty: 0, principalResidence: 1415652, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 1415652 },
  { year: 16, rentalProperty: 0, principalResidence: 1486434, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 1486434 },
  { year: 17, rentalProperty: 0, principalResidence: 1560756, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 1560756 },
  { year: 18, rentalProperty: 0, principalResidence: 1638794, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 1638794 },
  { year: 19, rentalProperty: 0, principalResidence: 1720734, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 1720734 },
  { year: 20, rentalProperty: 0, principalResidence: 1806770, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 1806770 },
  { year: 21, rentalProperty: 0, principalResidence: 1897109, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 1897109 },
  { year: 22, rentalProperty: 0, principalResidence: 1991964, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 1991964 },
  { year: 23, rentalProperty: 0, principalResidence: 2091562, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 2091562 },
  { year: 24, rentalProperty: 0, principalResidence: 2196141, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 2196141 },
  { year: 25, rentalProperty: 0, principalResidence: 2305948, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 2305948 },
  { year: 26, rentalProperty: 0, principalResidence: 2421245, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 2421245 },
  { year: 27, rentalProperty: 0, principalResidence: 2542307, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 2542307 },
  { year: 28, rentalProperty: 0, principalResidence: 2669423, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 2669423 },
  { year: 29, rentalProperty: 0, principalResidence: 2802894, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 2802894 },
  { year: 30, rentalProperty: 0, principalResidence: 2943038, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 2943038 },
  { year: 31, rentalProperty: 0, principalResidence: 3090190, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 3090190 },
  { year: 32, rentalProperty: 0, principalResidence: 3244700, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 3244700 },
  { year: 33, rentalProperty: 0, principalResidence: 3406935, rputBusiness: 0, rputSmsf: 0, rputBusinessPremises: 0, debt: 0, netProperty: 3406935 },
];

export function PropertyChart() {
  const [hidden, setHidden] = useState({});
  const toggleSeries = (dataKey) => setHidden(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  const formatYAxis = (val) => {
    if (val === 0) return "0";
    return val.toLocaleString("en-AU");
  };
  const formatTooltip = (val) => Math.abs(val).toLocaleString("en-AU");
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", paddingTop: 8 }}>
        {payload.map((entry) => (
          <span key={entry.dataKey} onClick={() => toggleSeries(entry.dataKey)}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: hidden[entry.dataKey] ? 0.35 : 1 }}>
            <span style={{ width: 12, height: 12, background: entry.color, borderRadius: 2, display: "inline-block" }} />
            {entry.value}
          </span>
        ))}
      </div>
    );
  };
  return (
    <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "24px 16px 16px" }}>
      <div style={{ textAlign: "center", fontWeight: 600, fontSize: 14, color: "var(--ps-text-primary)", marginBottom: 16 }}>
        Property projection
      </div>
      <ResponsiveContainer width="100%" height={450}>
        <ComposedChart data={PROPERTY_CHART_DATA.slice(0, 20)} margin={{ top: 10, right: 20, bottom: 10, left: 20 }} barCategoryGap={0}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--ps-text-muted)" }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
          <Tooltip
            formatter={formatTooltip}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid var(--ps-border)" }}
          />
          <Legend content={renderLegend} />
          <Bar dataKey="rentalProperty" name="Rental Property - 63 Rosebery Avenue NSW" stackId="prop" fill="#3b5998" hide={hidden.rentalProperty} radius={[0,0,0,0]} />
          <Bar dataKey="principalResidence" name="Principal Residence" stackId="prop" fill="#93b5e0" hide={hidden.principalResidence} radius={[0,0,0,0]} />
          <Bar dataKey="rputBusiness" name="RPUT Business Premises" stackId="prop" fill="#e8913a" hide={hidden.rputBusiness} radius={[0,0,0,0]} />
          <Bar dataKey="rputSmsf" name="RPUT Business Premises - SMSF share" stackId="prop" fill="#f5bd6e" hide={hidden.rputSmsf} radius={[0,0,0,0]} />
          <Bar dataKey="rputBusinessPremises" name="RPUT Business Premises" stackId="prop" fill="#4a7c3f" hide={hidden.rputBusinessPremises} radius={[0,0,0,0]} />
          <Area dataKey="debt" name="Debt" fill="#a8d5a0" fillOpacity={0.6} stroke="#4a7c3f" strokeWidth={2} type="monotone" hide={hidden.debt} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Capital > Assets per Entity chart data
const ASSETS_PER_ENTITY_CHART_DATA = [
  { year: 1, catherine: 580000, paulAndrew: 120000, joint: 350000, trust: 0, company: 0, smsf: 539000 },
  { year: 2, catherine: 620000, paulAndrew: 150000, joint: 380000, trust: 0, company: 0, smsf: 604384 },
  { year: 3, catherine: 670000, paulAndrew: 185000, joint: 400000, trust: 0, company: 0, smsf: 680000 },
  { year: 4, catherine: 720000, paulAndrew: 225000, joint: 420000, trust: 0, company: 0, smsf: 760000 },
  { year: 5, catherine: 780000, paulAndrew: 270000, joint: 440000, trust: 0, company: 0, smsf: 850000 },
  { year: 6, catherine: 840000, paulAndrew: 320000, joint: 460000, trust: 0, company: 0, smsf: 950000 },
  { year: 7, catherine: 900000, paulAndrew: 380000, joint: 480000, trust: 0, company: 0, smsf: 1060000 },
  { year: 8, catherine: 960000, paulAndrew: 440000, joint: 500000, trust: 0, company: 0, smsf: 1200000 },
  { year: 9, catherine: 1050000, paulAndrew: 520000, joint: 520000, trust: 0, company: 0, smsf: 1400000 },
  { year: 10, catherine: 1100000, paulAndrew: 580000, joint: 540000, trust: 0, company: 0, smsf: 1500000 },
  { year: 11, catherine: 1050000, paulAndrew: 550000, joint: 520000, trust: 0, company: 0, smsf: 1450000 },
  { year: 12, catherine: 1000000, paulAndrew: 520000, joint: 500000, trust: 0, company: 0, smsf: 1380000 },
  { year: 13, catherine: 950000, paulAndrew: 490000, joint: 480000, trust: 0, company: 0, smsf: 1300000 },
  { year: 14, catherine: 900000, paulAndrew: 460000, joint: 460000, trust: 0, company: 0, smsf: 1200000 },
  { year: 15, catherine: 850000, paulAndrew: 430000, joint: 200000, trust: 0, company: 0, smsf: 1100000 },
  { year: 16, catherine: 800000, paulAndrew: 400000, joint: 180000, trust: 0, company: 0, smsf: 950000 },
  { year: 17, catherine: 700000, paulAndrew: 350000, joint: 160000, trust: 0, company: 0, smsf: 800000 },
  { year: 18, catherine: 600000, paulAndrew: 300000, joint: 140000, trust: 0, company: 0, smsf: 650000 },
  { year: 19, catherine: 500000, paulAndrew: 250000, joint: 0, trust: 0, company: 0, smsf: 500000 },
  { year: 20, catherine: 400000, paulAndrew: 200000, joint: 0, trust: 0, company: 0, smsf: 400000 },
  { year: 21, catherine: 350000, paulAndrew: 150000, joint: 0, trust: 0, company: 0, smsf: 300000 },
  { year: 22, catherine: 300000, paulAndrew: 100000, joint: 0, trust: 0, company: 0, smsf: 200000 },
  { year: 23, catherine: 250000, paulAndrew: 50000, joint: 0, trust: 0, company: 0, smsf: 100000 },
  { year: 24, catherine: 200000, paulAndrew: 20000, joint: 0, trust: 0, company: 0, smsf: 50000 },
  { year: 25, catherine: 150000, paulAndrew: 10000, joint: 0, trust: 0, company: 0, smsf: 20000 },
  { year: 26, catherine: 100000, paulAndrew: 0, joint: 0, trust: 0, company: 0, smsf: 0 },
  { year: 27, catherine: 50000, paulAndrew: 0, joint: 0, trust: 0, company: 0, smsf: 0 },
  { year: 28, catherine: 0, paulAndrew: 0, joint: 0, trust: 0, company: 0, smsf: 0 },
  { year: 29, catherine: 0, paulAndrew: 0, joint: 0, trust: 0, company: 0, smsf: 0 },
];

export function AssetsPerEntityChart() {
  const [hidden, setHidden] = useState({});
  const toggleSeries = (dataKey) => setHidden(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  const formatYAxis = (val) => {
    if (val === 0) return "0";
    return val.toLocaleString("en-AU");
  };
  const formatTooltip = (val) => val.toLocaleString("en-AU");
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", paddingTop: 8 }}>
        {payload.map((entry) => (
          <span key={entry.dataKey} onClick={() => toggleSeries(entry.dataKey)}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: hidden[entry.dataKey] ? 0.35 : 1 }}>
            <span style={{ width: 12, height: 12, background: entry.color, borderRadius: 2, display: "inline-block" }} />
            {entry.value}
          </span>
        ))}
      </div>
    );
  };
  return (
    <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "24px 16px 16px" }}>
      <div style={{ textAlign: "center", fontWeight: 600, fontSize: 14, color: "var(--ps-text-primary)", marginBottom: 16 }}>
        Assets per entity breakdown
      </div>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={ASSETS_PER_ENTITY_CHART_DATA} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--ps-text-muted)" }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
          <Tooltip
            formatter={formatTooltip}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid var(--ps-border)" }}
          />
          <Legend content={renderLegend} />
          <Bar dataKey="catherine" name="Catherine" stackId="entity" fill={entityColor("Catherine")} hide={hidden.catherine} />
          <Bar dataKey="paulAndrew" name="Paul Andrew" stackId="entity" fill={entityColor("Paul Andrew")} hide={hidden.paulAndrew} />
          <Bar dataKey="joint" name="Joint" stackId="entity" fill={entityColor("Joint")} hide={hidden.joint} />
          <Bar dataKey="trust" name="Trusts" stackId="entity" fill={entityColor("RPUT trust")} hide={hidden.trust} />
          <Bar dataKey="company" name="Companies" stackId="entity" fill={entityColor("Company 1")} hide={hidden.company} />
          <Bar dataKey="smsf" name="SMSF" stackId="entity" fill={entityColor("Smith Family SMSF")} radius={[2, 2, 0, 0]} hide={hidden.smsf} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Capital > Asset Type chart data
const ASSET_TYPE_CHART_DATA = [
  { year: 1, investmentProperties: 1050000, super: 100000, pension: 0, investmentAssets: 50000, lifestyleAssets: 45000, defensive: 67324 },
  { year: 2, investmentProperties: 1102500, super: 150000, pension: 0, investmentAssets: 55000, lifestyleAssets: 40000, defensive: 70000 },
  { year: 3, investmentProperties: 1157625, super: 210000, pension: 0, investmentAssets: 62000, lifestyleAssets: 36000, defensive: 75000 },
  { year: 4, investmentProperties: 1215506, super: 280000, pension: 0, investmentAssets: 70000, lifestyleAssets: 32000, defensive: 80000 },
  { year: 5, investmentProperties: 1276281, super: 360000, pension: 0, investmentAssets: 80000, lifestyleAssets: 28000, defensive: 90000 },
  { year: 6, investmentProperties: 1276281, super: 450000, pension: 0, investmentAssets: 95000, lifestyleAssets: 25000, defensive: 100000 },
  { year: 7, investmentProperties: 1276281, super: 550000, pension: 0, investmentAssets: 115000, lifestyleAssets: 22000, defensive: 120000 },
  { year: 8, investmentProperties: 1276281, super: 650000, pension: 200000, investmentAssets: 140000, lifestyleAssets: 20000, defensive: 130000 },
  { year: 9, investmentProperties: 1276281, super: 700000, pension: 500000, investmentAssets: 350000, lifestyleAssets: 18000, defensive: 140000 },
  { year: 10, investmentProperties: 1276281, super: 400000, pension: 800000, investmentAssets: 300000, lifestyleAssets: 16000, defensive: 150000 },
  { year: 11, investmentProperties: 1276281, super: 350000, pension: 850000, investmentAssets: 280000, lifestyleAssets: 14000, defensive: 160000 },
  { year: 12, investmentProperties: 1276281, super: 300000, pension: 800000, investmentAssets: 260000, lifestyleAssets: 12000, defensive: 140000 },
  { year: 13, investmentProperties: 1276281, super: 250000, pension: 750000, investmentAssets: 240000, lifestyleAssets: 10000, defensive: 120000 },
  { year: 14, investmentProperties: 1276281, super: 200000, pension: 700000, investmentAssets: 220000, lifestyleAssets: 8000, defensive: 100000 },
  { year: 15, investmentProperties: 750000, super: 150000, pension: 650000, investmentAssets: 200000, lifestyleAssets: 6000, defensive: 80000 },
  { year: 16, investmentProperties: 750000, super: 100000, pension: 600000, investmentAssets: 180000, lifestyleAssets: 5000, defensive: 60000 },
  { year: 17, investmentProperties: 750000, super: 50000, pension: 500000, investmentAssets: 150000, lifestyleAssets: 4000, defensive: 40000 },
  { year: 18, investmentProperties: 750000, super: 0, pension: 400000, investmentAssets: 120000, lifestyleAssets: 3000, defensive: 30000 },
  { year: 19, investmentProperties: 0, super: 0, pension: 350000, investmentAssets: 100000, lifestyleAssets: 2000, defensive: 20000 },
  { year: 20, investmentProperties: 0, super: 0, pension: 300000, investmentAssets: 80000, lifestyleAssets: 2000, defensive: 15000 },
  { year: 21, investmentProperties: 0, super: 0, pension: 250000, investmentAssets: 60000, lifestyleAssets: 1000, defensive: 10000 },
  { year: 22, investmentProperties: 0, super: 0, pension: 200000, investmentAssets: 40000, lifestyleAssets: 1000, defensive: 5000 },
  { year: 23, investmentProperties: 0, super: 0, pension: 150000, investmentAssets: 20000, lifestyleAssets: 0, defensive: 0 },
  { year: 24, investmentProperties: 0, super: 0, pension: 100000, investmentAssets: 10000, lifestyleAssets: 0, defensive: 0 },
  { year: 25, investmentProperties: 0, super: 0, pension: 60000, investmentAssets: 5000, lifestyleAssets: 0, defensive: 0 },
  { year: 26, investmentProperties: 0, super: 0, pension: 30000, investmentAssets: 0, lifestyleAssets: 0, defensive: 0 },
  { year: 27, investmentProperties: 0, super: 0, pension: 10000, investmentAssets: 0, lifestyleAssets: 0, defensive: 0 },
  { year: 28, investmentProperties: 0, super: 0, pension: 0, investmentAssets: 0, lifestyleAssets: 0, defensive: 0 },
  { year: 29, investmentProperties: 0, super: 0, pension: 0, investmentAssets: 0, lifestyleAssets: 0, defensive: 0 },
];

export function AssetTypeChart() {
  const [hidden, setHidden] = useState({});
  const toggleSeries = (dataKey) => setHidden(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  const formatYAxis = (val) => {
    if (val === 0) return "0";
    return val.toLocaleString("en-AU");
  };
  const formatTooltip = (val) => val.toLocaleString("en-AU");
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", paddingTop: 8 }}>
        {payload.map((entry) => (
          <span key={entry.dataKey} onClick={() => toggleSeries(entry.dataKey)}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: hidden[entry.dataKey] ? 0.35 : 1 }}>
            <span style={{ width: 12, height: 12, background: entry.color, borderRadius: 2, display: "inline-block" }} />
            {entry.value}
          </span>
        ))}
      </div>
    );
  };
  return (
    <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "24px 16px 16px" }}>
      <div style={{ textAlign: "center", fontWeight: 600, fontSize: 14, color: "var(--ps-text-primary)", marginBottom: 16 }}>
        Asset type breakdown
      </div>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={ASSET_TYPE_CHART_DATA} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--ps-text-muted)" }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
          <Tooltip
            formatter={formatTooltip}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid var(--ps-border)" }}
          />
          <Legend content={renderLegend} />
          <Bar dataKey="investmentProperties" name="Investment Properties" stackId="assets" fill="#3b5998" hide={hidden.investmentProperties} />
          <Bar dataKey="super" name="Super" stackId="assets" fill="#93b5e0" hide={hidden.super} />
          <Bar dataKey="pension" name="Pension" stackId="assets" fill="#e8913a" hide={hidden.pension} />
          <Bar dataKey="investmentAssets" name="Investment Assets" stackId="assets" fill="#f5bd6e" hide={hidden.investmentAssets} />
          <Bar dataKey="defensive" name="Defensive Assets" stackId="assets" fill="#a8c4e0" hide={hidden.defensive} />
          <Bar dataKey="lifestyleAssets" name="Lifestyle Assets" stackId="assets" fill="#4a7c3f" radius={[2, 2, 0, 0]} hide={hidden.lifestyleAssets} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Capital > Assets and Liabilities chart data
const ASSETS_LIABILITIES_CHART_DATA = [
  { year: 1, assets: 4961968, liabilities: -436309, netEquity: 4525658 },
  { year: 2, assets: 5224944, liabilities: -396235, netEquity: 4828709 },
  { year: 3, assets: 5502309, liabilities: -267013, netEquity: 5235296 },
  { year: 4, assets: 5802410, liabilities: -163013, netEquity: 5639396 },
  { year: 5, assets: 6124209, liabilities: -62089, netEquity: 6062120 },
  { year: 6, assets: 6449623, liabilities: -60957, netEquity: 6388666 },
  { year: 7, assets: 6816056, liabilities: 0, netEquity: 6816056 },
  { year: 8, assets: 7342890, liabilities: 0, netEquity: 7342890 },
  { year: 9, assets: 7927122, liabilities: 0, netEquity: 7927122 },
  { year: 10, assets: 7994257, liabilities: 0, netEquity: 7994257 },
  { year: 11, assets: 8050000, liabilities: 0, netEquity: 8050000 },
  { year: 12, assets: 8020000, liabilities: 0, netEquity: 8020000 },
  { year: 13, assets: 7980000, liabilities: 0, netEquity: 7980000 },
  { year: 14, assets: 7930000, liabilities: 0, netEquity: 7930000 },
  { year: 15, assets: 7870000, liabilities: 0, netEquity: 7870000 },
  { year: 16, assets: 7800000, liabilities: 0, netEquity: 7800000 },
  { year: 17, assets: 7720000, liabilities: 0, netEquity: 7720000 },
  { year: 18, assets: 7630000, liabilities: 0, netEquity: 7630000 },
  { year: 19, assets: 7530000, liabilities: 0, netEquity: 7530000 },
  { year: 20, assets: 7420000, liabilities: 0, netEquity: 7420000 },
  { year: 21, assets: 7360000, liabilities: 0, netEquity: 7360000 },
  { year: 22, assets: 7300000, liabilities: 0, netEquity: 7300000 },
  { year: 23, assets: 7250000, liabilities: 0, netEquity: 7250000 },
  { year: 24, assets: 7200000, liabilities: 0, netEquity: 7200000 },
  { year: 25, assets: 7150000, liabilities: 0, netEquity: 7150000 },
  { year: 26, assets: 7100000, liabilities: 0, netEquity: 7100000 },
  { year: 27, assets: 7060000, liabilities: 0, netEquity: 7060000 },
  { year: 28, assets: 7020000, liabilities: 0, netEquity: 7020000 },
  { year: 29, assets: 6980000, liabilities: 0, netEquity: 6980000 },
  { year: 30, assets: 6950000, liabilities: 0, netEquity: 6950000 },
  { year: 31, assets: 6920000, liabilities: 0, netEquity: 6920000 },
  { year: 32, assets: 6890000, liabilities: 0, netEquity: 6890000 },
  { year: 33, assets: 6860000, liabilities: 0, netEquity: 6860000 },
];

export function AssetsLiabilitiesChart() {
  const [hidden, setHidden] = useState({});
  const toggleSeries = (dataKey) => setHidden(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  const formatYAxis = (val) => {
    if (val === 0) return "0";
    return (val / 1000000).toFixed(0) + ",000,000";
  };
  const formatTooltip = (val) => {
    return Math.abs(val).toLocaleString("en-AU");
  };
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", paddingTop: 8 }}>
        {payload.map((entry) => (
          <span key={entry.dataKey} onClick={() => toggleSeries(entry.dataKey)}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: hidden[entry.dataKey] ? 0.35 : 1 }}>
            <span style={{ width: 12, height: 12, background: entry.color, borderRadius: 2, display: "inline-block" }} />
            {entry.value}
          </span>
        ))}
      </div>
    );
  };
  return (
    <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "24px 16px 16px" }}>
      <div style={{ textAlign: "center", fontWeight: 600, fontSize: 14, color: "var(--ps-text-primary)", marginBottom: 16 }}>
        Net equity projection
      </div>
      <ResponsiveContainer width="100%" height={450}>
        <ComposedChart data={ASSETS_LIABILITIES_CHART_DATA} margin={{ top: 10, right: 20, bottom: 10, left: 20 }} barCategoryGap={0}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border)" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--ps-text-muted)" }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: "var(--ps-text-muted)" }} />
          <Tooltip
            formatter={formatTooltip}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid var(--ps-border)" }}
          />
          <Legend content={renderLegend} />

          {/* Assets — stacked bars */}
          <Bar dataKey="assets" name="Assets" fill="#3b5998" fillOpacity={0.75} stackId="ne" radius={[0,0,0,0]} hide={hidden.assets} />

          {/* Liabilities — filled area below zero */}
          <Area dataKey="liabilities" name="Liabilities" fill="#ef4444" fillOpacity={0.35} stroke="#ef4444" strokeWidth={1.5} type="monotone" hide={hidden.liabilities} />

          {/* Net Equity — black full-width step line via Customized */}
          {!hidden.netEquity && (() => {
            const CustomNELine = (props) => {
              const { xAxisMap, yAxisMap } = props;
              if (!xAxisMap || !yAxisMap) return null;
              const xAxis = Object.values(xAxisMap)[0];
              const yAxis = Object.values(yAxisMap)[0];
              if (!xAxis || !yAxis || !xAxis.bandSize) return null;
              const bandWidth = xAxis.bandSize;
              return (
                <g>
                  {ASSETS_LIABILITIES_CHART_DATA.map((d, i) => {
                    if (d.netEquity == null) return null;
                    const x = xAxis.x + i * bandWidth;
                    const y = yAxis.scale(d.netEquity);
                    return <line key={i} x1={x} y1={y} x2={x + bandWidth} y2={y} stroke="#000" strokeWidth={2.5} />;
                  })}
                </g>
              );
            };
            return <Customized component={CustomNELine} />;
          })()}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Milestones & Life Events data
const MILESTONES = [
  { milestone: "Primary Residence Debt repaid", entity: "Joint", year: 2026, icon: "🏠", type: "milestone" },
  { milestone: "Achieve $5M net equity", entity: "Joint", year: 2028, icon: "💎", type: "milestone" },
  { milestone: "All debt is paid", entity: "Joint", year: 2032, icon: "✅", type: "milestone" },
  { milestone: "Retire from workforce", entity: "Catherine", year: 2031, icon: "🌴", type: "event" },
  { milestone: "Commence pension", entity: "Catherine", year: 2031, icon: "💰", type: "event" },
  { milestone: "Retire from workforce", entity: "Paul Andrew", year: 2034, icon: "🌴", type: "event" },
  { milestone: "Commence pension", entity: "Paul Andrew", year: 2034, icon: "💰", type: "event" },
  { milestone: "Eligible for age pension", entity: "Catherine", year: 2044, icon: "🏛️", type: "event" },
  { milestone: "Eligible for age pension", entity: "Paul Andrew", year: 2044, icon: "🏛️", type: "event" },
];

const LIFE_GOALS = [
  { goal: "Travel Dreams", owner: "Catherine", amount: 60000, frequency: "Every year", start: 2025, end: 2045, icon: "✈️" },
  { goal: "Health Maintenance", owner: "Catherine", amount: 27000, frequency: "Every year", start: 2025, end: 2057, icon: "🏥" },
  { goal: "Golf Membership", owner: "Paul Andrew", amount: 19000, frequency: "Every year", start: 2025, end: 2040, icon: "⛳" },
  { goal: "Kids - Sarah", owner: "Catherine", amount: 20000, frequency: "Every year", start: 2028, end: 2032, icon: "👧" },
  { goal: "Kids - Matthew", owner: "Catherine", amount: 20000, frequency: "Every year", start: 2026, end: 2030, icon: "👦" },
  { goal: "Cars - Volvo", owner: "Catherine", amount: 60000, frequency: "Every 5 years", start: 2030, end: 2040, icon: "🚗" },
  { goal: "Cars - Honda", owner: "Catherine", amount: 60000, frequency: "Every 5 years", start: 2026, end: 2041, icon: "🚗" },
  { goal: "Family holidays", owner: "Catherine", amount: 50000, frequency: "Every year", start: 2030, end: 2045, icon: "🏖️" },
];


export function FinancialSummaryDashboard({ chartData, cashflowData, meta, projYears }) {
  const [hidden, setHidden]       = React.useState({});
  const [hiddenMS, setHiddenMS]   = React.useState({});

  if (!chartData || !meta) return null;

  const { c1Name, c2Name, c1AgeNow, c2AgeNow, c1RetAge, c2RetAge, c1RetYr, c2RetYr, c1LE, c2LE, currentFY } = meta;
  const N = chartData.length;

  const toggleSeries = (key) => setHidden(h => ({ ...h, [key]: !h[key] }));
  const toggleMS     = (lbl)  => setHiddenMS(h => ({ ...h, [lbl]: !h[lbl] }));

  // Milestone indices
  const c1RetIdx    = Math.min(Math.max(0, c1RetYr || 0), N - 1);
  const c2RetIdx    = Math.min(Math.max(0, c2RetYr || 0), N - 1);
  const bothRetIdx  = Math.max(c1RetIdx, c2RetIdx);
  const c1LEIdx     = Math.min(Math.max(0, (c1LE || 85) - (c1AgeNow || 60)), N - 1);
  const c2LEIdx     = Math.min(Math.max(0, (c2LE || 85) - (c2AgeNow || 56)), N - 1);
  const debtFreeIdx = chartData.findIndex(d => d.debt >= 0);

  const milestones = [
    ...(c1RetIdx > 0 && c1RetIdx < N ? [{ idx: c1RetIdx, label: `${c1Name} retires`, shortLabel: "Ret.", color: "#6366F1", dash: "5 3" }] : []),
    ...(c2RetIdx > 0 && c2RetIdx < N && c2RetIdx !== c1RetIdx ? [{ idx: c2RetIdx, label: `${c2Name} retires`, shortLabel: "Ret.", color: "#8B5CF6", dash: "5 3" }] : []),
    ...(debtFreeIdx > 0 ? [{ idx: debtFreeIdx, label: "Debt free", shortLabel: "Debt free", color: "var(--ps-green)", dash: "3 3" }] : []),
    ...(c1LEIdx > 0 && c1LEIdx < N ? [{ idx: c1LEIdx, label: `${c1Name} life exp. (${c1LE})`, shortLabel: `LE ${c1LE}`, color: "var(--ps-text-subtle)", dash: "2 4" }] : []),
    ...(c2LEIdx > 0 && c2LEIdx < N && c2LEIdx !== c1LEIdx ? [{ idx: c2LEIdx, label: `${c2Name} life exp. (${c2LE})`, shortLabel: `LE ${c2LE}`, color: "var(--ps-border-mid)", dash: "2 4" }] : []),
  ];
  const visibleMilestones = milestones.filter(m => !hiddenMS[m.label]);

  const fC = (v) => {
    const abs = Math.abs(v);
    if (abs >= 1000000) return (v < 0 ? "-" : "") + "$" + (abs / 1000000).toFixed(2) + "M";
    if (abs >= 1000)    return (v < 0 ? "-" : "") + "$" + Math.round(abs / 1000) + "k";
    return (v < 0 ? "-$" : "$") + Math.round(abs).toLocaleString("en-AU");
  };

  const yr0    = chartData[0]          || {};
  const retYr  = chartData[bothRetIdx] || {};
  const peakNW = Math.max(...chartData.map(d => d.netWorth || 0));
  const peakIdx = chartData.findIndex(d => d.netWorth === peakNW);

  const kpis = [
    { label: "Net Worth Today",         value: fC(yr0.netWorth || 0),   sub: projYears?.[0] || "",              trend: ((chartData[Math.min(4,N-1)]?.netWorth||0)-(yr0.netWorth||0))>0?"up":"flat", trendVal: fC((chartData[Math.min(4,N-1)]?.netWorth||0)-(yr0.netWorth||0))+" over 5y", accent:"#4F46E5", sparkKey:"netWorth" },
    { label: "Net Worth at Retirement", value: fC(retYr.netWorth || 0), sub: projYears?.[bothRetIdx] || "",     trend: (retYr.netWorth||0)>(yr0.netWorth||0)?"up":"down",                           trendVal: `vs ${fC(yr0.netWorth||0)} today`,                                         accent:"#7C3AED", sparkKey:"netWorth" },
    { label: "Peak Net Worth",          value: fC(peakNW),              sub: `Yr ${peakIdx+1} · ${projYears?.[peakIdx]||""}`, trend:"up",                                                          trendVal: `+${fC(peakNW-(yr0.netWorth||0))} growth`,                                  accent:"#059669", sparkKey:"netWorth" },
    { label: "Super at Retirement",     value: fC(retYr.super || 0),    sub: `Today: ${fC(yr0.super||0)}`,     trend: (retYr.super||0)>(yr0.super||0)?"up":"down",                                 trendVal: `+${fC((retYr.super||0)-(yr0.super||0))}`,                                  accent:"#0891B2", sparkKey:"super"    },
    { label: "Years to Retirement",     value: `${Math.max(c1RetYr||0,c2RetYr||0)} yrs`, sub: `${c1Name}: ${c1RetYr||0}y · ${c2Name}: ${c2RetYr||0}y`, trend:"neutral",                          trendVal: `Retire at ${c1RetAge} / ${c2RetAge}`,                                       accent:"#D97706", sparkKey:null       },
    { label: "Life Expectancy",         value: `${c1LE||85} / ${c2LE||85}`,              sub: `${c1Name} / ${c2Name}`, trend:"neutral",                                                           trendVal: `Horizon: ${Math.max(c1LEIdx,c2LEIdx)} years`,                               accent:"#64748B", sparkKey:null       },
  ];

  const capitalSeries = [
    { key:"netWorth",    label:"Net Worth",   color:"#000000", type:"line" },
    { key:"super",       label:"Super",       color:"#6366F1", type:"bar"  },
    { key:"property",    label:"Property",    color:"#0891B2", type:"bar"  },
    { key:"investments", label:"Investments", color:"#059669", type:"bar"  },
    { key:"lifestyle",   label:"Lifestyle",   color:"#7C3AED", type:"bar"  },
    { key:"debt",        label:"Debt",        color:"var(--ps-red)", type:"bar"  },
  ];

  const cashflowSeries = [
    { key:"c1Income",      label:`${c1Name} Income`,  color:"#6366F1", type:"bar-pos" },
    { key:"c2Income",      label:`${c2Name} Income`,  color:"#0891B2", type:"bar-pos" },
    { key:"livingExp",     label:"Living Expenses",   color:"#F97316", type:"bar-neg" },
    { key:"debtExp",       label:"Debt Servicing",    color:"var(--ps-red)", type:"bar-neg" },
    { key:"insuranceExp",  label:"Insurance",         color:"var(--ps-red)", type:"bar-neg" },
    { key:"surplus",       label:"Net Cashflow",      color:"#10B981", type:"line"    },
  ];

  const activeSeries = cashflowSeries;

  // Sparkline
  const Sparkline = ({ dataKey }) => {
    if (!dataKey) return null;
    const mini = chartData.slice(-8);
    const vals = mini.map(d => d[dataKey] || 0);
    const minV = Math.min(...vals), maxV = Math.max(...vals);
    const range = maxV - minV || 1;
    const w = 64, h = 24;
    const pts = vals.map((v, i) => `${(i/(vals.length-1))*w},${h-((v-minV)/range)*h}`).join(" ");
    const last = pts.split(" ").pop().split(",");
    return (
      <svg width={w} height={h} style={{ display:"block" }}>
        <polyline points={pts} fill="none" stroke="var(--ps-border-mid)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={last[0]} cy={last[1]} r={2.5} fill="#6366F1" />
      </svg>
    );
  };

  // Capital tooltip
  const CapitalTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload || {};
    const ms = visibleMilestones.filter(m => chartData[m.idx]?.year === label);
    return (
      <div style={{ background:"var(--ps-surface)", border:"1px solid var(--ps-border)", borderRadius:10, padding:"12px 16px", fontSize:12, boxShadow:"0 8px 24px var(--ps-shadow-md)", minWidth:210 }}>
        <div style={{ fontWeight:700, color:"var(--ps-text-primary)", marginBottom:8, fontSize:13 }}>{label}</div>
        {capitalSeries.filter(s => !hidden[s.key] && d[s.key] !== undefined && d[s.key] !== 0).map(({ key, label:lbl, color }) => (
          <div key={key} style={{ display:"flex", justifyContent:"space-between", gap:24, marginBottom:4, alignItems:"center" }}>
            <span style={{ display:"flex", alignItems:"center", gap:6, color:"var(--ps-text-secondary)" }}>
              <span style={{ width:8, height:8, borderRadius:2, background:color, display:"inline-block", flexShrink:0 }} />{lbl}
            </span>
            <span style={{ fontWeight:600, color: d[key]<0?"#EF4444":"var(--ps-text-primary)" }}>{fC(Math.abs(d[key]))}</span>
          </div>
        ))}
        {ms.length > 0 && <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid var(--ps-border-light)" }}>{ms.map(m => <div key={m.label} style={{ fontSize:11, color:m.color, fontWeight:600 }}>◆ {m.label}</div>)}</div>}
      </div>
    );
  };

  // Cashflow tooltip
  const CashflowTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload || {};
    const isSurplus = (d.surplus || 0) >= 0;
    const ms = visibleMilestones.filter(m => (cashflowData||[])[m.idx]?.year === label);
    return (
      <div style={{ background:"var(--ps-surface)", border:"1px solid var(--ps-border)", borderRadius:10, padding:"12px 16px", fontSize:12, boxShadow:"0 8px 24px var(--ps-shadow-md)", minWidth:230 }}>
        <div style={{ fontWeight:700, color:"var(--ps-text-primary)", marginBottom:8, fontSize:13 }}>{label}</div>
        {/* Income */}
        <div style={{ fontSize:10, fontWeight:700, color:"var(--ps-text-subtle)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>Income</div>
        {[{key:"c1Income",label:c1Name,color:"#6366F1"},{key:"c2Income",label:c2Name,color:"#0891B2"}]
          .filter(s => !hidden[s.key] && d[s.key])
          .map(({ key, label:lbl, color }) => (
          <div key={key} style={{ display:"flex", justifyContent:"space-between", gap:24, marginBottom:3, alignItems:"center" }}>
            <span style={{ display:"flex", alignItems:"center", gap:6, color:"var(--ps-text-secondary)" }}><span style={{ width:8, height:8, borderRadius:2, background:color, display:"inline-block" }} />{lbl}</span>
            <span style={{ fontWeight:600 }}>{fC(d[key])}</span>
          </div>
        ))}
        {/* Expenses */}
        <div style={{ fontSize:10, fontWeight:700, color:"var(--ps-text-subtle)", textTransform:"uppercase", letterSpacing:"0.06em", marginTop:8, marginBottom:4 }}>Expenses</div>
        {[{key:"livingExp",label:"Living",color:"#F97316"},{key:"debtExp",label:"Debt",color:"var(--ps-red)"},{key:"insuranceExp",label:"Insurance",color:"var(--ps-red)"}]
          .filter(s => !hidden[s.key] && d[s.key])
          .map(({ key, label:lbl, color }) => (
          <div key={key} style={{ display:"flex", justifyContent:"space-between", gap:24, marginBottom:3, alignItems:"center" }}>
            <span style={{ display:"flex", alignItems:"center", gap:6, color:"var(--ps-text-secondary)" }}><span style={{ width:8, height:8, borderRadius:2, background:color, display:"inline-block" }} />{lbl}</span>
            <span style={{ fontWeight:600, color:"var(--ps-red)" }}>{fC(d[key])}</span>
          </div>
        ))}
        {/* Net */}
        {!hidden.surplus && (
          <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid var(--ps-border-light)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontWeight:700, color:"var(--ps-text-primary)" }}>{isSurplus ? "Surplus" : "Deficit"}</span>
            <span style={{ fontWeight:800, fontSize:14, color: isSurplus ? "var(--ps-green)" : "var(--ps-red)" }}>{fC(Math.abs(d.surplus || 0))}</span>
          </div>
        )}
        {ms.length > 0 && <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid var(--ps-border-light)" }}>{ms.map(m => <div key={m.label} style={{ fontSize:11, color:m.color, fontWeight:600 }}>◆ {m.label}</div>)}</div>}
      </div>
    );
  };

  const MilestoneLabel = ({ viewBox, label, color }) => {
    if (!viewBox) return null;
    return <g transform={`translate(${viewBox.x+4},8)`}><text fontSize={9} fontWeight={700} fill={color} style={{ letterSpacing:"0.03em" }}>{label}</text></g>;
  };

  const TrendArrow = ({ trend, val }) => {
    if (trend === "neutral") return <span style={{ color:"var(--ps-text-subtle)", fontSize:10 }}>{val}</span>;
    const isUp = trend === "up";
    return <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:10, fontWeight:600, color:isUp?"#059669":"#DC2626", background:isUp?"rgba(5,150,105,0.08)":"rgba(220,38,38,0.08)", border:isUp?"1px solid rgba(5,150,105,0.15)":"1px solid rgba(220,38,38,0.15)", borderRadius:4, padding:"1px 6px", marginTop:4 }}><span>{isUp?"▲":"▼"}</span><span>{val}</span></span>;
  };

  const LegendPill = ({ sk, isHidden, onClick }) => {
    const dotStyle = isHidden
      ? { width:8, height:8, borderRadius:2, background:"var(--ps-border-mid)" }
      : sk.type === "line"
      ? { width:16, height:2, borderRadius:1, background:sk.color }
      : { width:8, height:8, borderRadius:2, background:sk.color, opacity:sk.type==="bar-neg"?0.7:0.6 };
    return (
      <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:isHidden?"var(--ps-border-mid)":"var(--ps-text-muted)", cursor:"pointer", userSelect:"none", padding:"3px 8px", borderRadius:6, border:`1px solid ${isHidden?"var(--ps-border-light)":"var(--ps-border)"}`, background:isHidden?"var(--ps-surface-alt)":"var(--ps-surface)", transition:"all 0.15s ease" }}>
        <div style={dotStyle} />
        <span style={{ textDecoration:isHidden?"line-through":"none" }}>{sk.label}</span>
      </div>
    );
  };

  const MilestonePill = ({ m, isHidden, onClick }) => (
    <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, color:isHidden?"var(--ps-border-mid)":m.color, cursor:"pointer", userSelect:"none", padding:"3px 8px", borderRadius:6, border:`1px solid ${isHidden?"var(--ps-border-light)":m.color+"40"}`, background:isHidden?"var(--ps-surface-alt)":m.color+"08", transition:"all 0.15s ease" }}>
      <svg width={18} height={6}><line x1={0} y1={3} x2={18} y2={3} stroke={isHidden?"var(--ps-border-mid)":m.color} strokeWidth={1.5} strokeDasharray={m.dash} /></svg>
      <span style={{ fontWeight:600, textDecoration:isHidden?"line-through":"none" }}>{m.label}</span>
    </div>
  );

  const fyRange = `${currentFY}/${String(currentFY+1).slice(-2)} – ${currentFY+N-1}/${String(currentFY+N).slice(-2)}`;

  // Cashflow: split net cashflow into positive/negative for dual-colour area
  const cfData = (cashflowData || []).map(d => ({
    ...d,
    surplusPos: (d.surplus||0) >= 0 ? (d.surplus||0) : null,
    surplusNeg: (d.surplus||0) <  0 ? (d.surplus||0) : null,
  }));

  return (
    <div style={{ marginBottom:20, fontFamily:"'Inter', system-ui, sans-serif" }}>
      <div style={{ background:"var(--ps-surface)", borderRadius:12, border:"1px solid var(--ps-border)", boxShadow:"0 1px 6px var(--ps-shadow-xs), 0 4px 20px rgba(0,0,0,0.04)", overflow:"hidden" }}>

        {/* Header stripe */}
        <div style={{ background:"linear-gradient(90deg, #4F46E5 0%, #6366F1 40%, #818CF8 100%)", height:4 }} />

        {/* Title bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid var(--ps-border-light)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontWeight:700, fontSize:15, color:"var(--ps-text-primary)", letterSpacing:"-0.01em" }}>Financial Overview</span>
            <span style={{ background:"var(--ps-surface-alt)", border:"1px solid var(--ps-border)", color:"var(--ps-text-muted)", fontSize:10, padding:"2px 9px", borderRadius:20, fontWeight:500 }}>{fyRange}</span>
          </div>
        </div>

            {/* KPI Cards */}
            <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap", padding:"16px 20px" }}>
              {kpis.map((k, i) => (
                <div key={i} style={{ background:"var(--ps-surface)", border:"1px solid var(--ps-border)", borderRadius:10, padding:"16px 20px", borderLeft:`3px solid ${k.accent}`, display:"flex", flexDirection:"column", gap:4, flex:1, minWidth:160 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:"var(--ps-text-muted)", textTransform:"uppercase", letterSpacing:"0.06em" }}>{k.label}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:"var(--ps-text-strongest)", letterSpacing:"-0.02em" }}>{k.value}</div>
                  <div style={{ fontSize:10, color:"var(--ps-text-subtle)", marginTop:2 }}>{k.sub}</div>
                  <TrendArrow trend={k.trend} val={k.trendVal} />
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{ padding:"20px 24px 16px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:13, color:"var(--ps-text-primary)", marginBottom:8 }}>
                    Household Income, Expenses & Net Cashflow
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {activeSeries.map(sk => (
                      <LegendPill key={sk.key} sk={sk} isHidden={!!hidden[sk.key]} onClick={(e) => { e.stopPropagation(); toggleSeries(sk.key); }} />
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                  {milestones.map(m => (
                    <MilestonePill key={m.label} m={m} isHidden={!!hiddenMS[m.label]} onClick={(e) => { e.stopPropagation(); toggleMS(m.label); }} />
                  ))}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={cfData} margin={{ top:24, right:24, bottom:8, left:8 }} barCategoryGap={0}>
                    <defs>
                      <linearGradient id="cfGradSurplus" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.25}/><stop offset="100%" stopColor="#10B981" stopOpacity={0.05}/></linearGradient>
                      <linearGradient id="cfGradDeficit" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF4444" stopOpacity={0.05}/><stop offset="100%" stopColor="#EF4444" stopOpacity={0.25}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ps-border-light)" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize:10, fill:"var(--ps-text-subtle)" }} tickFormatter={v => v?String(v).slice(0,7):v} interval={1} angle={-35} textAnchor="end" height={44} axisLine={{ stroke:"var(--ps-border)" }} tickLine={false} />
                    <YAxis tickFormatter={v => v===0?"0":fC(v)} tick={{ fontSize:10, fill:"var(--ps-text-subtle)" }} width={72} axisLine={false} tickLine={false} />
                    <Tooltip content={<CashflowTooltip />} cursor={{ stroke:"var(--ps-border)", strokeWidth:1 }} />

                    {/* Zero line — the surplus/deficit boundary */}
                    <ReferenceLine y={0} stroke="var(--ps-text-subtle)" strokeWidth={1} />

                    {/* Income stacked up */}
                    {/* All items — single stack */}
                    <Bar dataKey="c1Income"     stackId="cf" fill="#6366F1" fillOpacity={0.75} hide={!!hidden.c1Income}     radius={[0,0,0,0]} />
                    <Bar dataKey="c2Income"     stackId="cf" fill="#0891B2" fillOpacity={0.75} hide={!!hidden.c2Income}     radius={[0,0,0,0]} />
                    <Bar dataKey="livingExp"    stackId="cf" fill="#F97316" fillOpacity={0.75} hide={!!hidden.livingExp}    radius={[0,0,0,0]} />
                    <Bar dataKey="debtExp"      stackId="cf" fill="#EF4444" fillOpacity={0.75} hide={!!hidden.debtExp}      radius={[0,0,0,0]} />
                    <Bar dataKey="insuranceExp" stackId="cf" fill="#DC2626" fillOpacity={0.75} hide={!!hidden.insuranceExp} radius={[2,2,0,0]} />
                    <Bar dataKey="livingExpNeg"    stackId="cf" fill="#F97316" fillOpacity={0.75} hide={!!hidden.livingExp}    radius={[0,0,0,0]} />
                    <Bar dataKey="debtExpNeg"      stackId="cf" fill="#EF4444" fillOpacity={0.75} hide={!!hidden.debtExp}      radius={[0,0,0,0]} />
                    <Bar dataKey="insuranceExpNeg" stackId="cf" fill="#DC2626" fillOpacity={0.75} hide={!!hidden.insuranceExp} radius={[0,0,2,2]} />

                    {/* Net cashflow line — black */}
                    {!hidden.surplus && (() => {
                      const CustomSurplusLine = (props) => {
                        const { xAxisMap, yAxisMap } = props;
                        if (!xAxisMap || !yAxisMap) return null;
                        const xAxis = Object.values(xAxisMap)[0];
                        const yAxis = Object.values(yAxisMap)[0];
                        if (!xAxis || !yAxis || !xAxis.bandSize) return null;
                        const bandWidth = xAxis.bandSize;
                        return (
                          <g>
                            {cfData.map((d, i) => {
                              if (d.surplus == null) return null;
                              const x = xAxis.x + i * bandWidth;
                              const y = yAxis.scale(d.surplus);
                              return <line key={i} x1={x} y1={y} x2={x + bandWidth} y2={y} stroke="#000" strokeWidth={2.5} />;
                            })}
                          </g>
                        );
                      };
                      return <Customized component={CustomSurplusLine} />;
                    })()}

                    {visibleMilestones.map(m => <ReferenceLine key={m.label} x={(cashflowData||[])[m.idx]?.year} stroke={m.color} strokeDasharray={m.dash} strokeWidth={1.5} label={<MilestoneLabel label={m.shortLabel} color={m.color} />} />)}
                    <ReferenceLine x={(cashflowData||[])[0]?.year} stroke="var(--ps-border-mid)" strokeWidth={1} strokeDasharray="2 3" label={<MilestoneLabel label="Now" color="var(--ps-text-subtle)" />} />
                  </ComposedChart>
              </ResponsiveContainer>
            </div>
      </div>
    </div>
  );
}





export function MilestonesDashboard({ dynamicMilestones }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const startYear = 2025;
  const endYear = 2050;
  const totalYears = endYear - startYear;

  // Catherine born ~1966 (age 59 in 2025), Paul born ~1969 (age 56 in 2025)
  const cathAge = (yr) => yr - 1966;
  const paulAge = (yr) => yr - 1969;

  const allMilestones = [...MILESTONES, ...(dynamicMilestones || [])];
  const sorted = [...allMilestones].sort((a, b) => a.year - b.year);

  // Group milestones by year for stacking
  const byYear = {};
  sorted.forEach((m, i) => {
    if (!byYear[m.year]) byYear[m.year] = [];
    byYear[m.year].push({ ...m, originalIdx: i });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Visual Timeline */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", padding: "24px 24px 16px", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ps-text-primary)" }}>Life Timeline</div>
          <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4338ca", display: "inline-block" }} /> Milestone</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#e8913a", display: "inline-block" }} /> Life Event</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} /> Goal Period</span>
          </div>
        </div>

        {/* Goal bars (background lanes) */}
        <div style={{ position: "relative", marginBottom: 8 }}>
          {LIFE_GOALS.map((g, gi) => {
            const left = ((g.start - startYear) / totalYears) * 100;
            const width = ((Math.min(g.end, endYear) - g.start) / totalYears) * 100;
            return (
              <div key={gi} style={{ display: "flex", alignItems: "center", height: 22, marginBottom: 2, position: "relative" }}>
                <div style={{ width: "100%", position: "relative", height: "100%" }}>
                  <div style={{
                    position: "absolute", left: `${left}%`, width: `${width}%`, height: "100%",
                    background: "linear-gradient(90deg, rgba(22,163,106,0.12), rgba(22,163,106,0.06))",
                    borderRadius: 4, border: "1px solid rgba(22,163,106,0.2)",
                    display: "flex", alignItems: "center", paddingLeft: 6, overflow: "hidden",
                  }}>
                    <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 500, whiteSpace: "nowrap" }}>{g.icon} {g.goal}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main timeline track */}
        <div style={{ position: "relative", height: 120, marginTop: 8 }}>
          {/* Track line */}
          <div style={{ position: "absolute", top: 55, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #4338ca, #93b5e0, #e8913a)", borderRadius: 2 }} />

          {/* "Now" marker */}
          <div style={{ position: "absolute", top: 42, left: "0%", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 5 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#4338ca", border: "3px solid var(--ps-surface)", boxShadow: "0 0 0 2px #4338ca, 0 0 8px rgba(67,56,202,0.4)" }} />
            <div style={{ fontSize: 9, fontWeight: 700, color: "#4338ca", marginTop: 4 }}>NOW</div>
          </div>

          {/* Retirement zone shading */}
          <div style={{
            position: "absolute", top: 0, bottom: 0,
            left: `${((2031 - startYear) / totalYears) * 100}%`,
            right: 0, background: "var(--ps-retirement-wash)",
            borderLeft: "2px dashed var(--ps-retirement-border)",
          }}>
            <div style={{ position: "absolute", top: 4, left: 8, fontSize: 10, color: "var(--ps-retirement-text)", fontWeight: 700, letterSpacing: "0.08em" }}>RETIREMENT PHASE</div>
          </div>

          {/* Milestone markers */}
          {Object.entries(byYear).map(([yearStr, items]) => {
            const year = parseInt(yearStr);
            const leftPct = ((year - startYear) / totalYears) * 100;
            return items.map((m, stackIdx) => {
              const isHovered = hoveredIdx === m.originalIdx;
              const isAbove = stackIdx % 2 === 0;
              const topPos = isAbove ? (8 - stackIdx * 3) : (70 + stackIdx * 3);
              const color = m.type === "milestone" ? "#4338ca" : "#e8913a";
              return (
                <div key={`${year}-${stackIdx}`}
                  onMouseEnter={() => setHoveredIdx(m.originalIdx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    position: "absolute", left: `${leftPct}%`, top: topPos,
                    transform: "translateX(-50%)", cursor: "pointer", zIndex: isHovered ? 10 : 3,
                    display: "flex", flexDirection: "column", alignItems: "center",
                  }}>
                  {/* Connector line */}
                  <div style={{
                    position: "absolute",
                    top: isAbove ? "100%" : "auto",
                    bottom: isAbove ? "auto" : "100%",
                    width: 1, height: isAbove ? (45 - topPos) : (topPos - 58),
                    background: color, opacity: 0.3,
                  }} />
                  {/* Icon bubble */}
                  <div style={{
                    width: isHovered ? 36 : 30, height: isHovered ? 36 : 30,
                    borderRadius: "50%", background: "var(--ps-surface)",
                    border: `2px solid ${color}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: isHovered ? 16 : 13,
                    boxShadow: isHovered ? `0 0 12px ${color}40` : "0 1px 3px var(--ps-shadow-md)",
                    transition: "all 0.2s ease",
                  }}>
                    {m.icon}
                  </div>
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div style={{
                      position: "absolute",
                      [isAbove ? "bottom" : "top"]: "110%",
                      background: "var(--ps-text-primary)", color: "var(--ps-surface)", padding: "8px 12px",
                      borderRadius: 8, fontSize: 11, whiteSpace: "nowrap",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)", zIndex: 20,
                    }}>
                      <div style={{ fontWeight: 600 }}>{m.milestone}</div>
                      <div style={{ color: "var(--ps-text-subtle)", marginTop: 2 }}>{m.entity} · {m.year}</div>
                    </div>
                  )}
                </div>
              );
            });
          })}
        </div>

        {/* Year axis */}
        <div style={{ display: "flex", justifyContent: "space-between", position: "relative", marginTop: 4, paddingTop: 4, borderTop: "1px solid var(--ps-border-light)" }}>
          {Array.from({ length: Math.floor(totalYears / 5) + 1 }, (_, i) => startYear + i * 5).map(yr => (
            <div key={yr} style={{ textAlign: "center", fontSize: 10, color: "var(--ps-text-subtle)" }}>
              <div style={{ fontWeight: 600 }}>{yr}</div>
              <div style={{ fontSize: 9, color: "var(--ps-border-mid)" }}>C:{cathAge(yr)} P:{paulAge(yr)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Milestones table | Goals table */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Milestones */}
        <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", background: "var(--ps-surface-alt)", borderBottom: "1px solid var(--ps-border)", fontWeight: 700, fontSize: 13, color: "var(--ps-text-primary)" }}>Milestones & Events</div>
          <div style={{ maxHeight: 400, overflow: "auto" }}>
            {sorted.map((m, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
                borderBottom: "1px solid var(--ps-border-light)", background: i % 2 === 0 ? "var(--ps-surface)" : "var(--ps-surface-alt)",
              }}>
                <span style={{ fontSize: 18, width: 32, textAlign: "center" }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ps-text-primary)" }}>{m.milestone}</div>
                  <div style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>{m.entity}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#4338ca" }}>{m.year}</div>
                  <div style={{ fontSize: 10, color: "var(--ps-text-subtle)" }}>
                    {m.entity === "Catherine" ? `Age ${cathAge(m.year)}` :
                     m.entity === "Paul Andrew" ? `Age ${paulAge(m.year)}` :
                     `C:${cathAge(m.year)} P:${paulAge(m.year)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", background: "var(--ps-surface-alt)", borderBottom: "1px solid var(--ps-border)", fontWeight: 700, fontSize: 13, color: "var(--ps-text-primary)" }}>Goals & Risk Profile</div>
          <div style={{ maxHeight: 400, overflow: "auto" }}>
            {LIFE_GOALS.map((g, i) => {
              const now = 2025;
              const totalSpan = g.end - g.start;
              const elapsed = Math.min(Math.max(now - g.start, 0), totalSpan);
              const pct = totalSpan > 0 ? (elapsed / totalSpan) * 100 : 0;
              return (
                <div key={i} style={{
                  padding: "12px 20px", borderBottom: "1px solid var(--ps-border-light)",
                  background: i % 2 === 0 ? "var(--ps-surface)" : "var(--ps-surface-alt)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{g.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ps-text-primary)" }}>{g.goal}</div>
                        <div style={{ fontSize: 10, color: "var(--ps-text-subtle)" }}>{g.owner} · {g.frequency}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-body)" }}>${g.amount.toLocaleString("en-AU")}</div>
                      <div style={{ fontSize: 10, color: "var(--ps-text-subtle)" }}>{g.start} – {g.end}</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ background: "var(--ps-border)", borderRadius: 4, height: 5, width: "100%" }}>
                    <div style={{ background: "#16a34a", borderRadius: 4, height: 5, width: `${pct}%`, transition: "width 0.3s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Assumptions > Model > Rebalancing
const REBALANCING_COLUMNS = ["Current Position", "Advicemodel 2", "Investmentbasic1", "In-specie model", "Max superannuation"];
const REBALANCING_DATA = [
  { label: "Surplus 1", values: ["Non-deductible debt repayment","Non-deductible debt repayment","Model portfolio (no gearing)","Non-deductible debt repayment","Non-deductible debt repayment"] },
  { label: "Surplus 2", values: ["Deductible debt repayment","Deductible debt repayment","Build cash","Deductible debt repayment","Deductible debt repayment"] },
  { label: "Surplus 3", values: ["Model portfolio (no gearing)","Model portfolio (no gearing)","Build cash","Model portfolio (no gearing)","Model portfolio (no gearing)"] },
  { label: "Surplus 4", values: ["Build cash","Build cash","Build cash","Build cash","Build cash"] },
  { label: "Surplus 5", values: ["Build cash","Build cash","Build cash","Build cash","Build cash"] },
  { label: "Surplus 6", values: ["Build cash","Build cash","Build cash","Build cash","Build cash"] },
  { label: "Drawdown", values: ["Portfolio","Portfolio","Principal residence","Portfolio","Portfolio"] },
  { label: "Drawdown 2", values: ["Superannuation","Superannuation","Superannuation","Superannuation","Debt redraw"] },
  { label: "Portfolio priority", values: ["Minimise tax","Minimise tax","Minimise tax","Minimise tax","Minimise tax"] },
];

export function RebalancingTable({ model }) {
  // Strategy colour map — each unique strategy gets a distinct chip style
  const STRATEGY_STYLES = {
    "Non-deductible debt repayment": { bg: "var(--ps-bg-red-200)", color: "var(--ps-badge-red)", icon: "🏠" },
    "Deductible debt repayment": { bg: "#FFEDD5", color: "#9A3412", icon: "💳" },
    "Model portfolio (no gearing)": { bg: "var(--ps-bg-blue-200)", color: "#1E40AF", icon: "📊" },
    "Build cash": { bg: "var(--ps-bg-green-200)", color: "var(--ps-badge-green)", icon: "💰" },
    "Portfolio": { bg: "var(--ps-bg-indigo-200)", color: "#3730A3", icon: "📈" },
    "Superannuation": { bg: "#F3E8FF", color: "#6B21A8", icon: "🏦" },
    "Minimise tax": { bg: "var(--ps-surface-cyan)", color: "#155E75", icon: "🧾" },
    "Principal residence": { bg: "#FEF9C3", color: "#854D0E", icon: "🏡" },
    "Debt redraw": { bg: "#FCE7F3", color: "#9D174D", icon: "🔄" },
  };
  const defaultChip = { bg: "var(--ps-border-light)", color: "var(--ps-text-secondary)", icon: "⚙️" };

  // Find the "majority" value per row to highlight differences
  const getMajority = (values) => {
    const counts = {};
    values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    const max = Math.max(...Object.values(counts));
    return Object.keys(counts).find(k => counts[k] === max);
  };

  // Build dynamic rows from model
  const modelName = model?.name || "—";
  const rows = model ? [
    { label: "Drawdown 1", value: model.drawdown_priority_1 || "—" },
    { label: "Drawdown 2", value: model.drawdown_priority_2 || "—" },
    { label: "Drawdown 3", value: model.drawdown_priority_3 || "—" },
    { label: "Portfolio priority", value: model.portfolio_priority || "—" },
    { label: "Surplus 1", value: model.surplus_priority_1 || "—" },
    { label: "Surplus 2", value: model.surplus_priority_2 || "—" },
    { label: "Surplus 3", value: model.surplus_priority_3 || "—" },
  ] : [];

  return (
    <div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries(STRATEGY_STYLES).map(([name, st]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: st.bg, border: `1px solid ${st.color}22` }}>
            <span style={{ fontSize: 12 }}>{st.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: st.color }}>{name}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--ps-surface)", borderRadius: 12, border: "1px solid var(--ps-border)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: "var(--ps-surface-alt)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "2px solid var(--ps-border)" }}>
          <span style={{ fontSize: 16 }}>⚖️</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>Rebalancing Strategy</span>
          <span style={{ fontSize: 11, color: "var(--ps-text-subtle)", marginLeft: 8 }}>Priority order for surplus cashflow allocation per model</span>
        </div>

        {!model ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--ps-text-subtle)" }}>No model configured. Add a model under Advice → Strategies.</div>
        ) : (
          <div style={{ padding: "8px 0" }}>
            <div style={{ padding: "10px 20px 16px", borderBottom: "1px solid var(--ps-border)", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>Active model: </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{modelName}</span>
            </div>
            {rows.map((row, ri) => {
              const isSurplus = row.label.startsWith("Surplus");
              const isDrawdown = row.label.startsWith("Drawdown");
              const isPortfolio = row.label === "Portfolio priority";
              const st = STRATEGY_STYLES[row.value] || defaultChip;
              return (
                <div key={ri} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 20px", borderBottom: ri < rows.length - 1 ? "1px solid var(--ps-border-light)" : "none",
                  background: "var(--ps-surface)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 26, height: 26, borderRadius: 6, fontSize: 10, fontWeight: 700,
                      background: isSurplus ? "var(--ps-surface-blue)" : isDrawdown ? "var(--ps-surface-red)" : "var(--ps-surface-purple)",
                      color: isSurplus ? "var(--ps-badge-blue)" : isDrawdown ? "var(--ps-red)" : "#7C3AED",
                      border: `1px solid ${isSurplus ? "var(--ps-ring-blue)" : isDrawdown ? "var(--ps-ring-red-soft)" : "var(--ps-ring-purple)"}`,
                    }}>
                      {isSurplus ? "S" : isDrawdown ? "D" : "P"}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-primary)" }}>{row.label}</span>
                  </div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 14px", borderRadius: 8,
                    background: st.bg, color: st.color,
                    fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                    border: `1px solid ${st.color}33`,
                  }}>
                    <span>{st.icon}</span>
                    {row.value}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

