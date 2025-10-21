'use client'
import React from 'react';
import { Eye, Sparkles } from 'lucide-react';

type TopSeller = {
  id: number;
  rank: number;
  name: string;
  profession: string;
  imageUrl: string;
  businessImage: string;
  color: string;
  bgColor: string;
  totalSales: number;
};

const topSellers: TopSeller[] = [
  {
    id: 1,
    rank: 1,
    name: 'Sarah Chen',
    profession: 'Fashion Designer',
    imageUrl: 'https://randomuser.me/api/portraits/women/32.jpg',
    businessImage: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2xvdGhpbmd8ZW58MHx8MHx8fDA%3D',
    color: 'from-emerald-400 to-teal-600',
    bgColor: 'bg-emerald-50',
    totalSales: 1247
  },
  {
    id: 2,
    rank: 2,
    name: 'Marcus Rodriguez',
    profession: 'Style Consultant',
    imageUrl: 'https://randomuser.me/api/portraits/men/45.jpg',
    businessImage: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8ZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D',
    color: 'from-pink-400 to-rose-600',
    bgColor: 'bg-pink-50',
    totalSales: 892
  },
  {
    id: 3,
    rank: 3,
    name: 'Emma Thompson',
    profession: 'Vintage Specialist',
    imageUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    businessImage: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1426&auto=format&fit=crop',
    color: 'from-purple-400 to-indigo-600',
    bgColor: 'bg-purple-50',
    totalSales: 756
  },
  {
    id: 4,
    rank: 4,
    name: 'David Kim',
    profession: 'Tailor & Couturier',
    imageUrl: 'https://randomuser.me/api/portraits/men/51.jpg',
    businessImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1374&auto=format&fit=crop',
    color: 'from-orange-400 to-red-600',
    bgColor: 'bg-orange-50',
    totalSales: 543
  }
];

function SellerCard({ seller, index }: { seller: TopSeller; index: number }) {
  return (
    <div
      className={`group relative bg-white rounded-3xl overflow-hidden shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${seller.bgColor} border border-gray-100`}
      style={{
        animationDelay: `${index * 0.1}s`,
        animation: 'fadeInUp 0.6s ease-out forwards'
      }}
    >
      {/* Background Image with Overlay */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={seller.businessImage}
          alt={`${seller.name}'s work`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${seller.color} opacity-60 group-hover:opacity-40 transition-opacity duration-300`}></div>

        {/* Rank Badge */}
        <div className="absolute top-4 left-4 z-20">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">#{seller.rank}</span>
          </div>
        </div>

        {/* Total Sales Badge */}
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
            {seller.totalSales.toLocaleString()} sales
          </div>
        </div>
      </div>

      {/* Profile Image */}
      <div className="flex justify-center -mt-12 relative z-10">
        <div className="relative">
          <img
            src={seller.imageUrl}
            alt={seller.name}
            className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-lg transition-transform duration-300 group-hover:scale-110"
          />
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${seller.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6 pt-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{seller.name}</h2>
          <p className="text-gray-600 font-medium">{seller.profession}</p>
        </div>

        {/* View Shop Button */}
        <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg">
          <Eye className="w-4 h-4" />
          View Shop
        </button>
      </div>
    </div>
  );
}

function TopSellers() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium mb-6 shadow-lg">
            <Sparkles className="w-4 h-4" />
            Top Sellers
          </div>
          <h2 className="text-6xl font-black bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 bg-clip-text text-transparent mb-4">
            Elite Fashion Sellers
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Discover our highest-performing sellers who consistently deliver exceptional fashion and outstanding customer experiences
          </p>
        </div>

        {/* Sellers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {topSellers.map((seller, index) => (
            <SellerCard key={seller.id} seller={seller} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Explore All Sellers
          </button>
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

export default TopSellers;
