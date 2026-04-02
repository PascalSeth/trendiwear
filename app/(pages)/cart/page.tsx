'use client'

import React, { useState } from 'react'
import { Minus, Plus, X, ShoppingCart, ArrowLeft, ArrowRight, Package } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useCartStore, selectCartItems, selectCartSummary } from '@/lib/stores'

export default function CartPage() {
  const cartItems = useCartStore(selectCartItems)
  const summary = useCartStore(selectCartSummary)
  const updateQuantity = useCartStore(state => state.updateQuantity)
  const removeItem = useCartStore(state => state.removeItem)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setUpdatingItems(prev => new Set(prev).add(itemId))

    try {
      await updateQuantity(itemId, newQuantity)
    } catch (error) {
      console.error('Failed to update quantity:', error)
      toast.error('Failed to update quantity')
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId))

    try {
      await removeItem(itemId)
      toast.success('Item removed from bag')
    } catch (error) {
      console.error('Failed to remove item:', error)
      toast.error('Failed to remove item')
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-6">
              <ShoppingCart className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your bag is empty</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven&apos;t added anything to your bag yet. 
              Explore our latest collections and find something you&apos;ll love.
            </p>
            <Link href="/shopping">
              <Button size="lg" className="bg-black text-white hover:bg-zinc-800 px-8">
                Start Shopping
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Bag</h1>
            <p className="text-gray-600 mt-1">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your bag</p>
          </div>
          <Link 
            href="/shopping"
            className="text-sm font-medium text-black hover:underline flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-4">
            <AnimatePresence mode="popLayout">
              {cartItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm"
                >
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <Image
                        src={item.product?.images?.[0] || '/placeholder-product.jpg'}
                        alt={item.product?.name || 'Product Image'}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 truncate">
                            {item.product?.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Sold by <span className="text-black font-medium">
                              {item.product?.professional?.professionalProfile?.businessName || 
                               `${item.product?.professional?.firstName} ${item.product?.professional?.lastName}`}
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={updatingItems.has(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 mb-4">
                        {item.color && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: item.color }} />
                            {item.color}
                          </div>
                        )}
                        {item.size && (
                          <div className="flex items-center gap-1.5">
                            <Package className="w-4 h-4" />
                            Size: {item.size}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                            className="p-2 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={updatingItems.has(item.id)}
                            className="p-2 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            GHS {((item.product?.effectivePrice || item.product?.price || 0) * item.quantity).toFixed(2)}
                          </p>
                          {(item.quantity > 1) && (
                            <p className="text-xs text-gray-500">
                              GHS {(item.product?.effectivePrice || item.product?.price || 0).toFixed(2)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Checkout Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
            <div className="bg-black text-white rounded-3xl p-8 shadow-xl shadow-black/10">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal ({summary?.itemCount || 0} items)</span>
                  <span>GHS {summary?.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Handling Fee (3%)</span>
                  <span>GHS {((summary?.subtotal || 0) * 0.03).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Standard Delivery</span>
                  <span className="text-emerald-400 font-medium">FREE</span>
                </div>
                <div className="h-px bg-zinc-800 my-4" />
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>GHS {summary?.estimatedTotal?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={() => {
                    setIsProcessing(true)
                    router.push('/checkout')
                  }}
                  className="w-full h-14 bg-white text-black hover:bg-zinc-100 rounded-2xl text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <p className="text-center text-xs text-zinc-500 px-4">
                  By clicking &quot;Proceed to Checkout&quot;, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>

              {/* Secure Payment Badges */}
              <div className="mt-8 pt-8 border-t border-zinc-800 flex flex-col items-center gap-4">
                <div className="flex gap-4 grayscale opacity-50">
                  <div className="h-6 w-10 bg-white/10 rounded" />
                  <div className="h-6 w-10 bg-white/10 rounded" />
                  <div className="h-6 w-10 bg-white/10 rounded" />
                </div>
                <p className="text-[10px] text-zinc-500 flex items-center gap-1.5 justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Secure checkout powered by Paystack
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}