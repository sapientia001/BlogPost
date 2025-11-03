// services/api/categories.js

import api from './config';

const categoriesAPI = {
  // Get all categories
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Get single category
  getCategory: async (categoryId) => {
    const response = await api.get(`/categories/${categoryId}`);
    return response.data;
  },

  // Get category by slug
  getCategoryBySlug: async (slug) => {
    const response = await api.get(`/categories/slug/${slug}`);
    return response.data;
  },

  // Search categories
  searchCategories: async (query) => {
    const response = await api.get('/categories/search', { 
      params: { q: query } 
    });
    return response.data;
  },

  // Create category
  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  // Update category
  updateCategory: async (categoryId, updateData) => {
    const response = await api.put(`/categories/${categoryId}`, updateData);
    return response.data;
  },

  // Delete category
  deleteCategory: async (categoryId) => {
    const response = await api.delete(`/categories/${categoryId}`);
    return response.data;
  },

  // FIXED: Get category posts with proper response handling
  getCategoryPosts: async (categoryId, params = {}) => {
    const response = await api.get(`/categories/${categoryId}/posts`, { params });
    return response.data; // This should return the full response with success, message, data
  },
};

export default categoriesAPI;