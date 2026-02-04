import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { useRole } from '../RoleContext';
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
  Settings2,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function AdminLayout({ children, currentPage, pageActions }) {
  const { navigationChain } = useRole();
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

  const getSubtitle = () => {
    if (navigationChain.length === 0) {
      return 'ADMIN PORTAL';
    }
    const current = navigationChain[navigationChain.length - 1];
    return `VIEWING ${current.type.toUpperCase()}`;
  };

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
    { section: 'SUPPORT', items: [
      { label: 'All Tickets', path: 'AdminTickets', icon: MessageSquare }
    ]},
    { section: 'CONFIGURATION', items: [
      { label: 'Data Manager', path: 'AdminDataManager', icon: Settings2 },
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
              <div className="text-[#64748b] text-xs font-medium uppercase tracking-wider">
                {getSubtitle()}
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
        {/* Top Header Bar */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: '260px',
          right: 0,
          height: '64px',
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          zIndex: 40,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px',
                    }}>
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>
                        {user.full_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {user.email}
                      </div>
                    </div>
                    <ChevronDown style={{ width: '16px', height: '16px', color: '#64748b' }} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => window.location.href = createPageUrl('AdminProfile')}>
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = createPageUrl('AdminSettings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => base44.auth.logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div>
            {pageActions}
          </div>
        </div>
        
        <div style={{ paddingTop: '64px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}