// Legacy app-params module — replaced by environment variables.
// Retained for backward compatibility with any imports that reference it.

export const appParams = {
  appId: import.meta.env.VITE_ENTRA_CLIENT_ID || '',
  token: null,
  fromUrl: typeof window !== 'undefined' ? window.location.href : '',
  functionsVersion: 'v1',
  appBaseUrl: import.meta.env.VITE_API_URL || '',
};
