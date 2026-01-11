import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import NewsTicker from '@/components/home/NewsTicker';
import HeroSection from '@/components/home/HeroSection';
import CourseCategoriesSection from '@/components/home/CourseCategoriesSection';
import ServiceHighlights from '@/components/home/ServiceHighlights';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import CTASection from '@/components/home/CTASection';
import FAQSection from '@/components/home/FAQSection';
import SuccessStoriesSection from '@/components/home/SuccessStoriesSection';
import EMICalculatorSection from '@/components/home/EMICalculatorSection';
import LeadPopup from '@/components/LeadPopup';

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
      <Helmet>
        <title>Aao College - Find Your Perfect College</title>
        <meta
          name="description"
          content="Find your perfect college with Aao College. Search colleges, get admission consulting, course counseling, and expert guidance for your educational journey."
        />
      </Helmet>

      <div className="bg-gradient-to-b from-blue-50 to-white">
        {/* ✅ News bar below navbar */}
        <NewsTicker />

        <HeroSection />
        <CourseCategoriesSection />
        <ServiceHighlights />
        <EMICalculatorSection />
        <SuccessStoriesSection />
        <FAQSection />
        <CTASection />
      </div>

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
