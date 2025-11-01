const Category = require('../models/Category');
const Post = require('../models/Post');
const { validateCategoryCreation } = require('../utils/validators');
const logger = require('../utils/logger');

// Standardized response helper
const sendSuccessResponse = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
    ...(data && { data })
  };
  return res.status(statusCode).json(response);
};

const sendErrorResponse = (res, message, error = null, statusCode = 500) => {
  const response = {
    success: false,
    message,
    ...(error && { error: error.message || error })
  };
  return res.status(statusCode).json(response);
};

const categoryController = {
  // Get all categories with post counts
  getCategories: async (req, res) => {
    try {
      const categories = await Category.find({ isActive: true })
        .sort({ name: 1 })
        .lean();

      // Get post counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const postCount = await Post.countDocuments({ 
            category: category._id, 
            status: 'published' 
          });
          return {
            ...category,
            postCount
          };
        })
      );

      return sendSuccessResponse(res, 'Categories retrieved successfully', { categories: categoriesWithCounts });

    } catch (error) {
      logger.error('Error fetching categories', { error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error fetching categories', error.message, 500);
    }
  },

  // Get single category with post count
  getCategory: async (req, res) => {
    try {
      const { categoryId } = req.params;

      const category = await Category.findById(categoryId);
      if (!category) {
        return sendErrorResponse(res, 'Category not found', null, 404);
      }

      const postCount = await Post.countDocuments({ 
        category: categoryId, 
        status: 'published' 
      });

      const categoryWithCount = {
        ...category.toObject(),
        postCount
      };

      return sendSuccessResponse(res, 'Category retrieved successfully', { category: categoryWithCount });

    } catch (error) {
      logger.error('Error fetching category', { categoryId, error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error fetching category', error.message, 500);
    }
  },

  // Get category by slug
  getCategoryBySlug: async (req, res) => {
    try {
      const { slug } = req.params;

      const category = await Category.findOne({ slug, isActive: true });
      if (!category) {
        return sendErrorResponse(res, 'Category not found', null, 404);
      }

      const postCount = await Post.countDocuments({ 
        category: category._id, 
        status: 'published' 
      });

      const categoryWithCount = {
        ...category.toObject(),
        postCount
      };

      return sendSuccessResponse(res, 'Category retrieved successfully', { category: categoryWithCount });

    } catch (error) {
      logger.error('Error fetching category by slug', { slug, error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error fetching category', error.message, 500);
    }
  },

  // Search categories
  searchCategories: async (req, res) => {
    try {
      const { q: searchTerm } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return sendErrorResponse(res, 'Search term must be at least 2 characters long', null, 400);
      }

      const categories = await Category.find({
        isActive: true,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      })
      .sort({ name: 1 })
      .limit(10)
      .lean();

      // Get post counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const postCount = await Post.countDocuments({ 
            category: category._id, 
            status: 'published' 
          });
          return {
            ...category,
            postCount
          };
        })
      );

      return sendSuccessResponse(res, 'Categories search completed', { 
        categories: categoriesWithCounts,
        searchTerm: searchTerm.trim()
      });

    } catch (error) {
      logger.error('Error searching categories', { error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error searching categories', error.message, 500);
    }
  },

  // Create category (admin only)
  createCategory: async (req, res) => {
    try {
      const { name, description, image } = req.body;

      // Check if category already exists
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') } 
      });
      
      if (existingCategory) {
        return sendErrorResponse(res, 'Category with this name already exists', null, 409);
      }

      const category = new Category({
        name: name.trim(),
        description: description.trim(),
        image
      });

      await category.save();

      return sendSuccessResponse(res, 'Category created successfully', { category }, 201);

    } catch (error) {
      logger.error('Error creating category', { error: error.message, stack: error.stack });
      
      if (error.code === 11000) {
        return sendErrorResponse(res, 'Category with this name or slug already exists', null, 409);
      }
      
      return sendErrorResponse(res, 'Error creating category', error.message, 500);
    }
  },

  // Update category (admin only)
  updateCategory: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const updateData = req.body;

      // If name is being updated, check for duplicates
      if (updateData.name) {
        const existingCategory = await Category.findOne({
          name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
          _id: { $ne: categoryId }
        });
        
        if (existingCategory) {
          return sendErrorResponse(res, 'Category with this name already exists', null, 409);
        }
      }

      const category = await Category.findByIdAndUpdate(
        categoryId,
        { ...updateData, $inc: { __v: 1 } },
        { new: true, runValidators: true }
      );

      if (!category) {
        return sendErrorResponse(res, 'Category not found', null, 404);
      }

      return sendSuccessResponse(res, 'Category updated successfully', { category });

    } catch (error) {
      logger.error('Error updating category', { categoryId, error: error.message, stack: error.stack });
      
      if (error.code === 11000) {
        return sendErrorResponse(res, 'Category with this name or slug already exists', null, 409);
      }
      
      return sendErrorResponse(res, 'Error updating category', error.message, 500);
    }
  },

  // Delete category (admin only) - Soft delete
  deleteCategory: async (req, res) => {
    try {
      const { categoryId } = req.params;

      const category = await Category.findById(categoryId);
      if (!category) {
        return sendErrorResponse(res, 'Category not found', null, 404);
      }

      // Check if category has posts
      const postCount = await Post.countDocuments({ category: categoryId });
      if (postCount > 0) {
        return sendErrorResponse(res, 'Cannot delete category with existing posts. Move or delete posts first.', null, 400);
      }

      // Soft delete instead of hard delete
      await Category.findByIdAndUpdate(categoryId, { isActive: false });

      return sendSuccessResponse(res, 'Category deleted successfully');

    } catch (error) {
      logger.error('Error deleting category', { categoryId, error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error deleting category', error.message, 500);
    }
  },

  // Get posts by category with pagination
  getCategoryPosts: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const category = await Category.findById(categoryId);
      if (!category) {
        return sendErrorResponse(res, 'Category not found', null, 404);
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: [
          { path: 'author', select: 'firstName lastName avatar' },
          { path: 'category', select: 'name slug' }
        ]
      };

      const posts = await Post.paginate(
        { category: categoryId, status: 'published' },
        options
      );

      const responseData = {
        category,
        posts: {
          docs: posts.docs,
          pagination: {
            total: posts.totalDocs,
            limit: posts.limit,
            page: posts.page,
            pages: posts.totalPages,
            hasNext: posts.hasNextPage,
            hasPrev: posts.hasPrevPage
          }
        }
      };

      return sendSuccessResponse(res, 'Category posts retrieved successfully', responseData);

    } catch (error) {
      logger.error('Error fetching category posts', { categoryId, error: error.message, stack: error.stack });
      return sendErrorResponse(res, 'Error fetching category posts', error.message, 500);
    }
  }
};

module.exports = categoryController;