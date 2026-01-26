import React from 'react';
import { motion } from 'framer-motion';
import { Search, UserCheck, MessageSquare, GitCompare, Award, BookOpen } from 'lucide-react';

const ServiceHighlights = () => {
  const services = [
    {
      icon: Search,
      title: 'College Guidance',
      description: 'Discover the best colleges that match your interests, budget, and career goals.',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: UserCheck,
      title: 'Admission Consulting',
      description: 'Expert guidance through the entire admission process from application to enrollment.',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: MessageSquare,
      title: 'Course Counseling',
      description: 'Personalized counseling to help you choose the right course for your future.',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: GitCompare,
      title: 'College Comparison',
      description: 'Compare colleges side-by-side based on rankings, fees, placements, and facilities.',
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      icon: Award,
      title: 'Scholarship Guidance',
      description: 'Find and apply for scholarships to make your education more affordable.',
      color: 'bg-red-100 text-red-600',
    },
    {
      icon: BookOpen,
      title: 'Entrance Exam Prep',
      description: 'Get guidance and resources for entrance exam preparation and strategy.',
      color: 'bg-indigo-100 text-indigo-600',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive support for your college admission journey
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className={`${service.color} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}>
                <service.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceHighlights;