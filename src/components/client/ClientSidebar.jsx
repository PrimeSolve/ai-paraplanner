import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { useRole } from '../RoleContext';
import { 
  Home, 
  FileText, 
  MessageSquare, 
  FileCheck, 
  Settings, 
  Sparkles
} from 'lucide-react';

export default function ClientSidebar({ currentPage }) {
  const [adviser, setAdviser] = useState(null);
  const [adviceGroup, setAdviceGroup] = useState(null);
  const [businessDetails, setBusinessDetails] = useState(null);
  const [logo, setLogo] = useState(null);
  const { originalUser } = useRole();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();
        
        // Find the client record for this user
        const clients = await base44.entities.Client.filter({ user_email: userData.email });
        if (clients.length > 0) {
          const clientData = clients[0];

          // Load adviser info
          if (clientData.adviser_email) {
            const advisers = await base44.entities.Adviser.filter({ email: clientData.adviser_email });
            if (advisers.length > 0) {
              setAdviser(advisers[0]);
            }
          }

          // Load advice group info
          if (clientData.advice_group_id) {
            const groups = await base44.entities.AdviceGroup.filter({ id: clientData.advice_group_id });
            if (groups.length > 0) {
              setAdviceGroup(groups[0]);
              if (groups[0]?.logo_url) {
                setLogo(groups[0].logo_url);
              }
            }
          }
        }

        // Get business details from localStorage (for admin viewing)
        const details = localStorage.getItem('businessDetails');
        if (details) {
          const parsed = JSON.parse(details);
          setBusinessDetails(parsed);
          if (parsed?.logo_url && !logo) {
            setLogo(parsed.logo_url);
          }
        }
      } catch (error) {
        console.error('Error loading client data:', error);
      }
    };
    loadData();
  }, [logo]);

  const navItems = [
    { path: 'ClientDashboard', label: 'Dashboard', icon: Home },
    { path: 'FactFindWelcome', label: 'My Fact Find', icon: FileText },
    { path: 'ClientDocuments', label: 'Documents', icon: FileCheck },
    { path: 'ClientMessages', label: 'Messages', icon: MessageSquare, badge: 3 },
  ];

  const getCompanyName = () => {
    if (originalUser?.role === 'admin') {
      return businessDetails?.company_name || 'AI Paraplanner';
    }
    return adviceGroup?.name || 'Advice Group';
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="w-[260px] bg-[#0f172a] fixed top-0 left-0 bottom-0 flex flex-col z-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Logo Header */}
      <div className="h-16 px-6 flex items-center border-b border-white/[0.08]">
        <div className="flex items-center gap-3 text-white no-underline">
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
              VIEW AS CLIENT
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 overflow-y-auto">
        <div className="mb-7">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.path;
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
                {item.badge && (
                  <span className="ml-auto bg-[#f97316] text-white text-[11px] font-bold px-2 py-0.5 rounded-xl">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mb-7 border-t border-white/[0.08] pt-6">
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            ACCOUNT
          </div>
          <Link
            to={createPageUrl('ClientSettings')}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium no-underline transition-all mb-1 relative ${
              currentPage === 'ClientSettings'
                ? 'bg-white/10 text-white'
                : 'text-[#94a3b8] hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            {currentPage === 'ClientSettings' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-white rounded-r-md" />
            )}
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      {/* AI Assistant Button */}
      <div className="p-4">
        <Link to={createPageUrl('ClientHelp')} className="no-underline">
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