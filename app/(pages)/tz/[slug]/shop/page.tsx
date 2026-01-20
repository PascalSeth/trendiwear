'use client';

import React, { useState, useEffect } from 'react';
import { Star, ArrowUpRight, Store } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { WishlistButton } from '@/components/ui/wishlist-button';
import { AddToCartButton } from '@/components/ui/add-to-cart-button';


// --- INTERFACES (Kept from your code) ---
interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  _count: {
    products: number;
  };
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  images: string[];
  videoUrl?: string;
  sizes: string[];
  colors: string[];
  material?: string;
  careInstructions?: string;
  estimatedDelivery?: number;
  isCustomizable: boolean;
  tags: string[];
  viewCount: number;
  soldCount: number;
  category: {
    name: string;
  };
  collection?: {
    name: string;
  };
  professional: {
    firstName: string;
    lastName: string;
    professionalProfile?: {
      businessName?: string;
      businessImage?: string;
      rating?: number;
      totalReviews?: number;
    };
  };
  _count: {
    wishlistItems: number;
    cartItems: number;
    orderItems: number;
    reviews: number;
  };
  isNew?: boolean;
  rating?: number;
  views?: number;
  likes?: number;
}

interface ProfessionalProfile {
  id: string;
  businessName: string;
  businessImage?: string;
  bio?: string;
  rating?: number;
  totalReviews?: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  specialization: {
    name: string;
  };
}

// --- COMPONENTS ---

// PRODUCT CARD (Glassmorphism update)
function ProductCard({ item, index }: { item: Product; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sellerName = item.professional.professionalProfile?.businessName || `${item.professional.firstName} ${item.professional.lastName}`;
  const sellerImage = item.professional.professionalProfile?.businessImage || '/placeholder-avatar.jpg';
  const categoryName = item.category.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      className="group relative w-full cursor-pointer bg-white/70 backdrop-blur-md rounded-3xl overflow-hidden border border-white/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500"
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-stone-100 to-stone-50 rounded-t-3xl">

        {/* Image */}
        <motion.img
          src={item.images[0] || "/placeholder-product.jpg"}
          alt={item.name}
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.08 : 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Beautiful Gradient Overlay on Hover */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-indigo-900/80 via-purple-900/40 to-transparent opacity-0 transition-opacity duration-700 mix-blend-multiply",
          isHovered && "opacity-100"
        )} />

        {/* Seller Info */}
        <div className="absolute top-5 left-5 z-20 flex items-center gap-2">
          <div className="relative w-7 h-7 rounded-full border-2 border-white/30 overflow-hidden bg-white shadow-sm">
             <img src={sellerImage} alt={sellerName} className="w-full h-full object-cover" />
          </div>
          <div className="text-white/90 text-xs font-semibold tracking-wide drop-shadow-md">
            {sellerName}
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-5 right-5 z-20 flex flex-col gap-2">
           {item.isNew && (
             <span className="bg-white text-indigo-600 text-[10px] font-bold tracking-widest px-3 py-1.5 uppercase rounded-full shadow-lg">
               New
             </span>
           )}
        </div>

        {/* Floating Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-20"
        >
          <div className="flex flex-col gap-2">
             <Link href={`/shopping/products/${item.id}`}>
                <button className="bg-white text-indigo-900 px-6 py-3 rounded-full font-bold text-xs tracking-wider uppercase hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-lg">
                  View <ArrowUpRight size={14} />
                </button>
             </Link>
          </div>

          <div className="flex flex-col gap-3">
             <div className="bg-white/20 backdrop-blur-lg p-3 rounded-full text-white hover:bg-white hover:text-indigo-600 transition-all shadow-xl border border-white/20">
                <WishlistButton
                  productId={item.id}
                  variant="default"
                  size="sm"
                  showCount={true}
                  count={item.likes || item._count.wishlistItems}
                />
             </div>
             <div className="bg-white/20 backdrop-blur-lg p-3 rounded-full text-white hover:bg-white hover:text-indigo-600 transition-all shadow-xl border border-white/20">
                <AddToCartButton productId={item.id} variant="default" size="sm" />
             </div>
          </div>
        </motion.div>

      </div>

      {/* Product Info - Minimalist */}
      <div className="mt-4 px-6 pb-6 pt-2 flex justify-between items-start border-b border-transparent group-hover:border-indigo-100 transition-colors">
        <div>
          <p className="text-[10px] text-indigo-400 uppercase tracking-[0.2em] font-bold mb-1.5">{categoryName}</p>
          <h3 className="text-lg font-serif font-medium text-stone-900 leading-tight group-hover:text-indigo-900 transition-all">
            {item.name}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-base font-bold text-stone-900">{item.currency} {item.price.toFixed(2)}</p>
          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-stone-400">
             <Star size={8} className="fill-current text-amber-400" />
             {(item.rating ?? item.professional.professionalProfile?.rating ?? 0).toFixed(1)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const Page = ({ params }: { params: Promise<{ slug: string }> }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { slug } = React.use(params);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/professional-profiles/slug/${slug}/shop`);
        if (!response.ok) throw new Error('Failed to fetch shop data');
        const data = await response.json();

        setProfile(data.profile);

        const transformedProducts = data.products.map((product: Product) => ({
          ...product,
          isNew: product.tags?.includes('NEW') || false,
          rating: product.professional.professionalProfile?.rating || 4.5,
          views: product.viewCount,
          likes: product._count.wishlistItems
        }));
        setProducts(transformedProducts);

        const uniqueCategories: Category[] = data.categories.map((cat: { name: string; productCount: number }) => ({
          id: cat.name,
          name: cat.name,
          slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
          _count: { products: cat.productCount }
        }));

        setCategories(uniqueCategories);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center relative overflow-hidden">
        {/* Ambient Loading Gradient */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-medium text-stone-400 tracking-widest uppercase">Loading Store</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm bg-white/50 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white">
          <Store className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h1 className="text-xl font-serif text-stone-900 mb-2">Shop Temporarily Closed</h1>
          <p className="text-stone-500 mb-6 text-sm">{error || 'We couldn\'t find this seller.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-stone-900 text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-indigo-600 transition-colors shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile.businessName || `${profile.user.firstName} ${profile.user.lastName}`;

  return (
    <div className="min-h-screen bg-stone-50 relative overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* AMBIENT BACKGROUND GRADIENTS (Fixed) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-amber-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* MINI-STORE HEADER */}
        <div className="pt-20 pb-16 md:pt-32 md:pb-24 flex flex-col items-center text-center">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8 relative"
          >
             <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-2xl">
               <div className="w-full h-full rounded-full overflow-hidden bg-white relative">
                 <img 
                   src={profile.businessImage || profile.user.profileImage || '/placeholder-avatar.jpg'} 
                   alt={displayName}
                   className="w-full h-full object-cover"
                 />
               </div>
             </div>

          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-serif font-bold tracking-tight mb-4"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-stone-900 via-indigo-900 to-stone-900">
              {displayName}
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-stone-500 font-light mb-8 max-w-2xl"
          >
            {profile.bio || `Curating the finest ${profile.specialization.name} pieces just for you.`}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex items-center gap-6 bg-white/60 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/50 shadow-sm"
          >
            <div className="text-center">
              <div className="text-xl font-bold text-stone-900">{products.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-stone-400">Pieces</div>
            </div>
            <div className="w-px h-8 bg-stone-200"></div>
            <div className="text-center">
              <div className="text-xl font-bold text-stone-900">{categories.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-stone-400">Collections</div>
            </div>
            <div className="w-px h-8 bg-stone-200"></div>
            <div className="text-center">
              <div className="text-xl font-bold text-indigo-600">{profile.rating ? profile.rating.toFixed(1) : 'N/A'}</div>
              <div className="text-[10px] uppercase tracking-widest text-stone-400">Rating</div>
            </div>
          </motion.div>
        </div>

        {/* COLLECTION NAVIGATION */}
        <div className="mb-16 sticky top-4 z-40">
          <div className="max-w-max mx-auto bg-white/80 backdrop-blur-xl rounded-full border border-white/60 shadow-lg p-2 flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`#${category.slug}`}
                className="px-6 py-2 rounded-full text-sm font-medium text-stone-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all whitespace-nowrap"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>

        {/* PRODUCTS LIST */}
        <div className="pb-32">
          {categories.map((category) => {
            const categoryProducts = products.filter(p => p.category.name === category.name);
            if (categoryProducts.length === 0) return null;

            return (
              <section key={category.id} id={category.slug} className="mb-32 scroll-mt-32">
                <div className="flex items-end justify-between mb-12 px-2">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-2">
                      {category.name}
                    </h2>
                    <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
                  </div>
                  <span className="text-sm font-mono text-stone-400">
                    {categoryProducts.length} designs
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                  {categoryProducts.map((product, index) => (
                    <ProductCard key={product.id} item={product} index={index} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* FOOTER - Minimalist for Store */}
      <footer className="border-t border-stone-200 bg-white/50 backdrop-blur-lg py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-stone-400 text-sm">
          <div className="mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} {displayName}. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link href={`/tz/${slug}`} className="hover:text-stone-900 transition-colors">Seller Profile</Link>
            <Link href="/support" className="hover:text-stone-900 transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Page;