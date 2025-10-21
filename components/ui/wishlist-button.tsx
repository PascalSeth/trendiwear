'use client'

import React, { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'

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
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // Start with loading true
  const [isInitialized, setIsInitialized] = useState(false)

  // Check if product is in wishlist on mount
  useEffect(() => {
    checkWishlistStatus()
  }, [productId])

  const checkWishlistStatus = async () => {
    try {
      const response = await fetch('/api/wishlist')
      if (response.ok) {
        const data = await response.json()
        const isInWishlist = data.items.some((item: { productId: string }) => item.productId === productId)
        setIsInWishlist(isInWishlist)
        setIsInitialized(true)
      } else if (response.status === 401) {
        // User not authenticated, reset to false
        setIsInWishlist(false)
        setIsInitialized(true)
      } else {
        // Other errors, assume not in wishlist
        setIsInWishlist(false)
        setIsInitialized(true)
      }
    } catch (error) {
      console.error('Failed to check wishlist status:', error)
      setIsInWishlist(false)
      setIsInitialized(true)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleWishlist = async () => {
    // Prevent clicks while still loading initial state
    if (isLoading || !isInitialized) {
      console.log('Wishlist button not ready yet - still loading initial state')
      return
    }

    // Prevent duplicate clicks during operations
    if (isLoading) {
      console.log('Wishlist operation already in progress')
      return
    }

    setIsLoading(true)
    console.log(`Attempting to ${isInWishlist ? 'remove from' : 'add to'} wishlist for product: ${productId}`)

    try {
      if (isInWishlist) {
        // Remove from wishlist
        console.log('Making DELETE request to remove from wishlist')
        const response = await fetch(`/api/wishlist/${encodeURIComponent(productId)}`, {
          method: 'DELETE',
        })

        console.log('DELETE response status:', response.status)

        if (response.ok) {
          console.log('Successfully removed from wishlist')
          setIsInWishlist(false)
          onWishlistChange?.(false)
          toast.success("Removed from wishlist", { duration: 2000 })
        } else if (response.status === 404) {
          console.log('Item not found in wishlist, refreshing status')
          // Item not found, refresh status and show error
          await checkWishlistStatus()
          toast.error("Item not found in wishlist", { duration: 3000 })
        } else {
          const errorText = await response.text()
          console.error('Failed to remove from wishlist:', response.status, errorText)
          throw new Error('Failed to remove from wishlist')
        }
      } else {
        // Add to wishlist
        console.log('Making POST request to add to wishlist')
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId }),
        })

        console.log('POST response status:', response.status)

        if (response.ok) {
          console.log('Successfully added to wishlist')
          setIsInWishlist(true)
          onWishlistChange?.(true)
          toast.success("Added to wishlist", { duration: 2000 })
        } else if (response.status === 409) {
          console.log('Product already in wishlist (409 Conflict), updating state')
          // Product already in wishlist, update status
          setIsInWishlist(true)
          onWishlistChange?.(true)
          toast.success("Added to wishlist", { duration: 2000 })
        } else {
          const error = await response.json()
          console.log('POST error response:', error)
          console.error('Failed to add to wishlist:', error.error)
          throw new Error(error.error || 'Failed to add to wishlist')
        }
      }
    } catch (error) {
      console.error('Wishlist operation failed:', error)
      toast.error("Failed to update wishlist. Please try again.", { duration: 3000 })
    } finally {
      setIsLoading(false)
      console.log('Wishlist operation completed')
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
      onClick={toggleWishlist}
      disabled={isLoading || !isInitialized}
      className={`relative ${variantClasses[variant]} ${className} ${(isLoading || !isInitialized) ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={`${sizeClasses[size]} ${isInWishlist ? 'fill-current text-red-500' : ''}`}
      />
      {showCount && count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}