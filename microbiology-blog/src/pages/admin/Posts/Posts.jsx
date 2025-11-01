import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { postsAPI } from '../../../services/api/posts';
import { categoriesAPI } from '../../../services/api/categories';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Calendar,
  User,
  Loader,
  Archive,
  BookOpen,
  AlertTriangle,
  Shield,
  ShieldOff,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPosts = () => {
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [offensivePosts, setOffensivePosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offensiveLoading, setOffensiveLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      fetchPosts();
    } else if (activeTab === 'offensive') {
      fetchOffensivePosts();
    }
  }, [searchQuery, statusFilter, categoryFilter, pagination.page, activeTab]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoriesAPI.getCategories();
      
      if (response.success) {
        setCategories(response.data.categories || []);
      } else {
        throw new Error(response.message || 'Failed to fetch categories');
      }
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        includeAll: true
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await postsAPI.getPosts(params);
      
      if (response.success && response.data) {
        const postsData = response.data.posts || [];
        const total = response.data.total || 0;
        const totalPages = response.data.totalPages || 1;
        
        setPosts(postsData);
        setPagination(prev => ({
          ...prev,
          total: total,
          pages: totalPages
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch posts');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffensivePosts = async () => {
    try {
      setOffensiveLoading(true);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await postsAPI.getOffensivePosts(params);
      
      if (response.success && response.data) {
        setOffensivePosts(response.data.posts || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          pages: response.data.totalPages
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch offensive posts');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load offensive posts');
      setOffensivePosts([]);
    } finally {
      setOffensiveLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCategoryFilter = (e) => {
    setCategoryFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination(prev => ({ ...prev, page: 1 }));
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  const handlePublishPost = async (postId) => {
    try {
      setUpdating(postId);
      const response = await postsAPI.updatePost(postId, { status: 'published' });
      
      if (response.success) {
        toast.success('Post published successfully');
        fetchPosts();
      } else {
        throw new Error(response.message || 'Failed to publish post');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish post');
    } finally {
      setUpdating(null);
    }
  };

  const handleArchivePost = async (postId) => {
    toast.error('Only researchers can archive their own posts');
    return;
  };

  const handleUnarchivePost = async (postId, status = 'draft') => {
    toast.error('Only researchers can unarchive their own posts');
    return;
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        setUpdating(postId);
        const response = await postsAPI.deletePost(postId);
        
        if (response.success) {
          toast.success('Post deleted successfully');
          fetchPosts();
        } else {
          throw new Error(response.message || 'Failed to delete post');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete post');
      } finally {
        setUpdating(null);
      }
    }
  };

  const handleMarkAsOffensive = async (postId) => {
    const reason = prompt('Please provide a reason for marking this post as offensive:');
    if (reason === null) return;
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for marking this post as offensive');
      return;
    }

    try {
      setUpdating(postId);
      const response = await postsAPI.markAsOffensive(postId, { reason: reason.trim() });
      
      if (response.success) {
        toast.success('Post marked as offensive and removed from public view');
        fetchPosts();
        if (activeTab === 'offensive') {
          fetchOffensivePosts();
        }
      } else {
        throw new Error(response.message || 'Failed to mark post as offensive');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark post as offensive');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveOffense = async (postId) => {
    if (window.confirm('Are you sure you want to remove the offense mark and restore this post?')) {
      try {
        setUpdating(postId);
        const response = await postsAPI.removeOffense(postId);
        
        if (response.success) {
          toast.success('Offense removed and post restored to public view');
          fetchPosts();
          if (activeTab === 'offensive') {
            fetchOffensivePosts();
          }
        } else {
          throw new Error(response.message || 'Failed to remove offense from post');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to remove offense from post');
      } finally {
        setUpdating(null);
      }
    }
  };

  const getStatusBadge = (status, isOffensive = false) => {
    if (isOffensive) {
      return (
        <div className="flex items-center space-x-1">
          <AlertTriangle className="h-3 w-3 text-red-500" />
          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
            Offensive
          </span>
        </div>
      );
    }

    const statusConfig = {
      published: { color: 'bg-green-100 text-green-800', label: 'Published', icon: CheckCircle },
      draft: { color: 'bg-yellow-100 text-yellow-800', label: 'Draft', icon: BookOpen },
      archived: { color: 'bg-gray-100 text-gray-800', label: 'Archived', icon: Archive }
    };
    const config = statusConfig[status] || statusConfig.draft;
    const IconComponent = config.icon;
    
    return (
      <div className="flex items-center space-x-1">
        <IconComponent className="h-3 w-3" />
        <span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>
          {config.label}
        </span>
      </div>
    );
  };

  const getStatusActionIcon = (status, postId, isOffensive = false) => {
    if (isOffensive) {
      return (
        <button
          onClick={() => handleRemoveOffense(postId)}
          disabled={updating === postId}
          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50"
          title="Remove Offense"
        >
          {updating === postId ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldOff className="h-4 w-4" />
          )}
        </button>
      );
    }

    if (status === 'draft') {
      return (
        <button
          onClick={() => handlePublishPost(postId)}
          disabled={updating === postId}
          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:opacity-50"
          title="Publish Post"
        >
          {updating === postId ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
        </button>
      );
    }

    return (
      <button
        onClick={() => handleMarkAsOffensive(postId)}
        disabled={updating === postId}
        className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-all duration-200 disabled:opacity-50"
        title="Mark as Offensive"
      >
        {updating === postId ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Shield className="h-4 w-4" />
        )}
      </button>
    );
  };

  const getAdditionalActions = (status, postId, isOffensive = false) => {
    if (isOffensive) {
      return null;
    }

    if (status === 'published') {
      return (
        <button
          onClick={() => handleMarkAsOffensive(postId)}
          disabled={updating === postId}
          className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-all duration-200 disabled:opacity-50"
          title="Mark as Offensive"
        >
          {updating === postId ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Shield className="h-4 w-4" />
          )}
        </button>
      );
    }

    return null;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const currentPosts = activeTab === 'offensive' ? offensivePosts : posts;
  const totalPosts = pagination.total;
  const publishedCount = posts.filter(p => p.status === 'published' && !p.isOffensive).length;
  const draftCount = posts.filter(p => p.status === 'draft' && !p.isOffensive).length;
  const archivedCount = posts.filter(p => p.status === 'archived' && !p.isOffensive).length;
  const offensiveCount = offensivePosts.length;

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-600 mb-6">
              This area is restricted to administrators only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = activeTab === 'offensive' ? offensiveLoading : loading;

  if (isLoading && currentPosts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {activeTab === 'offensive' ? 'Loading offensive posts...' : 'Loading posts...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Post Management</h1>
          <p className="text-gray-600">
            Moderate and manage all platform content
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => handleTabChange('all')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Posts
            </button>
            <button
              onClick={() => handleTabChange('offensive')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'offensive'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Offensive Posts
              {offensiveCount > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                  {offensiveCount}
                </span>
              )}
            </button>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mt-6">
            {/* Search */}
            <div className="w-full lg:w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'offensive' ? 'offensive' : ''} posts...`}
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            {/* Filters - Only show for "All Posts" tab */}
            {activeTab === 'all' && (
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={handleStatusFilter}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <select
                  value={categoryFilter}
                  onChange={handleCategoryFilter}
                  disabled={categoriesLoading}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <button
                onClick={activeTab === 'offensive' ? fetchOffensivePosts : fetchPosts}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {activeTab === 'offensive' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Offense Reason
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPosts.map((post) => (
                  <tr key={post._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                          {post.title}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {post.excerpt}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {post.author?.firstName} {post.author?.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                        {post.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(post.status, post.isOffensive)}
                    </td>
                    {activeTab === 'offensive' && (
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-900 line-clamp-2">
                            {post.offenseReason || 'No reason provided'}
                          </div>
                          {post.offenseReportedBy && (
                            <div className="text-xs text-gray-500 mt-1">
                              Reported by: {post.offenseReportedBy?.firstName} {post.offenseReportedBy?.lastName}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {post.views || 0} views
                        </div>
                        <div className="flex items-center">
                          ❤️ {post.likes || 0} likes
                        </div>
                        <div className="flex items-center">
                          💬 {post.comments || 0} comments
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(post.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-1">
                        {/* View Post */}
                        <Link
                          to={`/post/${post.slug}`}
                          className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-all duration-200"
                          title="View Post"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        
                        {/* Status Action Button */}
                        {getStatusActionIcon(post.status, post._id, post.isOffensive)}

                        {/* Additional Actions */}
                        {getAdditionalActions(post.status, post._id, post.isOffensive)}

                        {/* Edit Button - Only for non-offensive posts */}
                        {!post.isOffensive && (
                          <Link
                            to={`/admin/posts/edit/${post._id}`}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Edit Post"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          disabled={updating === post._id}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                          title="Delete Post"
                        >
                          {updating === post._id ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {currentPosts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'offensive' ? 'No offensive posts found' : 'No posts found'}
              </h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : activeTab === 'offensive' 
                    ? 'No posts have been marked as offensive'
                    : 'No posts in the system'
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {currentPosts.length} of {pagination.total} posts
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats - Only for "All Posts" tab */}
        {activeTab === 'all' && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{totalPosts}</div>
              <div className="text-sm text-gray-600">Total Posts</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{publishedCount}</div>
              <div className="text-sm text-gray-600">Published</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{draftCount}</div>
              <div className="text-sm text-gray-600">Draft</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{archivedCount}</div>
              <div className="text-sm text-gray-600">Archived</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{offensiveCount}</div>
              <div className="text-sm text-gray-600">Offensive</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPosts;