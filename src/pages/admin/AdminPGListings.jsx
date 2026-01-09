import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Edit, X, Home, Upload, PlayCircle } from 'lucide-react';
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
    video_url: ''
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
      video_url: ''
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
      video_url: pg.video_url || ''
    });

    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const facilitiesArray = formData.facilities
        ? formData.facilities.split(',').map(f => f.trim()).filter(Boolean)
        : [];

      const payload = {
        pg_name: formData.pg_name,
        location: formData.location,
        room_type: formData.room_type,
        rent_range: formData.rent_range,
        contact_number: formData.contact_number,
        images: JSON.stringify(formData.images),
        facilities: facilitiesArray,
        video_url: formData.video_url
      };

      if (formData.id) {
        const { error } = await supabase
          .from('pg_listings')
          .update(payload)
          .eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pg_listings')
          .insert([payload]);
        if (error) throw error;
      }

      toast({ title: 'Success', description: 'PG listing saved successfully' });

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage PG Listings</h1>

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
                    <label className="text-sm font-medium">PG Name</label>
                    <Input
                      required
                      name="pg_name"
                      value={formData.pg_name}
                      onChange={e => setFormData({ ...formData, pg_name: e.target.value })}
                      placeholder="e.g. Stanza Living House"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <Input
                        required
                        name="location"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Greater Noida"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Room Type</label>
                      <Input
                        name="room_type"
                        value={formData.room_type}
                        onChange={e => setFormData({ ...formData, room_type: e.target.value })}
                        placeholder="Single/Double/Sharing"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rent Range (₹)</label>
                      <Input
                        name="rent_range"
                        value={formData.rent_range}
                        onChange={e => setFormData({ ...formData, rent_range: e.target.value })}
                        placeholder="e.g. 6000-8000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Contact Number</label>
                      <Input
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={e => setFormData({ ...formData, contact_number: e.target.value })}
                        placeholder="+91 9999999999"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Facilities (comma separated)</label>
                    <Textarea
                      name="facilities"
                      value={formData.facilities}
                      onChange={e => setFormData({ ...formData, facilities: e.target.value })}
                      placeholder="WiFi, AC, Food, Laundry, Power Backup"
                    />
                  </div>

                  <div className="border p-4 rounded bg-gray-50 space-y-3">
                    <h4 className="font-semibold text-gray-700 text-sm">Media</h4>

                    <div>
                      <label className="block text-sm font-medium mb-2">PG Images (Max 5)</label>

                      <div className="flex items-center gap-4 mb-2 flex-wrap">
                        <label className={`cursor-pointer px-4 py-2 rounded shadow transition flex items-center text-sm
                          ${uploadingImage || formData.images.length >= 5 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                          <Upload className="w-4 h-4 mr-2" /> Upload
                          <input
                            type="file"
                            multiple
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingImage || formData.images.length >= 5}
                          />
                        </label>

                        {uploadingImage && (
                          <p className="text-xs text-blue-600 font-medium">Uploading...</p>
                        )}

                        <span className="text-sm text-gray-500">
                          {formData.images.length}/5 images
                        </span>
                      </div>

                      {formData.images.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                          {formData.images.map((img, idx) => (
                            <div key={idx} className="relative group border rounded-lg overflow-hidden h-16 bg-white">
                              <img src={img} alt="preview" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
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

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden mt-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500">Image</th>
              <th className="px-6 py-3 font-medium text-gray-500">PG Name</th>
              <th className="px-6 py-3 font-medium text-gray-500">Location</th>
              <th className="px-6 py-3 font-medium text-gray-500">Rent</th>
              <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : listings.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No listings found</td>
              </tr>
            ) : (
              listings.map((pg) => {
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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(pg)}
                          className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(pg.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-600"
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
