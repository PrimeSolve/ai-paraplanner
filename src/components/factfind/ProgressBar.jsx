import React from 'react';

// Hardcoded completion data — will be wired to live factFind later
const COMPLETION = [
  { id: 'personal',          label: 'Personal',          pct: 85 },
  { id: 'dependants',        label: 'Dependants',        pct: 100 },
  { id: 'entities',          label: 'Entities',          pct: 60 },
  { id: 'superannuation',    label: 'Super',             pct: 45 },
  { id: 'assets_debts',      label: 'Assets & Debts',    pct: 70 },
  { id: 'income_expenses',   label: 'Income & Expenses', pct: 30 },
  { id: 'insurance',         label: 'Insurance',         pct: 0 },
  { id: 'risk_profile',      label: 'Risk Profile',      pct: 50 },
  { id: 'goals',             label: 'Goals',             pct: 0 },
];

function getColor(pct) {
  if (pct === 100) return '#10B981';
  if (pct >= 50) return '#F59E0B';
  if (pct > 0) return '#EF4444';
  return '#CBD5E1';
}

export default function ProgressBar({ onSectionClick }) {
  const overallPct = Math.round(
    COMPLETION.reduce((s, c) => s + c.pct, 0) / COMPLETION.length
  );

  // Find first incomplete section for "Continue" CTA
  const nextSection = COMPLETION.find(c => c.pct < 100);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 24px',
      background: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
      overflowX: 'auto', flexShrink: 0,
    }}>
      {/* Overall completion */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 12px', borderRadius: 20,
        background: '#EEF2FF', flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: `conic-gradient(#6366F1 ${overallPct * 3.6}deg, #E2E8F0 0deg)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: '#EEF2FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 700, color: '#6366F1',
          }}>
            {overallPct}%
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#4338CA' }}>Complete</span>
      </div>

      {/* Section dots */}
      {COMPLETION.map(sec => (
        <button
          key={sec.id}
          onClick={() => onSectionClick?.(sec.id)}
          title={sec.label}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, background: 'none', border: 'none', cursor: 'pointer',
            padding: '2px 6px', flexShrink: 0,
          }}
        >
          <div style={{
            width: 14, height: 14, borderRadius: '50%',
            background: getColor(sec.pct),
            border: sec.pct === 100 ? 'none' : `2px solid ${getColor(sec.pct)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {sec.pct === 100 && (
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{ fontSize: 9, color: '#64748B', whiteSpace: 'nowrap' }}>
            {sec.pct > 0 && sec.pct < 100 ? `${sec.pct}%` : sec.label}
          </span>
        </button>
      ))}

      {/* Continue CTA */}
      {nextSection && (
        <button
          onClick={() => onSectionClick?.(nextSection.id)}
          style={{
            marginLeft: 'auto', padding: '6px 16px', borderRadius: 8,
            background: '#6366F1', color: '#fff', border: 'none',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          Continue &rarr; {nextSection.label}
        </button>
      )}
    </div>
  );
}
