import React, { useState } from 'react';

const FACT_FIND_SECTIONS = [
  { id: 'personal',         icon: '👤', label: 'Personal Details',    desc: 'Names, contact, employment, health & estate',  color: '#4F46E5' },
  { id: 'dependants',       icon: '👥', label: 'Dependants',          desc: 'Children & adult dependants',                 color: '#EC4899' },
  { id: 'trusts_companies', icon: '🏛️', label: 'Trusts & Companies',  desc: 'Trusts, Pty Ltd entities, shareholders',      color: '#D97706' },
  { id: 'smsf',             icon: '🔒', label: 'SMSF',                desc: 'Self-managed super fund accounts',            color: '#6366F1' },
  { id: 'superannuation',   icon: '🏦', label: 'Superannuation',      desc: 'Super funds, pensions & annuities',           color: '#0891B2' },
  { id: 'investments',      icon: '📊', label: 'Investments',         desc: 'Wraps, master trusts, investment bonds',      color: '#059669' },
  { id: 'assets_liabilities',icon:'🏠', label: 'Assets & Liabilities',desc: 'Property, vehicles, loans, mortgages',        color: '#0891B2' },
  { id: 'income_expenses',  icon: '💵', label: 'Income & Expenses',   desc: 'Salary, benefits, living expenses',           color: '#059669' },
  { id: 'advice_reason',    icon: '🎯', label: 'Goals & Objectives',  desc: 'Advice reasons, objectives & retirement',     color: '#DB2777' },
  { id: 'risk_profile',     icon: '📋', label: 'Risk Profile',        desc: 'Risk questionnaire, attitude to investing',   color: '#9333EA' },
  { id: 'insurance',        icon: '🛡️', label: 'Insurance Policies',  desc: 'Life, TPD, Trauma, IP policies',              color: '#7C3AED' },
  { id: 'super_tax',        icon: '⚙️', label: 'Super & Tax',         desc: 'Contribution caps, bring-forward, TBC',       color: '#64748B' },
];

const FACT_FIND_GROUPS = [
  { label: 'People',            ids: ['personal', 'dependants'] },
  { label: 'Entities',          ids: ['trusts_companies', 'smsf'] },
  { label: 'Products',          ids: ['superannuation', 'investments'] },
  { label: 'Capital',           ids: ['assets_liabilities'] },
  { label: 'Cashflow',          ids: ['income_expenses'] },
  { label: 'Goals & Risk',      ids: ['advice_reason', 'risk_profile'] },
  { label: 'Wealth Protection', ids: ['insurance'] },
  { label: 'Planning',          ids: ['super_tax'] },
];

export default function FactFindPopup({ section: initialSection, onClose }) {
  const [section, setSection] = useState(initialSection || null);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)' }} />

      {/* Panel */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: section ? '65vw' : 420,
        background: 'white',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.15)',
        display: 'flex',
        transition: 'width 0.2s ease',
        borderLeft: '1px solid #E2E8F0',
      }}>
        {/* Left nav */}
        <div style={{ width: section ? 280 : '100%', borderRight: section ? '1px solid #E2E8F0' : 'none', overflowY: 'auto', background: '#F8FAFC', flexShrink: 0 }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>📋</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Fact Find</span>
            </div>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontSize: 14, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* Section list */}
          <div style={{ padding: section ? '10px 8px' : '14px 16px' }}>
            {FACT_FIND_GROUPS.map((group, gi) => (
              <div key={gi} style={{ marginBottom: section ? 8 : 14 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: section ? 3 : 6, padding: section ? '0 6px' : 0 }}>{group.label}</div>
                {section ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {group.ids.map(id => {
                      const s = FACT_FIND_SECTIONS.find(x => x.id === id);
                      const isActive = section === id;
                      return (
                        <button key={id} onClick={() => setSection(id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: isActive ? '#EEF2FF' : 'transparent', textAlign: 'left' }}>
                          <span style={{ fontSize: 13, width: 20, textAlign: 'center' }}>{s.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? '#4F46E5' : '#475569' }}>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {group.ids.map(id => {
                      const s = FACT_FIND_SECTIONS.find(x => x.id === id);
                      return (
                        <button key={id} onClick={() => setSection(id)}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.background = s.color + '08'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = 'white'; }}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '12px 8px', borderRadius: 10, border: '1px solid #E2E8F0', cursor: 'pointer', background: 'white', transition: 'all 0.15s ease' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 9, background: s.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#1E293B', textAlign: 'center', lineHeight: 1.3 }}>{s.label}</span>
                          <span style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', lineHeight: 1.3 }}>{s.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: form content */}
        {section && (
          <div style={{ flex: 1, overflowY: 'auto', background: 'white' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8, position: 'sticky', top: 0, background: 'white', zIndex: 5 }}>
              <button onClick={() => setSection(null)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: 13, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <span style={{ fontSize: 15 }}>{FACT_FIND_SECTIONS.find(x => x.id === section)?.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{FACT_FIND_SECTIONS.find(x => x.id === section)?.label}</span>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <div style={{ padding: 32, textAlign: 'center', background: '#F8FAFC', borderRadius: 10, border: '1px dashed #E2E8F0' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{FACT_FIND_SECTIONS.find(x => x.id === section)?.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 6 }}>{FACT_FIND_SECTIONS.find(x => x.id === section)?.label}</div>
                <div style={{ fontSize: 13, color: '#94A3B8' }}>This section renders the existing fact find form component.<br />Wire it up by importing the section component here.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
