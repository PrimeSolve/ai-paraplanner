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

export default function ProgressBar({ completionData = {}, onContinue }) {
  const values = Object.values(completionData);
  const overall = values.length
    ? Math.round(values.reduce((s, v) => s + v, 0) / values.length)
    : 0;

  // Find first incomplete section for "Continue"
  const nextSection = sectionLabels.find(s => (completionData[s.key] ?? 0) < 100);

  return (
    <div style={{ padding: '12px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* Section dots */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
        {sectionLabels.map(({ key, label }) => {
          const pct = completionData[key] ?? 0;
          return (
            <div
              key={key}
              title={`${label}: ${pct}%`}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '2px 7px', borderRadius: 12,
                background: pct === 100 ? '#ecfdf5' : pct > 0 ? '#fffbeb' : '#f8fafc',
                border: `1px solid ${getColor(pct)}`,
                fontSize: 10, fontWeight: 600, color: '#475569',
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: getColor(pct), display: 'inline-block' }} />
              {label}
            </div>
          );
        })}
      </div>

      {/* Overall % */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ width: 80, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${overall}%`, height: '100%', background: getColor(overall), borderRadius: 3, transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{overall}%</span>
      </div>

      {/* Continue CTA */}
      {nextSection && onContinue && (
        <button
          onClick={() => onContinue(nextSection.key)}
          style={{
            padding: '6px 14px', borderRadius: 6, border: 'none',
            background: '#4F46E5', color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          Continue &rarr;
        </button>
      )}
    </div>
  );
}
