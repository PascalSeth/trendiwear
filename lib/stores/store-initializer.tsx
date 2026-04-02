'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useCartStore } from './cart-store'
import { useWishlistStore } from './wishlist-store'

/**
 * StoreInitializer component
 * 
 * This component initializes the Zustand stores by fetching data from the API.
 * It should be placed in the root layout or providers to ensure stores are
 * hydrated as soon as the app loads.
 * 
 * The stores use subscribeWithSelector middleware for optimized re-renders.
 */
export function StoreInitializer() {
  const { status } = useSession()
  const fetchCart = useCartStore(state => state.fetchCart)
  const fetchWishlist = useWishlistStore(state => state.fetchWishlist)
  const cartHydrated = useCartStore(state => state.isHydrated)
  const wishlistHydrated = useWishlistStore(state => state.isHydrated)
  const clearCart = useCartStore(state => state.clearCart)
  const clearWishlist = useWishlistStore(state => state.clearWishlist || (() => {}))

  useEffect(() => {
    // If not authenticated, clear stores and don't fetch
    if (status === 'unauthenticated') {
      clearCart()
      if (typeof clearWishlist === 'function') clearWishlist()
      return
    }

    // Only fetch if authenticated and not already hydrated
    if (status === 'authenticated') {
      if (!cartHydrated) {
        fetchCart()
      }
      if (!wishlistHydrated) {
        fetchWishlist()
      }
    }
  }, [status, fetchCart, fetchWishlist, cartHydrated, wishlistHydrated, clearCart, clearWishlist])

  // This component doesn't render anything
  return null
}

/**
 * Hook to initialize stores manually
 * Use this if you prefer to initialize stores at a specific point
 */
export function useStoreInitializer() {
  const fetchCart = useCartStore(state => state.fetchCart)
  const fetchWishlist = useWishlistStore(state => state.fetchWishlist)
  const cartHydrated = useCartStore(state => state.isHydrated)
  const wishlistHydrated = useWishlistStore(state => state.isHydrated)

  useEffect(() => {
    if (!cartHydrated) {
      fetchCart()
    }
    if (!wishlistHydrated) {
      fetchWishlist()
    }
  }, [fetchCart, fetchWishlist, cartHydrated, wishlistHydrated])

  return {
    isReady: cartHydrated && wishlistHydrated,
  }
}
