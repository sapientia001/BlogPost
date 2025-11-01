import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, User, Hash, FileText, X, RefreshCw } from 'lucide-react';
import { matchSorter } from 'match-sorter';
import PostList from '../../../components/posts/PostList/PostList';
import SearchBar from '../../../components/common/SearchBar/SearchBar';
import Pagination from '../../../components/common/Pagination/Pagination';
import { useApi } from '../../../hooks/useApi';
import { postsAPI } from '../../../services/api/posts';
import { categoriesAPI } from '../../../services/api/categories';

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    sortBy: 'newest',
    searchType: 'all'
  });
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allPosts, setAllPosts] = useState([]);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const { useGetQuery, usePostMutation } = useApi();
  
  const { 
    data: postsData, 
    isLoading: postsLoading, 
    error: postsError,
    refetch: refetchPosts
  } = useGetQuery(
    ['all-posts'],
    () => postsAPI.getPosts({ 
      limit: 50,
     }),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setFilters(prev => ({ ...prev, category: categoryFromUrl }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (postsData?.success && postsData?.data?.posts) {
      const posts = postsData.data.posts || [];
      setAllPosts(posts);
      setHasInitialLoad(true);
    } else if (postsData && !postsLoading) {
      setAllPosts([]);
      setHasInitialLoad(true);
    }
  }, [postsData, postsLoading]);

  useEffect(() => {
    if (postsError && !postsLoading) {
      setAllPosts([]);
      setHasInitialLoad(true);
    }
  }, [postsError, postsLoading]);

  const { data: categoriesData } = useGetQuery(
    ['categories'],
    categoriesAPI.getCategories
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredPosts = useMemo(() => {
    if (!hasInitialLoad && postsLoading) {
      return [];
    }

    if (!allPosts.length) {
      return [];
    }

    let postsToFilter = [...allPosts];

    if (filters.category) {
      postsToFilter = postsToFilter.filter(post => {
        const categoryId = post.category?._id || post.category;
        const categorySlug = post.category?.slug;
        return categoryId === filters.category || categorySlug === filters.category;
      });
    }

    if (debouncedQuery && debouncedQuery.trim()) {
      const query = debouncedQuery.trim().toLowerCase();
      
      const searchablePosts = postsToFilter.map(post => ({
        ...post,
        _searchTitle: post.title || '',
        _searchExcerpt: post.excerpt || '',
        _searchContent: post.content || '',
        _searchTags: Array.isArray(post.tags) ? post.tags.join(' ') : (post.tags || ''),
        _searchAuthor: post.author ? 
          `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() : '',
        _searchCategory: post.category?.name || ''
      }));

      const searchOptions = {
        keys: [],
        threshold: matchSorter.rankings.CONTAINS
      };

      switch (filters.searchType) {
        case 'title':
          searchOptions.keys = ['_searchTitle'];
          break;
        case 'author':
          searchOptions.keys = ['_searchAuthor'];
          break;
        case 'content':
          searchOptions.keys = ['_searchContent', '_searchExcerpt'];
          break;
        case 'tags':
          searchOptions.keys = ['_searchTags'];
          break;
        default:
          searchOptions.keys = [
            '_searchTitle',
            '_searchExcerpt', 
            '_searchContent',
            '_searchTags',
            '_searchAuthor',
            '_searchCategory'
          ];
      }

      try {
        const matchedPosts = matchSorter(searchablePosts, query, searchOptions);
        postsToFilter = matchedPosts.map(matchedPost => {
          const { _searchTitle, _searchExcerpt, _searchContent, _searchTags, _searchAuthor, _searchCategory, ...originalPost } = matchedPost;
          return originalPost;
        });
      } catch (error) {
        postsToFilter = postsToFilter.filter(post => {
          const searchText = `
            ${post.title || ''} 
            ${post.excerpt || ''} 
            ${post.content || ''} 
            ${Array.isArray(post.tags) ? post.tags.join(' ') : ''} 
            ${post.author ? `${post.author.firstName} ${post.author.lastName}` : ''}
            ${post.category?.name || ''}
          `.toLowerCase();
          
          return searchText.includes(query);
        });
      }
    }

    const sortedPosts = [...postsToFilter].sort((a, b) => {
      switch (filters.sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'popular':
          return (b.views || 0) - (a.views || 0);
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return sortedPosts;
  }, [allPosts, debouncedQuery, filters, hasInitialLoad, postsLoading]);

  const postsPerPage = 9;
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  const posts = useMemo(() => {
    return paginatedPosts;
  }, [paginatedPosts]);

  const getSuggestionsMutation = usePostMutation(
    (query) => postsAPI.getSearchSuggestions(query),
    {
      onSuccess: (data) => {
        setSearchSuggestions(data.data?.suggestions || []);
      },
      onError: () => {
        setSearchSuggestions([]);
      }
    }
  );

  const categories = useMemo(() => {
    if (!categoriesData) return [];
    
    const rawCategories = categoriesData.data || categoriesData || [];
    
    if (Array.isArray(rawCategories)) {
      return rawCategories;
    } else if (rawCategories && typeof rawCategories === 'object') {
      return rawCategories.categories || rawCategories.posts || Object.values(rawCategories);
    }
    
    return [];
  }, [categoriesData]);

  const defaultCategories = [
    { _id: 'bacteriology', name: 'Bacteriology' },
    { _id: 'virology', name: 'Virology' },
    { _id: 'mycology', name: 'Mycology' },
    { _id: 'immunology', name: 'Immunology' },
    { _id: 'microbial-genetics', name: 'Microbial Genetics' },
    { _id: 'environmental-microbiology', name: 'Environmental Microbiology' },
    { _id: 'industrial-microbiology', name: 'Industrial Microbiology' },
    { _id: 'medical-microbiology', name: 'Medical Microbiology' }
  ];

  const displayCategories = Array.isArray(categories) && categories.length > 0 ? categories : defaultCategories;

  const searchTypes = [
    { value: 'all', label: 'All Content', icon: Search },
    { value: 'title', label: 'Titles Only', icon: FileText },
    { value: 'author', label: 'Authors Only', icon: User },
    { value: 'content', label: 'Content Only', icon: FileText },
    { value: 'tags', label: 'Tags Only', icon: Hash }
  ];

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'author': return <User className="h-4 w-4" />;
      case 'title': return <FileText className="h-4 w-4" />;
      case 'tag': return <Hash className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getSuggestionColor = (type) => {
    switch (type) {
      case 'author': return 'bg-blue-100 text-blue-600';
      case 'title': return 'bg-green-100 text-green-600';
      case 'tag': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const hasActiveFilters = debouncedQuery || filters.category || filters.searchType !== 'all';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setShowSuggestions(false);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    
    if (query.length >= 2) {
      getSuggestionsMutation.mutate(query);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [getSuggestionsMutation]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setSearchQuery(suggestion.value);
    setShowSuggestions(false);
    setCurrentPage(1);
    
    if (suggestion.type === 'author') {
      setFilters(prev => ({ ...prev, searchType: 'author' }));
    } else if (suggestion.type === 'title') {
      setFilters(prev => ({ ...prev, searchType: 'title' }));
    } else if (suggestion.type === 'tag') {
      setFilters(prev => ({ ...prev, searchType: 'tags' }));
    }
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
    
    if (key === 'category') {
      const newSearchParams = new URLSearchParams(searchParams);
      if (value) {
        newSearchParams.set('category', value);
      } else {
        newSearchParams.delete('category');
      }
      setSearchParams(newSearchParams);
    }
  }, [searchParams, setSearchParams]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setFilters({
      category: '',
      sortBy: 'newest',
      searchType: 'all'
    });
    setCurrentPage(1);
    setShowSuggestions(false);
    setSearchSuggestions([]);
    
    setSearchParams({});
  }, [setSearchParams]);

  const retryLoadPosts = useCallback(() => {
    refetchPosts();
  }, [refetchPosts]);

  if (postsLoading && !hasInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <RefreshCw className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Articles</h2>
            <p className="text-gray-600">Please wait while we load the latest research articles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Research Articles</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore the latest research and discoveries in microbiology from our community of scientists
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Enhanced Search Bar with Suggestions */}
            <div className="w-full lg:w-96 relative">
              <div ref={searchInputRef}>
                <SearchBar 
                  placeholder="Search articles, authors, tags..."
                  onSearch={handleSearch}
                  onChange={handleSearchChange}
                  value={searchQuery}
                  isLoading={getSuggestionsMutation.isLoading}
                />
              </div>
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 mt-1 max-h-60 overflow-y-auto"
                >
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion._id || index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left p-3 hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className={`p-1 rounded ${getSuggestionColor(suggestion.type)}`}>
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">
                          {suggestion.display}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {suggestion.type}
                          {suggestion.institution && ` • ${suggestion.institution}`}
                          {suggestion.count && ` • ${suggestion.count} posts`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search Type Filter */}
              <div className="flex items-center space-x-2">
                <select
                  value={filters.searchType}
                  onChange={(e) => handleFilterChange('searchType', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm min-w-[140px]"
                >
                  {searchTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[180px]"
                >
                  <option value="">All Categories</option>
                  {displayCategories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[140px]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="popular">Most Popular</option>
              </select>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                >
                  <X className="h-4 w-4" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Info */}
          {debouncedQuery && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Found {filteredPosts.length} results for "{debouncedQuery}" 
                {filters.searchType !== 'all' && ` in ${searchTypes.find(t => t.value === filters.searchType)?.label.toLowerCase()}`}
                {filters.category && ` in ${displayCategories.find(c => c._id === filters.category)?.name}`}
              </p>
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600">Active filters:</span>
            {debouncedQuery && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Search: "{debouncedQuery}"
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDebouncedQuery('');
                  }}
                  className="ml-1 hover:text-primary-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.searchType !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Type: {searchTypes.find(t => t.value === filters.searchType)?.label}
                <button
                  onClick={() => handleFilterChange('searchType', 'all')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Category: {displayCategories.find(c => c._id === filters.category)?.name}
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className="ml-1 hover:text-green-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results Count */}
        {!postsLoading && allPosts.length > 0 && (
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {posts.length} of {filteredPosts.length} articles
              {debouncedQuery && ` for "${debouncedQuery}"`}
              {filters.category && ` in ${displayCategories.find(cat => cat._id === filters.category)?.name || 'selected category'}`}
            </p>
          </div>
        )}

        {/* Loading State */}
        {postsLoading && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              <span className="text-sm">Loading articles...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {postsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Articles</h3>
              <p className="text-red-700 mb-4">
                {postsError.response?.data?.message || 'There was an error fetching the articles.'}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={retryLoadPosts}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={clearAllFilters}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Posts Grid */}
        {!postsError && (
          <PostList 
            posts={posts} 
            loading={postsLoading && !hasInitialLoad}
          />
        )}

        {/* No Results State */}
        {!postsLoading && hasInitialLoad && filteredPosts.length === 0 && debouncedQuery && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              No articles found for "{debouncedQuery}". Try adjusting your search terms or filters.
            </p>
            <button
              onClick={clearAllFilters}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* No Posts Available */}
        {!postsLoading && hasInitialLoad && allPosts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles available</h3>
            <p className="text-gray-600 mb-4">
              There are no articles published yet. Check back later for new content.
            </p>
            <button
              onClick={retryLoadPosts}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        )}

        {/* Pagination */}
        {!postsError && totalPages > 1 && (
          <div className="mt-12">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;