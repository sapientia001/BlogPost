import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, User, Eye, Heart, Share2, Bookmark, ArrowLeft, RefreshCw } from 'lucide-react';
import { useApi } from '../../../hooks/useApi';
import { postsAPI } from '../../../services/api/posts';
import { formatDate, formatRelativeTime } from '../../../utils/helpers';
import CommentList from '../../../components/comments/CommentList/CommentList';
import CommentForm from '../../../components/comments/CommentForm/CommentForm';
import toast from 'react-hot-toast';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { useGetQuery, usePostMutation } = useApi();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const { 
    data: postData, 
    isLoading, 
    error, 
    refetch,
    isError 
  } = useGetQuery(
    ['post', id, retryCount],
    () => postsAPI.getPost(id),
    {
      retry: 2,
      retryDelay: 1000,
      onError: (error) => {
        if (error.response?.status === 404) {
          toast.error('Post not found or you do not have permission to view it');
        }
      }
    }
  );

  // Like mutation
  const likeMutation = usePostMutation(
    () => postsAPI.likePost(id),
    {
      onSuccess: (data) => {
        refetch();
        setIsLiked(data?.data?.isLiked || !isLiked);
        toast.success(data?.data?.isLiked ? 'Post liked' : 'Post unliked');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to like post');
        setIsLiked(!isLiked);
      }
    }
  );

  const post = postData?.data?.post || postData?.post || null;
  const safePost = post ? {
    ...post,
    image: post.featuredImage || post.image,
    likes: Array.isArray(post.likes) ? post.likes.length : post.likes || 0,
    views: post.views || 0,
    commentsCount: post.comments || 0,
    author: post.author ? {
      firstName: post.author.firstName || 'Unknown',
      lastName: post.author.lastName || 'Author',
      ...post.author
    } : { firstName: 'Unknown', lastName: 'Author' }
  } : null;

  const handleLike = () => {
    if (!safePost) return;
    
    setIsLiked(!isLiked);
    likeMutation.mutate();
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Post unsaved' : 'Post saved');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: safePost.title,
          text: safePost.excerpt,
          url: window.location.href,
        });
        toast.success('Post shared successfully');
      } catch (error) {
        if (error.name !== 'AbortError') {
          // Silent fail for production
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast.success('Link copied to clipboard');
      }).catch(() => {
        toast.error('Failed to copy link');
      });
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    refetch();
  };

  const handleBackToBlog = () => {
    navigate('/blog');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !safePost) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error?.response?.status === 404 ? 'Article Not Found' : 'Error Loading Article'}
            </h1>
            <p className="text-gray-600 mb-6">
              {error?.response?.status === 404 
                ? "The article you're looking for doesn't exist or may have been removed."
                : error?.response?.data?.message || error?.message || "There was an error loading this article."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="flex items-center justify-center bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              <button
                onClick={handleBackToBlog}
                className="flex items-center justify-center bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Articles
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={handleBackToBlog}
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Articles
        </button>

        {/* Article Header */}
        <article className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Featured Image */}
          {safePost.image && (
            <div className="w-full h-80 bg-gray-200">
              <img
                src={safePost.image}
                alt={safePost.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Article Content */}
          <div className="p-8">
            {/* Category */}
            {safePost.category && (
              <span className="inline-block bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
                {safePost.category.name}
              </span>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {safePost.title}
            </h1>

            {/* Excerpt */}
            {safePost.excerpt && (
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {safePost.excerpt}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-t border-b border-gray-200 mb-8">
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                {/* Author */}
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>
                    {safePost.author.firstName} {safePost.author.lastName}
                  </span>
                </div>

                {/* Date */}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>{formatDate(safePost.createdAt)}</span>
                  <span className="text-gray-400">({formatRelativeTime(safePost.createdAt)})</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{safePost.views} views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span>{safePost.likes} likes</span>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: safePost.content }}
            />

            {/* Tags */}
            {safePost.tags && safePost.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {safePost.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleLike}
                  disabled={likeMutation.isLoading}
                  className={`flex items-center space-x-2 transition-colors ${
                    isLiked ? 'text-red-500' : 'text-gray-600 hover:text-primary-600'
                  } disabled:opacity-50`}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>Like</span>
                </button>
                <button 
                  onClick={handleSave}
                  className={`flex items-center space-x-2 transition-colors ${
                    isSaved ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                  <span>Save</span>
                </button>
                <button 
                  onClick={handleShare}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className="mt-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Discussion ({safePost.commentsCount})
            </h2>
            
            {/* Comment Form */}
            <CommentForm postId={id} />
            
            {/* Comment List */}
            <div className="mt-8">
              <CommentList postId={id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;