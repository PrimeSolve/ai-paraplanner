import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalConfig, loginRequest, tokenRequest } from './msalConfig';

// Singleton MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize the MSAL instance (must be called before use)
let initPromise = null;
export async function initializeMsal() {
  if (!initPromise) {
    initPromise = msalInstance.initialize();
  }
  return initPromise;
}

/**
 * Get an access token silently, or fall back to interactive login.
 */
export async function getAccessToken() {
  await initializeMsal();

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) {
    return null;
  }

  const request = {
    ...tokenRequest,
    account: accounts[0],
  };

  try {
    const response = await msalInstance.acquireTokenSilent(request);
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Token expired or consent needed - redirect to login
      await msalInstance.acquireTokenRedirect(request);
      return null;
    }
    throw error;
  }
}

/**
 * Trigger MSAL login redirect.
 */
export async function loginRedirect(redirectUrl) {
  await initializeMsal();
  const request = {
    ...loginRequest,
  };
  if (redirectUrl) {
    request.state = redirectUrl;
  }
  await msalInstance.loginRedirect(request);
}

/**
 * Trigger MSAL logout redirect.
 */
export async function logoutRedirect(postLogoutUrl) {
  await initializeMsal();
  const logoutRequest = {};
  if (postLogoutUrl) {
    logoutRequest.postLogoutRedirectUri = postLogoutUrl;
  }
  await msalInstance.logoutRedirect(logoutRequest);
}

/**
 * Handle redirect promise (call on app start).
 */
export async function handleRedirectPromise() {
  await initializeMsal();
  return msalInstance.handleRedirectPromise();
}

/**
 * Get the currently active account.
 */
export function getActiveAccount() {
  const accounts = msalInstance.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
}
