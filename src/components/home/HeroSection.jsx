import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, BookOpen, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('colleges');
  const navigate = useNavigate();

  const handleSearch = () => {
    // Navigate to college listings with appropriate query param
    // Using specific query params allows CollegeListingsPage to filter accurately
    let queryParam = '';
    const trimmedQuery = searchQuery.trim();
    
    if (trimmedQuery) {
      if (searchType === 'colleges') queryParam = `search=${encodeURIComponent(trimmedQuery)}`;
      if (searchType === 'courses') queryParam = `course=${encodeURIComponent(trimmedQuery)}`;
      if (searchType === 'locations') queryParam = `location=${encodeURIComponent(trimmedQuery)}`;
      
      navigate(`/colleges?${queryParam}`);
    } else {
      navigate('/colleges');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 pt-12 pb-16 md:pt-12 md:pb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Find Your Perfect College with{' '}
              <span className="text-blue-600">Aao</span>
              <span className="text-green-600">College</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Your trusted partner in discovering the right college, course, and career path. Get expert guidance every step of the way.
            </p>

            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSearchType('colleges')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    searchType === 'colleges'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Building2 className="inline h-4 w-4 mr-2" />
                  Colleges
                </button>
                <button
                  onClick={() => setSearchType('courses')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    searchType === 'courses'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <BookOpen className="inline h-4 w-4 mr-2" />
                  Courses
                </button>
                <button
                  onClick={() => setSearchType('locations')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    searchType === 'locations'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MapPin className="inline h-4 w-4 mr-2" />
                  Locations
                </button>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${searchType}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none text-gray-900"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="bg-blue-600 hover:bg-blue-700 px-8"
                >
                  Search
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => navigate('/colleges')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
              >
                Find Colleges
              </Button>
              <Button
                onClick={() => navigate('/contact')}
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-8 py-6 text-lg font-semibold"
              >
                Get Admission Help
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <img alt="Students celebrating college admission" className="rounded-2xl shadow-2xl" src="/hero.webp" />
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 hidden md:block">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 rounded-lg">
                  <img 
                    src="/nobglogo.png" 
                    alt="Aao College Logo small icon" 
                    className="h-14 w-14 object-contain" 
                  />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">10,000+</p>
                  <p className="text-sm text-gray-600">Students Guided</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;