'use client'

import React, { useRef } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react' // ADD THIS
import { useCartStore } from '@/lib/stores'

interface AddToCartButtonProps {
  productId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'overlay' | 'inline' | 'primary'
  onCartChange?: (isInCart: boolean) => void
  quantity?: number
  selectedSize?: string
  selectedColor?: string
  isOutOfStock?: boolean
}

export function AddToCartButton({
  productId,
  className = '',
  size = 'md',
  variant = 'default',
  onCartChange,
  quantity = 1,
  selectedSize,
  selectedColor,
  isOutOfStock = false
}: AddToCartButtonProps) {
  const { status } = useSession() // GET SESSION STATUS
  const isInCart = useCartStore(state => state.isInCart)
  const addToCart = useCartStore(state => state.addToCart)
  const removeFromCart = useCartStore(state => state.removeFromCart)
  const pendingRef = useRef(false)

  const productInCart = isInCart(productId)

  const handleCartAction = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // AUTH CHECK: If not logged in, prompt user
    if (status === 'unauthenticated') {
      toast.error("Please login to add items to your bag", {
        description: "You need an account to manage your shopping cart.",
        duration: 3000,
      })
      return
    }

    if (pendingRef.current) return
    if (isOutOfStock && !productInCart) {
      toast.error("Item is out of stock")
      return
    }

    pendingRef.current = true

    if (productInCart) {
      onCartChange?.(false)
      const success = await removeFromCart(productId)
      if (success) {
        toast.success("Removed from bag", { duration: 1500 })
      }
      pendingRef.current = false
    } else {
      // For adding, we'll wait for the result to avoid fake success toasts
      const success = await addToCart(productId, quantity, selectedSize, selectedColor)
      if (success) {
        onCartChange?.(true)
        toast.success("Added to bag!", { duration: 1500 })
      }
      pendingRef.current = false
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
    default: `${buttonSizeClasses[size]} bg-stone-900 text-white rounded-full shadow-md hover:bg-black hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200`,
    overlay: `${buttonSizeClasses[size]} bg-black/80 backdrop-blur-md text-white rounded-full shadow-2xl hover:bg-black hover:scale-110 active:scale-95 transition-all duration-300 ring-2 ring-white/20`,
    inline: 'text-stone-600 hover:text-black transition-colors duration-200',
    primary: 'w-full bg-black hover:bg-stone-800 text-white py-4 px-8 rounded-full font-semibold tracking-wide flex items-center justify-center gap-3 shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300'
  }

  // In-cart state styles
  const inCartClasses = {
    default: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    overlay: 'bg-emerald-500 hover:bg-emerald-600 text-white ring-emerald-300/50',
    inline: 'text-emerald-500',
    primary: 'bg-emerald-500 hover:bg-emerald-600'
  }

  return (
    <motion.button
      onClick={handleCartAction}
      whileTap={{ scale: 0.9 }}
      className={`relative overflow-hidden ${variantClasses[variant]} ${className} ${productInCart ? inCartClasses[variant] : ''}`}
      aria-label={productInCart ? 'Remove from bag' : 'Add to bag'}
    >
      <AnimatePresence mode="wait">
        {productInCart ? (
          <motion.span
            key="in-cart"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={variant === 'primary' ? 'flex items-center gap-3' : ''}
          >
            {variant === 'primary' ? (
              <>
                <Check className={sizeClasses[size]} strokeWidth={2.5} />
                <span>In Your Bag</span>
              </>
            ) : (
              <Check className={sizeClasses[size]} strokeWidth={2.5} />
            )}
          </motion.span>
        ) : (
          <motion.span
            key="add"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={variant === 'primary' ? 'flex items-center gap-3' : ''}
          >
            {variant === 'primary' ? (
              <>
                <ShoppingBag className={sizeClasses[size]} strokeWidth={2} />
                <span>Add to Bag</span>
              </>
            ) : (
              <ShoppingBag className={sizeClasses[size]} strokeWidth={2} />
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}