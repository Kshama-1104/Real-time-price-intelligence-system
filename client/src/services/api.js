const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1/price-intelligence';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
};

export const api = {
  getDashboard: () => request('/summary'),
  getProducts: (filters = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
    const query = params.toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  getSystem: () => request('/system')
};

export const socketBaseUrl = API_BASE.replace(/\/api\/v1\/price-intelligence$/, '');
