import React from 'react';

const tiles = [
  { id: 'personal', icon: '👤', label: 'Personal Details', description: 'Names, contact, employment, health & estate' },
  { id: 'dependants', icon: '👨‍👩‍👧‍👦', label: 'Dependants', description: 'Children & adult dependants' },
  { id: 'trusts_companies', icon: '🏢', label: 'Trusts & Companies', description: 'Trust & company entities' },
  { id: 'smsf', icon: '🏦', label: 'SMSF', description: 'Self-managed super fund details' },
  { id: 'superannuation', icon: '💰', label: 'Superannuation', description: 'Super funds, pensions & annuities' },
  { id: 'investments', icon: '📈', label: 'Investments', description: 'Wraps & investment bonds' },
  { id: 'assets_liabilities', icon: '🏠', label: 'Assets & Liabilities', description: 'Properties, assets & debts' },
  { id: 'income_expenses', icon: '💵', label: 'Income & Expenses', description: 'Income sources & living expenses' },
  { id: 'insurance', icon: '🛡️', label: 'Insurance', description: 'Life, TPD, income protection & trauma' },
  { id: 'super_tax', icon: '📋', label: 'Super & Tax', description: 'Superannuation & tax planning details' },
  { id: 'advice_reason', icon: '🎯', label: 'Advice Reasons', description: 'Why the client is seeking advice' },
  { id: 'risk_profile', icon: '⚖️', label: 'Risk Profile', description: 'Risk tolerance assessment' },
];

function getStatusColor(pct) {
  if (pct === 100) return { bg: '#ecfdf5', border: '#10b981', text: '#065f46' };
  if (pct >= 50) return { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' };
  if (pct > 0) return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' };
  return { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' };
}

export default function FactFindClientDashboard({ factFind, completionData = {}, onTileClick }) {
  return (
    <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16,
      }}>
        {tiles.map(tile => {
          const pct = completionData[tile.id] ?? 0;
          const colors = getStatusColor(pct);

          return (
            <button
              key={tile.id}
              onClick={() => onTileClick?.(tile.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 8,
                padding: 20,
                borderRadius: 12,
                border: `1.5px solid ${colors.border}`,
                background: colors.bg,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: 28 }}>{tile.icon}</span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: colors.text,
                  background: pct === 100 ? '#d1fae5' : 'rgba(0,0,0,0.05)',
                  padding: '2px 8px',
                  borderRadius: 10,
                }}>
                  {pct === 100 ? 'Complete' : `${pct}%`}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{tile.label}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{tile.description}</div>
              </div>
              {/* Mini progress bar */}
              <div style={{ width: '100%', height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: colors.border, borderRadius: 2, transition: 'width 0.4s ease' }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
