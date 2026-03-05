/* FULL FILE (large) */
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Edit, X, Home, Upload, PlayCircle, Check, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AdminPGListings = () => {
  const { toast } = useToast();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    pg_name: '',
    location: '',
    room_type: 'Single/Double',
    rent_range: '',
    facilities: '',
    contact_number: '',
    images: [],
    video_url: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
  });

  // ✅ lock body scroll when dialog is open
  useEffect(() => {
    if (isDialogOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original || '';
      };
    }
  }, [isDialogOpen]);

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
      toast({ title: 'Error', description: 'Failed to fetch listings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getApprovalStatus = (pg) => {
    if (!pg || typeof pg !== 'object') return 'pending';

    const hasStatus = Object.prototype.hasOwnProperty.call(pg, 'status');
    const hasApprovalStatus = Object.prototype.hasOwnProperty.call(pg, 'approval_status');
    const hasIsApproved = Object.prototype.hasOwnProperty.call(pg, 'is_approved');
    const hasApproved = Object.prototype.hasOwnProperty.call(pg, 'approved');

    // Legacy records: if no approval columns exist, treat as approved.
    if (!hasStatus && !hasApprovalStatus && !hasIsApproved && !hasApproved) return 'approved';

    const normalized = (v) => String(v || '').toLowerCase().trim();
    if (hasStatus && normalized(pg.status)) return normalized(pg.status);
    if (hasApprovalStatus && normalized(pg.approval_status)) return normalized(pg.approval_status);
    if (hasIsApproved) return pg.is_approved ? 'approved' : 'pending';
    if (hasApproved) return pg.approved ? 'approved' : 'pending';
    return 'pending';
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'approved') return 'bg-green-100 text-green-700';
    if (s === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-800';
  };

  const updateApproval = async (pgId, newStatus) => {
    try {
      // Best-effort: update whichever approval columns exist in your Supabase table.
      const tryPayloads = [
        { status: newStatus, is_approved: newStatus === 'approved' },
        { status: newStatus },
        { approval_status: newStatus, is_approved: newStatus === 'approved' },
        { approval_status: newStatus },
        { is_approved: newStatus === 'approved' },
        { approved: newStatus === 'approved' },
      ];

      let lastError = null;
      for (const payload of tryPayloads) {
        const { error } = await supabase.from('pg_listings').update(payload).eq('id', pgId);
        if (!error) {
          toast({ title: 'Updated', description: `Listing marked as ${newStatus}.` });
          await fetchListings();
          return;
        }
        lastError = error;
      }

      throw lastError;
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: error?.message || 'Failed to update status', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      pg_name: '',
      location: '',
      room_type: 'Single/Double',
      rent_range: '',
      facilities: '',
      contact_number: '',
      images: [],
      video_url: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
    });
  };

  const handleImageUpload = async (e) => {
    try {
      setUploadingImage(true);
      const files = Array.from(e.target.files || []);
      e.target.value = ''; // reset

      if (files.length === 0) return;

      if (formData.images.length + files.length > 5) {
        toast({ variant: "destructive", title: "Limit reached", description: "Max 5 images allowed." });
        return;
      }

      const uploadPromises = files.map(async (file) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error("Invalid format. Use JPG, PNG, or WebP.");
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Max file size 5MB.");
        }

        const fileExt = file.name.split('.').pop();
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `pg-images/${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: pub } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        return pub?.publicUrl;
      });

      const uploadedUrls = (await Promise.all(uploadPromises)).filter(Boolean);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));

      toast({ title: 'Success', description: 'Images uploaded successfully' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: error.message || 'Failed to upload', variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const openEdit = (pg) => {
    let parsedImages = [];
    try {
      if (Array.isArray(pg.images)) parsedImages = pg.images;
      else if (typeof pg.images === 'string' && pg.images.trim() !== '') parsedImages = JSON.parse(pg.images);
    } catch (e) {
      parsedImages = [];
    }

    setFormData({
      id: pg.id,
      pg_name: pg.pg_name || '',
      location: pg.location || '',
      room_type: pg.room_type || 'Single/Double',
      rent_range: pg.rent_range || '',
      contact_number: pg.contact_number || '',
      images: parsedImages,
      facilities: Array.isArray(pg.facilities) ? pg.facilities.join(', ') : (pg.facilities || ''),
      video_url: pg.video_url || '',
      meta_title: pg.meta_title || '',
      meta_description: pg.meta_description || '',
      meta_keywords: pg.meta_keywords || '',
    });

    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const hasManualSeo = [formData.meta_title, formData.meta_description, formData.meta_keywords]
      .some((value) => String(value || '').trim() !== '');
    let seoColumnsMissing = false;

    try {
      const facilitiesArray = formData.facilities
        ? formData.facilities.split(',').map(f => f.trim()).filter(Boolean)
        : [];

      const basePayload = {
        pg_name: formData.pg_name,
        location: formData.location,
        room_type: formData.room_type,
        rent_range: formData.rent_range,
        contact_number: formData.contact_number,
        images: JSON.stringify(formData.images),
        facilities: facilitiesArray,
        video_url: formData.video_url,
        meta_title: (formData.meta_title || '').trim() || null,
        meta_description: (formData.meta_description || '').trim() || null,
        meta_keywords: (formData.meta_keywords || '').trim() || null,
      };
      const basePayloadWithoutSeo = Object.fromEntries(
        Object.entries(basePayload).filter(
          ([key]) => !['meta_title', 'meta_description', 'meta_keywords'].includes(key)
        )
      );

      // Admin-created listings should be visible immediately.
      // We try several common approval column patterns so it works with different Supabase schemas.
      const approvalAttempts = [
        { status: 'approved', is_approved: true },
        { approval_status: 'approved', is_approved: true },
        { status: 'approved' },
        { approval_status: 'approved' },
        { is_approved: true },
        { approved: true },
        {},
      ];

      let lastError = null;

      if (formData.id) {
        for (const extra of approvalAttempts) {
          const { error } = await supabase
            .from('pg_listings')
            .update({ ...basePayload, ...extra })
            .eq('id', formData.id);
          if (!error) {
            lastError = null;
            break;
          }

          if (/meta_title|meta_description|meta_keywords/i.test(error.message || '')) {
            seoColumnsMissing = true;
            const { error: fallbackError } = await supabase
              .from('pg_listings')
              .update({ ...basePayloadWithoutSeo, ...extra })
              .eq('id', formData.id);
            if (!fallbackError) {
              lastError = null;
              break;
            }
            lastError = fallbackError;
            continue;
          }

          lastError = error;
        }
        if (lastError) throw lastError;
      } else {
        for (const extra of approvalAttempts) {
          const { error } = await supabase
            .from('pg_listings')
            .insert([{ ...basePayload, ...extra }]);
          if (!error) {
            lastError = null;
            break;
          }

          if (/meta_title|meta_description|meta_keywords/i.test(error.message || '')) {
            seoColumnsMissing = true;
            const { error: fallbackError } = await supabase
              .from('pg_listings')
              .insert([{ ...basePayloadWithoutSeo, ...extra }]);
            if (!fallbackError) {
              lastError = null;
              break;
            }
            lastError = fallbackError;
            continue;
          }

          lastError = error;
        }
        if (lastError) throw lastError;
      }

      toast({ title: 'Success', description: 'PG listing saved successfully' });
      if (seoColumnsMissing && hasManualSeo) {
        toast({
          variant: 'destructive',
          title: 'SEO fields not saved',
          description: 'Run SQL migration to add meta_title/meta_description/meta_keywords columns in pg_listings table.',
        });
      }

      await fetchListings();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: error.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      const { error } = await supabase.from('pg_listings').delete().eq('id', id);
      if (error) throw error;

      toast({ title: 'Success', description: 'Listing deleted' });
      setListings(prev => prev.filter(pg => pg.id !== id));
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const displayedListings = (listings || []).filter((pg) => {
    if (statusFilter === 'all') return true;
    return getApprovalStatus(pg) === statusFilter;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage PG Listings</h1>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            title="Filter listings"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" /> Add New PG
            </Button>
          </DialogTrigger>

          {/* ✅ FINAL FIXED MODAL */}
          <DialogContent className="w-[95vw] sm:max-w-[640px] max-h-[90vh] overflow-hidden p-0 bg-white dark:bg-white text-gray-900">
            {/* Header fixed */}
            <div className="border-b px-6 py-4 bg-white">
              <DialogHeader>
                <DialogTitle>
                  {formData.id ? 'Edit PG Listing' : 'Add New PG Listing'}
                </DialogTitle>
              </DialogHeader>
            </div>

            {/* ✅ Scroll container: NO padding (so no right blank strip) */}
            <div className="max-h-[calc(90vh-64px)] overflow-y-auto overscroll-contain">
              {/* ✅ Inner padding wrapper (form padding yaha pe) */}
              <div className="px-6 py-4 pr-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-1">PG Name</label>
                    <Input
                      value={formData.pg_name}
                      onChange={(e) => setFormData({ ...formData, pg_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium mb-1">Room Type</label>
                      <Input
                        value={formData.room_type}
                        onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium mb-1">Rent Range</label>
                      <Input
                        value={formData.rent_range}
                        onChange={(e) => setFormData({ ...formData, rent_range: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-1">Facilities (comma separated)</label>
                    <Textarea
                      value={formData.facilities}
                      onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                      placeholder="WiFi, Food, AC, Laundry..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-1">Contact Number (Owner)</label>
                    <Input
                      value={formData.contact_number}
                      onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      placeholder="Shown only to admin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Images (Max 5)
                    </label>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />

                    {uploadingImage && (
                      <p className="text-xs text-blue-600 mt-1">Uploading...</p>
                    )}

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative group rounded border overflow-hidden">
                          <img src={img} alt="" className="h-20 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-white/90 border rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                            title="Remove"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <PlayCircle className="w-4 h-4" /> Video Tour (Optional)
                    </label>
                    <Input
                      name="video_url"
                      value={formData.video_url}
                      onChange={e => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Paste full YouTube link.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">SEO Title</label>
                      <Input
                        value={formData.meta_title}
                        onChange={e => setFormData({ ...formData, meta_title: e.target.value })}
                        placeholder="Custom title for search result"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">SEO Keywords</label>
                      <Input
                        value={formData.meta_keywords}
                        onChange={e => setFormData({ ...formData, meta_keywords: e.target.value })}
                        placeholder="pg near college, hostel..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">SEO Description</label>
                    <Textarea
                      value={formData.meta_description}
                      onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                      placeholder="Custom meta description for listing page"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isSubmitting || uploadingImage}>
                      {isSubmitting ? 'Saving...' : (formData.id ? 'Update Listing' : 'Create Listing')}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden mt-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500">Image</th>
              <th className="px-6 py-3 font-medium text-gray-500">PG Name</th>
              <th className="px-6 py-3 font-medium text-gray-500">Location</th>
              <th className="px-6 py-3 font-medium text-gray-500">Rent</th>
              <th className="px-6 py-3 font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : displayedListings.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No listings found</td>
              </tr>
            ) : (
              displayedListings.map((pg) => {
                let firstImage = null;
                try {
                  if (typeof pg.images === 'string' && pg.images.trim() !== '') {
                    const arr = JSON.parse(pg.images);
                    firstImage = arr?.[0] || null;
                  }
                } catch (e) {}

                return (
                  <tr key={pg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {firstImage ? (
                        <img src={firstImage} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                          <Home className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-900">{pg.pg_name}</td>
                    <td className="px-6 py-4 text-gray-500">{pg.location}</td>
                    <td className="px-6 py-4 text-gray-500">{pg.rent_range}</td>

                    <td className="px-6 py-4">
                      {(() => {
                        const status = getApprovalStatus(pg);
                        return (
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusBadge(status)}`}
                          >
                            {status}
                          </span>
                        );
                      })()}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(pg)}
                          className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        {(() => {
                          const status = getApprovalStatus(pg);
                          if (status !== 'approved') {
                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => updateApproval(pg.id, 'approved')}
                                  className="p-1.5 hover:bg-green-50 rounded text-green-600"
                                  title="Approve"
                                >
                                  <Check className="h-4 w-4" />
                                </button>

                                {status !== 'rejected' && (
                                  <button
                                    type="button"
                                    onClick={() => updateApproval(pg.id, 'rejected')}
                                    className="p-1.5 hover:bg-red-50 rounded text-red-600"
                                    title="Reject"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </button>
                                )}
                              </>
                            );
                          }
                          return null;
                        })()}

                        <button
                          type="button"
                          onClick={() => handleDelete(pg.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPGListings;
