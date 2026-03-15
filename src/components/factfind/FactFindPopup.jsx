import React from 'react';

const sectionMeta = {
  personal: { label: 'Personal Details', icon: '👤' },
  dependants: { label: 'Dependants', icon: '👨‍👩‍👧‍👦' },
  trusts_companies: { label: 'Trusts & Companies', icon: '🏢' },
  smsf: { label: 'SMSF', icon: '🏦' },
  superannuation: { label: 'Superannuation', icon: '💰' },
  investments: { label: 'Investments', icon: '📈' },
  assets_liabilities: { label: 'Assets & Liabilities', icon: '🏠' },
  income_expenses: { label: 'Income & Expenses', icon: '💵' },
  insurance: { label: 'Insurance', icon: '🛡️' },
  super_tax: { label: 'Super & Tax', icon: '📋' },
  advice_reason: { label: 'Advice Reasons', icon: '🎯' },
  risk_profile: { label: 'Risk Profile', icon: '⚖️' },
};

export default function FactFindPopup({ section, onClose }) {
  const meta = sectionMeta[section] || { label: section, icon: '📄' };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '90%',
          maxWidth: 600,
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          padding: 32,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>{meta.icon}</span>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>{meta.label}</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
          <p>
            Use the co-pilot or the form below to complete the <strong>{meta.label}</strong> section.
            You can speak to Sage or fill in the fields manually.
          </p>
          <p style={{ marginTop: 12, padding: '12px 16px', background: '#f1f5f9', borderRadius: 8, fontSize: 13 }}>
            Tip: Click into the Fact Find form on the left and navigate to the "{meta.label}" section to edit fields directly.
          </p>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
