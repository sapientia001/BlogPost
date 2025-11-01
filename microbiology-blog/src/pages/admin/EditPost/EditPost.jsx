import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { postsAPI } from '../../../services/api/posts';
import { categoriesAPI } from '../../../services/api/categories';
import { ArrowLeft, Save, Loader, AlertCircle, Eye, Archive, BookOpen, Trash2, Star, Flag } from 'lucide-react';
import toast from 'react-hot-toast';

// Constants
const STATUS_CONFIG = {
  published: { color: 'bg-green-100 text-green-800', label: 'Published', icon: Eye },
  draft: { color: 'bg-yellow-100 text-yellow-800', label: 'Draft', icon: BookOpen },
  archived: { color: 'bg-gray-100 text-gray-800', label: 'Archived', icon: Archive }
};

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', icon: BookOpen },
  { value: 'published', label: 'Published', icon: Eye },
  { value: 'archived', label: 'Archived', icon: Archive }
];

const INITIAL_FORM_DATA = {
  title: '',
  excerpt: '',
  content: '',
  category: '',
  tags: '',
  status: 'draft',
  featured: false
};

// Custom Hooks
const usePostData = (postId, currentUser, navigate) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPost = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'admin') {
      setError('Admin access required');
      navigate('/admin/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await postsAPI.getPostForEdit(postId);
      
      if (response.success) {
        setPost(response.data.post);
      } else {
        throw new Error(response.message || 'Failed to fetch post');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId, currentUser, navigate]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return { post, loading, error, refetch: fetchPost };
};

const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesAPI.getCategories();
      if (response.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading };
};

const usePostForm = (post) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        category: post.category?._id || post.category || '',
        tags: post.tags?.join(', ') || '',
        status: post.status || 'draft',
        featured: post.featured || false
      });
    }
  }, [post]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (!formData.content.trim()) {
      toast.error('Content is required');
      return false;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return false;
    }
    return true;
  };

  const getSubmitData = () => ({
    title: formData.title.trim(),
    excerpt: formData.excerpt.trim(),
    content: formData.content.trim(),
    category: formData.category,
    status: formData.status,
    featured: formData.featured,
    tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
  });

  return {
    formData,
    handleInputChange,
    validateForm,
    getSubmitData
  };
};

// Components
const LoadingState = ({ message = "Loading..." }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <Loader className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900">{message}</h2>
    </div>
  </div>
);

const ErrorState = ({ error, onRetry, onBack }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Post</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={onBack}
            className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Back to Posts
          </button>
        </div>
      </div>
    </div>
  </div>
);

const AccessDenied = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
        <p className="text-gray-600 mb-6">
          This area is restricted to administrators only.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const IconComponent = config.icon;
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <IconComponent className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
};

const AdminEditPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  // Data Hooks
  const { post, loading: loadingPost, error: postError, refetch: refetchPost } = usePostData(postId, currentUser, navigate);
  const { categories, loading: loadingCategories } = useCategories();
  const { formData, handleInputChange, validateForm, getSubmitData } = usePostForm(post);
  
  // State
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [moderating, setModerating] = useState(false);

  // Early Returns
  if (!currentUser || currentUser.role !== 'admin') {
    return <AccessDenied />;
  }

  if (loadingPost) {
    return <LoadingState message="Loading post..." />;
  }

  if (postError) {
    return (
      <ErrorState 
        error={postError} 
        onRetry={refetchPost}
        onBack={() => navigate('/admin/posts')}
      />
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Post Not Found</h2>
            <p className="text-gray-600 mb-6">
              The post you're trying to edit doesn't exist or you may not have access to edit it.
            </p>
            <button
              onClick={() => navigate('/admin/posts')}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Back to Posts
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Event Handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      const updateData = getSubmitData();
      
      const response = await postsAPI.updatePost(postId, updateData);
      
      if (response.success) {
        toast.success('Post updated successfully');
        navigate('/admin/posts');
      } else {
        throw new Error(response.message || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      
      const errorMessages = {
        403: 'You no longer have permission to edit this post.',
        404: 'Post not found. It may have been deleted or you may not have access.',
        500: 'Server error. Please try again later.'
      };
      
      toast.error(errorMessages[error.response?.status] || 
                 error.response?.data?.message || 
                 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await postsAPI.deletePost(postId);
      
      if (response.success) {
        toast.success('Post deleted successfully');
        navigate('/admin/posts');
      } else {
        throw new Error(response.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(error.response?.data?.message || 'Error deleting post');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleOffensive = async () => {
    const action = post.isOffensive ? 'remove offense flag from' : 'mark as offensive';
    
    if (!window.confirm(`Are you sure you want to ${action} this post?`)) {
      return;
    }

    try {
      setModerating(true);
      
      let response;
      if (post.isOffensive) {
        response = await postsAPI.removeOffense(postId);
      } else {
        response = await postsAPI.markAsOffensive(postId, {
          reason: 'Marked as offensive by admin'
        });
      }
      
      if (response.success) {
        toast.success(`Post ${post.isOffensive ? 'removed from offensive content' : 'marked as offensive'}`);
        refetchPost();
      } else {
        throw new Error(response.message || `Failed to ${action} post`);
      }
    } catch (error) {
      console.error('Error moderating post:', error);
      toast.error(error.response?.data?.message || `Error ${action} post`);
    } finally {
      setModerating(false);
    }
  };

  // Computed Values
  const isPostAuthor = post.author && currentUser._id === post.author._id;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/posts')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Posts
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
              <p className="text-gray-600 mt-2">
                Editing: <strong>{post.title}</strong>
              </p>
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Administrator
              </span>
              <StatusBadge status={post.status} />
              {post.isOffensive && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <Flag className="h-3 w-3 mr-1" />
                  Offensive Content
                </span>
              )}
              {post.featured && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </span>
              )}
            </div>
          </div>

          {/* Post Metadata */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Author:</span>{' '}
              <span className="font-semibold">
                {post.author?.firstName} {post.author?.lastName}
                {isPostAuthor && ' (You)'}
              </span>
            </div>
            
            <div>
              <span className="font-medium">Created:</span>{' '}
              <span className="font-semibold">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            {post.publishedAt && (
              <div>
                <span className="font-medium">Published:</span>{' '}
                <span className="font-semibold">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {post.category && (
              <div>
                <span className="font-medium">Category:</span>{' '}
                <span className="font-semibold">
                  {post.category.name}
                </span>
              </div>
            )}

            <div>
              <span className="font-medium">Views:</span>{' '}
              <span className="font-semibold">{post.views || 0}</span>
            </div>

            <div>
              <span className="font-medium">Likes:</span>{' '}
              <span className="font-semibold">{post.likesCount || 0}</span>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleToggleOffensive}
              disabled={moderating}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 ${
                post.isOffensive 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {moderating ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Flag className="h-4 w-4" />
              )}
              <span>{post.isOffensive ? 'Remove Offense Flag' : 'Mark as Offensive'}</span>
            </button>
            
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {deleting ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span>Delete Post</span>
            </button>
          </div>

          {/* Admin Note */}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
              <p className="text-sm text-blue-800">
                <strong>Admin Note:</strong> You have full control over this post. 
                You can edit all content, change status, feature posts, and moderate content.
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Enter post title"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Brief summary of the post"
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.excerpt.length}/300 characters
              </p>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-vertical"
                placeholder="Post content..."
              />
            </div>

            {/* Category & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {loadingCategories && (
                  <p className="mt-1 text-sm text-gray-500">Loading categories...</p>
                )}
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Separate tags with commas
                </p>
              </div>
            </div>

            {/* Admin Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Featured */}
              <div className="flex items-center space-x-3 pt-6">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="featured" className="block text-sm font-medium text-gray-700">
                  Feature this post
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-200 gap-4">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate('/admin/posts')}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-semibold text-center"
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-semibold"
                >
                  {deleting ? (
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Post
                </button>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-semibold w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminEditPost;