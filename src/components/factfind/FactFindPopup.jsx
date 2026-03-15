import React from 'react';

const sectionMeta = {
  personal: { label: 'Personal Details', icon: '\u{1F464}' },
  dependants: { label: 'Dependants', icon: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}' },
  trusts_companies: { label: 'Trusts & Companies', icon: '\u{1F3E2}' },
  smsf: { label: 'SMSF', icon: '\u{1F3E6}' },
  superannuation: { label: 'Superannuation', icon: '\u{1F4B0}' },
  investments: { label: 'Investments', icon: '\u{1F4C8}' },
  assets_liabilities: { label: 'Assets & Liabilities', icon: '\u{1F3E0}' },
  income_expenses: { label: 'Income & Expenses', icon: '\u{1F4B5}' },
  insurance: { label: 'Insurance', icon: '\u{1F6E1}\uFE0F' },
  super_tax: { label: 'Super & Tax', icon: '\u{1F4CB}' },
  advice_reason: { label: 'Advice Reasons', icon: '\u{1F3AF}' },
  risk_profile: { label: 'Risk Profile', icon: '\u2696\uFE0F' },
};

export default function FactFindPopup({ open, section, factFind, updateFF, onClose }) {
  if (!open || !section) return null;
  const meta = sectionMeta[section] || { label: section, icon: '\u{1F4C4}' };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14,
          width: '90%', maxWidth: 600, maxHeight: '80vh',
          overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          padding: 28,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>{meta.icon}</span>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>{meta.label}</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: '1px solid #e2e8f0', background: '#f8fafc',
              fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b',
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 10px' }}>
            Use the co-pilot on the right to complete the <strong>{meta.label}</strong> section.
            Just describe what you want to add in plain English.
          </p>
          <p style={{ margin: 0, padding: '10px 14px', background: '#f1f5f9', borderRadius: 8, fontSize: 12 }}>
            Tip: Try saying something like "Add a super fund with AustralianSuper, balance $150,000" in the co-pilot chat.
          </p>
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', borderRadius: 7, border: 'none',
              background: '#4F46E5', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
