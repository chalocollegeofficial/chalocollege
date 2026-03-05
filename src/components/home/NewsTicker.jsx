import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { createBlogSlug } from '@/utils/slug';

// A thin, scrolling "Latest News" bar (marquee-style)
// Pulls latest blog posts from Supabase and scrolls them continuously.

const NewsTicker = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchLatest = async () => {
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('id,title,slug')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        if (!mounted) return;

        setItems((data || []).filter((x) => x?.title));
      } catch (e) {
        // If something goes wrong (e.g. table not available), just hide the ticker.
        console.error('NewsTicker error:', e);
        if (mounted) setItems([]);
      }
    };

    fetchLatest();
    return () => {
      mounted = false;
    };
  }, []);

  const doubledItems = useMemo(() => {
    // Duplicate the array so the animation can loop seamlessly.
    if (!items.length) return [];
    return [...items, ...items];
  }, [items]);

  // Duration scales with number of items, but stays within sensible limits.
  const durationSec = useMemo(() => {
    const n = Math.max(items.length, 1);
    return Math.min(60, Math.max(25, n * 6));
  }, [items.length]);

  if (!items.length) return null;

  return (
    // ✅ sticky under navbar (navbar is h-16 => top-16)
    <div className="w-full bg-[#3b0a6f] text-white border-b border-white/10 sticky top-16 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 h-10 overflow-hidden">
          <div className="flex-shrink-0 text-xs md:text-sm font-semibold uppercase tracking-wide bg-white/10 px-3 py-1 rounded-md">
            Latest News:
          </div>

          <div className="relative flex-1 overflow-hidden">
            <div
              className="news-ticker-track flex items-center whitespace-nowrap"
              style={{ animationDuration: `${durationSec}s` }}
            >
              {doubledItems.map((post, idx) => (
                <React.Fragment key={`${post.id}-${idx}`}>
                  <Link
                    to={`/blog/${createBlogSlug(post)}/${post.id}`}
                    className="inline-flex items-center text-xs md:text-sm hover:underline hover:text-white/90 px-4"
                    title={post.title}
                  >
                    {post.title}
                  </Link>
                  <span className="text-white/50">•</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;
