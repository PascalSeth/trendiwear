'use client'

import React, { useState } from 'react'
import { ShoppingBag, Plus, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/lib/cart-context'

interface AddToCartButtonProps {
  productId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'overlay' | 'inline' | 'primary'
  onCartChange?: (isInCart: boolean) => void
  quantity?: number
}

export function AddToCartButton({
  productId,
  className = '',
  size = 'md',
  variant = 'default',
  onCartChange,
  quantity = 1
}: AddToCartButtonProps) {
  const { isInCart, addToCart, removeFromCart, isLoading: cartLoading } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const productInCart = isInCart(productId)

  const handleCartAction = async () => {
    if (cartLoading || isAdding) return

    setIsAdding(true)

    try {
      let success = false
      if (productInCart) {
        success = await removeFromCart(productId)
        if (success) {
          onCartChange?.(false)
          toast.success("Removed from cart", { duration: 2000 })
        }
      } else {
        success = await addToCart(productId, quantity)
        if (success) {
          onCartChange?.(true)
          toast.success(`Added to cart!`, { duration: 2000 })
        }
      }

      if (!success) {
        toast.error("Failed to update cart. Please try again.", { duration: 3000 })
      }
    } catch (error) {
      console.error('Cart operation failed:', error)
      toast.error("Failed to update cart. Please try again.", { duration: 3000 })
    } finally {
      setIsAdding(false)
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
    inline: 'hover:text-blue-500 transition-colors',
    primary: 'w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2'
  }

  return (
    <button
      onClick={handleCartAction}
      disabled={cartLoading || isAdding}
      className={`relative ${variantClasses[variant]} ${className} ${(cartLoading || isAdding) ? 'opacity-50 cursor-not-allowed' : ''} ${productInCart ? 'bg-green-600 text-white hover:bg-green-500 cursor-default' : ''}`}
      aria-label={productInCart ? 'Remove from cart' : 'Add to cart'}
    >
      {productInCart ? (
        variant === 'primary' ? (
          <span className="flex items-center gap-2">
            <Check className={`${sizeClasses[size]} text-white`} />
            Added to Cart
          </span>
        ) : (
          <Check className={`${sizeClasses[size]} text-green-600`} />
        )
      ) : isAdding ? (
        variant === 'primary' ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Adding...
          </span>
        ) : (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
        )
      ) : (
        variant === 'primary' ? (
          <span className="flex items-center gap-2">
            <ShoppingBag className={sizeClasses[size]} />
            Add to Cart
          </span>
        ) : variant === 'overlay' ? (
          <ShoppingBag className={sizeClasses[size]} />
        ) : (
          <Plus className={sizeClasses[size]} />
        )
      )}
    </button>
  )
}