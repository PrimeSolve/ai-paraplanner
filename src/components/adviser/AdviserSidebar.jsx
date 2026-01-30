import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { LayoutDashboard, Users, FileText, CheckCircle, Settings, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useRole } from '../RoleContext';
import { UserCheck, UsersRound, Database } from 'lucide-react';

export default function AdviserSidebar({ currentPage, loggedInUser }) {
  const [adviser, setAdviser] = useState(null);
  const [logo, setLogo] = useState(null);
  const [businessDetails, setBusinessDetails] = useState(null);
  const { switchedToId, navigationChain, originalUser } = useRole();

  useEffect(() => {
    const loadAdviserAndLogo = async () => {
      try {
        let logoUrl = null;
        
        // Determine whose logo to show based on originalUser
        if (originalUser?.role === 'admin') {
          const details = localStorage.getItem('businessDetails');
          if (details) {
            const parsed = JSON.parse(details);
            setBusinessDetails(parsed);
            if (parsed?.logo_url) {
              logoUrl = parsed.logo_url;
            }
          }
        } else if (switchedToId) {
          // If viewing as adviser, get their details
          const adviserData = await base44.entities.Adviser.list();
          const selectedAdviser = adviserData.find(a => a.id === switchedToId);
          setAdviser(selectedAdviser);
          setBusinessDetails(selectedAdviser);

          if (selectedAdviser?.advice_group_id) {
            const groups = await base44.entities.AdviceGroup.filter({ id: selectedAdviser.advice_group_id });
            if (groups?.[0]?.logo_url) {
              logoUrl = groups[0].logo_url;
            }
          }
        } else if (originalUser?.role === 'adviser') {
          // If logged in as adviser
          const advisers = await base44.entities.Adviser.filter({ user_id: originalUser.id });
          if (advisers.length > 0) {
            setAdviser(advisers[0]);
            setBusinessDetails(advisers[0]);
            
            if (advisers[0]?.advice_group_id) {
              const groups = await base44.entities.AdviceGroup.filter({ id: advisers[0].advice_group_id });
              if (groups?.[0]?.logo_url) {
                logoUrl = groups[0].logo_url;
              }
            }
          }
        }
        
        if (logoUrl) setLogo(logoUrl);
      } catch (error) {
        console.error('Failed to load adviser:', error);
      }
    };
    loadAdviserAndLogo();
  }, [switchedToId, originalUser]);

  const getCompanyName = () => {
    if (originalUser?.role === 'admin') {
      return businessDetails?.company_name || 'AI Paraplanner';
    }
    return businessDetails?.company || adviser?.company || 'Adviser';
  };

  const getSubtitle = () => {
    if (navigationChain.length === 0) {
      return 'ADVISER PORTAL';
    }
    const current = navigationChain[navigationChain.length - 1];
    return `VIEWING ${current.type.replace('_', ' ').toUpperCase()}`;
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: 'AdviserDashboard', id: 'dashboard' },
    { label: 'Clients', icon: Users, path: 'AdviserClients', id: 'clients' },
    { label: 'SOA Queue', icon: FileText, path: 'AdviserSOARequests', id: 'soa-requests' },
    { label: 'Completed SOAs', icon: CheckCircle, path: 'AdviserCompletions', id: 'completed' }
  ];

  const accountItems = [
    { label: 'Settings', icon: Settings, path: 'AdviserSettings', id: 'settings' }
  ];

  return (
    <div className="w-[260px] bg-[#0f172a] fixed top-0 left-0 bottom-0 flex flex-col z-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
      `}</style>
      {/* Logo */}
      <div className="h-16 px-6 flex items-center border-b border-white/[0.08]">
        <Link to={createPageUrl('AdviserDashboard')} className="flex items-center gap-3 text-white no-underline">
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

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 overflow-y-auto">
        <div className="mb-7">
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            NAVIGATION
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <Link
                key={item.path}
                to={createPageUrl(item.path)}
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
              </Link>
            );
          })}
        </div>

        <div className="mb-7 border-t border-white/[0.08] pt-6">
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            ACCOUNT
          </div>
          {accountItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <Link
                key={item.path}
                to={createPageUrl(item.path)}
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
              </Link>
            );
          })}
        </div>
      </nav>

      {/* AI Assistant Button */}
      <div className="p-4">
        <Link to={createPageUrl('AdviserHelp')} className="no-underline">
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