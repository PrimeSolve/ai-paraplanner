import { LogLevel } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID || "";
const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID || "";
const apiClientId = import.meta.env.VITE_API_CLIENT_ID || "";
const redirectUri = import.meta.env.VITE_REDIRECT_URI || window.location.origin;

export const msalConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error(message);
      },
      logLevel: LogLevel.Error,
      piiLoggingEnabled: false,
    },
  },
};

export const loginRequest = {
  scopes: [`api://${apiClientId}/access_as_user`],
};

export const apiScopes = [`api://${apiClientId}/access_as_user`];
