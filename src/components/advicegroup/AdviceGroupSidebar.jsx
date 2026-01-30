import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutGrid, 
  FileText, 
  CheckCircle, 
  Users, 
  Tag, 
  PlusCircle, 
  Settings,
  Sparkles
} from 'lucide-react';

const colors = {
  sidebar: {
    bg: '#0f172a',
    hover: '#1e293b',
    active: 'rgba(59, 130, 246, 0.15)',
    text: '#94a3b8',
    textActive: '#ffffff',
    accent: '#3b82f6',
  },
  accent: {
    blue: '#3b82f6',
    blueDeep: '#1d4ed8',
    coral: '#f97316',
    pink: '#ec4899',
  }
};

const navConfig = {
  overview: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, badge: null },
    { id: 'soa-requests', label: 'SOA Requests', icon: FileText, badge: '12' },
    { id: 'completed', label: 'Completed SOAs', icon: CheckCircle, badge: null },
  ],
  team: [
    { id: 'advisers', label: 'Advisers', icon: Users, badge: '8' },
  ],
  config: [
    { id: 'template', label: 'SOA Template', icon: FileText, badge: null },
    { id: 'risk-profiles', label: 'Risk Profiles', icon: Tag, badge: null },
    { id: 'portfolios', label: 'Model Portfolios', icon: PlusCircle, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ]
};

const pageMap = {
  'dashboard': 'AdviceGroupDashboard',
  'soa-requests': 'AdviceGroupSOARequests',
  'completed': 'AdviceGroupCompleted',
  'advisers': 'AdviceGroupAdvisers',
  'template': 'AdviceGroupSOATemplate',
  'risk-profiles': 'AdviceGroupRiskProfiles',
  'portfolios': 'AdviceGroupModelPortfolios',
  'settings': 'AdviceGroupSettings',
};

const NavItem = ({ item, isActive }) => {
  const Icon = item.icon;
  return (
    <Link
      to={createPageUrl(pageMap[item.id])}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '10px',
        color: isActive ? '#6366f1' : colors.sidebar.text,
        backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: 500,
        transition: 'all 0.2s ease',
        marginBottom: '4px',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = colors.sidebar.hover;
          e.currentTarget.style.color = '#6366f1';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = colors.sidebar.text;
        }
      }}
    >
      <Icon size={20} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge && (
        <span style={{
          padding: '2px 8px',
          backgroundColor: '#6366f1',
          color: 'white',
          fontSize: '11px',
          fontWeight: 700,
          borderRadius: '10px',
        }}>
          {item.badge}
        </span>
      )}
    </Link>
  );
};

const NavSection = ({ title, items, currentPage }) => (
  <div style={{ marginBottom: '24px' }}>
    {title && (
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: colors.sidebar.text,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        padding: '0 12px',
        marginBottom: '8px',
      }}>
        {title}
      </div>
    )}
    {items.map(item => (
      <NavItem key={item.id} item={item} isActive={currentPage === item.id} />
    ))}
  </div>
);

export default function AdviceGroupSidebar({ currentPage, groupName }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '260px',
      height: '100vh',
      background: colors.sidebar.bg,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div style={{
        height: '64px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            background: `linear-gradient(135deg, ${colors.accent.blue}, ${colors.accent.blueDeep})`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: 'white',
            fontSize: '16px',
          }}>
            AI
          </div>
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: '16px',
              color: 'white',
            }}>
              AI Paraplanner
            </div>
            <div style={{
              fontSize: '12px',
              color: colors.sidebar.text,
            }}>
              {groupName || 'Advice Group Portal'}
            </div>
          </div>
        </div>
      </div>

      <nav style={{
        flex: 1,
        padding: '20px 12px',
        overflowY: 'auto',
      }}>
        <NavSection title="OVERVIEW" items={navConfig.overview} currentPage={currentPage} />
        <NavSection title="TEAM" items={navConfig.team} currentPage={currentPage} />
        <NavSection title="CONFIGURATION" items={navConfig.config} currentPage={currentPage} />
      </nav>

      <div style={{
        padding: '16px',
        borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
      }}>
        <Link
          to={createPageUrl('AdviceGroupHelp')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
            borderRadius: '12px',
            color: 'white',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to right, #4f46e5, #7c3aed)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to right, #6366f1, #8b5cf6)';
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={20} style={{ color: 'white' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: 'white',
              fontWeight: 600,
              fontSize: '14px',
            }}>
              AI Assistant
            </div>
            <div style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '12px',
            }}>
              Ask for help
            </div>
          </div>
          <div style={{
            width: '24px',
            height: '24px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>?</span>
          </div>
        </Link>
      </div>
    </div>
  );
}