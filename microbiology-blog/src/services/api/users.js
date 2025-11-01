import api from './config';

export const usersAPI = {
  // CORRECT ENDPOINT: GET /api/users (admin only)
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // CORRECT ENDPOINT: GET /api/users/:userId
  getUser: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // FIXED: Use the correct endpoint based on context
  updateUser: async (userId, userData, isCurrentUser = false) => {
    let endpoint;
    
    if (isCurrentUser) {
      // User updating their own profile - use /users/profile/me
      endpoint = '/users/profile/me';
    } else {
      // Admin updating another user - use /users/:userId
      endpoint = `/users/${userId}`;
    }
    
    const response = await api.put(endpoint, userData);
    return response.data;
  },

  // CORRECT ENDPOINT: DELETE /api/users/:userId (admin only)
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  // CORRECT ENDPOINT: GET /api/users/:userId/posts
  getUserPosts: async (userId, params = {}) => {
    const response = await api.get(`/users/${userId}/posts`, { params });
    return response.data;
  },

  // ADD: Update current user preferences
  updateCurrentUserPreferences: async (preferencesData) => {
    const response = await api.put('/users/profile/me/preferences', preferencesData);
    return response.data;
  },
};

export default usersAPI;