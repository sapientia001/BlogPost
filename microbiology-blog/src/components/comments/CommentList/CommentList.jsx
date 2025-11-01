import React from 'react';
import { useApi } from '../../../hooks/useApi';
import { commentsAPI } from '../../../services/api/comments';
import CommentItem from '../CommentItem/CommentItem';

const CommentList = ({ postId }) => {
  const { useGetQuery } = useApi();

  const { data: commentsData, isLoading, error } = useGetQuery(
    ['comments', postId],
    () => commentsAPI.getCommentsByPost(postId),
    {
      retry: 1
    }
  );

  // Safe data extraction with multiple fallbacks
  const comments = commentsData?.data?.docs || 
                  commentsData?.data?.comments || 
                  commentsData?.docs || 
                  commentsData?.comments || 
                  commentsData?.data || 
                  [];

  // Ensure comments is always an array before mapping
  const safeComments = Array.isArray(comments) ? comments : [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="flex space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load comments</p>
        <p className="text-sm text-gray-400 mt-1">
          {error.response?.data?.message || 'Please try again later'}
        </p>
      </div>
    );
  }

  if (safeComments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {safeComments.map((comment) => (
        <CommentItem 
          key={comment._id || comment.id || Math.random().toString()} 
          comment={comment} 
        />
      ))}
    </div>
  );
};

export default CommentList;