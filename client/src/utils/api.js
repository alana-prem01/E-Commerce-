// Centralized API helper for all backend calls
// In development mode (npm run dev), points to local server (http://localhost:5000/api)
// In production mode, uses VITE_API_URL for the deployed Render backend.
import { toast } from 'react-toastify';
const getApiBase = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }
  return (import.meta.env.VITE_API_URL || '') + '/api';
};

const API_BASE = getApiBase();

// Get auth token from localStorage
const getToken = () => localStorage.getItem('accessToken');

// Generic fetch wrapper with auth
const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it automatically with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr) {
    const errorMsg = 'Network error: Unable to connect to backend server. Please check your internet connection.';
    toast.error(errorMsg, { toastId: 'network-error' });
    window.dispatchEvent(new CustomEvent('app-network-error', { detail: { message: errorMsg } }));
    throw new Error(errorMsg);
  }

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const textData = await response.text();
    throw new Error(`Server returned a non-JSON response (${response.status}): ` + textData.slice(0, 100));
  }

  if (response.status === 429) {
    const msg = data.message || 'Too many requests. Please wait a moment before trying again.';
    toast.warn(msg, { toastId: 'rate-limit' });
  }

  if (response.status >= 500) {
    const msg = data.message || 'Internal Server Error. Please try again later.';
    window.dispatchEvent(new CustomEvent('app-server-error', { detail: { message: msg } }));
  }

  if (response.status === 401 || (response.status === 403 && data.message?.includes('disabled'))) {
    // Intercept if it's not a signin/login request
    if (!endpoint.includes('/signin') && !endpoint.includes('/login')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('cartItems');
      window.dispatchEvent(new Event('auth-change'));
      
      if (!window._sessionExpiredRedirecting) {
        window._sessionExpiredRedirecting = true;
        const msg = data.message || 'Your session has expired. Please sign in again.';
        toast.error(msg, { autoClose: 1800 });
        setTimeout(() => {
          window._sessionExpiredRedirecting = false;
          window.location.href = '/login';
        }, 1900);
      }
      throw new Error(data.message || 'Session expired. Please login again.');
    }
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Something went wrong');
  }

  return data;
};

// Lightweight in-memory cache for GET requests
const apiCache = new Map();
const CACHE_TTL_MS = 20000; // 20 seconds

const clearProductCache = () => {
  for (const key of apiCache.keys()) {
    if (key.includes('/products')) {
      apiCache.delete(key);
    }
  }
};

// Convenience methods
export const api = {
  get: async (endpoint, useCache = true) => {
    const isProductGet = endpoint.includes('/products');
    if (useCache && isProductGet) {
      const cached = apiCache.get(endpoint);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        return cached.data;
      }
    }
    const data = await apiFetch(endpoint);
    if (isProductGet) {
      apiCache.set(endpoint, { data, timestamp: Date.now() });
    }
    return data;
  },
  post: async (endpoint, body) => {
    if (endpoint.includes('/products')) clearProductCache();
    return apiFetch(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },
  put: async (endpoint, body) => {
    if (endpoint.includes('/products')) clearProductCache();
    return apiFetch(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },
  delete: async (endpoint, body) => {
    if (endpoint.includes('/products')) clearProductCache();
    return apiFetch(endpoint, {
      method: 'DELETE',
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  },
  clearCache: clearProductCache
};

export default api;
