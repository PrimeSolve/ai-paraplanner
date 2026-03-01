import axios from 'axios';
import { getAccessToken, loginRedirect } from '@/auth/msalInstance';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to acquire token for request:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expired or invalid - redirect to login
      console.warn('401 Unauthorized - redirecting to login');
      await loginRedirect(window.location.href);
      return Promise.reject(error);
    }

    if (status === 403) {
      console.error('403 Forbidden - insufficient permissions');
      return Promise.reject(error);
    }

    if (status === 429) {
      console.warn('429 Too Many Requests - rate limited');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
