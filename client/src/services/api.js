const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1/price-intelligence';
const AUTH_BASE = import.meta.env.VITE_AUTH_BASE_URL || '/api/v1/auth';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message || `API request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
};

const authRequest = async (path, options = {}) => {
  const response = await fetch(`${AUTH_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message || `API request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
};

export const api = {
  login: (payload) => authRequest('/login', { method: 'POST', body: JSON.stringify(payload) }),
  signup: (payload) => authRequest('/signup', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => authRequest('/logout', { method: 'POST' }),
  me: () => authRequest('/me'),
  updateProfile: (payload) => authRequest('/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
  getUsers: () => authRequest('/users'),
  getDashboard: () => request('/summary'),
  getProducts: (filters = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
    const query = params.toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  createProduct: (payload) => request('/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id, payload) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  addPrice: (id, payload) => request(`/products/${id}/prices`, { method: 'POST', body: JSON.stringify(payload) }),
  getAlerts: () => request('/alerts'),
  updateAlert: (id, payload) => request(`/alerts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getReport: () => request('/reports/executive'),
  getSystem: () => request('/system')
};

export const socketBaseUrl = API_BASE.replace(/\/api\/v1\/price-intelligence$/, '');
