'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore, selectCartSummary, selectCartLoading } from '@/lib/stores'

export function CartCountBadge() {
  const summary = useCartStore(selectCartSummary)
  const isLoading = useCartStore(selectCartLoading)
  const itemCount = summary?.itemCount || 0
  const [prevCount, setPrevCount] = useState(itemCount)
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    if (itemCount !== prevCount && itemCount > 0) {
      setShouldAnimate(true)
      const timer = setTimeout(() => setShouldAnimate(false), 300)
      setPrevCount(itemCount)
      return () => clearTimeout(timer)
    }
  }, [itemCount, prevCount])

  // Don't show badge if no items or still loading
  if (isLoading || itemCount === 0) {
    return null
  }

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={itemCount}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: shouldAnimate ? [1, 1.3, 1] : 1, 
          opacity: 1 
        }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ 
          duration: 0.2,
          scale: { duration: 0.3 }
        }}
        className="bg-black text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] shadow-lg ring-2 ring-white"
      >
        {itemCount > 99 ? '99+' : itemCount}
      </motion.span>
    </AnimatePresence>
  )
}