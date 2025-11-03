import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const extractAuthData = (response) => {
    let userData = null;
    let tokens = {};

    // Handle different response structures
    if (response?.data?.data?.user) {
      userData = response.data.data.user;
      tokens.token = response.data.data.token;
      tokens.refreshToken = response.data.data.refreshToken;
    } 
    else if (response?.data?.user) {
      userData = response.data.user;
      tokens.token = response.data.token;
      tokens.refreshToken = response.data.refreshToken;
    }
    else if (response?.user) {
      userData = response.user;
      tokens.token = response.token;
      tokens.refreshToken = response.refreshToken;
    }
    else if (response?.data) {
      userData = response.data;
    }

    // Normalize user data
    if (userData) {
      if (userData._id && !userData.id) userData.id = userData._id;
      if (userData.id && !userData._id) userData._id = userData.id;
      
      // Ensure avatar is always a string
      if (userData.avatar && typeof userData.avatar === 'object') {
        userData.avatar = userData.avatar.url || '';
      }
    }

    return { userData, tokens };
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const response = await authAPI.getCurrentUser();
      const { userData } = extractAuthData(response);

      if (userData && userData.id) {
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error('Invalid user data received');
      }
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      
      const response = await authAPI.login(credentials);
      const { userData, tokens } = extractAuthData(response);
      
      if (!userData || !tokens.token) {
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('accessToken', tokens.token);
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      toast.success(`Welcome back, ${userData.firstName}!`);
      return { user: userData, tokens };
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      toast.success('Registration successful! Please check your email to verify your account.');
      return response;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      // Silent fail for production - user will be logged out locally regardless
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    
    // Ensure avatar is always a string
    if (updatedUser.avatar && typeof updatedUser.avatar === 'object') {
      updatedUser.avatar = updatedUser.avatar.url || '';
    }
    
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const refreshUserData = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const { userData } = extractAuthData(response);
      
      if (userData) {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      }
      return null;
    } catch (error) {
      return user;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, useAuth };
export default AuthContext;