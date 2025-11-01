import api from './config';

export const commentsAPI = {
  // CORRECT ENDPOINT: GET /api/comments/post/:postId
  getCommentsByPost: async (postId) => {
    const response = await api.get(`/comments/post/${postId}`);
    return response.data;
  },

  // CORRECT ENDPOINT: POST /api/comments/post/:postId
  createComment: async (postId, commentData) => {
    const response = await api.post(`/comments/post/${postId}`, commentData);
    return response.data;
  },

  // CORRECT ENDPOINT: PUT /api/comments/:commentId
  updateComment: async (commentId, commentData) => {
    const response = await api.put(`/comments/${commentId}`, commentData);
    return response.data;
  },

  // CORRECT ENDPOINT: DELETE /api/comments/:commentId
  deleteComment: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  // CORRECT ENDPOINT: POST /api/comments/:commentId/like
  likeComment: async (commentId) => {
    const response = await api.post(`/comments/${commentId}/like`);
    return response.data;
  },

  // CORRECT ENDPOINT: POST /api/comments/:commentId/reply
  replyToComment: async (commentId, replyData) => {
    const response = await api.post(`/comments/${commentId}/reply`, replyData);
    return response.data;
  },
};

export default commentsAPI;