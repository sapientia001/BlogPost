import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useApi } from '../../../hooks/useApi';
import { dashboardAPI } from '../../../services/api/dashboard';
import { 
  FileText, 
  Plus, 
  Eye, 
  Heart, 
  MessageCircle,
  TrendingUp,
  Calendar,
  BarChart3,
  Loader,
  RefreshCw,
  AlertCircle,
  X,
  TrendingDown
} from 'lucide-react';

const ResearcherDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { useGetQuery } = useApi();
  const [showAnalytics, setShowAnalytics] = useState(false);

  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    isError,
    isSuccess,
    refetch 
  } = useGetQuery(
    ['researcher-dashboard'],
    () => dashboardAPI.getResearcherDashboard({ days: 30 }),
    {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      enabled: !authLoading && !!user,
    }
  );

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Checking authentication...</h2>
        </div>
      </div>
    );
  }

  // Check if user exists and has researcher role
  if (!user || user.role !== 'researcher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {!user ? 'Authentication Required' : 'Researcher Access Required'}
            </h2>
            <p className="text-gray-600 mb-6">
              {!user 
                ? 'Please log in to access the researcher dashboard.'
                : 'This dashboard is only available to researchers. Please contact administration if you need researcher access.'
              }
            </p>
            <Link
              to={!user ? "/login" : "/"}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              {!user ? 'Go to Login' : 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show dashboard loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Loader className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Loading your dashboard...</h2>
            <p className="text-gray-600 mt-2">Fetching your research data</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
              <div className="text-left bg-red-50 p-4 rounded-lg mb-4">
                <p className="text-red-800 font-medium">Error Details:</p>
                <p className="text-red-600 text-sm mt-1">
                  {error?.response?.data?.message || error?.message || 'Unknown error occurred'}
                </p>
                {error?.response?.status && (
                  <p className="text-red-600 text-sm">Status: {error.response.status}</p>
                )}
              </div>
              <button
                onClick={() => refetch()}
                className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors mx-auto"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Extract data from API response
  const statsData = dashboardData?.data;

  if (isSuccess && !statsData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
              <p className="text-gray-600 mb-4">
                Your dashboard is loaded but no data was returned from the server.
              </p>
              <button
                onClick={() => refetch()}
                className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors mx-auto"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stats cards data - with fallbacks
  const stats = [
    { 
      icon: FileText, 
      label: 'Total Posts', 
      value: statsData?.totals?.posts?.toString() || '0',
      change: statsData?.growth?.postsCount ? `+${statsData.growth.postsCount} this month` : 'No posts this month',
      color: 'text-blue-600',
      trend: statsData?.growth?.posts > 0 ? 'up' : statsData?.growth?.posts < 0 ? 'down' : 'neutral'
    },
    { 
      icon: Eye, 
      label: 'Total Views', 
      value: (statsData?.totals?.views || 0).toLocaleString(),
      change: 'All time views',
      color: 'text-green-600',
      trend: 'neutral'
    },
    { 
      icon: Heart, 
      label: 'Total Likes', 
      value: (statsData?.totals?.likes || 0).toLocaleString(),
      change: 'Total engagement',
      color: 'text-red-600',
      trend: 'neutral'
    },
    { 
      icon: MessageCircle, 
      label: 'Comments', 
      value: (statsData?.totals?.comments || 0).toLocaleString(),
      change: 'Total discussions',
      color: 'text-purple-600',
      trend: 'neutral'
    }
  ];

  const recentPosts = statsData?.recentPosts || [];
  const popularPosts = statsData?.popularPosts || [];

  const quickActions = [
    {
      title: 'Create New Post',
      description: 'Start writing a new research article',
      icon: Plus,
      link: '/researcher/create',
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: null
    },
    {
      title: 'Manage Posts',
      description: 'View and edit your existing articles',
      icon: FileText,
      link: '/researcher/posts',
      color: 'bg-green-500 hover:bg-green-600',
      onClick: null
    },
    {
      title: 'View Analytics',
      description: 'Detailed performance metrics',
      icon: BarChart3,
      link: null,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => setShowAnalytics(true)
    }
  ];

  // Calculate analytics metrics
  const analyticsData = {
    avgViewsPerPost: statsData?.totals?.posts > 0 
      ? Math.round((statsData.totals.views / statsData.totals.posts) * 10) / 10 
      : 0,
    engagementRate: statsData?.totals?.views > 0 
      ? Math.round(((statsData.totals.likes + statsData.totals.comments) / statsData.totals.views) * 100 * 10) / 10 
      : 0,
    topPerformingPost: popularPosts[0] || null,
    monthlyGrowth: statsData?.growth?.posts || 0
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Draft';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Analytics Modal Component
  const AnalyticsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Detailed Analytics</h2>
          <button
            onClick={() => setShowAnalytics(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Avg. Views/Post</p>
                  <p className="text-2xl font-bold text-blue-900">{analyticsData.avgViewsPerPost}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Engagement Rate</p>
                  <p className="text-2xl font-bold text-green-900">{analyticsData.engagementRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Monthly Growth</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {analyticsData.monthlyGrowth > 0 ? '+' : ''}{analyticsData.monthlyGrowth}%
                  </p>
                </div>
                {analyticsData.monthlyGrowth >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-purple-400" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-purple-400" />
                )}
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Total Posts</p>
                  <p className="text-2xl font-bold text-orange-900">{statsData?.totals?.posts || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-orange-400" />
              </div>
            </div>
          </div>

          {/* Top Performing Post */}
          {analyticsData.topPerformingPost && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Post</h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{analyticsData.topPerformingPost.title}</h4>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{analyticsData.topPerformingPost.views} views</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4" />
                      <span>{analyticsData.topPerformingPost.likes} likes</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{analyticsData.topPerformingPost.views}</p>
                  <p className="text-sm text-gray-600">Total Views</p>
                </div>
              </div>
            </div>
          )}

          {/* Performance Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Views</span>
                  <span className="font-semibold">{statsData?.totals?.views?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Likes</span>
                  <span className="font-semibold">{statsData?.totals?.likes?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Comments</span>
                  <span className="font-semibold">{statsData?.totals?.comments?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Engagement Rate</span>
                  <span className="font-semibold text-green-600">{analyticsData.engagementRate}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Published Posts</span>
                  <span className="font-semibold">
                    {recentPosts.filter(post => post.status === 'published').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Draft Posts</span>
                  <span className="font-semibold">
                    {recentPosts.filter(post => post.status === 'draft').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Views</span>
                  <span className="font-semibold">{analyticsData.avgViewsPerPost}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly Growth</span>
                  <span className={`font-semibold ${
                    analyticsData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analyticsData.monthlyGrowth > 0 ? '+' : ''}{analyticsData.monthlyGrowth}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Performance */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Posts Performance</h3>
            {recentPosts.length > 0 ? (
              <div className="space-y-3">
                {recentPosts.slice(0, 5).map((post, index) => (
                  <div key={post._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{post.title}</h4>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                        <span>Views: {post.views || 0}</span>
                        <span>Likes: {post.likes || 0}</span>
                        <span>Comments: {post.comments || 0}</span>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      post.status === 'published' 
                        ? 'bg-green-100 text-green-800'
                        : post.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {post.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No posts to analyze</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Analytics Modal */}
      {showAnalytics && <AnalyticsModal />}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Researcher Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {user.firstName}! Here's an overview of your research publications.
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Data loaded: {statsData ? 'Yes' : 'No'} | Posts: {statsData?.totals?.posts || 0}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color.replace('text', 'bg')} bg-opacity-10`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <TrendingUp className={`h-5 w-5 ${
                  stat.trend === 'up' ? 'text-green-500' : 
                  stat.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                }`} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-xs ${
                stat.trend === 'up' ? 'text-green-600' : 
                stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stat.change}
              </p>
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
                  action.link ? (
                    <Link
                      key={index}
                      to={action.link}
                      className={`flex items-center p-4 rounded-lg text-white ${action.color} transition-colors`}
                    >
                      <action.icon className="h-6 w-6 mr-3" />
                      <div>
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm opacity-90">{action.description}</p>
                      </div>
                    </Link>
                  ) : (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className={`flex items-center p-4 rounded-lg text-white ${action.color} transition-colors w-full text-left`}
                    >
                      <action.icon className="h-6 w-6 mr-3" />
                      <div>
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm opacity-90">{action.description}</p>
                      </div>
                    </button>
                  )
                ))}
              </div>
            </div>

            {/* Popular Posts */}
            {popularPosts.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Popular Posts</h2>
                <div className="space-y-3">
                  {popularPosts.map((post, index) => (
                    <div key={post._id || index} className="border border-gray-200 rounded-lg p-3">
                      <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-3 w-3" />
                          <span>{post.views || 0}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Heart className="h-3 w-3" />
                          <span>{post.likes || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Posts & Performance */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Posts</h2>
                <Link
                  to="/researcher/posts"
                  className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
                >
                  View All →
                </Link>
              </div>
              
              {recentPosts.length > 0 ? (
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <div key={post._id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{post.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          post.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : post.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {post.status || 'draft'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{post.views || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="h-4 w-4" />
                            <span>{post.likes || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.comments || 0}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span className="text-xs">{formatDate(post.publishedAt || post.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No posts yet</p>
                  <p className="text-sm text-gray-500 mb-4">Create your first post to get started</p>
                  <Link
                    to="/researcher/create"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-sm"
                  >
                    Create First Post
                  </Link>
                </div>
              )}
            </div>

            {/* Performance Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Overview</h2>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {statsData?.totals?.posts > 0 
                    ? `You have ${statsData.totals.posts} posts with ${statsData.totals.views} total views`
                    : 'Start creating posts to see performance metrics'
                  }
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {statsData?.totals?.posts > 0
                    ? `Engagement: ${statsData.totals.likes} likes • ${statsData.totals.comments} comments`
                    : 'Your analytics will appear here once you publish content'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearcherDashboard;