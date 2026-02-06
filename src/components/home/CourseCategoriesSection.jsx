import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  Briefcase,
  Scale,
  FlaskConical,
  Code2,
  Paintbrush,
  Building2,
  BookOpen,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { supabase } from '@/lib/customSupabaseClient';
import {
  COURSE_CATEGORIES,
  collegeMatchesCourseCategory,
  getMatchingCoursesForCategory,
} from '@/lib/courseCategories';

const ICONS = {
  cpu: Cpu,
  briefcase: Briefcase,
  scale: Scale,
  flask: FlaskConical,
  code: Code2,
  paintbrush: Paintbrush,
};

const CARD_STYLES = {
  'engineering-technology': 'bg-blue-100 text-blue-600',
  'business-commerce': 'bg-green-100 text-green-600',
  law: 'bg-purple-100 text-purple-600',
  pharmacy: 'bg-yellow-100 text-yellow-600',
  'computer-application': 'bg-indigo-100 text-indigo-600',
  design: 'bg-red-100 text-red-600',
};

const CourseCategoriesSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [colleges, setColleges] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        /**
         * ✅ IMPORTANT:
         * For Course Category mapping we need BOTH:
         * - legacy/simple field: courses_offered (array/string)
         * - new structured field: courses (array of objects with {name, level, subcategories})
         */
        const { data, error } = await supabase
          .from('colleges')
          .select('id, courses_offered, courses');

        if (error) throw error;
        setColleges(data || []);
      } catch (e) {
        console.error('CourseCategoriesSection: Error fetching colleges:', e);
        setColleges([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  const statsByCategory = useMemo(() => {
    const stats = {};
    for (const cat of COURSE_CATEGORIES) {
      stats[cat.key] = { colleges: 0, uniqueCourses: 0 };
    }

    for (const cat of COURSE_CATEGORIES) {
      const matchedColleges = colleges.filter((c) =>
        collegeMatchesCourseCategory(c, cat.key)
      );

      const uniqueCourses = new Set();
      for (const c of matchedColleges) {
        const matches = getMatchingCoursesForCategory(c, cat.key);
        for (const courseName of matches) {
          const clean = String(courseName || '').trim();
          if (clean) uniqueCourses.add(clean);
        }
      }

      stats[cat.key] = {
        colleges: matchedColleges.length,
        uniqueCourses: uniqueCourses.size,
      };
    }

    return stats;
  }, [colleges]);

  const handleClick = (categoryKey) => {
    navigate(`/colleges?courseCategory=${encodeURIComponent(categoryKey)}`);
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Course <span className="text-green-600">Categories</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pick a category to see colleges that offer those courses.
          </p>

          {loading && (
            <div className="mt-4 inline-flex items-center text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading categories…
            </div>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {COURSE_CATEGORIES.map((cat, index) => {
            const Icon = ICONS[cat.icon] || Cpu;
            const s = statsByCategory[cat.key] || { colleges: 0, uniqueCourses: 0 };
            const iconStyle = CARD_STYLES[cat.key] || 'bg-blue-100 text-blue-600';

            return (
              <motion.button
                key={cat.key}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                onClick={() => handleClick(cat.key)}
                className="group relative overflow-hidden bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-transparent hover:ring-1 hover:ring-blue-100/70 hover:bg-gradient-to-br hover:from-white hover:to-gray-50"
                aria-label={`View colleges for ${cat.label}`}
              >
                {/* Hover overlay + shine sweep */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  {/* soft tint */}
                  <span className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-transparent to-green-50/60" />
                  {/* shine */}
                  <span className="absolute -left-1/2 top-0 h-full w-1/2 bg-white/35 rotate-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-700 ease-out" />
                </span>

                <div className="relative z-10">
                  <div
                    className={`${iconStyle} w-14 h-14 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-md`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 transition-colors duration-300 group-hover:text-gray-950">
                    {cat.label}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                    <div className="inline-flex items-center">
                      <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="font-semibold text-gray-900">
                        {loading ? '—' : s.colleges}
                      </span>
                      <span className="ml-1">Colleges</span>
                    </div>
                    <div className="inline-flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-green-600" />
                      <span className="font-semibold text-gray-900">
                        {loading ? '—' : s.uniqueCourses}
                      </span>
                      <span className="ml-1">Courses</span>
                    </div>
                  </div>

                  <div className="mt-5 inline-flex items-center text-sm font-medium text-blue-600 transition-colors duration-300 group-hover:text-blue-700">
                    <span className="relative">
                      View colleges
                      <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-blue-600/70 group-hover:w-full transition-all duration-300" />
                    </span>
                    <ArrowRight className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CourseCategoriesSection;
