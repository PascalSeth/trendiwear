'use client'
import React, { useState } from 'react';
import { TrendingUp, MessageCircle } from 'lucide-react';

type Profile = {
  id: number;
  name: string;
  profession: string;
  avatarUrl: string;
  badge: string;
  isActive: boolean;
  gradient: string;
};

const topProfiles: Profile[] = [
  {
    id: 1,
    name: 'Alex Rivera',
    profession: 'Fashion Designer',
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    badge: 'Trendsetter',
    isActive: true,
    gradient: 'from-purple-400 via-pink-500 to-red-500'
  },
  {
    id: 2,
    name: 'Maya Chen',
    profession: 'Style Curator',
    avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    badge: 'Influencer',
    isActive: true,
    gradient: 'from-blue-400 via-purple-500 to-pink-500'
  },
  {
    id: 3,
    name: 'Jordan Kim',
    profession: 'Fashion Photographer',
    avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
    badge: 'Creative',
    isActive: false,
    gradient: 'from-green-400 via-blue-500 to-purple-500'
  },
  {
    id: 4,
    name: 'Sam Torres',
    profession: 'Brand Stylist',
    avatarUrl: 'https://randomuser.me/api/portraits/men/51.jpg',
    badge: 'Rising Star',
    isActive: true,
    gradient: 'from-yellow-400 via-orange-500 to-red-500'
  },
];

function ModernProfiles() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#992800] to-orange-600 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-6">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-white/80 text-sm font-medium">Most Active This Week</span>
          </div>
          <h1 className="text-6xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
            Top Creatives
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Discover the most engaged and influential professionals in fashion and creative industries
          </p>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {topProfiles.map((profile, index) => (
            <div
              key={profile.id}
              className="group relative"
              onMouseEnter={() => setHoveredId(profile.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Rank Badge */}
              <div className="absolute -top-4 -left-4 z-20 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                <span className="text-white font-black text-lg">#{index + 1}</span>
              </div>

              {/* Main Card */}
              <div className={`
                relative overflow-hidden rounded-3xl transition-all duration-500 transform
                ${hoveredId === profile.id ? 'scale-105 -translate-y-2' : 'hover:scale-102'}
                bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl
              `}>
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${profile.gradient} opacity-20 transition-opacity duration-500 ${hoveredId === profile.id ? 'opacity-30' : ''}`} />
                
                {/* Active Status Indicator */}
                {profile.isActive && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="flex items-center gap-1 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-full px-2 py-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-300 text-xs font-medium">Online</span>
                    </div>
                  </div>
                )}

                <div className="relative p-8">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative">
                      <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${profile.gradient} p-1 shadow-2xl`}>
                        <img
                          src={profile.avatarUrl}
                          alt={profile.name}
                          className="w-full h-full rounded-full object-cover border-2 border-white/20"
                        />
                      </div>
                      {/* Badge */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-3 py-1">
                          <span className="text-white text-xs font-bold">{profile.badge}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-bold text-white mb-2">{profile.name}</h3>
                    <p className="text-purple-200 font-medium">{profile.profession}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button className={`
                      flex-1 py-3 rounded-xl font-bold transition-all duration-300 transform
                      bg-gradient-to-r ${profile.gradient} text-white shadow-lg
                      hover:shadow-2xl hover:scale-105 active:scale-95
                    `}>
                      View Profile
                    </button>
                    <button className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className={`
                  absolute inset-0 bg-gradient-to-br ${profile.gradient} opacity-0 transition-opacity duration-500
                  ${hoveredId === profile.id ? 'opacity-10' : ''}
                `} />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105">
            Discover More Creatives
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModernProfiles;