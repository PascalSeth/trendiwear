              import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// ================================
// TYPES
// ================================

export interface CartProduct {
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

export interface CartItem {
  id: string
  quantity: number
  size?: string
  color?: string
  productId: string
  product: CartProduct
}

export interface CartSummary {
  itemCount: number
  subtotal: number
  estimatedTotal: number
}

interface CartState {
  // State
  items: CartItem[]
  summary: CartSummary | null
  isLoading: boolean
  isHydrated: boolean
  error: string | null

  // Actions
  fetchCart: () => Promise<void>
  addToCart: (productId: string, quantity?: number, size?: string, color?: string) => Promise<boolean>
  removeFromCart: (productId: string) => Promise<boolean>
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>
  removeItem: (itemId: string) => Promise<boolean>
  clearCart: () => void
  
  // Selectors
  isInCart: (productId: string) => boolean
  getItemByProductId: (productId: string) => CartItem | undefined
  getItemCount: () => number

  // Hydration
  setHydrated: () => void
}

// ================================
// STORE
// ================================

export const useCartStore = create<CartState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    items: [],
    summary: null,
    isLoading: true,
    isHydrated: false,
    error: null,

    // Set hydrated (call after initial fetch)
    setHydrated: () => set({ isHydrated: true }),

    // Fetch cart from API
    fetchCart: async () => {
      set({ isLoading: true, error: null })
      
      try {
        const response = await fetch('/api/cart')
        
        if (response.ok) {
          const data = await response.json()
          set({
            items: data.items || [],
            summary: data.summary || null,
            isLoading: false,
            isHydrated: true,
          })
        } else if (response.status === 401) {
          // User not authenticated
          set({
            items: [],
            summary: null,
            isLoading: false,
            isHydrated: true,
          })
        } else {
          throw new Error('Failed to fetch cart')
        }
      } catch (error) {
        console.error('Failed to fetch cart:', error)
        set({
          items: [],
          summary: null,
          isLoading: false,
          isHydrated: true,
          error: error instanceof Error ? error.message : 'Failed to fetch cart',
        })
      }
    },

    // Add item to cart
    addToCart: async (productId, quantity = 1, size, color) => {
      const previousItems = get().items
      const previousSummary = get().summary

      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity, size, color }),
        })

        if (response.ok) {
          // Refresh cart to get updated data
          await get().fetchCart()
          return true
        } else {
          const error = await response.json()
          console.error('Failed to add to cart:', error.error)
          return false
        }
      } catch (error) {
        console.error('Add to cart failed:', error)
        // Restore previous state on error
        set({ items: previousItems, summary: previousSummary })
        return false
      }
    },

    // Remove item from cart by product ID
    removeFromCart: async (productId) => {
      const { items } = get()
      const cartItem = items.find(item => item.productId === productId)
      
      if (!cartItem) return false

      // Optimistic update
      const optimisticItems = items.filter(item => item.productId !== productId)
      set({ items: optimisticItems })

      try {
        const response = await fetch(`/api/cart/${cartItem.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await get().fetchCart()
          return true
        } else {
          // Revert on failure
          set({ items })
          return false
        }
      } catch (error) {
        console.error('Remove from cart failed:', error)
        set({ items })
        return false
      }
    },

    // Update item quantity
    updateQuantity: async (itemId, quantity) => {
      if (quantity < 1) return false

      const { items, summary } = get()
      const itemIndex = items.findIndex(item => item.id === itemId)
      
      if (itemIndex === -1) return false

      // Optimistic update
      const optimisticItems = [...items]
      optimisticItems[itemIndex] = { ...optimisticItems[itemIndex], quantity }
      set({ items: optimisticItems })

      try {
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        })

        if (response.ok) {
          await get().fetchCart()
          return true
        } else {
          // Revert on failure
          set({ items, summary })
          return false
        }
      } catch (error) {
        console.error('Update quantity failed:', error)
        set({ items, summary })
        return false
      }
    },

    // Remove item by cart item ID
    removeItem: async (itemId) => {
      const { items } = get()
      
      // Optimistic update
      const optimisticItems = items.filter(item => item.id !== itemId)
      set({ items: optimisticItems })

      try {
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await get().fetchCart()
          return true
        } else {
          set({ items })
          return false
        }
      } catch (error) {
        console.error('Remove item failed:', error)
        set({ items })
        return false
      }
    },

    // Clear local cart state
    clearCart: () => {
      set({ items: [], summary: null })
    },

    // Check if product is in cart
    isInCart: (productId) => {
      return get().items.some(item => item.productId === productId)
    },

    // Get cart item by product ID
    getItemByProductId: (productId) => {
      return get().items.find(item => item.productId === productId)
    },

    // Get total item count
    getItemCount: () => {
      return get().summary?.itemCount || 0
    },
  }))
)

// ================================
// SELECTORS (for optimized re-renders)
// ================================

export const selectCartItems = (state: CartState) => state.items
export const selectCartSummary = (state: CartState) => state.summary
export const selectCartLoading = (state: CartState) => state.isLoading
export const selectCartHydrated = (state: CartState) => state.isHydrated
export const selectCartError = (state: CartState) => state.error
export const selectCartItemCount = (state: CartState) => state.summary?.itemCount || 0
