import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { useRole } from '../RoleContext';
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
      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium no-underline transition-all mb-1 relative ${
        isActive 
          ? 'bg-white/10 text-white' 
          : 'text-[#94a3b8] hover:bg-white/[0.05] hover:text-white'
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-white rounded-r-md" />
      )}
      <Icon className="w-5 h-5" />
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto bg-[#f97316] text-white text-[11px] font-bold px-2 py-0.5 rounded-xl">
          {item.badge}
        </span>
      )}
    </Link>
  );
};

const NavSection = ({ title, items, currentPage }) => (
  <div className="mb-7">
    {title && (
      <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
        {title}
      </div>
    )}
    {items.map(item => (
      <NavItem key={item.id} item={item} isActive={currentPage === item.id} />
    ))}
  </div>
);

export default function AdviceGroupSidebar({ currentPage, groupName }) {
  const { navigationChain, originalUser } = useRole();
  const [logo, setLogo] = useState(null);
  const [businessDetails, setBusinessDetails] = useState(null);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        // Determine whose logo to show based on originalUser
        let logoUrl = null;
        
        // If original user is admin, use admin's logo from localStorage
        if (originalUser?.role === 'admin') {
          const details = localStorage.getItem('businessDetails');
          if (details) {
            const parsed = JSON.parse(details);
            setBusinessDetails(parsed);
            if (parsed?.logo_url) {
              logoUrl = parsed.logo_url;
            }
          }
        } else {
          // If original user is advice group, use their group's logo
          const user = await base44.auth.me();
          if (user?.advice_group_id) {
            const groups = await base44.entities.AdviceGroup.filter({ id: user.advice_group_id });
            if (groups?.[0]) {
              setBusinessDetails(groups[0]);
              if (groups[0]?.logo_url) {
                logoUrl = groups[0].logo_url;
              }
            }
          }
        }
        
        if (logoUrl) setLogo(logoUrl);
      } catch (error) {
        console.error('Failed to load logo:', error);
      }
    };

    loadLogo();

    const handleUpdate = () => loadLogo();
    window.addEventListener('businessDetailsUpdated', handleUpdate);
    return () => window.removeEventListener('businessDetailsUpdated', handleUpdate);
  }, [originalUser]);

  const getPageId = () => {
    const pageMap = {
      'dashboard': 'dashboard',
      'soa-requests': 'soa-requests',
      'completed': 'completed',
      'advisers': 'advisers',
      'template': 'template',
      'risk-profiles': 'risk-profiles',
      'portfolios': 'portfolios',
      'settings': 'settings',
    };
    
    // Match currentPage with nav item IDs
    for (const [key, value] of Object.entries(pageMap)) {
      if (currentPage === value || currentPage === navConfig.overview.find(i => i.id === key)?.label.toLowerCase().replace(/\s+/g, '-')) {
        return key;
      }
    }
    return currentPage;
  };

  const getCompanyName = () => {
    if (originalUser?.role === 'admin') {
      return businessDetails?.company_name || 'AI Paraplanner';
    }
    return groupName || businessDetails?.name || 'Advice Group Portal';
  };

  const getSubtitle = () => {
    if (navigationChain.length === 0) {
      return 'ADVICE GROUP PORTAL';
    }
    const current = navigationChain[navigationChain.length - 1];
    return `VIEWING ${current.type.replace('_', ' ').toUpperCase()}`;
  };

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
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
        #advice-group-sidebar {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>
      <div id="advice-group-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="h-16 px-6 flex items-center border-b border-white/[0.08]">
        <Link to={createPageUrl('AdviceGroupDashboard')} className="flex items-center gap-3 text-white no-underline">
          <div className="w-10 h-10 bg-[#1e293b] rounded-xl flex items-center justify-center font-bold text-sm shadow-lg overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              'AI'
            )}
          </div>
          <div>
            <div className="text-white text-sm font-bold">
              {getCompanyName()}
            </div>
            <div className="text-[#94a3b8] text-xs font-medium uppercase tracking-wide">
              {getSubtitle()}
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-6 px-4 overflow-y-auto">
        <NavSection title="OVERVIEW" items={navConfig.overview} currentPage={currentPage} />
        <NavSection title="TEAM" items={navConfig.team} currentPage={currentPage} />
        <NavSection title="CONFIGURATION" items={navConfig.config} currentPage={currentPage} />
      </nav>

      <div className="p-4">
        <Link to={createPageUrl('AdviceGroupHelp')} className="no-underline">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#7c3aed] cursor-pointer transition-all shadow-lg shadow-purple-900/30">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm">
                AI Assistant
              </div>
              <div className="text-white/80 text-xs">
                Ask for help
              </div>
            </div>
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">?</span>
            </div>
          </div>
        </Link>
      </div>
      </div>
  );
}