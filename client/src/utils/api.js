// Centralized API helper for all backend calls
// In development mode (npm run dev), points to local server (http://localhost:5000/api)
// In production mode, uses VITE_API_URL for the deployed Render backend.
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

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const textData = await response.text();
    // Throw a clear error instead of crashing on JSON parse
    throw new Error(`Server returned a non-JSON response (${response.status}): ` + textData.slice(0, 100));
  }

  if (response.status === 401) {
    // Only intercept 401 if it's not a signin request
    if (!endpoint.includes('/signin') && !endpoint.includes('/login')) {
      // Token expired or invalid
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('cartItems');
      window.dispatchEvent(new Event('auth-change'));
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Something went wrong');
  }

  return data;
};

// Convenience methods
export const api = {
  get: (endpoint) => apiFetch(endpoint),
  post: (endpoint, body) =>
    apiFetch(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: (endpoint, body) =>
    apiFetch(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: (endpoint) => apiFetch(endpoint, { method: 'DELETE' }),
};

export default api;
