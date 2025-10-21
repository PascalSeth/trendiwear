'use client'

import React, { useState, useEffect } from 'react'
import {  ShoppingBag, Star, Eye, ArrowLeft, Share2, MessageCircle, Truck, Shield, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { WishlistButton } from '@/components/ui/wishlist-button'
import { AddToCartButton } from '@/components/ui/add-to-cart-button'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  description: string
  price: number
  currency: string
  stockQuantity: number
  images: string[]
  videoUrl?: string
  sizes: string[]
  colors: string[]
  material?: string
  careInstructions?: string
  estimatedDelivery?: number
  isCustomizable: boolean
  tags: string[]
  isActive: boolean
  isInStock: boolean
  viewCount: number
  soldCount: number
  createdAt: string
  category: {
    name: string
  }
  collection?: {
    name: string
  }
  professional: {
    firstName: string
    lastName: string
    professionalProfile?: {
      businessName: string
      businessImage: string
      rating: number
      totalReviews: number
    }
  }
  _count: {
    wishlistItems: number
    cartItems: number
    orderItems: number
    reviews: number
  }
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const resolvedParams = await params
        const response = await fetch(`/api/products/${resolvedParams.id}`)
        if (response.ok) {
          const productData = await response.json()
          setProduct(productData)
        }
      } catch (error) {
        console.error('Failed to fetch product:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params])

  const nextImage = () => {
    if (product && currentImageIndex < product.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Link href="/shopping" className="text-blue-600 hover:text-blue-800">
            Back to Shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/Shop" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Shop
            </Link>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900">
                <Share2 className="w-5 h-5" />
              </button>
              <WishlistButton
                productId={product.id}
                variant="inline"
                size="md"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-lg">
              <Image
                src={product.images[currentImageIndex] || "/placeholder-product.jpg"}
                alt={product.name}
                fill
                className="object-cover"
              />

              {/* Navigation Arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    disabled={currentImageIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg disabled:opacity-30"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-800" />
                  </button>
                  <button
                    onClick={nextImage}
                    disabled={currentImageIndex === product.images.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg disabled:opacity-30"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-800" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                {currentImageIndex + 1} / {product.images.length}
              </div>
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-lg flex-shrink-0 overflow-hidden transition-all ${
                      idx === currentImageIndex ? "ring-2 ring-blue-500" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold text-gray-900">{product.currency} {product.price.toFixed(2)}</span>
                <span className="text-sm text-gray-500">• {product.category.name}</span>
              </div>

              {/* Rating and Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span>{product.professional.professionalProfile?.rating || 4.5}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{product.viewCount} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{product.soldCount} sold</span>
                </div>
              </div>
            </div>

            {/* Stock Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Stock Status</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  product.isInStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {product.isInStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {product.stockQuantity} items available
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Description</h3>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Product Specifications */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.sizes.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-900">Available Sizes:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {product.sizes.map((size, idx) => (
                          <span key={idx} className="px-3 py-1 bg-white text-gray-700 text-sm rounded-md border">
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.colors.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-900">Available Colors:</span>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {product.colors.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: color.toLowerCase() }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {product.material && (
                    <div>
                      <span className="font-medium text-gray-900">Material:</span>
                      <p className="text-gray-700 mt-1">{product.material}</p>
                    </div>
                  )}

                  {product.estimatedDelivery && (
                    <div>
                      <span className="font-medium text-gray-900">Estimated Delivery:</span>
                      <p className="text-gray-700 mt-1">{product.estimatedDelivery} days</p>
                    </div>
                  )}

                  <div>
                    <span className="font-medium text-gray-900">Customizable:</span>
                    <p className="text-gray-700 mt-1">{product.isCustomizable ? 'Yes' : 'No'}</p>
                  </div>

                  {product.tags.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-900">Tags:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {product.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Care Instructions */}
              {product.careInstructions && (
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Care Instructions</h3>
                  <p className="text-gray-700 leading-relaxed">{product.careInstructions}</p>
                </div>
              )}

              {/* Video */}
              {product.videoUrl && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Video</h3>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      src={product.videoUrl}
                      controls
                      className="w-full h-full object-cover"
                      poster={product.images[0]}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Seller Information</h3>
              <div className="flex items-center gap-3">
                <Image
                  src={product.professional.professionalProfile?.businessImage || "/placeholder-avatar.jpg"}
                  alt={product.professional.firstName}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900">
                    {product.professional.professionalProfile?.businessName || `${product.professional.firstName} ${product.professional.lastName}`}
                  </p>
                  {product.professional.professionalProfile?.businessName && (
                    <p className="text-sm text-gray-600">{product.professional.firstName} {product.professional.lastName}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs text-gray-600">
                      {product.professional.professionalProfile?.rating || 4.5} ({product.professional.professionalProfile?.totalReviews || 0} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <AddToCartButton
                productId={product.id}
                variant="primary"
                size="lg"
                className="w-full"
              />
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 px-6 rounded-lg font-medium">
                Contact Seller
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="w-4 h-4" />
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RotateCcw className="w-4 h-4" />
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-5 h-5 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900">Reviews ({product._count.reviews})</h3>
          </div>

          {product._count.reviews === 0 ? (
            <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="space-y-4">
              {/* Reviews would be mapped here */}
              <p className="text-gray-600">Reviews loading...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}