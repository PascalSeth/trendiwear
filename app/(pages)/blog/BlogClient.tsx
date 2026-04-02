'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpRight, Clock } from 'lucide-react';
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
};

const trendingCategories = [
  { name: "Runway Reviews", count: 24 },
  { name: "Sustainable Fashion", count: 18 },
  { name: "Street Style", count: 32 },
  { name: "Designer Spotlight", count: 15 },
  { name: "Fashion Tech", count: 12 },
  { name: "Vintage Revival", count: 21 },
];

const calculateReadTime = (content: string) => {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
};

const formatCategory = (category: string | null) => {
  if (!category) return 'Fashion';
  return CATEGORY_LABELS[category] || category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const FeaturedSlider = ({ posts }: { posts: BlogPost[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  }, [posts.length]);

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
              <span className="px-3 py-1 border border-white/30 text-white text-xs uppercase tracking-widest rounded-full backdrop-blur-md font-mono">
                {formatCategory(currentPost.category)}
              </span>
              <span className="text-white/80 text-xs font-mono flex items-center gap-2 uppercase tracking-widest">
                <Clock size={12} /> {calculateReadTime(currentPost.content)}
              </span>
            </div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl md:text-7xl lg:text-8xl font-serif font-medium text-white leading-[0.9] mb-8"
            >
              {currentPost.title}
            </motion.h1>
            
            <div className="flex flex-col md:flex-row md:items-center gap-8 mb-8">
              <p className="text-white/80 text-lg md:text-xl font-serif italic max-w-2xl leading-relaxed border-l-2 border-white/40 pl-8">
                {currentPost.excerpt || currentPost.content.substring(0, 150) + '...'}
              </p>
              <Link href={`/blog/${currentPost.slug}`} className="shrink-0 w-24 h-24 bg-white rounded-full flex items-center justify-center text-black hover:bg-red-950 hover:text-white transition-all duration-500 transform hover:rotate-45">
                 <ArrowUpRight size={32} />
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {posts.length > 1 && (
        <>
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1">
            {posts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-[1px] transition-all duration-1000 ${
                  idx === currentIndex ? 'w-24 bg-white' : 'w-6 bg-white/20 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const GridCard = ({ post, index }: { post: BlogPost, index: number }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group cursor-pointer flex flex-col h-full bg-white p-4 rounded-sm ring-1 ring-stone-900/5 hover:ring-stone-900/10 transition-all shadow-sm hover:shadow-2xl"
    >
      <Link href={`/blog/${post.slug}`} className="flex flex-col h-full">
        <div className="relative overflow-hidden aspect-[4/5] mb-8">
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-100 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-stone-100" />
          )}
          <div className="absolute top-6 left-6 z-10">
            <span className="bg-white/90 backdrop-blur-sm text-black text-[9px] uppercase tracking-[0.3em] px-3 py-1 font-mono">
              {formatCategory(post.category)}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col flex-1 px-4">
          <h3 className="text-3xl md:text-4xl font-serif font-medium leading-tight mb-4 group-hover:italic transition-all">
            {post.title}
          </h3>
          <p className="text-stone-500 font-serif italic text-lg line-clamp-2 leading-relaxed mb-6">
            {post.excerpt || post.content.substring(0, 120) + '...'}
          </p>
          <div className="mt-auto flex items-center justify-between pb-4 border-t border-stone-50 pt-4">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">{calculateReadTime(post.content)}</span>
            <div className="p-2 border border-stone-200 rounded-full group-hover:bg-black group-hover:text-white transition-all transform group-hover:rotate-45">
               <ArrowUpRight size={14} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default function BlogClient({ initialBlogs }: BlogClientProps) {
  const featuredPosts = initialBlogs.filter(p => p.isFeatured);
  const regularPosts = initialBlogs.filter(p => !p.isFeatured);
  const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 selection:bg-black selection:text-white pt-24 lg:pt-32">
      <section className="px-6 md:px-12 py-16 max-w-[1700px] mx-auto border-b border-stone-200">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-red-950 mb-6">TrendiZip — Edition {monthYear}</p>
              <h1 className="text-[14vw] md:text-[10rem] font-serif leading-[0.8] tracking-tighter text-stone-950 font-medium">
                THE<br />JOURNAL.
              </h1>
            </div>
            <div className="max-w-sm text-right mt-12 hidden md:block border-l border-stone-200 pl-12">
              <p className="font-serif text-2xl italic text-stone-500 leading-relaxed mb-4">
                &ldquo;Fashion is the armor to survive the reality of everyday life.&rdquo;
              </p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400">— Bill Cunningham</p>
            </div>
          </div>
        </motion.div>
      </section>

      {featuredPosts.length > 0 && <FeaturedSlider posts={featuredPosts} />}

      <section className="px-6 md:px-12 py-24 max-w-[1700px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          <div className="lg:col-span-8">
            {regularPosts.length === 0 && featuredPosts.length === 0 ? (
              <div className="text-center py-32 border-2 border-dashed border-stone-200">
                <p className="text-stone-400 font-serif text-3xl italic">The archives are empty...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-24">
                {regularPosts.map((post, index) => (
                  <GridCard key={post.id} post={post} index={index} />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 lg:border-l lg:border-stone-100 lg:pl-16">
            <div className="sticky top-32 space-y-24">
               <div>
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-10 border-b border-stone-200 pb-4">
                    The Pulse
                  </h4>
                  <div className="space-y-10">
                    {trendingCategories.map((cat, idx) => (
                      <div key={idx} className="group cursor-pointer flex justify-between items-center transition-all">
                        <div className="flex items-center gap-6">
                          <span className="font-mono text-[10px] text-stone-300">/ 0{idx + 1}</span>
                          <span className="text-2xl font-serif italic text-stone-600 group-hover:text-black transition-colors group-hover:translate-x-2 duration-500">
                            {cat.name}
                          </span>
                        </div>
                        <div className="h-[1px] flex-1 mx-4 bg-stone-50" />
                        <span className="font-mono text-[10px] text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">{cat.count} files</span>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="p-12 bg-stone-950 text-white rounded-3xl space-y-8 shadow-2xl">
                  <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-stone-500">Newsletter</span>
                  <h4 className="font-serif text-4xl italic leading-none">Bespoke Insights.</h4>
                  <p className="text-stone-400 font-serif italic text-lg leading-relaxed">
                    Curated fashion stories delivered to your inbox weekly.
                  </p>
                  <div className="flex flex-col gap-6 pt-4">
                    <input 
                      type="email" 
                      placeholder="Your email address" 
                      className="bg-transparent border-b border-stone-800 py-4 focus:outline-none focus:border-white transition-colors text-lg italic font-serif placeholder:text-stone-700"
                    />
                    <button className="bg-white text-black py-5 rounded-full text-[10px] font-mono uppercase tracking-widest hover:bg-stone-200 transition-all font-bold">
                      Subscribe Now
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-32 py-16 bg-stone-950 text-white overflow-hidden whitespace-nowrap">
        <div className="inline-block animate-marquee font-mono text-[10rem] italic opacity-5 leading-none uppercase tracking-tighter">
          THE JOURNAL • ATELIER • CRAFT • EDITORIAL • VOGUE • STYLE •
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee { display: inline-block; animation: marquee 30s linear infinite; }
      `}</style>
    </div>
  );
}
