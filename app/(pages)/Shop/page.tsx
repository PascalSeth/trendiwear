'use client';
import React, { useState } from 'react';
import { Heart, ShoppingBag, Star, Eye, Zap, Sparkles, TrendingUp, ArrowRight, Crown, Gem } from 'lucide-react';

interface Category {
  name: string;
  imageUrl: string;
  gradient: string;
  items: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  category: string;
  sellerName: string;
  isNew: boolean;
  sellerProfilePicUrl: string;
  rating: number;
  views: number;
  likes: number;
  trending?: boolean;
}

const categories: Category[] = [
  { 
    name: 'Men', 
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    gradient: 'from-slate-800 via-blue-800 to-indigo-900',
    items: '2.4k+'
  },
  { 
    name: 'Women', 
    imageUrl: 'https://images.unsplash.com/photo-1494790108755-2616c9c97ddc?w=400&h=400&fit=crop&crop=face',
    gradient: 'from-rose-500 via-pink-600 to-purple-700',
    items: '3.2k+'
  },
  { 
    name: 'Accessories', 
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    gradient: 'from-amber-500 via-orange-600 to-red-600',
    items: '1.8k+'
  },
  { 
    name: 'Shoes', 
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
    gradient: 'from-emerald-600 via-teal-700 to-cyan-800',
    items: '1.5k+'
  },
  { 
    name: 'Bags', 
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    gradient: 'from-violet-600 via-purple-700 to-fuchsia-800',
    items: '950+'
  },
 
];

const featuredProducts: Product[] = [
  { 
    id: 1, 
    name: 'Vintage Leather Jacket', 
    price: 199.99, 
    originalPrice: 299.99,
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop', 
    category: 'Accessories', 
    sellerName: 'Sophia Turner', 
    isNew: true, 
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 4.8,
    views: 1200,
    likes: 89
  },
  { 
    id: 2, 
    name: 'Urban Denim Collection', 
    price: 119.99, 
    originalPrice: 159.99,
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&h=600&fit=crop', 
    category: 'Men', 
    sellerName: 'Marcus Steel', 
    isNew: false, 
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/men/45.jpg',
    rating: 4.6,
    views: 2100,
    likes: 156
  }, 
  { 
    id: 3, 
    name: 'Designer Sneakers', 
    price: 89.99, 
    originalPrice: 120.00,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=600&fit=crop', 
    category: 'Shoes', 
    sellerName: 'Alex Rivera', 
    isNew: false, 
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: 4.9,
    views: 980,
    likes: 67
  },
  { 
    id: 4, 
    name: 'Chic Fedora Hat', 
    price: 49.99, 
    originalPrice: 69.99,
    imageUrl: 'https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=500&h=600&fit=crop', 
    category: 'Women', 
    sellerName: 'Isabella Rose', 
    isNew: true, 
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/28.jpg',
    rating: 4.7,
    views: 750,
    likes: 45
  },
];

const trendingProducts: Product[] = [
  { 
    id: 5, 
    name: 'Retro High-Tops', 
    price: 129.99, 
    originalPrice: 180.00,
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=600&fit=crop', 
    category: 'Shoes', 
    sellerName: 'Olivia White', 
    isNew: true, 
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/46.jpg',
    rating: 4.8,
    views: 1800,
    likes: 134,
    trending: true
  },
  { 
    id: 6, 
    name: 'Gold Chain Necklace', 
    price: 79.99, 
    originalPrice: 110.00,
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=600&fit=crop', 
    category: 'Accessories', 
    sellerName: 'Amelia Johnson', 
    isNew: false, 
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/47.jpg',
    rating: 4.5,
    views: 1200,
    likes: 92,
    trending: true
  },
];

function ProductCard({ product, index }: { product: Product; index: number }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <div 
      className={`group relative bg-white rounded-3xl overflow-hidden shadow-xl transform transition-all duration-700 hover:scale-105 hover:shadow-2xl animate-fade-in-up`}
      style={{ animationDelay: `${index * 150}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        {/* Badges */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {product.isNew && (
            <span className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3" />
              NEW
            </span>
          )}
          {product.trending && (
            <span className="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              TRENDING
            </span>
          )}
          {discount > 0 && (
            <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 text-xs font-bold rounded-full">
              -{discount}%
            </span>
          )}
        </div>

        {/* Category Badge */}
        <span className="absolute top-4 right-4 z-20 bg-black/70 backdrop-blur-sm text-white px-3 py-1 text-xs rounded-full">
          {product.category}
        </span>

        {/* Action Buttons */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex gap-3 transition-all duration-300 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <button className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200">
            <Eye className="w-5 h-5 text-gray-700" />
          </button>
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className={`backdrop-blur-sm p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-200 ${isLiked ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-200">
            <ShoppingBag className="w-5 h-5" />
          </button>
        </div>

        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className={`w-full h-72 object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Seller Info */}
        <div className={`absolute bottom-4 left-4 right-4 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-2xl p-3">
            <img 
              src={product.sellerProfilePicUrl} 
              alt={product.sellerName} 
              className="w-10 h-10 rounded-full border-2 border-white shadow-lg mr-3"
              loading="lazy"
            />
            <div className="flex-1">
              <p className="text-gray-900 text-sm font-semibold">{product.sellerName}</p>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-xs text-gray-600">{product.rating}</span>
                <span className="text-xs text-gray-400 ml-2">{product.views} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900">${product.price}</span>
            {product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Heart className="w-4 h-4" />
            <span className="text-sm">{product.likes}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{product.views}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span>{product.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductSection({ title, products, icon }: { title: string; products: Product[]; icon?: React.ReactNode }) {
  return (
    <section className="mb-20">
      <div className="flex items-center gap-3 mb-8">
        {icon}
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </section>
  );
}

const Page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Hero Section */}
      <div className="relative h-screen overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.3)_1px,transparent_0)] bg-[size:40px_40px]"></div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-r from-pink-400/20 to-purple-500/20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-500/20 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-40 left-1/4 w-20 h-20 rounded-full bg-gradient-to-r from-emerald-400/20 to-teal-500/20 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 right-1/3 w-28 h-28 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-500/20 animate-pulse" style={{ animationDelay: '3s' }}></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex items-center justify-center h-full text-center px-4">
          <div className="max-w-6xl animate-fade-in-up">
            {/* Fashion Brand Logo/Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 p-1 animate-spin-slow">
                  <div className="w-full h-full rounded-full bg-transparant flex items-center justify-center">
                    <img src='/navlogo.png' alt=''/>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center animate-bounce">
                  <Gem className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-purple-800 to-blue-900 bg-clip-text text-transparent">
                LUXURY
              </span>
              <br />
              <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 bg-clip-text text-transparent">
                REDEFINED
              </span>
            </h1>

            {/* Subtitle */}
            <div className="mb-8">
              <p className="text-xl md:text-2xl text-gray-700 font-light mb-4 max-w-3xl mx-auto">
                Where haute couture meets street fashion
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Curated Collections</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Premium Quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span>Exclusive Designs</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="group bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 flex items-center gap-2">
                Shop Collection
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group bg-white/10 backdrop-blur-sm border border-gray-300 text-gray-800 px-8 py-4 rounded-full text-lg font-semibold hover:scale-105 transition-all duration-300 hover:bg-white/20">
                Watch Lookbook
              </button>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">50K+</div>
                <div>Happy Customers</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">10K+</div>
                <div>Premium Items</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">4.9★</div>
                <div>Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-600 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 lg:px-12 py-16">
        {/* Categories Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
              Shop by Category
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover your perfect style across our curated collections
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            {categories.map((category, index) => (
              <div 
                key={category.name} 
                className={`group relative overflow-hidden rounded-full shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-110 animate-fade-in-up cursor-pointer`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-32 h-32 md:w-40 md:h-40">
                  <img 
                    src={category.imageUrl} 
                    alt={category.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-70 group-hover:opacity-20 transition-opacity rounded-full`} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                  <h3 className="text-lg md:text-xl font-bold mb-1 group-hover:scale-110 transition-transform text-center">
                    {category.name}
                  </h3>
                  <p className="text-xs opacity-90 font-medium">{category.items}</p>
                </div>
                
                {/* Hover Ring Effect */}
                <div className="absolute inset-0 rounded-full border-4 border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-110 group-hover:scale-125"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <ProductSection 
          title="Featured Collection" 
          products={featuredProducts}
          icon={<Zap className="w-8 h-8 text-yellow-500" />}
        />

        {/* Trending Products */}
        <ProductSection 
          title="Trending Now" 
          products={trendingProducts}
          icon={<TrendingUp className="w-8 h-8 text-pink-500" />}
        />
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Crown className="w-8 h-8 text-pink-400" />
            <h3 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Luxury Redefined
            </h3>
          </div>
          <p className="text-lg opacity-80 mb-8">Where haute couture meets innovation</p>
          <div className="text-sm opacity-60">
            &copy; 2024 Luxury Redefined. Elevating fashion, one masterpiece at a time.
          </div>
        </div>
      </footer>

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
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Page;