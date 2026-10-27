'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
   ShoppingBag, Star,
   ChevronLeft, ChevronRight,
   Clock, BadgeCheck, ShieldCheck,
   Info,
   Check,
   Plus, Minus,
   Reply,
   MapPin,
   Truck,
   PlayCircle,
   MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'
import { WishlistButton } from '@/components/ui/wishlist-button'
import { AddToCartButton } from '@/components/ui/add-to-cart-button'
import Link from 'next/link'
import NextImage from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { ChatDrawer } from '@/app/components/chat/ChatDrawer'
import ProductReviewForm from '@/components/reviews/ProductReviewForm'
import { useFashionTelemetry } from '@/hooks/useFashionTelemetry'
import { ProductCard } from '@/components/common/ProductCard'

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
   categories: {
      id: string
      name: string
      slug: string
   }[]
   collections: {
      id: string
      name: string
      slug: string
   }[]
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

interface ProductClientProps {
   initialProduct: Product;
   initialReviews: Review[];
   isLoggedIn: boolean;
   hasPurchased: boolean;
   hasReviewed: boolean;
   relatedProducts?: any[];
}

export default function ProductClient({
   initialProduct,
   initialReviews,
   isLoggedIn,
   hasPurchased,
   hasReviewed,
   relatedProducts = []
}: ProductClientProps) {
   const [product] = useState<Product>(initialProduct)
   const [reviews, setReviews] = useState<Review[]>(initialReviews)
   const [userHasReviewed, setUserHasReviewed] = useState(hasReviewed)

   const [replyingTo, setReplyingTo] = useState<string | null>(null)
   const [replyContent, setReplyContent] = useState('')
   const [isSubmittingReply, setIsSubmittingReply] = useState(false)
   const { data: session } = useSession()
   const [isChatOpen, setIsChatOpen] = useState(false)
   const [activeTab, setActiveTab] = useState<'description' | 'details' | 'shipping'>('description')
   const sellerUserId = product.professional.userId || product.professional.id
   const isOwner = Boolean(session?.user?.id && session.user.id === sellerUserId)

   const { trackImpression, trackGallerySwiped, trackSizeGuideOpened } = useFashionTelemetry(product.id)

   useEffect(() => {
      trackImpression(product.id, { name: product.name, price: product.price })
   }, [product.id, product.name, product.price, trackImpression])

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
      } catch {
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


   const isOutOfStock = product.stockQuantity === 0 && !product.isPreorder
   const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5

   const canAddToCart = (product.sizes.length === 0 || selectedSize) &&
      (product.colors.length === 0 || selectedColor) &&
      (!isOutOfStock || product.isPreorder)

   return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pt-24 lg:pt-28 pb-20">
         {/* Main Container */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 space-y-6">

            {/* PRODUCT CARD */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] border border-slate-200/80 p-4 sm:p-6 lg:p-8">
               {/* Breadcrumbs */}
               <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                  <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
                  <span className="text-slate-300">/</span>
                  {product.categories[0] && (
                     <>
                        <Link href={`/category/${product.categories[0].slug}`} className="hover:text-slate-900 transition-colors">
                           {product.categories[0].name}
                        </Link>
                        <span className="text-slate-300">/</span>
                     </>
                  )}
                  <span className="text-slate-900 font-medium truncate max-w-[200px]">{product.name}</span>
               </nav>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

                  {/* GALLERY: Left Side - Much more compact & cute */}
                  <div className="flex flex-col-reverse md:flex-row gap-3.5 h-[360px] sm:h-[400px] lg:h-[460px]"
                     onMouseEnter={() => setIsAutoPlaying(false)}
                     onMouseLeave={() => setIsAutoPlaying(true)}>

                     {/* Thumbnails */}
                     {product.images.length > 1 && (
                        <div className="flex md:flex-col gap-2.5 overflow-auto pr-1 pb-1 md:pb-0 md:w-18 shrink-0 hide-scrollbar">
                           {product.images.map((img, i) => (
                              <button
                                 key={i}
                                 onClick={() => { setActiveImage(i); setIsAutoPlaying(true); trackGallerySwiped(i, product.id); }}
                                 className={cn(
                                    "relative flex-shrink-0 w-14 h-14 md:w-full md:h-16 rounded-xl overflow-hidden transition-all duration-200",
                                    activeImage === i ? "ring-2 ring-slate-900 ring-offset-2" : "opacity-70 hover:opacity-100"
                                 )}
                              >
                                 <NextImage src={img} alt={`Thumbnail ${i}`} fill className="object-cover" sizes="80px" />
                              </button>
                           ))}
                        </div>
                     )}

                     {/* Main Image */}
                     <div className="relative flex-1 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 group">
                        <AnimatePresence mode="wait">
                           <motion.div
                              key={activeImage}
                              initial={{ opacity: 0, scale: 1.02 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.4 }}
                              className="absolute inset-0"
                           >
                              {product.images?.[activeImage] ? (
                                 <NextImage
                                    src={product.images[activeImage]}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    priority
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                 />
                              ) : (
                                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                    <ShoppingBag size={48} strokeWidth={1} className="mb-4" />
                                    <span className="text-sm font-medium">No Image</span>
                                 </div>
                              )}
                           </motion.div>
                        </AnimatePresence>

                        {/* Badges & Actions */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                           {product.isPreorder && (
                              <span className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-md">
                                 Pre-order
                              </span>
                           )}
                           {product.isDiscountActive && (
                              <span className="px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-full shadow-md">
                                 Sale {product.discountPercentage}% OFF
                              </span>
                           )}
                        </div>

                        <div className="absolute top-4 right-4 z-20">
                           <WishlistButton
                              productId={product.id}
                              className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-slate-600 hover:text-rose-500 hover:bg-white transition-all flex items-center justify-center"
                           />
                        </div>

                        {/* Arrows */}
                        {product.images.length > 1 && (
                           <>
                              <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-slate-900 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                                 <ChevronLeft size={20} />
                              </button>
                              <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-slate-900 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                                 <ChevronRight size={20} />
                              </button>
                           </>
                        )}
                     </div>
                  </div>

                  {/* DETAILS: Right Side */}
                  <div className="flex flex-col h-full">
                     <div className="mb-5">
                        <h1 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-slate-900 mb-2">
                           {product.name}
                        </h1>
                        <button onClick={scrollToReviews} className="flex items-center gap-2 mb-4 group">
                           <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                 <Star key={s} size={16} fill={s <= (product.professional.professionalProfile?.rating || 5) ? "#f59e0b" : "none"} className={s <= (product.professional.professionalProfile?.rating || 5) ? "text-amber-500" : "text-slate-300"} />
                              ))}
                           </div>
                           <span className="text-sm text-slate-500 group-hover:text-slate-900 transition-colors font-medium">
                              {reviews.length} Reviews
                           </span>
                        </button>

                        <div className="flex items-end gap-3">
                           <span className="text-3xl font-bold text-slate-900">
                              GH₵ {product.price.toLocaleString()}
                           </span>
                           {product.isDiscountActive && product.effectivePrice && (
                              <span className="text-lg text-slate-400 line-through mb-1">
                                 GH₵ {product.effectivePrice.toLocaleString()}
                              </span>
                           )}
                        </div>
                     </div>

                     <div className="h-px bg-slate-100 mb-6" />

                     {/* Options */}
                     <div className="space-y-6 mb-8">
                        {/* Sizes */}
                        {product.sizes.length > 0 && (
                           <div>
                              <div className="flex justify-between items-center mb-3">
                                 <span className="text-sm font-semibold text-slate-900">Select Size</span>
                                 {selectedSize && <span className="text-sm text-slate-500">{selectedSize}</span>}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                 {product.sizes.map(size => (
                                    <button
                                       key={size}
                                       onClick={() => setSelectedSize(size)}
                                       className={cn(
                                          "px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border",
                                          selectedSize === size
                                             ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                             : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                                       )}
                                    >
                                       {size}
                                    </button>
                                 ))}
                              </div>
                           </div>
                        )}

                        {/* Colors */}
                        {product.colors.length > 0 && (
                           <div>
                              <div className="flex justify-between items-center mb-3">
                                 <span className="text-sm font-semibold text-slate-900">Select Color</span>
                                 {selectedColor && <span className="text-sm text-slate-500 capitalize">{selectedColor}</span>}
                              </div>
                              <div className="flex flex-wrap gap-3">
                                 {product.colors.map(color => (
                                    <button
                                       key={color}
                                       onClick={() => setSelectedColor(color)}
                                       title={color}
                                       className={cn(
                                          "relative w-12 h-12 rounded-full transition-all ring-2 ring-offset-2",
                                          selectedColor === color ? "ring-slate-900 scale-110" : "ring-transparent hover:scale-105"
                                       )}
                                       style={{ backgroundColor: color }}
                                    >
                                       {selectedColor === color && (
                                          <span className="absolute inset-0 flex items-center justify-center drop-shadow-md">
                                             <Check size={18} strokeWidth={3} className="text-white" />
                                          </span>
                                       )}
                                    </button>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>

                     {/* Action Area */}
                     <div className="mt-auto flex flex-col gap-4">
                        <div className="flex items-center justify-between text-sm">
                           <span className="font-semibold text-slate-900">Quantity</span>
                           <span className={cn(
                              "font-medium",
                              isOutOfStock && !product.isPreorder ? "text-rose-500" :
                                 isLowStock ? "text-amber-500" : "text-emerald-500"
                           )}>
                              {product.isPreorder ? 'Available for Pre-order' :
                                 isOutOfStock ? 'Out of stock' :
                                    isLowStock ? `Low stock (${product.stockQuantity})` : 'In stock'}
                           </span>
                        </div>

                        <div className="flex gap-4">
                           {/* Qty Selector */}
                           <div className={cn(
                              "flex items-center bg-slate-100 rounded-full px-2 h-14 w-32",
                              isOutOfStock && !product.isPreorder && "opacity-50 pointer-events-none"
                           )}>
                              <button onClick={() => quantity > 1 && setQuantity(quantity - 1)} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                                 <Minus size={16} />
                              </button>
                              <span className="flex-1 text-center font-semibold text-slate-900">{quantity}</span>
                              <button onClick={() => setQuantity(product.isPreorder ? quantity + 1 : Math.min(quantity + 1, product.stockQuantity))} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                                 <Plus size={16} />
                              </button>
                           </div>

                           {/* Add to Cart */}
                           <AddToCartButton
                              productId={product.id}
                              variant="primary"
                              showText={true}
                              selectedColor={selectedColor}
                              selectedSize={selectedSize}
                              quantity={quantity}
                              isOutOfStock={isOutOfStock && !product.isPreorder}
                              className={cn(
                                 "flex-1 h-14 rounded-full bg-slate-900 text-white font-semibold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98]",
                                 (!canAddToCart || (isOutOfStock && !product.isPreorder)) && "bg-slate-300 text-slate-500 shadow-none pointer-events-none"
                              )}
                           />
                        </div>

                        {!canAddToCart && !(isOutOfStock && !product.isPreorder) && (
                           <div className="flex items-center justify-center gap-2 text-sm font-medium text-amber-600 bg-amber-50 p-3 rounded-xl mt-2">
                              <Info size={16} />
                              {product.sizes.length > 0 && !selectedSize ? "Please select a size to continue" : "Please select a color to continue"}
                           </div>
                        )}
                     </div>

                     {/* Tabs for extra details */}
                     <div className="mt-8 pt-8 border-t border-slate-100">
                        <div className="flex gap-6 border-b border-slate-100 mb-4">
                           {(['description', 'details', 'shipping'] as const).map((tab) => (
                              <button
                                 key={tab}
                                 onClick={() => {
                                    setActiveTab(tab);
                                    if (tab === 'details') trackSizeGuideOpened(product.id);
                                 }}
                                 className={cn(
                                    "pb-3 text-sm font-semibold capitalize transition-all border-b-2",
                                    activeTab === tab
                                       ? "border-slate-900 text-slate-900"
                                       : "border-transparent text-slate-400 hover:text-slate-600"
                                 )}
                              >
                                 {tab}
                              </button>
                           ))}
                        </div>
                        <div className="text-sm text-slate-600 leading-relaxed min-h-[80px]">
                           {activeTab === 'description' && (
                              <p>{product.description}</p>
                           )}
                           {activeTab === 'details' && (
                              <div className="space-y-3">
                                 {product.material && <p><strong className="text-slate-900 font-medium">Material:</strong> {product.material}</p>}
                                 {product.careInstructions && <p><strong className="text-slate-900 font-medium">Care:</strong> {product.careInstructions}</p>}
                                 {!product.material && !product.careInstructions && <p className="text-slate-400">No additional details provided.</p>}
                              </div>
                           )}
                           {activeTab === 'shipping' && (
                              <div className="space-y-3">
                                 {product.isPreorder && product.estimatedDelivery && (
                                    <p className="flex items-center gap-2"><Clock size={16} className="text-indigo-500" /> Ships in {product.estimatedDelivery} days</p>
                                 )}
                                 <p className="flex items-center gap-2">
                                    <Truck size={16} className="text-indigo-500" />
                                    {product.allowPickup && product.allowDelivery ? 'Available for Pickup & Delivery' :
                                       product.allowPickup ? 'Available for Pickup only' :
                                          product.allowDelivery ? 'Available for Delivery only' : 'Contact seller for delivery options'}
                                 </p>
                              </div>
                           )}
                        </div>
                     </div>

                  </div>
               </div>
            </div>

            {/* SECONDARY ROW: Video & Seller Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

               {/* Seller Card */}
               <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-6 mb-6">
                     <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 shrink-0 border-2 border-white shadow-md relative">
                        {product.professional.professionalProfile?.businessImage ? (
                           <NextImage
                              src={product.professional.professionalProfile.businessImage}
                              alt={product.professional.professionalProfile.businessName}
                              fill
                              className="object-cover"
                           />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl">
                              {product.professional.professionalProfile?.businessName?.[0] || "T"}
                           </div>
                        )}
                     </div>
                     <div>
                        <Link href={`/tz/${product.professional.professionalProfile?.slug}`} className="flex items-center gap-1 text-xl font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                           {product.professional.professionalProfile?.businessName || "TRENDIZIP Artisan"}
                           {product.professional.professionalProfile?.isVerified && (
                              <BadgeCheck size={18} className="text-indigo-500" />
                           )}
                        </Link>
                        {product.professional.professionalProfile?.location && (
                           <p className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                              <MapPin size={14} /> {product.professional.professionalProfile.location}
                           </p>
                        )}
                     </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6 line-clamp-3">
                     {product.professional.professionalProfile?.bio || "Committed to delivering high-quality craftsmanship and unique designs."}
                  </p>

                  <div className="flex items-center gap-4 mt-auto">
                     <Link href={`/tz/${product.professional.professionalProfile?.slug}`} className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-900 text-sm font-semibold hover:bg-slate-200 transition-colors">
                        View Store
                     </Link>
                     {isOwner ? (
                        <span className="px-4 py-2.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                           Your Product Listing
                        </span>
                     ) : (
                        <button
                           onClick={() => {
                              if (!session) return toast.error("Please sign in to message this professional");
                              setIsChatOpen(true);
                           }}
                           className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 text-sm font-semibold hover:border-slate-900 hover:text-slate-900 transition-colors"
                        >
                           <MessageSquare size={16} /> Contact Seller
                        </button>
                     )}
                  </div>
               </div>

               {/* Video or Trust Card */}
               {product.videoUrl ? (
                  <div className="bg-slate-900 rounded-[2rem] shadow-sm overflow-hidden relative min-h-[300px] flex items-center justify-center group">
                     <video src={product.videoUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                     <div className="relative z-10 text-center p-8">
                        <PlayCircle size={48} className="text-white/80 mx-auto mb-4" strokeWidth={1.5} />
                        <h3 className="text-xl font-bold text-white mb-2">See it in motion</h3>
                        <p className="text-white/70 text-sm">Experience the product details and fit.</p>
                     </div>
                  </div>
               ) : (
                  <div className="bg-indigo-50 rounded-[2rem] shadow-sm border border-indigo-100 p-8 flex flex-col justify-center">
                     <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
                        <ShieldCheck size={24} />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 mb-3">TrendiZip Protection</h3>
                     <p className="text-sm text-slate-600 leading-relaxed">
                        Shop with confidence. Your payment is held securely until you confirm receipt of your items.
                        We guarantee a safe transaction process.
                     </p>
                  </div>
               )}
            </div>

            {/* REVIEWS SECTION */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 lg:p-10" ref={reviewsRef}>
               <div className="flex flex-col lg:flex-row gap-12">

                  {/* Review Form / Stats */}
                  <div className="lg:w-1/3">
                     <h2 className="text-2xl font-bold text-slate-900 mb-2">Customer Reviews</h2>
                     <div className="flex items-center gap-3 mb-8">
                        <div className="flex text-amber-500">
                           {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={20} fill={s <= (product.professional.professionalProfile?.rating || 5) ? "currentColor" : "none"} />
                           ))}
                        </div>
                        <span className="font-semibold text-slate-900">{product.professional.professionalProfile?.rating || 5.0}</span>
                        <span className="text-slate-500 text-sm">({reviews.length} reviews)</span>
                     </div>

                     <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
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
                     </div>
                  </div>

                  {/* Review List */}
                  <div className="lg:w-2/3 space-y-6">
                     {reviews.length > 0 ? (
                        reviews.map(r => (
                           <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm overflow-hidden">
                                       {r.user.profileImage ? (
                                          <NextImage src={r.user.profileImage} alt="" width={40} height={40} className="object-cover" />
                                       ) : (
                                          <span>{r.user.firstName[0]}{r.user.lastName[0]}</span>
                                       )}
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-2">
                                          <span className="font-semibold text-slate-900">{r.user.firstName} {r.user.lastName[0]}.</span>
                                          {r.isVerified && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Verified</span>}
                                       </div>
                                       <span className="text-xs text-slate-400">
                                          {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                       </span>
                                    </div>
                                 </div>
                                 <div className="flex text-amber-500">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                       <Star key={s} size={14} fill={s <= r.rating ? "currentColor" : "none"} />
                                    ))}
                                 </div>
                              </div>

                              <p className="text-slate-700 text-sm leading-relaxed mb-4">{r.comment}</p>

                              <button onClick={() => setReplyingTo(replyingTo === r.id ? null : r.id)} className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                                 <Reply size={14} /> {replyingTo === r.id ? 'Cancel' : 'Reply'}
                              </button>

                              <AnimatePresence>
                                 {replyingTo === r.id && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4">
                                       <div className="flex gap-2">
                                          <input
                                             value={replyContent}
                                             onChange={(e) => setReplyContent(e.target.value)}
                                             placeholder="Write a reply..."
                                             className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          />
                                          <button disabled={isSubmittingReply || !replyContent.trim()} onClick={() => handleReplySubmit(r.id)} className="bg-slate-900 text-white px-5 rounded-full text-sm font-semibold hover:bg-slate-800 disabled:opacity-50">
                                             {isSubmittingReply ? '...' : 'Send'}
                                          </button>
                                       </div>
                                    </motion.div>
                                 )}
                              </AnimatePresence>

                              {r.replies?.length > 0 && (
                                 <div className="mt-4 pl-4 border-l-2 border-slate-100 space-y-4">
                                    {r.replies.map(reply => (
                                       <div key={reply.id} className="flex gap-3">
                                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden shrink-0">
                                             {reply.user.profileImage ? (
                                                <NextImage src={reply.user.profileImage} alt="" width={32} height={32} className="object-cover" />
                                             ) : (
                                                <span>{reply.user.firstName[0]}</span>
                                             )}
                                          </div>
                                          <div className="bg-slate-50 rounded-2xl rounded-tl-none p-3 flex-1 border border-slate-100">
                                             <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-xs text-slate-900">{reply.user.firstName}</span>
                                                {reply.user.id === product.professional.id && (
                                                   <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">Seller</span>
                                                )}
                                                <span className="text-[10px] text-slate-400 ml-auto">
                                                   {new Date(reply.createdAt).toLocaleDateString()}
                                                </span>
                                             </div>
                                             <p className="text-xs text-slate-600">{reply.comment}</p>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </motion.div>
                        ))
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl">
                           <MessageSquare size={32} className="text-slate-300 mb-3" />
                           <h3 className="text-lg font-bold text-slate-900">No reviews yet</h3>
                           <p className="text-sm text-slate-500 max-w-sm mt-1">Be the first to share your experience with this item to help others make a decision.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Related Products Section */}
            {relatedProducts && relatedProducts.length > 0 && (
               <section className="pt-8 sm:pt-10 border-t border-slate-200/80">
                  <div className="flex items-center justify-between mb-5">
                     <div>
                        <h2 className="text-xl sm:text-2xl font-serif font-medium text-stone-900 tracking-tight">
                           You May Also Like
                        </h2>
                        <p className="text-xs text-stone-500 font-sans mt-0.5">
                           Handcrafted pieces from our designers
                        </p>
                     </div>
                     <Link
                        href="/shopping"
                        className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 transition-colors"
                     >
                        <span>Explore More</span>
                        <ChevronRight size={14} />
                     </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 lg:gap-4">
                     {relatedProducts.map((item, index) => (
                        <ProductCard key={item.id} item={item} index={index} />
                     ))}
                  </div>
               </section>
            )}
         </div>

         <ChatDrawer
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            professionalId={product.professional.id}
            professionalName={product.professional.professionalProfile?.businessName || `${product.professional.firstName} ${product.professional.lastName}`}
            professionalImage={product.professional.professionalProfile?.businessImage}
            currentUserId={session?.user?.id || ''}
         />
      </div>
   )
}