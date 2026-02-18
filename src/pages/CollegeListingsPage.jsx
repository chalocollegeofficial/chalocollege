import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CollegeCard from '@/components/colleges/CollegeCard';
import FilterSidebar from '@/components/colleges/FilterSidebar';
import { supabase } from '@/lib/customSupabaseClient';
import { useLocation } from 'react-router-dom';
import { collegeMatchesCourseCategory, getCourseCategoryByKey } from '@/lib/courseCategories';
import SeoHead from '@/components/common/SeoHead';
import { STATIC_PAGE_SEO } from '@/lib/seo';

const CollegeListingsPage = () => {
  const pageSeo = STATIC_PAGE_SEO.colleges;
  const [showFilters, setShowFilters] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  const [filters, setFilters] = useState({
    state: '',
    city: '',
    course: '',
    collegeName: '',
    category: '',
    courseCategory: '',
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const search = searchParams.get('search');
    const course = searchParams.get('course');
    const loc = searchParams.get('location');
    const city = searchParams.get('city');
    const courseCategory = searchParams.get('courseCategory');

    setFilters((prev) => ({
      ...prev,
      collegeName: search || '',
      course: course || '',
      state: loc || '',
      city: city || '',
      courseCategory: courseCategory || '',
    }));

    fetchColleges();
  }, [location.search]);

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('*')
        .order('college_name');

      if (error) throw error;
      setColleges(data || []);
    } catch (error) {
      console.error('Error fetching colleges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (updated) => {
    setFilters((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const getCoursesArray = (coursesData) => {
    if (!coursesData) return [];
    if (Array.isArray(coursesData)) return coursesData;
    if (typeof coursesData === 'string') {
      if (coursesData.includes(',')) return coursesData.split(',').map((c) => c.trim());
      return [coursesData];
    }
    return [];
  };

  // ✅ Build a dynamic list of cities for the sidebar filter
  const cities = React.useMemo(() => {
    const unique = new Set();
    for (const c of colleges) {
      const city = (c.city || '').trim();
      if (city) unique.add(city);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [colleges]);

  const filteredColleges = colleges.filter((college) => {
    if (filters.collegeName) {
      const searchTerm = filters.collegeName.toLowerCase();
      const collegeName = (college.college_name || '').toLowerCase();
      if (!collegeName.includes(searchTerm)) return false;
    }

    if (filters.state) {
      const filterState = filters.state.toLowerCase();
      const collegeState = (college.state || '').toLowerCase();
      if (!collegeState.includes(filterState)) return false;
    }

    if (filters.city) {
      const filterCity = filters.city.toLowerCase();
      const collegeCity = (college.city || '').toLowerCase();
      if (!collegeCity.includes(filterCity)) return false;
    }

    if (filters.course) {
      const filterCourse = filters.course.toLowerCase();
      const courses = getCoursesArray(college.courses_offered);
      const hasCourse = courses.some((c) => c.toLowerCase().includes(filterCourse));
      if (!hasCourse) return false;
    }

    // ✅ category filter
    if (filters.category) {
      const filterCat = filters.category.toLowerCase();
      const category = (college.category || '').toLowerCase();
      if (!category.includes(filterCat)) return false;
    }

    // ✅ course classification filter (from home page category cards)
    if (filters.courseCategory) {
      if (!collegeMatchesCourseCategory(college, filters.courseCategory)) return false;
    }

    return true;
  });

  return (
    <>
      <SeoHead
        title={pageSeo.title}
        description={pageSeo.description}
        keywords={pageSeo.keywords}
        canonicalPath={pageSeo.canonicalPath}
      />

      <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <section className="py-8 bg-white shadow-sm sticky top-16 z-40">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Find Your <span className="text-blue-600">College</span>
              </h1>

              <div className="md:hidden">
                <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" /> Filters
                </Button>
              </div>

              <div className="relative max-w-md w-full hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-2 border rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="Search by college name..."
                  value={filters.collegeName}
                  onChange={(e) => handleFilterChange({ collegeName: e.target.value })}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className={`lg:w-80 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                <div className="lg:sticky lg:top-28 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
                  <FilterSidebar
                    show={showFilters}
                    onClose={() => setShowFilters(false)}
                    onFilterChange={handleFilterChange}
                    filters={filters}
                    cities={cities}
                  />
                </div>
              </div>

              <div className="flex-1">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-gray-600 text-sm">
                    {loading ? 'Loading...' : `Showing ${filteredColleges.length} results`}
                  </p>

                  {/* ✅ If user came from Home page category cards */}
                  {filters.courseCategory && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {getCourseCategoryByKey(filters.courseCategory)?.label || 'Category'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleFilterChange({ courseCategory: '' })}
                        className="text-xs text-gray-500 hover:text-gray-900 underline"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                  </div>
                ) : filteredColleges.length > 0 ? (
                  <div className="grid gap-6">
                    {filteredColleges.map((college, index) => (
                      <motion.div
                        key={college.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.05 }}
                      >
                        <CollegeCard college={college} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-xl shadow border border-dashed border-gray-300">
                    <h3 className="text-xl font-medium text-gray-900">No colleges found</h3>
                    <p className="text-gray-500 mt-2">Try adjusting your filters.</p>
                    <Button
                      variant="link"
                      onClick={() =>
                        setFilters({
                          state: '',
                          city: '',
                          course: '',
                          collegeName: '',
                          category: '',
                          courseCategory: '',
                        })
                      }
                      className="text-blue-600 mt-2"
                    >
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default CollegeListingsPage;
