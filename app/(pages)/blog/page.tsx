'use client'
import React, { useState, useEffect } from 'react';
import { ChevronRight, Clock, Tag, Sparkles, Heart, Share2, BookOpen, TrendingUp, Star } from 'lucide-react';

type BlogPost = {
  id: number;
  category: string;
  time?: string;
  title: string;
  description?: string;
  imageUrl: string;
  tags?: string[];
  bgColor?: string;
  featured?: boolean;
};

const blogPosts: BlogPost[] = [
  {
    id: 1,
    category: "Street Style",
    time: "5 min read",
    title: "Effortless Urban Chic: Mastering the Art of Street Fashion",
    description: "Discover how to blend comfort with cutting-edge style in the concrete jungle. From oversized blazers to statement sneakers, we explore the essential pieces that define modern street fashion.",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
    featured: true,
    tags: ["trending", "street-style", "urban"],
    bgColor: "bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900",
  },
  {
    id: 2,
    category: "Sustainable Fashion",
    time: "3 min read",
    title: "Eco-Luxury: The Future of Conscious Fashion",
    description: "Explore how sustainable practices are reshaping the fashion industry with innovative materials and ethical production methods.",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80",
    bgColor: "bg-gradient-to-br from-emerald-600 to-teal-700",
    tags: ["sustainable", "eco-friendly", "luxury"],
  },
  {
    id: 3,
    category: "Designer Spotlight",
    time: "4 min read",
    title: "Rising Stars: Emerging Designers Breaking Boundaries",
    description: "Meet the visionary creators reshaping fashion's future with bold concepts and innovative approaches to design.",
    imageUrl: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop&q=80",
    bgColor: "bg-gradient-to-br from-indigo-600 to-purple-700",
    tags: ["designers", "fashion-week", "innovation"],
  },
  {
    id: 4,
    category: "Accessories",
    time: "2 min read",
    title: "Statement Pieces: Accessories That Transform Your Look",
    description: "The power of the perfect accessory to elevate any outfit from ordinary to extraordinary.",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80",
    bgColor: "bg-gradient-to-br from-amber-500 to-orange-600",
    tags: ["accessories", "styling", "jewelry"],
  },
  {
    id: 5,
    category: "Fashion Tech",
    time: "6 min read",
    title: "Wearable Innovation: Where Technology Meets Style",
    description: "Exploring the cutting-edge intersection of fashion and technology, from smart fabrics to AI-driven design.",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80",
    bgColor: "bg-gradient-to-br from-cyan-600 to-blue-700",
    tags: ["tech", "innovation", "future"],
  },
  {
    id: 6,
    category: "Vintage Revival",
    time: "4 min read",
    title: "Timeless Elegance: Vintage Pieces Making a Comeback",
    description: "How classic vintage styles are being reimagined for the modern wardrobe.",
    imageUrl: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&auto=format&fit=crop&q=80",
    bgColor: "bg-gradient-to-br from-rose-600 to-pink-700",
    tags: ["vintage", "classic", "timeless"],
  },
];

const trendingCategories = [
  { name: "Runway Reviews", count: 24, color: "from-pink-500 to-rose-500", icon: "🌟" },
  { name: "Sustainable Fashion", count: 18, color: "from-green-500 to-emerald-500", icon: "🌱" },
  { name: "Street Style", count: 32, color: "from-purple-500 to-indigo-500", icon: "🔥" },
  { name: "Designer Spotlight", count: 15, color: "from-blue-500 to-cyan-500", icon: "✨" },
  { name: "Fashion Tech", count: 12, color: "from-orange-500 to-red-500", icon: "🚀" },
  { name: "Vintage Revival", count: 21, color: "from-yellow-500 to-amber-500", icon: "💎" },
];

function Blog() {
  const [hoveredPost, setHoveredPost] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const BlogCard = ({ post, index }: { post: BlogPost; index: number }) => (
    <div
      className={`group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 ${
        post.featured ? 'col-span-1 md:col-span-2 row-span-2' : 'col-span-1'
      }`}
      onMouseEnter={() => setHoveredPost(post.id)}
      onMouseLeave={() => setHoveredPost(null)}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Background Image with Enhanced Parallax Effect */}
      <div
        className={`absolute inset-0 ${post.bgColor} transition-all duration-700 group-hover:scale-110 group-hover:brightness-110`}
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${post.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Dynamic Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Floating Action Buttons */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-[-20px] group-hover:translate-y-0">
        <div className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 hover:scale-110 transition-all cursor-pointer border border-white/20">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 hover:scale-110 transition-all cursor-pointer border border-white/20">
          <Share2 className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Enhanced Content */}
      <div className={`relative z-10 p-6 h-full flex flex-col justify-end text-white ${post.featured ? 'p-8' : ''}`}>
        {/* Category Badge with Animation */}
        <div className="flex items-center gap-3 mb-4">
          <span className="px-4 py-2 bg-white/25 backdrop-blur-md rounded-full text-sm font-semibold border border-white/30 hover:bg-white/35 transition-all cursor-pointer">
            {post.category}
          </span>
          {post.time && (
            <span className="flex items-center gap-1 text-sm opacity-90 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
              <Clock className="w-4 h-4" />
              {post.time}
            </span>
          )}
        </div>

        {/* Enhanced Title */}
        <h2 className={`font-bold mb-4 leading-tight transition-all duration-300 ${
          post.featured ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'
        } ${hoveredPost === post.id ? 'transform translate-y-[-8px] text-shadow-lg' : ''}`}>
          {post.title}
        </h2>

        {/* Enhanced Description */}
        {post.description && (
          <p className={`text-gray-200 mb-6 leading-relaxed transition-all duration-500 ${
            post.featured ? 'text-lg' : 'text-sm'
          } ${hoveredPost === post.id ? 'opacity-100 transform translate-y-[-4px]' : 'opacity-85'}`}>
            {post.description}
          </p>
        )}

        {/* Enhanced Tags */}
        {post.tags && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag: string, idx: number) => (
              <span
                key={idx}
                className="text-xs px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full border border-white/25 hover:bg-white/25 hover:scale-105 transition-all cursor-pointer font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Enhanced Read More Button */}
        <div className={`flex items-center justify-between transition-all duration-300 ${
          hoveredPost === post.id ? 'transform translate-x-2' : ''
        }`}>
          <div className="flex items-center text-sm font-semibold">
            <span className="mr-2">Read Article</span>
            <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-2" />
          </div>
          <div className="flex items-center gap-1 text-xs opacity-75">
            <Star className="w-4 h-4 text-yellow-400" />
            <span>4.8</span>
          </div>
        </div>
      </div>

      {/* Enhanced Sparkles Animation */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
        hoveredPost === post.id ? 'opacity-100' : 'opacity-0'
      }`}>
        <Sparkles className="absolute top-1/4 left-1/4 w-5 h-5 text-white animate-pulse" />
        <Sparkles className="absolute top-3/4 right-1/4 w-4 h-4 text-yellow-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <Sparkles className="absolute top-1/2 right-1/3 w-3 h-3 text-pink-300 animate-pulse" style={{ animationDelay: '1s' }} />
        <Sparkles className="absolute bottom-1/3 left-1/2 w-2 h-2 text-cyan-300 animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-purple-50">
        {/* More Prominent Background Elements */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 left-10 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-rose-400 to-orange-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
        
        {/* Enhanced Header Content */}
        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="text-center">
            {/* More Vibrant Title */}
            <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 mb-8 animate-fade-in relative">
              TrendiZip
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
            </h1>
            <div className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-gray-700 to-purple-600 bg-clip-text text-transparent mb-8 animate-fade-in-delay">
              Where Fashion Meets Innovation ✨
            </div>
            
            {/* Enhanced Live Display */}
            <div className="flex items-center justify-center gap-6 text-gray-600 mb-12 flex-wrap">
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Live: {currentTime.toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <span className="font-medium">{blogPosts.length} Latest Articles</span>
              </div>
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                <TrendingUp className="w-5 h-5 text-pink-600" />
                <span className="font-medium">Trending Now</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Enhanced Blog Posts Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 auto-rows-fr">
              {blogPosts.map((post, index) => (
                <BlogCard key={post.id} post={post} index={index} />
              ))}
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Enhanced Trending Categories */}
            <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-3xl p-8 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <Tag className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent">Trending Now</h3>
              </div>
              
              <div className="space-y-4">
                {trendingCategories.map((category, index) => (
                  <div
                    key={index}
                    className="group flex items-center justify-between p-4 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-200 transform hover:scale-105"
                    onMouseEnter={() => setHoveredCategory(index)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-xl">{category.icon}</div>
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${category.color} transition-transform duration-300 ${hoveredCategory === index ? 'scale-125' : ''}`} />
                      <span className="text-gray-800 group-hover:text-purple-600 transition-colors font-semibold">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-bold">{category.count}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl text-white font-bold text-lg hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Explore All Categories
              </button>
            </div>

            {/* Enhanced Newsletter Signup */}
            <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 rounded-3xl p-8 border-2 border-purple-200 shadow-lg">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">💌</div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">Stay in Style</h3>
                <p className="text-gray-700 font-medium">Get the latest fashion insights delivered to your inbox every week.</p>
              </div>
              
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full px-6 py-4 bg-white border-2 border-purple-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all font-medium"
                />
                <button
                  className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white rounded-2xl font-bold text-lg hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Subscribe Now 🚀
                </button>
                <p className="text-xs text-gray-500 text-center">Join 50,000+ fashion enthusiasts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 1.2s ease-out;
        }
        a
        .animate-fade-in-delay {
          animation: fade-in 1.2s ease-out 0.6s both;
        }
        
        .text-shadow-lg {
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}

export default Blog;