import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut, LayoutDashboard, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const navLinks = user ? [
    { name: 'Admin Panel', path: 'AdminDashboard', icon: Settings, roles: ['admin'] },
    { name: 'SOA Management', path: 'SOAManagement', icon: FileText, roles: ['admin'] },
    { name: 'SOA Request', path: 'SOARequestWelcome', icon: FileText, roles: ['admin', 'user'] },
  ] : [];

  const filteredLinks = navLinks.filter(link => 
    !link.roles || link.roles.includes(user?.role)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <style>{`
        :root {
          --primary: #1e293b;
          --primary-light: #334155;
          --accent: #f59e0b;
          --accent-dark: #d97706;
        }
      `}</style>
      
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-600 rounded-lg flex items-center justify-center">
                <span className="text-amber-400 font-bold text-xl">AI</span>
              </div>
              <span className="text-xl font-bold text-slate-800 hidden sm:block">AI Paraplanner</span>
            </Link>

            {/* Desktop Navigation */}
            {user && (
              <div className="hidden md:flex items-center space-x-1">
                {filteredLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={createPageUrl(link.path)}
                      className={cn(
                        "px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200",
                        currentPageName === link.path
                          ? "bg-slate-800 text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* User Menu */}
            {user ? (
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                  <User className="w-4 h-4 text-slate-600" />
                  <div className="text-sm">
                    <p className="font-medium text-slate-800">{user.full_name || user.email}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-600 hover:text-slate-800"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => base44.auth.redirectToLogin()}
                className="bg-slate-800 hover:bg-slate-700 text-white"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Button */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {user && mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              {filteredLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={createPageUrl(link.path)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                      currentPageName === link.path
                        ? "bg-slate-800 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.name}</span>
                  </Link>
                );
              })}
              <div className="pt-3 mt-3 border-t border-slate-200">
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{user.full_name || user.email}</p>
                      <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-slate-600"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
}