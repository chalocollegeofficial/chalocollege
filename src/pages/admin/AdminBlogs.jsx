import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, Edit2, Upload, MessageSquare, X, Eye, EyeOff, CheckCircle, AlertCircle, BarChart3, ThumbsUp } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminBlogs = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentPostComments, setCurrentPostComments] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  
  // Analytics State
  const [commentCounts, setCommentCounts] = useState({});
  
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    full_content: '',
    author: '',
    category: '',
    is_published: true,
    image: '', // Primary thumbnail
    images: [] // Additional images
  });
  const [editingId, setEditingId] = useState(null);

  // ✅ Categories dropdown list (includes "College Compare")
  const blogCategories = ['Admissions', 'Exams', 'Career', 'Student Life', 'Tips', 'Compare & Decide'];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
        const { data: postsData, error } = await supabase
            .from('blogs')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        setPosts(postsData || []);

        const { data: commentsData } = await supabase
            .from('blog_comments')
            .select('blog_id');
            
        const counts = {};
        if (commentsData) {
            commentsData.forEach(c => {
                counts[c.blog_id] = (counts[c.blog_id] || 0) + 1;
            });
        }
        setCommentCounts(counts);
    } catch (err) {
        console.error("Error fetching blogs:", err);
        toast({ variant: "destructive", title: "Failed to load blogs" });
    } finally {
        setLoading(false);
    }
  };

  const fetchComments = async (postId) => {
    const { data, error } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('blog_id', postId)
      .order('created_at', { ascending: false });
      
    if (!error) setCurrentPostComments(data || []);
  };

  const handleImageUpload = async (e, isPrimary = false) => {
    try {
      setUploadingImage(true);
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      if (!isPrimary && formData.images.length + files.length > 5) {
        toast({ variant: "destructive", title: "Limit reached", description: "Max 5 additional images allowed." });
        return;
      }

      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `blog-${Math.random()}.${fileExt}`;
        const filePath = `blog-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);
          
        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);

      if (isPrimary) {
        setFormData(prev => ({ ...prev, image: urls[0] }));
      } else {
        setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      }
      
      toast({ title: "Success", description: "Image(s) uploaded successfully" });

    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      title: formData.title,
      slug: formData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
      short_description: formData.short_description,
      full_content: formData.full_content,
      author: formData.author,
      category: formData.category,
      is_published: formData.is_published,
      image: formData.image,
      images: JSON.stringify(formData.images)
    };

    let error;
    if (editingId) {
      const { error: err } = await supabase.from('blogs').update(payload).eq('id', editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from('blogs').insert([payload]);
      error = err;
    }

    if (!error) {
      toast({ title: editingId ? "Updated successfully" : "Created successfully" });
      fetchPosts();
      setIsDialogOpen(false);
      resetForm();
    } else {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post permanently?")) return;
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    if (!error) {
      toast({ title: "Deleted successfully" });
      fetchPosts();
    } else {
        toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  const handleEdit = (post) => {
    let parsedImages = [];
    try {
      if (typeof post.images === 'string') {
        parsedImages = JSON.parse(post.images);
      } else if (Array.isArray(post.images)) {
        parsedImages = post.images;
      }
    } catch (e) { parsedImages = []; }

    setFormData({
      title: post.title || '',
      short_description: post.short_description || '',
      full_content: post.full_content || '',
      author: post.author || '',
      category: post.category || '',
      is_published: post.is_published ?? true,
      image: post.image || '',
      images: parsedImages
    });
    setEditingId(post.id);
    setIsDialogOpen(true);
  };

  const handleOpenComments = (post) => {
    setSelectedPostId(post.id);
    fetchComments(post.id);
    setIsCommentsOpen(true);
  };

  const updateCommentStatus = async (comment, newStatus) => {
    const { error } = await supabase
      .from('blog_comments')
      .update({ status: newStatus })
      .eq('id', comment.id);

    if (!error) {
      toast({ title: `Comment marked as ${newStatus}` });
      fetchComments(selectedPostId);
      fetchPosts();
    } else {
        toast({ variant: "destructive", title: "Update failed" });
    }
  };

  const deleteComment = async (commentId) => {
    if(!window.confirm("Delete this comment permanently?")) return;
    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', commentId);

    if (!error) {
      toast({ title: "Comment Deleted" });
      fetchComments(selectedPostId);
    }
  };

  const resetForm = () => {
    setFormData({ 
        title: '', 
        short_description: '', 
        full_content: '', 
        author: '', 
        category: '',
        is_published: true, 
        image: '', 
        images: [] 
    });
    setEditingId(null);
  };

  const removeAdditionalImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Blog Posts</h1>
            <p className="text-gray-500 text-sm">Create, edit and moderate your blog content.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Post</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Post' : 'Create New Post'}</DialogTitle>
              <DialogDescription>Fill in the details for the blog post.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input required className="w-full p-2 border rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Blog Title"/>
                    </div>

                    {/* ✅ Category dropdown */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select
                          className="w-full p-2 border rounded bg-white"
                          value={formData.category}
                          onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                          <option value="">Select category</option>

                          {/* Preserve existing category on edit if it's not in the preset list */}
                          {formData.category && !blogCategories.includes(formData.category) && (
                            <option value={formData.category}>{formData.category}</option>
                          )}

                          {blogCategories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Author</label>
                        <input required className="w-full p-2 border rounded" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} placeholder="Author Name"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select 
                            className="w-full p-2 border rounded bg-white" 
                            value={formData.is_published} 
                            onChange={e => setFormData({...formData, is_published: e.target.value === 'true'})}
                        >
                            <option value="true">Published</option>
                            <option value="false">Draft</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4 border-l pl-6">
                    {/* Primary Image */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Thumbnail Image (Required)</label>
                        <div className="flex items-start gap-4">
                            <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0 border">
                                {formData.image ? 
                                    <img src={formData.image} className="w-full h-full object-cover" alt="Thumbnail" /> : 
                                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">No Image</div>
                                }
                            </div>
                            <div>
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} disabled={uploadingImage} className="text-sm mb-2"/>
                                <p className="text-xs text-gray-500">Main image displayed on cards.</p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Images */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Gallery Images (Max 5)</label>
                        <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, false)} disabled={uploadingImage || formData.images.length >= 5} className="text-sm mb-3"/>
                        
                        <div className="flex flex-wrap gap-2">
                            {formData.images.map((img, i) => (
                                <div key={i} className="relative group w-16 h-16 bg-gray-50 border rounded overflow-hidden">
                                  <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                  <button 
                                      type="button" 
                                      onClick={() => removeAdditionalImage(i)}
                                      className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                  >
                                      <X size={16} />
                                  </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Short Description (SEO)</label>
                <textarea required rows={2} className="w-full p-2 border rounded" value={formData.short_description} onChange={e => setFormData({...formData, short_description: e.target.value})} placeholder="Brief summary for list view and meta description..."/>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Full Content</label>
                <textarea required rows={10} className="w-full p-2 border rounded font-mono text-sm leading-relaxed" value={formData.full_content} onChange={e => setFormData({...formData, full_content: e.target.value})} placeholder="Write your blog content here..."/>
              </div>
              
              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={isSubmitting || uploadingImage} className="w-full md:w-auto">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingId ? 'Update Post' : 'Publish Post')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin w-8 h-8 text-blue-600"/></div> : (
        <div className="grid gap-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between gap-4">
              <div className="flex gap-5">
                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                    {post.image ? <img src={post.image} className="w-full h-full object-cover" alt="Post thumbnail" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><EyeOff size={20}/></div>}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-gray-900">{post.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${post.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {post.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 max-w-xl">{post.short_description}</p>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-medium">
                      <div className="flex items-center gap-1" title="Likes">
                          <ThumbsUp className="w-3 h-3" /> {post.likes_count || 0} Likes
                      </div>
                      <div className="flex items-center gap-1" title="Comments">
                          <MessageSquare className="w-3 h-3" /> {commentCounts[post.id] || 0} Comments
                      </div>
                      <div>
                          Author: {post.author}
                      </div>
                      <div>
                          {new Date(post.created_at).toLocaleDateString()}
                      </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4 min-w-[140px]">
                <Button variant="outline" size="sm" onClick={() => handleOpenComments(post)} className="justify-start">
                   <MessageSquare className="h-4 w-4 mr-2" /> Moderate
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(post)} className="justify-start">
                    <Edit2 className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)} className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Moderation Dialog */}
      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col bg-white">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle>Comment Moderation</DialogTitle>
            <DialogDescription>Review and manage comments for this post.</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            {currentPostComments.length === 0 ? (
              <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                  <MessageSquare className="w-10 h-10 text-gray-200 mb-2" />
                  <p>No comments on this post yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                  {currentPostComments.map(comment => (
                    <div key={comment.id} className={`p-4 rounded-lg border ${comment.status === 'hidden' ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className="font-bold text-gray-900 text-sm">{comment.user_name}</span>
                                <span className="text-xs text-gray-400 ml-2">{new Date(comment.created_at).toLocaleString()}</span>
                            </div>
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                comment.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                comment.status === 'hidden' ? 'bg-gray-200 text-gray-600' : 
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                {comment.status || 'Pending'}
                            </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{comment.comment_text}</p>
                        
                        <div className="flex gap-2 pt-2 border-t border-dashed border-gray-200">
                            {comment.status !== 'approved' && (
                                <Button size="sm" variant="ghost" className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => updateCommentStatus(comment, 'approved')}>
                                    <CheckCircle className="w-3 h-3 mr-1" /> Approve
                                </Button>
                            )}
                            
                            {comment.status !== 'hidden' && (
                                <Button size="sm" variant="ghost" className="h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100" onClick={() => updateCommentStatus(comment, 'hidden')}>
                                    <EyeOff className="w-3 h-3 mr-1" /> Hide
                                </Button>
                            )}
                            
                            <Button size="sm" variant="ghost" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto" onClick={() => deleteComment(comment.id)}>
                                <Trash2 className="w-3 h-3 mr-1" /> Delete
                            </Button>
                        </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlogs;
