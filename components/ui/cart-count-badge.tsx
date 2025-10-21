'use client'

import React from 'react'
import { useCart } from '@/lib/cart-context'

export function CartCountBadge() {
  const { summary, isLoading } = useCart()
  const itemCount = summary?.itemCount || 0

  // Don't show badge if no items or still loading
  if (isLoading || itemCount === 0) {
    return null
  }

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium min-w-[20px]">
      {itemCount > 99 ? '99+' : itemCount}
    </span>
  )
}