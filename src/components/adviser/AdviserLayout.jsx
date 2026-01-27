import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  FolderOpen,
  Calendar,
  BarChart3,
  Settings
} from 'lucide-react';

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
    { label: 'Dashboard', path: 'AdviserDashboard', icon: LayoutDashboard },
    { label: 'Clients', path: 'AdviserClients', icon: Users },
    { label: 'SOA Requests', path: 'AdviserSOARequests', icon: FileText },
    { label: 'Documents', path: 'AdviserDocuments', icon: FolderOpen },
    { label: 'Settings', path: 'AdviserSettings', icon: Settings }
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-teal-700 to-teal-800 fixed top-0 left-0 bottom-0 flex flex-col z-50">
        <div className="p-6 border-b border-white/10">
          <Link to={createPageUrl('AdviserDashboard')} className="flex items-center gap-3 text-white no-underline">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center font-bold">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div>
              <div className="font-['Fraunces'] text-xl font-semibold">
                Adviser Portal
              </div>
              <div className="text-xs text-white/70">{user?.full_name || 'Adviser'}</div>
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
                        ? 'bg-white/10 !text-white border-l-teal-300' 
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
            <div className="w-10 h-10 bg-teal-300 rounded-full flex items-center justify-center text-teal-900 font-semibold">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">
                {user?.full_name || user?.email}
              </div>
              <div className="text-white/50 text-xs">Adviser</div>
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