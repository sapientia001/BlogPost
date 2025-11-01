import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Eye, Heart } from 'lucide-react';
import { formatDate, generateExcerpt } from '../../../utils/helpers';

const PostCard = ({ post }) => {
  // Safe data access with fallbacks - UPDATED for featuredImage
  const safePost = {
    _id: post._id || post.id,
    title: post.title || 'Untitled Article',
    content: post.content || '',
    excerpt: post.excerpt || generateExcerpt(post.content || '', 120),
    image: post.featuredImage || post.image, // ✅ FIXED: Check featuredImage first
    category: post.category || { name: 'Uncategorized' },
    author: post.author || { firstName: 'Unknown', lastName: 'Author' },
    views: post.views || 0,
    likes: Array.isArray(post.likes) ? post.likes.length : post.likes || 0, // ✅ FIXED: Handle array likes
    createdAt: post.createdAt || new Date().toISOString(),
  };

  if (!safePost._id) {
    console.warn('Post missing ID:', post);
    return null;
  }

  return (
    <Link to={`/post/${safePost._id}`} className="group">
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="aspect-w-16 aspect-h-9 bg-gray-200">
          {safePost.image ? (
            <img
              src={safePost.image}
              alt={safePost.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`w-full h-48 bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center ${safePost.image ? 'hidden' : 'flex'}`}>
            <span className="text-white font-semibold">Microbiology</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Category */}
          {safePost.category && (
            <span className="inline-block bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded mb-3 self-start">
              {safePost.category.name}
            </span>
          )}

          {/* Title */}
          <h3 className="font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
            {safePost.title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">
            {safePost.excerpt}
          </p>

          {/* Meta Information */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(safePost.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{safePost.author.firstName}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{safePost.views}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{safePost.likes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;