import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFactFind } from '@/components/factfind/useFactFind';
import { AiParaplanner } from '@/cashflow/components/advice/index.jsx';
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
  const { factFind, loading, error, updateSection, clientId } = useFactFind();

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

        {/* Right panel — existing co-pilot, embedded mode */}
        {copilotOpen && (
          <div style={{
            width: 360, flexShrink: 0,
            borderLeft: '1px solid #E2E8F0',
            background: '#F1F5F9',
            paddingTop: 20,
          }}>
            <AiParaplanner
              factFind={factFind}
              engineData={null}
              updateAdvice={() => {}}
              summaryMeta={null}
              isOpen={true}
              embedded={true}
              onClose={() => setCopilotOpen(false)}
            />
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
