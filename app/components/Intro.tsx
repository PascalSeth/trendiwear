'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Shirt, Sparkles, ArrowRight, Star, Zap } from 'lucide-react';

const fashionCategories = [
  {
    id: 'casual',
    title: 'Casual Chic',
    description: 'Effortless everyday elegance',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1471&auto=format&fit=crop',
    icon: Shirt,
    color: 'from-blue-500 to-cyan-500',
    outfits: ['Denim & Blouse', 'Sneakers & Dress', 'Oversized Sweater'],
    gradient: 'from-blue-400/20 to-cyan-400/20'
  },
  {
    id: 'athleisure',
    title: 'Athleisure',
    description: 'Stylish joggers, crop tops, and sporty accessories',
    image: 'https://images.unsplash.com/photo-1470468969717-61d5d54fd036?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YXRobGVpc3VyZXxlbnwwfHwwfHx8MA%3D%3D',
    icon: Shirt,
    color: 'from-green-400 to-blue-500',
    outfits: ['Stylish Joggers', 'Crop Tops', 'Sporty Accessories'],
    gradient: 'from-green-400/20 to-blue-400/20'
  },
  {
    id: 'bohemian',
    title: 'Boho Spirit',
    description: 'Free-spirited, artistic vibes',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1420&auto=format&fit=crop',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    outfits: ['Flowy Maxi Dress', 'Layered Jewelry', 'Embroidered Kimono'],
    gradient: 'from-purple-400/20 to-pink-400/20'
  },
  {
    id: 'minimalist',
    title: 'Minimalist',
    description: 'Clean lines, neutral colors, tailored pieces',
    image: 'https://images.unsplash.com/photo-1725958019641-4c03ceb5d2db?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fE1pbmltYWxpc3QlMjBmYXNoaW9ufGVufDB8fDB8fHww',
    icon: Shirt,
    color: 'from-gray-400 to-gray-600',
    outfits: ['Tailored Trousers', 'Basic Tees', 'Clean Lines'],
    gradient: 'from-gray-400/20 to-gray-600/20'
  },
  {
    id: 'streetwear',
    title: 'Urban Edge',
    description: 'Contemporary street fashion',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1470&auto=format&fit=crop',
    color: 'from-orange-500 to-red-500',
    outfits: ['Oversized Hoodie', 'Cargo Pants', 'Sneaker Boots'],
    gradient: 'from-orange-400/20 to-red-400/20'
  },
  {
    id: 'grunge',
    title: 'Grunge',
    description: 'Distressed jeans, flannel shirts, and combat boots',
    image: 'https://images.unsplash.com/photo-1576193929684-06c6c6a8b582?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z3J1bmdlJTIwZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D',
    icon: Shirt,
    color: 'from-slate-500 to-slate-700',
    outfits: ['Distressed Jeans', 'Flannel Shirts', 'Combat Boots'],
    gradient: 'from-slate-500/20 to-slate-700/20'
  },
  {
    id: 'romantic',
    title: 'Romantic',
    description: 'Soft fabrics, lace, puffed sleeves, and pastel colors',
    image: 'https://images.unsplash.com/photo-1683717810905-7a56f467e3cf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHJvbWFudGljJTIwZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D',
    icon: Sparkles,
    color: 'from-pink-300 to-rose-400',
    outfits: ['Lace Details', 'Puffed Sleeves', 'Pastel Colors'],
    gradient: 'from-pink-300/20 to-rose-400/20'
  },
  {
    id: 'punk',
    title: 'Punk',
    description: 'Ripped jeans, graphic tees, leather jackets, and bold hairstyles',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cHVuayUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D',
    icon: Shirt,
    color: 'from-red-500 to-red-700',
    outfits: ['Ripped Jeans', 'Graphic Tees', 'Leather Jackets'],
    gradient: 'from-red-500/20 to-red-700/20'
  },
  {
    id: 'preppy',
    title: 'Preppy',
    description: 'Polo shirts, khakis, blazers, and loafers with vibrant colors',
    image: 'https://images.unsplash.com/photo-1619042821874-587aa4335f39?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cHJlcHB5JTIwZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D',
    icon: Shirt,
    color: 'from-blue-400 to-indigo-500',
    outfits: ['Polo Shirts', 'Khakis', 'Blazers'],
    gradient: 'from-blue-400/20 to-indigo-500/20'
  },
  {
    id: 'gothic',
    title: 'Gothic',
    description: 'Black clothing, leather jackets, heavy boots, and dramatic makeup',
    image: 'https://images.unsplash.com/photo-1585328588821-b60f13dda129?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGdvdGhpYyUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D',
    icon: Shirt,
    color: 'from-black to-gray-800',
    outfits: ['Black Clothing', 'Leather Jackets', 'Heavy Boots'],
    gradient: 'from-black/20 to-gray-800/20'
  },
  {
    id: 'western',
    title: 'Western',
    description: 'Cowboy boots, denim jackets, and plaid shirts with fringe details',
    image: 'https://images.unsplash.com/photo-1726516336217-f968f5be76cd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8d2VzdGVybiUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D',
    icon: Shirt,
    color: 'from-yellow-600 to-orange-600',
    outfits: ['Cowboy Boots', 'Denim Jackets', 'Plaid Shirts'],
    gradient: 'from-yellow-600/20 to-orange-600/20'
  },
  {
    id: 'eco',
    title: 'Eco-Conscious',
    description: 'Sustainable materials, upcycled fashion, and earth-toned colors',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    icon: Shirt,
    color: 'from-emerald-400 to-green-600',
    outfits: ['Sustainable Materials', 'Upcycled Fashion', 'Earth Tones'],
    gradient: 'from-emerald-400/20 to-green-600/20'
  },
  {
    id: 'maximalist',
    title: 'Maximalism',
    description: 'Bold prints, bright colors, and layered textures for a vibrant look',
    image: 'https://i.pinimg.com/enabled_hi/564x/6d/58/da/6d58dab3b515128c2d2a9bd095a4364f.jpg',
    icon: Shirt,
    color: 'from-fuchsia-400 to-violet-600',
    outfits: ['Bold Prints', 'Bright Colors', 'Layered Textures'],
    gradient: 'from-fuchsia-400/20 to-violet-600/20'
  }
   ,{
    id: 'casualx',
    title: 'Casual Chic',
    description: 'Effortless everyday elegance',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1471&auto=format&fit=crop',
    icon: Shirt,
    color: 'from-blue-500 to-cyan-500',
    outfits: ['Denim & Blouse', 'Sneakers & Dress', 'Oversized Sweater'],
    gradient: 'from-blue-400/20 to-cyan-400/20'
  },
];

// Floating particles component
const FloatingParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string; pulse: number}[]>([]);

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

    particlesRef.current = Array.from({ length: 25 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 3 + 1,
      alpha: Math.random() * 0.15 + 0.03,
      color: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#F97316'][Math.floor(Math.random() * 6)],
      pulse: Math.random() * 0.5 + 0.5
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        const currentSize = particle.size * (0.8 + Math.sin(Date.now() * 0.001 * particle.pulse) * 0.2);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `${particle.color}${Math.floor(particle.alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

function FashionInspo() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-white to-slate-100 py-20 px-0 overflow-hidden">
      {/* Animated Background */}
      <FloatingParticles />

      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-blue-400/8 to-purple-500/8 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-[32rem] h-[32rem] bg-gradient-to-r from-pink-400/6 to-orange-500/6 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-[28rem] h-[28rem] bg-gradient-to-r from-green-400/8 to-teal-500/8 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>

        {/* Additional floating elements */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-purple-300/5 to-pink-300/5 rounded-full mix-blend-multiply filter blur-2xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '6s' }}></div>
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gradient-to-r from-cyan-300/6 to-blue-300/6 rounded-full mix-blend-multiply filter blur-2xl animate-bounce" style={{ animationDelay: '3s', animationDuration: '8s' }}></div>

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.3)_1px,transparent_0)] bg-[size:40px_40px]"></div>
        </div>
      </div>

      <div className="relative z-10 w-full">
        {/* Simple Elegant Header */}
        <div className="text-center mb-4">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-slate-800 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-fade-in-up">
            Fashion Inspiration
          </h2>
        </div>

        {/* Cross Layout for All Screens */}
        <div className="relative min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] flex items-start justify-center pt-4 sm:pt-8 px-0">
          {fashionCategories.slice(0, screenSize.width < 640 ? 8 : fashionCategories.length).map((category, index) => {
            // Different cross positions for different screen sizes
            const getCrossPositions = () => {
              if (screenSize.width < 640) {
                // Mobile: 8 items in a compact cross
                return [
                  { x: 6, y: 20 }, { x: 16, y: 30 }, { x: 26, y: 40 }, { x: 50, y: 60 },
                  { x: 60, y: 20 }, { x: 50, y: 30 }, { x: 40, y: 40 }, { x: 16, y: 60 }
                ];
              } else if (screenSize.width < 1024) {
                // Tablet: All 14 items in medium cross
                return [
                           { x: 2, y: 15 }, { x: 12, y: 25 }, { x: 22, y: 35 }, { x: 32, y: 45 },
              { x: 42, y: 55 }, { x: 52, y: 65 }, { x: 62, y: 75 },
              { x: 75, y: 15 }, { x: 70, y: 25 }, { x: 62, y: 35 }, { x: 52, y: 45 },
              { x: 42, y: 55 }, { x: 32, y: 65 }, { x: 22, y: 75 }
          ];
              } else {
                // Desktop: All 14 items in full cross
                return [
                          { x: 2, y: 15 }, { x: 12, y: 25 }, { x: 22, y: 35 }, { x: 32, y: 45 },
              { x: 42, y: 55 }, { x: 52, y: 65 }, { x: 62, y: 75 },
              { x: 82, y: 15 }, { x: 72, y: 25 }, { x: 62, y: 35 }, { x: 52, y: 45 },
              { x: 42, y: 55 }, { x: 32, y: 65 }, { x: 22, y: 75 }
       
                ];
              }
            };

            const crossPositions = getCrossPositions();
            const position = crossPositions[index] || crossPositions[0];
            const isMainDiagonal = screenSize.width < 640 ? index < 4 : index < 7;
            const rotation = isMainDiagonal ? (index - (screenSize.width < 640 ? 1.5 : 3)) * 3 : -(index - (screenSize.width < 640 ? 5.5 : 10)) * 3;
            const scale = screenSize.width < 640 ? 0.7 : screenSize.width < 1024 ? 0.8 : 0.9 + (Math.abs(index - 6.5) * -0.05);

            return (
              <div
                key={category.id}
                className="group absolute animate-fade-in-up cursor-pointer"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  animationDelay: `${800 + index * 100}ms`,
                  width: screenSize.width < 640 ? '140px' : screenSize.width < 1024 ? '180px' : '220px',
                  height: screenSize.width < 640 ? '180px' : screenSize.width < 1024 ? '240px' : '300px',
                  zIndex: hoveredIndex === index ? 15 : 10 - Math.abs(index - Math.floor(14 / 2)),
                  transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
                  transformOrigin: 'center'
                }}
                onMouseEnter={() => {
                  setSelectedCategory(category.id);
                  setHoveredIndex(index);
                }}
                onMouseLeave={() => {
                  setSelectedCategory(null);
                  setHoveredIndex(null);
                }}
              >
                <div className="relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-500 sm:duration-700 transform hover:-translate-y-1 sm:hover:-translate-y-2 hover:rotate-1 group-hover:rotate-0">
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <div className="relative h-32 sm:h-40 lg:h-48 overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.title}
                      className="w-full h-full object-cover transition-all duration-500 sm:duration-700 group-hover:scale-105 sm:group-hover:scale-110 group-hover:brightness-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                    {hoveredIndex === index && (
                      <div className="absolute inset-0 pointer-events-none">
                        <Star className="absolute top-1/4 left-1/4 w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 animate-ping" />
                        <Star className="absolute top-3/4 right-1/4 w-2 h-2 sm:w-3 sm:h-3 text-pink-400 animate-ping" style={{ animationDelay: '0.5s' }} />
                        <Star className="absolute top-1/2 right-1/3 w-2 h-2 text-purple-400 animate-ping" style={{ animationDelay: '1s' }} />
                      </div>
                    )}

                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${selectedCategory === category.id ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                      <div className="text-center text-white transform transition-all duration-500">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 transform translate-y-2 sm:translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{category.title}</h3>
                        <p className="text-xs sm:text-sm opacity-90 mb-3 sm:mb-6 transform translate-y-2 sm:translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100 line-clamp-2 sm:line-clamp-none">{category.description}</p>
                        <button className="bg-white/20 backdrop-blur-md border-2 border-white/40 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold hover:bg-white/30 transition-all duration-300 transform translate-y-2 sm:translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-200 hover:scale-105">
                          Explore Looks
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 border-transparent group-hover:border-purple-500/30 transition-all duration-500"></div>
                  <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-black/5 transform translate-x-1 sm:translate-x-2 translate-y-1 sm:translate-y-2 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            );
          })}
        </div>


        {/* Enhanced Bottom CTA */}
        <div className="text-center mt-16 animate-fade-in-up" style={{ animationDelay: '1.5s' }}>
          <div className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-3xl p-10 shadow-xl border border-slate-200/50 overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-purple-500/5 animate-pulse"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                <span className="text-sm font-medium text-purple-700">Personalized Style</span>
              </div>

              <h3 className="text-3xl font-bold text-slate-900 mb-4">
                Can't Find Your Perfect Style?
              </h3>
              <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
                Take our style quiz and get personalized fashion recommendations based on your preferences, body type, and lifestyle.
              </p>

              <button className="group relative bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative flex items-center gap-3">
                  <Zap className="w-5 h-5 animate-pulse" />
                  Take Style Quiz
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

export default FashionInspo;