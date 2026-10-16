// API Client for Airline Revenue Management Dashboard

const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('airline_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function buildQueryString(params = {}) {
  const cleanParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      cleanParams.append(key, val);
    }
  });
  const qs = cleanParams.toString();
  return qs ? `?${qs}` : '';
}

async function fetchJson(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorDetail = errJson.detail;
      else if (errJson.message) errorDetail = errJson.message;
    } catch (e) {
      // ignore json parse error
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Authentication
  async login(username, password) {
    const data = await fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (data.access_token) {
      localStorage.setItem('airline_token', data.access_token);
      localStorage.setItem('airline_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getProfile() {
    return fetchJson('/auth/me');
  },

  async register(payload) {
    const data = await fetchJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (data.access_token) {
      localStorage.setItem('airline_token', data.access_token);
      localStorage.setItem('airline_user', JSON.stringify(data.user));
    }
    return data;
  },

  async forgotPassword(email) {
    return fetchJson('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(payload) {
    return fetchJson('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getDemoAccounts() {
    return fetchJson('/auth/demo-accounts');
  },

  // Admin user management
  async getAdminUsers() {
    return fetchJson('/admin/users');
  },

  async updateAdminUserStatus(userId, status) {
    return fetchJson(`/admin/users/${userId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  },

  async updateAdminUserRole(userId, role) {
    return fetchJson(`/admin/users/${userId}/role`, {
      method: 'POST',
      body: JSON.stringify({ role })
    });
  },

  async getAuditLogs() {
    return fetchJson('/admin/audit-logs');
  },

  logout() {
    localStorage.removeItem('airline_token');
    localStorage.removeItem('airline_user');
  },

  // Dashboard & Filters
  async getDashboardSummary(params) {
    return fetchJson(`/dashboard/summary${buildQueryString(params)}`);
  },

  async getDashboardInsights(params) {
    return fetchJson(`/dashboard/insights${buildQueryString(params)}`);
  },

  async getFilterOptions() {
    return fetchJson('/dashboard/filter-options');
  },

  // Revenue Analytics
  async getRevenueTrends(params) {
    return fetchJson(`/revenue/trends${buildQueryString(params)}`);
  },

  async getRevenueByRoute(params) {
    return fetchJson(`/revenue/by-route${buildQueryString(params)}`);
  },

  async getRevenueByClass(params) {
    return fetchJson(`/revenue/by-class${buildQueryString(params)}`);
  },

  async getRevenueByFlight(params) {
    return fetchJson(`/revenue/by-flight${buildQueryString(params)}`);
  },

  async getRevenueByPeriod(params) {
    return fetchJson(`/revenue/by-period${buildQueryString(params)}`);
  },

  async getRevenueByAirline(params) {
    return fetchJson(`/revenue/by-airline${buildQueryString(params)}`);
  },

  async getRevenueByChannel(params) {
    return fetchJson(`/revenue/by-channel${buildQueryString(params)}`);
  },

  // Tickets
  async getTickets(params) {
    return fetchJson(`/tickets${buildQueryString(params)}`);
  },

  async getChannelDistribution(params) {
    return fetchJson(`/tickets/channels${buildQueryString(params)}`);
  },

  // Routes
  async getRoutePerformance(params) {
    return fetchJson(`/routes/performance${buildQueryString(params)}`);
  },

  async getRouteComparison(routeCodes, params = {}) {
    return fetchJson(`/routes/comparison${buildQueryString({ ...params, routes: routeCodes.join(',') })}`);
  },

  // Flights
  async getFlightPerformance(params) {
    return fetchJson(`/flights/performance${buildQueryString(params)}`);
  },

  // Demand
  async getDemandAnalysis(params) {
    return fetchJson(`/demand/analysis${buildQueryString(params)}`);
  },

  // Inventory
  async getInventorySummary(params) {
    return fetchJson(`/inventory/summary${buildQueryString(params)}`);
  },

  // Fare Optimization
  async getFareRecommendations(currency = 'USD') {
    return fetchJson(`/fare-optimization/recommendations${buildQueryString({ currency })}`);
  },

  async simulateFare(payload) {
    return fetchJson('/fare-optimization/simulate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Forecasting
  async getForecast(params) {
    return fetchJson(`/forecast/revenue${buildQueryString(params)}`);
  },

  // Upload & Ingestion
  async previewUpload(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload/preview`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Preview upload failed');
    }
    return res.json();
  },

  async processUpload(file, columnMapping) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('column_mapping', JSON.stringify(columnMapping));
    const res = await fetch(`${API_BASE}/upload/process`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Processing upload failed');
    }
    return res.json();
  },

  getSampleTemplateUrl() {
    return `${API_BASE}/upload/sample-template`;
  },

  // Reports
  getExportUrl(reportType, format = 'csv', params = {}) {
    return `${API_BASE}/reports/export${buildQueryString({ ...params, report_type: reportType, format })}`;
  },

  // Settings
  async getSettings() {
    return fetchJson('/settings');
  },

  async updateSettings(settings) {
    return fetchJson('/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  }
};
