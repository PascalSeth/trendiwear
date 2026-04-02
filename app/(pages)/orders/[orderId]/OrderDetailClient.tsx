'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, MapPin, Package, Truck, CheckCircle, Clock,
  CreditCard, PackageCheck, Loader2, AlertCircle, Copy, Check
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

// --- Types ---
interface OrderItem {
  id: string
  quantity: number
  price: number
  size?: string
  color?: string
  product: {
    id: string
    name: string
    images: string[]
    price: number
    currency: string
    professional: {
      firstName: string
      lastName: string
      professionalProfile?: {
        businessName: string
        slug: string
      }
    }
  }
}

interface Order {
  id: string
  status: string
  paymentStatus: string
  totalPrice: number
  subtotal: number
  shippingCost: number
  platformFee: number
  tax: number
  trackingNumber?: string
  deliveryMethod: string
  createdAt: string
  actualDelivery?: string
  paystackPaidAt?: string
  address: {
    street: string
    city: string
    state: string
    country: string
    zipCode?: string
  }
  items: OrderItem[]
  deliveryConfirmation?: {
    customerConfirmed: boolean
    confirmedAt?: string
    confirmationDeadline: string
  }
}

interface Props {
  order: Order
  isCustomer: boolean
}

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  PENDING:      { color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200', icon: <Clock size={16} />,       label: 'Payment Pending' },
  PROCESSING:   { color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',  icon: <Package size={16} />,     label: 'Processing' },
  CONFIRMED:    { color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200', icon: <CheckCircle size={16} />, label: 'Confirmed' },
  SHIPPED:      { color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200', icon: <Truck size={16} />,       label: 'In Transit' },
  DELIVERED:    { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle size={16} />, label: 'Delivered' },
  CANCELLED:    { color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200',  icon: <AlertCircle size={16} />, label: 'Cancelled' },
}

const timelineSteps = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']

export default function OrderDetailClient({ order, isCustomer }: Props) {
  const [confirmingDelivery, setConfirmingDelivery] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data, mutate } = useSWR(
    `/api/orders/${order.id}`,
    fetcher,
    { 
      fallbackData: order,
      refreshInterval: 15000 
    }
  )

  const currentOrder = data || order
  const cfg = statusConfig[currentOrder.status] || statusConfig.PENDING
  const currency = currentOrder.items[0]?.product?.currency || 'GHS'

  const activeStepIndex = timelineSteps.indexOf(currentOrder.status)

  const copyOrderId = () => {
    navigator.clipboard.writeText(currentOrder.id)
    setCopied(true)
    toast.success('Order ID copied')
    setTimeout(() => setCopied(false), 2000)
  }

  const confirmDelivery = async () => {
    setConfirmingDelivery(true)
    try {
      const res = await fetch(`/api/orders/${currentOrder.id}/confirm-delivery`, { 
        method: 'POST' 
      })
      
      if (res.ok) {
        // Optimistic update
        mutate({
          ...currentOrder,
          status: 'DELIVERED',
          deliveryConfirmation: {
            ...currentOrder.deliveryConfirmation,
            customerConfirmed: true,
            confirmedAt: new Date().toISOString()
          }
        }, false)
        toast.success('Delivery confirmed! Thank you.')
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Failed to confirm delivery')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setConfirmingDelivery(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] pt-24 lg:pt-32 pb-32">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">

        {/* Back Link */}
        <Link href="/orders" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors mb-12">
          <ArrowLeft size={14} /> Back to Orders
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-12 border-b border-stone-200 pb-12">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-stone-400 mb-3">Full Trace</p>
            <h1 className="text-4xl md:text-5xl font-serif italic text-stone-950 leading-tight">
              Order #{currentOrder.id.slice(-8).toUpperCase()}
            </h1>
            <button onClick={copyOrderId} className="mt-3 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy full ID'}
            </button>
          </div>
          <div className={`flex items-center gap-3 px-6 py-3 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
            {cfg.icon}
            <span className="text-xs font-mono uppercase tracking-widest font-bold">{cfg.label}</span>
          </div>
        </motion.div>

        {/* Status Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-stone-100 rounded-3xl p-8 lg:p-12 mb-8 shadow-sm">
          <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400 mb-8">Order Progress</h3>
          <div className="flex items-center justify-between relative">
            {/* Connector line */}
            <div className="absolute top-5 left-5 right-5 h-[2px] bg-stone-100" />
            <div className="absolute top-5 left-5 h-[2px] bg-stone-900 transition-all duration-700" style={{ width: `${Math.max(0, activeStepIndex) / (timelineSteps.length - 1) * 100}%`, maxWidth: 'calc(100% - 40px)' }} />

            {timelineSteps.map((step, idx) => {
              const isCompleted = idx <= activeStepIndex
              const isCurrent = idx === activeStepIndex
              const stepCfg = statusConfig[step] || statusConfig.PENDING
              return (
                <div key={step} className="relative z-10 flex flex-col items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-100 text-stone-300'} ${isCurrent ? 'ring-4 ring-stone-900/10 scale-110' : ''}`}>
                    {stepCfg.icon}
                  </div>
                  <span className={`text-[9px] font-mono uppercase tracking-widest ${isCompleted ? 'text-stone-900 font-bold' : 'text-stone-300'}`}>
                    {stepCfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Items */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-white border border-stone-100 rounded-3xl p-8 lg:p-12 shadow-sm">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400 mb-8">Items ({currentOrder.items.length})</h3>
            <div className="space-y-6">
              {currentOrder.items.map((item: OrderItem) => (
                <div key={item.id} className="flex gap-5 p-4 rounded-2xl hover:bg-stone-50 transition-colors">
                  <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 ring-1 ring-stone-900/5">
                    <Image src={item.product.images[0] || '/placeholder-product.jpg'} alt={item.product.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <Link href={`/shopping/products/${item.product.id}`} className="text-sm font-medium text-stone-900 hover:underline line-clamp-1">
                      {item.product.name}
                    </Link>
                    <div className="flex flex-wrap gap-2">
                      {item.size && (
                        <span className="text-[10px] font-mono uppercase tracking-widest bg-stone-100 text-stone-500 px-3 py-1 rounded-full">
                          Size: {item.size}
                        </span>
                      )}
                      {item.color && (
                        <span 
                          className="w-4 h-4 rounded-full border border-stone-200 shadow-sm shrink-0" 
                          style={{ backgroundColor: item.color }} 
                          title={item.color}
                        />
                      )}
                      <span className="text-[10px] font-mono uppercase tracking-widest bg-stone-100 text-stone-500 px-3 py-1 rounded-full">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    {item.product.professional?.professionalProfile && (
                      <Link href={`/tz/${item.product.professional.professionalProfile.slug}`} className="text-[10px] font-mono text-stone-400 hover:text-stone-900 uppercase tracking-widest transition-colors">
                        by {item.product.professional.professionalProfile.businessName}
                      </Link>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-stone-900">{currency} {(item.price * item.quantity).toFixed(2)}</p>
                    {item.quantity > 1 && (
                      <p className="text-[10px] text-stone-400 font-mono">{currency} {item.price.toFixed(2)} each</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="mt-10 pt-8 border-t border-stone-100 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span className="font-medium">{currency} {currentOrder.subtotal.toFixed(2)}</span>
              </div>
              {currentOrder.shippingCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Shipping</span>
                  <span className="font-medium">{currency} {currentOrder.shippingCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Platform Fee</span>
                <span className="font-medium">{currency} {currentOrder.platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg pt-4 border-t border-stone-200">
                <span className="font-serif text-stone-900">Total</span>
                <span className="font-serif font-medium text-stone-900">{currency} {currentOrder.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>

          {/* Right Sidebar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-6">

            {/* Delivery Address */}
            <div className="bg-white border border-stone-100 rounded-3xl p-8 shadow-sm space-y-4">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400">Delivery Address</h3>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-stone-50 rounded-2xl flex-shrink-0">
                  <MapPin size={18} className="text-stone-600" />
                </div>
                <div className="text-sm text-stone-600 font-serif italic leading-relaxed">
                  {currentOrder.address.street}<br />
                  {currentOrder.address.city}, {currentOrder.address.state}<br />
                  {currentOrder.address.zipCode && `${currentOrder.address.zipCode}, `}{currentOrder.address.country}
                </div>
              </div>
              <div className="pt-3 border-t border-stone-50">
                <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full ${currentOrder.deliveryMethod === 'PICKUP' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                  {currentOrder.deliveryMethod === 'PICKUP' ? 'Store Pickup' : 'Home Delivery'}
                </span>
              </div>
            </div>

            {/* Tracking Info */}
            {currentOrder.trackingNumber && (
              <div className="bg-white border border-stone-100 rounded-3xl p-8 shadow-sm space-y-4">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400">Tracking</h3>
                <div className="flex items-center gap-3">
                  <Truck size={18} className="text-violet-600" />
                  <span className="font-mono text-sm text-stone-900">{currentOrder.trackingNumber}</span>
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div className="bg-white border border-stone-100 rounded-3xl p-8 shadow-sm space-y-4">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400">Payment</h3>
              <div className="flex items-center gap-3">
                <CreditCard size={18} className="text-stone-600" />
                <span className={`text-xs font-mono uppercase tracking-widest ${currentOrder.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {currentOrder.paymentStatus}
                </span>
              </div>
              {currentOrder.paystackPaidAt && (
                <p className="text-[10px] font-mono text-stone-400">
                  Paid on {new Date(currentOrder.paystackPaidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white border border-stone-100 rounded-3xl p-8 shadow-sm space-y-4">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={14} className="text-stone-400" />
                  <span className="text-stone-500">Placed: {new Date(currentOrder.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                {currentOrder.paystackPaidAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <CreditCard size={14} className="text-emerald-500" />
                    <span className="text-stone-500">Paid: {new Date(currentOrder.paystackPaidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
                {currentOrder.actualDelivery && (
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span className="text-stone-500">Delivered: {new Date(currentOrder.actualDelivery).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Confirm Delivery CTA */}
            {isCustomer && currentOrder.status === 'SHIPPED' && (
              <div className="bg-violet-50 border border-violet-200 rounded-3xl p-8 space-y-4">
                <div className="flex items-center gap-3 text-violet-700">
                  <Truck size={18} />
                  <span className="text-xs font-mono uppercase tracking-widest font-bold">Package In Transit</span>
                </div>
                <p className="text-sm text-violet-600 leading-relaxed">
                  Once your package arrives, please confirm to complete the order.
                </p>
                <button
                  onClick={confirmDelivery}
                  disabled={confirmingDelivery}
                  className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white h-14 rounded-2xl font-mono text-[10px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                >
                  {confirmingDelivery ? (
                    <><Loader2 size={14} className="animate-spin" /> Confirming...</>
                  ) : (
                    <><PackageCheck size={14} /> Confirm Delivery</>
                  )}
                </button>
              </div>
            )}

            {/* Delivery Confirmed */}
            {currentOrder.status === 'DELIVERED' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 flex items-center gap-4">
                <CheckCircle size={24} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest font-bold text-emerald-800">Delivery Confirmed</p>
                  {currentOrder.deliveryConfirmation?.confirmedAt && (
                    <p className="text-[10px] text-emerald-600 font-mono mt-1">
                      {new Date(currentOrder.deliveryConfirmation.confirmedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
