import React, { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import { formatRelativeTime } from '../../../utils/helpers';
import { useAuth } from '../../../contexts/AuthContext';

const CommentItem = ({ comment }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    // TODO: Implement like functionality
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-semibold text-sm">
              {comment.author?.firstName?.[0] || 'U'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900 text-sm">
                {comment.author?.firstName} {comment.author?.lastName}
              </span>
              <span className="text-gray-500 text-xs">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>
            
            {/* More options (only for comment author) */}
            {user?.id === comment.author?._id && (
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Comment Text */}
          <p className="text-gray-700 text-sm mb-3">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked ? 'text-red-500' : 'hover:text-gray-700'
              }`}
            >
              <Heart className={`h-3 w-3 ${isLiked ? 'fill-current' : ''}`} />
              <span>{comment.likes || 0}</span>
            </button>

            <button
              onClick={toggleReplies}
              className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
            >
              <MessageCircle className="h-3 w-3" />
              <span>Reply</span>
            </button>
          </div>

          {/* Replies (if any) */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              <button
                onClick={toggleReplies}
                className="text-primary-600 text-xs font-medium hover:text-primary-700 transition-colors mb-2"
              >
                {showReplies ? 'Hide' : 'Show'} {comment.replies.length} replies
              </button>
              
              {showReplies && (
                <div className="space-y-3 mt-2 ml-4 pl-4 border-l-2 border-gray-200">
                  {comment.replies.map((reply) => (
                    <div key={reply._id} className="flex space-x-3">
                      <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-600 text-xs font-semibold">
                          {reply.author?.firstName?.[0] || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-900 text-xs">
                            {reply.author?.firstName} {reply.author?.lastName}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {formatRelativeTime(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;