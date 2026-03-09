'use client'

import React, { useRef } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useCartStore } from '@/lib/stores'

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
  const isInCart = useCartStore(state => state.isInCart)
  const addToCart = useCartStore(state => state.addToCart)
  const removeFromCart = useCartStore(state => state.removeFromCart)
  const pendingRef = useRef(false)

  const productInCart = isInCart(productId)

  const handleCartAction = () => {
    if (pendingRef.current) return
    pendingRef.current = true

    // Fire and forget - don't await, let optimistic update show immediately
    if (productInCart) {
      onCartChange?.(false)
      toast.success("Removed from bag", { duration: 1500 })
      removeFromCart(productId).finally(() => {
        pendingRef.current = false
      })
    } else {
      onCartChange?.(true)
      toast.success("Added to bag!", { duration: 1500 })
      addToCart(productId, quantity).finally(() => {
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