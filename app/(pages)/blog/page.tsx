'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpRight, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

// --- Types ---
type BlogPost = {
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

const CATEGORY_LABELS: Record<string, string> = {
  'STREET_STYLE': 'Street Style',
  'SUSTAINABLE_FASHION': 'Sustainable Fashion',
  'DESIGNER_SPOTLIGHT': 'Designer Spotlight',
  'ACCESSORIES': 'Accessories',
  'FASHION_TECH': 'Fashion Tech',
  'VINTAGE_REVIVAL': 'Vintage Revival',
};

const trendingCategories = [
  { name: "Runway Reviews", count: 24 },
  { name: "Sustainable Fashion", count: 18 },
  { name: "Street Style", count: 32 },
  { name: "Designer Spotlight", count: 15 },
  { name: "Fashion Tech", count: 12 },
  { name: "Vintage Revival", count: 21 },
];

// Helper function to calculate read time
const calculateReadTime = (content: string) => {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
};

// Helper function to format category
const formatCategory = (category: string | null) => {
  if (!category) return 'Fashion';
  return CATEGORY_LABELS[category] || category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

// --- Components ---

// Featured Slider Component
const FeaturedSlider = ({ posts }: { posts: BlogPost[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  }, [posts.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  };

  useEffect(() => {
    if (!isAutoPlaying || posts.length <= 1) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, posts.length, nextSlide]);

  if (posts.length === 0) return null;

  const currentPost = posts[currentIndex];

  return (
    <div 
      className="relative w-full h-[85vh] overflow-hidden mb-24 group"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPost.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-black/30 z-10 group-hover:bg-black/20 transition-colors duration-700" />
          {currentPost.imageUrl ? (
            <Image
              src={currentPost.imageUrl}
              alt={currentPost.title}
              fill
              priority
              className="object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900" />
          )}
          
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 md:p-16 max-w-4xl">
            <div className="flex items-center gap-4 mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
              <span className="px-3 py-1 border border-white/30 text-white text-xs uppercase tracking-widest rounded-full backdrop-blur-md">
                {formatCategory(currentPost.category)}
              </span>
              <span className="text-white/80 text-xs font-mono flex items-center gap-2">
                <Clock size={12} /> {calculateReadTime(currentPost.content)}
              </span>
            </div>
            
            <motion.h1 
              key={`title-${currentPost.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-7xl font-serif font-medium text-white leading-[0.95] mb-6"
            >
              {currentPost.title}
            </motion.h1>
            
            <motion.p 
              key={`desc-${currentPost.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-white/80 text-lg md:text-xl font-light max-w-2xl leading-relaxed mb-8 border-l-2 border-white/40 pl-6"
            >
              {currentPost.excerpt || currentPost.content.substring(0, 200) + '...'}
            </motion.p>

            <Link href={`/blog/${currentPost.slug}`} className="inline-flex items-center gap-2 text-white font-mono text-sm uppercase tracking-widest border-b border-transparent hover:border-white transition-all pb-1 w-fit group/btn">
              Read Story <ArrowUpRight size={16} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      {posts.length > 1 && (
        <>
          {/* Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {posts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="absolute bottom-8 right-8 z-30 font-mono text-white/70 text-sm">
            <span className="text-white">{String(currentIndex + 1).padStart(2, '0')}</span>
            <span className="mx-2">/</span>
            <span>{String(posts.length).padStart(2, '0')}</span>
          </div>
        </>
      )}
    </div>
  );
};

// 3. Standard Grid Card
const GridCard = ({ post, index }: { post: BlogPost, index: number }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group cursor-pointer flex flex-col h-full"
    >
      <Link href={`/blog/${post.slug}`} className="flex flex-col h-full">
        <div className="relative overflow-hidden aspect-[3/4] mb-6">
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300" />
          )}
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-black/80 text-white text-[10px] uppercase tracking-widest px-2 py-1 backdrop-blur-sm">
              {formatCategory(post.category)}
            </span>
          </div>
          {/* Hover Overlay Actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
             <button className="bg-white text-black p-4 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:scale-110">
               <ArrowUpRight size={24} />
             </button>
          </div>
        </div>
        
        <div className="flex flex-col flex-1">
          <h3 className="text-2xl font-serif font-medium leading-tight mb-3 group-hover:underline decoration-1 underline-offset-4">
            {post.title}
          </h3>
          <p className="text-neutral-500 text-sm line-clamp-2 leading-relaxed mb-4">
            {post.excerpt || post.content.substring(0, 150) + '...'}
          </p>
          <div className="mt-auto flex items-center gap-4 text-xs font-mono text-neutral-400">
            <span>{calculateReadTime(post.content)}</span>
            <span>•</span>
            <span className="group-hover:text-black transition-colors">Read Article</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// 4. Minimal Sidebar List
const SidebarList = () => {
  return (
    <div className="sticky top-32">
      <div className="mb-8">
        <h4 className="font-mono text-xs uppercase tracking-widest text-neutral-500 mb-6 border-b border-neutral-200 pb-2">
          Trending Topics
        </h4>
        <div className="space-y-6">
          {trendingCategories.map((cat, idx) => (
            <div key={idx} className="group cursor-pointer flex justify-between items-baseline border-b border-transparent hover:border-neutral-300 pb-2 transition-all">
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-neutral-400">0{idx + 1}</span>
                <span className="text-lg font-serif italic text-neutral-800 group-hover:text-black transition-colors">
                  {cat.name}
                </span>
              </div>
              <span className="font-mono text-xs text-neutral-400">{cat.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 bg-neutral-100 border border-neutral-200 mt-12">
        <h4 className="font-serif text-2xl mb-4">The Newsletter</h4>
        <p className="text-sm text-neutral-600 mb-6 font-light">
          Curated fashion insights delivered to your inbox weekly. No spam, just style.
        </p>
        <div className="flex flex-col gap-3">
          <input 
            type="email" 
            placeholder="Email Address" 
            className="bg-transparent border-b border-neutral-400 py-2 focus:outline-none focus:border-black transition-colors text-sm placeholder:text-neutral-400"
          />
          <button className="bg-black text-white py-3 text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors mt-2">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---
function Blog() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/blogs?published=true&limit=20');
        if (!res.ok) throw new Error('Failed to fetch blogs');
        const data = await res.json();
        setBlogs(data.blogs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blogs');
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const featuredPosts = blogs.filter(p => p.isFeatured);
  const regularPosts = blogs.filter(p => !p.isFeatured);

  // Get current month/year for the journal header
  const currentDate = new Date();
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-600" />
          <p className="font-mono text-sm text-neutral-500">Loading articles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-black text-white text-sm uppercase tracking-widest hover:bg-neutral-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-neutral-900 selection:bg-black selection:text-white overflow-x-hidden">

      {/* Hero Section - Editorial Typography */}
      <section className="px-6 md:px-12 pt-32 pb-12 max-w-[1600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">TrendiZip — {monthYear}</p>
              <h1 className="text-[12vw] md:text-[8rem] font-serif leading-[0.85] tracking-tighter text-black">
                THE<br />JOURNAL
              </h1>
            </div>
            <div className="hidden md:block max-w-xs text-right mt-8">
              <p className="font-serif text-2xl italic text-neutral-600">
                &apos;Fashion is the armor to survive the reality of everyday life.&apos;
              </p>
              <p className="font-mono text-xs mt-2 uppercase tracking-widest">— Bill Cunningham</p>
            </div>
          </div>
          
          <div className="h-px w-full bg-neutral-300"></div>
        </motion.div>
      </section>

      {/* Featured Content - Slider */}
      {featuredPosts.length > 0 && (
        <section className="w-full px-0">
          <FeaturedSlider posts={featuredPosts} />
        </section>
      )}

      {/* Grid Content + Sidebar */}
      <section className="px-6 md:px-12 py-12 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          
          {/* Main Grid */}
          <div className="lg:col-span-8">
            {regularPosts.length === 0 && featuredPosts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-neutral-500 font-serif text-xl">No articles published yet.</p>
                <p className="text-neutral-400 text-sm mt-2">Check back soon for new content.</p>
              </div>
            ) : regularPosts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-neutral-500 font-serif text-xl">More articles coming soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16">
                {regularPosts.map((post, index) => (
                  <GridCard key={post.id} post={post} index={index} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <SidebarList />
          </div>

        </div>
      </section>

      {/* Footer Marquee */}
      <div className="mt-32 py-12 bg-black text-white overflow-hidden whitespace-nowrap border-y border-neutral-800">
        <motion.div 
          animate={{ x: [0, -1000] }} 
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="inline-block font-mono text-4xl italic opacity-50"
        >
          TRENDIZIP • CURATED FASHION • EDITORIAL • DESIGN • LIFESTYLE • TRENDIZIP • CURATED FASHION • EDITORIAL • DESIGN • LIFESTYLE •
        </motion.div>
      </div>


    </div>
  );
}

export default Blog;