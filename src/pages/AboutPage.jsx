import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, Award, Users, TrendingUp, Heart } from 'lucide-react';
import SeoHead from '@/components/common/SeoHead';
import { STATIC_PAGE_SEO } from '@/lib/seo';

const AboutPage = () => {
  const pageSeo = STATIC_PAGE_SEO.about;

  const whyChooseUs = [
    // ✅ USP 1 added (Loan services)
    {
      icon: TrendingUp,
      title: 'Student Loan Assistance',
      description: 'We help students access education loan services to support their studies and admissions.',
    },
    // ✅ USP 2 added (Mentorship till placement + career guidance)
    {
      icon: Users,
      title: 'Mentorship Till Placement',
      description: 'We guide students from admission to placement and also provide future career guidance.',
    },
    {
      icon: Users,
      title: 'Expert Counselors',
      description: 'Our team of experienced education counselors provides personalized guidance.',
    },
    {
      icon: Award,
      title: 'Proven Track Record',
      description: '10,000+ students successfully placed in top colleges across India.',
    },
    {
      icon: TrendingUp,
      title: 'Comprehensive Database',
      description: 'Access to information on 5,000+ colleges and universities nationwide.',
    },
    {
      icon: Heart,
      title: 'Student-Centric Approach',
      description: 'We prioritize your dreams, goals, and individual needs above all.',
    },
    
  ];

  return (
    <>
      <SeoHead
        title={pageSeo.title}
        description={pageSeo.description}
        keywords={pageSeo.keywords}
        canonicalPath={pageSeo.canonicalPath}
      />

      <div className="bg-gradient-to-b from-blue-50 to-white">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                About <span className="text-blue-600">Aao</span><span className="text-green-600">College</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Empowering students to make informed decisions about their educational future
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <img alt="About Aao College team" className="rounded-2xl shadow-xl" src="https://images.unsplash.com/photo-1562942668-ccd9a1f2ffc6" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Who We Are</h2>
                <p className="text-gray-600 mb-4">
                  <span className="text-blue-600">Aao</span><span className="text-green-600">College</span> is India's leading college admission guidance platform, dedicated to helping students navigate the complex world of higher education. Founded by education experts and former admission counselors, we understand the challenges students face in choosing the right college and course.
                </p>
                <p className="text-gray-600 mb-4">
                  Our platform combines cutting-edge technology with personalized human guidance to provide comprehensive support throughout your college admission journey. From college selection to final enrollment, we're with you every step of the way.
                </p>
                <p className="text-gray-600">
                  With a database of over 5,000 colleges and a team of experienced counselors, we've helped thousands of students achieve their educational dreams and secure admissions in top institutions across India.
                </p>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
                <p className="text-gray-600">
                  To democratize access to quality education by providing every student with the information, guidance, and support they need to make informed decisions about their college education. We strive to bridge the gap between students' aspirations and their educational opportunities.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <div className="bg-green-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                  <Eye className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
                <p className="text-gray-600">
                  To become India's most trusted and comprehensive college admission platform, where every student can find their perfect educational match. We envision a future where no student's potential is limited by lack of information or guidance in their college selection process.
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
                Why Choose <span className="text-blue-600">Aao</span><span className="text-green-600">College</span>?
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {whyChooseUs.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1"
                  >
                    <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <item.icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 md:p-12 text-center text-white"
            >
              <h2 className="text-3xl font-bold mb-4">Our Commitment to You</h2>
              <p className="text-lg text-blue-100 max-w-3xl mx-auto mb-6">
                We are committed to providing honest, unbiased guidance that puts your interests first. Our success is measured by your success, and we take pride in being part of your educational journey.
              </p>
              <div className="grid md:grid-cols-3 gap-8 mt-8">
                <div>
                  <p className="text-4xl font-bold mb-2">10,000+</p>
                  <p className="text-blue-100">Students Guided</p>
                </div>
                <div>
                  <p className="text-4xl font-bold mb-2">5,000+</p>
                  <p className="text-blue-100">Colleges Listed</p>
                </div>
                <div>
                  <p className="text-4xl font-bold mb-2">98%</p>
                  <p className="text-blue-100">Success Rate</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default AboutPage;
