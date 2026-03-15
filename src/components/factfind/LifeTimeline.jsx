import React from 'react';

const milestones = [
  { age: 'Now', label: 'Current Position', description: 'Fact find data collection', icon: '📍', color: '#3b82f6' },
  { age: '55', label: 'Preservation Age', description: 'Access to superannuation (conditions)', icon: '🔓', color: '#8b5cf6' },
  { age: '60', label: 'Super Access', description: 'Tax-free super access if retired', icon: '💰', color: '#10b981' },
  { age: '65', label: 'Full Access', description: 'Unrestricted super access', icon: '🎯', color: '#f59e0b' },
  { age: '67', label: 'Age Pension Age', description: 'Eligible for Age Pension (if qualified)', icon: '🏛️', color: '#6366f1' },
  { age: '75', label: 'NCC Cut-off', description: 'Non-concessional contributions cease', icon: '📋', color: '#ef4444' },
];

export default function LifeTimeline({ factFind }) {
  return (
    <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 24 }}>Key Life Milestones</h3>

      <div style={{ position: 'relative', paddingLeft: 32 }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute',
          left: 15,
          top: 8,
          bottom: 8,
          width: 2,
          background: '#e2e8f0',
        }} />

        {milestones.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 28, position: 'relative' }}>
            {/* Dot on timeline */}
            <div style={{
              position: 'absolute',
              left: -25,
              top: 4,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: m.color,
              border: '3px solid #fff',
              boxShadow: `0 0 0 2px ${m.color}40`,
            }} />

            <div style={{
              flex: 1,
              padding: '14px 18px',
              borderRadius: 10,
              background: '#fff',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>Age {m.age}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{m.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
