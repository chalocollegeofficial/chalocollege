import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  IndianRupee,
  Clock,
  Star,
  TrendingUp,
  Award,
  BookOpen,
  ArrowLeft,
  Send,
  CheckCircle,
  Upload,
  Loader2,
  Lock,
  Download,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { validateName, validateEmail, validateLinkedInUrl } from '@/utils/validation';
import ImageGallery from '@/components/common/ImageGallery';
import SafeHtml from '@/components/common/SafeHtml';
import { createCollegeSlug, createCourseSlug, extractCollegeIdFromSlug } from '@/utils/slug';

const CollegeDetailPage = () => {
  const { collegeSlug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Supports both legacy UUID URLs and new SEO slugs like: "college-name-<uuid>"
  const collegeId = useMemo(() => extractCollegeIdFromSlug(collegeSlug), [collegeSlug]);

  const [collegeData, setCollegeData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseLevelFilter, setCourseLevelFilter] = useState('UG');
  const [expandedCourseKey, setExpandedCourseKey] = useState(null);

  // Brochure download state
  const [isBrochureDownloading, setIsBrochureDownloading] = useState(false);

  // Review Form State
  const [reviewForm, setReviewForm] = useState({
    name: '',
    email: '',
    linkedin: '',
    rating: 5,
    review: '',
    idCard: null,
  });
  const [reviewErrors, setReviewErrors] = useState({});

  const hasBrochure = (val) => {
    if (!val) return false;
    const v = String(val).trim().toUpperCase();
    return v !== 'EMPTY' && v !== 'NULL';
  };

  // ✅ Admin uploads brochure in bucket: documents and stores FULL public URL
  // Still keeping fallback if someone stores only path later.
  const resolveBrochureUrl = async (raw) => {
    if (!hasBrochure(raw)) return null;

    const str = String(raw).trim();

    // already a full url (your admin saves publicUrl like this)
    if (/^https?:\/\//i.test(str)) return str;

    // fallback: treat it as storage path in documents bucket
    try {
      const signed = await supabase.storage.from('documents').createSignedUrl(str, 60);
      if (signed?.data?.signedUrl) return signed.data.signedUrl;

      const pub = supabase.storage.from('documents').getPublicUrl(str);
      if (pub?.data?.publicUrl) return pub.data.publicUrl;
    } catch (e) {
      // ignore
    }

    return str;
  };

  const handleDownloadBrochure = async () => {
    try {
      setIsBrochureDownloading(true);

      const url = await resolveBrochureUrl(collegeData?.brochure_url);
      if (!url) {
        toast({
          title: 'Brochure not available',
          description: 'Is college ka brochure upload nahi hai.',
          variant: 'destructive',
        });
        return;
      }

      const safeName = (collegeData?.college_name || 'college')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '_');

      const filename = `${safeName}_Brochure.pdf`;

      // Try: fetch -> blob -> auto download
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Download failed');

        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(blobUrl);
      } catch (e) {
        // Fallback: open in new tab (CORS etc.)
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Download failed',
        description: 'Brochure download nahi ho paya. Try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsBrochureDownloading(false);
    }
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('college_reviews')
      .select('*')
      .eq('college_id', collegeId)
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    if (data) setReviews(data);
  };

  useEffect(() => {
    const fetchCollege = async () => {
      try {
        const { data, error } = await supabase.from('colleges').select('*').eq('id', collegeId).single();
        if (error) throw error;

        // ✅ Fix: images are stored as TEXT JSON string from admin (JSON.stringify(array))
        let parsedImages = [];
        if (Array.isArray(data?.images)) {
          parsedImages = data.images;
        } else if (typeof data?.images === 'string') {
          try {
            const parsed = JSON.parse(data.images);
            parsedImages = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
          } catch (e) {
            parsedImages = data.images ? [data.images] : [];
          }
        }

        setCollegeData({
          ...data,
          images: parsedImages,
        });
      } catch (e) {
        console.error('College not found or error loading', e);
        setCollegeData(null);
      } finally {
        setLoading(false);
      }
    };

    if (collegeId) {
      fetchCollege();
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  const handleReviewFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Max 5MB allowed.', variant: 'destructive' });
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({ title: 'Invalid File', description: 'Only JPG, PNG, WebP allowed.', variant: 'destructive' });
        return;
      }

      setReviewForm((prev) => ({ ...prev, idCard: file }));
      setReviewErrors((prev) => ({ ...prev, idCard: null }));
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!validateName(reviewForm.name)) errors.name = 'Invalid name (Alphabets only).';
    if (reviewForm.email && !validateEmail(reviewForm.email)) errors.email = 'Invalid email address.';
    if (reviewForm.linkedin && !validateLinkedInUrl(reviewForm.linkedin)) errors.linkedin = 'Invalid LinkedIn URL.';
    if (!reviewForm.idCard) errors.idCard = 'College ID card image is required for verification.';
    if (!reviewForm.review || reviewForm.review.length < 20) errors.review = 'Review too short (min 20 chars).';

    if (Object.keys(errors).length > 0) {
      setReviewErrors(errors);
      toast({ title: 'Validation Error', description: 'Please fix errors before submitting.', variant: 'destructive' });
      return;
    }

    setIsReviewSubmitting(true);

    try {
      // 1. Upload ID Card
      const fileExt = reviewForm.idCard.name.split('.').pop();
      const fileName = `${collegeId}/${Math.random()}.${fileExt}`;
      const filePath = `verification/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('secure-documents').upload(filePath, reviewForm.idCard);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('secure-documents').getPublicUrl(filePath);
      const idCardUrl = urlData.publicUrl;

      // 2. Insert Review
      const { error: insertError } = await supabase.from('college_reviews').insert([
        {
          college_id: collegeId,
          student_name: reviewForm.name,
          email: reviewForm.email,
          linkedin_url: reviewForm.linkedin,
          review_text: reviewForm.review,
          rating: parseInt(reviewForm.rating, 10),
          id_card_url: idCardUrl,
          status: 'PENDING',
          is_verified: false,
        },
      ]);

      if (insertError) throw insertError;

      toast({
        title: 'Review Submitted',
        description: 'Your review is pending verification. It will appear once approved by admin.',
        className: 'bg-green-50 border-green-200',
      });

      setReviewForm({ name: '', email: '', linkedin: '', rating: 5, review: '', idCard: null });
      setReviewErrors({});
    } catch (error) {
      console.error(error);
      toast({ title: 'Submission Failed', description: 'Could not submit review. Try again later.', variant: 'destructive' });
    } finally {
      setIsReviewSubmitting(false);
    }
  };

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

  const courseCategories = useMemo(
    () =>
      parseCourseCategories(collegeData?.courses)
        .map((c, idx) => ({
          __index: idx,
          name: c?.name || '',
          level: c?.level || 'UG',
          brochure_url: c?.brochure_url || '',
          subcategories: Array.isArray(c?.subcategories) ? c.subcategories : [],
        }))
        .filter((c) => c.name),
    [collegeData?.courses]
  );
  const filteredCourses = useMemo(
    () => courseCategories.filter((c) => (c.level || 'UG') === courseLevelFilter),
    [courseCategories, courseLevelFilter]
  );

  const collegeCanonicalSlug = useMemo(() => {
    if (collegeData?.id) return createCollegeSlug(collegeData);
    return collegeSlug;
  }, [collegeData, collegeSlug]);

  const canonicalUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/colleges/${collegeCanonicalSlug}`;
    const origin = window.location.origin || '';
    return origin ? `${origin}/colleges/${collegeCanonicalSlug}` : `/colleges/${collegeCanonicalSlug}`;
  }, [collegeCanonicalSlug]);

  const topCourseLinks = useMemo(() => {
    const items = courseCategories.slice(0, 6);
    return items.map((c) => {
      const slug = createCourseSlug(c, c.__index);
      return {
        name: c.name,
        level: String(c.level || 'UG').toUpperCase(),
        url: `/colleges/${collegeCanonicalSlug}/courses/${slug}`,
      };
    });
  }, [courseCategories, collegeCanonicalSlug]);

  // Avoid showing duplicate long description when it's same as brief
  const hasDescription =
    (collegeData?.description || '').trim().length > 0 &&
    (collegeData?.description || '').trim() !== (collegeData?.brief_description || '').trim();

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600 mr-2" />
        Loading College Details...
      </div>
    );

  if (!collegeData)
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">College Not Found</h2>
        <Button onClick={() => navigate('/colleges')}>Back to Listings</Button>
      </div>
    );

  return (
    <>
      <Helmet>
        <title>
          {`${collegeData.college_name}${collegeData.city ? `, ${collegeData.city}` : ''} - Courses, Fees, Placements | Aao College`}
        </title>
        <meta
          name="description"
          content={`Learn about ${collegeData.college_name}${collegeData.city ? ` in ${collegeData.city}` : ''}. Get details on courses, fees, placements, facilities, and admission process.`}
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen pb-12">
        <section className="py-8">
          <div className="container mx-auto px-4">
            <Button onClick={() => navigate('/colleges')} variant="outline" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Colleges
            </Button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8"
            >
              <div className="grid md:grid-cols-2 gap-8">
                {/* Image Gallery */}
                <div className="h-[400px] md:h-auto bg-gray-100">
                  <ImageGallery
                    images={collegeData.images}
                    alt={`${collegeData.college_name} campus`}
                    className="w-full h-full min-h-[400px]"
                  />
                </div>

                <div className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{collegeData.college_name}</h1>
                      <div className="flex items-center text-gray-600 mb-4">
                        <MapPin className="h-5 w-5 mr-2" />
                        <span>{collegeData.city}</span>
                      </div>
                    </div>
                    <div className="flex items-center bg-yellow-100 px-4 py-2 rounded-lg h-fit">
                      <Star className="h-5 w-5 text-yellow-600 mr-2 fill-current" />
                      <span className="font-bold text-yellow-600 text-lg">{collegeData.ranking}</span>
                    </div>
                  </div>

                  {collegeData.brief_description && (
                    <p className="text-gray-700 mb-4 leading-relaxed max-h-24 overflow-hidden">
                      {collegeData.brief_description}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-600 mb-2" />
                      <p className="text-sm text-gray-600">Ranking</p>
                      <p className="text-xl font-bold text-gray-900">#{collegeData.ranking || 'N/A'}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <IndianRupee className="h-6 w-6 text-green-600 mb-2" />
                      <p className="text-sm text-gray-600">Fees</p>
                      <p className="text-xl font-bold text-gray-900">{collegeData.fee_range || 'N/A'}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <Clock className="h-6 w-6 text-purple-600 mb-2" />
                      <p className="text-sm text-gray-600">Affiliation</p>
                      <p className="text-xl font-bold text-gray-900">{collegeData.affiliation || 'N/A'}</p>
                    </div>
                  </div>

                  {/* ✅ Apply Now | Brochure | Get Counseling */}
                  <div className="flex gap-3">
                    <Button onClick={() => navigate('/contact')} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Apply Now
                    </Button>

                    {hasBrochure(collegeData.brochure_url) && (
                      <Button
                        type="button"
                        onClick={handleDownloadBrochure}
                        variant="outline"
                        className="flex-1 border-gray-300"
                        disabled={isBrochureDownloading}
                        title="Download brochure PDF"
                      >
                        {isBrochureDownloading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Brochure
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      onClick={() => navigate('/contact')}
                      variant="outline"
                      className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      Get Counseling
                    </Button>
                  </div>

                  {hasBrochure(collegeData.brochure_url) && (
                    <p className="text-xs text-gray-500 mt-2">Brochure will download automatically (PDF).</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* SEO: Dedicated course URLs + strong internal links */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Courses & Fees</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    View all courses in a dedicated page (best for SEO & sharing).
                  </p>
                </div>

                <Link to={`/colleges/${collegeCanonicalSlug}/courses`}>
                  <Button className="bg-blue-600 hover:bg-blue-700">View all courses</Button>
                </Link>
              </div>

              {topCourseLinks.length > 0 ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Top courses</p>
                  <div className="flex flex-wrap gap-2">
                    {topCourseLinks.map((c) => (
                      <Link
                        key={c.url}
                        to={c.url}
                        className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
                        title={`Open ${c.name} (${c.level})`}
                      >
                        <span>{c.name}</span>
                        <span className="text-xs text-blue-600/80">{c.level}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <Tabs defaultValue="overview" className="bg-white rounded-2xl shadow-xl p-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="placements">Placements</TabsTrigger>
                <TabsTrigger value="facilities">Facilities</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">About the College</h3>

                  {hasDescription && (
                    <div className="prose prose-slate max-w-none text-gray-700">
                      <SafeHtml html={collegeData.description} />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="courses" className="mt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl shadow-inner">
                      <button
                        type="button"
                        onClick={() => setCourseLevelFilter('UG')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          courseLevelFilter === 'UG'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        UG
                      </button>
                      <button
                        type="button"
                        onClick={() => setCourseLevelFilter('PG')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          courseLevelFilter === 'PG'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        PG
                      </button>
                    </div>
                    <span className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                      {courseLevelFilter === 'UG' ? 'Undergraduate' : 'Postgraduate'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-slate-500 font-medium">Click a category to expand details</p>
                    <Link
                      to={`/colleges/${collegeCanonicalSlug}/courses`}
                      className="text-xs text-blue-700 hover:text-blue-900 underline font-semibold"
                      title="Open all courses & fees"
                    >
                      View all courses page
                    </Link>
                  </div>
                </div>

                {filteredCourses.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-500 italic">No courses added yet.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6 items-start">
                    {filteredCourses.map((course, index) => {
                      const courseKey = `${courseLevelFilter}-${course.name}-${index}`;
                      const isOpen = expandedCourseKey === courseKey;
                      return (
                        <div
                          key={courseKey}
                          className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_1px_0_0_rgba(15,23,42,0.04)] transition-all duration-200 hover:shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] hover:-translate-y-0.5 self-start ${
                            isOpen ? 'ring-1 ring-slate-200' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedCourseKey(isOpen ? null : courseKey)}
                            className="w-full text-left flex items-center justify-between group"
                            aria-expanded={isOpen}
                          >
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-xl bg-slate-900/5 border border-slate-200 flex items-center justify-center mr-3">
                                <BookOpen className="h-5 w-5 text-slate-800" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900 leading-tight">{course.name}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">Course category</p>
                              </div>
                            </div>
                            <ChevronDown
                              className={`h-5 w-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            />
                          </button>

                          <div className="flex items-center gap-3 mt-2">
                            <Link
                              to={`/colleges/${collegeCanonicalSlug}/courses/${createCourseSlug(course, course.__index)}`}
                              className="text-xs text-blue-700 underline inline-flex items-center"
                              title="Open course details page"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              Course details
                            </Link>

                            {course.brochure_url && (
                              <a
                                href={course.brochure_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-slate-700 hover:text-slate-900 underline inline-flex items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Download className="h-3.5 w-3.5 mr-1" />
                                Brochure
                              </a>
                            )}
                          </div>

                          <div
                            className={`mt-5 overflow-hidden transition-all duration-300 ${
                              isOpen ? 'max-h-[640px] opacity-100' : 'max-h-0 opacity-0'
                            }`}
                          >
                            {course.subcategories.length > 0 ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl bg-slate-900/5 border border-slate-200">
                                  <span className="text-left">Specialization</span>
                                  <span className="text-center">Fee</span>
                                  <span className="text-center">Duration</span>
                                </div>
                                {course.subcategories.map((sub, subIdx) => (
                                  <div
                                    key={`${sub.name}-${subIdx}`}
                                    className="bg-white rounded-xl p-2 border border-slate-200 shadow-[0_1px_0_0_rgba(15,23,42,0.02)] transition-all hover:border-slate-300 hover:shadow-[0_10px_24px_-18px_rgba(15,23,42,0.35)]"
                                  >
                                    <div className="grid grid-cols-3 gap-2 items-center">
                                      <div className="h-9 rounded-lg bg-slate-50 border border-slate-200 px-2 flex items-center text-sm font-semibold text-slate-900 truncate">
                                        {sub.name || 'Specialization'}
                                      </div>
                                      <div className="h-9 rounded-lg bg-slate-50 border border-slate-200 px-2 flex items-center justify-center text-sm font-semibold text-slate-800 truncate">
                                        {sub.fee ? sub.fee : 'Fee: N/A'}
                                      </div>
                                      <div className="h-9 rounded-lg bg-slate-50 border border-slate-200 px-2 flex items-center justify-center text-sm font-semibold text-slate-800 truncate">
                                        {sub.duration ? sub.duration : 'Duration: N/A'}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500">No specializations added.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="placements" className="mt-6">
                {collegeData.placements && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-green-50 p-6 rounded-lg">
                      <p className="text-sm text-gray-600">Average Package</p>
                      <p className="text-2xl font-bold">{collegeData.placements.average}</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <p className="text-sm text-gray-600">Highest Package</p>
                      <p className="text-2xl font-bold">{collegeData.placements.highest}</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="facilities" className="mt-6">
                <div className="grid md:grid-cols-3 gap-4">
                  {Array.isArray(collegeData.facilities) &&
                    collegeData.facilities.map((f, i) => (
                      <div key={i} className="bg-gray-50 p-4 rounded-lg flex items-center">
                        <Award className="h-5 w-5 text-blue-600 mr-2" /> {f}
                      </div>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Review List */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Verified Student Reviews</h3>
                    {reviews.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed">
                        <p className="text-gray-500 italic">No verified reviews yet.</p>
                        <p className="text-sm text-gray-400">Be the first student to get verified!</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {reviews.map((rev) => (
                          <div key={rev.id} className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900">{rev.student_name}</span>
                                  {rev.is_verified && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                      <CheckCircle className="w-3 h-3 mr-1 fill-green-600 text-white" /> Verified Student
                                    </span>
                                  )}
                                </div>
                                {rev.linkedin_url && (
                                  <a
                                    href={rev.linkedin_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                  >
                                    View LinkedIn Profile
                                  </a>
                                )}
                              </div>
                              <div className="flex text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < rev.rating ? 'fill-current' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{rev.review_text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Write Review Form */}
                  <div className="bg-white border rounded-xl p-6 shadow-sm h-fit sticky top-24">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Write a Review</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Share your experience and help others. ID card required for verification.
                    </p>

                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          required
                          type="text"
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-100 outline-none ${
                            reviewErrors.name ? 'border-red-500' : ''
                          }`}
                          value={reviewForm.name}
                          onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                          placeholder="Your Name"
                        />
                        {reviewErrors.name && <span className="text-xs text-red-500">{reviewErrors.name}</span>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                        <input
                          type="email"
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-100 outline-none ${
                            reviewErrors.email ? 'border-red-500' : ''
                          }`}
                          value={reviewForm.email}
                          onChange={(e) => setReviewForm({ ...reviewForm, email: e.target.value })}
                          placeholder="For internal reference"
                        />
                        {reviewErrors.email && <span className="text-xs text-red-500">{reviewErrors.email}</span>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL (Optional)</label>
                        <input
                          type="url"
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-100 outline-none ${
                            reviewErrors.linkedin ? 'border-red-500' : ''
                          }`}
                          value={reviewForm.linkedin}
                          onChange={(e) => setReviewForm({ ...reviewForm, linkedin: e.target.value })}
                          placeholder="https://linkedin.com/in/..."
                        />
                        {reviewErrors.linkedin && <span className="text-xs text-red-500">{reviewErrors.linkedin}</span>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Upload College ID (Required for Verification) *
                        </label>
                        <div
                          className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors relative ${
                            reviewErrors.idCard ? 'border-red-500 bg-red-50' : ''
                          }`}
                        >
                          <input
                            required
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleReviewFileChange}
                          />
                          <div className="pointer-events-none">
                            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 font-medium">
                              {reviewForm.idCard ? reviewForm.idCard.name : 'Click to upload ID Card'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Max 5MB (JPG, PNG)</p>
                          </div>
                        </div>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Lock className="w-3 h-3 mr-1" /> Your ID is securely stored and only visible to admins.
                        </div>
                        {reviewErrors.idCard && (
                          <span className="text-xs text-red-500 block mt-1">{reviewErrors.idCard}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  star <= reviewForm.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Review *</label>
                        <textarea
                          required
                          rows="4"
                          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-100 outline-none ${
                            reviewErrors.review ? 'border-red-500' : ''
                          }`}
                          value={reviewForm.review}
                          onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                          placeholder="Share your experience (min 20 chars)..."
                        />
                        {reviewErrors.review && <span className="text-xs text-red-500">{reviewErrors.review}</span>}
                      </div>

                      <Button
                        type="submit"
                        disabled={isReviewSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base"
                      >
                        {isReviewSubmitting ? (
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                          <Send className="w-5 h-5 mr-2" />
                        )}
                        Submit for Verification
                      </Button>
                    </form>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </>
  );
};

export default CollegeDetailPage;
