'use client';
import React from 'react';
import { ArrowUpRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

// --- Data ---
type BlogPost = {
  id: number;
  category: string;
  time?: string;
  title: string;
  description?: string;
  imageUrl: string;
  tags?: string[];
  featured?: boolean;
};

const blogPosts: BlogPost[] = [
  {
    id: 1,
    category: "Street Style",
    time: "5 min read",
    title: "Effortless Urban Chic: Mastering the Art of Street Fashion",
    description: "Discover how to blend comfort with cutting-edge style in the concrete jungle. From oversized blazers to statement sneakers, we explore the essential pieces that define modern street fashion.",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&auto=format&fit=crop&q=80",
    featured: true,
    tags: ["trending", "street-style", "urban"],
  },
  {
    id: 2,
    category: "Sustainable Fashion",
    time: "3 min read",
    title: "Eco-Luxury: The Future of Conscious Fashion",
    description: "Explore how sustainable practices are reshaping the fashion industry with innovative materials.",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&auto=format&fit=crop&q=80",
    tags: ["sustainable", "eco-friendly"],
  },
  {
    id: 3,
    category: "Designer Spotlight",
    time: "4 min read",
    title: "Rising Stars: Emerging Designers Breaking Boundaries",
    description: "Meet the visionary creators reshaping fashion's future with bold concepts.",
    imageUrl: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1000&auto=format&fit=crop&q=80",
    tags: ["designers", "innovation"],
  },
  {
    id: 4,
    category: "Accessories",
    time: "2 min read",
    title: "Statement Pieces: Accessories That Transform Your Look",
    description: "The power of the perfect accessory to elevate any outfit from ordinary to extraordinary.",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1000&auto=format&fit=crop&q=80",
    tags: ["accessories", "jewelry"],
  },
  {
    id: 5,
    category: "Fashion Tech",
    time: "6 min read",
    title: "Wearable Innovation: Where Technology Meets Style",
    description: "Exploring the cutting-edge intersection of fashion and technology.",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1000&auto=format&fit=crop&q=80",
    tags: ["tech", "future"],
  },
  {
    id: 6,
    category: "Vintage Revival",
    time: "4 min read",
    title: "Timeless Elegance: Vintage Pieces Making a Comeback",
    description: "How classic vintage styles are being reimagined for the modern wardrobe.",
    imageUrl: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=1000&auto=format&fit=crop&q=80",
    tags: ["vintage", "classic"],
  },
];

const trendingCategories = [
  { name: "Runway Reviews", count: 24 },
  { name: "Sustainable Fashion", count: 18 },
  { name: "Street Style", count: 32 },
  { name: "Designer Spotlight", count: 15 },
  { name: "Fashion Tech", count: 12 },
  { name: "Vintage Revival", count: 21 },
];

// --- Components ---



// 2. Featured Large Card (Breaks grid)
const FeaturedCard = ({ post }: { post: BlogPost }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative w-full h-[85vh] overflow-hidden mb-24 group"
    >
      <div className="absolute inset-0 bg-black/30 z-10 group-hover:bg-black/20 transition-colors duration-700" />
      <motion.img 
        src={post.imageUrl} 
        alt={post.title}
        initial={{ scale: 1.1 }}
        whileHover={{ scale: 1 }}
        transition={{ duration: 1.2 }}
        className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000"
      />
      
      <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 md:p-16 max-w-4xl">
        <div className="flex items-center gap-4 mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
           <span className="px-3 py-1 border border-white/30 text-white text-xs uppercase tracking-widest rounded-full backdrop-blur-md">
             {post.category}
           </span>
           <span className="text-white/80 text-xs font-mono flex items-center gap-2">
             <Clock size={12} /> {post.time}
           </span>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-medium text-white leading-[0.95] mb-6 mix-blend-overlay">
          {post.title}
        </h1>
        
        <p className="text-white/80 text-lg md:text-xl font-light max-w-2xl leading-relaxed mb-8 border-l-2 border-white/40 pl-6">
          {post.description}
        </p>

        <Link href="#" className="inline-flex items-center gap-2 text-white font-mono text-sm uppercase tracking-widest border-b border-transparent hover:border-white transition-all pb-1 w-fit group/btn">
          Read Story <ArrowUpRight size={16} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
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
      <div className="relative overflow-hidden aspect-[3/4] mb-6">
        <Image
          src={post.imageUrl}
          alt={post.title}
          fill
          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-black/80 text-white text-[10px] uppercase tracking-widest px-2 py-1 backdrop-blur-sm">
            {post.category}
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
          {post.description}
        </p>
        <div className="mt-auto flex items-center gap-4 text-xs font-mono text-neutral-400">
          <span>{post.time}</span>
          <span>•</span>
          <span className="group-hover:text-black transition-colors">Read Article</span>
        </div>
      </div>
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
  // Logic remains the same, just visual output changes
  const featuredPost = blogPosts.find(p => p.featured) || blogPosts[0];
  const regularPosts = blogPosts.filter(p => p.id !== featuredPost.id);

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
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">Vol. 42 — October 2024</p>
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

      {/* Featured Content */}
      <section className="w-full px-0">
        <FeaturedCard post={featuredPost} />
      </section>

      {/* Grid Content + Sidebar */}
      <section className="px-6 md:px-12 py-12 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          
          {/* Main Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16">
            {regularPosts.map((post, index) => (
              <GridCard key={post.id} post={post} index={index} />
            ))}
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

      {/* Simple Footer */}
      <footer className="py-12 px-6 text-center font-mono text-xs uppercase tracking-widest text-neutral-500">
        © 2024 TrendiZip Inc. All rights reserved.
      </footer>
    </div>
  );
}

export default Blog;