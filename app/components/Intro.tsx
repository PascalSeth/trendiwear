'use client'
import Link from 'next/link'
import React, { useState } from 'react'
import { Heart, ArrowRight, Sparkles, Star } from 'lucide-react'

const featuredItems = [
  {
    image: 'https://images.unsplash.com/photo-1624381805840-a88d1510240d?q=80&w=1538&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Outdoor Active',
    subtitle: 'Adventure ready',
  },
  {
    image: 'https://images.unsplash.com/photo-1600328784656-83c7bc673061?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2xvdGhpbmclMjBtb2RlbHxlbnwwfHwwfHx8MA%3D%3D',
    title: 'Casual Comfort',
    subtitle: 'Effortless elegance',
  },
];

const additionalInspirations = [
  {
    image: 'https://images.unsplash.com/photo-1642447411662-59ab77473a8d?q=80&w=1394&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Say it with style',
    tag: 'Trending',
  },
  {
    image: 'https://plus.unsplash.com/premium_photo-1682125676787-cb15544ae3c0?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Funky never gets old',
    tag: 'Retro',
  },
  {
    image: 'https://images.unsplash.com/photo-1617258856099-476dcceae20d?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Exotic Style',
    tag: 'Exclusive',
  },
];

function FashionInspo() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  return (
    <div className="min-h-screen bg-white py-8 px-3 sm:py-12 sm:px-4 md:py-16 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16 relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <Sparkles className="w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 text-purple-600" />
          </div>
          <div className="relative z-10">
            <span className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 mb-3 sm:mb-4">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Fashion Inspirations
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-slate-900 via-purple-900 to-pink-900 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight">
              Style Your Story
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl md:max-w-3xl mx-auto leading-relaxed px-2">
              Discover curated collections that speak to your aesthetic. From minimalist elegance to bold statements, find the inspiration that moves you.
            </p>
          </div>
        </div>

        {/* Main Feature Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12 md:mb-16">
          {/* Hero Card */}
          <div className="lg:col-span-2 group order-2 lg:order-1">
            <div 
              className="relative h-64 sm:h-80 md:h-96 rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-0.5 sm:p-1 transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
              onMouseEnter={() => setHoveredCard('hero')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="h-full bg-gradient-to-br from-slate-900/90 to-purple-900/90 rounded-2xl sm:rounded-3xl flex flex-col justify-center items-center text-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                  <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent bg-[radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.1)_0%,_transparent_50%)]"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-3 sm:mb-4">
                    Curated Collections
                  </h3>
                  <p className="text-purple-100 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-sm md:max-w-md mx-auto leading-relaxed">
                    Explore handpicked ensembles and discover endless possibilities to express your unique style across every occasion.
                  </p>
                  
                  <Link 
                    href="/fashion-trends" 
                    className="inline-flex items-center px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-white text-slate-900 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-500 hover:text-white hover:shadow-lg transform hover:scale-105"
                  >
                    Explore Collections
                    <ArrowRight className={`w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform duration-300 ${hoveredCard === 'hero' ? 'translate-x-1' : ''}`} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Items */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6 order-1 lg:order-2">
            {featuredItems.map((item, index) => (
              <div 
                key={index} 
                className="group relative h-32 sm:h-36 md:h-44 rounded-xl sm:rounded-2xl overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-xl"
                onMouseEnter={() => setHoveredCard(`featured-${index}`)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src={item.image}
                  alt={item.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                <button
                  onClick={() => toggleFavorite(`featured-${index}`)}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/30 hover:scale-110"
                >
                  <Heart 
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300 ${
                      favorites.has(`featured-${index}`) 
                        ? 'text-pink-500 fill-pink-500' 
                        : 'text-white hover:text-pink-300'
                    }`} 
                  />
                </button>

                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-gray-200 text-xs sm:text-sm">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Inspirations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {additionalInspirations.map((item, index) => (
            <div 
              key={index} 
              className="group relative rounded-2xl sm:rounded-3xl overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
              onMouseEnter={() => setHoveredCard(`inspiration-${index}`)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="aspect-[4/5] relative">
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src={item.image}
                  alt={item.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                
                {/* Tag */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                  <span className="px-2 py-1 sm:px-3 sm:py-1 bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold rounded-full">
                    {item.tag}
                  </span>
                </div>

                {/* Heart Button */}
                <button
                  onClick={() => toggleFavorite(`inspiration-${index}`)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/30 hover:scale-110"
                >
                  <Heart 
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${
                      favorites.has(`inspiration-${index}`) 
                        ? 'text-pink-500 fill-pink-500 scale-110' 
                        : 'text-white hover:text-pink-300'
                    }`} 
                  />
                </button>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white mb-2 transform transition-transform duration-300 group-hover:translate-y-[-4px] leading-tight">
                    {item.title}
                  </h3>
                  <div className={`transform transition-all duration-500 ${hoveredCard === `inspiration-${index}` ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                    <p className="text-gray-200 text-xs sm:text-sm mb-2 sm:mb-3">Discover this aesthetic</p>
                    <div className="w-8 sm:w-10 md:w-12 h-0.5 sm:h-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-8 sm:mt-12 md:mt-16">
          <div className="inline-flex items-center px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold text-sm sm:text-base transition-all duration-300 hover:shadow-lg hover:scale-105">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            View All Inspirations
          </div>
        </div>
      </div>
    </div>
  );
}

export default FashionInspo;