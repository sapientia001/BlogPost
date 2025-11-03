import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../../contexts/AuthContext';
import { useApi } from '../../../hooks/useApi';
import { postsAPI } from '../../../services/api/posts';
import { categoriesAPI } from '../../../services/api/categories';
import { 
  Save, 
  Upload, 
  Eye,
  X,
  Loader,
  ArrowLeft,
  Archive,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// Import Jodit Editor
import JoditEditor from 'jodit-react';

// Constants
const VALIDATION_RULES = {
  title: {
    required: 'Title is required',
    minLength: { value: 10, message: 'Title must be at least 10 characters' }
  },
  excerpt: {
    maxLength: { value: 300, message: 'Excerpt cannot exceed 300 characters' }
  },
  category: {
    required: 'Category is required'
  }
};

const IMAGE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptedTypes: 'image/*'
};

const STATUS_OPTIONS = {
  draft: { value: 'draft', label: 'Save as Draft', icon: BookOpen },
  published: { value: 'published', label: 'Publish Now', icon: Eye },
  archived: { value: 'archived', label: 'Archive Post', icon: Archive }
};

// Jodit Editor configuration
const EDITOR_CONFIG = {
  readonly: false,
  placeholder: 'Write your research content here...',
  height: 500,
  toolbarAdaptive: false,
  spellcheck: true,
  language: 'en',
  toolbarButtonSize: 'medium',
  buttons: [
    'bold', 'italic', 'underline', 'strikethrough', '|',
    'superscript', 'subscript', '|',
    'ul', 'ol', 'outdent', 'indent', '|',
    'font', 'fontsize', 'brush', 'paragraph', '|',
    'align', '|',
    'link', 'image', 'table', '|',
    'source', '|',
    'undo', 'redo', '|',
    'preview', 'fullsize'
  ],
  uploader: {
    insertImageAsBase64URI: true
  },
  style: {
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px'
  }
};

// Custom Hooks
const usePostData = (postId, user, navigate) => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPost = useCallback(async () => {
    if (!user || !postId) {
      setError('Authentication required');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await postsAPI.getPostForEdit(postId);
      
      if (response?.success && response.data?.post) {
        setPost(response.data.post);
      } else {
        throw new Error(response?.message || 'Post not found or inaccessible');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load post');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [postId, user, navigate]);

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
      if (response?.success && response.data) {
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

// Helper Functions
const isSameUser = (userId1, userId2) => {
  if (!userId1 || !userId2) return false;
  return userId1.toString() === userId2.toString();
};

const convertImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

const validateImageFile = (file) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file (JPEG, PNG, GIF, WebP)');
  }
  
  if (file.size > IMAGE_CONFIG.maxSize) {
    throw new Error('Image size must be less than 5MB');
  }
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

const ErrorState = ({ error, onRetry, userRole }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {error ? 'Error Loading Post' : 'Post Not Found'}
        </h2>
        <p className="text-gray-600 mb-6">
          {error || "The post you're trying to edit doesn't exist or you don't have permission to edit it."}
        </p>
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
            onClick={() => window.history.back()}
            className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  </div>
);

const AccessDenied = ({ userRole, navigate }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h2>
        <p className="text-gray-600 mb-6">
          You need researcher or admin privileges to edit posts.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  </div>
);

const EditPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { usePutMutation } = useApi();

  // State
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data Hooks
  const { post, loading: loadingPost, error: postError, refetch: refetchPost } = usePostData(postId, user, navigate);
  const { categories, loading: loadingCategories } = useCategories();

  // Form Hook
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm();

  // Effects
  useEffect(() => {
    if (post) {
      setContent(post.content || '');
      reset({
        title: post.title || '',
        excerpt: post.excerpt || '',
        category: post.category?._id || post.category || '',
        tags: post.tags?.join(', ') || '',
        status: post.status || 'draft'
      });
      
      if (post.featuredImage) {
        setImagePreview(post.featuredImage);
      }
    }
  }, [post, reset]);

  // Mutations
  const updatePostMutation = usePutMutation(
    (postData) => postsAPI.updatePost(postId, postData),
    {
      onSuccess: (data) => {
        setIsSubmitting(false);
        const status = watch('status');
        
        const successMessages = {
          published: 'Post published successfully!',
          archived: 'Post archived successfully!',
          draft: 'Post saved as draft!'
        };
        
        toast.success(successMessages[status] || 'Post updated successfully!');
        navigate(user.role === 'admin' ? '/admin/posts' : '/researcher/posts');
      },
      onError: (error) => {
        setIsSubmitting(false);
        
        const errorMessages = {
          404: 'Post not found. It may have been deleted.',
          403: 'You no longer have permission to edit this post.',
          400: error.response?.data?.message || 'Invalid data provided'
        };
        
        toast.error(errorMessages[error.response?.status] || 
                   error.response?.data?.message || 
                   'Failed to update post. Please try again.');
      },
    }
  );

  // Event Handlers
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      validateImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const onSubmit = async (data) => {
    if (!user || !post || !content.trim()) {
      toast.error(!content.trim() ? 'Content is required' : 'User or post data not available');
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        title: data.title,
        excerpt: data.excerpt,
        content: content.trim(),
        category: data.category,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        status: data.status,
      };

      if (imageFile) {
        const base64Image = await convertImageToBase64(imageFile);
        postData.image = base64Image;
      } else if (!imagePreview && post.featuredImage) {
        postData.featuredImage = null;
      }

      updatePostMutation.mutate(postData);
    } catch (error) {
      console.error('Error in onSubmit:', error);
      setIsSubmitting(false);
      toast.error('An unexpected error occurred');
    }
  };

  // Computed Values
  const isPostAuthor = user && post && post.author && isSameUser(
    user._id || user.id, 
    post.author._id || post.author
  );

  const getAvailableStatusOptions = () => {
    const options = [
      STATUS_OPTIONS.draft,
      STATUS_OPTIONS.published
    ];

    if (user.role === 'researcher' && isPostAuthor) {
      options.push(STATUS_OPTIONS.archived);
    }

    return options;
  };

  const statusOptions = getAvailableStatusOptions();
  const currentStatus = watch('status');

  // Early Returns
  if (!user) {
    return <LoadingState message="Loading..." />;
  }

  if (user.role !== 'researcher' && user.role !== 'admin') {
    return <AccessDenied userRole={user.role} navigate={navigate} />;
  }

  if (loadingPost) {
    return <LoadingState message="Loading post data..." />;
  }

  if (postError || !post) {
    return <ErrorState error={postError} onRetry={refetchPost} userRole={user.role} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <PostHeader 
          user={user}
          post={post}
          isPostAuthor={isPostAuthor}
          navigate={navigate}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <BasicInfoSection
            register={register}
            errors={errors}
            categories={categories}
            loadingCategories={loadingCategories}
            validationRules={VALIDATION_RULES}
          />

          {/* Featured Image */}
          <FeaturedImageSection
            imagePreview={imagePreview}
            imageFile={imageFile}
            onImageUpload={handleImageUpload}
            onRemoveImage={removeImage}
          />

          {/* Content - Updated with Jodit Editor */}
          <ContentSection
            content={content}
            onContentChange={setContent}
          />

          {/* Publish Options */}
          <PublishOptionsSection
            user={user}
            isPostAuthor={isPostAuthor}
            register={register}
            statusOptions={statusOptions}
            currentStatus={currentStatus}
            isSubmitting={isSubmitting}
            onCancel={() => navigate(user.role === 'admin' ? '/admin/posts' : '/researcher/posts')}
            content={content}
          />
        </form>
      </div>
    </div>
  );
};

// Sub-components
const PostHeader = ({ user, post, isPostAuthor, navigate }) => (
  <div className="mb-8">
    <button
      onClick={() => navigate(user.role === 'admin' ? '/admin/posts' : '/researcher/posts')}
      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      <span>Back to {user.role === 'admin' ? 'All Posts' : 'My Posts'}</span>
    </button>
    
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {user.role === 'admin' ? 'Edit Post' : 'Edit My Post'}
        </h1>
        <p className="text-gray-600">
          {user.role === 'admin' 
            ? 'Moderate and update post content' 
            : 'Update your research publication'
          }
        </p>
      </div>
      
      <div className="flex flex-col items-end space-y-2">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          user.role === 'admin' 
            ? 'bg-purple-100 text-purple-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {user.role === 'admin' ? 'Administrator' : 'Researcher'}
        </span>
        
        {user.role === 'admin' && !isPostAuthor && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Editing Researcher's Post
          </span>
        )}
      </div>
    </div>

    <PostMetadata post={post} />
    
    {user.role === 'admin' && !isPostAuthor && (
      <AdminNote />
    )}
  </div>
);

const PostMetadata = ({ post }) => (
  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
    <div>
      <span className="font-medium">Current Status:</span>{' '}
      <span className={`font-semibold ${
        post.status === 'published' ? 'text-green-600' : 
        post.status === 'archived' ? 'text-orange-600' : 'text-yellow-600'
      }`}>
        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
      </span>
    </div>
    
    <div>
      <span className="font-medium">Author:</span>{' '}
      <span className="font-semibold">
        {post.author?.firstName} {post.author?.lastName}
      </span>
    </div>
    
    <div>
      <span className="font-medium">Created:</span>{' '}
      <span className="font-semibold">
        {new Date(post.createdAt).toLocaleDateString()}
      </span>
    </div>
  </div>
);

const AdminNote = () => (
  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
    <div className="flex items-center">
      <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
      <p className="text-sm text-yellow-800">
        <strong>Admin Note:</strong> You are editing a researcher's post. 
        Researchers have exclusive control over archiving/unarchiving their own posts.
      </p>
    </div>
  </div>
);

const BasicInfoSection = ({ register, errors, categories, loadingCategories, validationRules }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
    
    <div className="mb-6">
      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
        Title *
      </label>
      <input
        type="text"
        id="title"
        {...register('title', validationRules.title)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        placeholder="Enter a compelling title for your research"
      />
      {errors.title && (
        <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
      )}
    </div>

    <div className="mb-6">
      <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
        Excerpt
      </label>
      <textarea
        id="excerpt"
        {...register('excerpt', validationRules.excerpt)}
        rows="3"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        placeholder="Brief summary of your research (appears in post listings)"
      />
      {errors.excerpt && (
        <p className="mt-1 text-sm text-red-600">{errors.excerpt.message}</p>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <select
          id="category"
          {...register('category', validationRules.category)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          disabled={loadingCategories}
        >
          <option value="">
            {loadingCategories ? 'Loading categories...' : 'Select a category'}
          </option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
        {loadingCategories && (
          <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
            <Loader className="h-4 w-4 animate-spin" />
            <span>Loading categories...</span>
          </div>
        )}
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <input
          type="text"
          id="tags"
          {...register('tags')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          placeholder="antibiotics, resistance, bacteria (comma separated)"
        />
        <p className="mt-1 text-sm text-gray-500">
          Separate tags with commas
        </p>
      </div>
    </div>
  </div>
);

const FeaturedImageSection = ({ imagePreview, imageFile, onImageUpload, onRemoveImage }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-4">Featured Image</h2>
    
    {imagePreview ? (
      <div className="relative">
        <img
          src={imagePreview}
          alt="Preview"
          className="w-full h-64 object-cover rounded-lg"
        />
        <button
          type="button"
          onClick={onRemoveImage}
          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="text-sm text-gray-500 mt-2">
          {imageFile ? 'New image selected' : 'Current image'}
        </p>
      </div>
    ) : (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">Upload a new featured image for your post</p>
        <p className="text-sm text-gray-500 mb-4">Supports: JPEG, PNG, GIF, WebP (Max 5MB)</p>
        <input
          type="file"
          id="image"
          accept={IMAGE_CONFIG.acceptedTypes}
          onChange={onImageUpload}
          className="hidden"
        />
        <label
          htmlFor="image"
          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors cursor-pointer"
        >
          Choose Image
        </label>
      </div>
    )}
  </div>
);

// Updated ContentSection with Jodit Editor
const ContentSection = ({ content, onContentChange }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-4">Content *</h2>
    <JoditEditor
      value={content}
      config={EDITOR_CONFIG}
      onBlur={(newContent) => onContentChange(newContent)}
      onChange={(newContent) => {}}
    />
    {!content && (
      <p className="mt-3 text-sm text-red-600">Content is required</p>
    )}
  </div>
);

const PublishOptionsSection = ({ user, isPostAuthor, register, statusOptions, currentStatus, isSubmitting, onCancel, content }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h2 className="text-xl font-bold text-gray-900 mb-4">
      {user.role === 'admin' ? 'Post Management' : 'Publish Options'}
    </h2>
    
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {statusOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <label key={option.value} className="flex items-center space-x-2">
              <input
                type="radio"
                value={option.value}
                {...register('status')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <IconComponent className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          );
        })}
      </div>

      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <SubmitButton 
          currentStatus={currentStatus}
          isSubmitting={isSubmitting}
          disabled={!content}
        />
      </div>
    </div>

    <PublishNote userRole={user.role} />
  </div>
);

const SubmitButton = ({ currentStatus, isSubmitting, disabled }) => {
  const getButtonText = () => {
    if (isSubmitting) {
      return {
        published: 'Publishing...',
        archived: 'Archiving...',
        draft: 'Saving...'
      }[currentStatus] || 'Saving...';
    }
    
    return {
      published: 'Update & Publish',
      archived: 'Update & Archive',
      draft: 'Save Changes'
    }[currentStatus] || 'Save Changes';
  };

  return (
    <button
      type="submit"
      disabled={isSubmitting || disabled}
      className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isSubmitting ? (
        <>
          <Loader className="h-4 w-4 animate-spin" />
          <span>{getButtonText()}</span>
        </>
      ) : (
        <>
          <Save className="h-4 w-4" />
          <span>{getButtonText()}</span>
        </>
      )}
    </button>
  );
};

const PublishNote = ({ userRole }) => (
  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <p className="text-sm text-blue-800">
      <strong>Note:</strong>{' '}
      {userRole === 'admin' 
        ? 'You can edit content and change between draft/published status. Researchers manage their own archiving.'
        : 'You have full control over your post lifecycle including archiving and publishing.'
      }
    </p>
  </div>
);

export default EditPost;