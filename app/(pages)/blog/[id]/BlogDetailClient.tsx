'use client';
import React from 'react';
import { ArrowLeft, Clock, Calendar, Share2, Heart, MessageCircle, ArrowUpRight, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

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

const CATEGORY_LABELS: Record<string, string> = {
  'STREET_STYLE': 'Street Style',
  'SUSTAINABLE_FASHION': 'Sustainable Fashion',
  'DESIGNER_SPOTLIGHT': 'Designer Spotlight',
  'ACCESSORIES': 'Accessories',
  'FASHION_TECH': 'Fashion Tech',
  'VINTAGE_REVIVAL': 'Vintage Revival',
};

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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const RelatedPosts = ({ currentId, posts }: { currentId: string; posts: BlogPost[] }) => {
  const relatedPosts = posts.filter(p => p.id !== currentId).slice(0, 3);
  if (relatedPosts.length === 0) return null;
  return (
    <section className="py-24 bg-neutral-50" id="related-posts">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px bg-neutral-300 flex-1"></div>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">Continue Reading</span>
            <div className="h-px bg-neutral-300 flex-1"></div>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif text-center mb-16">You Might Also Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedPosts.map((post, index) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }}>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <div className="relative overflow-hidden aspect-[4/3] mb-6">
                    {post.imageUrl ? <Image src={post.imageUrl} alt={post.title} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-110" /> : <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300" />}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"><ArrowUpRight size={32} className="text-white" /></div>
                  </div>
                  <span className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2 block">{formatCategory(post.category)}</span>
                  <h3 className="text-xl font-serif leading-tight group-hover:underline decoration-1 underline-offset-4">{post.title}</h3>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default function BlogDetailClient({ post, relatedPosts }: { post: BlogPost; relatedPosts: BlogPost[] }) {
  const authorName = post.author ? `${post.author.firstName} ${post.author.lastName}`.trim() || post.author.professionalProfile?.businessName || 'TrendiZip' : 'TrendiZip';
  return (
    <div className="min-h-screen pt-20 bg-[#FAFAF9] text-neutral-900 selection:bg-black selection:text-white overflow-x-hidden">
      <motion.nav initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest hover:text-neutral-600 transition-colors"><ArrowLeft size={16} /> Back</Link>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors"><Share2 size={18} /></button>
            <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors"><Heart size={18} /></button>
          </div>
        </div>
      </motion.nav>
      <header className="relative w-full h-[85vh] overflow-hidden">
        <motion.div initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} className="absolute inset-0">
          {post.imageUrl ? <Image src={post.imageUrl} alt={post.title} fill priority className="object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-neutral-700 to-neutral-900" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </motion.div>
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 lg:p-24">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="px-4 py-1 bg-white/20 backdrop-blur-md text-white text-xs uppercase tracking-widest rounded-full border border-white/30">{formatCategory(post.category)}</span>
              {post.tags?.map((tag, index) => <span key={index} className="flex items-center gap-1 text-white/70 text-xs font-mono"><Tag size={12} /> {tag}</span>)}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-medium text-white leading-[0.95] mb-8">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-white/80 text-sm font-mono">
              <span className="flex items-center gap-2">
                {post.author?.profileImage ? <Image src={post.author.profileImage} alt={authorName} width={32} height={32} className="w-8 h-8 rounded-full object-cover" /> : <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs">{authorName.charAt(0)}</span>}
                {authorName}
              </span>
              <span className="flex items-center gap-2"><Calendar size={14} /> {formatDate(post.createdAt)}</span>
              <span className="flex items-center gap-2"><Clock size={14} /> {calculateReadTime(post.content)}</span>
            </div>
          </motion.div>
        </div>
      </header>
      <article className="max-w-4xl mx-auto px-6 md:px-12 py-24">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          {post.excerpt && <p className="text-2xl md:text-3xl font-serif leading-relaxed text-neutral-800 mb-16 first-letter:text-7xl first-letter:font-serif first-letter:float-left first-letter:mr-4 first-letter:mt-2 first-letter:leading-[0.8]">{post.excerpt}</p>}
          <div className="prose prose-lg prose-neutral max-w-none prose-headings:font-serif prose-headings:font-medium prose-headings:text-neutral-900 prose-p:font-light prose-p:text-neutral-600 prose-p:leading-relaxed prose-p:mb-8 prose-a:text-black prose-a:underline prose-a:decoration-1 prose-a:underline-offset-4 hover:prose-a:decoration-2 prose-blockquote:border-l-4 prose-blockquote:border-black prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-neutral-600 prose-strong:text-neutral-900 whitespace-pre-wrap">
            {post.content}
          </div>
          {post.tags && post.tags.length > 0 && <div className="mt-16 pt-8 border-t border-neutral-200"><div className="flex flex-wrap gap-2">{post.tags.map((tag, index) => <span key={index} className="px-4 py-2 bg-neutral-100 text-neutral-600 text-sm font-mono uppercase tracking-widest hover:bg-neutral-200 transition-colors cursor-pointer">#{tag}</span>)}</div></div>}
          <div className="mt-16 p-8 bg-neutral-100 border border-neutral-200"><div className="flex items-start gap-6">{post.author?.profileImage ? <Image src={post.author.profileImage} alt={authorName} width={64} height={64} className="w-16 h-16 rounded-full object-cover" /> : <div className="w-16 h-16 rounded-full bg-neutral-300 flex items-center justify-center text-2xl font-serif">{authorName.charAt(0)}</div>}<div><p className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">Written by</p><h4 className="text-xl font-serif mb-2">{authorName}</h4><p className="text-sm text-neutral-600 font-light">Official TrendiZip editorial team bringing you the latest in fashion trends, style guides, and industry insights.</p></div></div></div>
          <div className="mt-16 flex items-center justify-between py-8 border-y border-neutral-200"><div className="flex items-center gap-8"><button className="flex items-center gap-2 text-neutral-600 hover:text-black transition-colors"><Heart size={20} /> <span className="text-sm font-mono">Like</span></button><button className="flex items-center gap-2 text-neutral-600 hover:text-black transition-colors"><MessageCircle size={20} /> <span className="text-sm font-mono">Comment</span></button></div><button className="flex items-center gap-2 text-neutral-600 hover:text-black transition-colors"><Share2 size={20} /> <span className="text-sm font-mono">Share</span></button></div>
        </motion.div>
      </article>
      <RelatedPosts currentId={post.id} posts={relatedPosts} />
      <footer className="bg-black text-white py-16"><div className="max-w-[1600px] mx-auto px-6 md:px-12 text-center"><Link href="/blog" className="inline-flex items-center gap-2 text-white font-mono text-sm uppercase tracking-widest border-b border-white/30 hover:border-white transition-all pb-1">Back to Journal <ArrowUpRight size={16} /></Link></div></footer>
    </div>
  );
}
