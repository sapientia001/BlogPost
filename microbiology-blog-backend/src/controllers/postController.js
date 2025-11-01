const getPosts = require('../services/postServices/getPosts');
const getPost = require('../services/postServices/getPost');
const createPost = require('../services/postServices/createPost');
const updatePost = require('../services/postServices/updatePost');
const deletePost = require('../services/postServices/deletePost');
const archivePost = require('../services/postServices/archivePost');
const unarchivePost = require('../services/postServices/unarchivePost');
const markAsOffensive = require('../services/postServices/markAsOffensive');
const removeOffense = require('../services/postServices/removeOffense');
const getOffensivePosts = require('../services/postServices/getOffensivePosts');
const toggleLike = require('../services/postServices/toggleLike');
const incrementViews = require('../services/postServices/incrementViews');
const getPostComments = require('../services/postServices/getPostComments');
const getFeaturedPosts = require('../services/postServices/getFeaturedPosts');
const getPopularPosts = require('../services/postServices/getPopularPosts');
const searchPosts = require('../services/postServices/searchPosts');
const getSearchSuggestions = require('../services/postServices/getSearchSuggestions');
const getPostsByAuthor = require('../services/postServices/getPostsByAuthor');
const getRelatedPosts = require('../services/postServices/getRelatedPosts');
const getPostBySlug = require('../services/postServices/getPostBySlug');

const postController = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  archivePost,
  unarchivePost,
  markAsOffensive,
  removeOffense,
  getOffensivePosts,
  toggleLike,
  incrementViews,
  getPostComments,
  getFeaturedPosts,
  getPopularPosts,
  searchPosts,
  getSearchSuggestions,
  getPostsByAuthor,
  getRelatedPosts,
  getPostBySlug
};

module.exports = postController;