import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Download, ExternalLink, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { createCollegeSlug, createCourseSlug, extractCollegeIdFromSlug, parseCourseSlug } from '@/utils/slug';
import {
  DEFAULT_COURSE_LEVEL,
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

const CollegeCourseDetailPage = () => {
  const { collegeSlug, courseSlug } = useParams();
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
        console.error('Failed to load college for course detail:', e);
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

  const courses = useMemo(() => {
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

  const selectedCourse = useMemo(() => {
    if (!courseSlug) return null;

    const parsed = parseCourseSlug(courseSlug);
    if (parsed?.index !== null && Number.isFinite(parsed.index)) {
      const byIndex = courses.find((c) => c.__index === parsed.index);
      if (byIndex) return byIndex;
    }

    // fallback
    const fallback = courses.find((c) => createCourseSlug(c, c.__index) === courseSlug);
    return fallback || null;
  }, [courseSlug, courses]);

  const canonicalPath = useMemo(() => {
    const slug = selectedCourse ? createCourseSlug(selectedCourse, selectedCourse.__index) : courseSlug;
    return `/colleges/${collegeCanonicalSlug}/courses/${slug}`;
  }, [collegeCanonicalSlug, selectedCourse, courseSlug]);

  const canonicalUrl = useMemo(() => {
    const origin = getOrigin();
    return origin ? `${origin}${canonicalPath}` : canonicalPath;
  }, [canonicalPath]);

  const courseSchema = useMemo(() => {
    if (!selectedCourse || !collegeData) return null;
    const origin = getOrigin();

    return {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: `${selectedCourse.name} - ${collegeData.college_name}`,
      description: `Course offered by ${collegeData.college_name}. Explore specializations, duration, and fee details.`,
      provider: {
        '@type': 'CollegeOrUniversity',
        name: collegeData.college_name,
        url: origin ? `${origin}/colleges/${collegeCanonicalSlug}` : `/colleges/${collegeCanonicalSlug}`,
      },
    };
  }, [selectedCourse, collegeData, collegeCanonicalSlug]);

  const seoTitle = useMemo(
    () =>
      pickSeoTitle(
        '',
        `${selectedCourse?.name || 'Course'} at ${collegeData?.college_name || 'College'} - Aao College`
      ),
    [selectedCourse?.name, collegeData?.college_name]
  );

  const seoDescription = useMemo(
    () =>
      pickSeoDescription(
        '',
        `Explore ${selectedCourse?.name || 'course'} at ${collegeData?.college_name || 'this college'}. View specializations, fee, duration, and brochure links.`
      ),
    [selectedCourse?.name, collegeData?.college_name]
  );

  const seoKeywords = useMemo(
    () =>
      pickSeoKeywords(collegeData?.meta_keywords, [
        selectedCourse?.name,
        `${selectedCourse?.name || 'course'} fee`,
        `${selectedCourse?.name || 'course'} duration`,
        collegeData?.college_name,
      ]),
    [collegeData?.college_name, collegeData?.meta_keywords, selectedCourse?.name]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600 mr-2" />
        Loading course details...
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

  if (!selectedCourse) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
        <p className="text-gray-600 mb-6">This course may have been removed or updated.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(`/colleges/${collegeCanonicalSlug}/courses`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
          <Button onClick={() => navigate(`/colleges/${collegeCanonicalSlug}`)}>College Overview</Button>
        </div>
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
        jsonLd={courseSchema}
      />

      <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen pb-12">
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => navigate(`/colleges/${collegeCanonicalSlug}/courses`)}
                  variant="outline"
                  className="w-fit"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Courses
                </Button>

                <Button
                  onClick={() => navigate(`/colleges/${collegeCanonicalSlug}`)}
                  variant="outline"
                  className="w-fit"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  College Overview
                </Button>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <nav className="text-sm text-gray-600 mb-4">
                  <Link to="/colleges" className="hover:text-gray-900 underline">
                    Colleges
                  </Link>
                  <span className="mx-2">/</span>
                  <Link to={`/colleges/${collegeCanonicalSlug}`} className="hover:text-gray-900 underline">
                    {collegeData.college_name}
                  </Link>
                  <span className="mx-2">/</span>
                  <Link to={`/colleges/${collegeCanonicalSlug}/courses`} className="hover:text-gray-900 underline">
                    Courses
                  </Link>
                  <span className="mx-2">/</span>
                  <span className="text-gray-900 font-medium">{selectedCourse.name}</span>
                </nav>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {selectedCourse.name}{' '}
                  <span className="text-gray-500 font-semibold">
                    ({getCourseLevelShortLabel(selectedCourse.level || DEFAULT_COURSE_LEVEL)})
                  </span>
                </h1>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    to={`/colleges/${collegeCanonicalSlug}/courses`}
                    className="inline-flex items-center text-sm text-blue-700 hover:text-blue-900"
                    title="View all courses"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View all courses
                  </Link>

                  {selectedCourse.brochure_url ? (
                    <a
                      href={selectedCourse.brochure_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-slate-700 hover:text-slate-900"
                      title="Open brochure"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download brochure
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-gray-700" />
                  Specializations, Fees & Duration
                </h2>

                {Array.isArray(selectedCourse.subcategories) && selectedCourse.subcategories.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="py-2 pr-3">Specialization</th>
                          <th className="py-2 pr-3">Fee</th>
                          <th className="py-2">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCourse.subcategories.map((s, idx) => (
                          <tr key={idx} className="border-t border-slate-100">
                            <td className="py-2 pr-3 text-slate-900">{s?.name || '—'}</td>
                            <td className="py-2 pr-3 text-slate-700">{s?.fee || '—'}</td>
                            <td className="py-2 text-slate-700">{s?.duration || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600">Specialization details not added yet.</p>
                )}

                <div className="mt-6 text-xs text-gray-500">
                  Note: Fees and duration are based on the latest information provided by the college/admin and may change.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default CollegeCourseDetailPage;
