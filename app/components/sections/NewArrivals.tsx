'use client'
import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Star, Eye, Sparkles } from 'lucide-react';

type ClothingItem = {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  isNew: boolean;
  sellerName: string;
  sellerProfilePicUrl: string;
  category: string;
  rating?: number;
  views?: number;
  likes?: number;
};

const newArrivals: ClothingItem[] = [
  {
    id: 1,
    name: 'Long Sleeve Sweater, Cream and Black Stripe',
    imageUrl: 'https://images.unsplash.com/photo-1510347026072-2c042ed96d42?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    price: 72.00,
    isNew: true,
    sellerName: 'Sophia Turner',
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    category: 'Sweater',
    rating: 4.8,
    views: 1200,
    likes: 89
  },
  {
    id: 2,
    name: 'Tatum Turtleneck, Olive',
    imageUrl: 'https://images.unsplash.com/photo-1522751707891-45b4e281010d?q=80&w=1528&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    price: 54.00,
    isNew: true,
    sellerName: 'Emma Brown',
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/45.jpg',
    category: 'Turtleneck',
    rating: 4.6,
    views: 950,
    likes: 67
  },
  {
    id: 3,
    name: 'Sabrina Ribbed Pullover, Dusty Rose',
    imageUrl: 'https://images.unsplash.com/photo-1647688574769-c2e78f477719?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    price: 54.00,
    isNew: true,
    sellerName: 'Olivia White',
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/46.jpg',
    category: 'Pullover',
    rating: 4.7,
    views: 1100,
    likes: 78
  },
  {
    id: 4,
    name: 'Sabrina Ribbed Turtleneck, White',
    imageUrl: 'https://media.istockphoto.com/id/1186159221/photo/handsome-man-posing-in-knitted-sweater-isolated-on-grey.webp?s=1024x1024&w=is&k=20&c=sm27ONxDvDngmt0OQnPToEgkCvpT1OjCVVWHv2KIq0g=',
    price: 54.00,
    isNew: true,
    sellerName: 'Amelia Johnson',
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/47.jpg',
    category: 'Turtleneck',
    rating: 4.9,
    views: 870,
    likes: 92
  },
];

function ProductCard({ item, index }: { item: ClothingItem; index: number }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showOverlayContent = isMobile || isHovered;

  return (
    <div
      className={`group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02] animate-fade-in-up`}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
          {item.isNew && (
            <span className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3" />
              NEW
            </span>
          )}
        </div>

        {/* Category Badge */}
        <span className="absolute top-3 right-3 z-20 bg-slate-800/80 backdrop-blur-sm text-white px-2 py-1 text-xs rounded-full font-medium">
          {item.category}
        </span>

        {/* Action Buttons - Desktop: centered with eye, Mobile: top-right vertical */}
        {isMobile ? (
          // Mobile/Tablet: Vertical buttons in middle right
          <div className={`absolute top-1/2 right-3 transform -translate-y-1/2 z-20 flex flex-col gap-2 transition-all duration-300 ${showOverlayContent ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:scale-110 transition-all duration-200 ${isLiked ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-700 hover:bg-white'}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-all duration-200">
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        ) : (
          // Desktop: Horizontal centered buttons with eye
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex gap-3 transition-all duration-300 ${showOverlayContent ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <button className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200">
              <Eye className="w-5 h-5 text-slate-700" />
            </button>
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`backdrop-blur-sm p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-200 ${isLiked ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-700 hover:bg-white'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-200">
              <ShoppingBag className="w-5 h-5" />
            </button>
          </div>
        )}

        <img
          src={item.imageUrl}
          alt={item.name}
          className={`w-full h-64 lg:h-72 object-cover transition-transform duration-500 ${isHovered && !isMobile ? 'scale-105' : 'scale-100'}`}
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-opacity duration-300 ${showOverlayContent ? 'opacity-100' : 'opacity-0'}`} />

        {/* Seller Info - Always visible on mobile/tablet, hover on desktop */}
        <div className={`absolute bottom-3 left-3 right-3 transition-all duration-300 ${showOverlayContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
            <img
              src={item.sellerProfilePicUrl}
              alt={item.sellerName}
              className="w-8 h-8 rounded-full border-2 border-white shadow-md mr-3"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 text-sm font-semibold truncate">{item.sellerName}</p>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-xs text-slate-600">{item.rating}</span>
                <span className="text-xs text-slate-400 ml-1">{item.views} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
          {item.name}
        </h3>

        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-900">${item.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600">
            <Heart className="w-4 h-4" />
            <span className="text-sm">{item.likes}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{item.views}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span>{item.rating}</span>
          </div>
        </div>
      </div>

      {/* Hover Effect Ring */}
      <div className={`absolute inset-0 rounded-2xl border-2 border-blue-500/30 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100`}></div>
    </div>
  );
}

function NewArrivals() {
  return (
    <div className="bg-white py-16 px-4 lg:px-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-r from-pink-400/10 to-purple-500/10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full bg-gradient-to-r from-blue-400/10 to-cyan-500/10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-20 h-20 rounded-full bg-gradient-to-r from-emerald-400/10 to-teal-500/10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 animate-fade-in-up">
            New Arrivals
          </h2>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newArrivals.map((item, index) => (
            <ProductCard key={item.id} item={item} index={index} />
          ))}
        </div>

        {/* Bottom Section */}
        <div className="text-center mt-12">
          <div className="flex items-center justify-center gap-6 text-sm text-slate-600 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900 mb-1">24+</div>
              <div>New Items</div>
            </div>
            <div className="w-px h-10 bg-slate-300"></div>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900 mb-1">5★</div>
              <div>Top Rated</div>
            </div>
            <div className="w-px h-10 bg-slate-300"></div>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900 mb-1">100%</div>
              <div>Authentic</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default NewArrivals;