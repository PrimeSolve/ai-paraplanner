import React from 'react';
import SidebarLayout from '../navigation/SidebarLayout';
import {
  LayoutDashboard,
  Layers,
  Users,
  Settings,
} from 'lucide-react';

export default function AdviceGroupSidebar({ currentPage }) {
  const navSections = [
    { label: 'OVERVIEW', items: [
      { label: 'Dashboard', path: 'AdviceGroupDashboard', icon: LayoutDashboard },
      { label: 'SOA Queue', path: 'AdviceGroupSOARequests', icon: Layers }
    ]},
    { label: 'MANAGEMENT', items: [
      { label: 'Advisers', path: 'AdviceGroupAdvisers', icon: Users },
      { label: 'Clients', path: 'AdviceGroupClients', icon: Users }
    ]},
    { label: 'CONFIGURATION', items: [
      { label: 'Risk Profiles', path: 'AdviceGroupRiskProfiles', icon: Settings },
      { label: 'Model Portfolios', path: 'AdviceGroupModelPortfolios', icon: Settings },
      { label: 'SOA Template', path: 'AdviceGroupSOATemplate', icon: Settings },
{ label: 'Settings', path: 'AdviceGroupSettings', icon: Settings }
    ]}
  ];

  const logoContent = (
    <div style={{
      width: '30px', height: '30px',
      background: 'linear-gradient(135deg, #00C9B1, #1E88E5)',
      borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      AI
    </div>
  );

  return (
    <SidebarLayout
      homePath="AdviceGroupDashboard"
      logoContent={logoContent}
      title="AI Paraplanner"
      subtitle={null}
      navSections={navSections}
      helpPath="AdviceGroupHelp"
      helpText="Ask Henry"
      currentPage={currentPage}
      accentColor="#00C9B1"
    />
  );
}
