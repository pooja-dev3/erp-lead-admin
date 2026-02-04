import axios from 'axios';
import { API_BASE_URL } from './api';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Try both token keys for backward compatibility
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - remove both token keys
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};

// Dashboard APIs
export const dashboardAPI = {
  getOverview: async () => {
    const response = await api.get('/admin/dashboard/overview');
    return response.data;
  },
  getCompany: async (companyId) => {
    const params = companyId ? { company_id: companyId } : {};
    const response = await api.get('/admin/dashboard/company', { params });
    return response.data;
  },
  getEmployee: async () => {
    const response = await api.get('/admin/dashboard/employee');
    return response.data;
  },
};

// Users Management APIs
export const usersAPI = {
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  createUser: async (userData) => {
    console.log('Creating user with data:', userData);
    try {
      // Try the admin users endpoint first
      const response = await api.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      console.log('Admin users endpoint failed, trying company-users endpoint:', error.response?.status);
      // If admin endpoint fails, try company-specific endpoints
      if (error.response?.status === 400 || error.response?.status === 403) {
        try {
          const response = await api.post('/admin/company-users', userData);
          return response.data;
        } catch (companyError) {
          console.log('Company-users endpoint failed, trying users endpoint:', companyError.response?.status);
          // Try the general users endpoint
          try {
            const response = await api.post('/users', userData);
            return response.data;
          } catch (usersError) {
            console.log('Users endpoint failed, trying company-employees endpoint:', usersError.response?.status);
            // Try company-employees endpoint
            try {
              const response = await api.post('/admin/company-employees', userData);
              return response.data;
            } catch (employeesError) {
              console.log('All endpoints failed, last error:', employeesError.response?.status);
              throw employeesError;
            }
          }
        }
      }
      throw error;
    }
  },
  updateUser: async (id, userData) => {
    console.log('Updating user with data:', userData);
    try {
      // Try the admin users endpoint first
      const response = await api.put(`/admin/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.log('Admin users update endpoint failed, trying company-users endpoint:', error.response?.status);
      // If admin endpoint fails, try company-specific endpoints
      if (error.response?.status === 400 || error.response?.status === 403) {
        try {
          const response = await api.put(`/admin/company-users/${id}`, userData);
          return response.data;
        } catch (companyError) {
          console.log('Company-users update endpoint failed, trying users endpoint:', companyError.response?.status);
          // Try the general users endpoint
          try {
            const response = await api.put(`/users/${id}`, userData);
            return response.data;
          } catch (usersError) {
            console.log('Users update endpoint failed, trying company-employees endpoint:', usersError.response?.status);
            // Try company-employees endpoint
            try {
              const response = await api.put(`/admin/company-employees/${id}`, userData);
              return response.data;
            } catch (employeesError) {
              console.log('All update endpoints failed, last error:', employeesError.response?.status);
              throw employeesError;
            }
          }
        }
      }
      throw error;
    }
  },
  deactivateUser: async (id) => {
    const response = await api.put(`/admin/users/${id}/deactivate`);
    return response.data;
  },
};

// Company Admins APIs
export const companyAdminsAPI = {
  getCompanyAdmins: async (params = {}) => {
    const response = await api.get('/admin/company-admins', { params });
    return response.data;
  },
  createCompanyAdmin: async (adminData) => {
    const response = await api.post('/admin/company-admins', adminData);
    return response.data;
  },
  updateCompanyAdmin: async (id, adminData) => {
    const response = await api.put(`/admin/company-admins/${id}`, adminData);
    return response.data;
  },
};

// Companies Management APIs
export const companiesAPI = {
  getCompanies: async (params = {}) => {
    const response = await api.get('/admin/companies', { params });
    return response.data;
  },
  getCompany: async (id) => {
    // Try the direct endpoint first
    try {
      const response = await api.get(`/admin/companies/${id}`);
      return response.data;
    } catch (error) {
      // If direct endpoint fails, try getting from companies list
      if (error.response?.status === 404) {
        const companiesResponse = await api.get('/admin/companies');
        const company = companiesResponse.data.companies?.find(c => c.id === id);
        if (company) {
          return company;
        }
        throw new Error('Company not found');
      }
      throw error;
    }
  },
  createCompany: async (companyData) => {
    const response = await api.post('/admin/companies', companyData);
    return response.data;
  },
  updateCompany: async (id, companyData) => {
    const response = await api.put(`/admin/companies/${id}`, companyData);
    return response.data;
  },
  deleteCompany: async (id) => {
    const response = await api.delete(`/admin/companies/${id}`);
    return response.data;
  },
  enableCompany: async (id) => {
    const response = await api.put(`/admin/companies/${id}`, { status: 'active' });
    return response.data;
  },
  deactivateCompany: async (id) => {
    const response = await api.put(`/admin/companies/${id}/deactivate`);
    return response.data;
  },
};

// Visitors Management APIs
export const visitorsAPI = {
  getVisitors: async (params = {}) => {
    const response = await api.get('/visitors', { params });
    return response.data;
  },
  createVisitor: async (visitorData) => {
    const response = await api.post('/visitors', visitorData);
    return response.data;
  },
  searchVisitor: async (phone) => {
    console.log('Searching visitor by phone:', phone);
    try {
      const response = await api.get(`/visitors/search/${phone}`);
      console.log('Visitor search response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error searching visitor:', error);
      throw error;
    }
  },
  updateVisitor: async (id, visitorData) => {
    const response = await api.put(`/visitors/${id}`, visitorData);
    return response.data;
  },
  deleteVisitor: async (id) => {
    const response = await api.delete(`/visitors/${id}`);
    return response.data;
  },
  getVisitorStats: async () => {
    const response = await api.get('/visitors/stats/overview');
    return response.data;
  },
};

// Leads Management APIs
export const leadsAPI = {
  getLeads: async (params = {}) => {
    const response = await api.get('/leads', { params });
    return response.data;
  },
  createLead: async (leadData, params = {}) => {
    console.log('=== API SERVICE DEBUG ===');
    console.log('API Service - Creating lead with data:', leadData);
    console.log('API Service - Params received:', params);
    console.log('API Service - Request URL:', '/leads');
    console.log('API Service - Request method:', 'POST');
    
    try {
      // Use the correct token key that AuthContext uses
      const token = localStorage.getItem('authToken');
      let requestData = { ...leadData };
      
      console.log('Initial requestData:', JSON.stringify(requestData, null, 2));
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('JWT payload:', payload);
          console.log('User role from token:', payload.role);
          
          if (payload.role === 'platform_admin' && params.company_id) {
            // Directly add company_id to request body for platform admins
            requestData.company_id = params.company_id;
            console.log('Platform admin detected, adding company_id to request body:', params.company_id);
            console.log('Updated requestData with company_id:', JSON.stringify(requestData, null, 2));
          } else {
            console.log('Not adding company_id - conditions not met:');
            console.log('  - is platform_admin:', payload.role === 'platform_admin');
            console.log('  - has company_id param:', !!params.company_id);
            console.log('  - company_id value:', params.company_id);
          }
        } catch (e) {
          console.log('Token parsing failed:', e);
        }
      } else {
        console.log('No authToken found in localStorage');
        // Try fallback to 'token' key for compatibility
        const fallbackToken = localStorage.getItem('token');
        if (fallbackToken) {
          console.log('Found fallback token, trying that...');
          try {
            const payload = JSON.parse(atob(fallbackToken.split('.')[1]));
            console.log('Fallback JWT payload:', payload);
            
            if (payload.role === 'platform_admin' && params.company_id) {
              requestData.company_id = params.company_id;
              console.log('Platform admin detected with fallback token, adding company_id:', params.company_id);
              console.log('Updated requestData with company_id:', JSON.stringify(requestData, null, 2));
            }
          } catch (e) {
            console.log('Fallback token parsing failed:', e);
          }
        } else {
          console.log('No token found in localStorage at all');
        }
      }
      
      console.log('Final request data being sent:', JSON.stringify(requestData, null, 2));
      console.log('Making POST request to: /leads');
      
      const response = await api.post('/leads', requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Service - Response:', response);
      console.log('=== END API DEBUG ===');
      return response.data;
    } catch (error) {
      console.log('=== API ERROR DEBUG ===');
      console.log('API Service - Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          headers: error.config?.headers
        }
      });
      throw error;
    }
  },
  getLead: async (id) => {
    console.log('API Service - Fetching lead with ID:', id);
    try {
      const response = await api.get(`/leads/${id}`);
      console.log('API Service - Lead response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API Service - Error fetching lead:', error);
      throw error;
    }
  },
  updateLead: async (id, leadData) => {
    console.log('=== UPDATE LEAD API DEBUG ===');
    console.log('API Service - Updating lead with ID:', id);
    console.log('API Service - Update data:', JSON.stringify(leadData, null, 2));
    console.log('API Service - Request method:', 'PUT');
    console.log('API Service - Request URL:', `/leads/${id}`);
    
    try {
      const response = await api.put(`/leads/${id}`, leadData);
      console.log('API Service - Update response:', response);
      console.log('API Service - Response data:', response.data);
      console.log('=== END UPDATE LEAD DEBUG ===');
      return response.data;
    } catch (error) {
      console.log('=== UPDATE LEAD ERROR DEBUG ===');
      console.log('API Service - Update error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          headers: error.config?.headers
        }
      });
      throw error;
    }
  },
  deleteLead: async (id) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },
  getLeadStats: async () => {
    const response = await api.get('/leads/stats/overview');
    return response.data;
  },
};

// Audit Logs Management APIs
export const auditLogsAPI = {
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  },
};

// Company Admin Management APIs
export const companyAdminAPI = {
  getCompanyAdmins: async (params = {}) => {
    const response = await api.get('/admin/company-admins', { params });
    return response.data;
  },
  createCompanyAdmin: async (adminData) => {
    const response = await api.post('/admin/company-admins', adminData);
    return response.data;
  },
  updateCompanyAdmin: async (id, adminData) => {
    const response = await api.put(`/admin/company-admins/${id}`, adminData);
    return response.data;
  },
};

export default api;
