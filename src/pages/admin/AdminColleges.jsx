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
    category: '',
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
    // brochure_url moved to course categories

    // Course categories with specializations
    courses: [{ name: '', level: 'UG', brochure_url: '', subcategories: [{ name: '', fee: '', duration: '' }] }],
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

      // ✅ Search by name/city/state/affiliation/category
      if (q) {
        query = query.or(
          `college_name.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,affiliation.ilike.%${q}%,category.ilike.%${q}%`
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

  const handleBrochureUpload = async (e, categoryIdx) => {
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

      setFormData((prev) => ({
        ...prev,
        courses: (prev.courses || []).map((c, i) =>
          i === categoryIdx ? { ...c, brochure_url: publicUrl } : c
        )
      }));
      toast({ title: "Brochure saved successfully" });
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

  // ✅ Course category handlers
  const addCourseCategoryRow = () => {
    setFormData((prev) => ({
      ...prev,
      courses: [
        ...(prev.courses || []),
        { name: '', level: 'UG', brochure_url: '', subcategories: [{ name: '', fee: '', duration: '' }] }
      ]
    }));
  };

  const removeCourseCategoryRow = (idx) => {
    setFormData((prev) => ({
      ...prev,
      courses: (prev.courses || []).filter((_, i) => i !== idx)
    }));
  };

  const updateCourseCategoryRow = (idx, key, val) => {
    setFormData((prev) => ({
      ...prev,
      courses: (prev.courses || []).map((c, i) => i === idx ? { ...c, [key]: val } : c)
    }));
  };

  const addSubcategoryRow = (categoryIdx) => {
    setFormData((prev) => ({
      ...prev,
      courses: (prev.courses || []).map((c, i) => {
        if (i !== categoryIdx) return c;
        return {
          ...c,
          subcategories: [...(c.subcategories || []), { name: '', fee: '', duration: '' }]
        };
      })
    }));
  };

  const removeSubcategoryRow = (categoryIdx, subIdx) => {
    setFormData((prev) => ({
      ...prev,
      courses: (prev.courses || []).map((c, i) => {
        if (i !== categoryIdx) return c;
        return {
          ...c,
          subcategories: (c.subcategories || []).filter((_, s) => s !== subIdx)
        };
      })
    }));
  };

  const updateSubcategoryRow = (categoryIdx, subIdx, key, val) => {
    setFormData((prev) => ({
      ...prev,
      courses: (prev.courses || []).map((c, i) => {
        if (i !== categoryIdx) return c;
        return {
          ...c,
          subcategories: (c.subcategories || []).map((s, si) => si === subIdx ? { ...s, [key]: val } : s)
        };
      })
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
        .map((c) => {
          const subcategories = (c.subcategories || [])
            .map((s) => ({
              name: (s.name || '').trim(),
              fee: (s.fee || '').trim(),
              duration: (s.duration || '').trim(),
            }))
            .filter((s) => s.name);

          const level = (c.level || 'UG').trim();
          return {
            name: (c.name || '').trim(),
            level: level || 'UG',
            brochure_url: (c.brochure_url || '').trim(),
            subcategories,
          };
        })
        .filter((c) => c.name);

      const payload = {
        college_name: formData.college_name,
        city: formData.city,
        state: formData.state,
        category: formData.category,
        fee_range: formData.fee_range,
        ranking: formData.ranking,
        affiliation: formData.affiliation,

        // ✅ NEW
        brief_description: formData.brief_description,
        description: formData.description,

        video_url: formData.video_url,
        placements: placementsJson,

        facilities: formData.facilities
          ? (typeof formData.facilities === 'string'
            ? formData.facilities.split(',').map(s => s.trim()).filter(Boolean)
            : formData.facilities)
          : [],

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

    let placementsString = '';
    if (college.placements) {
      placementsString = typeof college.placements === 'string'
        ? college.placements
        : JSON.stringify(college.placements, null, 2);
    }

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
    courses = (courses || []).map((c) => {
      const subcategories = Array.isArray(c?.subcategories) ? c.subcategories : [];
      return {
        name: c?.name || '',
        level: c?.level || 'UG',
        brochure_url: c?.brochure_url || '',
        subcategories: subcategories.length
          ? subcategories.map((s) => ({
            name: s?.name || '',
            fee: s?.fee || '',
            duration: s?.duration || '',
          }))
          : [{ name: '', fee: '', duration: '' }],
      };
    });
    if (!courses.length) {
      courses = [{ name: '', level: 'UG', brochure_url: '', subcategories: [{ name: '', fee: '', duration: '' }] }];
    }

    setFormData({
      college_name: college.college_name || '',
      city: college.city || '',
      state: college.state || '',
      category: college.category || '',
      fee_range: college.fee_range || '',
      ranking: college.ranking || '',
      affiliation: college.affiliation || '',

      brief_description: college.brief_description || '',
      description: college.description || '',

      images: parsedImages,
      video_url: college.video_url || '',
      facilities: Array.isArray(college.facilities) ? college.facilities.join(', ') : (college.facilities || ''),
      placements: placementsString,

      courses,
    });

    setEditingId(college.id);
    setIsDialogOpen(true);
  };

  const getCollegeCourses = (college) => {
    if (!college) return [];
    let raw = [];
    if (Array.isArray(college.courses)) raw = college.courses;
    if (typeof college.courses === 'string') {
      try {
        const parsed = JSON.parse(college.courses);
        raw = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        raw = [];
      }
    }

    return (raw || []).map((c) => ({
      name: c?.name || '',
      level: c?.level || 'UG',
      brochure_url: c?.brochure_url || '',
      subcategories: Array.isArray(c?.subcategories) ? c.subcategories : []
    })).filter((c) => c.name);
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Fee Range</label>
                    <input
                      required
                      className="w-full p-2 border rounded"
                      value={formData.fee_range}
                      onChange={e => setFormData({ ...formData, fee_range: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Ranking</label>
                    <input
                      required
                      className="w-full p-2 border rounded"
                      value={formData.ranking}
                      onChange={e => setFormData({ ...formData, ranking: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      required
                      className="w-full p-2 border rounded bg-white"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Select category</option>
                      <option value="Government">Government</option>
                      <option value="Semi-Government">Semi-Government</option>
                      <option value="Private">Private</option>
                    </select>
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
                  <label className="block text-sm font-medium mb-1">Brief Description (1–2 lines)</label>
                  <textarea
                    rows={2}
                    className="w-full p-2 border rounded"
                    value={formData.brief_description}
                    onChange={e => setFormData({ ...formData, brief_description: e.target.value })}
                    placeholder="Short summary shown near image (1–2 lines)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Full Description (Rich Text)</label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(val) => setFormData({ ...formData, description: val })}
                    placeholder="Bold/Italic/Heading use karo..."
                  />
                </div>

                <div className="border p-4 rounded bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700">Course Categories & Specializations</h3>
                    <Button type="button" variant="outline" onClick={addCourseCategoryRow}>
                      <Plus className="w-4 h-4 mr-2" /> Add Category
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(formData.courses || []).map((c, idx) => (
                      <div key={idx} className="border rounded bg-white p-3 space-y-3">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-6">
                            <input
                              className="w-full p-2 border rounded"
                              value={c.name}
                              onChange={(e) => updateCourseCategoryRow(idx, 'name', e.target.value)}
                              placeholder="Category (e.g. B.Tech)"
                            />
                          </div>
                          <div className="col-span-3">
                            <select
                              className="w-full p-2 border rounded bg-white"
                              value={c.level || 'UG'}
                              onChange={(e) => updateCourseCategoryRow(idx, 'level', e.target.value)}
                            >
                              <option value="UG">UG (Undergraduate)</option>
                              <option value="PG">PG (Postgraduate)</option>
                            </select>
                          </div>
                          <div className="col-span-3 flex justify-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeCourseCategoryRow(idx)}
                              disabled={(formData.courses || []).length === 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="pl-1 space-y-2">
                          <div>
                            <label className="block text-xs font-medium mb-1">Category Brochure Link (PDF)</label>
                            <input
                              className="w-full p-2 border rounded text-sm"
                              value={c.brochure_url || ''}
                              onChange={(e) => updateCourseCategoryRow(idx, 'brochure_url', e.target.value)}
                              placeholder="https://example.com/brochure.pdf"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Upload Brochure (PDF)</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={(e) => handleBrochureUpload(e, idx)}
                              className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {uploading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                          </div>
                          </div>
                          {c.brochure_url && <p className="text-xs text-green-600 mt-1">Brochure saved.</p>}
                        </div>

                        <div className="pl-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-600">Specializations</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addSubcategoryRow(idx)}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Specialization
                            </Button>
                          </div>

                          <div className="space-y-2 mt-2">
                            {(c.subcategories || []).map((s, sIdx) => (
                              <div key={sIdx} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-5">
                                  <input
                                    className="w-full p-2 border rounded"
                                    value={s.name}
                                    onChange={(e) => updateSubcategoryRow(idx, sIdx, 'name', e.target.value)}
                                    placeholder="Specialization (e.g. AI)"
                                  />
                                </div>
                                <div className="col-span-4">
                                  <input
                                    className="w-full p-2 border rounded"
                                    value={s.fee}
                                    onChange={(e) => updateSubcategoryRow(idx, sIdx, 'fee', e.target.value)}
                                    placeholder="Fee (e.g. Rs 1.4L/year)"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <input
                                    className="w-full p-2 border rounded"
                                    value={s.duration}
                                    onChange={(e) => updateSubcategoryRow(idx, sIdx, 'duration', e.target.value)}
                                    placeholder="Duration"
                                  />
                                </div>
                                <div className="col-span-1 flex justify-end">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeSubcategoryRow(idx, sIdx)}
                                    disabled={(c.subcategories || []).length === 1}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">At least 1 category required. Blank names will be ignored.</p>
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
              {colleges.map((college) => {
                const courseCategories = getCollegeCourses(college);
                return (
                  <div key={college.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{college.college_name}</h3>
                    <p className="text-sm text-gray-500">
                      {college.city}{college.state ? `, ${college.state}` : ''} • {college.fee_range}
                    </p>
                    {college.brief_description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{college.brief_description}</p>
                    )}
                    {college.category && <p className="text-xs text-gray-400 mt-1">Category: {college.category}</p>}
                    {college.affiliation && <p className="text-xs text-gray-400 mt-1">Affiliation: {college.affiliation}</p>}
                    {college.video_url && (
                      <span className="text-xs text-blue-600 flex items-center mt-1">
                        <PlayCircle className="w-3 h-3 mr-1" /> Video Link Active
                      </span>
                    )}
                    {courseCategories.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-600">Courses</p>
                        <ol className="text-xs text-gray-600 space-y-1 mt-1">
                          {courseCategories.map((course, idx) => {
                            const label = `${idx + 1}.`;
                            const hasSubs = Array.isArray(course?.subcategories) && course.subcategories.length > 0;
                            return (
                              <li key={`${course?.name || 'course'}-${idx}`}>
                                <span className="font-semibold">{label}</span>{' '}
                                {course?.name || 'Course'}{course?.level ? ` (${course.level})` : ''}
                                {hasSubs && (
                                  <ol className="ml-4 mt-1 space-y-1">
                                    {course.subcategories.map((sub, subIdx) => {
                                      const subLabel = `${idx + 1}.${subIdx + 1}`;
                                      const subFeeText = sub?.fee ? ` - ${sub.fee}` : '';
                                      const subDurationText = sub?.duration ? ` (${sub.duration})` : '';
                                      return (
                                        <li key={`${sub?.name || 'sub'}-${idx}-${subIdx}`}>
                                          <span className="font-semibold">{subLabel}</span>{' '}
                                          {sub?.name || 'Specialization'}{subDurationText}{subFeeText}
                                        </li>
                                      );
                                    })}
                                  </ol>
                                )}
                              </li>
                            );
                          })}
                        </ol>
                      </div>
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
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminColleges;
