'use client'
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowUpRight } from 'lucide-react';

// --- Types (Preserved) ---
interface BlogPost {
  id: number;
  category: string;
  date: string;
  readTime: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  featured: boolean;
}

interface SideCard {
  id: number;
  category: string;
  title: string;
  description: string;
  link: string;
  bgColor: string;
  icon: string;
  imageUrl?: string;
}

// --- Data (Preserved) ---
const featuredPost: BlogPost = {
  id: 1,
  category: "Fashion",
  date: "Nov 08, 2023",
  readTime: "5 min read",
  title: "Discover Latest Trends in Fall Fashion",
  description: "Explore season's most captivating styles, from cozy textures to bold statement pieces that define autumn elegance.",
  imageUrl: "https://plus.unsplash.com/premium_photo-1683121263622-664434494177?q=80&w=1376&auto=format&fit=crop",
  tags: ["trending", "fall-fashion", "style-guide"],
  featured: true
};

const sideCards: SideCard[] = [
  {
    id: 2,
    category: "STYLE TIPS",
    title: "Become a Style Insider",
    description: "Get exclusive tips and tricks from top fashion experts and transform your wardrobe.",
    link: "/membership",
    bgColor: "from-purple-600 to-pink-600", // Ignored in favor of monochrome
    icon: "tips"
  },
  {
    id: 3,
    category: "COLLECTION",
    imageUrl: "https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=400&fit=crop&q=60",
    title: "See all fashion picks",
    description: "Curated selections from our fashion editors featuring season's must-have pieces.",
    link: "/picks",
    bgColor: "from-blue-600 to-cyan-600",
    icon: "collection"
  },
];

function BlogIntro() {

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-stone-900 font-sans selection:bg-black selection:text-white pb-24">
      
      {/* Marquee Strip */}
      <div className="w-full overflow-hidden border-b border-stone-200 bg-white py-3">
        <div className="whitespace-nowrap animate-marquee font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400">
          Editor&apos;s Pick • Fashion Week • Style Guide • New Collection • Editor&apos;s Pick • Fashion Week • Style Guide • New Collection •
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 md:px-12 pt-16">
        
        {/* Editorial Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-stone-200 pb-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-stone-500 mb-4">
              The Journal
            </p>
            <h1 className="text-5xl md:text-7xl font-serif font-medium text-stone-900 leading-[0.9]">
              Editor&apos;s <br/> Selection
            </h1>
          </div>
          <Link href="/blog" className="hidden md:flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors">
            View All <ArrowUpRight size={14} />
          </Link>
        </header>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left: Featured Hero Post (Takes 8 cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-8 group cursor-pointer"
          >
            <div className="relative w-full aspect-[16/9] overflow-hidden border border-stone-200">
              {/* Main Image */}
              <Image
                src={featuredPost.imageUrl}
                alt={featuredPost.title}
                fill
                className="object-cover transition-transform duration-[1000ms] ease-out grayscale group-hover:grayscale-0 group-hover:scale-105"
              />

              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-500" />

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
                <div className="flex items-center gap-4 mb-4 font-mono text-xs uppercase tracking-widest text-stone-300">
                  <span className="flex items-center gap-2">
                    <Calendar size={12} /> {featuredPost.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-2">
                    <Clock size={12} /> {featuredPost.readTime}
                  </span>
                  <span>•</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-sm backdrop-blur-sm">{featuredPost.category}</span>
                </div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium leading-[0.95] mb-4 group-hover:italic transition-all duration-300">
                  {featuredPost.title}
                </h2>
                
                <p className="text-stone-200 text-lg md:text-xl font-light max-w-2xl leading-relaxed mb-6 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                  {featuredPost.description}
                </p>

                <div className="flex items-center gap-3 text-sm font-medium">
                  <span>Read Story</span>
                  <div className="w-8 h-[1px] bg-white transition-all duration-300 group-hover:w-12" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Side List (Takes 4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div className="space-y-8">
              <h3 className="font-mono text-xs uppercase tracking-widest text-stone-400 border-b border-stone-200 pb-4">
                Quick Reads
              </h3>

              {sideCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group cursor-pointer"
                >
                  <Link href={card.link} className="block">
                    {card.imageUrl ? (
                      <div className="flex gap-4">
                        {/* Small Thumbnail */}
                        <div className="w-24 h-24 flex-shrink-0 overflow-hidden border border-stone-200 relative">
                           <Image
                              src={card.imageUrl}
                              alt={card.title}
                              fill
                              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                            />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mb-2 block">
                            {card.category}
                          </span>
                          <h4 className="text-lg font-serif text-stone-900 leading-tight group-hover:italic transition-colors">
                            {card.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-xs font-medium text-stone-600">Read more</span>
                            <ArrowUpRight size={12} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Text-Only Side Card (Minimalist)
                      <div className="border border-stone-200 p-6 hover:border-stone-900 transition-colors bg-stone-50">
                        <div className="flex justify-between items-start mb-3">
                           <span className="font-mono text-[10px] uppercase tracking-widest text-stone-500">
                             {card.category}
                           </span>
                           <div className="w-2 h-2 bg-stone-900 rounded-full"></div>
                        </div>
                        <h4 className="text-xl font-serif text-stone-900 mb-2 leading-tight">
                          {card.title}
                        </h4>
                        <p className="text-sm text-stone-600 font-light leading-relaxed line-clamp-2">
                          {card.description}
                        </p>
                      </div>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Decorative Footer in Sidebar */}
            <div className="mt-12 pt-8 border-t border-stone-200">
              <p className="font-serif text-stone-400 italic text-sm">
                &apos;Fashion is the armor to survive the reality of everyday life&apos;
              </p>
              <div className="h-px w-full bg-stone-200 mt-4"></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default BlogIntro;