import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useApi } from '../../../hooks/useApi';
import { commentsAPI } from '../../../services/api/comments';
import { Send } from 'lucide-react';

const CommentForm = ({ postId, parentId = null, onCommentAdded, onCancel }) => {
  const { user, isAuthenticated } = useAuth();
  const { usePostMutation, invalidateQueries } = useApi();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const createCommentMutation = usePostMutation(
    (data) => commentsAPI.createComment(postId, data),
    {
      onSuccess: () => {
        reset();
        setIsSubmitting(false);
        invalidateQueries(['comments', postId]);
        if (onCommentAdded) {
          onCommentAdded();
        }
      },
      onError: () => {
        setIsSubmitting(false);
      },
    }
  );

  const onSubmit = async (data) => {
    if (!isAuthenticated) {
      return;
    }

    setIsSubmitting(true);
    const commentData = {
      content: data.content,
      parentId: parentId,
    };

    createCommentMutation.mutate(commentData);
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600 text-sm">
          Please{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            sign in
          </Link>{' '}
          to leave a comment.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex space-x-3">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-semibold text-sm">
              {user?.firstName?.[0] || 'U'}
            </span>
          </div>
        </div>

        {/* Comment Input */}
        <div className="flex-1">
          <textarea
            {...register('content', {
              required: 'Comment cannot be empty',
              minLength: {
                value: 2,
                message: 'Comment must be at least 2 characters',
              },
              maxLength: {
                value: 1000,
                message: 'Comment cannot exceed 1000 characters',
              },
            })}
            placeholder={parentId ? 'Write a reply...' : 'Share your thoughts...'}
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-colors"
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-3">
            <div className="text-sm text-gray-500">
              {parentId && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Posting...' : parentId ? 'Reply' : 'Comment'}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;