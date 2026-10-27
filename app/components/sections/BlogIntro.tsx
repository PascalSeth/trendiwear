"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// --- Types (Preserved) ---
interface BlogPost {
  id: string;
  slug: string;
  category: string;
  date: string;
  readTime: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  featured: boolean;
}

interface QuickRead {
  id: string;
  slug: string;
  category: string;
  title: string;
  description: string;
  imageUrl?: string | null;
}

function BlogIntro() {

  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickReads, setQuickReads] = useState<QuickRead[]>([]);

  useEffect(() => {
    const fetchIntroBlogs = async () => {
      try {
        // Fetch a small set of published blogs just like the main blog page,
        // but limited for this intro section.
        const response = await fetch('/api/blogs?published=true&limit=4');
        if (!response.ok) {
          throw new Error('Failed to fetch blogs for intro');
        }

        const data: {
          blogs: Array<{
            id: string;
            title: string;
            slug: string;
            excerpt: string | null;
            content: string;
            imageUrl: string | null;
            tags: string[];
            category: string | null;
            isFeatured: boolean;
            createdAt: string;
            readTime?: string | null;
          }>;
        } = await response.json();

        const blogs = data.blogs || [];

        // Hero: only use a blog that is actually marked featured
        const featuredBlog = blogs.find((b) => b.isFeatured);
        if (featuredBlog) {
          const createdAt = new Date(featuredBlog.createdAt);
          const formattedDate = createdAt.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          });

          setFeaturedPost({
            id: featuredBlog.id,
            slug: featuredBlog.slug,
            category: featuredBlog.category || 'Fashion',
            date: formattedDate,
            readTime: featuredBlog.readTime || '5 min read',
            title: featuredBlog.title,
            description: featuredBlog.excerpt || featuredBlog.content || '',
            imageUrl:
              featuredBlog.imageUrl ||
              'https://images.pexels.com/photos/3760854/pexels-photo-3760854.jpeg',
            tags: featuredBlog.tags || [],
            featured: featuredBlog.isFeatured,
          });
        } else {
          setFeaturedPost(null);
        }

        // Quick reads: a small list derived from the same fetch.
        // If we had a featured hero, exclude it here; otherwise use all.
        const quickSource = featuredBlog
          ? blogs.filter((b) => b.id !== featuredBlog.id)
          : blogs;

        const quick = quickSource.slice(0, 3).map((blog) => ({
          id: blog.id,
          slug: blog.slug,
          category: blog.category || 'Fashion',
          title: blog.title,
          description: blog.excerpt || blog.content.substring(0, 120) + '...',
          imageUrl: blog.imageUrl,
        }));

        setQuickReads(quick);
      } catch (error) {
        console.error(error);
        setFeaturedPost(null);
        setQuickReads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchIntroBlogs();
  }, []);

  return (
    <div className="bg-[#FAFAF9] py-10 sm:py-12 lg:py-14 border-t border-stone-200/70 text-stone-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <header className="mb-6 sm:mb-8 flex justify-between items-end border-b border-stone-200/80 pb-4 gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-stone-900 tracking-tight">
              Articles
            </h2>
          </div>
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 transition-colors"
          >
            <span>View all</span>
            <ArrowUpRight size={13} />
          </Link>
        </header>

        {/* Main Content */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left: Featured Hero Post Skeleton */}
            <div className="lg:col-span-7">
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[16/10] max-h-[380px] rounded-2xl overflow-hidden border border-stone-200/90 shadow-2xs bg-stone-100">
                <Skeleton className="w-full h-full rounded-none bg-stone-200/70" />
                <div className="absolute top-3.5 left-3.5">
                  <Skeleton className="h-5 w-24 rounded-full bg-stone-900/40" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-20 bg-stone-200/70" />
                  <Skeleton className="h-3 w-16 bg-stone-200/70" />
                </div>
                <Skeleton className="h-6 w-4/5 bg-stone-200/80" />
                <Skeleton className="h-4 w-full bg-stone-200/50" />
              </div>
            </div>

            {/* Right: Quick Reads Skeletons */}
            <div className="lg:col-span-5 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 rounded-xl border border-stone-200/80 bg-white/60 flex gap-3.5 items-center">
                  <Skeleton className="w-20 h-20 rounded-lg shrink-0 bg-stone-200/70" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <Skeleton className="h-3 w-16 bg-stone-200/60" />
                    <Skeleton className="h-4 w-full bg-stone-200/80" />
                    <Skeleton className="h-2.5 w-1/2 bg-stone-200/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !featuredPost && quickReads.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm text-stone-500 font-light">
              No articles yet. New stories will appear here as they are published.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            
            {/* Left: Featured Hero Post */}
            {featuredPost && (
              <motion.div 
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className={`${quickReads.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'} group cursor-pointer`}
              >
                <Link href={`/blog/${featuredPost.slug}`} className="block">
                  <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[16/10] max-h-[380px] rounded-2xl overflow-hidden border border-stone-200/90 shadow-2xs bg-stone-100">
                    {/* Main Image */}
                    <Image
                      src={featuredPost.imageUrl}
                      alt={featuredPost.title}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />

                    {/* Permanent Gradient Overlay for Legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-300 group-hover:from-black/95" />

                    {/* Content Overlay */}
                    <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between text-white z-10">
                      {/* Top Badges */}
                      <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-wider text-stone-300">
                        <span className="bg-stone-900/60 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/15 text-white/95">
                          {featuredPost.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {featuredPost.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {featuredPost.readTime}
                        </span>
                      </div>

                      {/* Bottom Title & Excerpt */}
                      <div>
                        <h3 className="text-xl sm:text-2xl font-serif font-medium leading-snug tracking-tight mb-2 group-hover:text-stone-100 transition-colors">
                          {featuredPost.title}
                        </h3>
                        
                        {featuredPost.description && (
                          <p className="text-xs sm:text-sm text-stone-200/90 font-light line-clamp-2 leading-relaxed max-w-xl">
                            {featuredPost.description}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 pt-2.5 text-xs font-medium text-white/90">
                          <span>Read Story</span>
                          <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Right: Quick Reads List */}
            {quickReads.length > 0 && (
              <div className={`${featuredPost ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
                <div className="font-mono text-[10px] uppercase tracking-widest text-stone-400 border-b border-stone-200/80 pb-2.5 mb-3 flex items-center justify-between">
                  <span>Quick Reads</span>
                  <span className="text-[10px] text-stone-400">{quickReads.length} articles</span>
                </div>

                <div className={`${featuredPost ? 'space-y-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'}`}>
                  {quickReads.map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.06 }}
                    >
                      <Link 
                        href={`/blog/${card.slug}`} 
                        className="p-3 rounded-xl border border-stone-200/80 hover:border-stone-400 bg-white/70 hover:bg-white shadow-2xs hover:shadow-xs transition-all flex gap-3.5 items-center group block"
                      >
                        {card.imageUrl ? (
                          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg overflow-hidden border border-stone-200 relative shrink-0 bg-stone-100">
                            <Image
                              src={card.imageUrl}
                              alt={card.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="72px"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg border border-stone-200 bg-stone-100 flex items-center justify-center shrink-0">
                            <span className="font-serif text-lg text-stone-400">{card.title.charAt(0)}</span>
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 block mb-1">
                            {card.category}
                          </span>
                          <h4 className="text-xs sm:text-sm font-serif font-medium text-stone-900 group-hover:text-stone-700 line-clamp-2 leading-snug">
                            {card.title}
                          </h4>
                        </div>

                        <div className="w-6 h-6 rounded-full bg-stone-100 group-hover:bg-stone-900 group-hover:text-white flex items-center justify-center shrink-0 transition-colors text-stone-500">
                          <ArrowUpRight size={12} />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default BlogIntro;