import React from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import { categoriesAPI } from '../../../services/api/categories';
import { 
  Microscope, 
  Shield, 
  Dna, 
  Leaf, 
  Factory, 
  Stethoscope,
  Zap,
  Bug,
  Activity
} from 'lucide-react';

const Categories = () => {
  const { useGetQuery } = useApi();
  
  const { 
    data: categoriesResponse, 
    isLoading, 
    error 
  } = useGetQuery(
    ['categories'],
    categoriesAPI.getCategories,
    {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Extract categories from API response - FIXED: Proper data structure
  const categories = categoriesResponse?.data?.categories || [];

  // Default categories with proper structure matching API
  const defaultCategories = [
    { 
      _id: 'bacteriology', 
      name: 'Bacteriology', 
      description: 'Study of bacteria and their impact on health and environment',
      icon: Microscope,
      postCount: 245,
      color: 'from-blue-500 to-blue-600'
    },
    { 
      _id: 'virology', 
      name: 'Virology', 
      description: 'Research on viruses, their structure, and disease mechanisms',
      icon: Zap,
      postCount: 189,
      color: 'from-red-500 to-red-600'
    },
    { 
      _id: 'mycology', 
      name: 'Mycology', 
      description: 'Study of fungi and their applications in medicine and industry',
      icon: Leaf,
      postCount: 132,
      color: 'from-green-500 to-green-600'
    },
    { 
      _id: 'parasitology', 
      name: 'Parasitology', 
      description: 'Investigation of parasites and parasitic diseases',
      icon: Bug,
      postCount: 98,
      color: 'from-purple-500 to-purple-600'
    },
    { 
      _id: 'immunology', 
      name: 'Immunology', 
      description: 'Understanding immune systems and immunological responses',
      icon: Shield,
      postCount: 176,
      color: 'from-orange-500 to-orange-600'
    },
    { 
      _id: 'microbial-genetics', 
      name: 'Microbial Genetics', 
      description: 'Genetic mechanisms and engineering in microorganisms',
      icon: Dna,
      postCount: 154,
      color: 'from-indigo-500 to-indigo-600'
    },
    { 
      _id: 'environmental-microbiology', 
      name: 'Environmental Microbiology', 
      description: 'Microbial ecology and environmental applications',
      postCount: 121,
      icon: Leaf,
      color: 'from-emerald-500 to-emerald-600'
    },
    { 
      _id: 'industrial-microbiology', 
      name: 'Industrial Microbiology', 
      description: 'Microbial applications in industry and biotechnology',
      icon: Factory,
      postCount: 87,
      color: 'from-amber-500 to-amber-600'
    },
    { 
      _id: 'medical-microbiology', 
      name: 'Medical Microbiology', 
      description: 'Microbial causes of diseases and medical applications',
      icon: Stethoscope,
      postCount: 203,
      color: 'from-rose-500 to-rose-600'
    }
  ];

  // Use API data if available, otherwise use defaults
  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Research Categories</h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
              <p className="text-red-700 mb-4">Error loading categories. Showing default categories.</p>
              <p className="text-red-600 text-sm">Error: {error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Research Categories</h1>
            <p className="text-lg text-gray-600">Loading categories...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Research Categories</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore microbiology research organized by specialized fields and disciplines
          </p>
          {categories.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto mt-4">
              <p className="text-yellow-700">Using default categories. No categories found in database.</p>
            </div>
          )}
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCategories.map((category) => {
            // Map category names to icons for API data
            const getIconComponent = (categoryName) => {
              const iconMap = {
                'Bacteriology': Microscope,
                'Virology': Zap,
                'Mycology': Leaf,
                'Parasitology': Bug,
                'Immunology': Shield,
                'Microbial Genetics': Dna,
                'Environmental Microbiology': Leaf,
                'Industrial Microbiology': Factory,
                'Medical Microbiology': Stethoscope
              };
              return iconMap[categoryName] || Microscope;
            };

            const IconComponent = category.icon || getIconComponent(category.name);
            const colorClass = category.color || 'from-primary-500 to-primary-600';

            return (
              <Link
                key={category._id}
                to={`/blog?category=${category._id}`}
                className="group block"
              >
                <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 h-full flex flex-col border border-gray-100">
                  {/* Icon */}
                  <div className={`bg-gradient-to-r ${colorClass} w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="h-7 w-7 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 flex-1">
                    {category.description}
                  </p>

                  {/* Post Count */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                      {category.postCount || 0} articles
                    </span>
                    <span className="text-primary-600 font-semibold text-sm group-hover:text-primary-700 transition-colors">
                      Explore →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-primary-50 rounded-2xl p-8 border border-primary-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Can't Find Your Specialization?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our categories are constantly evolving. Use the search feature to find specific research topics or contact us to suggest new categories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/blog"
                className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Browse All Articles
              </Link>
              <Link
                to="/about"
                className="border border-primary-600 text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 hover:text-white transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;