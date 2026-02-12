'use client';

import React, { useState, useEffect } from 'react';
import { Star, ArrowUpRight, Store, ArrowUpDown} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { WishlistButton } from '@/components/ui/wishlist-button';
import { AddToCartButton } from '@/components/ui/add-to-cart-button';

// --- INTERFACES (Unchanged) ---
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

// 1. ORIGINAL PRODUCT CARD (Restored)
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
      className={`group relative w-full cursor-pointer bg-white/70 backdrop-blur-md rounded-3xl overflow-hidden border border-white/50 shadow-sm transition-all duration-500 ${!isMobile && 'hover:shadow-2xl hover:shadow-indigo-500/10'}`}
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
          animate={{ scale: !isMobile && isHovered ? 1.08 : 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Beautiful Gradient Overlay on Hover */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-indigo-900/80 via-purple-900/40 to-transparent opacity-0 transition-opacity duration-700 mix-blend-multiply",
          (isMobile || isHovered) && "opacity-100"
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
             <span className="bg-white text-indigo-600 text-[10px] font-semibold tracking-widest px-3 py-1.5 uppercase rounded-full shadow-lg">
               New
             </span>
           )}
        </div>

        {/* Floating Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: isMobile || isHovered ? 0 : 20, opacity: isMobile || isHovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-20"
        >
          <div className="flex flex-col gap-2">
             <Link href={`/shopping/products/${item.id}`}>
                <button className="bg-white text-indigo-900 px-6 py-3 rounded-full font-semibold text-xs tracking-wider uppercase hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-lg">
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
      <div className={`mt-4 px-6 pb-6 pt-2 flex justify-between items-start border-b border-transparent ${!isMobile && 'group-hover:border-indigo-100'} transition-colors`}>
        <div>
          <p className="text-[10px] text-indigo-400 uppercase tracking-[0.2em] font-semibold mb-1.5">{categoryName}</p>
          <h3 className={`text-lg font-serif font-medium text-stone-900 leading-tight ${!isMobile && 'group-hover:text-indigo-900'} transition-all`}>
            {item.name}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-base font-semibold text-stone-900">{item.currency} {item.price.toFixed(2)}</p>
          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-stone-400">
             <Star size={8} className="fill-current text-amber-400" />
             {(item.rating ?? item.professional.professionalProfile?.rating ?? 0).toFixed(1)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// 2. PAGE COMPONENT
const Page = ({ params }: { params: Promise<{ slug: string }> }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState('featured');

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

  // Client-side filtering
  const filteredProducts = activeCategory
    ? products.filter(p => p.category.name.toLowerCase().replace(/\s+/g, '-') === activeCategory)
    : products;

  // Client-side sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === 'price-low') return a.price - b.price;
    if (sortOption === 'price-high') return b.price - a.price;
    if (sortOption === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
           <div className="w-12 h-12 border-4 border-stone-200 border-t-indigo-500 rounded-full animate-spin"></div>
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
            className="bg-stone-900 text-white px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-indigo-600 transition-colors shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile.businessName || `${profile.user.firstName} ${profile.user.lastName}`;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* --- ULTRA MINIMAL HERO --- */}
        <header className="mb-16">
          <div className="max-w-4xl mx-auto text-center pt-16 pb-12">
            
            {/* Typography Focus */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium tracking-tight text-stone-900 leading-none mb-8"
            >
              {displayName}
            </motion.h1>

            {/* Delicate Divider Line & Subtitle */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center justify-center gap-6"
            >
               <span className="h-[1px] w-12 md:w-24 bg-stone-300"></span>
               <p className="text-xs md:text-sm font-light uppercase tracking-[0.3em] text-stone-400">
                 {profile.bio || "Official Store"}
               </p>
               <span className="h-[1px] w-12 md:w-24 bg-stone-300"></span>
            </motion.div>

          </div>
        </header>

        {/* --- MAIN LAYOUT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* --- LEFT COLUMN: FILTERS --- */}
          <aside className="hidden lg:block lg:col-span-3 xl:col-span-2 space-y-16">
            
            {/* Categories */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-8">Collections</h3>
              <nav className="flex flex-col gap-1">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={cn(
                    "text-left px-4 py-2 rounded-lg transition-colors flex justify-between items-center group",
                    activeCategory === null 
                      ? "bg-stone-900 text-white" 
                      : "text-stone-600 hover:bg-stone-100"
                  )}
                >
                  <span className="text-sm font-medium">All Products</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.slug)}
                    className={cn(
                      "text-left px-4 py-2 rounded-lg transition-colors flex justify-between items-center group",
                      activeCategory === cat.slug 
                        ? "bg-stone-900 text-white" 
                        : "text-stone-600 hover:bg-stone-100"
                    )}
                  >
                    <span className="text-sm font-medium">{cat.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Minimal Info Block */}
            <div className="space-y-6">
               <div>
                  <div className="text-2xl font-serif text-stone-900">{profile.rating ? profile.rating.toFixed(1) : 'N/A'}</div>
                  <div className="text-[10px] uppercase text-stone-400 tracking-wider mt-1">Seller Rating</div>
               </div>
               <div>
                  <div className="text-2xl font-serif text-stone-900">{products.length}</div>
                  <div className="text-[10px] uppercase text-stone-400 tracking-wider mt-1">Total Pieces</div>
               </div>
            </div>

          </aside>

          {/* --- RIGHT COLUMN: PRODUCTS --- */}
          <main className="lg:col-span-9 xl:col-span-10">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 border-b border-stone-200 pb-6 gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-serif font-semibold text-stone-900 mb-1">
                  {activeCategory ? categories.find(c => c.slug === activeCategory)?.name : 'All'}
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Sort by</span>
                <div className="relative group">
                  <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="appearance-none bg-transparent border-b border-stone-300 text-stone-700 text-sm font-semibold uppercase tracking-wider py-1 pl-0 pr-6 focus:outline-none focus:border-stone-900 cursor-pointer hover:border-stone-900 transition-colors"
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-stone-400">
                     <ArrowUpDown size={12} />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {sortedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-16">
                {sortedProducts.map((product, index) => (
                  <ProductCard key={product.id} item={product} index={index} />
                ))}
              </div>
            ) : (
              <div className="py-32 text-center">
                <p className="text-stone-500 font-medium text-lg">No products found.</p>
                <button 
                  onClick={() => setActiveCategory(null)}
                  className="mt-8 text-xs font-semibold uppercase tracking-widest text-stone-900 border-b border-stone-900 hover:text-indigo-600 hover:border-indigo-600 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}
            
          </main>
        </div>

        {/* --- FOOTER --- */}
        <footer className="mt-32 pt-12 border-t border-stone-200 text-center text-stone-400 text-sm">
          <div className="mb-4">
            &copy; {new Date().getFullYear()} {displayName}. All rights reserved.
          </div>
          <div className="flex justify-center gap-8">
            <Link href={`/tz/${slug}`} className="hover:text-stone-900 transition-colors text-xs uppercase tracking-widest">Profile</Link>
            <Link href="/support" className="hover:text-stone-900 transition-colors text-xs uppercase tracking-widest">Support</Link>
          </div>
        </footer>

      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Page;