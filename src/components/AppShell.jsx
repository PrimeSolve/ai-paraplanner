import React, { useEffect, useState } from 'react';
import { useRole } from './RoleContext';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

// Import all sidebars
import AdminSidebar from './admin/AdminSidebar';
import AdviceGroupSidebar from './advicegroup/AdviceGroupSidebar';
import AdviserSidebar from './adviser/AdviserSidebar';

// Import unified header
import AppHeader from './AppHeader';

export default function AppShell({ children }) {
  const { navigationChain, originalUser, user, isViewingAs, loadUserData } = useRole();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  // Initialize user on mount
  useEffect(() => {
    const initUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        console.log('AppShell loaded user:', currentUser);
        console.log('User role:', currentUser?.role);
        if (currentUser) {
          loadUserData(currentUser);
          console.log('Called loadUserData');
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };
    initUser();
  }, [loadUserData]);

  // Determine current navigation level from the chain
  const currentLevel = navigationChain.length > 0 
    ? navigationChain[navigationChain.length - 1]?.type 
    : null;

  // Get the original user's role (who is actually logged in)
  const originalRole = originalUser?.role || user?.role;

  // Determine which sidebar to render based on navigation chain
  const renderSidebar = () => {
    // Don't render sidebar for Fact Find pages
    if (location.pathname.includes('FactFind')) {
      return null;
    }

    console.log('renderSidebar called');
    console.log('currentLevel:', currentLevel);
    console.log('originalRole:', originalRole);
    console.log('originalUser email:', originalUser?.email);
    console.log('user email:', user?.email);
    
    // If viewing as a different level, show that level's sidebar
    if (currentLevel === 'adviser') {
      return <AdviserSidebar currentPage={getCurrentPage()} />;
    }
    if (currentLevel === 'advice_group') {
      return <AdviceGroupSidebar currentPage={getCurrentPage()} />;
    }

    // Not viewing as anyone — show sidebar based on actual logged-in role
    if (originalRole === 'admin') {
      return <AdminSidebar currentPage={getCurrentPage()} />;
    }
    if (originalRole === 'advice_group') {
      return <AdviceGroupSidebar currentPage={getCurrentPage()} />;
    }
    if (originalRole === 'adviser') {
      return <AdviserSidebar currentPage={getCurrentPage()} />;
    }

    // Fallback
    console.log('renderSidebar returning null - no role matched');
    return null;
  };

  // Helper to extract current page from URL for sidebar highlighting
  const getCurrentPage = () => {
    const path = location.pathname;
    const pageName = path.split('/').pop() || 'Dashboard';
    return pageName;
  };

  // Check if this is a page that should have no shell (login, public pages, etc.)
  const noShellPages = ['/login', '/register', '/forgot-password', '/public'];
  const shouldShowShell = !noShellPages.some(page => location.pathname.startsWith(page));

  if (!shouldShowShell) {
    return <>{children}</>;
  }

  // Show loading while initializing user
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {renderSidebar()}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: location.pathname.includes('FactFind') ? '0' : '64px', marginLeft: location.pathname.includes('FactFind') ? '0' : '260px' }}>
        {!location.pathname.includes('FactFind') && <AppHeader />}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}