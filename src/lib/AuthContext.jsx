import React, { createContext, useState, useContext, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { inProgress, accounts } = useMsal();
  const isMsalAuthenticated = useIsAuthenticated();

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({ id: 'primesolve', public_settings: {} });

  useEffect(() => {
    // Wait for MSAL to finish any interaction (redirect handling, etc.)
    if (inProgress !== InteractionStatus.None) {
      return;
    }

    checkAppState();
  }, [inProgress, isMsalAuthenticated]);

  const checkAppState = async () => {
    try {
      setAuthError(null);

      if (isMsalAuthenticated && accounts.length > 0) {
        // User is authenticated via MSAL — fetch user info from PrimeSolve API
        await checkUserAuth();
      } else {
        // Not authenticated
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required',
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred',
      });
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);

      const status = error.response?.status || error.status;
      if (status === 401 || status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required',
        });
      } else if (status === 404) {
        setAuthError({
          type: 'user_not_registered',
          message: 'User not registered for this app',
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
