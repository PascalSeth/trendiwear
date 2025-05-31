'use client'
import React, { useState } from 'react';
import { Heart, Share2, ShoppingBag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Trend {
  name: string;
  description: string;
  image: string;
  color: string;
}

const trends: Trend[] = [
  { name: 'Vintage Casual', description: 'Retro tees, high-waisted jeans, and vintage sneakers.', image: 'https://images.unsplash.com/photo-1673417785716-1fa1f932066d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2FzdWFsfGVufDB8fDB8fHww', color: 'from-amber-400 to-orange-500' },
  { name: 'Athleisure', description: 'Stylish joggers, crop tops, and sporty accessories.', image: 'https://images.unsplash.com/photo-1470468969717-61d5d54fd036?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YXRobGVpc3VyZXxlbnwwfHwwfHx8MA%3D%3D', color: 'from-green-400 to-blue-500' },
  { name: 'Bohemian', description: 'Flowy fabrics, earthy tones, maxi dresses, and layered jewelry.', image: 'https://images.unsplash.com/photo-1496440737103-cd596325d314?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGJvaGVtaWFuJTIwZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D', color: 'from-purple-400 to-pink-500' },
  { name: 'Minimalist', description: 'Clean lines, neutral colors, tailored trousers, and basic tees.', image: 'https://images.unsplash.com/photo-1725958019641-4c03ceb5d2db?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fE1pbmltYWxpc3QlMjBmYXNoaW9ufGVufDB8fDB8fHww', color: 'from-gray-400 to-gray-600' },
  { name: 'Streetwear', description: 'Graphic tees, hoodies, baggy pants, and statement sneakers.', image: 'https://images.unsplash.com/photo-1520014321782-49b0fe958b59?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8c3RyZWV0d2VhciUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D', color: 'from-red-400 to-pink-500' },
  { name: 'Grunge', description: 'Distressed jeans, flannel shirts, and combat boots.', image: 'https://images.unsplash.com/photo-1576193929684-06c6c6a8b582?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z3J1bmdlJTIwZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D', color: 'from-slate-500 to-slate-700' },
  { name: 'Preppy', description: 'Polo shirts, khakis, blazers, and loafers with vibrant colors.', image: 'https://images.unsplash.com/photo-1619042821874-587aa4335f39?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cHJlcHB5JTIwZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D', color: 'from-blue-400 to-indigo-500' },
  { name: 'Romantic', description: 'Soft fabrics, lace, puffed sleeves, and pastel colors.', image: 'https://images.unsplash.com/photo-1683717810905-7a56f467e3cf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHJvbWFudGljJTIwZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D', color: 'from-pink-300 to-rose-400' },
  { name: 'Gothic', description: 'Black clothing, leather jackets, heavy boots, and dramatic makeup.', image: 'https://images.unsplash.com/photo-1585328588821-b60f13dda129?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGdvdGhpYyUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D', color: 'from-black to-gray-800' },
  { name: 'Punk', description: 'Ripped jeans, graphic tees, leather jackets, and bold hairstyles.', image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cHVuayUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D', color: 'from-red-500 to-red-700' },
  { name: 'Utility', description: 'Functional clothing like cargo pants, work jackets, and practical footwear.', image: 'https://images.unsplash.com/photo-1587797283885-9a123e3e88a0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8dXRpbGl0eSUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D', color: 'from-green-500 to-green-700' },
  { name: 'Western', description: 'Cowboy boots, denim jackets, and plaid shirts with fringe details.', image: 'https://images.unsplash.com/photo-1726516336217-f968f5be76cd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8d2VzdGVybiUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D', color: 'from-yellow-600 to-orange-600' },
  { name: 'Sporty Chic', description: 'Blending sporty pieces with casual wear, like tennis skirts and sleek sneakers.', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8U3BvcnR5JTIwQ2hpYyUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D', color: 'from-teal-400 to-cyan-500' },
  { name: 'Artisanal', description: 'Unique, handcrafted pieces, often featuring bold prints and textures.', image: 'https://images.unsplash.com/photo-1602591620189-de34d60650b2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGFydGlzYW5hbCUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D', color: 'from-indigo-400 to-purple-600' },
  { name: 'Eco-Conscious', description: 'Sustainable materials, upcycled fashion, and earth-toned colors.', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', color: 'from-emerald-400 to-green-600' },
  { name: 'Maximalism', description: 'Bold prints, bright colors, and layered textures for a vibrant look.', image: 'https://i.pinimg.com/enabled_hi/564x/6d/58/da/6d58dab3b515128c2d2a9bd095a4364f.jpg', color: 'from-fuchsia-400 to-violet-600' },
  { name: 'Nautical', description: 'Striped tops, sailor pants, and accessories in navy and white colors.', image: 'https://images.unsplash.com/photo-1707237463274-04b6ecfedf45?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2FpbG9yJTIwZHJlc3N8ZW58MHx8MHx8fDA%3D', color: 'from-blue-500 to-navy-700' },
  { name: 'Color Blocking', description: 'Bold, contrasting colors paired together in outfits for a striking look.', image: 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y29sb3IlMjBibG9ja2luZyUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D', color: 'from-rainbow' },
  { name: 'Edgy', description: 'Leather skirts, ripped tights, and studded accessories for a rebellious vibe.', image: 'https://images.unsplash.com/photo-1726516325355-1fede74140c5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGVkZ3klMjBmYXNoaW9ufGVufDB8fDB8fHww', color: 'from-gray-800 to-black' },
  { name: 'Resort Wear', description: 'Lightweight fabrics, tropical prints, and flowing silhouettes for vacation-ready outfits.', image: 'https://i.pinimg.com/564x/91/cb/ea/91cbea3ddbb294f08998d75f398d6ee1.jpg', color: 'from-turquoise-400 to-blue-500' },
];

function ModernFashionTrends() {
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openTrendDetails = (trend: Trend) => {
    setSelectedTrend(trend);
    setIsDialogOpen(true);
  };

  const closeTrendDetails = () => {
    setIsDialogOpen(false);
    setSelectedTrend(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Fashion
              </span>{' '}
              <span className="text-white">Trends</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Discover the latest styles that define modern fashion. From street style to haute couture, 
              explore collections that inspire your unique aesthetic.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Trends Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {trends.map((trend, index) => (
            <Dialog key={index} open={isDialogOpen && selectedTrend?.name === trend.name} onOpenChange={(open) => {
              if (!open) {
                closeTrendDetails();
              }
            }}>
              <DialogTrigger asChild>
                <div
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer"
                  onClick={() => openTrendDetails(trend)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Image Container */}
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={trend.image}
                      alt={trend.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${trend.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                    
                    {/* Hover Actions */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors duration-200">
                        <Heart className="w-4 h-4 text-gray-700 hover:text-red-500" />
                      </button>
                      <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors duration-200">
                        <Share2 className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                        TRENDING
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors duration-200">
                      {trend.name}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {trend.description}
                    </p>
                    
                    {/* CTA Button */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-600">
                        Explore Style
                      </span>
                      <div className="flex items-center gap-2 text-gray-400 group-hover:text-purple-600 transition-colors duration-200">
                        <ShoppingBag className="w-4 h-4" />
                        <span className="text-xs">Shop Now</span>
                      </div>
                    </div>
                  </div>

                  {/* Shine Effect */}
                  {hoveredIndex === index && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse"></div>
                  )}
                </div>
              </DialogTrigger>

              {selectedTrend && selectedTrend.name === trend.name && (
                <DialogContent className="max-w-4xl w-full justify-center p-0 z-[9999] overflow-hidden">
                  <div className="grid md:grid-cols-2">
                    {/* Image Section */}
                    <div className="relative h-96 md:h-[500px]">
                      <img
                        src={selectedTrend.image}
                        alt={selectedTrend.name}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${selectedTrend.color} opacity-10`}></div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <DialogHeader className="mb-6">
                        <div className="mb-4">
                          <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full">
                            FASHION CATEGORY
                          </span>
                        </div>
                        <DialogTitle className="text-4xl font-bold text-gray-900 mb-4">
                          {selectedTrend.name}
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 text-lg leading-relaxed">
                          {selectedTrend.description}
                        </DialogDescription>
                      </DialogHeader>

                      {/* Action Buttons */}
                      <div className="flex gap-4 mb-8">
                        <button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105">
                          Shop This Style
                        </button>
                        <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-purple-500 hover:text-purple-600 transition-colors duration-200">
                          Save to Wishlist
                        </button>
                      </div>

                      {/* Social Sharing */}
                      <div className="pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-500 mb-3">Share this style:</p>
                        <div className="flex gap-3">
                          <button className="p-2 bg-gray-100 rounded-lg hover:bg-purple-100 transition-colors duration-200">
                            <Share2 className="w-5 h-5 text-gray-600" />
                          </button>
                          <button className="p-2 bg-gray-100 rounded-lg hover:bg-red-100 transition-colors duration-200">
                            <Heart className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              )}
            </Dialog>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ModernFashionTrends;