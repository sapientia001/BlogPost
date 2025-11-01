import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { User, Mail, Lock, Loader, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const RegisterForm = () => {
  const { register: registerUser, loading } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  const selectedRole = watch('role');

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordsDontMatch = confirmPassword && password !== confirmPassword;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const onSubmit = async (data) => {
    try {
      // Transform data to match backend expectations
      const backendData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
        institution: data.institution || '',
        specialization: data.specialization ? data.specialization.split(',').map(s => s.trim()) : []
      };
      
      await registerUser(backendData);
    } catch (error) {
      // Error is handled in the auth context
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* First Name and Last Name - Side by Side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* First Name Field */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="firstName"
                type="text"
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters',
                  },
                })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="First name"
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name Field */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="lastName"
                type="text"
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters',
                  },
                })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Last name"
              />
            </div>
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="email"
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Enter your email"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Institution Field (Optional) */}
        <div>
          <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-2">
            Institution (Optional)
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="institution"
              type="text"
              {...register('institution')}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Your university or organization"
            />
          </div>
        </div>

        {/* Specialization Field (Optional) */}
        <div>
          <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
            Specialization (Optional)
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="specialization"
              type="text"
              {...register('specialization')}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="e.g., Bacteriology, Virology, Immunology"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Separate multiple specializations with commas
          </p>
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
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Create a password"
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

        {/* Confirm Password Field with Match Indicator and Visibility Toggle */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value =>
                  value === password || 'Passwords do not match',
              })}
              className={`w-full pl-10 pr-16 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                passwordsDontMatch 
                  ? 'border-red-300 bg-red-50' 
                  : passwordsMatch 
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
              }`}
              placeholder="Confirm your password"
            />
            
            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                {passwordsMatch ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : passwordsDontMatch ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : null}
              </div>
            )}
            
            {/* Visibility Toggle */}
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          
          {/* Password Match Status Text */}
          {confirmPassword && (
            <p className={`mt-1 text-sm ${
              passwordsMatch 
                ? 'text-green-600' 
                : passwordsDontMatch 
                  ? 'text-red-600'
                  : 'text-gray-500'
            }`}>
              {passwordsMatch 
                ? 'Passwords match!' 
                : passwordsDontMatch 
                  ? 'Passwords do not match'
                  : 'Enter the same password to confirm'
              }
            </p>
          )}
          
          {errors.confirmPassword && !confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Role Selection with Highlighting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="relative flex cursor-pointer">
              <input
                type="radio"
                value="reader"
                {...register('role', { required: 'Please select a role' })}
                className="sr-only"
              />
              <div className={`flex-1 text-center py-3 px-4 border-2 rounded-lg transition-all duration-200 ${
                selectedRole === 'reader'
                  ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50'
              }`}>
                <span className="text-sm font-medium">Reader</span>
                <p className="text-xs mt-1">Read articles</p>
              </div>
            </label>
            
            <label className="relative flex cursor-pointer">
              <input
                type="radio"
                value="researcher"
                {...register('role', { required: 'Please select a role' })}
                className="sr-only"
              />
              <div className={`flex-1 text-center py-3 px-4 border-2 rounded-lg transition-all duration-200 ${
                selectedRole === 'researcher'
                  ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50'
              }`}>
                <span className="text-sm font-medium">Researcher</span>
                <p className="text-xs mt-1">Write & publish</p>
              </div>
            </label>
          </div>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>

        {/* Terms Agreement */}
        <div className="flex items-center">
          <input
            id="agreeTerms"
            type="checkbox"
            {...register('agreeTerms', {
              required: 'You must agree to the terms and conditions',
            })}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="agreeTerms" className="ml-2 block text-sm text-gray-700">
            I agree to the{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-500">
              Terms and Conditions
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.agreeTerms && (
          <p className="text-sm text-red-600">{errors.agreeTerms.message}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;