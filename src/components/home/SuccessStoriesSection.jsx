import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Award, GraduationCap, Youtube } from 'lucide-react';

const SuccessStoriesSection = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from('success_stories')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) {
            console.error('Supabase fetch error (Stories):', error);
            throw error;
        }
        setStories(data || []);
      } catch (error) {
        console.warn('Unable to fetch success stories - check network connection or table existence.');
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  // Hide gracefully if failed to load or empty
  if (loading || hasError || stories.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
         >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Student <span className="text-green-600">Success Stories</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Inspiring journeys of students who found their dream colleges with us.
            </p>
         </motion.div>

         <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {stories.map((story) => (
                <div 
                    key={story.id} 
                    className="min-w-[300px] md:min-w-[350px] snap-center bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all relative flex flex-col"
                >
                    <div className="p-6 flex-grow pb-16 relative">
                        <div className="flex items-center gap-4 mb-4">
                            <img 
                                src={story.photo_url || "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80"} 
                                alt={story.student_name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-green-100"
                            />
                            <div>
                                <h3 className="font-bold text-gray-900">{story.student_name}</h3>
                                <p className="text-sm text-blue-600 font-medium flex items-center">
                                    <GraduationCap className="w-3 h-3 mr-1" /> {story.course}
                                </p>
                            </div>
                        </div>
                        
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-1">Now Studying at:</p>
                            <p className="font-semibold text-gray-800">{story.college}</p>
                            {story.state && <p className="text-xs text-gray-400">{story.state}</p>}
                        </div>

                        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                            <p className="text-gray-700 text-sm italic">
                                <Award className="w-4 h-4 text-green-600 inline mr-1" />
                                "{story.achievement_description}"
                            </p>
                        </div>

                        {story.youtube_video_url && (
                          <a 
                              href={story.youtube_video_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="absolute bottom-0 right-0 m-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-md transition-transform hover:scale-110 flex items-center justify-center z-10"
                              title="Watch Success Story"
                          >
                              <Youtube className="w-5 h-5 fill-white" />
                          </a>
                        )}
                    </div>
                </div>
            ))}
         </div>
      </div>
    </section>
  );
};

export default SuccessStoriesSection;