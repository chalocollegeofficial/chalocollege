import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Download, ExternalLink, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { createCollegeSlug, createCourseSlug, extractCollegeIdFromSlug } from '@/utils/slug';
import {
  DEFAULT_COURSE_LEVEL,
  getCourseLevelCoursesLabel,
  getCourseLevelOrder,
  getCourseLevelShortLabel,
  normalizeCourseLevel,
} from '@/lib/courseLevels';
import SeoHead from '@/components/common/SeoHead';
import { pickSeoDescription, pickSeoKeywords, pickSeoTitle } from '@/lib/seo';

const parseCourseCategories = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

const getOrigin = () => {
  if (typeof window === 'undefined') return '';
  return window.location.origin || '';
};

const CollegeCoursesPage = () => {
  const { collegeSlug } = useParams();
  const navigate = useNavigate();

  const [collegeData, setCollegeData] = useState(null);
  const [loading, setLoading] = useState(true);

  const collegeId = useMemo(() => extractCollegeIdFromSlug(collegeSlug), [collegeSlug]);

  useEffect(() => {
    const fetchCollege = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('colleges').select('*').eq('id', collegeId).single();
        if (error) throw error;
        setCollegeData(data || null);
      } catch (e) {
        console.error('Failed to load college for courses page:', e);
        setCollegeData(null);
      } finally {
        setLoading(false);
      }
    };

    if (collegeId) fetchCollege();
  }, [collegeId]);

  const collegeCanonicalSlug = useMemo(() => {
    if (collegeData?.id) return createCollegeSlug(collegeData);
    return collegeSlug;
  }, [collegeData, collegeSlug]);

  const canonicalPath = useMemo(
    () => `/colleges/${collegeCanonicalSlug}/courses`,
    [collegeCanonicalSlug]
  );

  const canonicalUrl = useMemo(() => {
    const origin = getOrigin();
    return origin ? `${origin}${canonicalPath}` : canonicalPath;
  }, [canonicalPath]);

  const courseCategories = useMemo(() => {
    const list = parseCourseCategories(collegeData?.courses)
      .map((c, idx) => ({
        __index: idx,
        name: c?.name || '',
        level: normalizeCourseLevel(c?.level || DEFAULT_COURSE_LEVEL),
        brochure_url: c?.brochure_url || '',
        subcategories: Array.isArray(c?.subcategories) ? c.subcategories : [],
      }))
      .filter((c) => c.name);

    return list;
  }, [collegeData?.courses]);

  const coursesByLevel = useMemo(() => {
    const groups = {};
    for (const c of courseCategories) {
      const lvl = normalizeCourseLevel(c.level || DEFAULT_COURSE_LEVEL);
      if (!groups[lvl]) groups[lvl] = [];
      groups[lvl].push(c);
    }
    return groups;
  }, [courseCategories]);

  const jsonLdItemList = useMemo(() => {
    const origin = getOrigin();
    const items = courseCategories.slice(0, 20).map((c, i) => {
      const courseSlugForUrl = createCourseSlug(c, c.__index);
      const url = `${origin}/colleges/${collegeCanonicalSlug}/courses/${courseSlugForUrl}`;
      return {
        '@type': 'ListItem',
        position: i + 1,
        url,
      };
    });

    if (items.length < 3) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: items,
    };
  }, [collegeCanonicalSlug, courseCategories]);

  const seoTitle = useMemo(
    () =>
      pickSeoTitle(
        collegeData?.meta_title ? `${collegeData.meta_title} Courses & Fees` : '',
        `${collegeData?.college_name || 'College'} Courses & Fees - Aao College`
      ),
    [collegeData?.college_name, collegeData?.meta_title]
  );

  const seoDescription = useMemo(
    () =>
      pickSeoDescription(
        collegeData?.meta_description,
        `Explore all courses and fees at ${collegeData?.college_name || 'this college'}. View UG, PG, certificate, diploma, doctoral, and working-professional programs with specializations, duration, and brochure links.`
      ),
    [collegeData?.college_name, collegeData?.meta_description]
  );

  const seoKeywords = useMemo(
    () =>
      pickSeoKeywords(collegeData?.meta_keywords, [
        collegeData?.college_name,
        `${collegeData?.college_name || 'college'} courses`,
        `${collegeData?.college_name || 'college'} fees`,
        'college courses',
      ]),
    [collegeData?.college_name, collegeData?.meta_keywords]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600 mr-2" />
        Loading courses...
      </div>
    );
  }

  if (!collegeData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">College Not Found</h2>
        <Button onClick={() => navigate('/colleges')}>Back to Listings</Button>
      </div>
    );
  }

  return (
    <>
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl={canonicalUrl}
        jsonLd={jsonLdItemList}
      />

      <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen pb-12">
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate(`/colleges/${collegeCanonicalSlug}`)}
                variant="outline"
                className="w-fit"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to College
              </Button>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Courses & Fees at <span className="text-blue-600">{collegeData.college_name}</span>
                </h1>
                <p className="text-gray-600 mt-2">
                  Browse all course levels, specializations, duration, and fee details.
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-8">
              {Object.keys(coursesByLevel).length === 0 ? (
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                  <p className="text-gray-600">No courses added yet.</p>
                </div>
              ) : (
                Object.entries(coursesByLevel)
                  .sort(([a], [b]) => {
                    return getCourseLevelOrder(a) - getCourseLevelOrder(b);
                  })
                  .map(([level, list]) => (
                    <div key={level} className="bg-white rounded-2xl shadow-xl p-6">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                        {getCourseLevelCoursesLabel(level)}
                      </h2>

                      <div className="grid md:grid-cols-2 gap-6">
                        {list.map((course) => {
                          const courseSlugForUrl = createCourseSlug(course, course.__index);
                          const courseUrl = `/colleges/${collegeCanonicalSlug}/courses/${courseSlugForUrl}`;

                          return (
                            <div
                              key={`${level}-${course.__index}`}
                              className="border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-shadow"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <Link to={courseUrl} className="text-lg font-semibold text-slate-900 hover:text-blue-700">
                                    {course.name}
                                  </Link>
                                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">
                                    {getCourseLevelShortLabel(course.level || DEFAULT_COURSE_LEVEL)}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Link
                                    to={courseUrl}
                                    className="inline-flex items-center text-sm text-blue-700 hover:text-blue-900"
                                    title="Open course details"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Details
                                  </Link>

                                  {course.brochure_url ? (
                                    <a
                                      href={course.brochure_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-sm text-slate-700 hover:text-slate-900"
                                      title="Open brochure"
                                    >
                                      <Download className="h-4 w-4 mr-1" />
                                      Brochure
                                    </a>
                                  ) : null}
                                </div>
                              </div>

                              {Array.isArray(course.subcategories) && course.subcategories.length > 0 ? (
                                <div className="mt-4">
                                  <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-slate-700" />
                                    Specializations
                                  </p>

                                  <div className="mt-2 overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="text-left text-slate-500">
                                          <th className="py-2 pr-3">Name</th>
                                          <th className="py-2 pr-3">Fee</th>
                                          <th className="py-2">Duration</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {course.subcategories.map((s, idx) => (
                                          <tr key={idx} className="border-t border-slate-100">
                                            <td className="py-2 pr-3 text-slate-900">{s?.name || '—'}</td>
                                            <td className="py-2 pr-3 text-slate-700">{s?.fee || '—'}</td>
                                            <td className="py-2 text-slate-700">{s?.duration || '—'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ) : (
                                <p className="mt-3 text-sm text-slate-500 italic">Specialization details not added yet.</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default CollegeCoursesPage;
