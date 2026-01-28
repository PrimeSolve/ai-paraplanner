import React from 'react';
import { useRole } from './RoleContext';
import { useLocation } from 'react-router-dom';

// Import all sidebars
import AdminSidebar from './admin/AdminSidebar';
import AdviceGroupSidebar from './advicegroup/AdviceGroupSidebar';
import AdviserSidebar from './adviser/AdviserSidebar';

// Import unified header
import AppHeader from './AppHeader';

export default function AppShell({ children }) {
  const { navigationChain, originalUser, user, isViewingAs } = useRole();
  const location = useLocation();

  // Determine current navigation level from the chain
  const currentLevel = navigationChain.length > 0 
    ? navigationChain[navigationChain.length - 1]?.type 
    : null;

  // Get the original user's role (who is actually logged in)
  const originalRole = originalUser?.role || user?.role;

  // Determine which sidebar to render based on navigation chain
  const renderSidebar = () => {
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

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {renderSidebar()}
      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppHeader />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}