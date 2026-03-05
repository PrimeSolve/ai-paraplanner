import React, { createContext, useContext, useCallback, useMemo } from "react";
import {
  MsalProvider,
  useMsal,
  useIsAuthenticated,
} from "@azure/msal-react";
import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";
import { msalConfig, loginRequest, apiScopes } from "./msalConfig.js";

const msalInstance = new PublicClientApplication(msalConfig);

const AuthContext = createContext(null);

function AuthContextProvider({ children }) {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const user = useMemo(() => {
    if (!accounts || accounts.length === 0) return null;
    const account = accounts[0];
    return {
      name: account.name || "",
      email: account.username || "",
      id: account.localAccountId || "",
    };
  }, [accounts]);

  const getAccessToken = useCallback(async () => {
    if (!accounts || accounts.length === 0) return null;
    try {
      const response = await instance.acquireTokenSilent({
        scopes: apiScopes,
        account: accounts[0],
      });
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const response = await instance.acquireTokenPopup({
          scopes: apiScopes,
          account: accounts[0],
        });
        return response.accessToken;
      }
      throw error;
    }
  }, [instance, accounts]);

  const login = useCallback(() => {
    return instance.loginRedirect(loginRequest);
  }, [instance]);

  const logout = useCallback(() => {
    return instance.logoutRedirect();
  }, [instance]);

  const value = useMemo(
    () => ({ user, isAuthenticated, getAccessToken, login, logout }),
    [user, isAuthenticated, getAccessToken, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthContextProvider>{children}</AuthContextProvider>
    </MsalProvider>
  );
}

export default AuthProvider;
