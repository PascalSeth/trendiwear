'use client'
import React, { useState } from 'react';
import { Star, TrendingUp, Award, ShoppingBag, Eye, Heart } from 'lucide-react';

type TopSeller = {
  id: number;
  name: string;
  avatarUrl: string;
  topProduct: {
    name: string;
    imageUrl: string;
    price: number;
  };
  totalSales: number;
  rating: number;
  followers: number;
  badge: string;
  isVerified: boolean;
};

const topSellers: TopSeller[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    avatarUrl: 'https://randomuser.me/api/portraits/women/32.jpg',
    topProduct: {
      name: 'Designer Silk Blouse',
      imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1374&auto=format&fit=crop',
      price: 189.99
    },
    totalSales: 1247,
    rating: 4.9,
    followers: 15420,
    badge: 'Top Seller',
    isVerified: true
  },
  {
    id: 2,
    name: 'Marcus Rodriguez',
    avatarUrl: 'https://randomuser.me/api/portraits/men/45.jpg',
    topProduct: {
      name: 'Premium Leather Jacket',
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1350&auto=format&fit=crop',
      price: 299.99
    },
    totalSales: 892,
    rating: 4.8,
    followers: 12890,
    badge: 'Rising Star',
    isVerified: true
  },
  {
    id: 3,
    name: 'Emma Thompson',
    avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    topProduct: {
      name: 'Vintage Denim Collection',
      imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1426&auto=format&fit=crop',
      price: 159.99
    },
    totalSales: 756,
    rating: 4.7,
    followers: 9876,
    badge: 'Verified Pro',
    isVerified: true
  },
  {
    id: 4,
    name: 'David Kim',
    avatarUrl: 'https://randomuser.me/api/portraits/men/51.jpg',
    topProduct: {
      name: 'Custom Tailored Suit',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1374&auto=format&fit=crop',
      price: 599.99
    },
    totalSales: 543,
    rating: 4.9,
    followers: 7654,
    badge: 'Elite Seller',
    isVerified: true
  }
];

function SellerCard({ seller, index }: { seller: TopSeller; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Seller Header */}
      <div className="relative p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={seller.avatarUrl}
              alt={seller.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
            />
            {seller.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Award className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-slate-900">{seller.name}</h3>
              <span className="px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-semibold rounded-full">
                {seller.badge}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="font-medium">{seller.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-500" />
                <span>{seller.followers.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Product */}
      <div className="relative overflow-hidden">
        <img
          src={seller.topProduct.imageUrl}
          alt={seller.topProduct.name}
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Overlay with product info */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h4 className="text-white font-semibold text-sm mb-1 line-clamp-2">
              {seller.topProduct.name}
            </h4>
            <p className="text-white/90 font-bold text-lg">
              ${seller.topProduct.price}
            </p>
          </div>
        </div>

        {/* Sales Badge */}
        <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {seller.totalSales} sold
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 pt-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-slate-900">{seller.totalSales}</div>
            <div className="text-xs text-slate-600">Total Sales</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{seller.rating}</div>
            <div className="text-xs text-slate-600">Rating</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{(seller.followers / 1000).toFixed(0)}K</div>
            <div className="text-xs text-slate-600">Followers</div>
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          View Shop
        </button>
      </div>
    </div>
  );
}

function TopSellers() {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-full px-4 py-2 mb-4">
            <Award className="w-4 h-4 text-purple-600" />
            <span className="text-slate-700 text-sm font-medium">Elite Performers</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Top Sellers
          </h2>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Meet our highest-performing sellers who consistently deliver exceptional fashion and outstanding customer experiences
          </p>
        </div>

        {/* Sellers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topSellers.map((seller, index) => (
            <SellerCard key={seller.id} seller={seller} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Explore All Sellers
          </button>
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

export default TopSellers;