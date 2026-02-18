import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Calendar, User, ArrowLeft, Clock, Share2, ThumbsUp, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import SeoHead from '@/components/common/SeoHead';
import {
  autoDescriptionFromText,
  extractKeywordsFromText,
  pickSeoDescription,
  pickSeoKeywords,
  pickSeoTitle,
  stripHtml,
} from '@/lib/seo';
import { createBlogSlug } from '@/utils/slug';

const truncateTitle = (value = '', max = 58) => {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
};

const BlogDetailPage = () => {
  const { id: legacyId, blogId, blogSlug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  
  // Comment Form State
  const [newCommentName, setNewCommentName] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const resolvedId = blogId || legacyId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Post
        const { data: postData, error: postError } = await supabase
          .from('blogs')
          .select('*')
          .eq('id', resolvedId)
          .single();
        
        if (postError) throw postError;
        setPost(postData);
        setLikes(postData.likes_count || 0);

        // Check local storage for like status
        const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
        if (likedPosts.includes(resolvedId)) {
          setHasLiked(true);
        }

        // Fetch Approved Comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('blog_comments')
          .select('*')
          .eq('blog_id', resolvedId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (commentsError) throw commentsError;
        setComments(commentsData || []);

      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedId]);

  useEffect(() => {
    if (!post?.id) return;
    const canonicalSlug = createBlogSlug(post);
    const expectedPath = `/blog/${canonicalSlug}/${post.id}`;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : expectedPath;
    if (currentPath !== expectedPath) {
      navigate(expectedPath, { replace: true });
    }
  }, [blogId, blogSlug, navigate, post]);

  const canonicalPath = useMemo(
    () => (post?.id ? `/blog/${createBlogSlug(post)}/${post.id}` : '/blog'),
    [post]
  );

  const blogContentText = useMemo(
    () => `${post?.title || ''} ${post?.short_description || ''} ${stripHtml(post?.full_content || '')}`,
    [post]
  );

  const autoKeywords = useMemo(
    () => extractKeywordsFromText(blogContentText, { limit: 10, minLength: 4 }),
    [blogContentText]
  );

  const seoTitle = useMemo(
    () =>
      pickSeoTitle(
        post?.meta_title,
        `${post?.title || truncateTitle(post?.short_description) || 'Blog'} - Aao College Blog`
      ),
    [post]
  );

  const seoDescription = useMemo(
    () =>
      pickSeoDescription(
        post?.meta_description,
        autoDescriptionFromText(post?.short_description || '', stripHtml(post?.full_content || ''), 170)
      ),
    [post]
  );

  const seoKeywords = useMemo(
    () =>
      pickSeoKeywords(post?.meta_keywords, [
        post?.title,
        post?.category,
        ...autoKeywords,
        'college admission blog',
        'career guidance',
      ]),
    [autoKeywords, post]
  );

  const articleSchema = useMemo(() => {
    if (!post?.id) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: seoDescription,
      author: {
        '@type': 'Person',
        name: post.author || 'Aao College Team',
      },
      datePublished: post.created_at,
      dateModified: post.updated_at || post.created_at,
      mainEntityOfPage: `https://aaocollege.com${canonicalPath}`,
      image: post.image || 'https://aaocollege.com/og-banner.jpg',
    };
  }, [canonicalPath, post, seoDescription]);

  const handleLike = async () => {
    if (hasLiked) return;

    try {
      const newCount = likes + 1;
      setLikes(newCount);
      setHasLiked(true);

      // Save to local storage to persist state locally
      const likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
      localStorage.setItem('liked_posts', JSON.stringify([...likedPosts, resolvedId]));

      // Update Database
      const { error } = await supabase
        .from('blogs')
        .update({ likes_count: newCount })
        .eq('id', resolvedId);

      if (error) throw error;

    } catch (error) {
      console.error("Error liking post:", error);
      // Revert if error
      setLikes(likes);
      setHasLiked(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newCommentName.trim() || !newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase
        .from('blog_comments')
        .insert([{
          blog_id: resolvedId,
          user_name: newCommentName,
          comment_text: newCommentText,
          status: 'pending' // Default status
        }]);

      if (error) throw error;

      toast({
        title: "Comment Submitted!",
        description: "Your comment is awaiting moderation and will appear shortly.",
      });

      setNewCommentName('');
      setNewCommentText('');

    } catch (error) {
      console.error("Error submitting comment:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Please try again later."
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Article Not Found</h1>
        <Button onClick={() => navigate('/blog')}>Back to Blog</Button>
      </div>
    );
  }

  return (
    <>
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalPath={canonicalPath}
        ogType="article"
        ogImage={post.image || '/og-banner.jpg'}
        jsonLd={articleSchema}
      />

      <div className="bg-white min-h-screen pb-16">
        {/* Hero Image */}
        <div className="w-full h-[400px] relative bg-gray-900">
          <img 
             src={post.image || "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80"} 
             alt={post.title}
             className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-4 pb-12">
               <Button onClick={() => navigate('/blog')} variant="outline" className="mb-6 text-white border-white hover:bg-white hover:text-gray-900">
                 <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
               </Button>
               <div className="max-w-3xl">
                 {post.category && (
                   <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold mb-4 inline-block">
                     {post.category}
                   </span>
                 )}
                 <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">{post.title}</h1>
                 <div className="flex items-center text-gray-200 space-x-6 text-sm md:text-base">
                   <div className="flex items-center">
                     <User className="h-4 w-4 mr-2" />
                     {post.author}
                   </div>
                   <div className="flex items-center">
                     <Calendar className="h-4 w-4 mr-2" />
                     {new Date(post.created_at).toLocaleDateString()}
                   </div>
                   <div className="flex items-center">
                     <Clock className="h-4 w-4 mr-2" />
                     5 min read
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
             {/* Main Content */}
             <div className="lg:col-span-8">
               <div className="prose prose-lg max-w-none text-gray-700 mb-12">
                 <p className="text-xl text-gray-600 leading-relaxed mb-8 font-medium border-l-4 border-blue-600 pl-4">
                   {post.short_description}
                 </p>
                 <div className="whitespace-pre-line">
                    {post.full_content}
                 </div>
                 
                 {/* Images Gallery if available */}
                 {post.images && (() => {
                    let imagesArr = [];
                    try {
                        imagesArr = typeof post.images === 'string' ? JSON.parse(post.images) : post.images;
                    } catch(e) {}
                    
                    if (Array.isArray(imagesArr) && imagesArr.length > 0) {
                        return (
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                                {imagesArr.map((img, idx) => (
                                    <img key={idx} src={img} alt={`Gallery ${idx}`} className="rounded-lg w-full h-40 object-cover" />
                                ))}
                           </div>
                        );
                    }
                    return null;
                 })()}
               </div>

               {/* Interaction Section */}
               <div className="border-t border-b border-gray-200 py-6 mb-10 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <Button 
                      onClick={handleLike} 
                      variant={hasLiked ? "secondary" : "outline"} 
                      className={`gap-2 ${hasLiked ? 'text-blue-600 bg-blue-50 border-blue-200' : ''}`}
                    >
                        <ThumbsUp className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
                        {hasLiked ? 'Liked' : 'Like'} ({likes})
                    </Button>
                    <div className="flex items-center text-gray-500 text-sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {comments.length} Comments
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    <Share2 className="h-4 w-4 mr-2" /> Share
                  </Button>
               </div>

               {/* Comment Section */}
               <div className="space-y-8">
                  <h3 className="text-2xl font-bold text-gray-900">Discussion</h3>
                  
                  {/* Comment Form */}
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h4 className="font-semibold mb-4">Leave a comment</h4>
                    <form onSubmit={handleCommentSubmit} className="space-y-4">
                        <div>
                            <input 
                                required
                                type="text" 
                                placeholder="Your Name" 
                                className="w-full md:w-1/2 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newCommentName}
                                onChange={e => setNewCommentName(e.target.value)}
                            />
                        </div>
                        <div>
                            <textarea 
                                required
                                rows={3}
                                placeholder="Share your thoughts..." 
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newCommentText}
                                onChange={e => setNewCommentText(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={submittingComment} className="bg-blue-600 hover:bg-blue-700">
                            {submittingComment ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <Send className="h-4 w-4 mr-2"/>}
                            Post Comment
                        </Button>
                    </form>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-6">
                     {comments.length === 0 ? (
                        <p className="text-gray-500 italic text-center py-4">No comments yet. Be the first to share your thoughts!</p>
                     ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                                    {comment.user_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h5 className="font-bold text-gray-900">{comment.user_name}</h5>
                                        <span className="text-xs text-gray-400">• {new Date(comment.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-gray-700 text-sm">{comment.comment_text}</p>
                                </div>
                            </div>
                        ))
                     )}
                  </div>
               </div>
             </div>

             {/* Sidebar */}
             <div className="lg:col-span-4 space-y-8">
                <div className="bg-blue-600 rounded-xl p-8 text-white text-center shadow-lg">
                   <h3 className="text-2xl font-bold mb-4">Need Admission Help?</h3>
                   <p className="text-blue-100 mb-6">Get expert guidance from our counselors and secure your seat in top colleges.</p>
                   <Button onClick={() => navigate('/contact')} className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                     Talk to Counselor
                   </Button>
                </div>
                
                {/* Related or recent posts could go here */}
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogDetailPage;
