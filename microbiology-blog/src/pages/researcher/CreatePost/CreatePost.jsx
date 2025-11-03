import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useApi } from '../../../hooks/useApi';
import { postsAPI } from '../../../services/api/posts';
import { categoriesAPI } from '../../../services/api/categories';
import { 
  Save, 
  Upload, 
  X,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';

// Import Jodit Editor
import JoditEditor from 'jodit-react';

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const { usePostMutation } = useApi();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    defaultValues: {
      title: '',
      excerpt: '',
      category: '',
      tags: '',
      status: 'draft'
    }
  });

  // Jodit Editor configuration
  const editorConfig = {
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

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getCategories();
        setCategories(response.data.categories);
      } catch (error) {
        toast.error('Failed to load categories. Please refresh the page.');
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const createPostMutation = usePostMutation(
    (postData) => postsAPI.createPost(postData),
    {
      onSuccess: (data) => {
        setIsSubmitting(false);
        const status = watch('status');
        if (status === 'published') {
          toast.success('Post published successfully!');
        } else {
          toast.success('Draft saved successfully!');
        }
        navigate('/researcher/posts');
      },
      onError: (error) => {
        setIsSubmitting(false);
        toast.error(error.response?.data?.message || 'Failed to create post. Please try again.');
      },
    }
  );

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (JPEG, PNG, GIF, WebP)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (data) => {
    if (!user || user.role !== 'researcher') {
      toast.error('Only researchers can create posts');
      return;
    }

    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    if (!data.category) {
      toast.error('Please select a category');
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        title: data.title,
        excerpt: data.excerpt,
        content: content,
        category: data.category,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        status: data.status,
      };

      if (imageFile) {
        try {
          const base64Image = await convertImageToBase64(imageFile);
          postData.image = base64Image;
        } catch (imageError) {
          toast.error('Image upload failed. Creating post without image.');
        }
      }

      createPostMutation.mutate(postData);
    } catch (error) {
      setIsSubmitting(false);
      toast.error('An unexpected error occurred');
    }
  };

  if (!user || user.role !== 'researcher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Researcher Access Required</h2>
            <p className="text-gray-600 mb-6">
              You need researcher privileges to create posts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Post</h1>
          <p className="text-gray-600">
            Share your research findings with the microbiology community
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                {...register('title', { 
                  required: 'Title is required',
                  minLength: {
                    value: 10,
                    message: 'Title must be at least 10 characters'
                  }
                })}
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
                {...register('excerpt', {
                  maxLength: {
                    value: 300,
                    message: 'Excerpt cannot exceed 300 characters'
                  }
                })}
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
                  {...register('category', { required: 'Category is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
                {categories.length === 0 && !loadingCategories && (
                  <p className="mt-1 text-sm text-yellow-600">
                    No categories available. Please contact administrator.
                  </p>
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

          {/* Featured Image */}
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
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Upload a featured image for your post</p>
                <p className="text-sm text-gray-500 mb-4">Supports: JPEG, PNG, GIF, WebP (Max 5MB)</p>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageUpload}
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

          {/* Content - Replaced with Jodit Editor */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Content *</h2>
            <JoditEditor
              value={content}
              config={editorConfig}
              onBlur={(newContent) => setContent(newContent)}
              onChange={(newContent) => {}}
            />
            {!content && (
              <p className="mt-3 text-sm text-red-600">Content is required</p>
            )}
          </div>

          {/* Publish Options */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Publish</h2>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="draft"
                    {...register('status')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Save as Draft</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="published"
                    {...register('status')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Publish Now</span>
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/researcher/posts')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !content}
                  className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>
                        {watch('status') === 'published' ? 'Publishing...' : 'Saving...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>
                        {watch('status') === 'published' ? 'Publish' : 'Save Draft'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;