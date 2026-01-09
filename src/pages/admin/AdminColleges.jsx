import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, Edit2, Upload, X, PlayCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import RichTextEditor from "@/components/common/RichTextEditor";

const AdminColleges = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ✅ NEW: Search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const initialFormState = {
    college_name: '',
    city: '',
    state: '',
    fee_range: '',
    ranking: '',
    affiliation: '',

    // ✅ NEW
    brief_description: '', // 1-2 lines
    description: '',       // ✅ Rich HTML

    images: [],
    video_url: '',
    facilities: '',
    placements: '',
    brochure_url: '',

    // ✅ NEW: Courses with fee
    courses: [{ name: '', fee: '', duration: '' }],
  };

  const [formData, setFormData] = useState(initialFormState);

  // ✅ Debounce search (smooth typing)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ✅ Fetch when search changes (also runs on first render)
  useEffect(() => {
    fetchColleges(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const fetchColleges = async (search = '') => {
    try {
      setLoading(true);

      const q = (search || '').trim();
      let query = supabase
        .from('colleges')
        .select('*')
        .order('college_name');

      // ✅ Search by name/city/state/affiliation
      if (q) {
        query = query.or(
          `college_name.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,affiliation.ilike.%${q}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      setColleges(data || []);
    } catch (error) {
      console.error('Error fetching colleges:', error);
      toast({ variant: "destructive", title: "Failed to load colleges", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleBrochureUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `brochures/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, brochure_url: publicUrl }));
      toast({ title: "Brochure uploaded successfully" });
    } catch (error) {
      console.error('Error uploading brochure:', error);
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e) => {
    try {
      setUploading(true);
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      if (formData.images.length + files.length > 5) {
        toast({ variant: "destructive", title: "Limit reached", description: "You can only have up to 5 images per college." });
        return;
      }

      const uploadPromises = files.map(async (file) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error(`File ${file.name} is not a valid image (JPG, PNG, WebP only).`);
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 5MB size limit.`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `colleges/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      toast({ title: "Images uploaded successfully" });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // ✅ Courses handlers
  const addCourseRow = () => {
    setFormData(prev => ({
      ...prev,
      courses: [...(prev.courses || []), { name: '', fee: '', duration: '' }]
    }));
  };

  const removeCourseRow = (idx) => {
    setFormData(prev => ({
      ...prev,
      courses: (prev.courses || []).filter((_, i) => i !== idx)
    }));
  };

  const updateCourseRow = (idx, key, val) => {
    setFormData(prev => ({
      ...prev,
      courses: (prev.courses || []).map((c, i) => i === idx ? { ...c, [key]: val } : c)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate Placements JSON
      let placementsJson = {};
      try {
        if (formData.placements && typeof formData.placements === 'string' && formData.placements.trim() !== '') {
          placementsJson = JSON.parse(formData.placements);
        } else if (typeof formData.placements === 'object') {
          placementsJson = formData.placements;
        }
      } catch (jsonError) {
        throw new Error("Invalid JSON format in Placements field");
      }

      const cleanedCourses = (formData.courses || [])
        .map(c => ({
          name: (c.name || '').trim(),
          fee: (c.fee || '').trim(),
          duration: (c.duration || '').trim(),
        }))
        .filter(c => c.name);

      const payload = {
        college_name: formData.college_name,
        city: formData.city,
        state: formData.state,
        fee_range: formData.fee_range,
        ranking: formData.ranking,
        affiliation: formData.affiliation,

        // ✅ NEW
        brief_description: formData.brief_description,
        description: formData.description, // ✅ Rich HTML

        video_url: formData.video_url,
        brochure_url: formData.brochure_url,
        placements: placementsJson,

        facilities: formData.facilities
          ? (typeof formData.facilities === 'string'
            ? formData.facilities.split(',').map(s => s.trim()).filter(Boolean)
            : formData.facilities)
          : [],

        // ✅ NEW
        courses: cleanedCourses,

        // images stored as TEXT in DB
        images: JSON.stringify(formData.images),
      };

      let error;
      if (editingId) {
        const { error: err } = await supabase
          .from('colleges')
          .update(payload)
          .eq('id', editingId);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('colleges')
          .insert([payload]);
        error = err;
      }

      if (error) throw error;

      toast({ title: editingId ? "Updated successfully" : "Created successfully" });
      fetchColleges(debouncedSearch);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Submission error:", error);
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to save college" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('colleges').delete().eq('id', id);
      if (error) throw error;

      toast({ title: "Deleted successfully" });
      fetchColleges(debouncedSearch);
      setDeleteConfirmId(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Delete failed", description: error.message });
    }
  };

  const handleEdit = (college) => {
    // Parse images
    let parsedImages = [];
    if (Array.isArray(college.images)) {
      parsedImages = college.images;
    } else if (typeof college.images === 'string') {
      try {
        const parsed = JSON.parse(college.images);
        parsedImages = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
      } catch (e) {
        parsedImages = college.images ? [college.images] : [];
      }
    }

    // Placements -> string
    let placementsString = '';
    if (college.placements) {
      placementsString = typeof college.placements === 'string'
        ? college.placements
        : JSON.stringify(college.placements, null, 2);
    }

    // Courses -> ensure array
    let courses = [];
    if (Array.isArray(college.courses)) {
      courses = college.courses;
    } else if (typeof college.courses === 'string') {
      try {
        const parsed = JSON.parse(college.courses);
        courses = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        courses = [];
      }
    }
    if (!courses.length) courses = [{ name: '', fee: '', duration: '' }];

    setFormData({
      college_name: college.college_name || '',
      city: college.city || '',
      state: college.state || '',
      fee_range: college.fee_range || '',
      ranking: college.ranking || '',
      affiliation: college.affiliation || '',

      // ✅ NEW
      brief_description: college.brief_description || '',
      description: college.description || '', // rich html

      images: parsedImages,
      video_url: college.video_url || '',
      brochure_url: college.brochure_url || '',
      facilities: Array.isArray(college.facilities) ? college.facilities.join(', ') : (college.facilities || ''),
      placements: placementsString,

      courses,
    });

    setEditingId(college.id);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Manage Colleges</h1>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add College</Button>
            </DialogTrigger>

            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit College' : 'Add New College'}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-1">College Name</label>
                    <input
                      required
                      className="w-full p-2 border rounded"
                      value={formData.college_name}
                      onChange={e => setFormData({ ...formData, college_name: e.target.value })}
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input
                      required
                      className="w-full p-2 border rounded"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-1">State</label>
                    <input
                      required
                      className="w-full p-2 border rounded"
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g. Uttar Pradesh"
                    />
                  </div>
                </div>

                <div className="border p-4 rounded bg-gray-50 space-y-3">
                  <h3 className="font-semibold text-gray-700">Media Gallery</h3>

                  <div>
                    <label className="block text-sm font-medium mb-2">College Images (Max 5)</label>
                    <div className="flex items-center gap-4 mb-3">
                      <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition flex items-center">
                        <Upload className="w-4 h-4 mr-2" /> Upload Images
                        <input
                          type="file"
                          multiple
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading || formData.images.length >= 5}
                        />
                      </label>
                      {uploading && <Loader2 className="animate-spin text-blue-600 w-5 h-5" />}
                      <span className="text-sm text-gray-500">{formData.images.length}/5 images used</span>
                    </div>

                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-5 gap-2">
                        {formData.images.map((img, idx) => (
                          <div key={idx} className="relative group border rounded-lg overflow-hidden h-20 bg-white">
                            <img src={img} alt="preview" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <PlayCircle className="w-4 h-4" /> Promotional Video (Optional)
                    </label>
                    <input
                      className="w-full p-2 border rounded"
                      value={formData.video_url}
                      onChange={e => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://youtube.com/..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Paste a YouTube or Vimeo link.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Fee Range</label>
                    <input required className="w-full p-2 border rounded" value={formData.fee_range} onChange={e => setFormData({ ...formData, fee_range: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ranking</label>
                    <input required className="w-full p-2 border rounded" value={formData.ranking} onChange={e => setFormData({ ...formData, ranking: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Affiliation (e.g., NAAC A+, UGC)</label>
                  <input
                    className="w-full p-2 border rounded"
                    value={formData.affiliation}
                    onChange={e => setFormData({ ...formData, affiliation: e.target.value })}
                    placeholder="e.g. NAAC A+"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">College Brochure (PDF)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleBrochureUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {uploading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                  </div>
                  {formData.brochure_url && <p className="text-xs text-green-600 mt-1">Brochure uploaded!</p>}
                </div>

                {/* ✅ Brief Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">Brief Description (1–2 lines)</label>
                  <textarea
                    rows={2}
                    className="w-full p-2 border rounded"
                    value={formData.brief_description}
                    onChange={e => setFormData({ ...formData, brief_description: e.target.value })}
                    placeholder="Short summary shown near image (1–2 lines)"
                  />
                </div>

                {/* ✅ Rich Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">Full Description (Rich Text)</label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(val) => setFormData({ ...formData, description: val })}
                    placeholder="Bold/Italic/Heading use karo..."
                  />
                </div>

                {/* ✅ Courses with Fee */}
                <div className="border p-4 rounded bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700">Courses with Fee</h3>
                    <Button type="button" variant="outline" onClick={addCourseRow}>
                      <Plus className="w-4 h-4 mr-2" /> Add Course
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {(formData.courses || []).map((c, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <input
                            className="w-full p-2 border rounded"
                            value={c.name}
                            onChange={(e) => updateCourseRow(idx, 'name', e.target.value)}
                            placeholder="Course Name (e.g. BBA)"
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            className="w-full p-2 border rounded"
                            value={c.fee}
                            onChange={(e) => updateCourseRow(idx, 'fee', e.target.value)}
                            placeholder="Fee (e.g. ₹1.2L/year)"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            className="w-full p-2 border rounded"
                            value={c.duration}
                            onChange={(e) => updateCourseRow(idx, 'duration', e.target.value)}
                            placeholder="Duration"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeCourseRow(idx)}
                            disabled={(formData.courses || []).length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">At least 1 course row required. Blank course names will be ignored.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Facilities (comma separated)</label>
                  <input
                    className="w-full p-2 border rounded"
                    value={formData.facilities}
                    onChange={e => setFormData({ ...formData, facilities: e.target.value })}
                    placeholder="WiFi, Hostel, Library"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Placements (JSON)</label>
                  <textarea
                    rows={4}
                    className="w-full p-2 border rounded font-mono text-sm"
                    value={formData.placements}
                    onChange={e => setFormData({ ...formData, placements: e.target.value })}
                    placeholder={'{\n "average": "10 LPA",\n "highest": "50 LPA"\n}'}
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingId ? 'Update College' : 'Add College')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* ✅ Search Bar */}
        <div className="flex items-center gap-3">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search college by name, city, state, affiliation..."
            className="w-full max-w-xl p-2 border rounded bg-white"
          />
          {searchTerm && (
            <Button type="button" variant="outline" onClick={() => setSearchTerm('')}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
      ) : (
        <>
          {colleges.length === 0 ? (
            <div className="p-6 bg-white rounded shadow text-center text-gray-500">
              No colleges found for: <span className="font-semibold">{debouncedSearch || '—'}</span>
            </div>
          ) : (
            <div className="grid gap-4">
              {colleges.map(college => (
                <div key={college.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{college.college_name}</h3>
                    <p className="text-sm text-gray-500">
                      {college.city}{college.state ? `, ${college.state}` : ''} • {college.fee_range}
                    </p>
                    {college.brief_description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{college.brief_description}</p>
                    )}
                    {college.affiliation && <p className="text-xs text-gray-400 mt-1">Affiliation: {college.affiliation}</p>}
                    {college.video_url && (
                      <span className="text-xs text-blue-600 flex items-center mt-1">
                        <PlayCircle className="w-3 h-3 mr-1" /> Video Link Active
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(college)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>

                    {deleteConfirmId === college.id ? (
                      <div className="flex gap-2">
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(college.id)}>Confirm</Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button variant="destructive" size="sm" onClick={() => setDeleteConfirmId(college.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminColleges;
