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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <Link href={`/shopping/products/${item.product.slug || item.product.id}`}>
                    <div className="aspect-square relative overflow-hidden bg-gray-100">
                      {item.product.images[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Heart className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 w-8 h-8 p-0"
                    onClick={() => handleRemove(item.product.id)}
                    disabled={removingIds.has(item.product.id)}
                  >
                    {removingIds.has(item.product.id) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                  {!item.product.isInStock && (
                    <Badge variant="destructive" className="absolute top-2 left-2">
                      Out of Stock
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Link href={`/shopping/products/${item.product.slug}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                        {item.product.name}
                      </h3>
                    </Link>

                    <div className="flex items-center text-sm text-gray-600">
                      <span>By {item.product.professional.professionalProfile?.businessName || `${item.product.professional.firstName} ${item.product.professional.lastName}`}</span>
                      {item.product.professional.professionalProfile?.rating && (
                        <div className="flex items-center ml-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="ml-1">{item.product.professional.professionalProfile.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        {item.product.currency} {item.product.price.toFixed(2)}
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Heart className="w-4 h-4 mr-1 fill-current text-red-500" />
                        {item.product._count.wishlistItems}
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        className="flex-1"
                        onClick={() => handleAddToCart(item.product.id)}
                        disabled={!item.product.isInStock || addingToCartIds.has(item.product.id)}
                      >
                        {addingToCartIds.has(item.product.id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        ) : (
                          <ShoppingBag className="w-4 h-4 mr-2" />
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
