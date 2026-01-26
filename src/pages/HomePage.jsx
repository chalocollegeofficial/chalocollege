import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet';
import NewsTicker from '@/components/home/NewsTicker';
import HeroSection from '@/components/home/HeroSection';
import LeadPopup from '@/components/LeadPopup';

/* 🔹 Lazy-loaded below-the-fold sections */
const CourseCategoriesSection = lazy(() =>
  import('@/components/home/CourseCategoriesSection')
);
const ServiceHighlights = lazy(() =>
  import('@/components/home/ServiceHighlights')
);
const EMICalculatorSection = lazy(() =>
  import('@/components/home/EMICalculatorSection')
);
const SuccessStoriesSection = lazy(() =>
  import('@/components/home/SuccessStoriesSection')
);
const FAQSection = lazy(() =>
  import('@/components/home/FAQSection')
);
const CTASection = lazy(() =>
  import('@/components/home/CTASection')
);

const HomePage = () => {
  const [showAutoPopup, setShowAutoPopup] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const isLeadSubmitted = localStorage.getItem('leadSubmitted');
      if (!isLeadSubmitted) {
        setShowAutoPopup(true);
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* ===================== SEO & PERFORMANCE ===================== */}
      <Helmet>
        <title>AaoCollege® – Find Your Perfect College in India</title>
        <meta
          name="description"
          content="Find your perfect college with AaoCollege. Search colleges, courses, fees, admissions, and get expert counseling guidance across India."
        />

        {/* 🔥 Preload Hero Image for LCP */}
        <link rel="preload" as="image" href="/images/hero.webp" />
      </Helmet>

      <div className="bg-gradient-to-b from-blue-50 to-white">
        {/* ✅ News ticker below navbar */}
        <NewsTicker />

        {/* 🔥 Hero section (DO NOT lazy-load) */}
        <HeroSection />

        {/* ⬇️ Below-the-fold content */}
        <Suspense fallback={null}>
          <CourseCategoriesSection />
          <ServiceHighlights />
          <EMICalculatorSection />
          <SuccessStoriesSection />
          <FAQSection />
          <CTASection />
        </Suspense>
      </div>

      {/* ===================== LEAD POPUP ===================== */}
      <LeadPopup
        isOpen={showAutoPopup}
        onClose={() => setShowAutoPopup(false)}
        source="homepage_auto_timer"
        targetCollege="General Enquiry"
      />

    </>
  );
};

export default HomePage;
