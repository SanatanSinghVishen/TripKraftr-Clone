const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Get the stored auth token.
 */
function getToken() {
  return localStorage.getItem('availnow_token');
}

/**
 * Store the auth token.
 */
export function setToken(token) {
  localStorage.setItem('availnow_token', token);
}

/**
 * Clear the auth token.
 */
export function clearToken() {
  localStorage.removeItem('availnow_token');
}

/**
 * Fetch wrapper that auto-attaches the auth token and handles errors.
 */
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle 401 — redirect to login
  if (response.status === 401) {
    clearToken();
    // Only force redirect if they are on a protected page
    const p = window.location.pathname;
    if (p.startsWith('/dashboard')) {
      window.location.href = '/';
    } else if (p === '/admin/dashboard') {
      window.location.href = '/admin';
    }
    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  // 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// ── Auth API ───────────────────────────────────────────────

export const auth = {
  getMe: () => apiFetch('/auth/me'),
  adminLogin: (email, password) =>
    apiFetch('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getGoogleAuthUrl: () => `${API_BASE}/auth/google`,
};

// ── Properties API ─────────────────────────────────────────

export const properties = {
  getMyProperty: () => apiFetch('/api/properties/me'),
  create: (data) =>
    apiFetch('/api/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/api/properties/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ── Rooms API ──────────────────────────────────────────────

export const rooms = {
  list: (propertyId) =>
    apiFetch(`/api/properties/${propertyId}/rooms`),
  add: (propertyId, data) =>
    apiFetch(`/api/properties/${propertyId}/rooms`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (roomId, data) =>
    apiFetch(`/api/rooms/${roomId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  remove: (roomId) =>
    apiFetch(`/api/rooms/${roomId}`, {
      method: 'DELETE',
    }),
};

// ── Bookings API ───────────────────────────────────────────

export const bookings = {
  list: (propertyId, status) => {
    const params = status ? `?status=${status}` : '';
    return apiFetch(`/api/properties/${propertyId}/bookings${params}`);
  },
  create: (propertyId, data) =>
    apiFetch(`/api/properties/${propertyId}/bookings`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (bookingId, data) =>
    apiFetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  cancel: (bookingId) =>
    apiFetch(`/api/bookings/${bookingId}`, {
      method: 'DELETE',
    }),
  getAvailability: (propertyId, checkin, nights) => {
    const params = checkin && nights
      ? `?checkin=${checkin}&nights=${nights}`
      : '';
    return apiFetch(`/api/properties/${propertyId}/availability${params}`);
  },
};

// ── Revenue API ────────────────────────────────────────────

export const revenue = {
  getSummary: (propertyId) =>
    apiFetch(`/api/properties/${propertyId}/revenue`),
};

// ── Public API (no auth) ───────────────────────────────────

export const publicApi = {
  getProperty: (slug) => apiFetch(`/api/public/${slug}`),
  checkAvailability: (slug, params) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/public/${slug}/availability?${query}`);
  },
  logView: (slug) =>
    fetch(`${API_BASE}/api/public/${slug}/view`, { method: 'POST' }).catch(() => {}),
};

// ── Admin API ──────────────────────────────────────────────

export const admin = {
  getOverview: () => apiFetch('/api/admin/overview'),
  listProperties: () => apiFetch('/api/admin/properties'),
  getAnalytics: (propertyId) =>
    apiFetch(`/api/admin/properties/${propertyId}/analytics`),
  updatePlan: (propertyId, data) =>
    apiFetch(`/api/admin/properties/${propertyId}/plan`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
