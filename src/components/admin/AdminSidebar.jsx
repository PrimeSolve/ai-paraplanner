import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, 
  Layers, 
  CheckCircle, 
  Users, 
  UserCheck, 
  FileText, 
  Settings, 
  UsersRound,
  Sparkles,
  Database
} from 'lucide-react';

export default function AdminSidebar({ currentPage }) {
  const [businessDetails, setBusinessDetails] = useState(null);

  useEffect(() => {
    const loadBusinessDetails = () => {
      const saved = localStorage.getItem('businessDetails');
      if (saved) {
        setBusinessDetails(JSON.parse(saved));
      }
    };
    loadBusinessDetails();

    window.addEventListener('businessDetailsUpdated', loadBusinessDetails);
    return () => {
      window.removeEventListener('businessDetailsUpdated', loadBusinessDetails);
    };
  }, []);

  const navItems = [
    { section: 'OVERVIEW', items: [
      { label: 'Dashboard', path: 'AdminDashboard', icon: LayoutDashboard },
      { label: 'SOA Queue', path: 'AdminQueue', icon: Layers, badge: '12' },
      { label: 'Completed SOAs', path: 'AdminCompleted', icon: CheckCircle }
    ]},
    { section: 'MANAGEMENT', items: [
      { label: 'Advice Groups', path: 'AdminAdviceGroups', icon: Users },
      { label: 'Advisers', path: 'AdminAdvisers', icon: UserCheck },
      { label: 'Clients', path: 'AdminClients', icon: Users }
    ]},
    { section: 'CONFIGURATION', items: [
      { label: 'SOA Template', path: 'AdminTemplate', icon: FileText },
      { label: 'Team', path: 'AdminTeam', icon: UsersRound },
      { label: 'Settings', path: 'AdminSettings', icon: Settings },
      { label: 'Test Setup', path: 'AdminTestSetup', icon: Database }
    ]}
  ];

  return (
    <div className="w-[260px] bg-[#0f172a] fixed top-0 left-0 bottom-0 flex flex-col z-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Logo */}
      <div className="h-16 px-6 flex items-center border-b border-white/[0.08]">
        <Link to={createPageUrl('AdminDashboard')} className="flex items-center gap-3 text-white no-underline">
          <div className="w-10 h-10 bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] rounded-xl flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-900/30 overflow-hidden">
            {businessDetails?.logo_url ? (
              <img src={businessDetails.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              'AI'
            )}
          </div>
          <div>
            <div className="font-['Playfair_Display'] text-xl font-semibold">
              AI <span className="text-[#22d3ee]">Paraplanner</span>
            </div>
            <div className="text-[#64748b] text-xs font-medium">
              Admin portal
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
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
                      ? 'bg-[#6366f1]/15 text-[#6366f1]' 
                      : 'text-[#94a3b8] hover:bg-white/[0.05] hover:text-[#6366f1]'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#6366f1] rounded-r-md" />
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
            })}
          </div>
        ))}
      </nav>

      {/* AI Assistant Button */}
      <div className="p-4">
        <Link to={createPageUrl('AdminHelp')} className="no-underline">
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