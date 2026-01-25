import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { 
  LayoutDashboard, 
  FileText, 
  FolderOpen,
  User,
  MessageSquare,
  Settings
} from 'lucide-react';

export default function ClientLayout({ children, currentPage }) {
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
    { label: 'Dashboard', path: 'Home', icon: LayoutDashboard },
    { label: 'My Fact Find', path: 'FactFindWelcome', icon: FileText },
    { label: 'Documents', path: 'ClientDocuments', icon: FolderOpen },
    { label: 'Messages', path: 'ClientMessages', icon: MessageSquare },
    { label: 'Settings', path: 'ClientSettings', icon: Settings }
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-purple-700 to-purple-800 fixed top-0 left-0 bottom-0 flex flex-col z-50">
        <div className="p-6 border-b border-white/10">
          <Link to={createPageUrl('Home')} className="flex items-center gap-3 text-white no-underline">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center font-bold">
              {user?.full_name?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="font-['Fraunces'] text-xl font-semibold">
                Client Portal
              </div>
              <div className="text-xs text-white/70">{user?.full_name || 'Client'}</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.path;
            return (
              <Link
                key={item.path}
                to={createPageUrl(item.path)}
                className={`flex items-center gap-3 px-6 py-3 text-white/70 no-underline transition-all border-l-3 ${
                  isActive 
                    ? 'bg-white/10 !text-white border-l-purple-300' 
                    : 'border-l-transparent hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-300 rounded-full flex items-center justify-center text-purple-900 font-semibold">
              {user?.full_name?.charAt(0) || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">
                {user?.full_name || user?.email}
              </div>
              <div className="text-white/50 text-xs">Client</div>
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