import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, 
  Layers, 
  CheckCircle, 
  Users, 
  Settings,
  Sparkles,
} from 'lucide-react';

export default function AdviceGroupSidebar({ currentPage }) {

  const navItems = [
    { section: 'OVERVIEW', items: [
      { label: 'Dashboard', path: 'AdviceGroupDashboard', icon: LayoutDashboard },
      { label: 'SOA Queue', path: 'AdviceGroupSOARequests', icon: Layers },
      { label: 'Completed SOAs', path: 'AdviceGroupCompleted', icon: CheckCircle }
    ]},
    { section: 'MANAGEMENT', items: [
      { label: 'Advisers', path: 'AdviceGroupAdvisers', icon: Users },
      { label: 'Clients', path: 'AdviceGroupClients', icon: Users }
    ]},
    { section: 'CONFIGURATION', items: [
      { label: 'Risk Profiles', path: 'AdviceGroupRiskProfiles', icon: Settings },
      { label: 'Model Portfolios', path: 'AdviceGroupModelPortfolios', icon: Settings },
      { label: 'SOA Template', path: 'AdviceGroupSOATemplate', icon: Settings },
      { label: 'Settings', path: 'AdviceGroupSettings', icon: Settings }
    ]}
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="w-[260px] bg-[#0f172a] fixed top-0 left-0 bottom-0 flex flex-col z-50">
        <div className="p-6 border-b border-white/[0.08]">
          <Link to={createPageUrl('AdviceGroupDashboard')} className="flex items-center gap-3 text-white no-underline">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] rounded-xl flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-900/30">
              AI
            </div>
            <div>
              <div className="font-['Playfair_Display'] text-xl font-semibold">
                AI <span className="text-[#22d3ee]">Paraplanner</span>
              </div>
              <div className="text-[#64748b] text-xs font-medium uppercase tracking-wider">
                ADVICE GROUP
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-4 overflow-y-auto">
          {navItems.map((section, idx) => (
            <div key={idx} className="mb-7">
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                {section.section}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.path;
                return (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium no-underline transition-all mb-1 relative ${
                      isActive 
                        ? 'bg-[#3b82f6]/15 text-white' 
                        : 'text-[#94a3b8] hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#3b82f6] rounded-r-md" />
                    )}
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4">
          <Link to={createPageUrl('AdviceGroupHelp')} className="no-underline">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl text-white shadow-lg transition-all">
              <Sparkles className="w-5 h-5" />
              <div className="text-left">
                <div className="text-sm font-semibold">AI Assistant</div>
                <div className="text-xs opacity-80">Ask for help</div>
              </div>
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}