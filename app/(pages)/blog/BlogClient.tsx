'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Clock, Search, X, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// --- Types ---
export type BlogPost = {
  id: string;
  category: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  imageUrl: string | null;
  tags: string[];
  isFeatured: boolean;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
    profileImage: string | null;
    professionalProfile?: {
      businessName: string | null;
    };
  };
};

interface BlogClientProps {
  initialBlogs: BlogPost[];
}

const CATEGORY_LABELS: Record<string, string> = {
  'STREET_STYLE': 'Street Style',
  'SUSTAINABLE_FASHION': 'Sustainable Fashion',
  'DESIGNER_SPOTLIGHT': 'Designer Spotlight',
  'ACCESSORIES': 'Accessories',
  'FASHION_TECH': 'Fashion Tech',
  'VINTAGE_REVIVAL': 'Vintage Revival',
  'RUNWAY': 'Runway Reviews',
  'CRAFT_HERITAGE': 'Craft & Heritage',
};

const DEFAULT_PULSE_CATEGORIES = [
  { id: 'RUNWAY', name: 'Runway' },
  { id: 'SUSTAINABLE_FASHION', name: 'Sustainable' },
  { id: 'STREET_STYLE', name: 'Street Style' },
  { id: 'DESIGNER_SPOTLIGHT', name: 'Designers' },
  { id: 'ACCESSORIES', name: 'Accessories' },
  { id: 'CRAFT_HERITAGE', name: 'Craft & Heritage' },
];

const formatCategory = (category: string | null) => {
  if (!category) return 'Fashion';
  return CATEGORY_LABELS[category] || category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const calculateReadTime = (content?: string | null) => {
  if (!content) return '3 min';
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  return `${minutes} min`;
};

// --- Featured Hero Slider ---
const FeaturedSlider = ({ posts }: { posts: BlogPost[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  }, [posts.length]);

  useEffect(() => {
    if (!isAutoPlaying || posts.length <= 1) return;
    const interval = setInterval(nextSlide, 7000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, posts.length, nextSlide]);

  if (posts.length === 0) return null;
  const currentPost = posts[currentIndex];

  return (
    <div 
      className="relative w-full h-[45vh] sm:h-[50vh] lg:h-[55vh] overflow-hidden mb-10 sm:mb-12 rounded-xl sm:rounded-2xl group select-none shadow-lg"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPost.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          {currentPost.imageUrl ? (
            <Image
              src={currentPost.imageUrl}
              alt={currentPost.title}
              fill
              priority
              sizes="100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15" />
          
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-5 sm:p-8 lg:p-10 max-w-3xl text-left">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="px-2.5 py-0.5 border border-white/40 text-white text-[10px] uppercase tracking-[0.2em] rounded-full backdrop-blur-md">
                {formatCategory(currentPost.category)}
              </span>
              <span className="text-white/70 text-[11px] flex items-center gap-1">
                <Clock size={11} /> {calculateReadTime(currentPost.content)}
              </span>
            </div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-serif text-white leading-[1.1] tracking-tight mb-3 line-clamp-2"
            >
              {currentPost.title}
            </motion.h2>
            
            <div className="flex items-end justify-between gap-4">
              <p className="text-white/70 text-sm font-serif italic max-w-lg line-clamp-2 leading-relaxed hidden sm:block">
                {currentPost.excerpt || currentPost.content.substring(0, 120) + '...'}
              </p>
              <Link 
                href={`/blog/${currentPost.slug}`} 
                className="shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-stone-950 hover:bg-stone-900 hover:text-white transition-all duration-300 transform hover:rotate-45"
                aria-label={`Read: ${currentPost.title}`}
              >
                <ArrowUpRight size={20} />
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {posts.length > 1 && (
        <div className="absolute bottom-5 right-5 sm:right-8 z-30 flex items-center gap-1">
          {posts.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={cn(
                "h-[2px] transition-all duration-500",
                idx === currentIndex ? "w-10 bg-white" : "w-4 bg-white/40 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Post Card ---
const EditorialCard = ({ post, index }: { post: BlogPost; index: number }) => {
  return (
    <motion.article 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="group flex flex-col h-full bg-white p-3 rounded-lg border border-stone-200/80 hover:border-stone-300 transition-all duration-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-md text-left"
    >
      <Link href={`/blog/${post.slug}`} className="flex flex-col h-full">
        <div className="relative overflow-hidden aspect-[3/4] rounded-md bg-stone-100 mb-4">
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full bg-[#F4F1EB] flex items-center justify-center">
              <span className="text-4xl font-serif italic text-stone-300">
                {post.title.charAt(0)}
              </span>
            </div>
          )}

          <div className="absolute top-3 left-3 z-10">
            <span className="bg-white/90 backdrop-blur-sm text-stone-800 text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 font-mono rounded">
              {formatCategory(post.category)}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col flex-1 px-0.5">
          <h3 className="text-lg sm:text-xl font-serif leading-snug mb-2 text-stone-900 group-hover:italic transition-all line-clamp-2">
            {post.title}
          </h3>
          <p className="text-stone-500 text-[13px] line-clamp-2 leading-relaxed mb-4">
            {post.excerpt || post.content.substring(0, 100) + '...'}
          </p>
          
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-stone-100">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
              {calculateReadTime(post.content)}
            </span>
            <div className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 group-hover:bg-stone-950 group-hover:text-white transition-all transform group-hover:rotate-45">
              <ArrowUpRight size={12} />
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

// --- Main BlogClient Component ---
export default function BlogClient({ initialBlogs }: BlogClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const filtered = useMemo(() => {
    return initialBlogs.filter(post => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        post.title.toLowerCase().includes(q) ||
        (post.excerpt || '').toLowerCase().includes(q) ||
        (post.content || '').toLowerCase().includes(q) ||
        (post.tags || []).some(t => t.toLowerCase().includes(q));

      const matchesCat = !activeCategory || post.category === activeCategory;

      return matchesSearch && matchesCat;
    });
  }, [initialBlogs, searchQuery, activeCategory]);

  const featuredPosts = useMemo(() => {
    const explicitlyFeatured = filtered.filter(p => p.isFeatured);
    if (explicitlyFeatured.length > 0) return explicitlyFeatured;
    return filtered.slice(0, 2);
  }, [filtered]);

  const regularPosts = useMemo(() => {
    if (searchQuery.trim() || activeCategory) {
      return filtered;
    }
    const featuredIds = new Set(featuredPosts.map(p => p.id));
    return filtered.filter(p => !featuredIds.has(p.id));
  }, [filtered, featuredPosts, searchQuery, activeCategory]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;
    setIsSubscribed(true);
    setNewsletterEmail('');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 selection:bg-stone-900 selection:text-amber-100 overflow-x-hidden pt-20 sm:pt-24">
      
      {/* ── 1. MASTHEAD ── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto border-b border-stone-200 pb-6 sm:pb-8 mb-8 sm:mb-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-6">
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal leading-[0.9] tracking-tight text-stone-950">
              The Journal
            </h1>

            {/* Search Bar */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-white rounded-full border border-stone-200 py-2 pl-9 pr-8 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

          </div>
        </motion.div>
      </section>

      {/* ── 2. FEATURED HERO ── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
        {featuredPosts.length > 0 && !searchQuery && !activeCategory && (
          <FeaturedSlider posts={featuredPosts} />
        )}
      </section>

      {/* ── 3. STORIES & SIDEBAR ── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-14 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Main Feed (8 cols) */}
          <div className="lg:col-span-8">
            
            {(activeCategory || searchQuery) && (
              <div className="mb-6 flex items-center justify-between border-b border-stone-200 pb-2.5 text-xs">
                <span className="text-stone-500">
                  {activeCategory ? `${formatCategory(activeCategory)}` : `"${searchQuery}"`} — {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
                </span>
                <button
                  type="button"
                  onClick={() => { setActiveCategory(null); setSearchQuery(''); }}
                  className="text-stone-700 font-medium hover:underline"
                >
                  Clear
                </button>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-stone-200 rounded-xl p-6">
                <p className="text-stone-400 font-serif text-xl italic mb-2">
                  No articles found.
                </p>
                <p className="text-stone-500 text-xs max-w-xs mx-auto mb-4">
                  {searchQuery || activeCategory
                    ? 'Try a different search or clear the filter.'
                    : 'New articles coming soon.'}
                </p>
                {(searchQuery || activeCategory) && (
                  <button
                    type="button"
                    onClick={() => { setActiveCategory(null); setSearchQuery(''); }}
                    className="px-4 py-1.5 text-xs text-stone-900 border border-stone-300 rounded-full hover:border-stone-900 transition-colors"
                  >
                    View all
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-8">
                <AnimatePresence mode="popLayout">
                  {(regularPosts.length > 0 ? regularPosts : filtered).map((post, index) => (
                    <EditorialCard key={post.id} post={post} index={index} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Sidebar (4 cols) */}
          <aside className="lg:col-span-4 lg:border-l lg:border-stone-200/80 lg:pl-8">
            <div className="lg:sticky lg:top-24 space-y-10 text-left">
              
              {/* Categories */}
              <div>
                <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-stone-400 mb-4 pb-2 border-b border-stone-200 flex items-center justify-between">
                  <span>Categories</span>
                  {activeCategory && (
                    <button 
                      type="button" 
                      onClick={() => setActiveCategory(null)}
                      className="text-stone-700 hover:underline lowercase font-sans text-[11px]"
                    >
                      all
                    </button>
                  )}
                </h3>
                
                <div className="space-y-1">
                  {DEFAULT_PULSE_CATEGORIES.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(isActive ? null : cat.id)}
                        className={cn(
                          "w-full flex items-center justify-between py-2 px-2 rounded-md text-left transition-all text-sm",
                          isActive 
                            ? "bg-stone-100 text-stone-950 font-medium" 
                            : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                        )}
                      >
                        <span>{cat.name}</span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-950 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Newsletter */}
              <div className="p-5 bg-stone-950 text-white rounded-xl space-y-4">
                <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
                  Newsletter
                </h4>
                
                {isSubscribed ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-300">
                    <Check size={14} />
                    <span>Subscribed.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="space-y-3">
                    <input 
                      type="email" 
                      required
                      value={newsletterEmail}
                      onChange={e => setNewsletterEmail(e.target.value)}
                      placeholder="Your email" 
                      className="w-full bg-transparent border-b border-stone-700 py-2 focus:outline-none focus:border-white transition-colors text-sm placeholder:text-stone-600 text-white"
                    />
                    <button 
                      type="submit"
                      className="w-full bg-white text-stone-950 py-2.5 rounded-full text-[10px] font-mono uppercase tracking-widest hover:bg-stone-200 transition-all font-semibold"
                    >
                      Subscribe
                    </button>
                  </form>
                )}
              </div>

            </div>
          </aside>

        </div>
      </section>

    </div>
  );
}
