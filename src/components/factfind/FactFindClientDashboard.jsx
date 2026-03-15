import React from 'react';

const tiles = [
  { id: 'personal', icon: '\u{1F464}', label: 'Personal Details', description: 'Names, contact, employment, health & estate' },
  { id: 'dependants', icon: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}', label: 'Dependants', description: 'Children & adult dependants' },
  { id: 'trusts_companies', icon: '\u{1F3E2}', label: 'Trusts & Companies', description: 'Trust & company entities' },
  { id: 'smsf', icon: '\u{1F3E6}', label: 'SMSF', description: 'Self-managed super fund details' },
  { id: 'superannuation', icon: '\u{1F4B0}', label: 'Superannuation', description: 'Super funds, pensions & annuities' },
  { id: 'investments', icon: '\u{1F4C8}', label: 'Investments', description: 'Wraps & investment bonds' },
  { id: 'assets_liabilities', icon: '\u{1F3E0}', label: 'Assets & Liabilities', description: 'Properties, assets & debts' },
  { id: 'income_expenses', icon: '\u{1F4B5}', label: 'Income & Expenses', description: 'Income sources & living expenses' },
  { id: 'insurance', icon: '\u{1F6E1}\uFE0F', label: 'Insurance', description: 'Life, TPD, income protection & trauma' },
  { id: 'super_tax', icon: '\u{1F4CB}', label: 'Super & Tax', description: 'Superannuation & tax planning details' },
  { id: 'advice_reason', icon: '\u{1F3AF}', label: 'Advice Reasons', description: 'Why the client is seeking advice' },
  { id: 'risk_profile', icon: '\u2696\uFE0F', label: 'Risk Profile', description: 'Risk tolerance assessment' },
];

function getStatusColor(pct) {
  if (pct === 100) return { bg: '#ecfdf5', border: '#10b981', text: '#065f46' };
  if (pct >= 50) return { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' };
  if (pct > 0) return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' };
  return { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' };
}

export default function FactFindClientDashboard({ factFind, completionData = {}, onTileClick }) {
  return (
    <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 14,
      }}>
        {tiles.map(tile => {
          const pct = completionData[tile.id] ?? 0;
          const colors = getStatusColor(pct);

          return (
            <button
              key={tile.id}
              onClick={() => onTileClick?.(tile.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: 6, padding: 16, borderRadius: 10,
                border: `1.5px solid ${colors.border}`, background: colors.bg,
                cursor: 'pointer', textAlign: 'left',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: 24 }}>{tile.icon}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: colors.text,
                  background: pct === 100 ? '#d1fae5' : 'rgba(0,0,0,0.05)',
                  padding: '2px 7px', borderRadius: 10,
                }}>
                  {pct === 100 ? 'Complete' : `${pct}%`}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{tile.label}</div>
                <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{tile.description}</div>
              </div>
              <div style={{ width: '100%', height: 3, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: colors.border, borderRadius: 2, transition: 'width 0.4s ease' }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
