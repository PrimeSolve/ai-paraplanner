import React from 'react';

const milestones = [
  { age: 'Now', label: 'Current Position', description: 'Fact find data collection', icon: '\u{1F4CD}', color: '#3b82f6' },
  { age: '55', label: 'Preservation Age', description: 'Access to superannuation (conditions)', icon: '\u{1F513}', color: '#8b5cf6' },
  { age: '60', label: 'Super Access', description: 'Tax-free super access if retired', icon: '\u{1F4B0}', color: '#10b981' },
  { age: '65', label: 'Full Access', description: 'Unrestricted super access', icon: '\u{1F3AF}', color: '#f59e0b' },
  { age: '67', label: 'Age Pension Age', description: 'Eligible for Age Pension (if qualified)', icon: '\u{1F3DB}\uFE0F', color: '#6366f1' },
  { age: '75', label: 'NCC Cut-off', description: 'Non-concessional contributions cease', icon: '\u{1F4CB}', color: '#ef4444' },
];

export default function LifeTimeline({ factFind }) {
  return (
    <div style={{ padding: '20px 28px', overflowY: 'auto', flex: 1 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 20, marginTop: 0 }}>Key Life Milestones</h3>
      <div style={{ position: 'relative', paddingLeft: 28 }}>
        <div style={{ position: 'absolute', left: 13, top: 8, bottom: 8, width: 2, background: '#e2e8f0' }} />
        {milestones.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 22, position: 'relative' }}>
            <div style={{
              position: 'absolute', left: -21, top: 4,
              width: 12, height: 12, borderRadius: '50%',
              background: m.color, border: '3px solid #fff',
              boxShadow: `0 0 0 2px ${m.color}40`,
            }} />
            <div style={{ flex: 1, padding: '12px 16px', borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 16 }}>{m.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>Age {m.age}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{m.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
