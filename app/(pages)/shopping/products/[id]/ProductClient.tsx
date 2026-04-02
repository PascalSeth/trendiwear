'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  ShoppingBag, Star,
  ChevronLeft, ChevronRight, 
  Clock, BadgeCheck,
  Info,
  Check,
  Plus, Minus,
  Reply,
  ArrowRight,
  MapPin
} from 'lucide-react'
import { toast } from 'sonner'
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
    userId: string
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
      bio?: string
      location?: string
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

interface ReviewReply {
  id: string
  comment: string
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    profileImage?: string
  }
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
  replies: ReviewReply[]
}

import ProductReviewForm from '@/components/reviews/ProductReviewForm'

interface ProductClientProps {
  initialProduct: Product;
  initialReviews: Review[];
  isLoggedIn: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
}

export default function ProductClient({ 
  initialProduct, 
  initialReviews,
  isLoggedIn,
  hasPurchased,
  hasReviewed
}: ProductClientProps) {
  const [product] = useState<Product>(initialProduct)
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [userHasReviewed, setUserHasReviewed] = useState(hasReviewed)
  
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyContent.trim()) return
    if (!isLoggedIn) {
      toast.error('Please sign in to reply.')
      return
    }

    setIsSubmittingReply(true)
    try {
      const res = await fetch('/api/reviews/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, comment: replyContent })
      })
      const newReply = await res.json()
      if (res.ok) {
        setReviews(prev => prev.map(rev => 
          rev.id === reviewId 
            ? { ...rev, replies: [...rev.replies, newReply] } 
            : rev
        ))
        setReplyContent('')
        setReplyingTo(null)
        toast.success('Reply shared!')
      } else {
        toast.error('Failed to post reply')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSubmittingReply(false)
    }
  }
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const AUTO_PLAY_INTERVAL = 5000 
  const containerRef = useRef<HTMLDivElement>(null)
  const reviewsRef = useRef<HTMLDivElement>(null)

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
      
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 px-4 md:px-8 lg:px-12 pb-24 border-b border-stone-100">
         
         <div className="lg:col-span-7 h-[65vh] lg:h-[min(80vh,850px)] lg:sticky lg:top-32 bg-[#F2F2F2] rounded-[2rem] overflow-hidden relative group shadow-2xl ring-1 ring-black/5">
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
                     <h1 className="text-4xl sm:text-5xl font-serif italic text-white tracking-tighter drop-shadow-lg">
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

         <div className="lg:col-span-5 py-8 lg:py-12 space-y-16">
            
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

                  {/* Rating Summary added for visibility */}
                  <div className="flex items-center gap-6 mt-4">
                     <div className="flex items-center gap-1 group cursor-pointer" onClick={scrollToReviews}>
                        {[1, 2, 3, 4, 5].map((s) => (
                           <Star 
                             key={s} 
                             size={12} 
                             fill={s <= (product.professional.professionalProfile?.rating || 5) ? "currentColor" : "none"} 
                             className={cn(s <= (product.professional.professionalProfile?.rating || 5) ? "text-amber-500" : "text-stone-200")} 
                           />
                        ))}
                        <span className="text-[10px] font-black uppercase tracking-widest ml-2 border-b border-black/10 group-hover:border-black transition-all">
                           {reviews.length} Buyer Tales
                        </span>
                     </div>
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


         </div>
      </div>

      {/* 1. In Motion - Video Showcase */}
      {product.videoUrl && (
         <div className="w-full bg-[#FAFAF9] py-16 md:py-24 border-b border-stone-100 text-center relative overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 flex flex-col items-center gap-8 relative z-10">
                 <div className="space-y-4 max-w-2xl mx-auto">
                     <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400 font-mono">The Showcase</p>
                     <h3 className="text-3xl md:text-5xl font-serif italic tracking-tighter text-stone-900">In Motion</h3>
                 </div>
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}
                    className="w-full max-w-[900px] aspect-video rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-stone-900/10 bg-[#E8E8E8]"
                 >
                    <video 
                       src={product.videoUrl} 
                       autoPlay 
                       loop 
                       muted 
                       controls
                       playsInline 
                       className="w-full h-full object-cover transition-transform hover:scale-105 duration-1000" 
                    />
                 </motion.div>
            </div>
         </div>
      )}

      {/* 2. Sleek Artisan / Designer Banner */}
      {product.professional?.professionalProfile && (
         <section className="w-full py-16 md:py-24 bg-white border-b border-stone-100 relative">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
               <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="lg:col-span-5 relative group">
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-lg ring-1 ring-black/5">
                     {product.professional.professionalProfile?.businessImage ? (
                        <Image 
                           src={product.professional.professionalProfile.businessImage} 
                           alt="Atelier" 
                           fill 
                           className="object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105" 
                        />
                     ) : (
                        <div className="w-full h-full bg-stone-50 flex items-center justify-center text-stone-300 italic serif text-2xl">Atelier</div>
                     )}
                  </div>
               </motion.div>

               <div className="lg:col-span-7 space-y-8">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-[0.5em] text-red-900/40 font-mono">Designed By</p>
                     <h3 className="text-4xl md:text-5xl font-serif italic tracking-tighter text-stone-900">
                        {product.professional.professionalProfile?.businessName}
                     </h3>
                  </div>
                  <p className="text-lg md:text-xl font-serif text-stone-600 leading-relaxed italic border-l-2 border-stone-100 pl-6 max-w-2xl">
                     &ldquo;{product.professional.professionalProfile?.bio || "Every piece tells a story of heritage, precision, and the pursuit of timeless elegance."}&rdquo;
                  </p>
                  <div className="flex items-center gap-8 pt-4">
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Provenance</p>
                        <div className="flex items-center gap-1.5 text-stone-950 font-mono text-xs uppercase tracking-widest mt-1">
                           <MapPin size={12} className="text-red-900" />
                           {product.professional.professionalProfile?.location || "Accra"}
                        </div>
                     </div>
                     <div className="h-8 w-px bg-stone-200" />
                     <Link 
                        href={`/tz/${product.professional.professionalProfile?.slug}`} 
                        className="group inline-flex h-12 px-8 bg-stone-950 text-white rounded-full items-center justify-center transition-all hover:bg-black hover:scale-[1.02] active:scale-95 shadow-lg shadow-stone-900/10"
                     >
                        <span className="text-[10px] font-black uppercase tracking-widest">Visit Atelier</span>
                        <ArrowRight size={14} className="ml-3 group-hover:translate-x-1 transition-transform" />
                     </Link>
                  </div>
               </div>
            </div>
         </section>
      )}

      {/* 3. Review Section (Last) */}
      <div className="w-full bg-[#FAFAF9] py-20 md:py-28" ref={reviewsRef}>
         <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-32 h-fit">
               <ProductReviewForm 
                 productId={product.id}
                 isLoggedIn={isLoggedIn}
                 hasPurchased={hasPurchased}
                 hasReviewed={userHasReviewed}
                 onSuccess={async () => {
                    const res = await fetch(`/api/reviews?targetId=${product.id}&targetType=PRODUCT`)
                    const data = await res.json()
                    if (res.ok) {
                       setReviews(data.reviews)
                       setUserHasReviewed(true)
                    }
                 }}
               />
               <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 px-6 border-l border-stone-200">
                  Sharing your experience helps artisans improve and helps buyers decide.
               </p>
            </div>
            
            <div className="lg:col-span-8 space-y-12">
               <div className="flex items-end justify-between border-b border-stone-200 pb-6">
                  <h3 className="text-4xl font-serif italic tracking-tighter">Buyer Tales</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">{reviews.length} Experiences</span>
                  </div>
               </div>
               
               <div className="space-y-8">
                  {reviews.length > 0 ? (
                    reviews.map(r => (
                       <motion.div key={r.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-5 border-b border-stone-100 pb-10 last:border-0">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-white border border-stone-100 flex items-center justify-center font-mono text-[10px] text-stone-400 uppercase shadow-sm">
                                   {r.user.firstName[0]}{r.user.lastName[0]}
                                </div>
                                <div>
                                   <p className="text-[10px] font-black uppercase tracking-widest text-stone-900">{r.user.firstName} {r.user.lastName.slice(0, 1)}.</p>
                                   <p className="text-[8px] font-mono uppercase tracking-widest text-stone-400">
                                      {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                   </p>
                                </div>
                             </div>
                             <div className="flex items-center gap-2 text-[9px] font-bold tracking-widest uppercase">
                                <div className="flex items-center gap-0.5">
                                   {[1, 2, 3, 4, 5].map((s) => (
                                      <Star key={s} size={10} fill={s <= r.rating ? "currentColor" : "none"} className={s <= r.rating ? "text-amber-500" : "text-stone-200"} />
                                   ))}
                                </div>
                                {r.isVerified && <span className="text-[8px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">Verified</span>}
                             </div>
                          </div>
                          <p className="text-lg font-serif italic text-stone-700 leading-relaxed max-w-2xl">
                             &ldquo;{r.comment}&rdquo;
                          </p>

                          <div className="flex items-center gap-6 pt-2">
                             <button
                               onClick={() => setReplyingTo(replyingTo === r.id ? null : r.id)}
                               className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-950 transition-colors"
                             >
                                <Reply size={12} />
                                {replyingTo === r.id ? 'Cancel' : 'Reply'}
                             </button>
                          </div>

                          <div className="space-y-4 mt-4">
                             <AnimatePresence>
                                {replyingTo === r.id && (
                                   <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="ml-6 lg:ml-12 overflow-hidden">
                                      <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
                                         <textarea
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder="Join the conversation..."
                                            className="w-full bg-transparent border-none p-0 text-sm font-serif italic text-stone-700 focus:ring-0 resize-none min-h-[60px]"
                                         />
                                         <div className="flex justify-end gap-3">
                                            <button
                                               onClick={() => setReplyingTo(null)}
                                               className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600"
                                            >
                                               Discard
                                            </button>
                                            <button
                                               disabled={isSubmittingReply || !replyContent.trim()}
                                               onClick={() => handleReplySubmit(r.id)}
                                               className="px-6 py-2 bg-stone-950 text-white text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-black transition-all disabled:opacity-30"
                                            >
                                               {isSubmittingReply ? 'Posting...' : 'Share Reply'}
                                            </button>
                                         </div>
                                      </div>
                                   </motion.div>
                                )}
                             </AnimatePresence>

                             {r.replies?.map(reply => {
                                const isSeller = reply.user.id === product.professional.id;
                                return (
                                   <motion.div key={reply.id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="ml-6 lg:ml-12 p-5 bg-stone-50/50 rounded-2xl border-l border-stone-200 space-y-3">
                                      <div className="flex items-center justify-between">
                                         <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-white border border-stone-100 flex items-center justify-center font-mono text-[9px] text-stone-400 uppercase shadow-sm">
                                               {reply.user.firstName[0]}{reply.user.lastName[0]}
                                            </div>
                                            <div>
                                               <div className="flex items-center gap-2">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-900">{reply.user.firstName} {reply.user.lastName.slice(0, 1)}.</p>
                                                  {isSeller && (
                                                     <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">Seller</span>
                                                  )}
                                               </div>
                                               <p className="text-[8px] font-mono uppercase tracking-widest text-stone-400">
                                                  {new Date(reply.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                               </p>
                                            </div>
                                         </div>
                                      </div>
                                      <p className="text-[15px] font-serif italic text-stone-600 leading-relaxed">
                                         &ldquo;{reply.comment}&rdquo;
                                      </p>
                                   </motion.div>
                                )
                             })}
                          </div>
                       </motion.div>
                    ))
                  ) : (
                    <div className="py-16 text-center space-y-3 bg-white rounded-[2rem] border border-stone-100 shadow-sm">
                      <p className="text-stone-300 text-4xl font-serif italic">No tales yet...</p>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Be the first to share your experience with this piece.</p>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>

    </div>
  )
}
