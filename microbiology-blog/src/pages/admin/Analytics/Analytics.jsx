import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { analyticsAPI } from '../../../services/api/analytics';
import { postsAPI } from '../../../services/api/posts';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Eye,
  TrendingUp,
  Loader,
  Heart,
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminAnalytics = () => {
  const { user: currentUser } = useAuth();
  const [overviewStats, setOverviewStats] = useState([]);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [topPosts, setTopPosts] = useState([]);
  const [engagementMetrics, setEngagementMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const [
        dashboardResponse,
        userAnalyticsResponse,
        engagementResponse,
        popularPostsResponse
      ] = await Promise.all([
        analyticsAPI.getDashboardStats(),
        analyticsAPI.getUserAnalytics(),
        analyticsAPI.getEngagementMetrics(),
        postsAPI.getPopularPosts({ limit: 4 })
      ]);

      if (dashboardResponse.success) {
        const stats = dashboardResponse.data;
        const overviewData = [
          { 
            icon: Users, 
            label: 'Total Users', 
            value: stats.overview?.totalUsers?.toLocaleString() || '0',
            change: `+${stats.overview?.recentUsers || 0} this week`,
            color: 'text-blue-600'
          },
          { 
            icon: FileText, 
            label: 'Total Posts', 
            value: stats.overview?.totalPosts?.toLocaleString() || '0',
            change: `+${stats.overview?.recentPosts || 0} this week`,
            color: 'text-green-600'
          },
          { 
            icon: Eye, 
            label: 'Total Views', 
            value: (stats.overview?.totalViews || 0).toLocaleString(),
            change: 'Platform total',
            color: 'text-purple-600'
          },
          { 
            icon: BarChart3, 
            label: 'Total Comments', 
            value: stats.overview?.totalComments?.toLocaleString() || '0',
            change: 'Engagement total',
            color: 'text-orange-600'
          }
        ];
        setOverviewStats(overviewData);
      }

      if (userAnalyticsResponse.success) {
        setUserAnalytics(userAnalyticsResponse.data);
      }

      if (engagementResponse.success) {
        setEngagementMetrics(engagementResponse.data);
      }

      if (popularPostsResponse.success) {
        setTopPosts(popularPostsResponse.data.posts || []);
      }

      if (isRefresh) {
        toast.success('Analytics data updated');
      }

    } catch (error) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getUserDistribution = () => {
    if (!userAnalytics?.userStats) return [];
    
    const totalUsers = userAnalytics.userStats.reduce((sum, stat) => sum + stat.count, 0);
    return userAnalytics.userStats.map(stat => ({
      role: stat._id,
      percentage: Math.round((stat.count / totalUsers) * 100),
      count: stat.count
    }));
  };

  const getUserGrowthData = () => {
    return [
      { month: 'Jan', users: 1200, growth: 12 },
      { month: 'Feb', users: 1250, growth: 4 },
      { month: 'Mar', users: 1320, growth: 6 },
      { month: 'Apr', users: 1400, growth: 6 },
      { month: 'May', users: 1450, growth: 4 },
      { month: 'Jun', users: userAnalytics?.recentUsers?.reduce((sum, day) => sum + day.count, 0) || 1245, growth: -14 }
    ];
  };

  const getContentStatus = () => {
    if (!engagementMetrics) return [];
    
    return [
      { status: 'Published', percentage: 68, count: engagementMetrics.postsCreated || 0 },
      { status: 'Draft', percentage: 22, count: Math.round((engagementMetrics.postsCreated || 0) * 0.22) },
      { status: 'Pending', percentage: 10, count: Math.round((engagementMetrics.postsCreated || 0) * 0.1) }
    ];
  };

  const handleRefresh = () => {
    fetchAnalyticsData(true);
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <BarChart3 className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-600 mb-6">
              This area is restricted to administrators only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Analytics</h1>
              <p className="text-gray-600">
                Comprehensive insights into platform performance and user engagement
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {refreshing ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Data
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {overviewStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color.replace('text', 'bg')} bg-opacity-10`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
              <p className="text-xs text-green-600">{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Growth Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">User Growth</h2>
            <div className="space-y-4">
              {getUserGrowthData().map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 w-16">{data.month}</span>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(data.users / 1500) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right w-20">
                    <div className="text-sm font-medium text-gray-900">{data.users.toLocaleString()}</div>
                    <div className={`text-xs ${data.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.growth >= 0 ? '+' : ''}{data.growth}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Posts */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Performing Posts</h2>
            <div className="space-y-4">
              {topPosts.map((post, index) => (
                <div key={post._id || index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1 truncate">{post.title || 'Untitled Post'}</h3>
                    <p className="text-sm text-gray-500">
                      by {post.author?.firstName || 'Unknown'} {post.author?.lastName || 'Author'}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium text-gray-900">{(post.views || 0).toLocaleString()} views</div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Heart className="h-3 w-3" />
                      <span>{(post.likes?.length || 0).toLocaleString()}</span>
                      <MessageCircle className="h-3 w-3 ml-2" />
                      <span>{(post.comments || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {topPosts.length === 0 && (
                <p className="text-gray-500 text-center py-4">No posts data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* User Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
            <div className="space-y-3">
              {getUserDistribution().map((dist, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-sm text-gray-600 capitalize">{dist.role}s</span>
                  <span className="text-sm font-medium text-gray-900">
                    {dist.percentage}% ({dist.count.toLocaleString()})
                  </span>
                </div>
              ))}
              {getUserDistribution().length === 0 && (
                <p className="text-gray-500 text-sm">No user data available</p>
              )}
            </div>
          </div>

          {/* Content Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Status</h3>
            <div className="space-y-3">
              {getContentStatus().map((status, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-sm text-gray-600">{status.status}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {status.percentage}% ({status.count.toLocaleString()})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Health */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Posts Created</span>
                <span className="text-sm font-medium text-green-600">
                  {(engagementMetrics?.postsCreated || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Comments</span>
                <span className="text-sm font-medium text-green-600">
                  {(engagementMetrics?.commentsCreated || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Likes</span>
                <span className="text-sm font-medium text-green-600">
                  {(engagementMetrics?.totalLikes || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Read Time</span>
                <span className="text-sm font-medium text-gray-900">
                  {engagementMetrics?.avgReadTime || 0} min
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;