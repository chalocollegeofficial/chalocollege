import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, IndianRupee, Clock, Star, Building2, ArrowRight, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LeadPopup from '@/components/LeadPopup';
import ImageGallery from '@/components/common/ImageGallery';
import { useSubmissionLock } from '@/utils/useSubmissionLock';
import { createCollegeSlug } from '@/utils/slug';

const CollegeCard = ({ college }) => {
  const navigate = useNavigate();
  const [showLeadPopup, setShowLeadPopup] = useState(false);
  const { hasSubmitted } = useSubmissionLock('lead-global', 180);

  const formatCategory = (value) => {
    if (!value) return 'N/A';
    const s = String(value).trim();
    if (!s) return 'N/A';

    const lowered = s.toLowerCase();
    if (['gov', 'govt', 'government'].includes(lowered)) return 'Government';
    if (['semi-gov', 'semi govt', 'semi government', 'semi-government'].includes(lowered)) return 'Semi-Government';
    if (['pvt', 'private'].includes(lowered)) return 'Private';

    return s
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(' ');
  };

  const handleViewDetails = () => {
    const legacyFlag =
      localStorage.getItem('leadSubmitted') === 'true' ||
      sessionStorage.getItem('leadSubmitted') === 'true';

    const collegeSlug = createCollegeSlug(college);

    if (hasSubmitted || legacyFlag) {
      navigate(`/colleges/${collegeSlug}`);
    } else {
      setShowLeadPopup(true);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
        <div className="grid md:grid-cols-3 gap-6">
          <div
            className="md:col-span-1 cursor-pointer relative"
            onClick={(e) => {
              if (e.target.closest('button') || e.target.closest('a')) return;
              handleViewDetails();
            }}
          >
            <ImageGallery images={college.images} alt={`${college.college_name} campus`} className="h-full min-h-[200px]" />
          </div>

          <div className="md:col-span-2 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="cursor-pointer" onClick={handleViewDetails}>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                  {college.college_name}
                </h3>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{college.city}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-lg">
                  <Star className="h-4 w-4 text-yellow-600 mr-1 fill-current" />
                  <span className="font-semibold text-yellow-600">{college.ranking || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center text-gray-600">
                <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">College Type</p>
                  <p className="font-semibold text-gray-900">{formatCategory(college.category)}</p>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <IndianRupee className="h-4 w-4 mr-2 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Fees</p>
                  <p className="font-semibold text-gray-900">{college.fee_range || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-2 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-500">Affiliation</p>
                  <p className="font-semibold text-gray-900">{college.affiliation || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Courses Offered:</p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(college.courses_offered) ? (
                  college.courses_offered.slice(0, 4).map((course, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm font-medium"
                    >
                      {course}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">View details for courses</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <Button onClick={handleViewDetails} className="bg-blue-600 hover:bg-blue-700">
                View Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                onClick={() => navigate('/contact')}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Apply Now
              </Button>

              {college.video_url && (
                <a
                  href={college.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-10 px-4 rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors text-sm"
                  title="Watch Video Tour"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Video Tour
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <LeadPopup
        isOpen={showLeadPopup}
        onClose={() => setShowLeadPopup(false)}
        source="college_card_click"
        targetCollege={college.college_name}
        onSuccess={() => navigate(`/colleges/${createCollegeSlug(college)}`)}
      />
    </>
  );
};

export default CollegeCard;
