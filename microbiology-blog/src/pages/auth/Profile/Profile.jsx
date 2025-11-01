import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { usersAPI } from '../../../services/api/users';
import { User, Mail, Calendar, Edit, Shield, BookOpen, Save, X, Camera } from 'lucide-react';
import { formatDate } from '../../../utils/helpers';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser, refreshUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    institution: '',
    bio: '',
    specialization: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        institution: user.institution || '',
        bio: user.bio || '',
        specialization: user.specialization?.join(', ') || ''
      });
      
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      } else {
        setAvatarPreview('');
      }
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  const getRoleIcon = () => {
    switch (user.role) {
      case 'admin':
        return { icon: Shield, color: 'bg-red-100 text-red-600' };
      case 'researcher':
        return { icon: BookOpen, color: 'bg-blue-100 text-blue-600' };
      default:
        return { icon: User, color: 'bg-gray-100 text-gray-600' };
    }
  };

  const getRoleDescription = () => {
    switch (user.role) {
      case 'admin':
        return 'Platform Administrator with full system access';
      case 'researcher':
        return 'Content Creator with publishing privileges';
      default:
        return 'Community Member with reading access';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setAvatarFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = new FormData();
      
      submitData.append('firstName', formData.firstName);
      submitData.append('lastName', formData.lastName);
      submitData.append('institution', formData.institution);
      submitData.append('bio', formData.bio);
      
      if (formData.specialization) {
        const specializationArray = formData.specialization.split(',').map(s => s.trim()).filter(s => s);
        submitData.append('specialization', JSON.stringify(specializationArray));
      } else {
        submitData.append('specialization', JSON.stringify([]));
      }

      if (avatarFile) {
        submitData.append('avatar', avatarFile);
      }

      const response = await usersAPI.updateUser(user.id, submitData, true);
      
      if (response.success) {
        await refreshUserData();
        setIsEditing(false);
        setAvatarFile(null);
        toast.success('Profile updated successfully!');
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      institution: user.institution || '',
      bio: user.bio || '',
      specialization: user.specialization?.join(', ') || ''
    });
    setAvatarFile(null);
    setAvatarPreview(user.avatar || '');
    setIsEditing(false);
  };

  const RoleIcon = getRoleIcon().icon;
  const roleColor = getRoleIcon().color;

  const AvatarDisplay = () => {
    const displayAvatar = avatarPreview || user.avatar;

    return (
      <div className="bg-white p-2 rounded-full shadow-lg relative">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${roleColor} overflow-hidden`}>
          {displayAvatar ? (
            <img 
              src={displayAvatar} 
              alt={`${user.firstName} ${user.lastName}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <RoleIcon className="h-12 w-12" />
          )}
        </div>
        {isEditing && (
          <label 
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition-colors"
          >
            <Camera className="h-4 w-4" />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className={`h-32 ${
            user.role === 'admin' ? 'bg-red-600' :
            user.role === 'researcher' ? 'bg-blue-600' : 'bg-primary-600'
          }`}></div>
          
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16">
              <div className="flex items-end space-x-4">
                <AvatarDisplay />
                
                <div className="pb-2">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="First Name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Last Name"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
                      <p className="text-gray-600">{user.email}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          user.role === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : user.role === 'researcher'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="flex space-x-3 mt-4 sm:mt-0">
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>

            <div className="mt-4">
              <p className="text-gray-600">{getRoleDescription()}</p>
            </div>

            <div className="mt-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Institution/Organization
                    </label>
                    <input
                      type="text"
                      name="institution"
                      value={formData.institution}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Your institution or organization"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specialization
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Microbiology, Virology, Immunology (comma separated)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple specializations with commas
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows="3"
                      maxLength="500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Tell us about yourself and your research interests..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.bio.length}/500 characters
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Mail className="h-5 w-5" />
                    <span>{user.email}</span>
                  </div>
                  
                  {user.institution && (
                    <div className="flex items-center space-x-3 text-gray-600">
                      <User className="h-5 w-5" />
                      <span>{user.institution}</span>
                    </div>
                  )}
                  
                  {user.specialization && user.specialization.length > 0 && (
                    <div className="flex items-start space-x-3 text-gray-600">
                      <BookOpen className="h-5 w-5 mt-0.5" />
                      <div>
                        <span className="font-medium">Specialization: </span>
                        {user.specialization.join(', ')}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Calendar className="h-5 w-5" />
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>
                </div>
              )}
            </div>

            {!isEditing && user.bio && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">About</h3>
                <p className="text-gray-600">{user.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;