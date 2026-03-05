import axios from "axios";

let _getAccessToken = null;
let _staticToken = null;

export function setTokenProvider(fn) {
  _getAccessToken = fn;
}

/** Use a static Bearer token (e.g. passed via URL from another app). */
export function setStaticToken(token) {
  _staticToken = token;
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.primesolve.com.au/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Request interceptor — attach Bearer token
apiClient.interceptors.request.use(
  async (config) => {
    // Prefer static token (cross-app navigation) over MSAL provider
    if (_staticToken) {
      config.headers.Authorization = `Bearer ${_staticToken}`;
    } else if (_getAccessToken) {
      try {
        const token = await _getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Token acquisition failed — proceed without token
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401/403/429
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      console.warn("[API] Unauthorized (401) — token may be expired");
    } else if (status === 403) {
      console.warn("[API] Forbidden (403) — insufficient permissions");
    } else if (status === 429) {
      console.warn("[API] Rate limited (429) — too many requests");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
