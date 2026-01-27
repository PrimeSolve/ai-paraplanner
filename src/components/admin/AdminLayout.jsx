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
  User,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronDown,
  Settings2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function AdminLayout({ children, currentPage }) {
  const [user, setUser] = useState(null);
  const [businessDetails, setBusinessDetails] = useState(null);

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
    
    const loadBusinessDetails = () => {
      const saved = localStorage.getItem('businessDetails');
      if (saved) {
        setBusinessDetails(JSON.parse(saved));
      }
    };
    loadBusinessDetails();

    window.addEventListener('businessDetailsUpdated', loadBusinessDetails);
    window.addEventListener('userProfileUpdated', loadUser);
    return () => {
      window.removeEventListener('businessDetailsUpdated', loadBusinessDetails);
      window.removeEventListener('userProfileUpdated', loadUser);
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
      { label: 'Settings', path: 'AdminSettings', icon: Settings }
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
          <Link to={createPageUrl('AdminDashboard')} className="flex items-center gap-3 text-white no-underline">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] rounded-xl flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-900/30">
              AI
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

        <div className="p-4 border-t border-white/[0.08]">
          <Link to={createPageUrl('AdminSettings')} className="no-underline">
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.05] cursor-pointer transition-all">
              {businessDetails?.logoUrl ? (
                <img src={businessDetails.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {businessDetails?.companyName?.charAt(0) || 'AI'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm truncate">
                  {businessDetails?.companyName || 'AI Paraplanner'}
                </div>
                <div className="text-[#64748b] text-xs capitalize">
                  {businessDetails?.role === 'advice_group' ? 'Advice Group' : businessDetails?.role || 'Admin'}
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-[260px] bg-[#f8fafc]">
        {/* Top User Bar */}
        <div className="bg-white border-b border-[#e2e8f0] px-8 py-1 flex justify-end">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors">
                  {user.profile_image_url ? (
                    <img src={user.profile_image_url} alt="Profile" className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-[#8b5cf6] rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                      {(user.display_name || user.full_name) ? 
                        (user.display_name || user.full_name).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 
                        user.email?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium text-[#0f172a]">{user.display_name || user.full_name || user.email}</span>
                  <ChevronDown className="w-4 h-4 text-[#64748b]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('MyProfile')} className="flex items-center cursor-pointer">
                    <User className="w-4 h-4 mr-3 text-[#64748b]" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="w-4 h-4 mr-3 text-[#64748b]" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => base44.auth.logout()}>
                  <LogOut className="w-4 h-4 mr-3 text-[#64748b]" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}