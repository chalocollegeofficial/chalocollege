import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Pencil, Trash2, Youtube, Upload, X } from 'lucide-react';

const AdminSuccessStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const { toast } = useToast();

  const initialFormState = {
    id: null,
    student_name: '',
    college: '',
    course: '',
    state: '',
    achievement_description: '',
    photo_url: '',
    youtube_video_url: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('success_stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load stories' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (story) => {
    setFormData({
      id: story.id,
      student_name: story.student_name || '',
      college: story.college || '',
      course: story.course || '',
      state: story.state || '',
      achievement_description: story.achievement_description || '',
      photo_url: story.photo_url || '',
      youtube_video_url: story.youtube_video_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('success_stories').delete().eq('id', id);
      if (error) throw error;

      setStories((prev) => prev.filter((s) => s.id !== id));
      setDeleteConfirmId(null);
      toast({ title: 'Success', description: 'Story deleted successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete story' });
    }
  };

  const handleImageUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      // optional validations
      if (!file.type.startsWith('image/')) throw new Error('Only image files allowed');
      if (file.size > 5 * 1024 * 1024) throw new Error('Max 5MB allowed');

      const fileExt = file.name.split('.').pop();
      const fileName = `students/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      const publicUrl = data?.publicUrl;

      setFormData((prev) => ({ ...prev, photo_url: publicUrl }));
      toast({ title: 'Image uploaded successfully' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setUploading(false);
      // reset file input
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        student_name: formData.student_name?.trim(),
        college: formData.college?.trim(),
        course: formData.course?.trim(),
        state: formData.state?.trim(),
        achievement_description: formData.achievement_description?.trim(),
        photo_url: formData.photo_url || null,
        youtube_video_url: formData.youtube_video_url?.trim() || null,
      };

      if (!payload.student_name || !payload.college || !payload.course || !payload.achievement_description) {
        throw new Error('Please fill required fields');
      }

      if (formData.id) {
        const { error: updateError } = await supabase
          .from('success_stories')
          .update(payload)
          .eq('id', formData.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('success_stories').insert([payload]);
        if (insertError) throw insertError;
      }

      toast({ title: 'Success', description: 'Story saved successfully' });
      await fetchStories();
      setIsDialogOpen(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error('Error saving story:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Success Stories</h1>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setFormData(initialFormState);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Story
            </Button>
          </DialogTrigger>

          {/* ✅ FIXED Dialog (no double scrollbar) */}
          <DialogContent className="z-50 w-[95vw] max-w-[620px] max-h-[85vh] p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-5 border-b bg-white">
              <DialogHeader className="p-0">
                <DialogTitle className="text-lg">
                  {formData.id ? 'Edit Story' : 'Add New Story'}
                </DialogTitle>
              </DialogHeader>

              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-md p-2 hover:bg-gray-100 text-gray-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Scroll Area */}
            <form onSubmit={handleSubmit} className="bg-white">
              <div className="p-5 overflow-y-auto max-h-[calc(85vh-140px)] space-y-4">
                <div>
                  <label className="text-sm font-medium">Student Name</label>
                  <Input
                    required
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    placeholder="e.g. Rahul Verma"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">College</label>
                    <Input
                      required
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      placeholder="e.g. IIT Delhi"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Course</label>
                    <Input
                      required
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      placeholder="e.g. B.Tech CS"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">State/Location</label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. New Delhi"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Achievement Quote</label>
                  <Textarea
                    required
                    value={formData.achievement_description}
                    onChange={(e) =>
                      setFormData({ ...formData, achievement_description: e.target.value })
                    }
                    placeholder="e.g. Cracked JEE Advanced with AIR 450..."
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Student Photo</label>
                  <div className="flex items-center gap-4">
                    <img
                      src={formData.photo_url || 'https://via.placeholder.com/150'}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover border bg-gray-50"
                    />

                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 transition">
                        <Upload className="w-4 h-4 mr-2" /> Upload Photo
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </label>

                      {uploading && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-600" /> YouTube Video URL (Optional)
                  </label>
                  <Input
                    name="youtube_video_url"
                    value={formData.youtube_video_url}
                    onChange={(e) =>
                      setFormData({ ...formData, youtube_video_url: e.target.value })
                    }
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste full YouTube link (e.g. https://www.youtube.com/watch?v=xyz)
                  </p>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="p-5 border-t bg-white flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting || uploading}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={isSubmitting || uploading}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    formData.id ? 'Update Story' : 'Create Story'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <div key={story.id} className="bg-white rounded-lg shadow-sm border p-4 relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={story.photo_url || 'https://via.placeholder.com/150'}
                    alt={story.student_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900">{story.student_name}</h3>
                    <p className="text-sm text-gray-500">{story.course}</p>
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(story)}>
                    <Pencil className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(story.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-2 italic">"{story.achievement_description}"</p>

              <div className="text-xs text-gray-400 flex justify-between items-center mt-2">
                <span className="truncate">{story.college}</span>
                {story.youtube_video_url && (
                  <Youtube className="w-4 h-4 text-red-500" title="Video Link Available" />
                )}
              </div>

              {deleteConfirmId === story.id && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center gap-2 z-10">
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(story.id)}>
                    Delete
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDeleteConfirmId(null)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSuccessStories;
