import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/token'];

const formatApiError = (detail: unknown): string => {
  if (!detail) return 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || JSON.stringify(item)).join(', ');
  }
  return 'Something went wrong. Please try again.';
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('curryconnect_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRequest = AUTH_PATHS.some((path) => requestUrl.includes(path));

    if (error.response?.data?.detail) {
      error.message = formatApiError(error.response.data.detail);
    } else if (!error.response) {
      error.message = 'Cannot reach CurryConnect API. Start the backend with: uvicorn backend.main:app --reload';
    }

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('curryconnect_token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export { formatApiError };
export default api;
