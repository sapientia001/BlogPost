import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Mail, Lock, Loader, Eye, EyeOff, Shield } from 'lucide-react';

const AdminLogin = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data) => {
    try {
      const response = await login(data);
      
      // Check if the logged-in user is an admin
      if (response.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        // If not admin, redirect to regular user area with message
        alert('Access denied. Admin privileges required.');
        navigate('/');
      }
    } catch (error) {
      // Error is handled in the auth context
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <div className="bg-red-600 p-2 rounded-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-heading font-bold text-red-800">
              MicroBio Admin
            </span>
          </div>
        </div>

        {/* Page Title */}
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Secure access to platform administration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-l-4 border-red-600">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  {...register('email', {
                    required: 'Admin email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="Enter admin email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field with Visibility Toggle */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Signing in...
                </>
              ) : (
                'Access Admin Panel'
              )}
            </button>

            {/* Security Notice */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <Shield className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Security Notice</h4>
                  <p className="text-sm text-red-700 mt-1">
                    This portal is restricted to authorized administrators only. 
                    Unauthorized access is prohibited.
                  </p>
                </div>
              </div>
            </div>

            {/* Back to Main Site */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                <Link
                  to="/"
                  className="font-medium text-red-600 hover:text-red-500 transition-colors"
                >
                  ← Back to main site
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Additional Security Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            For security assistance, contact platform administration
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;