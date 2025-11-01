import React from 'react';
import { Link } from 'react-router-dom';
import { Microscope, BookOpen, Users, TrendingUp } from 'lucide-react';
import FeaturedPosts from '../../../components/posts/FeaturedPosts/FeaturedPosts';
import PostList from '../../../components/posts/PostList/PostList';
import { useApi } from '../../../hooks/useApi';
import { postsAPI } from '../../../services/api/posts';

const Home = () => {
  const { useGetQuery } = useApi();

  // Fetch latest posts
  const { 
    data: postsData, 
    isLoading: postsLoading, 
    error: postsError 
  } = useGetQuery(
    ['latest-posts'],
    () => postsAPI.getPosts({ limit: 6 }),
    {
      retry: 1
    }
  );

  // Fetch featured posts
  const { 
    data: featuredData, 
    isLoading: featuredLoading,
    error: featuredError 
  } = useGetQuery(
    ['featured-posts'],
    postsAPI.getFeaturedPosts,
    {
      retry: false
    }
  );

  const latestPosts = React.useMemo(() => {
    const posts = postsData?.data?.posts || postsData?.posts || postsData?.data || [];
    return posts;
  }, [postsData]);

  const featuredPosts = React.useMemo(() => {
    const posts = featuredData?.data?.posts || featuredData?.posts || featuredData?.data || [];
    return posts.length > 0 ? posts : latestPosts.slice(0, 4);
  }, [featuredData, latestPosts]);

  const stats = [
    { icon: BookOpen, label: 'Articles Published', value: '1,200+' },
    { icon: Users, label: 'Active Researchers', value: '500+' },
    { icon: TrendingUp, label: 'Monthly Readers', value: '10,000+' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white bg-opacity-20 p-4 rounded-full">
                <Microscope className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Explore the Microscopic World
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Discover groundbreaking research, share your findings, and join a community 
              dedicated to advancing microbiology knowledge.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/blog"
                className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Explore Articles
              </Link>
              <Link
                to="/register"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-colors"
              >
                Join Community
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {featuredPosts.length > 0 && !featuredError ? 'Featured Research' : 'Latest Research'}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {featuredPosts.length > 0 && !featuredError
                ? 'Discover the latest breakthroughs and most impactful studies in microbiology'
                : 'Explore recent publications from our community'
              }
            </p>
          </div>
          
          {featuredLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading articles...</p>
            </div>
          ) : (
            <FeaturedPosts posts={featuredPosts} />
          )}
        </div>
      </section>

      {/* Latest Posts Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest Articles</h2>
              <p className="text-lg text-gray-600">
                Stay updated with recent publications from our community
              </p>
            </div>
            <Link
              to="/blog"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              View All Articles
            </Link>
          </div>
          
          {postsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading latest articles...</p>
            </div>
          ) : postsError ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Unable to load articles at the moment</p>
              <p className="text-gray-400 text-sm mt-2">Please try again later</p>
            </div>
          ) : (
            <PostList posts={latestPosts} />
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Share Your Research?</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of researchers publishing their findings and contributing to scientific advancement.
          </p>
          <Link
            to="/register"
            className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Publishing Today
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;