import api from './config';

export const categoriesAPI = {
  // CORRECT ENDPOINT: GET /api/categories
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  // CORRECT ENDPOINT: GET /api/categories/:categoryId
  getCategory: async (categoryId) => {
    const response = await api.get(`/categories/${categoryId}`);
    return response.data;
  },

  // CORRECT ENDPOINT: POST /api/categories (admin only)
  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  // CORRECT ENDPOINT: PUT /api/categories/:categoryId (admin only)
  updateCategory: async (categoryId, categoryData) => {
    const response = await api.put(`/categories/${categoryId}`, categoryData);
    return response.data;
  },

  // CORRECT ENDPOINT: DELETE /api/categories/:categoryId (admin only)
  deleteCategory: async (categoryId) => {
    const response = await api.delete(`/categories/${categoryId}`);
    return response.data;
  },

  // CORRECT ENDPOINT: GET /api/categories/:categoryId/posts
  getCategoryPosts: async (categoryId, params = {}) => {
    const response = await api.get(`/categories/${categoryId}/posts`, { params });
    return response.data;
  },
};

export default categoriesAPI;