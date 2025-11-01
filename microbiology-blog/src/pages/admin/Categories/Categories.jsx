import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { categoriesAPI } from '../../../services/api/categories';
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  FileText,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminCategories = () => {
  const { user: currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ 
    name: '', 
    description: '' 
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getCategories();
      
      if (response.success) {
        setCategories(response.data.categories || []);
      } else {
        throw new Error(response.message || 'Failed to fetch categories');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setUpdating('creating');
      const response = await categoriesAPI.createCategory(categoryForm);
      
      if (response.success) {
        toast.success('Category created successfully');
        setCategoryForm({ name: '', description: '' });
        setIsCreating(false);
        fetchCategories();
      } else {
        throw new Error(response.message || 'Failed to create category');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    } finally {
      setUpdating(null);
    }
  };

  const handleEditCategory = (category) => {
    setIsEditing(category._id);
    setCategoryForm({
      name: category.name,
      description: category.description
    });
  };

  const handleUpdateCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setUpdating(isEditing);
      const response = await categoriesAPI.updateCategory(isEditing, categoryForm);
      
      if (response.success) {
        toast.success('Category updated successfully');
        setCategoryForm({ name: '', description: '' });
        setIsEditing(null);
        fetchCategories();
      } else {
        throw new Error(response.message || 'Failed to update category');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update category');
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        setUpdating(categoryId);
        const response = await categoriesAPI.deleteCategory(categoryId);
        
        if (response.success) {
          toast.success('Category deleted successfully');
          fetchCategories();
        } else {
          throw new Error(response.message || 'Failed to delete category');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete category');
      } finally {
        setUpdating(null);
      }
    }
  };

  const cancelForm = () => {
    setIsCreating(false);
    setIsEditing(null);
    setCategoryForm({ name: '', description: '' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <FolderOpen className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-600 mb-6">
              This area is restricted to administrators only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Category Management</h1>
            <p className="text-gray-600">
              Manage research categories and organize content
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors mt-4 lg:mt-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Category</span>
          </button>
        </div>

        {/* Create/Edit Category Form */}
        {(isCreating || isEditing) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isEditing ? 'Edit Category' : 'Create New Category'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Enter category description"
                />
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={isEditing ? handleUpdateCategory : handleCreateCategory}
                  disabled={updating === (isEditing || 'creating')}
                  className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {updating === (isEditing || 'creating') && (
                    <Loader className="h-4 w-4 animate-spin" />
                  )}
                  <span>
                    {isEditing ? 'Update Category' : 'Create Category'}
                  </span>
                </button>
                <button
                  onClick={cancelForm}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCategories.map((category) => (
            <div key={category._id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {category.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEditCategory(category)}
                    disabled={updating === category._id}
                    className="text-primary-600 hover:text-primary-800 disabled:opacity-50 transition-colors p-1 rounded"
                    title="Edit Category"
                  >
                    {updating === category._id ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Edit className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category._id)}
                    disabled={updating === category._id}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors p-1 rounded"
                    title="Delete Category"
                  >
                    {updating === category._id ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>{category.postCount || 0} posts</span>
                </div>
                <span>Created {formatDate(category.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCategories.length === 0 && !loading && (
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No categories found' : 'No categories in the system'}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first category to get started'
              }
            </p>
          </div>
        )}

        {/* Loading State for Categories */}
        {loading && (
          <div className="text-center py-8">
            <Loader className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading categories...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;