import React, { useEffect, useState } from 'react';
import { useRole } from './RoleContext';
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from 'react-router-dom';

// Import all sidebars
import AdminSidebar from './admin/AdminSidebar';
import AdviceGroupSidebar from './advicegroup/AdviceGroupSidebar';
import AdviserSidebar from './adviser/AdviserSidebar';
import ClientSidebar from './client/ClientSidebar';

// Import unified header
import AppHeader from './AppHeader';

export default function AppShell({ children, pageActions, pageTitle }) {
  const { navigationChain, originalUser, user, isViewingAs, loadUserData } = useRole();
  const { user: authUser } = useAuth();
  const location = useLocation();
  // If RoleContext already has the user (persisted across navigation), skip loading
  const [loading, setLoading] = useState(() => !user);

  // Initialize user role context from the already-authenticated user
  useEffect(() => {
    // If role context already has user data (persisted from previous navigation), done
    if (user) {
      setLoading(false);
      return;
    }

    // Wait for auth user to be available
    if (!authUser) return;

    let mounted = true;
    (async () => {
      try {
        await loadUserData(authUser);
      } catch (error) {
        console.error('Failed to initialize user role:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authUser, user, loadUserData]);

  // Determine current navigation level from the chain
  const currentLevel = navigationChain.length > 0
    ? navigationChain[navigationChain.length - 1]?.type
    : null;

  // Get the original user's role (who is actually logged in)
  const originalRole = originalUser?.role || user?.role;

  // Determine effective role considering linked entities (for 'user' role users)
  const effectiveRole = (() => {
    if (originalRole && originalRole !== 'user') return originalRole;
    if (user?.linkedEntity?.type) return user.linkedEntity.type;
    return originalRole;
  })();

  // RULE 5: isSpecialLayout is an EXPLICIT whitelist
  const SPECIAL_LAYOUT_ROUTES = [
    '/FactFindWelcome',
    '/FactFindPrefill',
    '/FactFindPersonal',
    '/FactFindAboutYou',
    '/FactFindDependants',
    '/FactFindTrusts',
    '/FactFindSMSF',
    '/FactFindSuperannuation',
    '/FactFindInvestment',
    '/FactFindAssetsLiabilities',
    '/FactFindIncomeExpenses',
    '/FactFindInsurance',
    '/FactFindSuperTax',
    '/FactFindAdviceReason',
    '/FactFindRiskProfile',
    '/FactFindReview',
    '/FactFindDashboard',
    '/FactFindAssistant',
    '/SOARequestWelcome',
    '/SOARequestPrefill',
    '/SOARequestScope',
    '/SOARequestStrategy',
    '/SOARequestProducts',
    '/SOARequestTransactions',
    '/SOARequestInsurance',
    '/SOARequestPortfolio',
    '/SOARequestAssumptions',
    '/SOARequestReview',
    '/SOARequestDetails'
  ];
  const isSpecialLayout = SPECIAL_LAYOUT_ROUTES.some(route => location.pathname.startsWith(route));
  const sidebarWidth = isSpecialLayout ? '320px' : '260px';

  // Helper to extract current page from URL for sidebar highlighting
  const getCurrentPage = () => {
    const path = location.pathname;
    const pageName = path.split('/').pop() || 'Dashboard';
    return pageName;
  };

  // Determine which sidebar to render based on navigation chain and role
  const getSidebarComponent = () => {
    if (isSpecialLayout) {
      return null;
    }

    // Check for test mode entity type
    if (user?.entityType) {
      if (user.entityType === 'advice_group') {
        return <AdviceGroupSidebar currentPage={getCurrentPage()} />;
      }
      if (user.entityType === 'adviser') {
        return <AdviserSidebar currentPage={getCurrentPage()} />;
      }
      if (user.entityType === 'client') {
        return <ClientSidebar currentPage={getCurrentPage()} />;
      }
    }

    // If viewing as a different level, show that level's sidebar
    if (currentLevel === 'client') {
      return <ClientSidebar currentPage={getCurrentPage()} />;
    }
    if (currentLevel === 'adviser') {
      return <AdviserSidebar currentPage={getCurrentPage()} />;
    }
    if (currentLevel === 'advice_group') {
      return <AdviceGroupSidebar currentPage={getCurrentPage()} />;
    }

    // Not viewing as anyone — show sidebar based on effective role
    if (effectiveRole === 'admin') {
      return <AdminSidebar currentPage={getCurrentPage()} />;
    }
    if (effectiveRole === 'advice_group') {
      return <AdviceGroupSidebar currentPage={getCurrentPage()} />;
    }
    if (effectiveRole === 'adviser') {
      return <AdviserSidebar currentPage={getCurrentPage()} />;
    }
    if (effectiveRole === 'client') {
      return <ClientSidebar currentPage={getCurrentPage()} />;
    }

    return null;
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

  // RULE 1: AppShell is the SINGLE source of truth for layout
  const sidebarComponent = getSidebarComponent();
  const showSidebar = sidebarComponent !== null;
  const contentWidth = showSidebar ? `calc(100% - ${sidebarWidth})` : '100%';
  const contentMargin = showSidebar ? sidebarWidth : '0';

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {showSidebar && sidebarComponent}
      <div style={{
        marginLeft: contentMargin,
        width: contentWidth,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        <AppHeader pageActions={pageActions} pageTitle={pageTitle} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
