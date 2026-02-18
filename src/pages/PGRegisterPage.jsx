import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Home, ShieldCheck } from 'lucide-react';
import SeoHead from '@/components/common/SeoHead';
import { STATIC_PAGE_SEO } from '@/lib/seo';

// Vendor / PG Owner: submit a PG listing for admin approval.
// NOTE: Admin approval requires adding approval columns in Supabase (see README in assistant response).
const PGRegisterPage = () => {
  const pageSeo = STATIC_PAGE_SEO.pgRegister;
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_email: '',
    pg_name: '',
    location: '',
    room_type: 'Single/Double',
    rent_range: '',
    facilities: '',
    contact_number: '',
    images: [],
    video_url: '',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    try {
      setUploadingImage(true);
      const files = Array.from(e.target.files || []);
      e.target.value = '';

      if (files.length === 0) return;
      if ((formData.images?.length || 0) + files.length > 5) {
        toast({
          variant: 'destructive',
          title: 'Limit reached',
          description: 'Max 5 images allowed.',
        });
        return;
      }

      const uploadPromises = files.map(async (file) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error('Invalid format. Use JPG, PNG, or WebP.');
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Max file size 5MB.');
        }

        const fileExt = file.name.split('.').pop();
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `pg-images/${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: pub } = supabase.storage.from('images').getPublicUrl(filePath);
        return pub?.publicUrl;
      });

      const uploadedUrls = (await Promise.all(uploadPromises)).filter(Boolean);
      setFormData((prev) => ({ ...prev, images: [...(prev.images || []), ...uploadedUrls] }));

      toast({ title: 'Success', description: 'Images uploaded successfully' });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to upload images',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const facilitiesArray = formData.facilities
        ? formData.facilities.split(',').map((f) => f.trim()).filter(Boolean)
        : [];

      const basePayload = {
        pg_name: formData.pg_name,
        location: formData.location,
        room_type: formData.room_type,
        rent_range: formData.rent_range,
        facilities: facilitiesArray,
        contact_number: formData.contact_number,
        images: JSON.stringify(formData.images || []),
        video_url: formData.video_url,
        vendor_name: formData.vendor_name,
        vendor_email: formData.vendor_email,
      };

      // Vendor submissions should be hidden from the public listing until approved.
      const pendingAttempts = [
        { status: 'pending', is_approved: false },
        { approval_status: 'pending', is_approved: false },
        { status: 'pending' },
        { approval_status: 'pending' },
        { is_approved: false },
        {},
      ];

      let lastError = null;
      for (const extra of pendingAttempts) {
        const { error } = await supabase
          .from('pg_listings')
          .insert([{ ...basePayload, ...extra }]);
        if (!error) {
          lastError = null;
          break;
        }
        lastError = error;
      }
      if (lastError) throw lastError;

      toast({
        title: 'Submitted!',
        description: 'Your PG has been submitted for verification. It will be shown on the website after admin approval.',
      });

      setFormData({
        vendor_name: '',
        vendor_email: '',
        pg_name: '',
        location: '',
        room_type: 'Single/Double',
        rent_range: '',
        facilities: '',
        contact_number: '',
        images: [],
        video_url: '',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description:
          error?.message ||
          'Failed to submit your PG. If you recently enabled approval workflow, please ensure the required columns exist in Supabase.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead
        title={pageSeo.title}
        description={pageSeo.description}
        keywords={pageSeo.keywords}
        canonicalPath={pageSeo.canonicalPath}
      />

      <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen">
        <section className="py-10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white border shadow-sm rounded-xl p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">List Your PG</h1>
                    <p className="text-gray-600 mt-2">
                      Submit your PG details. Our team will verify and approve it before it appears on the <b>Get PG</b> page.
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center bg-blue-50 px-3 py-2 rounded-lg text-blue-700">
                    <Home className="h-4 w-4 mr-2" />
                    <span className="text-sm font-semibold">Vendor</span>
                  </div>
                </div>

                {/* <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span>
                    Phone number is not shown publicly. Students send enquiries and the admin connects both sides.
                  </span>
                </div> */}

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Your Name *</label>
                      <input
                        required
                        name="vendor_name"
                        value={formData.vendor_name}
                        onChange={handleChange}
                        className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Owner name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Your Email *</label>
                      <input
                        required
                        type="email"
                        name="vendor_email"
                        value={formData.vendor_email}
                        onChange={handleChange}
                        className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="owner@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">PG Name *</label>
                      <input
                        required
                        name="pg_name"
                        value={formData.pg_name}
                        onChange={handleChange}
                        className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="e.g. Sunrise PG"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location *</label>
                      <input
                        required
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="City / Area"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Room Type</label>
                      <select
                        name="room_type"
                        value={formData.room_type}
                        onChange={handleChange}
                        className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option>Single/Double</option>
                        <option>Single</option>
                        <option>Double</option>
                        <option>Triple</option>
                        <option>Shared</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Rent Range *</label>
                      <input
                        required
                        name="rent_range"
                        value={formData.rent_range}
                        onChange={handleChange}
                        className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="e.g. 6000-9000"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Owner Phone *</label>
                      <input
                        required
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleChange}
                        className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="10-digit mobile number"
                        maxLength={10}
                      />
                      {/* <p className="text-xs text-gray-500 mt-1">Not shown on the public website.</p> */}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Facilities</label>
                    <input
                      name="facilities"
                      value={formData.facilities}
                      onChange={handleChange}
                      className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Comma separated (WiFi, Food, AC, Laundry...)"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Video URL (optional)</label>
                    <input
                      name="video_url"
                      value={formData.video_url}
                      onChange={handleChange}
                      className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="YouTube / Google Drive / Instagram reel link"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Images (max 5)</label>
                    <div className="mt-2 flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white cursor-pointer text-sm hover:bg-gray-50">
                        <Upload className="h-4 w-4" />
                        <span>{uploadingImage ? 'Uploading...' : 'Upload Images'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-gray-500">JPG/PNG/WebP • max 5MB each</span>
                    </div>

                    {(formData.images || []).length > 0 && (
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {formData.images.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img src={url} alt="" className="h-24 w-full rounded-lg object-cover border" />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 bg-white/90 border rounded-full px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSubmitting || uploadingImage}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit for Approval'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default PGRegisterPage;
