import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, 
  Users,
  FileText,
  CheckSquare,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function AdviserLayout({ children, currentPage }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  const navItems = [
    { section: 'OVERVIEW', items: [
      { label: 'Dashboard', path: 'AdviserDashboard', icon: LayoutDashboard },
      { label: 'Clients', path: 'AdviserClients', icon: Users },
      { label: 'Fact Finds', path: 'AdviserFactFinds', icon: FileText },
      { label: 'SOA Requests', path: 'AdviserSOARequests', icon: CheckSquare }
    ]},
    { section: 'SETTINGS', items: [
      { label: 'Settings', path: 'AdviserSettings', icon: Settings }
    ]}
  ];

  return (
    <div className="flex min-h-screen font-['DM_Sans']">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Sidebar */}
      <div className="w-[260px] bg-[#0f172a] fixed top-0 left-0 bottom-0 flex flex-col z-50">
        <div className="p-6 border-b border-white/[0.08]">
          <Link to={createPageUrl('AdviserDashboard')} className="flex items-center gap-3 text-white no-underline">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] rounded-xl flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-900/30">
              AI
            </div>
            <div>
              <div className="font-['Playfair_Display'] text-xl font-semibold">
                AI <span className="text-[#22d3ee]">Paraplanner</span>
              </div>
              <div className="text-[#64748b] text-xs font-medium uppercase tracking-wider">
                ADVISER
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

        <div className="p-4 border-t border-white/[0.08]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.05] cursor-pointer transition-all">
                <div className="w-10 h-10 bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm truncate">
                    {user?.full_name || 'User'}
                  </div>
                  <div className="text-[#64748b] text-xs">
                    Adviser
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-[#64748b]" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to={createPageUrl('AdviserProfile')} className="no-underline text-black">
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={createPageUrl('AdviserSettings')} className="no-underline text-black">
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={createPageUrl('AdviserHelp')} className="no-underline text-black">
                  Help & Support
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={async () => {
                  await base44.auth.logout();
                  window.location.href = createPageUrl('SignIn');
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-[260px] bg-[#f8fafc]">
        {children}
      </div>
    </div>
  );
}