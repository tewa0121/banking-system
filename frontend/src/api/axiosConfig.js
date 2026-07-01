import axios from "axios";

// ⭐ ከ Environment Variable ያንብቡ
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5004/api";

console.log('🔗 API Base URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  timeout: 30000,
  withCredentials: false, // ⭐ ይህን ወደ false ይቀይሩ
});

// ============================================
// ⭐ Request Interceptor - ቶከን በትክክል ያያይዙ
// ============================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    
    // ቶከን ካለ በትክክል ያያይዙ
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token attached to request:', {
        url: config.url,
        method: config.method,
        token: token.substring(0, 20) + '...'
      });
    } else {
      console.log('⚠️ No token found in localStorage');
    }
    
    console.log('📤 Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// ⭐ Response Interceptor - ስህተቶችን በትክክል ያስተናግዱ
// ============================================
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    // የኔትወርክ ስህተቶች
    if (!error.response) {
      console.error('❌ Network Error:', error.message);
      return Promise.reject({
        success: false,
        message: 'Network error. Please check your connection.',
        error: error.message
      });
    }
    
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    // 401 Unauthorized - ቶከን ጊዜው አልፏል ወይም የለም
    if (error.response?.status === 401) {
      console.log('🔒 Token expired or invalid. Redirecting to login...');
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userData");
      
      // ወደ መግቢያ ገጽ ይውሰዱ
      if (window.location.pathname !== '/login') {
        window.location.href = "/login";
      }
    }
    
    // 403 Forbidden - በቂ ፈቃድ የለም
    if (error.response?.status === 403) {
      console.error('🚫 Access Denied:', error.response?.data?.message);
    }
    
    // 404 Not Found - ራውቱ የለም
    if (error.response?.status === 404) {
      console.error('🔍 Route not found:', error.config?.url);
    }
    
    // 500 Internal Server Error
    if (error.response?.status === 500) {
      console.error('💥 Server Error:', error.response?.data?.message);
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// ⭐ Helper Functions
// ============================================

// ቶከን ለማግኘት
export const getToken = () => {
  return localStorage.getItem("token");
};

// ቶከን ለማስቀመጥ
export const setToken = (token) => {
  localStorage.setItem("token", token);
};

// ቶከን ለማጥፋት
export const removeToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userData");
};

// ተጠቃሚ መረጃ ለማግኘት
export const getUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

// ተጠቃሚ መረጃ ለማስቀመጥ
export const setUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

// ተጠቃሚ ገብቷል እንደሆነ ለማረጋገጥ
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  // ቶከኑ ጊዜው አልፏል እንደሆነ ማረጋገጥ (JWT decode)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // ወደ ሚሊሴኮንድ ቀይር
    return Date.now() < exp;
  } catch {
    return false;
  }
};

// ============================================
// ⭐ API Methods
// ============================================

// Auth
export const auth = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  register: (userData) => 
    api.post('/auth/register', userData),
  
  logout: () => {
    removeToken();
    window.location.href = "/login";
  },
  
  getProfile: () => 
    api.get('/auth/me'),
  
  updateProfile: (data) => 
    api.put('/auth/profile', data),
  
  changePassword: (data) => 
    api.put('/auth/change-password', data),
};

// Admin
export const admin = {
  getStats: () => 
    api.get('/admin/stats'),
  
  getUsers: () => 
    api.get('/admin/users'),
  
  getUser: (id) => 
    api.get(`/admin/users/${id}`),
  
  updateUserRole: (id, role) => 
    api.put(`/admin/users/${id}/role`, { role }),
  
  updateUserStatus: (id, status) => 
    api.put(`/admin/users/${id}/status`, { status }),
  
  getAccounts: () => 
    api.get('/admin/accounts'),
  
  getTransactions: (limit = 100) => 
    api.get(`/admin/transactions?limit=${limit}`),
  
  getAuditLogs: () => 
    api.get('/admin/audit-logs'),
  
  getSettings: () => 
    api.get('/admin/settings'),
  
  updateSettings: (settings) => 
    api.put('/admin/settings', settings),
};

// Dashboard
export const dashboard = {
  admin: () => 
    api.get('/dashboard/admin'),
  
  teller: () => 
    api.get('/dashboard/teller'),
  
  accountant: () => 
    api.get('/dashboard/accountant'),
  
  customer: () => 
    api.get('/dashboard/customer'),
};

// Teller
export const teller = {
  getCustomers: () => 
    api.get('/teller/customers'),
  
  getCustomer: (id) => 
    api.get(`/teller/customers/${id}`),
  
  createCustomer: (data) => 
    api.post('/teller/customers', data),
  
  getAccounts: () => 
    api.get('/teller/accounts'),
  
  createAccount: (data) => 
    api.post('/teller/accounts', data),
  
  getAccountBalance: (id) => 
    api.get(`/teller/accounts/${id}/balance`),
  
  deposit: (data) => 
    api.post('/teller/transactions/deposit', data),
  
  withdraw: (data) => 
    api.post('/teller/transactions/withdraw', data),
  
  transfer: (data) => 
    api.post('/teller/transactions/transfer', data),
  
  getTransactions: (accountId) => 
    api.get(`/teller/transactions${accountId ? `?account_id=${accountId}` : ''}`),
};

// Accountant
export const accountant = {
  getTransactions: (params) => 
    api.get('/accountant/transactions', { params }),
  
  getSummary: () => 
    api.get('/accountant/transactions/summary'),
  
  getDailyReport: (date) => 
    api.get(`/accountant/reports/daily${date ? `?date=${date}` : ''}`),
  
  getMonthlyReport: (month, year) => 
    api.get(`/accountant/reports/monthly${month && year ? `?month=${month}&year=${year}` : ''}`),
  
  getBalanceSheet: () => 
    api.get('/accountant/reports/balance-sheet'),
  
  getTrends: () => 
    api.get('/accountant/reports/trends'),
  
  exportReport: (type, start_date, end_date) => 
    api.get(`/accountant/reports/export?type=${type}&start_date=${start_date}&end_date=${end_date}`),
  
  getAccounts: () => 
    api.get('/accountant/accounts'),
  
  reconcileAccount: (id) => 
    api.get(`/accountant/accounts/${id}/reconcile`),
};

// Customer
export const customer = {
  getProfile: () => 
    api.get('/customer/profile'),
  
  updateProfile: (data) => 
    api.put('/customer/profile', data),
  
  changePassword: (data) => 
    api.put('/customer/profile/password', data),
  
  getAccounts: () => 
    api.get('/customer/accounts'),
  
  getAccount: (id) => 
    api.get(`/customer/accounts/${id}`),
  
  getTransactions: (id, params) => 
    api.get(`/customer/accounts/${id}/transactions`, { params }),
  
  getStatement: (id, params) => 
    api.get(`/customer/accounts/${id}/statement`, { params }),
  
  getBalanceSummary: () => 
    api.get('/customer/balance-summary'),
  
  transfer: (data) => 
    api.post('/customer/transfer', data),
  
  getNotifications: () => 
    api.get('/customer/notifications'),
  
  markNotificationRead: (id) => 
    api.put(`/customer/notifications/${id}/read`),
  
  markAllNotificationsRead: () => 
    api.put('/customer/notifications/read-all'),
  
  deleteNotification: (id) => 
    api.delete(`/customer/notifications/${id}`),
};

// Default export
export default api;