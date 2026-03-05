import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChatbotWidget from '@/components/home/ChatbotWidget';

// --- Scroll restoration ---
// Keeps the user at the same scroll position when they navigate back to a page
// (especially important for long listings like /colleges).
const SCROLL_STORAGE_PREFIX = 'scroll-pos:';

const getScrollStorageKey = (location) => `${location.pathname}${location.search}`;

function ScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();

  // Ensure the browser doesn't fight our manual restoration.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Save scroll position for the current route when we leave it.
  useEffect(() => {
    const key = getScrollStorageKey(location);
    return () => {
      try {
        sessionStorage.setItem(`${SCROLL_STORAGE_PREFIX}${key}`, String(window.scrollY || 0));
      } catch {
        // ignore storage errors (private mode, quota, etc.)
      }
    };
  }, [location]);

  // Restore scroll position on back/forward navigation.
  useEffect(() => {
    const key = getScrollStorageKey(location);

    // Restore on POP (browser back/forward), or when a navigation explicitly asks for it,
    // and also for long listing pages (like /colleges) when we have a saved position.
    let stored = null;
    try {
      stored = sessionStorage.getItem(`${SCROLL_STORAGE_PREFIX}${key}`);
    } catch {
      stored = null;
    }

    const isListingPage = location.pathname === '/colleges';
    const shouldRestore =
      navigationType === 'POP' ||
      location.state?.restoreScroll === true ||
      (isListingPage && stored !== null);

    if (shouldRestore) {
      const y = parseInt(stored || '0', 10);
      const targetY = Number.isFinite(y) ? y : 0;

      // Wait until the next paint so layout is ready.
      requestAnimationFrame(() => {
        window.scrollTo(0, targetY);
      });
      return;
    }

    // Default behavior for new navigations: go to top (or hash target).
    if (location.hash) {
      const id = location.hash.replace('#', '');
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView();
        else window.scrollTo(0, 0);
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.key, location.hash, location.search, location.pathname, navigationType, location.state]);

  return null;
}

// Pages
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import ServicesPage from '@/pages/ServicesPage';
import CollegeListingsPage from '@/pages/CollegeListingsPage';
import CollegeDetailPage from '@/pages/CollegeDetailPage';
import CollegeCoursesPage from '@/pages/CollegeCoursesPage';
import CollegeCourseDetailPage from '@/pages/CollegeCourseDetailPage';
import ContactPage from '@/pages/ContactPage';
import BlogPage from '@/pages/BlogPage';
import BlogDetailPage from '@/pages/BlogDetailPage';
import PGListingsPage from '@/pages/PGListingsPage';
import PGRegisterPage from '@/pages/PGRegisterPage';
import MentorshipPage from '@/pages/MentorshipPage';
import EMICalculatorPage from '@/pages/EMICalculatorPage';

// Admin Imports
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminLeads from '@/pages/admin/AdminLeads';
import AdminUnifiedLeads from '@/pages/admin/AdminUnifiedLeads';
import AdminBlogs from '@/pages/admin/AdminBlogs';
import AdminColleges from '@/pages/admin/AdminColleges';
import AdminPGEnquiries from '@/pages/admin/AdminPGEnquiries';
import AdminPGListings from '@/pages/admin/AdminPGListings';
import AdminSuccessStories from '@/pages/admin/AdminSuccessStories';
import AdminReviews from '@/pages/admin/AdminReviews';
import ProtectedAdminRoute from '@/pages/admin/ProtectedAdminRoute';

const MainLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-grow">
      {children}
    </main>
    <Footer />
    <ChatbotWidget />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Maintains scroll position when navigating back (e.g., College listings → College detail → Back) */}
        <ScrollRestoration />

        <Routes>
          {/* Admin Routes - Login is PUBLIC */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Section */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            {/* Redirect /admin to /admin/dashboard */}
            <Route index element={<Navigate to="/admin/dashboard" replace />} />

            {/* Actual Dashboard Route */}
            <Route path="dashboard" element={<AdminDashboard />} />

            <Route path="leads" element={<AdminLeads />} />
            <Route path="unified-leads" element={<AdminUnifiedLeads />} />
            <Route path="blogs" element={<AdminBlogs />} />
            <Route path="colleges" element={<AdminColleges />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="pg-enquiries" element={<AdminPGEnquiries />} />
            <Route path="pg-listings" element={<AdminPGListings />} />
            <Route path="success-stories" element={<AdminSuccessStories />} />
          </Route>

          {/* Public Routes */}
          <Route
            path="/*"
            element={
              <MainLayout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/services/:serviceSlug" element={<ServicesPage />} />
                  <Route path="/mentorship" element={<MentorshipPage />} />
                  <Route path="/emi-calculator" element={<EMICalculatorPage />} />
                  <Route path="/colleges" element={<CollegeListingsPage />} />

                  {/* ✅ SEO-friendly College + Course URLs */}
                  <Route path="/colleges/:collegeSlug/courses/:courseSlug" element={<CollegeCourseDetailPage />} />
                  <Route path="/colleges/:collegeSlug/courses" element={<CollegeCoursesPage />} />
                  <Route path="/colleges/:collegeSlug" element={<CollegeDetailPage />} />

                  <Route path="/get-pg" element={<PGListingsPage />} />
                  <Route path="/register-pg" element={<PGRegisterPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:blogSlug/:blogId" element={<BlogDetailPage />} />
                  <Route path="/blog/:id" element={<BlogDetailPage />} />
                </Routes>
              </MainLayout>
            }
          />
        </Routes>

        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
