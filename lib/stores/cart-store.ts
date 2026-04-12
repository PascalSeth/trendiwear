              import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { toast } from 'sonner'

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
  // Discount fields
  effectivePrice?: number
  isDiscountActive?: boolean
  discountAmount?: number
  professional: {
    firstName: string
    lastName: string
    professionalProfile?: {
      businessName: string
      latitude: number | null
      longitude: number | null
      location: string | null
    }
  }
  allowPickup: boolean
  allowDelivery: boolean
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

    // Add item to cart (optimistic)
    addToCart: async (productId, quantity = 1, size, color) => {
      const { items, summary } = get()
      
      // Check if already in cart - update quantity instead
      const existingItem = items.find(item => item.productId === productId)
      
      // ALWAYS do optimistic update immediately for instant UI feedback
      if (existingItem) {
        // Existing item - update quantity
        const optimisticItems = items.map(item => 
          item.productId === productId 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        const newSubtotal = Math.round(((summary?.subtotal || 0) + (existingItem.product.effectivePrice || existingItem.product.price) * quantity) * 100) / 100
        set({ 
          items: optimisticItems,
          summary: summary ? { 
            ...summary, 
            itemCount: summary.itemCount + quantity,
            subtotal: newSubtotal,
            estimatedTotal: Math.round(newSubtotal * 1.03 * 100) / 100
          } : null
        })
      } else {
        // New item - create placeholder for instant feedback
        const placeholderItem: CartItem = {
          id: `temp-${productId}-${Date.now()}`,
          quantity,
          size: size || undefined,
          color: color || undefined,
          productId,
          product: {
            id: productId,
            name: 'Loading...',
            price: 0,
            currency: 'GHS',
            images: [],
            stockQuantity: 99,
            isActive: true,
            isInStock: true,
            professional: { firstName: '', lastName: '' },
            allowPickup: true,
            allowDelivery: true
          }
        }
        set({ 
          items: [...items, placeholderItem],
          summary: summary ? { 
            ...summary, 
            itemCount: summary.itemCount + quantity
          } : { itemCount: quantity, subtotal: 0, estimatedTotal: 0 }
        })
      }

      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity, size, color }),
        })

        if (response.ok) {
          const data = await response.json()
          // Update with server data (includes full item details)
          if (data.item) {
            // Get current state (may have changed)
            const currentItems = get().items
            const updatedItems = currentItems.map(item => 
              (item.productId === productId || item.id.startsWith('temp-')) && item.productId === productId
                ? data.item 
                : item
            ).filter(item => !item.id.startsWith('temp-') || item.productId !== productId)
            
            // If item wasn't in list (edge case), add it
            if (!updatedItems.find(i => i.productId === productId)) {
              updatedItems.push(data.item)
            }
            
            const newSubtotal = Math.round(updatedItems.reduce((sum, item) => 
              sum + (item.product.effectivePrice || item.product.price) * item.quantity, 0
            ) * 100) / 100
            set({ 
              items: updatedItems,
              summary: {
                itemCount: updatedItems.reduce((count, item) => count + item.quantity, 0),
                subtotal: newSubtotal,
                estimatedTotal: Math.round(newSubtotal * 1.03 * 100) / 100
              }
            })
          }
          return true
        } else {
          // Revert on failure
          set({ items, summary })
          const errorData = await response.json()
          toast.error(errorData.error || 'Failed to add to bag')
          console.error('Failed to add to bag:', errorData.error)
          return false
        }
      } catch (error) {
        console.error('Add to bag failed:', error)
        set({ items, summary })
        return false
      }
    },

    // Remove item from cart by product ID (optimistic)
    removeFromCart: async (productId) => {
      const { items, summary } = get()
      const cartItem = items.find(item => item.productId === productId)
      
      if (!cartItem) return false

      // Optimistic update - remove immediately for fast UI
      const optimisticItems = items.filter(item => item.productId !== productId)
      const removedValue = (cartItem.product.effectivePrice || cartItem.product.price) * cartItem.quantity
      const newSubtotal = Math.round(Math.max(0, (summary?.subtotal || 0) - removedValue) * 100) / 100
      
      set({ 
        items: optimisticItems,
        summary: summary ? {
          itemCount: Math.max(0, summary.itemCount - cartItem.quantity),
          subtotal: newSubtotal,
          estimatedTotal: Math.round(newSubtotal * 1.03 * 100) / 100
        } : null
      })

      try {
        const response = await fetch(`/api/cart/${cartItem.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          // Revert on failure
          set({ items, summary })
          return false
        }
        return true
      } catch (error) {
        console.error('Remove from bag failed:', error)
        set({ items, summary })
        return false
      }
    },

    // Update item quantity (optimistic)
    updateQuantity: async (itemId, quantity) => {
      if (quantity < 1) return false

      const { items, summary } = get()
      const itemIndex = items.findIndex(item => item.id === itemId)
      
      if (itemIndex === -1) return false

      const oldItem = items[itemIndex]
      const quantityDiff = quantity - oldItem.quantity
      const priceDiff = (oldItem.product.effectivePrice || oldItem.product.price) * quantityDiff

      // Optimistic update
      const optimisticItems = [...items]
      optimisticItems[itemIndex] = { ...oldItem, quantity }
      const newSubtotal = Math.round(((summary?.subtotal || 0) + priceDiff) * 100) / 100
      
      set({ 
        items: optimisticItems,
        summary: summary ? {
          itemCount: summary.itemCount + quantityDiff,
          subtotal: newSubtotal,
          estimatedTotal: Math.round(newSubtotal * 1.03 * 100) / 100
        } : null
      })

      try {
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        })

        if (!response.ok) {
          // Revert on failure
          set({ items, summary })
          const errorData = await response.json().catch(() => ({}))
          toast.error(errorData.error || 'Failed to update quantity')
          return false
        }
        return true
      } catch (error) {
        console.error('Update quantity failed:', error)
        set({ items, summary })
        return false
      }
    },

    // Remove item by cart item ID (optimistic)
    removeItem: async (itemId) => {
      const { items, summary } = get()
      const item = items.find(i => i.id === itemId)
      
      if (!item) return false

      // Optimistic update
      const optimisticItems = items.filter(i => i.id !== itemId)
      const removedValue = (item.product.effectivePrice || item.product.price) * item.quantity
      const newSubtotal = Math.round(Math.max(0, (summary?.subtotal || 0) - removedValue) * 100) / 100
      
      set({ 
        items: optimisticItems,
        summary: summary ? {
          itemCount: Math.max(0, summary.itemCount - item.quantity),
          subtotal: newSubtotal,
          estimatedTotal: Math.round(newSubtotal * 1.03 * 100) / 100
        } : null
      })

      try {
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          set({ items, summary })
          const errorData = await response.json().catch(() => ({}))
          toast.error(errorData.error || 'Failed to remove item')
          return false
        }
        return true
      } catch (error) {
        console.error('Remove item failed:', error)
        set({ items, summary })
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
