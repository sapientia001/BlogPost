import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { formatDate, generateExcerpt } from '../../../utils/helpers';

const FeaturedPosts = ({ posts = [] }) => {
  // Safe data access with defaults - UPDATED for featuredImage
  const safePosts = Array.isArray(posts) ? posts.map(post => ({
    ...post,
    image: post.featuredImage || post.image, // ✅ FIXED: Check featuredImage first
    excerpt: post.excerpt || generateExcerpt(post.content || '', 150),
    likes: Array.isArray(post.likes) ? post.likes.length : post.likes || 0,
    views: post.views || 0
  })) : [];
  
  if (safePosts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No featured articles available</p>
      </div>
    );
  }

  const mainPost = safePosts[0] || {};
  const sidePosts = safePosts.slice(1, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Featured Post */}
      <div className="lg:col-span-2">
        <Link to={`/post/${mainPost._id || ''}`} className="group">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
              {mainPost.image ? (
                <img
                  src={mainPost.image}
                  alt={mainPost.title || 'Featured post'}
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-full h-64 bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center ${mainPost.image ? 'hidden' : 'flex'}`}>
                <span className="text-white text-lg font-semibold">Microbiology Research</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{mainPost.createdAt ? formatDate(mainPost.createdAt) : 'Recent'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>
                    {mainPost.author?.firstName || ''} {mainPost.author?.lastName || ''}
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                {mainPost.title || 'Untitled Article'}
              </h3>
              <p className="text-gray-600 mb-4">
                {mainPost.excerpt}
              </p>
              <div className="flex items-center text-primary-600 font-semibold group-hover:text-primary-700 transition-colors">
                Read More
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Side Featured Posts */}
      <div className="space-y-6">
        {sidePosts.map((post, index) => (
          <Link key={post?._id || index} to={`/post/${post?._id || ''}`} className="group block">
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
              <div className="flex items-center space-x-3 text-sm text-gray-500 mb-2">
                <Calendar className="h-4 w-4" />
                <span>{post?.createdAt ? formatDate(post.createdAt) : 'Recent'}</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors overflow-hidden"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                {post?.title || 'Untitled Article'}
              </h4>
              <p className="text-gray-600 text-sm mb-3 overflow-hidden"
                 style={{
                   display: '-webkit-box',
                   WebkitLineClamp: 2,
                   WebkitBoxOrient: 'vertical'
                 }}>
                {post?.excerpt}
              </p>
              <div className="flex items-center text-primary-600 text-sm font-semibold group-hover:text-primary-700 transition-colors">
                Read Article
                <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedPosts;