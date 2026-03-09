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
import { PAYSTACK_CONFIG } from '@/lib/paystack'

export default function CartPage() {
  const cartItems = useCartStore(selectCartItems)
  const summary = useCartStore(selectCartSummary)
  const updateQuantity = useCartStore(state => state.updateQuantity)
  const removeItem = useCartStore(state => state.removeItem)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  // Paystack config is created dynamically to avoid SSR issues

  function generateReference(prefix = 'TZ') {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `${prefix}_${timestamp}_${random}`.toUpperCase()
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setUpdatingItems(prev => new Set(prev).add(itemId))

    try {
      await updateQuantity(itemId, newQuantity)
    } catch (error) {
      console.error('Failed to update quantity:', error)
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
    } catch (error) {
      console.error('Failed to remove item:', error)
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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="w-28 h-28 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingCart className="h-12 w-12 text-stone-400" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold text-stone-900 mb-3 tracking-tight">Your bag is empty</h1>
            <p className="text-stone-500 mb-8 leading-relaxed">
              Discover our curated collection and add your favorite pieces to your bag.
            </p>
            <Link href="/shopping">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="bg-black hover:bg-stone-800 text-white rounded-full px-8 py-6 font-semibold text-base shadow-lg">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Explore Collection
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-black rounded-full">
              <ShoppingCart className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight">Your Bag</h1>
          </div>
          <p className="text-stone-500 ml-16">{summary?.itemCount} item{summary?.itemCount !== 1 ? 's' : ''} ready for checkout</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-stone-50 rounded-3xl p-5 lg:p-6 hover:bg-stone-100 transition-all duration-300"
                  >
                    <div className="flex gap-5 lg:gap-6">
                      {/* Product Image */}
                      <Link href={`/shopping/products/${item.product.id}`} className="flex-shrink-0">
                        <div className="relative w-28 h-28 lg:w-36 lg:h-36 rounded-2xl overflow-hidden bg-white shadow-md">
                          <Image
                            src={item.product.images[0] || "/placeholder-product.jpg"}
                            alt={item.product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <Link href={`/shopping/products/${item.product.id}`}>
                              <h3 className="text-lg lg:text-xl font-semibold text-stone-900 hover:text-black leading-snug line-clamp-2">
                                {item.product.name}
                              </h3>
                            </Link>
                            <p className="text-sm text-stone-500 mt-1">
                              by {item.product.professional.professionalProfile?.businessName ||
                                  `${item.product.professional.firstName} ${item.product.professional.lastName}`}
                            </p>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={updatingItems.has(item.id)}
                            className="h-9 w-9 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                          >
                            <X className="w-5 h-5" strokeWidth={2} />
                          </button>
                        </div>

                        {/* Size/Color */}
                        {(item.size || item.color) && (
                          <div className="flex items-center gap-2 mt-3 text-sm">
                            {item.size && (
                              <span className="bg-white px-3 py-1 rounded-lg text-stone-600 border border-stone-200">
                                {item.size}
                              </span>
                            )}
                            {item.color && (
                              <span className="bg-white px-3 py-1 rounded-lg text-stone-600 border border-stone-200">
                                {item.color}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Price & Quantity */}
                        <div className="flex items-center justify-between mt-4 lg:mt-6">
                          {/* Price */}
                          {item.product.isDiscountActive ? (
                            <div className="flex items-center gap-3">
                              <span className="text-xl lg:text-2xl font-bold text-black">
                                {item.product.currency} {((item.product.effectivePrice || item.product.price) * item.quantity).toFixed(0)}
                              </span>
                              <span className="text-sm text-stone-400 line-through">
                                {(item.product.price * item.quantity).toFixed(0)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xl lg:text-2xl font-bold text-black">
                              {item.product.currency} {(item.product.price * item.quantity).toFixed(0)}
                            </span>
                          )}

                          {/* Quantity Controls */}
                          <div className="flex items-center bg-white rounded-full shadow-sm border border-stone-200">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={updatingItems.has(item.id) || item.quantity <= 1}
                              className="h-10 w-10 flex items-center justify-center hover:bg-stone-50 rounded-l-full disabled:opacity-40 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            <span className="w-10 text-center font-semibold">
                              {updatingItems.has(item.id) ? (
                                <span className="inline-block w-4 h-4 border-2 border-stone-300 border-t-black rounded-full animate-spin" />
                              ) : (
                                item.quantity
                              )}
                            </span>

                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={updatingItems.has(item.id) || item.quantity >= item.product.stockQuantity}
                              className="h-10 w-10 flex items-center justify-center hover:bg-stone-50 rounded-r-full disabled:opacity-40 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-stone-50 rounded-3xl p-6 lg:p-8 sticky top-8"
            >
              <h2 className="text-xl font-bold text-stone-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Subtotal</span>
                  <span className="font-medium text-stone-900">{summary?.subtotal.toFixed(0)} GHS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Shipping</span>
                  <span className="text-stone-500 text-xs">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Tax (3%)</span>
                  <span className="font-medium text-stone-900">{((summary?.subtotal || 0) * 0.03).toFixed(0)} GHS</span>
                </div>
                <div className="border-t border-stone-200 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-stone-900">Total</span>
                    <span className="text-black">{summary?.estimatedTotal.toFixed(0)} GHS</span>
                  </div>
                </div>
              </div>

              {/* Promo hint */}
              <div className="bg-white rounded-2xl p-4 mb-6 border border-stone-200">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-stone-400" />
                  <p className="text-sm text-stone-600">Free shipping on orders over 500 GHS</p>
                </div>
              </div>

              <div className="space-y-3">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    onClick={async () => {
                      if (isProcessing) return
                      setIsProcessing(true)

                      try {
                        // Fetch default address
                        const addrRes = await fetch('/api/addresses')
                        const addrData = await addrRes.json()

                        if (!addrRes.ok || !addrData.addresses || addrData.addresses.length === 0) {
                          toast.error('Please add a delivery address before checking out')
                          router.push('/addresses')
                          return
                        }

                        const addressId = addrData.addresses[0].id

                        // Get user email
                        const meRes = await fetch('/api/me')
                        const meData = await meRes.json()
                        const email = meData?.user?.email || ''

                        // Generate client-side reference and set paystack config
                        const clientRef = generateReference('TZ')
                        const amountPesewas = Math.round((summary?.estimatedTotal || 0) * 100)

                        // Store checkout data in localStorage for recovery after payment
                        const checkoutData = {
                          addressId,
                          items: cartItems.map(i => ({
                            productId: i.product.id,
                            quantity: i.quantity,
                            size: i.size,
                            color: i.color,
                          })),
                          reference: clientRef,
                          total: summary?.estimatedTotal || 0,
                        }
                        localStorage.setItem('pendingCheckout', JSON.stringify(checkoutData))

                        // Open Paystack inline popup directly - order will be created after successful payment
                        setTimeout(async () => {
                          const paystack = await import('react-paystack')
                          const initializePayment = paystack.usePaystackPayment({
                            reference: clientRef,
                            email,
                            amount: amountPesewas,
                            publicKey: PAYSTACK_CONFIG.publicKey,
                            currency: 'GHS',
                          })

                          initializePayment({
                            onSuccess: async (ref: { reference: string }) => {
                              // Verify payment first before creating order
                              try {
                                const verifyRes = await fetch(`/api/payments/verify?reference=${encodeURIComponent(ref.reference)}`)
                                const verifyData = await verifyRes.json()

                                if (!verifyRes.ok || !verifyData.success) {
                                  throw new Error(verifyData.error || 'Payment verification failed')
                                }

                                // Create order AFTER successful payment verification
                                const orderRes = await fetch('/api/orders', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    addressId, 
                                    items: cartItems.map(i => ({
                                      productId: i.product.id,
                                      quantity: i.quantity,
                                      size: i.size,
                                      color: i.color,
                                    })),
                                    paystackReference: ref.reference,
                                    paymentStatus: 'PAID',
                                  }),
                                })

                                const order = await orderRes.json()

                                if (!orderRes.ok) {
                                  throw new Error(order.error || 'Failed to create order')
                                }

                                // Clear pending checkout
                                localStorage.removeItem('pendingCheckout')
                                
                                toast.success('Payment successful! Order placed.')
                                router.push(`/orders/${order.id}/payment-complete?reference=${ref.reference}`)
                              } catch (orderError) {
                                console.error('Order creation error:', orderError)
                                toast.error('Payment successful but order creation failed. Please contact support.')
                                router.push('/orders')
                              }
                            },
                            onClose: () => {
                              toast('Payment window closed. Your items are still in the cart.')
                              localStorage.removeItem('pendingCheckout')
                            },
                          })
                        }, 50)
                      } catch (err) {
                        console.error('Checkout error:', err)
                        toast.error(err instanceof Error ? err.message : 'Checkout failed')
                      } finally {
                        setIsProcessing(false)
                      }
                    }}
                    disabled={isProcessing}
                    className="w-full bg-black hover:bg-stone-800 text-white py-6 rounded-full font-semibold text-base shadow-lg hover:shadow-xl transition-all"
                  >
                    {isProcessing ? 'Processing…' : (
                      <>
                        Checkout
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>

                <Link href="/shopping" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full border-stone-300 hover:border-black hover:bg-black hover:text-white rounded-full py-5 font-medium transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}