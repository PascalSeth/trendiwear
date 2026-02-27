'use client'

import { useEffect } from 'react'
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
  const fetchCart = useCartStore(state => state.fetchCart)
  const fetchWishlist = useWishlistStore(state => state.fetchWishlist)
  const cartHydrated = useCartStore(state => state.isHydrated)
  const wishlistHydrated = useWishlistStore(state => state.isHydrated)

  useEffect(() => {
    // Only fetch if not already hydrated
    if (!cartHydrated) {
      fetchCart()
    }
    if (!wishlistHydrated) {
      fetchWishlist()
    }
  }, [fetchCart, fetchWishlist, cartHydrated, wishlistHydrated])

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
