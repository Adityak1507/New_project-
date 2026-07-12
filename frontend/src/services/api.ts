import axios from 'axios';
import type { PaginatedTMSUsers, TMSUser, HubUser, AuditRecord } from '../types/tms';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hub_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  seed: async () => {
    return api.post('/auth/seed');
  },
  login: async (username: string, password = 'password123') => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    const res = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    localStorage.setItem('hub_token', res.data.access_token);
    return res.data;
  },
  me: async (): Promise<HubUser> => {
    const res = await api.get<HubUser>('/auth/me');
    return res.data;
  }
};

export const tmsUserService = {
  list: async (page = 1, size = 10, search = '', statusFilter?: string, sortBy?: string): Promise<PaginatedTMSUsers> => {
    const params: Record<string, any> = { page, size };
    if (search) params.search = search;
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
    if (sortBy) params.sort_by = sortBy;
    const res = await api.get<PaginatedTMSUsers>('/tms-users', { params });
    return res.data;
  },
  get: async (id: string): Promise<TMSUser> => {
    const res = await api.get<TMSUser>(`/tms-users/${id}`);
    return res.data;
  },
  create: async (data: any): Promise<TMSUser> => {
    const res = await api.post<TMSUser>('/tms-users', data);
    return res.data;
  },
  update: async (id: string, data: any): Promise<TMSUser> => {
    const res = await api.patch<TMSUser>(`/tms-users/${id}`, data);
    return res.data;
  },
  changeStatus: async (id: string, active: boolean): Promise<TMSUser> => {
    const res = await api.post<TMSUser>(`/tms-users/${id}/status`, null, { params: { active } });
    return res.data;
  },
  getAvailableProducts: async (): Promise<string[]> => {
    const res = await api.get<{ products: string[] }>('/tms-users/products/available');
    return res.data.products;
  },
  getAvailableRoles: async (): Promise<string[]> => {
    const res = await api.get<{ roles: string[] }>('/tms-users/roles/available');
    return res.data.roles;
  }
};

export const orgService = {
  getHierarchy: async (): Promise<Record<string, any>> => {
    const res = await api.get<Record<string, any>>('/org/hierarchy');
    return res.data;
  },
  getCompanies: async (): Promise<string[]> => {
    const res = await api.get<string[]>('/org/companies');
    return res.data;
  },
  getBusinessUnits: async (company: string): Promise<string[]> => {
    const res = await api.get<string[]>('/org/business-units', { params: { company } });
    return res.data;
  },
  getDepartments: async (company: string, business_unit: string): Promise<string[]> => {
    const res = await api.get<string[]>('/org/departments', { params: { company, business_unit } });
    return res.data;
  },
  getCostCenters: async (company: string, business_unit: string, department: string): Promise<string[]> => {
    const res = await api.get<string[]>('/org/cost-centers', { params: { company, business_unit, department } });
    return res.data;
  },
  getLocations: async (company: string, business_unit: string, department: string, cost_center: string): Promise<string[]> => {
    const res = await api.get<string[]>('/org/locations', { params: { company, business_unit, department, cost_center } });
    return res.data;
  },
  getDesignationSuggestions: async (q = ''): Promise<string[]> => {
    const res = await api.get<{ suggestions: string[] }>('/org/designations/suggestions', { params: { q } });
    return res.data.suggestions || [];
  },
  getDepartmentSuggestions: async (q = ''): Promise<string[]> => {
    const res = await api.get<{ suggestions: string[] }>('/org/departments/suggestions', { params: { q } });
    return res.data.suggestions || [];
  },
  getReportingManagerSuggestions: async (q = ''): Promise<{ displayName: string; email: string; label: string }[]> => {
    const res = await api.get<{ suggestions: { displayName: string; email: string; label: string }[] }>('/org/reporting-managers/suggestions', { params: { q } });
    return res.data.suggestions || [];
  }
};

export const auditService = {
  list: async (page = 1, size = 20): Promise<{ records: AuditRecord[], total_count: number }> => {
    const res = await api.get('/audit-logs', { params: { page, size } });
    return res.data;
  }
};
