'use client'
import React, { useState, useEffect } from 'react';
import { Star, MapPin, Mail, Eye, Heart, Sparkles, TrendingUp } from 'lucide-react';

interface Professional {
  id: string;
  businessName: string;
  businessImage?: string;
  experience: number;
  bio?: string;
  location?: string;
  rating?: number;
  totalReviews?: number;
  user: {
    firstName: string;
    lastName: string;
    profileImage?: string;
    email: string;
    _count: {
      products: number;
      professionalServices: number;
    };
  };
  specialization?: {
    name: string;
  };
}

function Page() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const response = await fetch('/api/professional-profiles?public=true');
        if (response.ok) {
          const data = await response.json();
          setProfessionals(data);
        }
      } catch (error) {
        console.error('Failed to fetch professionals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, []);

  const toggleLike = (id: string) => {
    const newLiked = new Set(likedCards);
    if (newLiked.has(id)) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
    }
    setLikedCards(newLiked);
  };

  // Get unique specializations for filter categories
  const categories = ['All', ...Array.from(new Set(professionals.map(p => p.specialization?.name || 'General').filter(Boolean)))];

  // Filter professionals based on active filter
  const filteredProfessionals = activeFilter === 'All'
    ? professionals
    : professionals.filter(p => p.specialization?.name === activeFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-pink-200 to-purple-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-full opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium mb-6 shadow-lg">
            <Sparkles className="w-4 h-4" />
            Fashion Professionals
          </div>
          <h1 className="text-6xl font-black bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 bg-clip-text text-transparent mb-4">
            Meet Our Creative Minds
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Discover talented fashion professionals who bring creativity, expertise, and passion to every project
          </p>

          {/* Filter Categories */}
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {categories.map((category) => {
              const count = category === 'All'
                ? professionals.length
                : professionals.filter(p => p.specialization?.name === category).length;

              return (
                <button
                  key={category}
                  onClick={() => setActiveFilter(category)}
                  className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                    activeFilter === category
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  {category}
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    activeFilter === category
                      ? 'bg-white/20'
                      : 'bg-gray-100'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* No Results Message */}
          {filteredProfessionals.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No professionals found</h3>
              <p className="text-gray-500">Try selecting a different category to explore more options.</p>
            </div>
          )}
        </div>

        {/* Professional Cards Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {filteredProfessionals.map((professional, index) => {
              // Generate colors based on index for variety
              const colors = [
                { color: 'from-emerald-400 to-teal-600', bgColor: 'bg-emerald-50' },
                { color: 'from-pink-400 to-rose-600', bgColor: 'bg-pink-50' },
                { color: 'from-purple-400 to-indigo-600', bgColor: 'bg-purple-50' },
                { color: 'from-orange-400 to-red-600', bgColor: 'bg-orange-50' },
                { color: 'from-blue-400 to-cyan-600', bgColor: 'bg-blue-50' },
                { color: 'from-yellow-400 to-orange-600', bgColor: 'bg-yellow-50' },
              ];
              const colorScheme = colors[index % colors.length];

              return (
                <div
                  key={professional.id}
                  className={`group relative bg-white rounded-3xl overflow-hidden shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${colorScheme.bgColor} border border-gray-100`}
                  onMouseEnter={() => setHoveredCard(professional.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  {/* Background Image with Overlay */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={professional.businessImage || '/placeholder-business.jpg'}
                      alt={`${professional.businessName}'s work`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${colorScheme.color} opacity-60 group-hover:opacity-40 transition-opacity duration-300`}></div>

                    {/* Floating Action Buttons */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={() => toggleLike(professional.id)}
                        className={`p-2 rounded-full backdrop-blur-sm border border-white/20 transition-all duration-300 ${
                          likedCards.has(professional.id)
                            ? 'bg-red-500 text-white'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${likedCards.has(professional.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button className="p-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-white hover:bg-white/30 transition-all duration-300">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Specialty Tag */}
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800">
                        {professional.specialization?.name || 'Fashion Professional'}
                      </span>
                    </div>
                  </div>

                  {/* Profile Image */}
                  <div className="flex justify-center -mt-12 relative z-10">
                    <div className="relative">
                      <img
                        src={professional.user.profileImage || '/placeholder-avatar.jpg'}
                        alt={professional.businessName}
                        className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-lg transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${colorScheme.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 pb-6 pt-4">
                    <div className="text-center mb-4">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{professional.businessName}</h2>
                      <p className="text-gray-600 font-medium">{professional.specialization?.name || 'Fashion Professional'}</p>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-900">{professional.rating?.toFixed(1) || '4.5'}</span>
                        <span className="text-sm text-gray-500">({professional.totalReviews || 0})</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4" />
                        {professional.experience} years
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <MapPin className="w-4 h-4" />
                      {professional.location || 'Location not specified'}
                    </div>

                    {/* Stats and Contact */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {professional.user._count.products} products • {professional.user._count.professionalServices} services
                      </div>
                      <button className={`p-2 rounded-full bg-gradient-to-r ${colorScheme.color} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110`}>
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${colorScheme.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none ${hoveredCard === professional.id ? 'opacity-5' : ''}`}></div>
                </div>
              );
            })}
          </div>
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
    </div>
  );
}

export default Page;