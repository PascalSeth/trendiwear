'use client'

import React, { useState } from 'react'
import { ShoppingCart, Minus, Plus, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { CartCountBadge } from '@/components/ui/cart-count-badge'
import { useCartStore, selectCartItems, selectCartSummary } from '@/lib/stores'

export function CartSheetTrigger() {
  const cartItems = useCartStore(selectCartItems)
  const summary = useCartStore(selectCartSummary)
  const updateQuantity = useCartStore(state => state.updateQuantity)
  const removeItem = useCartStore(state => state.removeItem)
  const [open, setOpen] = useState(false)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const router = useRouter()

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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-stone-100 transition-all duration-200 group">
          <ShoppingCart className="h-5 w-5 text-stone-600 group-hover:text-stone-950 transition-colors" strokeWidth={1.5} />
          <div className="absolute -top-0.5 -right-0.5">
            <CartCountBadge />
          </div>
        </button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md z-[10000] bg-white p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-stone-100">
          <SheetTitle className="flex items-center gap-3 text-lg font-bold tracking-tight">
            <div className="p-2 bg-stone-950 rounded-full">
              <ShoppingCart className="h-4 w-4 text-white" strokeWidth={1.5} />
            </div>
            Your Bag
            <span className="text-stone-400 font-normal text-sm">({summary?.itemCount || 0})</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {cartItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingCart className="h-8 w-8 text-stone-400" />
                </div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">Your bag is empty</h3>
                <p className="text-stone-500 mb-6">Discover our collection and add items to your bag</p>
                <Button
                  onClick={() => setOpen(false)}
                  className="bg-black hover:bg-stone-800 text-white rounded-full px-8 py-3 font-medium"
                >
                  Start Shopping
                </Button>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative bg-stone-50 rounded-2xl p-3 hover:bg-stone-100 transition-colors duration-200"
                    >
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <Link
                          href={`/shopping/products/${item.product.slug}`}
                          onClick={() => setOpen(false)}
                          className="relative w-24 h-24 rounded-xl overflow-hidden bg-white flex-shrink-0 shadow-sm"
                        >
                          <Image
                            src={item.product.images[0] || "/placeholder-product.jpg"}
                            alt={item.product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0 py-1">
                          <Link
                            href={`/shopping/products/${item.product.slug}`}
                            onClick={() => setOpen(false)}
                          >
                            <h4 className="text-[14px] font-semibold text-stone-900 hover:text-stone-950 line-clamp-2 leading-tight">
                              {item.product.name}
                            </h4>
                          </Link>

                          {/* Size/Color */}
                          {(item.size || item.color) && (
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-500">
                              {item.size && <span className="bg-white px-2 py-0.5 rounded-md border border-stone-200">{item.size}</span>}
                              {item.color && (
                                <span 
                                  className="w-4 h-4 rounded-full border border-stone-200 shadow-sm shrink-0" 
                                  style={{ backgroundColor: item.color }}
                                  title={item.color}
                                />
                              )}
                            </div>
                          )}

                          {/* Price */}
                          <div className="mt-2">
                            {item.product.isDiscountActive ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-black">
                                  {item.product.currency} {(item.product.effectivePrice || item.product.price).toFixed(2)}
                                </span>
                                <span className="text-xs text-stone-400 line-through">
                                  {item.product.price.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-black">
                                {item.product.currency} {item.product.price.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center bg-white rounded-full shadow-sm border border-stone-200">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={updatingItems.has(item.id) || item.quantity <= 1}
                                className="h-8 w-8 flex items-center justify-center hover:bg-stone-50 rounded-l-full disabled:opacity-40 transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <span className="w-8 text-center text-sm font-semibold">
                                {updatingItems.has(item.id) ? (
                                  <span className="inline-block w-3 h-3 border-2 border-stone-300 border-t-black rounded-full animate-spin" />
                                ) : (
                                  item.quantity
                                )}
                              </span>

                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                disabled={updatingItems.has(item.id) || item.quantity >= item.product.stockQuantity}
                                className="h-8 w-8 flex items-center justify-center hover:bg-stone-50 rounded-r-full disabled:opacity-40 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={updatingItems.has(item.id)}
                              className="h-8 w-8 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                            >
                              <X className="w-4 h-4" strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>

          {/* Cart Summary & Actions */}
          {cartItems.length > 0 && (
            <div className="border-t border-stone-200 bg-stone-50 px-6 py-5 space-y-4">
              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Subtotal</span>
                  <span className="font-medium text-stone-900">{summary?.subtotal.toFixed(2)} GHS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Handling Fee (3%)</span>
                  <span className="font-medium text-stone-900">{((summary?.subtotal || 0) * 0.03).toFixed(2)} GHS</span>
                </div>
                <div className="flex justify-between text-[16px] font-bold pt-2 border-t border-stone-200">
                  <span className="text-stone-900">Total</span>
                  <span className="text-stone-950">{summary?.estimatedTotal.toFixed(2)} GHS</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    onClick={() => {
                      setOpen(false)
                      router.push('/checkout')
                    }}
                    className="w-full bg-stone-950 hover:bg-stone-900 text-white py-6 rounded-full font-bold text-[15px] shadow-lg hover:shadow-xl transition-all"
                  >
                    Checkout
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>

                <Link href="/cart" onClick={() => setOpen(false)} className="block">
                  <Button variant="outline" className="w-full border-stone-300 hover:border-black hover:bg-black hover:text-white rounded-full py-5 font-medium transition-all duration-200">
                    View Full Bag
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}