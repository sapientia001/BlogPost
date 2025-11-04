import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Microscope, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings,
  BookOpen,
  PlusCircle,
  Shield,
  BarChart3,
  Users,
  Search
} from 'lucide-react';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  // Simple search handler - just navigate to blog page
  const handleSearchClick = () => {
    navigate('/blog');
    setIsMobileMenuOpen(false);
  };

  const navigation = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'Blog', href: '/blog', current: location.pathname === '/blog' },
    { name: 'Categories', href: '/categories', current: location.pathname === '/categories' },
    { name: 'About', href: '/about', current: location.pathname === '/about' },
  ];

  const researcherLinks = [
    { name: 'Dashboard', href: '/researcher/dashboard', icon: Settings },
    { name: 'Create Post', href: '/researcher/create', icon: PlusCircle },
    { name: 'My Posts', href: '/researcher/posts', icon: BookOpen },
  ];

  const adminLinks = [
    { name: 'Admin Dashboard', href: '/admin/dashboard', icon: Shield },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Post Management', href: '/admin/posts', icon: BookOpen },
    { name: 'Categories', href: '/admin/categories', icon: Settings },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Microscope className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-heading font-bold text-primary-800">
              MicroBio
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.current
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Simple Search Icon */}
            <button
              onClick={handleSearchClick}
              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Search articles"
            >
              <Search className="h-5 w-5" />
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Admin Quick Actions */}
                {user?.role === 'admin' && (
                  <div className="flex items-center space-x-2">
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center space-x-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </div>
                )}

                {/* Researcher Quick Actions */}
                {user?.role === 'researcher' && (
                  <div className="flex items-center space-x-2">
                    <Link
                      to="/researcher/create"
                      className="flex items-center space-x-1 bg-primary-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>New Post</span>
                    </Link>
                  </div>
                )}

                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 bg-gray-100 rounded-full p-2 hover:bg-gray-200 transition-colors">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {user?.firstName}
                    </span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-200">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                    
                    {/* Admin Links */}
                    {user?.role === 'admin' && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        {adminLinks.map((link) => (
                          <Link
                            key={link.name}
                            to={link.href}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <link.icon className="h-4 w-4" />
                            <span>{link.name}</span>
                          </Link>
                        ))}
                      </>
                    )}
                    
                    {/* Researcher Links */}
                    {user?.role === 'researcher' && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        {researcherLinks.map((link) => (
                          <Link
                            key={link.name}
                            to={link.href}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <link.icon className="h-4 w-4" />
                            <span>{link.name}</span>
                          </Link>
                        ))}
                      </>
                    )}
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Search Button */}
            <button
              onClick={handleSearchClick}
              className="p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            
            {/* Animated Menu Button */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative p-2 rounded-md text-primary-700 hover:text-primary-800 hover:bg-primary-50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Pulsing background circle */}
              <motion.div
                className="absolute inset-0 rounded-md border-2 border-primary-700"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut"
                }}
              />
              
              {/* Rotating border animation */}
              <motion.div
                className="absolute inset-0 rounded-md border-2 border-transparent"
                style={{
                  background: 'conic-gradient(from 0deg, transparent, #475569, transparent)'
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              
              {/* Menu Icon */}
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 relative z-10" />
              ) : (
                <Menu className="h-6 w-6 relative z-10" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 py-4"
          >
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    item.current
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Auth Section */}
              <div className="pt-4 border-t border-gray-200">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Signed in as <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                      <br />
                      <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
                        user?.role === 'admin' 
                          ? 'bg-red-100 text-red-800'
                          : user?.role === 'researcher'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user?.role}
                      </span>
                    </div>
                    
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                    >
                      <User className="h-5 w-5" />
                      <span>Profile</span>
                    </Link>

                    {/* Admin Mobile Links */}
                    {user?.role === 'admin' && (
                      <>
                        <div className="border-t border-gray-100 my-2"></div>
                        <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Admin
                        </div>
                        {adminLinks.map((link) => (
                          <Link
                            key={link.name}
                            to={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                          >
                            <link.icon className="h-5 w-5" />
                            <span>{link.name}</span>
                          </Link>
                        ))}
                      </>
                    )}

                    {/* Researcher Mobile Links */}
                    {user?.role === 'researcher' && (
                      <>
                        <div className="border-t border-gray-100 my-2"></div>
                        <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Researcher
                        </div>
                        {researcherLinks.map((link) => (
                          <Link
                            key={link.name}
                            to={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                          >
                            <link.icon className="h-5 w-5" />
                            <span>{link.name}</span>
                          </Link>
                        ))}
                      </>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </nav>
    </header>
  );
};

export default Header;