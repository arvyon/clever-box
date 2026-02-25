import axios from 'axios';
import { supabase } from './supabase';

// Backend URL for custom endpoints (templates, themes, seed, upload)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000');
const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests (for custom endpoints)
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

// Schools - Using Supabase Data API
export const getSchools = async () => {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (error) throw error;
  return data || [];
};

export const getSchool = async (id) => {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const createSchool = async (schoolData) => {
  const { data, error } = await supabase
    .from('schools')
    .insert(schoolData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateSchool = async (id, schoolData) => {
  const { data, error } = await supabase
    .from('schools')
    .update(schoolData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteSchool = async (id) => {
  const { error } = await supabase
    .from('schools')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return { message: 'School deleted' };
};

// Pages - Using Supabase Data API
export const getPages = async (schoolId) => {
  let query = supabase
    .from('pages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (schoolId) {
    query = query.eq('school_id', schoolId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Parse components from JSONB if it's a string
  return (data || []).map(page => ({
    ...page,
    components: typeof page.components === 'string' 
      ? JSON.parse(page.components) 
      : page.components
  }));
};

export const getPage = async (id) => {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  
  // Parse components from JSONB if it's a string
  return {
    ...data,
    components: typeof data.components === 'string' 
      ? JSON.parse(data.components) 
      : data.components
  };
};

export const createPage = async (pageData) => {
  // Convert components array to JSON string for JSONB storage
  const pageDataWithJson = {
    ...pageData,
    components: typeof pageData.components === 'string' 
      ? pageData.components 
      : JSON.stringify(pageData.components || [])
  };
  
  const { data, error } = await supabase
    .from('pages')
    .insert(pageDataWithJson)
    .select()
    .single();
  
  if (error) throw error;
  
  // Parse components back from JSONB
  return {
    ...data,
    components: typeof data.components === 'string' 
      ? JSON.parse(data.components) 
      : data.components
  };
};

export const updatePage = async (id, pageData) => {
  // Convert components array to JSON string if present
  const updateData = { ...pageData };
  if (updateData.components !== undefined) {
    updateData.components = typeof updateData.components === 'string' 
      ? updateData.components 
      : JSON.stringify(updateData.components);
  }
  
  const { data, error } = await supabase
    .from('pages')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Parse components back from JSONB
  return {
    ...data,
    components: typeof data.components === 'string' 
      ? JSON.parse(data.components) 
      : data.components
  };
};

export const deletePage = async (id) => {
  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return { message: 'Page deleted' };
};

// Templates - Global (fallback)
export const getComponentTemplates = async () => {
  const response = await api.get('/templates/components');
  return response.data;
};

// School-specific components/widgets
export const getSchoolComponents = async (schoolId) => {
  try {
    const response = await api.get(`/editor/${schoolId}/components`);
    return response.data;
  } catch (err) {
    // Fallback to global templates if school-specific fails
    console.warn('Failed to load school components, using global templates:', err);
    return getComponentTemplates();
  }
};

// Themes - Global (fallback)
export const getThemes = async () => {
  const response = await api.get('/themes');
  return response.data;
};

// School-specific themes
export const getSchoolThemes = async (schoolId) => {
  try {
    const response = await api.get(`/editor/${schoolId}/themes`);
    return response.data;
  } catch (err) {
    // Fallback to global themes if school-specific fails
    console.warn('Failed to load school themes, using global themes:', err);
    return getThemes();
  }
};

export const updateSchoolTheme = async (schoolId, themeData) => {
  // Update theme using Supabase
  const updateData = {
    theme: themeData.theme || 'default',
    primary_color: themeData.primary_color || '#1D4ED8',
    secondary_color: themeData.secondary_color || '#FBBF24'
  };
  
  const { data, error } = await supabase
    .from('schools')
    .update(updateData)
    .eq('id', schoolId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Image Upload - Using Supabase Storage
export const uploadImage = async (file) => {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, WebP allowed.');
  }
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath);
  
  return {
    url: publicUrl,
    filename: fileName,
    path: filePath
  };
};

// Seed
export const seedData = async () => {
  const response = await api.post('/seed');
  return response.data;
};

export default api;
