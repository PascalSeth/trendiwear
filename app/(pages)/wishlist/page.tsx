'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, ShoppingBag, Star, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { useWishlistStore, selectWishlistItems, selectWishlistLoading, useCartStore } from '@/lib/stores'

export default function WishlistPage() {
  const wishlistItems = useWishlistStore(selectWishlistItems)
  const loading = useWishlistStore(selectWishlistLoading)
  const removeFromWishlist = useWishlistStore(state => state.removeFromWishlist)
  const addToCart = useCartStore(state => state.addToCart)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  const [addingToCartIds, setAddingToCartIds] = useState<Set<string>>(new Set())

  const handleRemove = async (productId: string) => {
    setRemovingIds(prev => new Set(prev).add(productId))
    
    try {
      const success = await removeFromWishlist(productId)
      if (success) {
        toast.success("Removed from wishlist")
      } else {
        toast.error("Failed to remove from wishlist")
      }
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const handleAddToCart = async (productId: string) => {
    setAddingToCartIds(prev => new Set(prev).add(productId))
    
    try {
      const success = await addToCart(productId)
      if (success) {
        toast.success("Added to cart")
      } else {
        toast.error("Failed to add to cart")
      }
    } finally {
      setAddingToCartIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
          <p className="text-gray-600">{wishlistItems.length} saved item{wishlistItems.length !== 1 ? 's' : ''}</p>
        </div>

        {wishlistItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Heart className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
              <p className="text-gray-500 text-center mb-6">
                Save items you love for later. Start browsing and add items to your wishlist.
              </p>
              <Button asChild>
                <Link href="/shopping">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 lg:gap-4">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="overflow-hidden rounded-xl sm:rounded-2xl border-stone-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300">
                <div className="relative">
                  <Link href={`/shopping/products/${item.product.slug}`}>
                    <div className="aspect-[4/4.7] relative overflow-hidden bg-stone-100">
                      {item.product.images[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Heart className="w-8 h-8 text-stone-300" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 w-7 h-7 p-0 rounded-full shadow-xs"
                    onClick={() => handleRemove(item.product.id)}
                    disabled={removingIds.has(item.product.id)}
                  >
                    {removingIds.has(item.product.id) ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  {!item.product.isInStock && (
                    <Badge variant="destructive" className="absolute top-2 left-2 text-[8px] font-mono uppercase px-1.5 py-0.5">
                      Out of Stock
                    </Badge>
                  )}
                </div>

                <CardContent className="p-2.5 sm:p-3">
                  <div className="space-y-1.5">
                    <Link href={`/shopping/products/${item.product.slug}`} className="block">
                      <h3 className="font-serif font-medium text-xs sm:text-[13px] text-stone-900 hover:text-stone-600 transition-colors line-clamp-1">
                        {item.product.name}
                      </h3>
                    </Link>

                    <div className="flex items-center text-[9px] font-mono text-stone-400 truncate">
                      <span>By {item.product.professional.professionalProfile?.businessName || `${item.product.professional.firstName} ${item.product.professional.lastName}`}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                      <span className="text-xs sm:text-[13px] font-bold font-mono text-stone-900">
                        {item.product.currency} {item.product.price.toFixed(2)}
                      </span>
                      {item.product.professional.professionalProfile?.rating && (
                        <div className="flex items-center gap-0.5 text-[9.5px] font-mono text-stone-500">
                          <Star className="w-2.5 h-2.5 text-stone-900 fill-current" />
                          <span>{item.product.professional.professionalProfile.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-1.5">
                      <Button
                        className="w-full h-7 text-[11px] font-medium rounded-lg"
                        onClick={() => handleAddToCart(item.product.id)}
                        disabled={!item.product.isInStock || addingToCartIds.has(item.product.id)}
                      >
                        {addingToCartIds.has(item.product.id) ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1.5" />
                        ) : (
                          <ShoppingBag className="w-3 h-3 mr-1.5" />
                        )}
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
