import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

// Public pages
import Home from './pages/public/Home/Home'
import Blog from './pages/public/Blog/Blog'
import PostDetail from './pages/public/PostDetail/PostDetail'
import Categories from './pages/public/Categories/Categories'
import About from './pages/public/About/About'

// Auth pages
import Login from './pages/auth/Login/Login'
import Register from './pages/auth/Register/Register'
import Profile from './pages/auth/Profile/Profile'
import ForgotPassword from './pages/auth/ForgotPassword/ForgotPassword' // NEW IMPORT
import ResetPassword from './pages/auth/ResetPassword/ResetPassword' // NEW IMPORT

// Researcher pages
import ResearcherDashboard from './pages/researcher/Dashboard/ResearcherDashboard'
import CreatePost from './pages/researcher/CreatePost/CreatePost'
import MyPosts from './pages/researcher/MyPosts/MyPosts'
import EditPost from './pages/researcher/EditPost/EditPost'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin/AdminLogin'
import AdminDashboard from './pages/admin/Dashboard/Dashboard'
import AdminUsers from './pages/admin/Users/Users'
import AdminPosts from './pages/admin/Posts/Posts'
import AdminCategories from './pages/admin/Categories/Categories'
import AdminAnalytics from './pages/admin/Analytics/Analytics'
import AdminEditPost from './pages/admin/EditPost/EditPost'

// Common components
import Header from './components/common/Header/Header'
import Footer from './components/common/Footer/Footer'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/about" element={<About />} />
            
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/forgot-password" element={<ForgotPassword />} /> {/* NEW ROUTE */}
            <Route path="/reset-password" element={<ResetPassword />} /> {/* NEW ROUTE */}
            
            {/* Researcher routes */}
            <Route path="/researcher/dashboard" element={<ResearcherDashboard />} />
            <Route path="/researcher/create" element={<CreatePost />} />
            <Route path="/researcher/posts" element={<MyPosts />} />
            <Route path="/researcher/edit/:postId" element={<EditPost />} />
            
            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/posts" element={<AdminPosts />} />
            <Route path="/admin/posts/edit/:postId" element={<AdminEditPost />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}

export default App