import api from './config';

export const dashboardAPI = {
  // Get researcher dashboard data
  getResearcherDashboard: async (params = {}) => {
    try {
      console.log('📊 Fetching researcher dashboard data');
      const response = await api.get('/analytics/researcher/dashboard', { params });
      console.log('✅ Researcher dashboard response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching researcher dashboard:', error);
      throw error;
    }
  },

  // Get researcher posts
  getResearcherPosts: async (params = {}) => {
    try {
      const response = await api.get('/posts/author/me', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching researcher posts:', error);
      throw error;
    }
  },
  getAdminDashboard: async () => {
  try {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    throw error;
  }
}
};

export default dashboardAPI;