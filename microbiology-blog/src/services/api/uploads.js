import api from './config';

export const uploadsAPI = {
  // Upload image
  uploadImage: async (formData) => {
    const response = await api.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload document
  uploadDocument: async (formData) => {
    const response = await api.post('/uploads/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete file
  deleteFile: async (publicId) => {
    const response = await api.delete(`/uploads/${publicId}`);
    return response.data;
  },
};