import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Format date for display
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Generate excerpt from content
export const generateExcerpt = (content, maxLength = 150) => {
  if (!content) return '';
  
  // Remove HTML tags
  const plainText = content.replace(/<[^>]*>/g, '');
  
  return truncateText(plainText, maxLength);
};

// Check if user has required role
export const hasRole = (user, requiredRole) => {
  if (!user || !user.role) return false;
  return user.role === requiredRole;
};

// Check if user has at least required role
export const hasMinRole = (user, requiredRole) => {
  const roleHierarchy = {
    reader: 1,
    researcher: 2,
    admin: 3,
  };

  if (!user || !user.role) return false;
  
  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};