import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, UserCheck, MessageSquare, FileText, Award, BookOpen, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ServicesPage = () => {
  const navigate = useNavigate();

  const services = [
    // ✅ USP 1 added (Loan services)
    {
      icon: Award,
      title: 'Student Loan Assistance',
      description: 'Support for accessing education loan services to help you finance your studies with ease.',
      features: [
        'Loan eligibility guidance',
        'Documentation support',
        'Bank/NBFC loan process assistance',
        'Application and follow-up help',
        'Repayment and future planning guidance',
      ],
      color: 'bg-green-100 text-green-600',
    },
    // ✅ USP 2 added (Mentorship till placement + career guidance)
    {
      icon: UserCheck,
      title: 'Mentorship Till Placement',
      description: 'Guidance from admission to placement, along with future career direction and planning.',
      features: [
        'Admission-to-placement mentorship',
        'Skill and profile-building guidance',
        'Internship and placement support',
        'Career roadmap planning',
        'Continuous future career guidance',
      ],
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Search,
      title: 'College Search & Selection',
      description: 'Find the perfect college that matches your academic profile, interests, and career goals.',
      features: [
        'Personalized college recommendations',
        'Detailed college profiles and rankings',
        'Course-wise college listings',
        'Location-based search options',
        'Budget-friendly college suggestions',
      ],
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: UserCheck,
      title: 'Admission Consulting',
      description: 'Expert guidance through every step of the admission process to maximize your chances of success.',
      features: [
        'Application strategy planning',
        'Document preparation assistance',
        'Admission timeline management',
        'Interview preparation',
        'Follow-up and enrollment support',
      ],
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: MessageSquare,
      title: 'Personalized Counseling',
      description: 'One-on-one counseling sessions with experienced education experts tailored to your needs.',
      features: [
        'Career path guidance',
        'Course selection advice',
        'Academic profile evaluation',
        'Goal setting and planning',
        'Ongoing support and mentorship',
      ],
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: FileText,
      title: 'Application Assistance',
      description: 'Comprehensive support in preparing and submitting college applications.',
      features: [
        'Application form filling guidance',
        'Document verification',
        'Statement of Purpose review',
        'Recommendation letter assistance',
        'Application tracking',
      ],
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      icon: Award,
      title: 'Scholarship Guidance',
      description: 'Help you discover and apply for scholarships to make education more affordable.',
      features: [
        'Scholarship database access',
        'Eligibility assessment',
        'Application preparation',
        'Financial aid counseling',
        'Merit and need-based options',
      ],
      color: 'bg-red-100 text-red-600',
    },
    {
      icon: BookOpen,
      title: 'Entrance Exam Guidance',
      description: 'Strategic guidance for entrance exam preparation and performance optimization.',
      features: [
        'Exam pattern analysis',
        'Study plan creation',
        'Resource recommendations',
        'Mock test guidance',
        'Score improvement strategies',
      ],
      color: 'bg-indigo-100 text-indigo-600',
    },
    
  ];

  return (
    <>
      <Helmet>
        <title>Our Services - Aao College</title>
        <meta name="description" content="Explore Aao College's comprehensive services including college search, admission consulting, personalized counseling, scholarship guidance, and entrance exam preparation." />
      </Helmet>

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
                Our Services
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Comprehensive support for every step of your college admission journey
              </p>
            </motion.div>

            <div className="space-y-12">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="p-8">
                      <div className={`${service.color} w-16 h-16 rounded-lg flex items-center justify-center mb-6`}>
                        <service.icon className="h-8 w-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h2>
                      <p className="text-gray-600 mb-6">{service.description}</p>
                      <Button
                        onClick={() => navigate('/contact')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Get Started
                      </Button>
                    </div>
                    <div className="bg-gray-50 p-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Included:</h3>
                      <ul className="space-y-3">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 md:p-12 text-center text-white"
            >
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started with <span className="text-yellow-300">Aao</span><span className="text-green-300">College</span>?</h2>
              <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-6">
                Book a free consultation with our expert counselors and take the first step towards your dream college.
              </p>
              <Button
                onClick={() => navigate('/contact')}
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-8 py-6 text-lg font-semibold"
              >
                Book Free Consultation
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ServicesPage;
