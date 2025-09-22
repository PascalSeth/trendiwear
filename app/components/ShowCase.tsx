'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Star, ArrowRight, ChevronLeft, ChevronRight, Play, Pause, Sparkles } from 'lucide-react';

interface Retailer {
  id: string;
  name: string;
  profession: string;
  location: string;
  experience: string;
  avatar: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  retailerId: string;
  category: string;
  rating: number;
  reviews: number;
  badge?: string;
  description: string;
}


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

    particlesRef.current = Array.from({ length: 12 }, (): FloatingParticle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.08 + 0.03,
      color: ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981'][Math.floor(Math.random() * 4)]
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
  const [products, setProducts] = useState<Product[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProduct, setCurrentProduct] = useState<number>(0);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);

  const autoSlideInterval = useRef<NodeJS.Timeout>();
  const progressInterval = useRef<NodeJS.Timeout>();
  const SLIDE_DURATION = 5000;

  // Define navigation functions before useEffect
  const nextProduct = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setProgress(0);
    setTimeout(() => {
      setCurrentProduct((prev) => (prev + 1) % (products.length > 0 ? products.length : 3));
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, products.length]);

  const prevProduct = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setProgress(0);
    setTimeout(() => {
      const totalProducts = products.length > 0 ? products.length : 3;
      setCurrentProduct((prev) => (prev - 1 + totalProducts) % totalProducts);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, products.length]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentProduct) return;
    setIsTransitioning(true);
    setProgress(0);
    setTimeout(() => {
      setCurrentProduct(index);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, currentProduct]);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(!isAutoPlaying);
    setProgress(0);
  }, [isAutoPlaying]);

  useEffect(() => {
    const fetchShowcaseProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/showcase-products');
        if (!response.ok) throw new Error('Failed to fetch showcase products');
        const data = await response.json();

        // Transform data to match component interfaces
        const transformedProducts: Product[] = data.map((item: unknown) => {
          const productData = item as {
            id: string;
            name: string;
            price: number;
            images: string[];
            professionalId: string;
            category: { name: string };
            averageRating: number;
            _count: { reviews: number };
            description?: string;
          };
          return {
            id: productData.id,
            name: productData.name,
            price: productData.price,
            image: productData.images[0] || '',
            retailerId: productData.professionalId,
            category: productData.category.name,
            rating: productData.averageRating,
            reviews: productData._count.reviews,
            description: productData.description || '',
          };
        });

        const transformedRetailers: Retailer[] = data.map((item: unknown) => {
          const productData = item as {
            professionalId: string;
            professional: {
              firstName: string;
              lastName: string;
              professionalProfile?: {
                businessName?: string;
                location?: string;
                experience?: number;
                businessImage?: string;
              };
            };
          };
          return {
            id: productData.professionalId,
            name: productData.professional.professionalProfile?.businessName ||
                  `${productData.professional.firstName} ${productData.professional.lastName}`,
            profession: 'Fashion Professional',
            location: productData.professional.professionalProfile?.location || '',
            experience: `${productData.professional.professionalProfile?.experience || 0} years`,
            avatar: productData.professional.professionalProfile?.businessImage || '',
          };
        });

        // Remove duplicates from retailers
        const uniqueRetailers = transformedRetailers.filter((retailer, index, self) =>
          index === self.findIndex(r => r.id === retailer.id)
        );

        setProducts(transformedProducts);
        setRetailers(uniqueRetailers);
      } catch (err) {
        console.error('Failed to fetch showcase products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShowcaseProducts();
  }, []);

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
  }, [currentProduct, isAutoPlaying, nextProduct]);

  // Fallback to hardcoded data if no products from API
  const displayProducts = products.length > 0 ? products : [
    {
      id: '1',
      name: "Luxury Cashmere Sweater",
      price: 299,
      image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80",
      retailerId: '1',
      category: "Knitwear",
      rating: 4.9,
      reviews: 1247,
      badge: "Bestseller",
      description: "Premium cashmere sweater crafted from the finest Mongolian cashmere for unparalleled softness and warmth."
    },
    {
      id: '2',
      name: "Designer Silk Midi Dress",
      price: 450,
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
      retailerId: '2',
      category: "Dresses",
      rating: 4.8,
      reviews: 892,
      badge: "New Season",
      description: "Stunning silk midi dress featuring a flowing silhouette and elegant draping perfect for any occasion."
    },
    {
      id: '3',
      name: "Premium Leather Jacket",
      price: 599,
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80",
      retailerId: '3',
      category: "Outerwear",
      rating: 4.9,
      reviews: 2156,
      badge: "Limited Edition",
      description: "Handcrafted leather jacket featuring premium Italian leather and timeless design that never goes out of style."
    }
  ];

  const displayRetailers = retailers.length > 0 ? retailers : [
    {
      id: '1',
      name: "James Rodriguez",
      profession: "Fashion Retailer",
      location: "New York, NY",
      experience: "15+ years",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: '2',
      name: "Emma Thompson",
      profession: "Luxury Stylist",
      location: "Paris, France",
      experience: "12+ years",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: '3',
      name: "Liam Chen",
      profession: "Designer & Retailer",
      location: "Tokyo, Japan",
      experience: "10+ years",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80"
    }
  ];

  const product = displayProducts[currentProduct];
  const retailer = displayRetailers.find(r => r.id === product.retailerId) || displayRetailers[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading showcase...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-200 overflow-hidden">
      <FloatingElements />

      {/* Professional Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-200 to-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.3)_1px,transparent_0)] bg-[size:32px_32px]"></div>
      </div>

      {/* Minimal Professional Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-3 md:p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Subtle Retailer Profile */}
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm border border-white/40">
              <div className="relative">
                <img
                  src={retailer.avatar}
                  alt={retailer.name}
                  className="w-6 h-6 md:w-7 md:h-7 rounded-full border border-white/60"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full border border-white"></div>
              </div>
              <div className="hidden sm:block">
                <p className="text-slate-800 font-medium text-xs">{retailer.name}</p>
                <p className="text-slate-600 text-xs">{retailer.profession}</p>
              </div>
            </div>

            {/* Minimal Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleAutoPlay}
                className="w-8 h-8 md:w-9 md:h-9 bg-white/70 backdrop-blur-sm border border-white/50 rounded-md flex items-center justify-center text-slate-700 hover:bg-white/80 transition-all duration-200"
              >
                {isAutoPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>

              <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm rounded-md px-3 py-1.5 border border-white/50">
                <span className="text-slate-800 text-xs font-medium">{currentProduct + 1}/{displayProducts.length}</span>
                <div className="w-12 md:w-14 h-1 bg-slate-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Layout (lg and above) - Two Column */}
      <div className="hidden lg:block relative z-10 pt-32 pb-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Professional Product Image Section */}
            <div className="relative order-2 lg:order-1">
              <div className="relative group">
                <div
                  className={`relative w-full h-[650px] rounded-3xl overflow-hidden bg-white shadow-2xl border border-slate-200/50 transition-all duration-700 ${
                    isTransitioning ? 'scale-[0.98] opacity-80' : 'scale-100 opacity-100'
                  }`}
                  style={{
                    boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Premium Product Badge */}
                  {product.badge && (
                    <div className="absolute top-6 right-6 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-2xl text-sm shadow-lg backdrop-blur-sm">
                      <Sparkles className="inline-block w-4 h-4 mr-2" />
                      {product.badge}
                    </div>
                  )}

                  {/* Elegant Wishlist Button */}
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`absolute bottom-6 right-6 w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/50 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg ${
                      isWishlisted ? 'bg-red-50 text-red-500 border-red-200' : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>

                  {/* Sophisticated Navigation Arrows */}
                  <button
                    onClick={prevProduct}
                    className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-xl flex items-center justify-center text-slate-700 hover:bg-white hover:shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-md"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={nextProduct}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-xl flex items-center justify-center text-slate-700 hover:bg-white hover:shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-md"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Professional Thumbnails */}
                <div className="flex justify-center mt-8 space-x-3">
                  {displayProducts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-300 shadow-sm ${
                        index === currentProduct
                          ? 'border-indigo-500 scale-110 shadow-lg ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      <img
                        src={displayProducts[index].image}
                        alt={displayProducts[index].name}
                        className="w-full h-full object-cover"
                      />
                      {index === currentProduct && isAutoPlaying && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/20">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Professional Product Details Section */}
            <div className={`space-y-10 transition-all duration-700 order-1 lg:order-2 ${isTransitioning ? 'translate-y-4 opacity-70' : 'translate-y-0 opacity-100'}`}>

              {/* Premium Category & Rating */}
              <div className="flex items-center justify-between">
                <span className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-2xl text-sm font-semibold border border-indigo-200/50 shadow-sm">
                  {product.category}
                </span>
                <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-sm border border-slate-200/50">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? 'text-amber-400 fill-current'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-slate-600 text-sm font-medium">({product.reviews.toLocaleString()} reviews)</span>
                </div>
              </div>

              {/* Elegant Product Name */}
              <div>
                <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-2">
                  {product.name}
                </h1>
                <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
              </div>

              {/* Professional Price Display */}
              <div className="flex items-center space-x-6">
                <span className="text-4xl font-bold text-slate-900">${product.price.toLocaleString()}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-2xl text-slate-500 line-through">${product.originalPrice.toLocaleString()}</span>
                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold border border-emerald-200">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Sophisticated Description */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                <p className="text-slate-700 text-lg leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Premium CTA Button */}
              <button
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl flex items-center justify-center space-x-3 group shadow-lg"
                style={{ boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)' }}
              >
                <span className="text-lg font-semibold">Shop Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Professional Trust Indicators */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                <div className="flex items-center justify-center space-x-8 text-sm">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="font-medium">Free Shipping $200+</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">30-Day Returns</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">Authentic Guarantee</span>
                  </div>
                </div>
                <div className="text-center mt-4 pt-4 border-t border-slate-200/50">
                  <p className="text-slate-600">
                    Curated by <span className="text-indigo-600 font-semibold">{retailer.name}</span> • Premium Quality Assured
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Overlay Layout (below lg) */}
      <div className="lg:hidden relative z-10 min-h-screen flex items-center">
        <div className="absolute inset-0">
          {/* Product Background Image */}
          <div
            className={`relative w-full h-full transition-all duration-700 ${
              isTransitioning ? 'scale-[1.02] opacity-90' : 'scale-100 opacity-100'
            }`}
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/70"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
          </div>

          {/* Navigation Arrows Overlay */}
          <button
            onClick={prevProduct}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextProduct}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 shadow-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Product Badge Overlay */}
          {product.badge && (
            <div className="absolute top-6 right-6 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl text-sm shadow-2xl backdrop-blur-sm">
              <Sparkles className="inline-block w-4 h-4 mr-2" />
              {product.badge}
            </div>
          )}

          {/* Wishlist Button Overlay */}
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`absolute bottom-6 right-6 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-2xl ${
              isWishlisted ? 'bg-red-500/30 text-red-300' : 'text-white hover:bg-white/30'
            }`}
          >
            <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col items-center justify-center min-h-screen text-center">

            {/* Product Details Overlay */}
            <div className="text-white space-y-6 max-w-2xl">

              {/* Premium Category & Rating */}
              <div className="flex flex-col items-center gap-4">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-2xl text-sm font-semibold border border-white/30 shadow-lg">
                  {product.category}
                </span>
                <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg border border-white/30">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? 'text-amber-300 fill-current'
                            : 'text-white/50'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-white/90 text-sm font-medium">({product.reviews.toLocaleString()} reviews)</span>
                </div>
              </div>

              {/* Elegant Product Name */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                  {product.name}
                </h1>
                <div className="w-16 md:w-20 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mx-auto"></div>
              </div>

              {/* Professional Price Display */}
              <div className="flex flex-col items-center gap-4">
                <span className="text-4xl md:text-5xl font-bold text-white">${product.price.toLocaleString()}</span>
                {product.originalPrice && (
                  <div className="flex items-center gap-4">
                    <span className="text-xl md:text-2xl text-white/70 line-through">${product.originalPrice.toLocaleString()}</span>
                    <span className="px-3 py-2 bg-emerald-500/80 text-white rounded-xl text-sm font-bold border border-emerald-400/50">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  </div>
                )}
              </div>

              {/* Sophisticated Description */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
                <p className="text-white/90 text-lg leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Premium CTA Button */}
              <button
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center justify-center space-x-3 group shadow-2xl text-lg"
                style={{ boxShadow: '0 25px 50px rgba(99, 102, 241, 0.5)' }}
              >
                <span className="font-semibold">Shop Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </button>

              {/* Professional Trust Indicators */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center justify-center space-x-3 text-white/90">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="font-medium text-center">Free Shipping $200+</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3 text-white/90">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="font-medium text-center">30-Day Returns</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3 text-white/90">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="font-medium text-center">Authentic Guarantee</span>
                  </div>
                </div>
                <div className="text-center mt-6 pt-6 border-t border-white/20">
                  <p className="text-white/80 text-sm">
                    Curated by <span className="text-indigo-300 font-semibold">{retailer.name}</span> • Premium Quality Assured
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Thumbnails */}
            <div className="mt-8 flex justify-center space-x-3">
              {displayProducts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 shadow-lg ${
                    index === currentProduct
                      ? 'border-indigo-400 scale-110 shadow-2xl ring-4 ring-indigo-400/30'
                      : 'border-white/30 hover:border-white/50 hover:shadow-2xl'
                  }`}
                >
                  <img
                    src={displayProducts[index].image}
                    alt={displayProducts[index].name}
                    className="w-full h-full object-cover"
                  />
                  {index === currentProduct && isAutoPlaying && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}