import React from 'react';

const sectionLabels = [
  { key: 'personal', label: 'Personal' },
  { key: 'dependants', label: 'Dependants' },
  { key: 'trusts_companies', label: 'Trusts' },
  { key: 'smsf', label: 'SMSF' },
  { key: 'superannuation', label: 'Super' },
  { key: 'investments', label: 'Investments' },
  { key: 'assets_liabilities', label: 'Assets' },
  { key: 'income_expenses', label: 'Income' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'super_tax', label: 'Super & Tax' },
  { key: 'advice_reason', label: 'Advice' },
  { key: 'risk_profile', label: 'Risk' },
];

function getColor(pct) {
  if (pct === 100) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  if (pct > 0) return '#ef4444';
  return '#e2e8f0';
}

export default function ProgressBar({ completionData = {} }) {
  const values = Object.values(completionData);
  const overall = values.length
    ? Math.round(values.reduce((s, v) => s + v, 0) / values.length)
    : 0;

  return (
    <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
      {/* Overall */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', minWidth: 120 }}>
          Fact Find Progress
        </span>
        <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${overall}%`, height: '100%', background: getColor(overall), borderRadius: 4, transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#334155', minWidth: 36, textAlign: 'right' }}>
          {overall}%
        </span>
      </div>

      {/* Per-section dots */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {sectionLabels.map(({ key, label }) => {
          const pct = completionData[key] ?? 0;
          return (
            <div
              key={key}
              title={`${label}: ${pct}%`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 12,
                background: pct === 100 ? '#ecfdf5' : pct > 0 ? '#fffbeb' : '#f8fafc',
                border: `1px solid ${getColor(pct)}`,
                fontSize: 11,
                fontWeight: 500,
                color: '#475569',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: getColor(pct), display: 'inline-block' }} />
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
