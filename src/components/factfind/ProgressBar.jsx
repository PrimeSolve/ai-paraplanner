import React from 'react';

const SECTIONS = [
  { key: 'personal',          label: 'Personal'    },
  { key: 'dependants',        label: 'Dependants'  },
  { key: 'trusts_companies',  label: 'Entities'    },
  { key: 'smsf',              label: 'SMSF'        },
  { key: 'superannuation',    label: 'Super'       },
  { key: 'investments',       label: 'Investments' },
  { key: 'assets_liabilities',label: 'Assets'      },
  { key: 'income_expenses',   label: 'Income'      },
  { key: 'insurance',         label: 'Insurance'   },
  { key: 'super_tax',         label: 'Super & Tax' },
  { key: 'advice_reason',     label: 'Goals'       },
  { key: 'risk_profile',      label: 'Risk'        },
];

function getColor(pct) {
  if (pct === 100) return '#10b981';
  if (pct >= 50)  return '#f59e0b';
  if (pct > 0)   return '#ef4444';
  return '#CBD5E1';
}

export default function ProgressBar({ completionData = {}, onSectionClick }) {
  const overall = Math.round(
    SECTIONS.reduce((a, s) => a + (completionData[s.key] || 0), 0) / SECTIONS.length
  );

  const next = SECTIONS.find(s => (completionData[s.key] || 0) < 100);

  return (
    <div style={{ background: 'var(--ps-surface)', borderBottom: '1px solid var(--ps-border)', padding: '10px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ps-text-primary)', whiteSpace: 'nowrap' }}>Fact find completion</span>
        <div style={{ flex: 1, height: 8, background: 'var(--ps-border)', borderRadius: 4 }}>
          <div style={{ width: `${overall}%`, height: '100%', background: 'linear-gradient(90deg,#4F46E5,#818CF8)', borderRadius: 4, transition: 'width 0.4s ease' }}/>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#4F46E5', whiteSpace: 'nowrap' }}>{overall}%</span>
        {next && (
          <button
            onClick={() => onSectionClick?.(next.key)}
            style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Continue → {next.label}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: '6px 20px', flexWrap: 'wrap', marginTop: 4 }}>
        {SECTIONS.map(s => {
          const pct = completionData[s.key] || 0;
          const col = getColor(pct);
          return (
            <div key={s.key} onClick={() => onSectionClick?.(s.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: onSectionClick ? 'pointer' : 'default' }}>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: col, flexShrink: 0 }}/>
              <span style={{ fontSize: 11, color: 'var(--ps-text-secondary)', fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: 11, color: 'var(--ps-text-subtle)' }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
