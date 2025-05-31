'use client'
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Heart, Star, ArrowRight, ChevronLeft, ChevronRight, Eye, Truck, RotateCcw, Users, Award, Sparkles, Play, Pause, User, MapPin, Calendar } from 'lucide-react';

interface Retailer {
  id: number;
  name: string;
  profession: string;
  location: string;
  experience: string;
  avatar: string;
  bio: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  profileImage: string;
  retailerId: number;
  category: string;
  rating: number;
  reviews: number;
  badge?: string;
  colors?: string[];
  sizes?: string[];
  description: string;
  features: string[];
  material?: string;
  fit?: string;
}

const retailerProfiles: Retailer[] = [
  {
    id: 1,
    name: "James Rodriguez",
    profession: "Fashion Retailer",
    location: "New York, NY",
    experience: "15+ years",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    bio: "Curating premium fashion with an eye for timeless elegance and contemporary style."
  },
  {
    id: 2,
    name: "Emma Thompson",
    profession: "Luxury Stylist",
    location: "Paris, France",
    experience: "12+ years",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    bio: "Crafting sophisticated looks with a focus on sustainable luxury and bespoke designs."
  },
  {
    id: 3,
    name: "Liam Chen",
    profession: "Designer & Retailer",
    location: "Tokyo, Japan",
    experience: "10+ years",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    bio: "Blending modern aesthetics with traditional craftsmanship for unique fashion experiences."
  },
  {
    id: 4,
    name: "Sofia Alvarez",
    profession: "Fashion Curator",
    location: "Milan, Italy",
    experience: "8+ years",
    avatar: "https://images.unsplash.com/photo-1521146764736-558f2dafbe0b?w=150&auto=format&fit=crop&q=80",
    bio: "Specializing in artisanal fashion with a passion for eco-friendly materials."
  },
  {
    id: 5,
    name: "Aisha Khan",
    profession: "Boutique Owner",
    location: "London, UK",
    experience: "14+ years",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    bio: "Offering exclusive collections that redefine elegance with bold, vibrant styles."
  }
];

const products: Product[] = [
  {
    id: 1,
    name: "Luxury Cashmere Sweater",
    price: 299,
    originalPrice: 449,
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80",
    profileImage: retailerProfiles[0].avatar.replace('w=150', 'w=60'),
    retailerId: 1,
    category: "Knitwear",
    rating: 4.9,
    reviews: 1247,
    badge: "Bestseller",
    colors: ["#F5F5DC", "#8B4513", "#000000", "#2F4F4F"],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Indulge in ultimate luxury with our premium cashmere sweater. Crafted from the finest Mongolian cashmere for unparalleled softness and warmth.",
    features: ["100% Pure Cashmere", "Hand-finished Details", "Temperature Regulating", "Pill-resistant"],
    material: "100% Cashmere",
    fit: "Relaxed Fit"
  },
  {
    id: 2,
    name: "Designer Silk Midi Dress",
    price: 450,
    originalPrice: 650,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
    profileImage: retailerProfiles[1].avatar.replace('w=150', 'w=60'),
    retailerId: 2,
    category: "Dresses",
    rating: 4.8,
    reviews: 892,
    badge: "New Season",
    colors: ["#8B0000", "#000080", "#228B22", "#000000"],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Elevate your wardrobe with this stunning silk midi dress featuring a flowing silhouette and elegant draping perfect for any occasion.",
    features: ["Premium Silk Fabric", "Flowing Silhouette", "Lined Interior", "Dry Clean Only"],
    material: "100% Mulberry Silk",
    fit: "Midi Length"
  },
  {
    id: 3,
    name: "Premium Leather Jacket",
    price: 599,
    originalPrice: 799,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80",
    profileImage: retailerProfiles[2].avatar.replace('w=150', 'w=60'),
    retailerId: 3,
    category: "Outerwear",
    rating: 4.9,
    reviews: 2156,
    badge: "Limited Edition",
    colors: ["#000000", "#8B4513", "#2F4F4F", "#800000"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description: "Make a statement with our handcrafted leather jacket featuring premium Italian leather and timeless design that never goes out of style.",
    features: ["Genuine Italian Leather", "YKK Zippers", "Quilted Lining", "Lifetime Craftsmanship"],
    material: "Italian Nappa Leather",
    fit: "Classic Fit"
  },
  {
    id: 4,
    name: "Artisan Wool Coat",
    price: 750,
    originalPrice: 950,
    image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&auto=format&fit=crop&q=80",
    profileImage: retailerProfiles[3].avatar.replace('w=150', 'w=60'),
    retailerId: 4,
    category: "Outerwear",
    rating: 4.7,
    reviews: 634,
    badge: "Handcrafted",
    colors: ["#8B4513", "#2F4F4F", "#800000", "#000000"],
    sizes: ["XS", "S", "M", "L", "XL"],
    description: "Exceptional craftsmanship meets modern elegance in this handwoven wool coat, perfect for sophisticated styling in any season.",
    features: ["Handwoven Wool", "Tailored Fit", "Italian Buttons", "Weather Resistant"],
    material: "Virgin Wool Blend",
    fit: "Tailored Fit"
  },
  {
    id: 5,
    name: "Heritage Cotton Shirt",
    price: 180,
    originalPrice: 240,
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
    profileImage: retailerProfiles[4].avatar.replace('w=150', 'w=60'),
    retailerId: 5,
    category: "Shirts",
    rating: 4.6,
    reviews: 421,
    badge: "Classic",
    colors: ["#FFFFFF", "#E6E6FA", "#F0F8FF", "#F5F5DC"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    description: "Timeless elegance meets modern comfort in our heritage cotton shirt, crafted with attention to every detail for the discerning individual.",
    features: ["Premium Cotton", "Mother of Pearl Buttons", "French Seams", "Wrinkle Resistant"],
    material: "100% Premium Cotton",
    fit: "Classic Fit"
  }
];

interface FloatingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

const FloatingElements: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<FloatingParticle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    particlesRef.current = Array.from({ length: 20 }, (): FloatingParticle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.15 + 0.05,
      color: ['#D4AF37', '#C0392B', '#8E44AD', '#2980B9', '#E74C3C'][Math.floor(Math.random() * 5)]
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `${particle.color}${Math.floor(particle.alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

export default function FashionShowcase(): JSX.Element {
  const [currentProduct, setCurrentProduct] = useState<number>(0);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeFeature, setActiveFeature] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const autoSlideInterval = useRef<NodeJS.Timeout>();
  const progressInterval = useRef<NodeJS.Timeout>();
  const SLIDE_DURATION = 5000;

  const product = products[currentProduct];
  const retailer = retailerProfiles.find(r => r.id === product.retailerId) || retailerProfiles[0];

  useEffect(() => {
    if (product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
  }, [currentProduct, product]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % product.features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [product.features.length]);

  useEffect(() => {
    if (isAutoPlaying) {
      setProgress(0);
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            return 0;
          }
          return prev + (100 / (SLIDE_DURATION / 100));
        });
      }, 100);

      autoSlideInterval.current = setTimeout(() => {
        nextProduct();
      }, SLIDE_DURATION);
    }

    return () => {
      if (autoSlideInterval.current) clearTimeout(autoSlideInterval.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [currentProduct, isAutoPlaying]);

  const nextProduct = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setProgress(0);
    setTimeout(() => {
      setCurrentProduct((prev) => (prev + 1) % products.length);
      setIsTransitioning(false);
    }, 300);
  };

  const prevProduct = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setProgress(0);
    setTimeout(() => {
      setCurrentProduct((prev) => (prev - 1 + products.length) % products.length);
      setIsTransitioning(false);
    }, 300);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentProduct) return;
    setIsTransitioning(true);
    setProgress(0);
    setTimeout(() => {
      setCurrentProduct(index);
      setIsTransitioning(false);
    }, 300);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
    setProgress(0);
  };

  const addToCart = () => {
    const button = document.querySelector('.add-to-cart-btn');
    if (button) {
      button.classList.add('animate-bounce');
      setTimeout(() => button.classList.remove('animate-bounce'), 600);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-orange-500 overflow-hidden">
      <FloatingElements />
      
      {/* Background Gradient */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-rose-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-amber-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/2 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          {/* Retailer Profile */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img 
                src={retailer.avatar} 
                alt={retailer.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/30"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-white font-bold text-lg sm:text-xl">{retailer.name}</h1>
              <div className="flex items-center space-x-2 text-gray-300 text-xs sm:text-sm">
                <User className="w-3 h-3" />
                <span>{retailer.profession}</span>
                <span>•</span>
                <MapPin className="w-3 h-3" />
                <span>{retailer.location}</span>
                <span>•</span>
                <Calendar className="w-3 h-3" />
                <span>{retailer.experience}</span>
              </div>
            </div>
            <div className="block sm:hidden">
              <h1 className="text-white font-bold text-sm">{retailer.name.split(' ')[0]}</h1>
              <p className="text-gray-300 text-xs">{retailer.profession}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleAutoPlay}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
            >
              {isAutoPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            
            <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-md rounded-full px-3 py-2">
              <span className="text-white text-xs sm:text-sm">{currentProduct + 1}/{products.length}</span>
              <div className="w-8 sm:w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-400 transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
            
            {/* Product Image Section */}
            <div className="relative order-1 lg:order-1">
              <div className="relative group">
                <div 
                  className={`relative w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-2xl lg:rounded-3xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-700 ${
                    isTransitioning ? 'scale-95 opacity-70' : 'scale-100 opacity-100'
                  }`}
                  style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 60px rgba(236, 72, 153, 0.3)'
                  }}
                >
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-2xl lg:rounded-3xl transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Product Profile Badge */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/50 backdrop-blur-md rounded-full px-3 py-2">
                    <img 
                      src={product.profileImage} 
                      alt={retailer.name}
                      className="w-6 h-6 rounded-full border border-white/30"
                    />
                    <span className="text-white text-xs sm:text-sm font-medium">{retailer.name.split(' ')[0]}</span>
                  </div>
                  
                  {/* Product Badge */}
                  {product.badge && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-full text-xs sm:text-sm shadow-lg">
                      <Award className="inline-block w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      {product.badge}
                    </div>
                  )}
                  
                  {/* Wishlist Button */}
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`absolute bottom-4 right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                      isWishlisted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                  
                  {/* Quick View Button */}
                  <button className="absolute bottom-4 left-4 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 hover:scale-110">
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Navigation Arrows - Desktop Only */}
                  <button 
                    onClick={prevProduct}
                    className="hidden lg:block absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-all duration-300 opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  
                  <button 
                    onClick={nextProduct}
                    className="hidden lg:block absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-all duration-300 opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                {/* Mobile Navigation */}
                <div className="flex lg:hidden justify-between items-center mt-4">
                  <button 
                    onClick={prevProduct}
                    className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex space-x-2">
                    {products.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentProduct 
                            ? 'bg-rose-400 scale-125' 
                            : 'bg-white/30 hover:bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <button 
                    onClick={nextProduct}
                    className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Desktop Thumbnails */}
                <div className="hidden lg:flex justify-center mt-6 space-x-4">
                  {products.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                        index === currentProduct 
                          ? 'border-rose-400 scale-110 shadow-lg' 
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <img 
                        src={products[index].image} 
                        alt={products[index].name}
                        className="w-full h-full object-cover"
                      />
                      {index === currentProduct && isAutoPlaying && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                          <div 
                            className="h-full bg-rose-400 transition-all duration-100 ease-linear"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="order-2 lg:order-2">
              {/* Mobile Toggle Button */}
              <div className="lg:hidden flex justify-between items-center mb-4">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex items-center space-x-2 text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2"
                >
                  <span>{isMobileMenuOpen ? 'Hide Details' : 'Show Details'}</span>
                  <ArrowRight className={`w-4 h-4 transition-transform ${isMobileMenuOpen ? 'rotate-90' : ''}`} />
                </button>
                <button
                  onClick={addToCart}
                  className="add-to-cart-btn flex items-center space-x-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>

              {/* Product Details */}
              <div className={`${isMobileMenuOpen || 'lg:block'} ${isMobileMenuOpen ? 'block' : 'hidden'} space-y-4 sm:space-y-6 lg:space-y-8 transition-all duration-700 ${isTransitioning ? 'translate-y-4 opacity-70' : 'translate-y-0 opacity-100'}`}>
                
                {/* Retailer Bio */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-6">
                  <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">About {retailer.name}</h3>
                  <p className="text-gray-300 text-xs sm:text-sm">{retailer.bio}</p>
                </div>

                {/* Category & Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <span className="px-3 py-1 bg-gradient-to-r from-rose-500/20 to-purple-500/20 text-rose-300 rounded-full text-xs sm:text-sm font-medium border border-rose-500/30 w-fit">
                    {product.category}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 sm:w-4 sm:h-4 ${
                            i < Math.floor(product.rating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-300 text-xs sm:text-sm">({product.reviews})</span>
                  </div>
                </div>

                {/* Product Name */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  {product.name}
                </h1>

                {/* Price */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">${product.price}</span>
                  {product.originalPrice && (
                    <>
                      <span className="text-sm sm:text-lg lg:text-xl text-gray-400 line-through">${product.originalPrice}</span>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs sm:text-sm font-medium">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-300 text-xs sm:text-sm lg:text-base leading-relaxed">
                  {product.description}
                </p>

                {/* Material & Fit Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:p-4">
                    <h4 className="text-white font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">Material</h4>
                    <p className="text-gray-300 text-xs sm:text-sm">{product.material}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:p-4">
                    <h4 className="text-white font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">Fit</h4>
                    <p className="text-gray-300 text-xs sm:text-sm">{product.fit}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-6">
                  <h3 className="text-white font-semibold mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-rose-400" />
                    Premium Features
                  </h3>
                  <div className="space-y-2">
                    {product.features.map((feature, index) => (
                      <div 
                        key={index}
                        className={`flex items-center space-x-3 transition-all duration-500 ${
                          index === activeFeature ? 'text-rose-300 scale-105' : 'text-gray-400'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                          index === activeFeature ? 'bg-rose-400' : 'bg-gray-600'
                        }`} />
                        <span className="text-xs sm:text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                {product.colors && (
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold text-sm sm:text-base">Available Colors</h3>
                    <div className="flex space-x-3">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-300 hover:scale-110 relative ${
                            selectedColor === color ? 'border-white scale-110 shadow-lg' : 'border-gray-500'
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {selectedColor === color && (
                            <div className="absolute inset-0 rounded-full border-2 border-white animate-ping" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selection */}
                {product.sizes && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-white font-semibold text-sm sm:text-base">Size</h3>
                      <button className="text-rose-400 text-xs sm:text-sm hover:text-rose-300 transition-colors">
                        Size Guide
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg border transition-all duration-300 hover:scale-105 min-w-[40px] sm:min-w-[50px] text-xs sm:text-sm ${
                            selectedSize === size 
                              ? 'border-rose-400 bg-rose-500/20 text-rose-300' 
                              : 'border-gray-500 text-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity & Add to Cart */}
                <div className="flex items-center space-x-4 sm:space-x-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-semibold text-sm sm:text-base">Qty:</span>
                    <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-1">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded transition-colors"
                      >
                        -
                      </button>
                      <span className="text-white px-2 sm:px-3 text-sm sm:text-base">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={addToCart}
                    className="add-to-cart-btn flex-1 hidden lg:flex bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 hover:scale-105 items-center justify-center space-x-3 group"
                    style={{ boxShadow: '0 20px 40px rgba(236, 72, 153, 0.4)' }}
                  >
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-bounce" />
                    <span className="text-sm sm:text-base">Add to Cart</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 py-4 sm:pt-6 border-t border-white/10">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    <span className="text-xs sm:text-sm">Free Shipping</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    <span className="text-xs sm:text-sm">Try at Home</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                    <span className="text-xs sm:text-sm">Easy Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-md p-4 z-20 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl sm:text-2xl font-bold text-white">${product.price}</span>
            {product.originalPrice && (
              <span className="text-sm sm:text-lg text-gray-400 line-through">${product.originalPrice}</span>
            )}
          </div>
          <button 
            onClick={addToCart}
            className="add-to-cart-btn flex items-center space-x-2 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="text-sm">Add to Cart</span>
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-slide-up {
          animation: slideUp 0.6s ease-out;
        }
        
        .animate-fade-in {
          animation: fadeInSlide 0.6s ease-out;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}