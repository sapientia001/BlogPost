import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useApi } from '../../../hooks/useApi';
import { postsAPI } from '../../../services/api/posts';
import { 
  FileText, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Search,
  Filter,
  Plus,
  Loader,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Archive,
  FolderOpen,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const MyPosts = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);
  const [totalPosts, setTotalPosts] = useState(0);

  const { useDeleteMutation, usePostMutation } = useApi();
  const hasFetchedRef = useRef(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch user's posts
  const fetchUserPosts = async () => {
    if (authLoading) {
      return;
    }

    let currentUser = user;
    let userId = user?.id || user?._id;
    
    if ((!userId) && !authLoading) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
          userId = currentUser.id || currentUser._id;
        }
      } catch (e) {
        // Silent fail for production
      }
    }

    if (!userId) {
      setError('User authentication incomplete. Please try refreshing the page.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: postsPerPage,
        author: userId,
        includeAll: true
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await postsAPI.getPosts(params);
      
      if (response && response.success && response.data) {
        setPosts(response.data.posts || []);
        setTotalPosts(response.data.total || 0);
        hasFetchedRef.current = true;
      } else {
        throw new Error(response?.message || 'Invalid response structure');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        toast.error('Session expired. Please login again.');
      } else if (error.response?.status === 404) {
        setError('User posts not found. The user may not exist or you may not have permission.');
        toast.error('Unable to load posts. Please check your permissions.');
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to load posts');
        toast.error('Failed to load posts');
      }
      
      setPosts([]);
      setTotalPosts(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts when dependencies change
  useEffect(() => {
    if (!authLoading) {
      fetchUserPosts();
    }
  }, [user, user?.id, user?._id, currentPage, postsPerPage, authLoading, isAuthenticated, statusFilter]);

  // Reset fetch flag when user changes or filters change
  useEffect(() => {
    const userId = user?.id || user?._id;
    if (userId) {
      hasFetchedRef.current = false;
    }
  }, [user?.id, user?._id, statusFilter]);

  // Delete post mutation
  const deletePostMutation = useDeleteMutation(
    (postId) => postsAPI.deletePost(postId),
    {
      onSuccess: (data, variables) => {
        const postId = variables;
        setPosts(prev => prev.filter(post => post._id !== postId));
        setTotalPosts(prev => prev - 1);
        toast.success('Post deleted successfully');
        
        if (posts.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 'Failed to delete post';
        toast.error(errorMessage);
        
        if (error.response?.status === 403 || error.response?.status === 401) {
          hasFetchedRef.current = false;
          setCurrentPage(1);
        }
      },
    }
  );

  // Archive post mutation
  const archivePostMutation = usePostMutation(
    (postId) => postsAPI.archivePost(postId),
    {
      onSuccess: (data, postId) => {
        setPosts(prev => prev.map(post => 
          post._id === postId ? { ...post, status: 'archived' } : post
        ));
        toast.success('Post archived successfully');
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 'Failed to archive post';
        
        if (error.response?.status === 403) {
          toast.error('You do not have permission to archive this post');
          hasFetchedRef.current = false;
          setCurrentPage(1);
        } else {
          toast.error(errorMessage);
        }
      },
    }
  );

  // Unarchive post mutation
  const unarchivePostMutation = usePostMutation(
    (postId) => postsAPI.unarchivePost(postId, { status: 'draft' }),
    {
      onSuccess: (data, postId) => {
        setPosts(prev => prev.map(post => 
          post._id === postId ? { ...post, status: 'draft' } : post
        ));
        toast.success('Post moved to drafts');
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 'Failed to unarchive post';
        
        if (error.response?.status === 403) {
          toast.error('You do not have permission to unarchive this post');
          hasFetchedRef.current = false;
          setCurrentPage(1);
        } else {
          toast.error(errorMessage);
        }
      },
    }
  );

  // Publish post mutation
  const publishPostMutation = usePostMutation(
    (postId) => postsAPI.updatePost(postId, { status: 'published' }),
    {
      onSuccess: (data, postId) => {
        setPosts(prev => prev.map(post => 
          post._id === postId ? { ...post, status: 'published' } : post
        ));
        toast.success('Post published successfully');
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message || 'Failed to publish post';
        toast.error(errorMessage);
      },
    }
  );

  // Enhanced search with multiple fields
  const filteredPosts = useMemo(() => {
    const filtered = posts.filter(post => {
      const searchTerm = debouncedSearchQuery.toLowerCase();
      const matchesSearch = 
        !searchTerm || 
        (post.title && post.title.toLowerCase().includes(searchTerm)) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm)) ||
        (post.content && post.content.toLowerCase().includes(searchTerm)) ||
        (Array.isArray(post.tags) && post.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm)
        ));

      const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'popular':
          return (b.views || 0) - (a.views || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    return sorted;
  }, [posts, debouncedSearchQuery, statusFilter, sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: { color: 'bg-green-100 text-green-800', label: 'Published' },
      draft: { color: 'bg-yellow-100 text-yellow-800', label: 'Draft' },
      archived: { color: 'bg-gray-100 text-gray-800', label: 'Archived' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const handleDeletePost = (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      deletePostMutation.mutate(postId);
    }
  };

  const handleArchivePost = (postId, postTitle) => {
    if (window.confirm(`Are you sure you want to archive "${postTitle}"?`)) {
      archivePostMutation.mutate(postId);
    }
  };

  const handleUnarchivePost = (postId, postTitle) => {
    if (window.confirm(`Are you sure you want to move "${postTitle}" back to drafts?`)) {
      unarchivePostMutation.mutate(postId);
    }
  };

  const handlePublishPost = (postId, postTitle) => {
    if (window.confirm(`Are you sure you want to publish "${postTitle}"?`)) {
      publishPostMutation.mutate(postId);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const retryFetch = () => {
    setError(null);
    setCurrentPage(1);
    hasFetchedRef.current = false;
    setLoading(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
  };

  const hasActiveFilters = debouncedSearchQuery || statusFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setStatusFilter('all');
    setSortBy('newest');
    setCurrentPage(1);
    hasFetchedRef.current = false;
  };

  // Manual refresh function
  const handleRefresh = () => {
    hasFetchedRef.current = false;
    fetchUserPosts();
    toast.success('Refreshing posts...');
  };

  // Show initial auth loading
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

  // Show posts loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Loading your posts...</h2>
        </div>
      </div>
    );
  }

  // Check if user has researcher role
  const userId = user?.id || user?._id;
  const userRole = user?.role;

  if (!userId || userRole !== 'researcher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Researcher Access Required</h2>
            <p className="text-gray-600 mb-6">
              You need researcher privileges to manage posts.
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Posts</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={retryFetch}
                className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
              <Link
                to="/researcher/create"
                className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Post</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Posts</h1>
            <p className="text-gray-600">
              Manage your research publications and drafts
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              to="/researcher/create"
              className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Post</span>
            </Link>
          </div>
        </div>

        {/* Enhanced Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Enhanced Search */}
            <div className="w-full lg:w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts by title, content, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                    hasFetchedRef.current = false;
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="popular">Most Popular</option>
                <option value="title">Title A-Z</option>
              </select>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors text-sm px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <X className="h-4 w-4" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Results Info */}
          {debouncedSearchQuery && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Found {filteredPosts.length} posts matching "{debouncedSearchQuery}"
                {statusFilter !== 'all' && ` with status: ${statusFilter}`}
              </p>
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600">Active filters:</span>
            {debouncedSearchQuery && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Search: "{debouncedSearchQuery}"
                <button
                  onClick={clearSearch}
                  className="ml-1 hover:text-primary-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {statusFilter}
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    hasFetchedRef.current = false;
                  }}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Posts Grid */}
        <div className="space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {posts.length === 0 ? "No posts yet" : "No posts found"}
              </h3>
              <p className="text-gray-600 mb-6">
                {debouncedSearchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : "You haven't created any posts yet. Create your first post to get started!"
                }
              </p>
              {debouncedSearchQuery || statusFilter !== 'all' ? (
                <button
                  onClick={clearAllFilters}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Clear Filters
                </button>
              ) : (
                <Link
                  to="/researcher/create"
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Create Your First Post
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="text-sm text-gray-600">
                Showing {filteredPosts.length} of {posts.length} posts
                {debouncedSearchQuery && ` for "${debouncedSearchQuery}"`}
              </div>

              {filteredPosts.map((post) => (
                <div key={post._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      {/* Post Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {post.title}
                            </h3>
                            <p className="text-gray-600 mb-3 line-clamp-2">
                              {post.excerpt || 'No excerpt available'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {getStatusBadge(post.status)}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs">
                            {post.category?.name || 'Uncategorized'}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {post.status === 'published' 
                                ? `Published ${formatDate(post.publishedAt || post.createdAt)}`
                                : `Created ${formatDate(post.createdAt)}`
                              }
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Eye className="h-4 w-4" />
                              <span>{post.views || 0} views</span>
                            </div>
                            <span>{post.likes || 0} likes</span>
                            <span>{post.comments || 0} comments</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 lg:flex-col lg:space-x-0 lg:space-y-2">
                        <Link
                          to={`/post/${post.slug || post._id}`}
                          className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors p-2"
                          title="View Post"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="text-sm">View</span>
                        </Link>
                        
                        <Link
                          to={`/researcher/edit/${post._id}`}
                          className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors p-2"
                          title="Edit Post"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="text-sm">Edit</span>
                        </Link>

                        {/* Status-specific actions */}
                        {post.status === 'draft' && (
                          <button
                            onClick={() => handlePublishPost(post._id, post.title)}
                            disabled={publishPostMutation.isLoading}
                            className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors p-2 disabled:opacity-50"
                            title="Publish Post"
                          >
                            {publishPostMutation.isLoading ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            <span className="text-sm">Publish</span>
                          </button>
                        )}

                        {post.status !== 'archived' && post.status !== 'draft' && (
                          <button
                            onClick={() => handleArchivePost(post._id, post.title)}
                            disabled={archivePostMutation.isLoading}
                            className="flex items-center space-x-1 text-gray-600 hover:text-orange-600 transition-colors p-2 disabled:opacity-50"
                            title="Archive Post"
                          >
                            {archivePostMutation.isLoading ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <Archive className="h-4 w-4" />
                            )}
                            <span className="text-sm">Archive</span>
                          </button>
                        )}

                        {post.status === 'archived' && (
                          <button
                            onClick={() => handleUnarchivePost(post._id, post.title)}
                            disabled={unarchivePostMutation.isLoading}
                            className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors p-2 disabled:opacity-50"
                            title="Move to Drafts"
                          >
                            {unarchivePostMutation.isLoading ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <FolderOpen className="h-4 w-4" />
                            )}
                            <span className="text-sm">Unarchive</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          disabled={deletePostMutation.isLoading}
                          className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors p-2 disabled:opacity-50"
                          title="Delete Post"
                        >
                          {deletePostMutation.isLoading ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="text-sm">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * postsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * postsPerPage, totalPosts)}
                      </span>{' '}
                      of <span className="font-medium">{totalPosts}</span> results
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Previous Button */}
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </button>

                      {/* Page Numbers */}
                      {getPageNumbers().map(number => (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className={`px-3 py-2 border text-sm font-medium rounded-md ${
                            currentPage === number
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {number}
                        </button>
                      ))}

                      {/* Next Button */}
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
            <div className="text-sm text-gray-600">Total Posts</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {posts.filter(p => p.status === 'published').length}
            </div>
            <div className="text-sm text-gray-600">Published</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {posts.filter(p => p.status === 'draft').length}
            </div>
            <div className="text-sm text-gray-600">Drafts</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {posts.filter(p => p.status === 'archived').length}
            </div>
            <div className="text-sm text-gray-600">Archived</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPosts;