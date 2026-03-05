import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import ImageGallery from '@/components/common/ImageGallery';
import PGEnquiryModal from '@/components/PGEnquiryModal';
import { Loader2, Search, MapPin, Home, PlayCircle, BedDouble, IndianRupee, ShieldCheck } from 'lucide-react';
import SeoHead from '@/components/common/SeoHead';
import { STATIC_PAGE_SEO } from '@/lib/seo';

const PGListingsPage = () => {
  const pageSeo = STATIC_PAGE_SEO.pgListings;
  const { toast } = useToast();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [prefillLocation, setPrefillLocation] = useState('');
  const [selectedPg, setSelectedPg] = useState(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pg_listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to fetch PG listings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isApproved = (pg) => {
    if (!pg || typeof pg !== 'object') return false;

    const hasIsApproved = Object.prototype.hasOwnProperty.call(pg, 'is_approved');
    const hasApproved = Object.prototype.hasOwnProperty.call(pg, 'approved');
    const hasStatus = Object.prototype.hasOwnProperty.call(pg, 'status');
    const hasApprovalStatus = Object.prototype.hasOwnProperty.call(pg, 'approval_status');

    // Legacy records: if no approval columns exist, treat as approved.
    if (!hasIsApproved && !hasApproved && !hasStatus && !hasApprovalStatus) return true;

    if (hasIsApproved && pg.is_approved === true) return true;
    if (hasApproved && pg.approved === true) return true;
    if (hasStatus && String(pg.status || '').toLowerCase() === 'approved') return true;
    if (hasApprovalStatus && String(pg.approval_status || '').toLowerCase() === 'approved') return true;

    return false;
  };

  const filtered = useMemo(() => {
    const approvedListings = (listings || []).filter(isApproved);
    const q = (searchTerm || '').trim().toLowerCase();
    if (!q) return approvedListings;

    return approvedListings.filter((pg) => {
      const name = (pg.pg_name || '').toLowerCase();
      const loc = (pg.location || '').toLowerCase();
      return name.includes(q) || loc.includes(q);
    });
  }, [listings, searchTerm]);

  const openEnquiry = ({ location = '', pg = null } = {}) => {
    setPrefillLocation(location || '');
    setSelectedPg(pg);
    setShowEnquiry(true);
  };

  const parseFacilities = (fac) => {
    if (!fac) return [];
    if (Array.isArray(fac)) return fac.filter(Boolean);
    if (typeof fac === 'string') {
      return fac.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const pgListingSchema = useMemo(() => {
    const elements = (listings || [])
      .filter(isApproved)
      .slice(0, 20)
      .map((pg, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: pg.pg_name || 'PG Listing',
        item: 'https://aaocollege.com/get-pg',
      }));

    if (elements.length === 0) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Student PG Listings',
      itemListElement: elements,
    };
  }, [listings]);

  return (
    <>
      <SeoHead
        title={pageSeo.title}
        description={pageSeo.description}
        keywords={pageSeo.keywords}
        canonicalPath={pageSeo.canonicalPath}
        jsonLd={pgListingSchema}
      />

      <PGEnquiryModal
        isOpen={showEnquiry}
        onClose={() => setShowEnquiry(false)}
        prefillLocation={prefillLocation}
        selectedPg={selectedPg}
      />

      <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen">
        {/* Header */}
        <section className="py-8 bg-white shadow-sm sticky top-16 z-40">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Find Your <span className="text-blue-600">PG</span>
              </h1>

              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-2 border rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="Search by PG name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* ✅ Actions */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => openEnquiry({ location: '', pg: null })}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Send Enquiry
                </Button>

                {/* ✅ List Your PG moved here */}
                <Button
                  asChild
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Link to="/register-pg">List Your PG</Link>
                </Button>
              </div>
            </div>

            {/* Optional small helper text under header */}
            {/* <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span>
                Verified listings only. Contact details are shared after enquiry (phone number is not shown publicly).
              </span>
            </div> */}
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600 text-sm">
                {loading ? 'Loading...' : `Showing ${filtered.length} results`}
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl shadow border border-dashed border-gray-300">
                <h3 className="text-xl font-medium text-gray-900">No PG found</h3>
                <p className="text-gray-500 mt-2">Try searching with a different name or location.</p>
                <Button variant="link" className="text-blue-600 mt-2" onClick={() => setSearchTerm('')}>
                  Clear search
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {filtered.map((pg) => {
                  const facilities = parseFacilities(pg.facilities);
                  return (
                    <div
                      key={pg.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openEnquiry({ location: pg.location, pg })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openEnquiry({ location: pg.location, pg });
                        }
                      }}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                          <ImageGallery
                            images={pg.images}
                            alt={pg.pg_name || 'PG'}
                            className="h-full min-h-[220px]"
                          />
                        </div>

                        <div className="md:col-span-2 p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {pg.pg_name || 'PG'}
                              </h3>

                              <div className="flex items-center text-gray-600">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span>{pg.location || 'N/A'}</span>
                              </div>
                            </div>

                            <div className="hidden sm:flex items-center bg-blue-50 px-3 py-1 rounded-lg text-blue-700">
                              <Home className="h-4 w-4 mr-1" />
                              <span className="text-sm font-semibold">PG</span>
                            </div>
                          </div>

                          <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                            <span>
                              Verified listings only. Contact details are shared after you send an enquiry.
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center text-gray-600">
                              <BedDouble className="h-4 w-4 mr-2 text-purple-600" />
                              <div>
                                <p className="text-xs text-gray-500">Room Type</p>
                                <p className="font-semibold text-gray-900">{pg.room_type || 'N/A'}</p>
                              </div>
                            </div>

                            <div className="flex items-center text-gray-600">
                              <IndianRupee className="h-4 w-4 mr-2 text-green-600" />
                              <div>
                                <p className="text-xs text-gray-500">Rent</p>
                                <p className="font-semibold text-gray-900">{pg.rent_range || 'N/A'}</p>
                              </div>
                            </div>
                          </div>

                          {facilities.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-500 mb-2">Facilities:</p>
                              <div className="flex flex-wrap gap-2">
                                {facilities.slice(0, 8).map((f, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium"
                                  >
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-3 items-center">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEnquiry({ location: pg.location, pg });
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Send Enquiry
                            </Button>

                            {pg.video_url && (
                              <a
                                href={pg.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center h-10 px-4 rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors text-sm"
                                title="Watch Video"
                              >
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Video Tour
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default PGListingsPage;
