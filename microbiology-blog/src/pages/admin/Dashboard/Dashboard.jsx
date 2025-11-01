import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { dashboardAPI } from '../../../services/api/dashboard';
import { 
  Users, 
  FileText, 
  FolderOpen, 
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Eye,
  MessageCircle,
  Heart
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getAdminDashboard();
      const data = response.data;

      // Transform API data to component stats
      const transformedStats = [
        { 
          icon: Users, 
          label: 'Total Users', 
          value: data.overview.totalUsers.toLocaleString(),
          change: `+${data.overview.recentUsers} this week`,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        },
        { 
          icon: FileText, 
          label: 'Total Posts', 
          value: data.overview.totalPosts.toLocaleString(),
          change: `+${data.overview.recentPosts} this week`,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        },
        { 
          icon: FolderOpen, 
          label: 'Categories', 
          value: data.overview.totalCategories.toLocaleString(),
          change: 'Manage categories',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100'
        },
        { 
          icon: BarChart3, 
          label: 'Total Comments', 
          value: data.overview.totalComments.toLocaleString(),
          change: 'Engagement metrics',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100'
        }
      ];

      // Transform popular posts
      const transformedPopularPosts = data.popularPosts.map((post, index) => ({
        id: post._id,
        title: post.title,
        views: post.views || 0,
        likes: post.likes?.length || 0,
        author: post.author,
        category: post.category,
        position: index + 1
      }));

      setStats(transformedStats);
      setPopularPosts(transformedPopularPosts);

      // Generate recent activities from data
      const activities = [
        {
          id: 1,
          type: 'new_users',
          message: `${data.overview.recentUsers} new users registered this week`,
          time: 'Updated just now',
          icon: Users,
          color: 'text-blue-500'
        },
        {
          id: 2,
          type: 'new_posts',
          message: `${data.overview.recentPosts} new posts created this week`,
          time: 'Updated just now',
          icon: FileText,
          color: 'text-green-500'
        },
        {
          id: 3,
          type: 'system',
          message: 'Dashboard data refreshed successfully',
          time: 'Just now',
          icon: CheckCircle,
          color: 'text-green-500'
        }
      ];

      setRecentActivities(activities);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: Users,
      link: '/admin/users',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Moderate Posts',
      description: 'Review and approve content',
      icon: FileText,
      link: '/admin/posts',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Categories',
      description: 'Manage research categories',
      icon: FolderOpen,
      link: '/admin/categories',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Analytics',
      description: 'View platform statistics',
      icon: BarChart3,
      link: '/admin/analytics',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-600 mb-6">
              This area is restricted to administrators only.
            </p>
            <Link
              to="/"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {user.firstName}! Here's an overview of your platform.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
              <p className="text-xs text-green-600">{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.link}
                    className="block p-4 rounded-lg bg-gradient-to-r text-white hover:shadow-md transition-all"
                    style={{ background: `linear-gradient(135deg, ${action.color.split('from-')[1].split('to-')[0]}, ${action.color.split('to-')[1]})` }}
                  >
                    <div className="flex items-center">
                      <action.icon className="h-6 w-6 mr-3" />
                      <div>
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm opacity-90">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity & Popular Posts */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <button
                  onClick={fetchDashboardData}
                  className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
                >
                  Refresh Data
                </button>
              </div>
              
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`p-2 rounded-lg ${activity.color.replace('text', 'bg')} bg-opacity-10`}>
                      <activity.icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Posts */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Popular Posts</h2>
              <div className="space-y-4">
                {popularPosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-bold text-sm">{post.position}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                        <p className="text-xs text-gray-500">
                          by {post.author?.firstName} {post.author?.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Eye className="h-4 w-4" />
                        <span>{post.views}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;