import React from 'react';

const Loading = ({ 
  size = 'md', 
  text = 'Loading...',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-3">
        <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${sizeClasses[size]}`}></div>
        {text && <p className="text-sm text-gray-600">{text}</p>}
      </div>
    </div>
  );
};

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${sizeClasses[size]} ${className}`}
    ></div>
  );
};

export default Loading;