import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FilterSidebar = ({ show, onClose, onFilterChange, filters, cities = [] }) => {
  const states = [
    'Delhi', 'Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu',
    'Telangana', 'West Bengal', 'Rajasthan', 'Punjab', 'Haryana', 'Madhya Pradesh'
  ];

  const courses = [
    'B.Tech', 'MBA', 'BBA', 'BCA', 'M.Tech', 'MBBS',
    'B.Com', 'BA', 'B.Sc', 'LLB', 'Pharmacy'
  ];

  const categories = ['Government', 'Semi-Government', 'Private'];

  const handleChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const handleClear = () => {
    onFilterChange({
      state: '',
      city: '',
      course: '',
      collegeName: '',
      category: '',
      courseCategory: '',
    });
  };

  const handleApply = () => {
    if (window.innerWidth < 768) onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity ${
          show ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`
          bg-white border border-gray-100 md:rounded-xl w-80 md:w-full z-50
          transition-transform md:transition-none
          fixed inset-y-0 left-0 shadow-xl
          ${show ? 'translate-x-0' : '-translate-x-full'}
          md:static md:translate-x-0 md:shadow-none
        `}
      >
        <div className="p-6 h-full overflow-y-auto md:h-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>

            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg md:hidden">
              <X className="h-5 w-5" />
            </button>

            <button onClick={handleClear} className="text-sm text-red-500 hover:underline hidden md:block">
              Clear All
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Search Name</h3>
              <input
                type="text"
                placeholder="College Name"
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                value={filters.collegeName || ''}
                onChange={(e) => handleChange('collegeName', e.target.value)}
              />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Location (State)</h3>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                value={filters.state || ''}
                onChange={(e) => handleChange('state', e.target.value)}
              >
                <option value="">All Locations</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* ✅ City filter */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">City</h3>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                value={filters.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
              >
                <option value="">All Cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Course</h3>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                value={filters.course || ''}
                onChange={(e) => handleChange('course', e.target.value)}
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* ✅ Category filter */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                value={filters.category || ''}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                <option value="">Any Category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <Button onClick={handleApply} className="w-full bg-blue-600 hover:bg-blue-700 mt-4 md:hidden">
              Show Results
            </Button>

            <Button
              onClick={handleClear}
              variant="outline"
              className="w-full mt-2 md:hidden text-red-500 border-red-200 hover:bg-red-50"
            >
              Clear All Filters
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;
