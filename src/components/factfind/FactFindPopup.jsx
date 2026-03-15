import React, { useState } from 'react';

// Section definitions for the grid view
const SECTIONS = [
  { id: 'principals',         label: 'Personal Details', icon: '👤', color: '#6366F1' },
  { id: 'dependants',         label: 'Dependants',       icon: '👶', color: '#8B5CF6' },
  { id: 'trusts_companies',   label: 'Trusts & Companies', icon: '🏢', color: '#A855F7' },
  { id: 'smsf',               label: 'SMSF',             icon: '🏦', color: '#C084FC' },
  { id: 'superannuation',     label: 'Superannuation',   icon: '💎', color: '#06B6D4' },
  { id: 'investments',        label: 'Investments',      icon: '📊', color: '#3B82F6' },
  { id: 'assets',             label: 'Assets',           icon: '🏠', color: '#10B981' },
  { id: 'liabilities',        label: 'Liabilities',      icon: '💳', color: '#EF4444' },
  { id: 'income',             label: 'Income',           icon: '💰', color: '#22C55E' },
  { id: 'expenses',           label: 'Expenses',         icon: '🛒', color: '#F97316' },
  { id: 'goals',              label: 'Goals',            icon: '🎯', color: '#EC4899' },
  { id: 'risk-profile',       label: 'Risk Profile',     icon: '📈', color: '#F59E0B' },
  { id: 'insurance-policies', label: 'Insurance',        icon: '🛡️', color: '#14B8A6' },
  { id: 'assumptions',        label: 'Assumptions',      icon: '⚙️', color: '#64748B' },
];

export default function FactFindPopup({ isOpen, onClose, initialSection }) {
  const [activeSection, setActiveSection] = useState(initialSection || null);
  const [mode, setMode] = useState('manual'); // 'manual' | 'ai'

  // Reset to grid or go to specific section when opened with a section
  React.useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection || null);
    }
  }, [isOpen, initialSection]);

  if (!isOpen) return null;

  const currentSection = SECTIONS.find(s => s.id === activeSection);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 999,
        }}
      />

      {/* Slide-out panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 720, maxWidth: '90vw',
        background: '#fff', zIndex: 1000,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
        animation: 'slideIn 0.25s ease-out',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid #E2E8F0',
          background: '#F8FAFC', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {activeSection && (
              <button
                onClick={() => setActiveSection(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 18, color: '#64748B', padding: 0,
                }}
              >
                &larr;
              </button>
            )}
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
              {currentSection ? currentSection.label : 'Fact Find'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Manual / AI toggle */}
            {activeSection && (
              <div style={{ display: 'flex', gap: 2, background: '#F1F5F9', borderRadius: 8, padding: 2 }}>
                {['manual', 'ai'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      padding: '4px 12px', borderRadius: 6, border: 'none',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: mode === m ? '#fff' : 'transparent',
                      color: mode === m ? '#6366F1' : '#64748B',
                      boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    {m === 'manual' ? 'Manual' : 'AI'}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 20, color: '#94A3B8', padding: 0,
              }}
            >
              &times;
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {!activeSection ? (
            /* Section Grid */
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }}>
              {SECTIONS.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 8,
                    padding: '20px 12px', borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    background: '#fff', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = sec.color;
                    e.currentTarget.style.background = sec.color + '08';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.background = '#fff';
                  }}
                >
                  <span style={{ fontSize: 28 }}>{sec.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', textAlign: 'center' }}>
                    {sec.label}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* Section Detail — placeholder for now; will render existing form components */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', minHeight: 300,
              color: '#94A3B8',
            }}>
              <span style={{ fontSize: 48, marginBottom: 12 }}>{currentSection.icon}</span>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>
                {currentSection.label}
              </div>
              <div style={{ fontSize: 13, color: '#94A3B8' }}>
                {mode === 'manual'
                  ? 'Form component will be wired here'
                  : 'AI assistant mode — coming soon'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
