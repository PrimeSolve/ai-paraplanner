import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Target,
  Briefcase,
  Settings,
  ChevronDown,
  User,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function AdviceGroupLayout({ children, currentPage }) {
  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.advice_group_id) {
          const groups = await base44.entities.AdviceGroup.filter({ id: currentUser.advice_group_id });
          setGroup(groups[0]);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  const navItems = [
    { section: 'OVERVIEW', items: [
      { label: 'Dashboard', path: 'AdviceGroupDashboard', icon: LayoutDashboard }
    ]},
    { section: 'TEAM', items: [
      { label: 'Advisers', path: 'AdviceGroupAdvisers', icon: Users },
      { label: 'Clients', path: 'AdviceGroupClients', icon: Users }
    ]},
    { section: 'SOA MANAGEMENT', items: [
      { label: 'SOA Requests', path: 'AdviceGroupSOARequests', icon: FileText }
    ]},
    { section: 'CONFIGURATION', items: [
      { label: 'Risk Profiles', path: 'AdviceGroupRiskProfiles', icon: Target },
      { label: 'Model Portfolios', path: 'AdviceGroupModelPortfolios', icon: Briefcase },
      { label: 'SOA Template', path: 'AdviceGroupSOATemplate', icon: FileText },
      { label: 'Settings', path: 'AdviceGroupSettings', icon: Settings }
    ]}
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-[#0f172a] to-[#1e293b] fixed top-0 left-0 bottom-0 flex flex-col z-50">
        <div className="p-6 border-b border-white/10">
          <Link to={createPageUrl('AdviceGroupDashboard')} className="flex items-center gap-3 text-white no-underline">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center font-bold">
              {group?.name?.charAt(0) || 'AG'}
            </div>
            <div>
              <div className="font-['Fraunces'] text-xl font-semibold">
                {group?.name || 'Advice Group'}
              </div>
              <div className="text-xs text-white/50">Licensee Portal</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((section, idx) => (
            <div key={idx} className="mb-6">
              <div className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                {section.section}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.path;
                return (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    className={`flex items-center gap-3 px-6 py-3 text-white/70 no-underline transition-all border-l-3 ${
                      isActive 
                        ? 'bg-white/10 !text-white border-l-cyan-400' 
                        : 'border-l-transparent hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-400 rounded-full flex items-center justify-center text-slate-900 font-semibold">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">
                {user?.full_name || user?.email}
              </div>
              <div className="text-white/50 text-xs">Group Admin</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {children}
      </div>
    </div>
  );
}