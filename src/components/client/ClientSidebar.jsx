import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { 
  Home, 
  FileText, 
  MessageSquare, 
  FileCheck, 
  Settings, 
  HelpCircle,
  User
} from 'lucide-react';

export default function ClientSidebar({ currentPage }) {
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [adviser, setAdviser] = useState(null);
  const [adviceGroup, setAdviceGroup] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        // Find the client record for this user
        const clients = await base44.entities.Client.filter({ user_email: userData.email });
        if (clients.length > 0) {
          const clientData = clients[0];
          setClient(clientData);

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
            }
          }
        }
      } catch (error) {
        console.error('Error loading client data:', error);
      }
    };
    loadData();
  }, []);

  const navItems = [
    { path: 'ClientDashboard', label: 'Dashboard', icon: Home },
    { path: 'FactFindWelcome', label: 'My Fact Find', icon: FileText },
    { path: 'ClientDocuments', label: 'History', icon: FileCheck },
    { path: 'ClientMessages', label: 'Messages', icon: MessageSquare, badge: 3 },
  ];

  const getInitials = (name) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="w-72 bg-[#0f172a] flex flex-col fixed left-0 top-0 bottom-0 z-50">
      {/* Adviser Info Header */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
          {adviser ? getInitials(`${adviser.first_name} ${adviser.last_name}`) : 'SH'}
        </div>
        <div>
          <div className="text-white font-semibold">
            {adviser?.company || 'ABS Wealth'}
          </div>
          <div className="text-slate-400 text-sm">
            Adviser: {adviser ? `${adviser.first_name} ${adviser.last_name}` : 'Stephen Hawke'}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.path;
          return (
            <Link
              key={item.path}
              to={createPageUrl(item.path)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all mb-1 relative",
                isActive
                  ? "bg-blue-600/15 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r-md" />
              )}
              <Icon className="w-5 h-5" />
              {item.label}
              {item.badge && (
                <span className="ml-auto bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="h-px bg-white/10 mx-3 my-4" />

        <Link
          to={createPageUrl('ClientSettings')}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all relative",
            currentPage === 'ClientSettings'
              ? "bg-blue-600/15 text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          )}
        >
          {currentPage === 'ClientSettings' && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-600 rounded-r-md" />
          )}
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </nav>

      {/* Help & Support Button */}
      <div className="p-4 border-t border-white/10">
        <Link to={createPageUrl('ClientHelp')}>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg text-white font-semibold transition-all hover:shadow-lg">
            <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
              <span className="text-sm">✨</span>
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold">Help & Support</div>
              <div className="text-xs opacity-80">Chat with AI</div>
            </div>
          </button>
        </Link>
      </div>
    </div>
  );
}