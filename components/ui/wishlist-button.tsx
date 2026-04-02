'use client'

import React, { useRef } from 'react'
import { Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react' // ADD THIS
import { useWishlistStore } from '@/lib/stores'

interface WishlistButtonProps {
  productId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'overlay' | 'inline'
  onWishlistChange?: (isInWishlist: boolean) => void
  showCount?: boolean
  count?: number
}

export function WishlistButton({
  productId,
  className = '',
  size = 'md',
  variant = 'default',
  onWishlistChange,
  showCount = false,
  count = 0
}: WishlistButtonProps) {
  const { status } = useSession() // GET SESSION STATUS
  const isInWishlist = useWishlistStore(state => state.isInWishlist)
  const addToWishlist = useWishlistStore(state => state.addToWishlist)
  const removeFromWishlist = useWishlistStore(state => state.removeFromWishlist)
  const isHydrated = useWishlistStore(state => state.isHydrated)
  const pendingRef = useRef(false)

  const inWishlist = isInWishlist(productId)

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // AUTH CHECK: If not logged in, prompt user
    if (status === 'unauthenticated') {
      toast.error("Please login to save to your wishlist", {
        description: "You need an account to track your favorite items.",
        duration: 3000,
      })
      return
    }

    if (!isHydrated || pendingRef.current) return
    pendingRef.current = true

    // Fire and forget - don't await, optimistic update shows immediately
    if (inWishlist) {
      onWishlistChange?.(false)
      toast.success("Removed from wishlist", { duration: 1500 })
      removeFromWishlist(productId).finally(() => {
        pendingRef.current = false
      })
    } else {
      onWishlistChange?.(true)
      toast.success("Added to wishlist!", { duration: 1500 })
      addToWishlist(productId).finally(() => {
        pendingRef.current = false
      })
    }
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const buttonSizeClasses = {
    sm: 'p-2',
    md: 'p-2.5',
    lg: 'p-3'
  }

  // Bold & Modern variant styles
  const variantClasses = {
    default: `${buttonSizeClasses[size]} bg-white rounded-full shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-stone-100`,
    overlay: `${buttonSizeClasses[size]} bg-white/90 backdrop-blur-md rounded-full shadow-2xl hover:bg-white hover:scale-110 active:scale-95 transition-all duration-300`,
    inline: 'hover:scale-110 transition-all duration-200'
  }

  return (
    <motion.button
      onClick={handleToggle}
      whileTap={{ scale: 0.85 }}
      className={`relative ${variantClasses[variant]} ${className}`}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={inWishlist ? 'filled' : 'empty'}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <Heart
            className={`${sizeClasses[size]} transition-colors duration-150 ${
              inWishlist 
                ? 'fill-red-500 text-red-500' 
                : 'text-stone-400 hover:text-red-400'
            }`}
            strokeWidth={inWishlist ? 0 : 2}
          />
        </motion.div>
      </AnimatePresence>
      
      {showCount && count > 0 && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white"
        >
          {count > 99 ? '99+' : count}
        </motion.span>
      )}
    </motion.button>
  )
}