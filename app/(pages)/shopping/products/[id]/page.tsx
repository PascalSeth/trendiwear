'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingBag, Star, Eye, ArrowLeft, Share2, MessageCircle, Truck, Shield, RotateCcw, ChevronLeft, ChevronRight, Maximize2, Clock, BadgeCheck, Send, Loader2, Reply } from 'lucide-react'
import { WishlistButton } from '@/components/ui/wishlist-button'
import { AddToCartButton } from '@/components/ui/add-to-cart-button'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

// --- TYPES (Preserved) ---
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
    firstName: string
    lastName: string
    professionalProfile?: {
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
  // Discount fields from API
  effectivePrice?: number
  isDiscountActive?: boolean
  discountAmount?: number
  discountPercentage?: number | null
  discountEndDate?: string | null
  isOnSale?: boolean
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
  // Reply fields
  replyText?: string
  repliedAt?: string
  replyUser?: {
    firstName: string
    lastName: string
    profileImage?: string
  }
}

// Countdown hook for discount timer
function useCountdown(endDate: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState('')
  
  useEffect(() => {
    if (!endDate) return
    
    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime()
      const now = Date.now()
      const diff = end - now
      
      if (diff <= 0) return ''
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (days > 0) return `${days}d ${hours}h`
      if (hours > 0) return `${hours}h ${minutes}m`
      return `${minutes}m`
    }
    
    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000)
    return () => clearInterval(timer)
  }, [endDate])
  
  return timeLeft
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  // --- STATE (Preserved) ---
  const { data: session } = useSession()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const timeLeft = useCountdown(product?.discountEndDate)
  
  // Review form state
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  
  // Reply form state
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  // --- LOGIC (Preserved) ---
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const resolvedParams = await params
        const response = await fetch(`/api/products/${resolvedParams.id}`)
        if (response.ok) {
          const productData = await response.json()
          setProduct(productData)
          
          // Fetch reviews for this product
          const reviewsResponse = await fetch(`/api/reviews?targetId=${resolvedParams.id}&targetType=PRODUCT&limit=10`)
          if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json()
            setReviews(reviewsData.reviews || [])
          }
        }
      } catch (error) {
        console.error('Failed to fetch product:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params])

  // Check if user has already reviewed this product
  useEffect(() => {
    if (session?.user && reviews.length > 0) {
      const userReview = reviews.find(
        (r) => r.user.firstName === session.user?.name?.split(' ')[0]
      )
      setHasReviewed(!!userReview)
    }
  }, [session, reviews])

  const handleSubmitReview = async () => {
    if (!session) {
      toast.error('Please sign in to submit a review')
      return
    }

    if (!product) return

    setSubmittingReview(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: product.id,
          targetType: 'PRODUCT',
          rating: reviewRating,
          title: reviewTitle || undefined,
          comment: reviewComment || undefined,
        }),
      })

      if (response.ok) {
        const newReview = await response.json()
        setReviews((prev) => [newReview, ...prev])
        setReviewRating(5)
        setReviewTitle('')
        setReviewComment('')
        setHasReviewed(true)
        toast.success('Review submitted successfully!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
      toast.error('Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleSubmitReply = async (reviewId: string) => {
    if (!session) {
      toast.error('Please sign in to reply')
      return
    }

    if (!replyText.trim()) {
      toast.error('Please enter a reply')
      return
    }

    setSubmittingReply(true)
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyText: replyText.trim() }),
      })

      if (response.ok) {
        const updatedReview = await response.json()
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? updatedReview : r))
        )
        setReplyingToId(null)
        setReplyText('')
        toast.success('Reply submitted successfully!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit reply')
      }
    } catch (error) {
      console.error('Failed to submit reply:', error)
      toast.error('Failed to submit reply')
    } finally {
      setSubmittingReply(false)
    }
  }

  const nextImage = () => {
    if (product && currentImageIndex < product.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  // --- VISUALS (Redesigned) ---

  if (loading) {
    return (
      <div className="min-h-screen  bg-[#FAFAF9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent animate-spin"></div>
          <span className="font-mono text-xs uppercase tracking-widest text-stone-500">Loading Artifacts</span>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-medium text-stone-900 mb-4">Product Not Found</h1>
          <Link href="/shopping" className="font-mono text-sm uppercase tracking-widest underline decoration-stone-400 underline-offset-4 text-stone-600 hover:text-stone-900">
            Back to Shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 bg-[#FAFAF9] text-stone-900 selection:bg-stone-900 selection:text-stone-50 pb-24">
      
      {/* Minimal Top Bar */}
      <div className=" px-6 py-4 flex justify-between items-center mix-blend-difference text-white">
        <Link href="/shopping" className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest hover:text-stone-300 transition-colors">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="flex items-center gap-4">
          <button className="hover:text-stone-300 transition-colors">
            <Share2 size={18} />
          </button>
          <WishlistButton productId={product.id} variant="default" />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto pt-20 px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* LEFT: Gallery (Takes 7 cols) */}
          <div className="lg:col-span-7 lg:sticky lg:top-24 h-fit">
            <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden border border-stone-100 mb-4 group">
              {/* Main Image */}
              <Image
                src={product.images[currentImageIndex] || "/placeholder-product.jpg"}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                priority
              />

              {/* Minimalist Navigation Arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    disabled={currentImageIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/40 backdrop-blur-md rounded-full border border-white/20 text-white transition-all disabled:opacity-0 disabled:pointer-events-none"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    disabled={currentImageIndex === product.images.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/40 backdrop-blur-md rounded-full border border-white/20 text-white transition-all disabled:opacity-0 disabled:pointer-events-none"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Expand Button Overlay */}
              <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/40 backdrop-blur-md rounded-full border border-white/20 text-white transition-all">
                <Maximize2 size={16} />
              </button>
            </div>

            {/* Thumbnails (Horizontal Strip) */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "flex-shrink-0 w-20 h-24 bg-stone-100 border transition-all relative overflow-hidden",
                      idx === currentImageIndex ? "border-stone-900 opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                    )}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Details (Takes 5 cols) */}
          <div className="lg:col-span-5 lg:pt-4">
            
            {/* Breadcrumb / Category & Sale Badge */}
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
                {product.category.name}
              </span>
              {product.isDiscountActive && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 flex items-center gap-1">
                  {product.discountPercentage ? `${product.discountPercentage}% OFF` : 'SALE'}
                  {timeLeft && (
                    <span className="flex items-center gap-0.5 ml-1 opacity-90">
                      <Clock size={8} />
                      {timeLeft}
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-stone-900 leading-[1.1] mb-6">
              {product.name}
            </h1>

            {/* Price & Rating */}
            <div className="flex items-end justify-between mb-8 pb-8 border-b border-stone-200">
              <div>
                <span className="block font-mono text-xs uppercase tracking-widest text-stone-500 mb-1">Price</span>
                {product.isDiscountActive ? (
                  <div>
                    <span className="text-lg text-stone-400 line-through mr-2">
                      {product.currency} {product.price.toFixed(2)}
                    </span>
                    <span className="text-3xl font-medium text-red-600">
                      {product.currency} {(product.effectivePrice || product.price).toFixed(2)}
                    </span>
                    {product.discountAmount && product.discountAmount > 0 && (
                      <span className="ml-2 text-sm text-green-600 font-medium">
                        Save {product.currency} {product.discountAmount.toFixed(2)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-3xl font-medium text-stone-900">
                    {product.currency} {product.price.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end text-stone-900">
                  <Star size={14} className="fill-current text-stone-900" />
                  <span className="font-medium">{product.professional.professionalProfile?.rating ? product.professional.professionalProfile.rating.toFixed(1) : 'New'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-stone-500 mt-1">
                  <span className="flex items-center gap-1"><Eye size={12} /> {product.viewCount}</span>
                  <span className="flex items-center gap-1"><ShoppingBag size={12} /> {product.soldCount}</span>
                </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="space-y-4 mb-12">
              <AddToCartButton
                productId={product.id}
                variant="primary"
                size="lg"
                className="w-full bg-stone-900 !text-white hover:bg-stone-800 rounded-none py-6 font-mono text-sm uppercase tracking-widest transition-colors"
              />
              <button className="w-full border border-stone-200 hover:border-stone-900 py-4 font-mono text-sm uppercase tracking-widest text-stone-700 hover:text-stone-900 transition-colors">
                Contact Seller
              </button>
            </div>

            {/* Specifications (Minimalist Grid) */}
            <div className="space-y-8 mb-12">
              
              {/* Status */}
              <div className="flex items-center justify-between py-4 border-b border-stone-100">
                 <span className="font-mono text-xs uppercase tracking-widest text-stone-500">Availability</span>
                 <span className={cn("font-mono text-sm", product.isInStock ? "text-stone-900" : "text-red-600")}>
                    {product.isInStock ? 'In Stock' : 'Sold Out'}
                 </span>
              </div>

              {/* Sizes */}
              {product.sizes.length > 0 && (
                <div className="py-4 border-b border-stone-100">
                  <span className="block font-mono text-xs uppercase tracking-widest text-stone-500 mb-3">Size</span>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size, idx) => (
                      <button
                        key={idx}
                        className="w-10 h-10 border border-stone-200 hover:border-stone-900 hover:bg-stone-50 text-sm font-mono flex items-center justify-center transition-all"
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {product.colors.length > 0 && (
                <div className="py-4 border-b border-stone-100">
                  <span className="block font-mono text-xs uppercase tracking-widest text-stone-500 mb-3">Color</span>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 border border-stone-200 hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: color.toLowerCase() }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6 py-4">
                {product.material && (
                  <div>
                    <span className="block font-mono text-xs uppercase tracking-widest text-stone-500 mb-1">Material</span>
                    <span className="text-sm text-stone-800">{product.material}</span>
                  </div>
                )}
                {product.estimatedDelivery && (
                  <div>
                    <span className="block font-mono text-xs uppercase tracking-widest text-stone-500 mb-1">Delivery</span>
                    <span className="text-sm text-stone-800">{product.estimatedDelivery} Days</span>
                  </div>
                )}
                <div>
                  <span className="block font-mono text-xs uppercase tracking-widest text-stone-500 mb-1">Customizable</span>
                  <span className="text-sm text-stone-800">{product.isCustomizable ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="block font-mono text-xs uppercase tracking-widest text-stone-500 mb-1">Quantity</span>
                  <span className="text-sm text-stone-800">{product.stockQuantity} Left</span>
                </div>
              </div>

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="py-4 border-b border-stone-100">
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs font-mono text-stone-500 border border-stone-200 px-2 py-1">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-12">
                <span className="block font-mono text-xs uppercase tracking-widest text-stone-500 mb-4">Description</span>
                <p className="text-stone-600 leading-relaxed font-light">
                  {product.description}
                </p>
              </div>
            )}

            {/* Care */}
            {product.careInstructions && (
               <div className="mb-12 bg-stone-100 p-6">
                 <div className="flex items-start gap-3">
                    <RotateCcw size={16} className="text-stone-500 mt-1" />
                    <div>
                      <span className="block font-mono text-xs uppercase tracking-widest text-stone-500 mb-2">Care Instructions</span>
                      <p className="text-sm text-stone-700">{product.careInstructions}</p>
                    </div>
                 </div>
               </div>
            )}

            {/* Video */}
            {product.videoUrl && (
              <div className="mb-12">
                <span className="block font-mono text-xs uppercase tracking-widest text-stone-500 mb-4">Lookbook</span>
                <div className="aspect-video bg-black overflow-hidden border border-stone-200">
                  <video
                    src={product.videoUrl}
                    controls
                    className="w-full h-full object-cover"
                    poster={product.images[0]}
                  >
                    Your browser does not support video tag.
                  </video>
                </div>
              </div>
            )}

            {/* Seller Card */}
            <div className="border border-stone-200 p-6 mb-12">
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs uppercase tracking-widest text-stone-500">The Artisan</span>
                <div className="flex items-center gap-1 text-xs text-stone-500">
                   <Star size={12} className="fill-current" /> {product.professional.professionalProfile?.totalReviews || 0} Reviews
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="relative w-12 h-12 bg-stone-100 overflow-hidden">
                    <Image
                      src={product.professional.professionalProfile?.businessImage || "/placeholder-avatar.jpg"}
                      alt={product.professional.firstName}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                    {(product.professional.professionalProfile?.businessName === 'TrendiZip' || product.professional.professionalProfile?.isVerified) && (
                      <div className={`absolute -bottom-1 -right-1 rounded-full p-0.5 ${product.professional.professionalProfile?.businessName === 'TrendiZip' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                        <BadgeCheck size={12} className="text-white" />
                      </div>
                    )}
                 </div>
                 <div>
                    <p className="font-serif text-lg text-stone-900">
                      {product.professional.professionalProfile?.businessName || `${product.professional.firstName} ${product.professional.lastName}`}
                    </p>
                    <p className="text-xs font-mono text-stone-500 uppercase tracking-widest">
                      {product.professional.firstName} {product.professional.lastName}
                    </p>
                 </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 border-t border-stone-200 pt-6">
              <div className="text-center">
                <Truck className="w-5 h-5 mx-auto mb-2 text-stone-400" />
                <span className="block text-xs font-mono uppercase tracking-widest text-stone-500">Shipping</span>
              </div>
              <div className="text-center">
                <Shield className="w-5 h-5 mx-auto mb-2 text-stone-400" />
                <span className="block text-xs font-mono uppercase tracking-widest text-stone-500">Secure</span>
              </div>
              <div className="text-center">
                <RotateCcw className="w-5 h-5 mx-auto mb-2 text-stone-400" />
                <span className="block text-xs font-mono uppercase tracking-widest text-stone-500">Returns</span>
              </div>
            </div>

          </div>
        </div>

        {/* Reviews Section (Footer) */}
        <div className="mt-24 pt-12 border-t border-stone-200">
          <div className="flex items-center gap-4 mb-8">
            <MessageCircle className="w-5 h-5 text-stone-900" />
            <h3 className="text-2xl font-serif text-stone-900">Reviews ({product._count.reviews})</h3>
          </div>

          {/* Review Form - Only for logged in users */}
          {session ? (
            !hasReviewed ? (
              <div className="mb-10 p-6 bg-stone-50 border border-stone-200">
                <h4 className="font-mono text-xs uppercase tracking-widest text-stone-500 mb-4">Write a Review</h4>
                
                {/* Rating Selection */}
                <div className="mb-4">
                  <span className="block text-sm text-stone-600 mb-2">Your Rating</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-2xl transition-colors"
                      >
                        <Star
                          size={24}
                          className={star <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-stone-300'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Review title (optional)"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
                  />
                </div>

                {/* Comment */}
                <div className="mb-4">
                  <textarea
                    placeholder="Share your experience with this product..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 font-mono text-sm uppercase tracking-widest hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReview ? (
                    <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                  ) : (
                    <><Send size={16} /> Submit Review</>
                  )}
                </button>
              </div>
            ) : (
              <div className="mb-10 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                You have already submitted a review for this product.
              </div>
            )
          ) : (
            <div className="mb-10 p-6 bg-stone-50 border border-stone-200 text-center">
              <p className="text-stone-600 mb-3">Sign in to share your experience</p>
              <Link
                href="/auth/signin"
                className="inline-block bg-stone-900 text-white px-6 py-2 font-mono text-xs uppercase tracking-widest hover:bg-stone-800 transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-stone-500 font-light">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-8">
              {reviews.map((review) => (
                <div key={review.id} className="py-6 border-b border-stone-100">
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 bg-stone-200 rounded-full overflow-hidden">
                        {review.user.profileImage ? (
                          <Image
                            src={review.user.profileImage}
                            alt={review.user.firstName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-500 font-medium">
                            {review.user.firstName.charAt(0)}{review.user.lastName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-stone-900">
                          {review.user.firstName} {review.user.lastName}
                        </span>
                        {review.isVerified && (
                          <span className="ml-2 text-xs text-emerald-600 font-mono uppercase">Verified Purchase</span>
                        )}
                        <span className="block text-xs text-stone-400">
                          {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex text-amber-500 text-sm">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                  {review.title && (
                    <h4 className="font-medium text-stone-900 mb-1">{review.title}</h4>
                  )}
                  {review.comment && (
                    <p className="text-stone-600 text-sm leading-relaxed">{review.comment}</p>
                  )}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {review.images.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 bg-stone-100 overflow-hidden border border-stone-200">
                          <Image src={img} alt={`Review image ${idx + 1}`} fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Section */}
                  {review.replyText && review.replyUser && (
                    <div className="mt-4 ml-6 pl-4 border-l-2 border-stone-200 bg-stone-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="relative w-8 h-8 bg-stone-200 rounded-full overflow-hidden">
                          {review.replyUser.profileImage ? (
                            <Image
                              src={review.replyUser.profileImage}
                              alt={review.replyUser.firstName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-500 text-xs font-medium">
                              {review.replyUser.firstName.charAt(0)}{review.replyUser.lastName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-stone-900 text-sm">
                            {review.replyUser.firstName} {review.replyUser.lastName}
                          </span>
                          <span className="ml-2 text-xs text-blue-600 font-mono uppercase">Seller</span>
                          {review.repliedAt && (
                            <span className="block text-xs text-stone-400">
                              {new Date(review.repliedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-stone-600 text-sm">{review.replyText}</p>
                    </div>
                  )}

                  {/* Reply Button & Form */}
                  {session && !review.replyText && (
                    <>
                      {replyingToId === review.id ? (
                        <div className="mt-4 ml-6 pl-4 border-l-2 border-stone-300">
                          <textarea
                            placeholder="Write your reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-stone-200 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors resize-none text-sm"
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleSubmitReply(review.id)}
                              disabled={submittingReply || !replyText.trim()}
                              className="flex items-center gap-1 bg-stone-900 text-white px-4 py-2 text-xs font-mono uppercase tracking-widest hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {submittingReply ? (
                                <><Loader2 size={12} className="animate-spin" /> Sending...</>
                              ) : (
                                <><Send size={12} /> Reply</>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setReplyingToId(null)
                                setReplyText('')
                              }}
                              className="px-4 py-2 text-xs font-mono uppercase tracking-widest text-stone-600 hover:text-stone-900 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingToId(review.id)}
                          className="mt-3 flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 transition-colors"
                        >
                          <Reply size={14} /> Reply
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// Utility helper for classes (simple replacement)
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}