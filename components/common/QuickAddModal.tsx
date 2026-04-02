'use client'

import React, { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AddToCartButton } from '@/components/ui/add-to-cart-button'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    id: string
    name: string
    price: number
    currency: string
    images: string[]
    sizes?: string[]
    colors?: string[]
    stockQuantity: number
    isPreorder?: boolean
    effectivePrice?: number
    isDiscountActive?: boolean
  }
}

export function QuickAddModal({ isOpen, onClose, product }: QuickAddModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity] = useState(1)

  const isOutOfStock = product.stockQuantity === 0 && !product.isPreorder
  const hasSizes = product.sizes && product.sizes.length > 0
  const hasColors = product.colors && product.colors.length > 0

  const canAddToCart = (!hasSizes || selectedSize) && (!hasColors || selectedColor)

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-white p-0 flex flex-col overflow-hidden border-l border-stone-200">
        <SheetHeader className="px-6 py-6 border-b border-stone-100 flex flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-xl font-serif italic tracking-tight">Quick Add</SheetTitle>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X size={20} className="text-stone-400" />
          </button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
          {/* Product Preview */}
          <div className="flex gap-6 items-start">
            <div className="relative w-32 h-40 rounded-2xl overflow-hidden bg-stone-50 shadow-sm flex-shrink-0">
              <Image
                src={product.images[0] || "/placeholder-product.jpg"}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-serif text-stone-900 leading-tight">{product.name}</h3>
              <div className="flex items-baseline gap-2">
                {product.isDiscountActive ? (
                  <>
                    <span className="text-2xl font-serif italic text-rose-600">{product.currency}{(product.effectivePrice || product.price).toFixed(2)}</span>
                    <span className="text-sm text-stone-400 line-through">{product.currency}{product.price.toFixed(2)}</span>
                  </>
                ) : (
                  <span className="text-2xl font-serif italic text-stone-900">{product.currency}{product.price.toFixed(2)}</span>
                )}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                {isOutOfStock ? "Out of Stock" : product.isPreorder ? "Available for Pre-order" : "In Stock"}
              </p>
            </div>
          </div>

          <div className="h-px bg-stone-100 w-full" />

          {/* Size Selection */}
          {hasSizes && (
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Select Size</label>
              <div className="flex flex-wrap gap-2">
                {product.sizes?.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "min-w-[3.5rem] h-12 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                      selectedSize === size 
                        ? "bg-black text-white border-black shadow-lg shadow-black/20" 
                        : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {hasColors && (
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Select Color</label>
              <div className="flex flex-wrap gap-4">
                {product.colors?.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "relative w-10 h-10 rounded-full border border-stone-200 transition-all shadow-sm",
                      selectedColor === color ? "ring-2 ring-black ring-offset-4 scale-110" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-full">
                        <Check size={16} className="text-white drop-shadow-md mix-blend-difference" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="p-6 bg-stone-50 border-t border-stone-100">
          <AddToCartButton
            productId={product.id}
            variant="primary"
            selectedSize={selectedSize}
            selectedColor={selectedColor}
            quantity={quantity}
            isOutOfStock={isOutOfStock}
            className={cn(
              "w-full h-16 rounded-full text-[11px] font-black uppercase tracking-[0.4em] transition-all",
              !canAddToCart && "opacity-50 pointer-events-none"
            )}
            onCartChange={(isInCart) => {
              if (isInCart) {
                setTimeout(onClose, 500)
              }
            }}
          />
          {!canAddToCart && (
            <p className="text-[10px] font-medium text-rose-500 mt-4 text-center tracking-widest uppercase">
              Please select {hasSizes && !selectedSize ? "size" : ""}{hasSizes && !selectedSize && hasColors && !selectedColor ? " and " : ""}{hasColors && !selectedColor ? "color" : ""}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
