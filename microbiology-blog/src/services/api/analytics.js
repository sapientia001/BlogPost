import api from './config';

export const analyticsAPI = {
  // Get dashboard stats
  getDashboardStats: async (params = {}) => {
    try {
      console.log('📊 Fetching dashboard stats with params:', params);
      const response = await api.get('/analytics/dashboard', { params });
      console.log('✅ Dashboard stats received');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get user analytics
  getUserAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/analytics/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw error;
    }
  },

  // Get post analytics
  getPostAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/analytics/posts', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching post analytics:', error);
      throw error;
    }
  },

  // Get engagement metrics
  getEngagementMetrics: async (params = {}) => {
    try {
      const response = await api.get('/analytics/engagement', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching engagement metrics:', error);
      throw error;
    }
  },

  // Get email stats
  getEmailStats: async () => {
    try {
      const response = await api.get('/analytics/email-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching email stats:', error);
      throw error;
    }
  },

  // Export data
  exportData: async (type, params = {}) => {
    try {
      const response = await api.get(`/analytics/export/${type}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  // Get researcher dashboard
  getResearcherDashboard: async (params = {}) => {
    try {
      const response = await api.get('/analytics/researcher/dashboard', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching researcher dashboard:', error);
      throw error;
    }
  }
};

export default analyticsAPI;