import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader } from 'lucide-react';

const SearchBar = ({ 
  placeholder = "Search articles...", 
  className = "",
  onSearch,
  onChange,
  value = '',
  isLoading = false
}) => {
  const [query, setQuery] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  // Sync with parent value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        navigate(`/blog?search=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const clearSearch = () => {
    setQuery('');
    if (onChange) {
      onChange('');
    }
    if (onSearch) {
      onSearch('');
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`relative ${className}`}
    >
      <div className={`relative flex items-center transition-all duration-200 ${
        isFocused ? 'ring-2 ring-primary-500 ring-opacity-50 shadow-sm' : ''
      } bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus-within:border-primary-500`}>
        <Search className="absolute left-3 h-4 w-4 text-gray-400" />
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-transparent border-none focus:outline-none focus:ring-0 text-sm rounded-lg placeholder-gray-500"
        />
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute right-10">
            <Loader className="h-4 w-4 text-gray-400 animate-spin" />
          </div>
        )}
        
        {/* Clear Button */}
        {query && !isLoading && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Search Button */}
      <button
        type="submit"
        className={`absolute right-1 top-1 bg-primary-600 text-white p-1.5 rounded-md hover:bg-primary-700 transition-colors ${
          query ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        disabled={!query}
      >
        <Search className="h-3 w-3" />
      </button>

      {/* Search Tips */}
      {isFocused && !query && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-40 mt-1 p-3">
          <p className="text-xs text-gray-600 mb-2 font-medium">Search tips:</p>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Search className="h-3 w-3" />
              <span>Search by article title, content, or author name</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="bg-blue-100 text-blue-600 px-1 rounded">@author</span>
              <span>Search for specific authors</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="bg-purple-100 text-purple-600 px-1 rounded">#tag</span>
              <span>Search by tags or topics</span>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default SearchBar;