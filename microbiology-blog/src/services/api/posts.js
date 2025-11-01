import api from './config';

export const postsAPI = {
  // Get all posts with default pagination
  getPosts: async (params = {}) => {
    try {
      const response = await api.get('/posts', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  // Get post for editing (bypasses status check)
  getPostForEdit: async (postId) => {
    try {
      const response = await api.get(`/posts/edit/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching post for edit:', error);
      throw error;
    }
  },

  // Get single post (public route - respects status check)
  getPost: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  // Update post
  updatePost: async (postId, postData) => {
    try {
      const response = await api.put(`/posts/${postId}`, postData);
      return response.data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  // Create post
  createPost: async (postData) => {
    try {
      const response = await api.post('/posts', postData);
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Delete post
  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // Archive post
  archivePost: async (postId, data = {}) => {
    try {
      const response = await api.post(`/posts/${postId}/archive`, data);
      return response.data;
    } catch (error) {
      console.error('Error archiving post:', error);
      throw error;
    }
  },

  // Unarchive post
  unarchivePost: async (postId, data = {}) => {
    try {
      const response = await api.post(`/posts/${postId}/unarchive`, data);
      return response.data;
    } catch (error) {
      console.error('Error unarchiving post:', error);
      throw error;
    }
  },

  getFeaturedPosts: async () => {
    try {
      const response = await api.get('/posts/featured');
      return response.data;
    } catch (error) {
      console.error('Error fetching featured posts:', error);
      return { data: [] };
    }
  },

  getPopularPosts: async () => {
    try {
      const response = await api.get('/posts/popular');
      return response.data;
    } catch (error) {
      console.error('Error fetching popular posts:', error);
      return { data: [] };
    }
  },

  searchPosts: async (query, params = {}) => {
    try {
      const response = await api.get('/posts/search', {
        params: { 
          q: query, 
          ...params 
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error in search:', error);
      throw error;
    }
  },

  getSearchSuggestions: async (query, type = 'all') => {
    try {
      const response = await api.get('/posts/search/suggestions', {
        params: { q: query, type }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return { 
        success: true, 
        data: { suggestions: [] } 
      };
    }
  },

  likePost: async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  getPostComments: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching post comments:', error);
      return { data: [] };
    }
  },

  getAuthorPosts: async (authorId, params = {}) => {
    try {
      const response = await api.get(`/posts/author/${authorId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching author posts:', error);
      throw error;
    }
  },

  getRelatedPosts: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}/related`);
      return response.data;
    } catch (error) {
      console.error('Error fetching related posts:', error);
      throw error;
    }
  },

  getOffensivePosts: async (params = {}) => {
    try {
      const response = await api.get('/posts/admin/offensive', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching offensive posts:', error);
      throw error;
    }
  },

  markAsOffensive: async (postId, data = {}) => {
    try {
      const response = await api.post(`/posts/${postId}/offensive`, data);
      return response.data;
    } catch (error) {
      console.error('Error marking post as offensive:', error);
      throw error;
    }
  },

  removeOffense: async (postId) => {
    try {
      const response = await api.delete(`/posts/${postId}/offensive`);
      return response.data;
    } catch (error) {
      console.error('Error removing offense from post:', error);
      throw error;
    }
  }
};

export default postsAPI;