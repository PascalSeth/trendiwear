'use client'

import React, { useState } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
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
  const isInWishlist = useWishlistStore(state => state.isInWishlist)
  const addToWishlist = useWishlistStore(state => state.addToWishlist)
  const removeFromWishlist = useWishlistStore(state => state.removeFromWishlist)
  const isHydrated = useWishlistStore(state => state.isHydrated)
  const [isProcessing, setIsProcessing] = useState(false)

  const inWishlist = isInWishlist(productId)

  const handleToggle = async () => {
    if (!isHydrated || isProcessing) return

    setIsProcessing(true)

    try {
      if (inWishlist) {
        const success = await removeFromWishlist(productId)
        if (success) {
          onWishlistChange?.(false)
          toast.success("Removed from wishlist", { duration: 2000 })
        } else {
          toast.error("Failed to remove from wishlist", { duration: 3000 })
        }
      } else {
        const success = await addToWishlist(productId)
        if (success) {
          onWishlistChange?.(true)
          toast.success("Added to wishlist", { duration: 2000 })
        } else {
          toast.error("Failed to add to wishlist", { duration: 3000 })
        }
      }
    } catch (error) {
      console.error('Wishlist operation failed:', error)
      toast.error("Failed to update wishlist. Please try again.", { duration: 3000 })
    } finally {
      setIsProcessing(false)
    }
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const variantClasses = {
    default: 'p-2 rounded-full hover:bg-gray-100 transition-colors',
    overlay: 'bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200',
    inline: 'hover:text-red-500 transition-colors'
  }

  return (
    <button
      onClick={handleToggle}
      disabled={!isHydrated || isProcessing}
      className={`relative ${variantClasses[variant]} ${className} ${(!isHydrated || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={`${sizeClasses[size]} ${inWishlist ? 'fill-current text-red-500' : ''}`}
      />
      {showCount && count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}