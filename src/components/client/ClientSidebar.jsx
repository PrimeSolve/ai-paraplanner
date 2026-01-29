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
    { path: 'Home', label: 'My Fact Find', icon: FileText },
    { path: 'ClientDocuments', label: 'Documents', icon: FileCheck },
    { path: 'ClientMessages', label: 'Messages', icon: MessageSquare },
  ];

  const getInitials = (name) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="w-72 bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 bottom-0 z-50">
      {/* User Card */}
      <div className="p-4 mx-4 mt-4 bg-slate-50 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
            {getInitials(user?.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-800 truncate">{user?.full_name || 'Client'}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
        </div>

        {/* Adviser Info */}
        {adviser && (
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                {getInitials(`${adviser.first_name} ${adviser.last_name}`)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Your Adviser</div>
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {adviser.first_name} {adviser.last_name}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.path;
          return (
            <Link
              key={item.path}
              to={createPageUrl(item.path)}
              className={cn(
                "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all border-l-4",
                isActive
                  ? "bg-slate-50 text-slate-900 border-slate-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}

        <div className="h-px bg-slate-200 mx-6 my-4" />

        <Link
          to={createPageUrl('ClientSettings')}
          className={cn(
            "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all border-l-4",
            currentPage === 'ClientSettings'
              ? "bg-slate-50 text-slate-900 border-slate-800"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent"
          )}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </nav>

      {/* Help Link */}
      <div className="p-4 border-t border-slate-200">
        <Link
          to={createPageUrl('ClientHelp')}
          className="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700 transition-all"
        >
          <HelpCircle className="w-5 h-5" />
          Help & Support
        </Link>
      </div>
    </div>
  );
}