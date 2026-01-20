'use client'
import React, { useState } from 'react';
import { Star, MapPin, Mail, Eye, Heart,  TrendingUp } from 'lucide-react';

// Enhanced dummy data for fashion professionals
const professionals = [
  {
    id: '1',
    name: 'Esha Mirza',
    profession: 'Fashion Researcher',
    experience: '8 years',
    rating: 4.9,
    reviews: 12,
    price: 15,
    portfolioUrl: '/portfolio/esha-mirza',
    contactEmail: 'esha@example.com',
    location: 'New York, NY',
    imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dGFpbG9yJTIwcHJvZmlsZSUyMHBpY3xlbnwwfHwwfHx8MA%3D%3D',
    businessImage: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2xvdGhpbmd8ZW58MHx8MHx8fDA%3D',
    specialty: 'Sustainable Fashion',
    color: 'from-emerald-400 to-teal-600',
    bgColor: 'bg-emerald-50'
  },
  {
    id: '2',
    name: 'Sara',
    profession: 'Instagram Influencer',
    experience: '5 years',
    rating: 4.9,
    reviews: 359,
    price: 5,
    portfolioUrl: '/portfolio/sara',
    contactEmail: 'sara@example.com',
    location: 'Los Angeles, CA',
    imageUrl: 'https://images.unsplash.com/photo-1505033575518-a36ea2ef75ae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D',
    businessImage: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8ZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D',
    specialty: 'Street Style',
    color: 'from-pink-400 to-rose-600',
    bgColor: 'bg-pink-50'
  },
  {
    id: '3',
    name: 'Digital Sonam',
    profession: 'Fashion Writer',
    experience: '10 years',
    rating: 5.0,
    reviews: 3,
    price: 50,
    portfolioUrl: '/portfolio/digital-sonam',
    contactEmail: 'sonam@example.com',
    location: 'Chicago, IL',
    imageUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D',
    businessImage: 'https://media.istockphoto.com/id/1830028076/photo/poster-contemporary-art-collage-women-and-men-dancing-dressed-retro-clothes-bright-comics.webp?a=1&b=1&s=612x612&w=0&k=20&c=G7KNItd4ZS4qj7ro5hRfnG7x7LaQiPVt-nIpAEh7a4s=',
    specialty: 'Editorial Fashion',
    color: 'from-purple-400 to-indigo-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: '4',
    name: 'Mark',
    profession: 'Content Marketer',
    experience: '4 years',
    rating: 4.0,
    reviews: 51,
    price: 5,
    portfolioUrl: '/portfolio/mark',
    contactEmail: 'mark@example.com',
    location: 'Miami, FL',
    imageUrl: 'https://images.unsplash.com/photo-1533636721434-0e2d61030955?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D',
    businessImage: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGZhc2hpb258ZW58MHx8MHx8fDA%3D',
    specialty: 'Brand Strategy',
    color: 'from-orange-400 to-red-600',
    bgColor: 'bg-orange-50'
  },
];

function Page() {
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const toggleLike = (id: string) => {
    const newLiked = new Set(likedCards);
    if (newLiked.has(id)) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
    }
    setLikedCards(newLiked);
  };

  // Get unique professions for filter categories
  const categories = ['All', ...Array.from(new Set(professionals.map(p => p.profession)))];
  
  // Filter professionals based on active filter
  const filteredProfessionals = activeFilter === 'All' 
    ? professionals 
    : professionals.filter(p => p.profession === activeFilter);

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
                : professionals.filter(p => p.profession === category).length;
              
              return (
                <button
                  key={category}
                  onClick={() => setActiveFilter(category)}
                  className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ?{
                    activeFilter === category
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  {category}
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ?{
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
     
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No professionals found</h3>
              <p className="text-gray-500">Try selecting a different category to explore more options.</p>
            </div>
          )}
        </div>

        {/* Professional Cards Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {filteredProfessionals.map((professional) => (
              <div
                key={professional.id}
                className={`group relative bg-white rounded-3xl overflow-hidden shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ?{professional.bgColor} border border-gray-100`}
              >
                {/* Background Image with Overlay */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={professional.businessImage}
                    alt={`?{professional.name}'s work`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ?{professional.color} opacity-60 group-hover:opacity-40 transition-opacity duration-300`}></div>
                  
                  {/* Floating Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => toggleLike(professional.id)}
                      className={`p-2 rounded-full backdrop-blur-sm border border-white/20 transition-all duration-300 ?{
                        likedCards.has(professional.id) 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ?{likedCards.has(professional.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button className="p-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-white hover:bg-white/30 transition-all duration-300">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Specialty Tag */}
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800">
                      {professional.specialty}
                    </span>
                  </div>
                </div>

                {/* Profile Image */}
                <div className="flex justify-center -mt-12 relative z-10">
                  <div className="relative">
                    <img
                      src={professional.imageUrl}
                      alt={professional.name}
                      className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-lg transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ?{professional.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 pt-4">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{professional.name}</h2>
                    <p className="text-gray-600 font-medium">{professional.profession}</p>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-gray-900">{professional.rating}</span>
                      <span className="text-sm text-gray-500">({professional.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <TrendingUp className="w-4 h-4" />
                      {professional.experience}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    {professional.location}
                  </div>

                  {/* Price and Contact */}
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900">
                      ?{professional.price}
                      <span className="text-sm font-normal text-gray-500">/hour</span>
                    </div>
                    <button className={`p-2 rounded-full bg-gradient-to-r ?{professional.color} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110`}>
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ?{professional.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none ?{hoveredCard === professional.id ? 'opacity-5' : ''}`}></div>
              </div>
            ))}
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
