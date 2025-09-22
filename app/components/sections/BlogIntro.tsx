'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Calendar, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

// TypeScript interfaces
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

const featuredPost: BlogPost = {
  id: 1,
  category: "Fashion",
  date: "Nov 08, 2023",
  readTime: "5 min read",
  title: "Discover the Latest Trends in Fall Fashion",
  description: "Explore the season's most captivating styles, from cozy textures to bold statement pieces that define autumn elegance.",
  imageUrl: "https://plus.unsplash.com/premium_photo-1683121263622-664434494177?q=80&w=1376&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  tags: ["trending", "fall-fashion", "style-guide"],
  featured: true
};

const sideCards: SideCard[] = [
  {
    id: 2,
    category: "STYLE TIPS",
    title: "Become a Style Insider",
    description: "Get exclusive tips and tricks from top fashion experts and transform your wardrobe with insider knowledge.",
    link: "/membership",
    bgColor: "from-purple-600 to-pink-600",
    icon: "tips"
  },
  {
    id: 3,
    category: "COLLECTION",
    imageUrl: "https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=400&fit=crop&q=60",
    title: "See all fashion picks",
    description: "Curated selections from our fashion editors featuring the season's must-have pieces.",
    link: "/picks",
    bgColor: "from-blue-600 to-cyan-600",
    icon: "collection"
  },
];

function BlogIntro() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on client-side only to prevent hydration mismatch
    setCurrentTime(new Date());

    const timer = setTimeout(() => setIsLoaded(true), 200);
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(clockTimer);
    };
  }, []);

  const BlogCard = ({ post, index }: { post: BlogPost; index: number }) => (
    <div
      className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl col-span-1 md:col-span-2`}
      onMouseEnter={() => setHoveredCard(post.id)}
      onMouseLeave={() => setHoveredCard(null)}
      style={{ animationDelay: `${index * 200}ms` }}
    >
      {/* Background Image with Parallax */}
      <div
        className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url(${post.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Dynamic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
      
      {/* Content */}
      <div className="relative z-10 p-8 h-80 md:h-96 flex flex-col justify-end text-white">
        {/* Top Meta */}
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium border border-white/30 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {post.date}
          </span>
          <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.readTime}
          </span>
          <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-xs font-medium">
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h2 className={`text-3xl md:text-4xl font-bold mb-4 leading-tight transition-all duration-300 ${
          hoveredCard === post.id ? 'transform translate-y-[-8px]' : ''
        }`}>
          {post.title}
        </h2>

        {/* Description */}
        <p className={`text-gray-200 mb-6 leading-relaxed transition-all duration-500 ${
          hoveredCard === post.id ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-2'
        }`}>
          {post.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag: string, idx: number) => (
            <span
              key={idx}
              className="text-xs px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer"
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className={`flex items-center text-sm font-medium transition-all duration-300 ${
          hoveredCard === post.id ? 'transform translate-x-2' : ''
        }`}>
          <span className="mr-2">Read Full Article</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" />
        </div>
      </div>

      {/* Sparkle Effects */}
      {hoveredCard === post.id && (
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute top-1/4 left-1/4 w-4 h-4 text-white animate-pulse" />
          <Sparkles className="absolute top-3/4 right-1/4 w-3 h-3 text-white animate-pulse" style={{ animationDelay: '0.5s' }} />
          <Sparkles className="absolute top-1/2 right-1/3 w-2 h-2 text-white animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      )}
    </div>
  );

  const SideCard = ({ card, index }: { card: SideCard; index: number }) => (
    <div
      className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-700 hover:scale-105 hover:shadow-xl ${
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      onMouseEnter={() => setHoveredCard(card.id)}
      onMouseLeave={() => setHoveredCard(null)}
      style={{ animationDelay: `${600 + index * 200}ms` }}
    >
      {card.imageUrl ? (
        <>
          {/* Image Card */}
          <div
            className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${card.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="relative z-10 p-6 h-64 flex flex-col justify-end text-white">
            <span className="text-xs font-medium text-gray-300 mb-2">{card.category}</span>
            <h4 className="text-xl font-bold mb-3">{card.title}</h4>
            <p className="text-gray-200 text-sm mb-4">{card.description}</p>
            <Link href={card.link} className="flex items-center text-sm font-medium hover:text-cyan-300 transition-colors">
              Explore Collection <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* Gradient Card */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.bgColor} opacity-90 group-hover:opacity-100 transition-opacity duration-500`} />
          <div className="relative z-10 p-6 h-64 flex flex-col justify-between text-white">
            <div>
              <span className="text-xs font-medium text-white/80 mb-3 block">{card.category}</span>
              <h4 className="text-xl font-bold mb-3 leading-tight">{card.title}</h4>
              <p className="text-white/90 text-sm leading-relaxed">{card.description}</p>
            </div>
            <Link href={card.link} className="flex items-center text-sm font-medium hover:text-white/80 transition-colors mt-4">
              Get Started <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </>
      )}
    </div>
  );

  return (
    <section className="w-full px-8 py-16 md:px-12 md:py-20 bg-white relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-100/30 to-pink-100/30 rounded-full animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-blue-100/30 to-cyan-100/30 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
      </div>

      {/* Header Section */}
      <div className={`relative z-10 mb-12 transition-all duration-1000 ${
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 bg-clip-text text-transparent">
              Best of the Week
            </h2>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live: {currentTime ? currentTime.toLocaleTimeString() : 'Loading...'}</span>
            </div>
          </div>
          
          <Link href="/blog" className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-300">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">View All Posts</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
        
        <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Featured Post */}
        <div className="col-span-1 md:col-span-3">
          <BlogCard post={featuredPost} index={0} />
        </div>

        {/* Side Cards */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
          {sideCards.map((card, index) => (
            <SideCard key={card.id} card={card} index={index} />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

export default BlogIntro;