import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChatbotWidget from '@/components/home/ChatbotWidget';

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
        <Helmet>
          <title>Aao College - Find Your Perfect College</title>
          <meta name="description" content="AaoCollege.com par aapko milti hai complete college admission guidance – course selection se lekar form fill, counselling aur final admission tak full support." />
        </Helmet>

        <Routes>
          {/* Admin Routes - Login is PUBLIC */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Section */}
          <Route path="/admin" element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }>
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
          <Route path="/*" element={
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/mentorship" element={<MentorshipPage />} />
                <Route path="/colleges" element={<CollegeListingsPage />} />

                {/* ✅ SEO-friendly College + Course URLs */}
                <Route path="/colleges/:collegeSlug/courses/:courseSlug" element={<CollegeCourseDetailPage />} />
                <Route path="/colleges/:collegeSlug/courses" element={<CollegeCoursesPage />} />
                <Route path="/colleges/:collegeSlug" element={<CollegeDetailPage />} />

                <Route path="/get-pg" element={<PGListingsPage />} />
                <Route path="/register-pg" element={<PGRegisterPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<BlogDetailPage />} />
              </Routes>
            </MainLayout>
          } />
        </Routes>

        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
