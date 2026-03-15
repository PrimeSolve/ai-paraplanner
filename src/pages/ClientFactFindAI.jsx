import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFactFind } from '@/components/factfind/useFactFind';
import ProgressBar from '@/components/factfind/ProgressBar';
import FactFindClientDashboard from '@/components/factfind/FactFindClientDashboard';
import LifeTimeline from '@/components/factfind/LifeTimeline';
import FactFindPopup from '@/components/factfind/FactFindPopup';

/**
 * ClientFactFindAI — New client-facing dashboard layout.
 *
 * Step 1: Hardcoded data, no live wiring yet.
 * The layout is: TopNav → ProgressBar → (Dashboard | Milestones) + Co-pilot panel
 * FactFindPopup slides in from the right when a section is clicked.
 */

export default function ClientFactFindAI() {
  const navigate = useNavigate();
  const { factFind, loading, error, clientId } = useFactFind();

  // UI state
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'milestones'
  const [copilotOpen, setCopilotOpen] = useState(true);
  const [factFindOpen, setFactFindOpen] = useState(false);
  const [factFindSection, setFactFindSection] = useState(null);
  const [saved] = useState(true); // hardcoded for now

  // Open the fact find popup to a specific section
  const openSection = (sectionId) => {
    setFactFindSection(sectionId || null);
    setFactFindOpen(true);
  };

  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 16, color: '#666' }}>Loading fact find...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 16, color: '#c00' }}>Error loading fact find: {error}</div>
      </div>
    );
  }

  // Hardcoded client name for now
  const clientName = 'Catherine & Paul Hall';

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F8FAFC' }}>

      {/* ── Top Nav Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 52, flexShrink: 0,
        background: '#fff', borderBottom: '1px solid #E2E8F0',
      }}>
        {/* Left: Back + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: '#6366F1', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            &larr; Back to Client
          </button>
          <div style={{ width: 1, height: 24, background: '#E2E8F0' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>Client Fact Find</span>
          <span style={{ fontSize: 14, color: '#64748B' }}>{clientName}</span>
        </div>

        {/* Right: Saved + Copilot toggle + Fact Find button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Saved indicator */}
          <span style={{
            fontSize: 12, color: saved ? '#10B981' : '#F59E0B',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: saved ? '#10B981' : '#F59E0B',
            }} />
            {saved ? 'Saved' : 'Saving...'}
          </span>

          {/* Co-pilot toggle */}
          <button
            onClick={() => setCopilotOpen(prev => !prev)}
            style={{
              padding: '6px 14px', borderRadius: 8,
              border: '1px solid #E2E8F0', background: '#fff',
              fontSize: 12, fontWeight: 600, color: '#475569',
              cursor: 'pointer',
            }}
          >
            {copilotOpen ? '+ Close Co-pilot' : '+ Open Co-pilot'}
          </button>

          {/* Fact Find button */}
          <button
            onClick={() => {
              setFactFindSection(null);
              setFactFindOpen(true);
            }}
            style={{
              padding: '6px 14px', borderRadius: 8,
              background: '#6366F1', border: 'none',
              fontSize: 12, fontWeight: 600, color: '#fff',
              cursor: 'pointer',
            }}
          >
            Fact Find
          </button>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <ProgressBar onSectionClick={openSection} />

      {/* ── Dashboard / Milestones Tab Toggle ── */}
      <div style={{
        display: 'flex', gap: 0,
        padding: '0 24px', background: '#fff',
        borderBottom: '1px solid #E2E8F0', flexShrink: 0,
      }}>
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'milestones', label: 'Milestones' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #6366F1' : '2px solid transparent',
              background: 'transparent',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              color: activeTab === tab.id ? '#6366F1' : '#64748B',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main Content Area ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: Dashboard or Milestones */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'dashboard'
            ? <FactFindClientDashboard onOpenSection={openSection} />
            : <LifeTimeline />
          }
        </div>

        {/* Right: Co-pilot Panel (placeholder for now) */}
        {copilotOpen && (
          <div style={{
            width: 360, flexShrink: 0,
            borderLeft: '1px solid #E2E8F0',
            background: '#F1F5F9',
            paddingTop: 20,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Placeholder co-pilot — will be replaced with <AiParaplanner embedded={true} /> */}
            <div style={{
              margin: '0 16px 16px', padding: '16px 20px',
              background: 'linear-gradient(135deg, #312E81, #4338CA)',
              borderRadius: 12, color: '#fff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>🤖</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Sage</div>
                  <div style={{ fontSize: 10, opacity: 0.8 }}>AI Assistant</div>
                </div>
              </div>
              <span style={{
                display: 'inline-block', padding: '2px 8px',
                borderRadius: 4, background: 'rgba(255,255,255,0.15)',
                fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
              }}>
                FACT FIND
              </span>
            </div>

            {/* Voice button placeholder */}
            <div style={{
              margin: '0 16px 16px', padding: 16,
              background: '#fff', borderRadius: 12,
              border: '1px solid #E2E8F0', textAlign: 'center',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#EEF2FF', margin: '0 auto 8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>🎙️</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>Speak with your adviser assistant</div>
            </div>

            {/* Quick starts placeholder */}
            <div style={{ margin: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Tell me about my super', 'What is my net worth?', 'Help with insurance'].map((qs, i) => (
                <button
                  key={i}
                  style={{
                    padding: '8px 12px', borderRadius: 8,
                    background: '#fff', border: '1px solid #E2E8F0',
                    fontSize: 12, color: '#475569', cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {qs}
                </button>
              ))}
            </div>

            {/* Chat input placeholder */}
            <div style={{ marginTop: 'auto', padding: 16 }}>
              <div style={{
                display: 'flex', gap: 8,
                padding: '8px 12px', borderRadius: 10,
                background: '#fff', border: '1px solid #E2E8F0',
              }}>
                <input
                  type="text"
                  placeholder="Ask Sage anything..."
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    fontSize: 13, color: '#1E293B',
                    background: 'transparent',
                  }}
                />
                <button style={{
                  background: '#6366F1', border: 'none',
                  borderRadius: 6, padding: '4px 12px',
                  color: '#fff', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                }}>Send</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Fact Find Popup ── */}
      <FactFindPopup
        isOpen={factFindOpen}
        onClose={() => setFactFindOpen(false)}
        initialSection={factFindSection}
      />
    </div>
  );
}
