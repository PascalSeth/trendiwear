'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type CartItem = {
  id: string
  quantity: number
  size?: string
  color?: string
  productId: string
  product: {
    id: string
    name: string
    price: number
    currency: string
    images: string[]
    stockQuantity: number
    isActive: boolean
    isInStock: boolean
    professional: {
      firstName: string
      lastName: string
      professionalProfile?: {
        businessName: string
      }
    }
  }
}

type CartSummary = {
  itemCount: number
  subtotal: number
  estimatedTotal: number
}

type CartContextType = {
  items: CartItem[]
  summary: CartSummary | null
  isLoading: boolean
  refreshCart: () => Promise<void>
  addToCart: (productId: string, quantity?: number) => Promise<boolean>
  removeFromCart: (productId: string) => Promise<boolean>
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>
  removeItem: (itemId: string) => Promise<boolean>
  isInCart: (productId: string) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [summary, setSummary] = useState<CartSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshCart = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
        setSummary(data.summary || null)
      } else if (response.status === 401) {
        // User not authenticated
        setItems([])
        setSummary(null)
      }
    } catch (error) {
      console.error('Failed to refresh cart:', error)
      setItems([])
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }

  const addToCart = async (productId: string, quantity = 1): Promise<boolean> => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity }),
      })

      if (response.ok) {
        await refreshCart()
        return true
      } else {
        const error = await response.json()
        console.error('Failed to add to cart:', error.error)
        return false
      }
    } catch (error) {
      console.error('Add to cart failed:', error)
      return false
    }
  }

  const removeFromCart = async (productId: string): Promise<boolean> => {
    try {
      // Find the cart item
      const cartItem = items.find(item => item.productId === productId)
      if (!cartItem) return false

      const response = await fetch(`/api/cart/${cartItem.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await refreshCart()
        return true
      } else {
        console.error('Failed to remove from cart')
        return false
      }
    } catch (error) {
      console.error('Remove from cart failed:', error)
      return false
    }
  }

  const updateQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      })

      if (response.ok) {
        await refreshCart()
        return true
      } else {
        console.error('Failed to update quantity')
        return false
      }
    } catch (error) {
      console.error('Update quantity failed:', error)
      return false
    }
  }

  const removeItem = async (itemId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await refreshCart()
        return true
      } else {
        console.error('Failed to remove item')
        return false
      }
    } catch (error) {
      console.error('Remove item failed:', error)
      return false
    }
  }

  const isInCart = (productId: string): boolean => {
    return items.some(item => item.productId === productId)
  }

  useEffect(() => {
    refreshCart()
  }, [])

  const value: CartContextType = {
    items,
    summary,
    isLoading,
    refreshCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    removeItem,
    isInCart,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}