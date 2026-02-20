import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Schools
export const getSchools = async () => {
  const response = await api.get('/schools');
  return response.data;
};

export const getSchool = async (id) => {
  const response = await api.get(`/schools/${id}`);
  return response.data;
};

export const createSchool = async (data) => {
  const response = await api.post('/schools', data);
  return response.data;
};

export const deleteSchool = async (id) => {
  const response = await api.delete(`/schools/${id}`);
  return response.data;
};

// Pages
export const getPages = async (schoolId) => {
  const params = schoolId ? { school_id: schoolId } : {};
  const response = await api.get('/pages', { params });
  return response.data;
};

export const getPage = async (id) => {
  const response = await api.get(`/pages/${id}`);
  return response.data;
};

export const createPage = async (data) => {
  const response = await api.post('/pages', data);
  return response.data;
};

export const updatePage = async (id, data) => {
  const response = await api.put(`/pages/${id}`, data);
  return response.data;
};

export const deletePage = async (id) => {
  const response = await api.delete(`/pages/${id}`);
  return response.data;
};

// Templates
export const getComponentTemplates = async () => {
  const response = await api.get('/templates/components');
  return response.data;
};

// Seed
export const seedData = async () => {
  const response = await api.post('/seed');
  return response.data;
};

export default api;
