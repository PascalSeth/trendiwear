import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// ================================
// TYPES
// ================================

export interface WishlistProduct {
  id: string
  name: string
  price: number
  currency: string
  images: string[]
  isInStock: boolean
  isActive: boolean
  professional: {
    firstName: string
    lastName: string
    professionalProfile?: {
      businessName: string
      rating: number | null
    } | null
  }
  _count: {
    wishlistItems: number
  }
}

export interface WishlistItem {
  id: string
  productId: string
  createdAt: string
  product: WishlistProduct
}

interface WishlistState {
  // State
  items: WishlistItem[]
  isLoading: boolean
  isHydrated: boolean
  error: string | null
  
  // Tracks which product IDs are in the wishlist (for quick lookups)
  productIds: Set<string>

  // Actions
  fetchWishlist: () => Promise<void>
  addToWishlist: (productId: string) => Promise<boolean>
  removeFromWishlist: (productId: string) => Promise<boolean>
  toggleWishlist: (productId: string) => Promise<boolean>
  clearWishlist: () => void

  // Selectors
  isInWishlist: (productId: string) => boolean
  getWishlistCount: () => number

  // Hydration
  setHydrated: () => void
}

// ================================
// STORE
// ================================

export const useWishlistStore = create<WishlistState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    items: [],
    isLoading: true,
    isHydrated: false,
    error: null,
    productIds: new Set(),

    // Set hydrated
    setHydrated: () => set({ isHydrated: true }),

    // Fetch wishlist from API
    fetchWishlist: async () => {
      set({ isLoading: true, error: null })

      try {
        const response = await fetch('/api/wishlist')

        if (response.ok) {
          const data = await response.json()
          const items: WishlistItem[] = data.items || []
          const productIds = new Set(items.map(item => item.productId))
          
          set({
            items,
            productIds,
            isLoading: false,
            isHydrated: true,
          })
        } else if (response.status === 401) {
          // User not authenticated
          set({
            items: [],
            productIds: new Set(),
            isLoading: false,
            isHydrated: true,
          })
        } else {
          throw new Error('Failed to fetch wishlist')
        }
      } catch (error) {
        console.error('Failed to fetch wishlist:', error)
        set({
          items: [],
          productIds: new Set(),
          isLoading: false,
          isHydrated: true,
          error: error instanceof Error ? error.message : 'Failed to fetch wishlist',
        })
      }
    },

    // Add item to wishlist (optimistic - no refetch)
    addToWishlist: async (productId) => {
      const { items, productIds } = get()

      // Already in wishlist
      if (productIds.has(productId)) {
        return true
      }

      // Optimistic update - add immediately for fast UI
      const optimisticProductIds = new Set(productIds)
      optimisticProductIds.add(productId)
      set({ productIds: optimisticProductIds })

      try {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        })

        if (response.ok) {
          const data = await response.json()
          // Add the new item to state directly instead of refetching
          if (data.item) {
            set({ 
              items: [...items, data.item],
              productIds: optimisticProductIds
            })
          }
          return true
        } else if (response.status === 409) {
          // Already in wishlist, keep optimistic state
          return true
        } else {
          // Revert optimistic update
          set({ productIds })
          const error = await response.json()
          console.error('Failed to add to wishlist:', error.error)
          return false
        }
      } catch (error) {
        console.error('Add to wishlist failed:', error)
        set({ productIds, items })
        return false
      }
    },

    // Remove item from wishlist (optimistic - no refetch)
    removeFromWishlist: async (productId) => {
      const { items, productIds } = get()

      // Not in wishlist
      if (!productIds.has(productId)) {
        return true
      }

      // Optimistic update - remove immediately for fast UI
      const optimisticProductIds = new Set(productIds)
      optimisticProductIds.delete(productId)
      const optimisticItems = items.filter(item => item.productId !== productId)
      set({ productIds: optimisticProductIds, items: optimisticItems })

      try {
        const response = await fetch(`/api/wishlist/${encodeURIComponent(productId)}`, {
          method: 'DELETE',
        })

        if (response.ok || response.status === 404) {
          // Success or already removed - keep optimistic state
          return true
        } else {
          // Revert optimistic update
          set({ productIds, items })
          return false
        }
      } catch (error) {
        console.error('Remove from wishlist failed:', error)
        set({ productIds, items })
        return false
      }
    },

    // Toggle wishlist (add if not in, remove if in)
    toggleWishlist: async (productId) => {
      const { productIds } = get()
      
      if (productIds.has(productId)) {
        return get().removeFromWishlist(productId)
      } else {
        return get().addToWishlist(productId)
      }
    },

    // Clear local wishlist state
    clearWishlist: () => {
      set({ items: [], productIds: new Set() })
    },

    // Check if product is in wishlist
    isInWishlist: (productId) => {
      return get().productIds.has(productId)
    },

    // Get total wishlist count
    getWishlistCount: () => {
      return get().items.length
    },
  }))
)

// ================================
// SELECTORS (for optimized re-renders)
// ================================

export const selectWishlistItems = (state: WishlistState) => state.items
export const selectWishlistLoading = (state: WishlistState) => state.isLoading
export const selectWishlistHydrated = (state: WishlistState) => state.isHydrated
export const selectWishlistError = (state: WishlistState) => state.error
export const selectWishlistCount = (state: WishlistState) => state.items.length
export const selectWishlistProductIds = (state: WishlistState) => state.productIds
