'use client'

import React, { useState } from 'react'
import { Star, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface ProductReviewFormProps {
  productId: string
  isLoggedIn: boolean
  hasPurchased: boolean
  hasReviewed: boolean
  onSuccess: () => void
}

export default function ProductReviewForm({
  productId,
  isLoggedIn,
  hasPurchased,
  hasReviewed,
  onSuccess
}: ProductReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInteractionAttempt = () => {
    if (!isLoggedIn) {
      toast.error('Please sign in to share your experience.', {
        description: 'Only signed-in customers can leave reviews.',
        action: {
          label: 'Sign In',
          onClick: () => window.location.href = `/auth/signin?callbackUrl=${window.location.pathname}`
        }
      })
      return false
    }
    if (!hasPurchased) {
      toast.error('Verified Purchase Required', {
        description: 'You must purchase and receive this item before you can leave a review.'
      })
      return false
    }
    if (hasReviewed) {
      toast.error('Review Already Submitted', {
        description: 'You have already shared your thoughts on this product.'
      })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!handleInteractionAttempt()) return

    if (rating === 0) {
      toast.warning('Star quality needed', { description: 'Please select a star rating between 1 and 5.' })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: productId,
          targetType: 'PRODUCT',
          rating,
          comment
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      toast.success('Thoughtful Review Received!', {
        description: 'Your feedback helps the artisan and the community.'
      })
      setRating(0)
      setComment('')
      onSuccess()
    } catch (error: any) {
      toast.error('Review interrupted', { description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-12 bg-white rounded-[1.5rem] p-8 lg:p-12 border border-stone-200">
      <div className="space-y-3">
        <h3 className="text-2xl font-serif italic tracking-tighter text-stone-900">Share Your Experience</h3>
        <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-stone-400">Feedback for Artisans & Buyers.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Star Rating Section */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Service & Craft Quality</label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="relative p-0.5 transition-transform active:scale-95"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => {
                  if (handleInteractionAttempt()) {
                    setRating(star)
                  }
                }}
              >
                <Star
                  size={24}
                  className={cn(
                    "transition-all duration-500",
                    (hoveredRating || rating) >= star 
                      ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]" 
                      : "text-stone-200"
                  )}
                  strokeWidth={1}
                />
              </button>
            ))}
            {rating > 0 && (
               <motion.span 
                 initial={{ opacity: 0, x: -5 }} 
                 animate={{ opacity: 1, x: 0 }}
                 className="ml-4 text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/80"
               >
                 / {rating === 5 ? 'Exceptional' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
               </motion.span>
            )}
          </div>
        </div>

        {/* Comment Section - No-Scroll Design */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Your Thoughts</label>
          <div className="relative group">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onFocus={() => handleInteractionAttempt()}
              placeholder="Tell us about the fit, fabric, or experience..."
              className="w-full bg-stone-50/50 border-b border-stone-200 p-0 py-4 text-stone-800 font-serif text-xl leading-relaxed focus:border-stone-950 transition-all outline-none min-h-[120px] bg-transparent resize-y scrollbar-hide"
              style={{ overflow: 'hidden' }} // This will hide scrollbars
            />
            <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-stone-950 transition-all duration-700 group-focus-within:w-full" />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || (isLoggedIn && hasReviewed)}
          className={cn(
            "w-full h-16 rounded-full flex items-center justify-center gap-3 transition-all duration-300 text-[10px] font-black uppercase tracking-[0.4em]",
            isSubmitting 
              ? "bg-stone-100 text-stone-400" 
              : hasReviewed && isLoggedIn
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
              : "bg-stone-950 text-white hover:bg-black hover:shadow-xl shadow-stone-900/20"
          )}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : hasReviewed && isLoggedIn ? (
            'Review Submitted'
          ) : (
            <>
              Send Review
              <Send className="w-3 h-3 translate-y-[-1px]" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
