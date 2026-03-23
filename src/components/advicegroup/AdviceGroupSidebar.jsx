import React from 'react';
import SidebarLayout from '../navigation/SidebarLayout';
import {
  LayoutDashboard,
  Layers,
  CheckCircle,
  Users,
  Settings,
  CreditCard,
} from 'lucide-react';

export default function AdviceGroupSidebar({ currentPage }) {
  const navSections = [
    { label: 'OVERVIEW', items: [
      { label: 'Dashboard', path: 'AdviceGroupDashboard', icon: LayoutDashboard },
      { label: 'SOA Queue', path: 'AdviceGroupSOARequests', icon: Layers },
      { label: 'Completed SOAs', path: 'AdviceGroupCompleted', icon: CheckCircle }
    ]},
    { label: 'MANAGEMENT', items: [
      { label: 'Advisers', path: 'AdviceGroupAdvisers', icon: Users },
      { label: 'Clients', path: 'AdviceGroupClients', icon: Users }
    ]},
    { label: 'CONFIGURATION', items: [
      { label: 'Risk Profiles', path: 'AdviceGroupRiskProfiles', icon: Settings },
      { label: 'Model Portfolios', path: 'AdviceGroupModelPortfolios', icon: Settings },
      { label: 'SOA Template', path: 'AdviceGroupSOATemplate', icon: Settings },
      { label: 'Billing', path: 'Billing', icon: CreditCard },
      { label: 'Settings', path: 'AdviceGroupSettings', icon: Settings }
    ]}
  ];

  const logoContent = (
    <div className="w-10 h-10 bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] rounded-xl flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-900/30">
      AI
    </div>
  );

  return (
    <SidebarLayout
      homePath="AdviceGroupDashboard"
      logoContent={logoContent}
      title={<>AI <span className="text-[#22d3ee]">Paraplanner</span></>}
      subtitle="ADVICE GROUP"
      navSections={navSections}
      helpPath="AdviceGroupHelp"
      currentPage={currentPage}
      accentColor="#3b82f6"
    />
  );
}
