import React, { useEffect, useState, lazy, Suspense } from 'react';
import NewsTicker from '@/components/home/NewsTicker';
import HeroSection from '@/components/home/HeroSection';
import LeadPopup from '@/components/LeadPopup';
import SeoHead from '@/components/common/SeoHead';
import { STATIC_PAGE_SEO } from '@/lib/seo';

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
  const pageSeo = STATIC_PAGE_SEO.home;

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
      <SeoHead
        title={pageSeo.title}
        description={pageSeo.description}
        keywords={pageSeo.keywords}
        canonicalPath={pageSeo.canonicalPath}
      >
        {/* 🔥 Preload Hero Image for LCP */}
        <link rel="preload" as="image" href="/hero.webp" />
      </SeoHead>

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
