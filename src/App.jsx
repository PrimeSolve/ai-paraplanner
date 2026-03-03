import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { RoleProvider, useRole } from '@/components/RoleContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PublicHome from '@/pages/PublicHome';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Role-based home redirect: sends users to the correct dashboard based on their role
const RoleBasedHome = () => {
  const { user } = useRole();
  const { user: authUser } = useAuth();

  // Determine effective role (same logic as AppShell)
  const effectiveRole = (() => {
    const role = user?.role;
    if (role && role !== 'user') return role;
    if (user?.linkedEntity?.type) return user.linkedEntity.type;
    if (user?.entityType) return user.entityType;
    return role;
  })();

  console.log('[RoleBasedHome] Auth user from API:', authUser);
  console.log('[RoleBasedHome] Auth user role from API:', authUser?.role);
  console.log('[RoleBasedHome] Role context user:', user);
  console.log('[RoleBasedHome] Effective role:', effectiveRole);

  // If role context hasn't loaded yet, show loading spinner
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  switch (effectiveRole) {
    case 'admin':
      return <Navigate to="/AdminDashboard" replace />;
    case 'advice_group':
      return <Navigate to="/AdviceGroupDashboard" replace />;
    case 'adviser':
      return <Navigate to="/AdviserDashboard" replace />;
    case 'client':
      return <Navigate to="/ClientDashboard" replace />;
    default:
      console.warn('[RoleBasedHome] Unrecognized role, defaulting to AdminAdviceGroups:', effectiveRole);
      return <Navigate to="/AdminAdviceGroups" replace />;
  }
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return (
        <Routes>
          <Route path="*" element={<PublicHome />} />
        </Routes>
      );
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <RoleBasedHome />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <RoleProvider>
            <NavigationTracker />
            <AuthenticatedApp />
          </RoleProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
