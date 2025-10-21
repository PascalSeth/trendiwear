'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, ShoppingBag, Star, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface WishlistItem {
  id: string
  product: {
    id: string
    name: string
    price: number
    images: string[]
    isInStock: boolean
    professional: {
      firstName: string
      lastName: string
      professionalProfile: {
        businessName: string
        rating: number
      }
    }
    _count: {
      wishlistItems: number
    }
  }
}

interface WishlistResponse {
  items: WishlistItem[]
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWishlist = async () => {
    try {
      const response = await fetch('/api/wishlist')
      if (response.ok) {
        const data: WishlistResponse = await response.json()
        setWishlistItems(data.items)
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWishlist()
  }, [])

  const removeFromWishlist = async (productId: string, itemId: string) => {
    try {
      const response = await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setWishlistItems(prev => prev.filter(item => item.id !== itemId))
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
    }
  }

  const addToCart = async (productId: string) => {
    // This would typically call a cart API
    console.log('Add to cart:', productId)
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
          <p className="text-gray-600">Your saved fashion items</p>
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
                  <Link href={`/products/${item.product.id}`}>
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
                    onClick={() => removeFromWishlist(item.product.id, item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  {!item.product.isInStock && (
                    <Badge variant="destructive" className="absolute top-2 left-2">
                      Out of Stock
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Link href={`/products/${item.product.id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                        {item.product.name}
                      </h3>
                    </Link>

                    <div className="flex items-center text-sm text-gray-600">
                      <span>By {item.product.professional.professionalProfile.businessName}</span>
                      <div className="flex items-center ml-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="ml-1">{item.product.professional.professionalProfile.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        ${item.product.price.toFixed(2)}
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Heart className="w-4 h-4 mr-1" />
                        {item.product._count.wishlistItems}
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        className="flex-1"
                        onClick={() => addToCart(item.product.id)}
                        disabled={!item.product.isInStock}
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
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
