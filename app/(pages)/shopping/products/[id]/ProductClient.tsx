'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  ShoppingBag, Star,
  ChevronLeft, ChevronRight, 
  Clock, BadgeCheck,
  Info,
  Check,
  Plus, Minus
} from 'lucide-react'
import { WishlistButton } from '@/components/ui/wishlist-button'
import { AddToCartButton } from '@/components/ui/add-to-cart-button'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// --- TYPES ---
interface Product {
  id: string
  name: string
  description: string
  price: number
  currency: string
  stockQuantity: number
  images: string[]
  videoUrl?: string
  sizes: string[]
  colors: string[]
  material?: string
  careInstructions?: string
  estimatedDelivery?: number
  isCustomizable: boolean
  isPreorder: boolean
  tags: string[]
  isActive: boolean
  isInStock: boolean
  viewCount: number
  soldCount: number
  createdAt: string
  category: {
    name: string
  }
  collection?: {
    name: string
  }
  professional: {
    id: string
    firstName: string
    lastName: string
    role: string
    professionalProfile?: {
      slug: string
      businessName: string
      businessImage: string
      rating: number
      totalReviews: number
      isVerified?: boolean
    }
  }
  _count: {
    wishlistItems: number
    cartItems: number
    orderItems: number
    reviews: number
  }
  effectivePrice?: number
  isDiscountActive?: boolean
  discountAmount?: number
  discountPercentage?: number | null
  discountEndDate?: string | null
  isOnSale?: boolean
  allowPickup: boolean
  allowDelivery: boolean
}

interface Review {
  id: string
  rating: number
  title?: string
  comment?: string
  images: string[]
  isVerified: boolean
  createdAt: string
  user: {
    firstName: string
    lastName: string
    profileImage?: string
  }
  replyText?: string
  repliedAt?: string
  replyUser?: {
    firstName: string
    lastName: string
    profileImage?: string
  }
}

interface ProductClientProps {
  initialProduct: Product;
  initialReviews: Review[];
}

export default function ProductClient({ initialProduct, initialReviews }: ProductClientProps) {
  const [product] = useState<Product>(initialProduct)
  const [reviews] = useState<Review[]>(initialReviews)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const AUTO_PLAY_INTERVAL = 5000 
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!product || !isAutoPlaying || product.images.length <= 1) return
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % product.images.length)
    }, AUTO_PLAY_INTERVAL)
    return () => clearInterval(interval)
  }, [product, isAutoPlaying, activeImage])

  const handleNext = useCallback(() => {
    setActiveImage((prev) => (prev + 1) % product.images.length)
    setIsAutoPlaying(true)
  }, [product])

  const handlePrev = useCallback(() => {
    setActiveImage((prev) => (prev - 1 + product.images.length) % product.images.length)
    setIsAutoPlaying(true)
  }, [product])

  const getProfileSlug = () => {
    const profile = product?.professional?.professionalProfile;
    if (profile?.slug) return profile.slug;
    if (profile?.businessName) return profile.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `${product.professional.firstName}-${product.professional.lastName}`.toLowerCase();
  }

  const isOutOfStock = product.stockQuantity === 0 && !product.isPreorder
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5
  
  const canAddToCart = (product.sizes.length === 0 || selectedSize) && 
                      (product.colors.length === 0 || selectedColor) && 
                      (!isOutOfStock || product.isPreorder)

  return (
    <div className="relative bg-white text-[#111111] font-sans selection:bg-black selection:text-white pt-24" ref={containerRef}>
      
      <div className="max-w-7xl mx-auto lg:flex">
         
         <div className="w-full lg:w-[60%] h-[70vh] lg:h-[calc(100vh-6rem)] lg:sticky lg:top-24 bg-[#F2F2F2] rounded-[2.5rem] overflow-hidden relative group shadow-xl">
            <AnimatePresence mode="wait">
               <motion.div 
                 key={activeImage}
                 initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                 animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                 exit={{ opacity: 0, scale: 1.05, filter: "blur(5px)" }}
                 transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                 className="relative w-full h-full"
               >
                  {product.images?.[activeImage] ? (
                    <Image 
                      src={product.images[activeImage]} 
                      alt={product.name} 
                      fill 
                      className="object-cover" 
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-200 text-stone-400">
                       <ShoppingBag size={48} className="opacity-20 mb-4" />
                       <span className="text-xs font-black uppercase tracking-widest opacity-40">No Image Available</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
                  <div className="absolute bottom-12 left-10 space-y-4 max-w-[80%]">
                     <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.5em] font-mono flex items-center gap-3">
                       <div className="w-8 h-[1px] bg-white/20" />
                       Code: {product.id.slice(0, 8)}
                     </div>
                     <h1 className="text-6xl sm:text-7xl font-serif italic text-white tracking-tighter drop-shadow-lg">
                        {product.name}
                     </h1>
                  </div>
                  {product.isPreorder && (
                    <div className="absolute top-10 left-10 px-5 py-2 bg-black/80 backdrop-blur-md rounded-full border border-white/20 z-30">
                       <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Pre-order</span>
                    </div>
                  )}
               </motion.div>
            </AnimatePresence>

            <div className="absolute inset-x-0 top-0 px-8 pt-10 flex items-center gap-2 z-20">
               {product.images.map((_, i) => (
                  <button key={i} onClick={() => { setActiveImage(i); setIsAutoPlaying(true); }} className="flex-1 h-[2px] bg-white/20 relative overflow-hidden group/progress hover:bg-white/40 transition-colors">
                     {activeImage === i && (
                        <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: AUTO_PLAY_INTERVAL / 1000, ease: "linear" }} className="absolute h-full bg-white" />
                     )}
                  </button>
               ))}
            </div>

            <div className="absolute inset-y-0 inset-x-0 z-10 flex pointer-events-none">
               <div className="w-1/2 h-full flex items-center justify-start px-4 sm:px-8 cursor-pointer pointer-events-auto" onClick={handlePrev}>
                   <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/30 shadow-lg">
                      <ChevronLeft size={24} />
                   </div>
               </div>
               <div className="w-1/2 h-full flex items-center justify-end px-4 sm:px-8 cursor-pointer pointer-events-auto" onClick={handleNext}>
                   <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/30 shadow-lg">
                      <ChevronRight size={24} />
                   </div>
               </div>
            </div>
         </div>

         <div className="w-full lg:w-[40%] px-8 lg:px-20 py-20 lg:py-32 space-y-24">
            
            <div className="space-y-12">
               <div className="flex items-center justify-between">
                  {product.tags.length > 0 && (
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-900 border border-red-950/10 px-4 py-1.5 rounded-full">{product.tags[0]}</span>
                  )}
                  <WishlistButton productId={product.id} className="text-stone-400 hover:text-black transition-colors" />
               </div>

               <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                     <span className="text-sm font-mono tracking-widest text-neutral-400 italic">BY {product.professional.professionalProfile?.businessName || "TRENDIZIP"}</span>
                     <BadgeCheck size={12} className="text-blue-500" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-serif leading-tight">{product.name}</h2>
                  <div className="flex items-end gap-4 mt-2">
                     <p className="text-4xl font-serif italic">GH₵ {product.price}</p>
                     <span className="text-xs font-mono text-neutral-400 pb-1">Price includes VAT</span>
                  </div>
                  {product.isPreorder && product.estimatedDelivery && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                       <Clock size={16} className="text-blue-600" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-blue-900">Est. Delivery: {product.estimatedDelivery} Days</span>
                    </div>
                  )}
               </div>

               <p className="text-stone-500 font-serif text-lg leading-relaxed italic border-l-[1px] border-stone-100 pl-8">
                  {product.description}
               </p>

               {product.sizes.length > 0 && (
                 <div className="space-y-6 pt-8">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Available Sizes</label>
                    <div className="flex flex-wrap gap-3">
                       {product.sizes.map(size => (
                          <button 
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={cn(
                              "min-w-16 h-16 flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                              selectedSize === size ? "bg-black text-white shadow-xl shadow-black/20" : "bg-neutral-50 text-neutral-400 hover:bg-neutral-100"
                            )}
                          >
                             {size}
                          </button>
                       ))}
                    </div>
                 </div>
               )}

               {product.colors.length > 0 && (
                 <div className="space-y-6 pt-8">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Color Palette</label>
                    <div className="flex flex-wrap gap-5 px-1 py-2">
                       {product.colors.map(color => (
                          <button 
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            title={color}
                            className={cn(
                              "relative w-12 h-12 rounded-full border border-stone-200 transition-all overflow-hidden shadow-sm flex-shrink-0",
                              selectedColor === color ? "ring-2 ring-black ring-offset-4 scale-110" : "hover:scale-110"
                            )}
                            style={{ backgroundColor: color }}
                          >
                             {selectedColor === color && (
                               <span className="absolute inset-0 flex items-center justify-center bg-black/10">
                                 <Check size={18} strokeWidth={4} className="text-white drop-shadow-md mix-blend-difference" />
                               </span>
                             )}
                          </button>
                       ))}
                    </div>
                 </div>
               )}

               <div className="space-y-8">
                  <div className="flex justify-between items-end">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Order Quantity / {quantity}</label>
                    <div className="flex flex-col items-end">
                      {product.isPreorder ? (
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Available for Pre-order</span>
                      ) : isOutOfStock ? (
                        <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">Out of Stock</span>
                      ) : isLowStock ? (
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Low Stock: {product.stockQuantity} left</span>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">In Stock: {product.stockQuantity}+</span>
                      )}
                    </div>
                  </div>
                  <div className={cn("flex items-center justify-between h-16 bg-white rounded-2xl p-2 border border-black/5", isOutOfStock && !product.isPreorder && "opacity-50 pointer-events-none")}>
                     <button onClick={() => quantity > 1 && setQuantity(quantity - 1)} className="h-full px-6 flex items-center justify-center hover:bg-neutral-50 rounded-xl transition-all"><Minus size={14} /></button>
                     <span className="text-xl font-black">{quantity}</span>
                     <button onClick={() => setQuantity(product.isPreorder ? quantity + 1 : Math.min(quantity + 1, product.stockQuantity))} className="h-full px-6 flex items-center justify-center hover:bg-neutral-50 rounded-xl transition-all"><Plus size={14} /></button>
                  </div>
               </div>

               <div className="pt-10 space-y-6">
                  <AddToCartButton 
                    productId={product.id} 
                    variant="primary" 
                    selectedColor={selectedColor} 
                    selectedSize={selectedSize} 
                    quantity={quantity} 
                    isOutOfStock={isOutOfStock && !product.isPreorder}
                    className={cn(
                      "w-full h-20 rounded-[2.5rem] bg-black text-white text-[12px] font-black uppercase tracking-[0.6em] transition-all active:scale-[0.98]", 
                      (!canAddToCart || (isOutOfStock && !product.isPreorder)) && "opacity-10 pointer-events-none"
                    )} 
                  />
                  {!canAddToCart && !(isOutOfStock && !product.isPreorder) && (
                     <div className="py-3 px-4 flex items-center justify-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl animate-pulse">
                        <Info size={16} className="text-rose-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                           {product.sizes.length > 0 && !selectedSize ? "Select an available size" : "Select an available color"}
                        </span>
                     </div>
                  )}
                  {isOutOfStock && !product.isPreorder && (
                     <div className="py-2 text-center bg-rose-50 rounded-xl">
                        <span className="text-[8px] font-black uppercase tracking-widest text-rose-500">Item Currently Unavailable</span>
                     </div>
                  )}
                  {product.isPreorder && (
                    <div className="py-2 text-center bg-blue-50 rounded-xl">
                       <span className="text-[8px] font-black uppercase tracking-widest text-blue-500">This is a Pre-order item</span>
                    </div>
                  )}
               </div>
            </div>

            {product.professional?.professionalProfile && (
              <div className="relative p-12 bg-[#FAFAF9] rounded-[3.5rem] space-y-12 overflow-hidden ring-1 ring-stone-900/5">
                 <div className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                    {product.professional.professionalProfile.businessImage && (
                      <div className="relative h-24 w-24 rounded-[2rem] overflow-hidden shadow-2xl ring-8 ring-white">
                         <Image src={product.professional.professionalProfile.businessImage} alt="Seller" fill className="object-cover" />
                      </div>
                    )}
                    <div className="space-y-2">
                       <p className="text-[8px] font-black text-red-950 uppercase tracking-widest font-mono">Verified Artisan</p>
                       <h4 className="text-3xl font-serif italic">{product.professional.professionalProfile.businessName}</h4>
                       <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <Star size={12} fill="currentColor" className="text-amber-500" />
                          <span className="text-xs font-black uppercase tracking-widest">{product.professional.professionalProfile.rating || "5.0"} Stars</span>
                       </div>
                    </div>
                 </div>
                 <Link href={`/tz/${getProfileSlug()}`} className="block w-full h-16 bg-stone-950 text-white rounded-[2rem] text-[10px] font-mono uppercase tracking-widest hover:bg-black transition-all text-center leading-[64px]">
                    Enter Atelier
                 </Link>
              </div>
            )}

            {reviews.length > 0 && (
              <div className="space-y-20 border-t border-stone-100 pt-20">
                 <h3 className="text-5xl font-serif italic tracking-tighter">Buyer Tales</h3>
                 <div className="space-y-16">
                    {reviews.map(r => (
                       <motion.div key={r.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="space-y-6 border-b border-stone-50 pb-16 last:border-0">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center font-mono text-[10px] text-stone-500 uppercase">
                                   {r.user.firstName[0]}
                                </div>
                                <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">{r.user.firstName} {r.user.lastName.slice(0, 1)}.</p>
                             </div>
                             <div className="text-amber-500 text-[10px] italic font-mono font-bold tracking-widest">
                                ★ {r.rating} / Verified
                             </div>
                          </div>
                          <p className="text-xl font-serif italic text-stone-700 leading-relaxed max-w-lg">
                             &ldquo;{r.comment}&rdquo;
                          </p>
                       </motion.div>
                    ))}
                 </div>
              </div>
            )}
         </div>
      </div>

      {product.videoUrl && (
         <div className="w-full bg-white mt-12 py-20 border-t border-stone-100 text-center">
            <div className="max-w-7xl mx-auto px-8 lg:px-20 flex flex-col items-center gap-10">
                 
                 <div className="space-y-4 max-w-2xl mx-auto">
                     <h3 className="text-4xl md:text-5xl font-serif italic tracking-tighter text-stone-800">In Motion</h3>
                 </div>
                 
                 <div className="w-full max-w-3xl aspect-[3/4] md:aspect-video rounded-3xl overflow-hidden shadow-sm ring-1 ring-stone-900/5 bg-[#F2F2F2]">
                    <video 
                       src={product.videoUrl} 
                       autoPlay 
                       loop 
                       muted 
                       controls
                       playsInline 
                       className="w-full h-full object-contain md:object-cover" 
                    />
                 </div>
                 
            </div>
         </div>
      )}
    </div>
  )
}
