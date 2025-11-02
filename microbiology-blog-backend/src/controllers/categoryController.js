const Category = require('../models/Category');
const Post = require('../models/Post');
const logger = require('../utils/logger');

// Standardized response helper (unchanged)
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

  // Create category (admin only) - UPDATED to work with your schema
  createCategory: async (req, res) => {
    try {
      const { name, description, image } = req.body;

      // Basic validation
      if (!name || !name.trim()) {
        return sendErrorResponse(res, 'Category name is required', null, 400);
      }

      if (!description || !description.trim()) {
        return sendErrorResponse(res, 'Category description is required', null, 400);
      }

      // Check name length (matches your schema validation)
      if (name.length > 50) {
        return sendErrorResponse(res, 'Category name cannot exceed 50 characters', null, 400);
      }

      // Check description length (matches your schema validation)
      if (description.length > 200) {
        return sendErrorResponse(res, 'Description cannot exceed 200 characters', null, 400);
      }

      // Create category - let Mongoose handle slug generation via pre-save hook
      const category = new Category({
        name: name.trim(),
        description: description.trim(),
        image: image || undefined // Only include if provided
      });

      await category.save();

      return sendSuccessResponse(res, 'Category created successfully', { category }, 201);

    } catch (error) {
      logger.error('Error creating category', { error: error.message, stack: error.stack });
      
      // Handle duplicate key errors (name or slug uniqueness)
      if (error.code === 11000) {
        const field = error.keyPattern.name ? 'name' : 'slug';
        return sendErrorResponse(res, `Category with this ${field} already exists`, null, 409);
      }
      
      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return sendErrorResponse(res, 'Validation error', errors.join(', '), 400);
      }
      
      return sendErrorResponse(res, 'Error creating category', error.message, 500);
    }
  },

  // Update category (admin only) - UPDATED to work with your schema
  updateCategory: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { name, description, image, isActive } = req.body;

      const category = await Category.findById(categoryId);
      if (!category) {
        return sendErrorResponse(res, 'Category not found', null, 404);
      }

      // Prepare update data
      const updateData = {};
      
      if (name !== undefined) {
        if (!name.trim()) {
          return sendErrorResponse(res, 'Category name cannot be empty', null, 400);
        }
        if (name.length > 50) {
          return sendErrorResponse(res, 'Category name cannot exceed 50 characters', null, 400);
        }
        updateData.name = name.trim();
      }

      if (description !== undefined) {
        if (!description.trim()) {
          return sendErrorResponse(res, 'Category description cannot be empty', null, 400);
        }
        if (description.length > 200) {
          return sendErrorResponse(res, 'Description cannot exceed 200 characters', null, 400);
        }
        updateData.description = description.trim();
      }

      if (image !== undefined) {
        updateData.image = image;
      }

      if (isActive !== undefined) {
        updateData.isActive = isActive;
      }

      // If name is being updated, check for duplicates (excluding current category)
      if (updateData.name) {
        const existingCategory = await Category.findOne({
          name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
          _id: { $ne: categoryId }
        });
        
        if (existingCategory) {
          return sendErrorResponse(res, 'Category with this name already exists', null, 409);
        }
      }

      // Update category - let Mongoose handle slug regeneration if name changed
      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        updateData,
        { new: true, runValidators: true }
      );

      return sendSuccessResponse(res, 'Category updated successfully', { category: updatedCategory });

    } catch (error) {
      logger.error('Error updating category', { categoryId, error: error.message, stack: error.stack });
      
      if (error.code === 11000) {
        return sendErrorResponse(res, 'Category with this name or slug already exists', null, 409);
      }
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return sendErrorResponse(res, 'Validation error', errors.join(', '), 400);
      }
      
      return sendErrorResponse(res, 'Error updating category', error.message, 500);
    }
  },

  // Delete category (admin only) - Soft delete (unchanged)
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

  // Get posts by category with pagination - FIXED to maintain frontend structure
  getCategoryPosts: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const category = await Category.findById(categoryId);
      if (!category) {
        return sendErrorResponse(res, 'Category not found', null, 404);
      }

      // Use standard Mongoose queries (maintains frontend structure)
      const posts = await Post.find({ category: categoryId, status: 'published' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'firstName lastName avatar')
        .populate('category', 'name slug')
        .lean();

      const totalPosts = await Post.countDocuments({ category: categoryId, status: 'published' });
      const totalPages = Math.ceil(totalPosts / limit);

      // Maintain exact frontend response structure
      const responseData = {
        category,
        posts: {
          docs: posts,
          pagination: {
            total: totalPosts,
            limit: limit,
            page: page,
            pages: totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
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