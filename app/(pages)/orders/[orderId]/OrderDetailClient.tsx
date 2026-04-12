'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, MapPin, Package, Truck, CheckCircle, Clock,
  CreditCard, PackageCheck, Loader2, AlertCircle, Copy, Check, Info
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
  status: string // Item-level status
  deliveryFee?: number // Seller-input offline fee
  professionalId: string
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
        location: string
        latitude?: number
        longitude?: number
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
    latitude?: number
    longitude?: number
  }
  items: OrderItem[]
  deliveryConfirmations?: Array<{
    professionalId: string
    customerConfirmed: boolean
    confirmedAt?: string
    status: string
    riderName?: string
    riderPhone?: string
    trackingNumber?: string
  }>
}

interface Props {
  order: Order
  isCustomer: boolean
}

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  PENDING:          { color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',  icon: <Clock size={16} />,       label: 'Pending' },
  CONFIRMED:        { color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200', icon: <CheckCircle size={16} />, label: 'Confirmed' },
  PROCESSING:       { color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',   icon: <Package size={16} />,     label: 'Processing' },
  SHIPPED:          { color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200', icon: <Truck size={16} />,       label: 'In Transit' },
  READY_FOR_PICKUP: { color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200', icon: <Package size={16} />,     label: 'Ready for Pickup' },
  READY_FOR_DELIVERY: { color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', icon: <Truck size={16} />,      label: 'Out for Delivery' },
  DELIVERED:        { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle size={16} />, label: 'Delivered' },
  CANCELLED:        { color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200',   icon: <AlertCircle size={16} />, label: 'Cancelled' },
}

export default function OrderDetailClient({ order, isCustomer }: Props) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null) // professionalId
  const [copied, setCopied] = useState(false)

  const { data, mutate } = useSWR(
    `/api/orders/${order.id}`,
    fetcher,
    { 
      fallbackData: order,
      refreshInterval: 10000 
    }
  )

  const currentOrder = (data as Order) || order
  const currency = currentOrder.items[0]?.product?.currency || 'GHS'

  // Group items by seller (professionalId)
  const packages = React.useMemo(() => {
    const groups: Record<string, OrderItem[]> = {}
    currentOrder.items.forEach(item => {
      if (!groups[item.professionalId]) groups[item.professionalId] = []
      groups[item.professionalId].push(item)
    })
    return groups
  }, [currentOrder.items])

  const copyOrderId = () => {
    navigator.clipboard.writeText(currentOrder.id)
    setCopied(true)
    toast.success('Order ID copied')
    setTimeout(() => setCopied(false), 2000)
  }

  const confirmPackageDelivery = async (professionalId: string) => {
    setLoadingAction(professionalId)
    try {
      const res = await fetch(`/api/orders/${currentOrder.id}/confirm-delivery`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professionalId })
      })
      
      if (res.ok) {
        toast.success('Package confirmed! Payout initiated for this seller.')
        mutate() // Refresh data
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Failed to confirm package')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] pt-24 lg:pt-32 pb-32">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">

        {/* Back Link */}
        <Link href="/orders" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors mb-12">
          <ArrowLeft size={14} /> My Orders
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-12 border-b border-stone-200 pb-12">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-stone-400 mb-3">Order Trace</p>
            <h1 className="text-4xl md:text-5xl font-serif italic text-stone-950 leading-tight">
              Order #{currentOrder.id.slice(-8).toUpperCase()}
            </h1>
            <div className="flex items-center gap-6 mt-4">
              <button onClick={copyOrderId} className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy ID'}
              </button>
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
                Placed on {new Date(currentOrder.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
             <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Overall Status</span>
             <StatusBadge status={currentOrder.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left: Packages (Multi-Seller) */}
          <div className="lg:col-span-8 space-y-10">
            <div>
               <h2 className="text-2xl font-serif mb-2">Packages</h2>
               <p className="text-stone-500 text-sm">Each seller manages their own delivery and status updates.</p>
            </div>

            {Object.entries(packages).map(([profId, items], idx) => {
              const seller = items[0].product.professional.professionalProfile
              const packageStatus = items[0].status
              const confirmation = currentOrder.deliveryConfirmations?.find(c => c.professionalId === profId)
              const isDelivered = packageStatus === 'DELIVERED' || confirmation?.customerConfirmed

              return (
                <motion.div 
                  key={profId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white border border-stone-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Package Header */}
                  <div className="p-8 border-b border-stone-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center border border-stone-100 italic font-serif text-stone-400">
                        {seller?.businessName?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <h4 className="font-medium text-stone-900">{seller?.businessName || 'Seller'}</h4>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Package {idx + 1}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <StatusBadge status={packageStatus} />
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-8 space-y-6">
                     {items.map(item => (
                       <div key={item.id} className="flex gap-6">
                         <div className="relative w-20 h-24 rounded-2xl overflow-hidden bg-stone-50 flex-shrink-0 border border-stone-100">
                            <Image src={item.product.images[0] || '/placeholder-product.jpg'} alt={item.product.name} fill className="object-cover" />
                         </div>
                         <div className="flex-1 min-w-0 py-1">
                            <h5 className="text-sm font-medium text-stone-900 mb-1">{item.product.name}</h5>
                            <div className="flex gap-2 mb-3">
                               {item.size && <span className="text-[9px] font-mono uppercase tracking-widest bg-stone-50 px-2 py-0.5 border border-stone-100 rounded">{item.size}</span>}
                               <span className="text-[9px] font-mono uppercase tracking-widest bg-stone-50 px-2 py-0.5 border border-stone-100 rounded">Qty: {item.quantity}</span>
                            </div>
                            <p className="text-xs text-stone-400">{currency} {item.price.toFixed(2)} each</p>
                         </div>
                         <div className="text-right py-1">
                            <span className="text-sm font-medium text-stone-900">{currency} {(item.price * item.quantity).toFixed(2)}</span>
                         </div>
                       </div>
                     ))}
                  </div>

                  {/* Footer Action Card */}
                  <div className={`p-8 bg-stone-50/50 border-t border-stone-50 space-y-6`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       {/* Delivery Info */}
                       <div className="space-y-3">
                          <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-stone-400 block">Delivery Method</label>
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-white rounded-xl border border-stone-100">
                                {currentOrder.deliveryMethod === 'PICKUP' ? <Package size={14} className="text-amber-600" /> : <Truck size={14} className="text-blue-600" />}
                             </div>
                             <span className="text-xs font-medium text-stone-700 capitalize">{currentOrder.deliveryMethod.toLowerCase()}</span>
                          </div>
                          {seller?.location && (
                            <p className="text-xs text-stone-500 leading-relaxed italic ml-10 truncate max-w-[200px]" title={seller.location}>{seller.location}</p>
                          )}
                       </div>

                       {/* Rider Info (Package Specific) */}
                       {confirmation && (confirmation.riderName || confirmation.riderPhone) && (
                         <div className="space-y-3">
                            <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-stone-400 block">Rider Assigned</label>
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-white rounded-xl border border-stone-100">
                                  <Truck size={14} className="text-teal-600" />
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-sm font-bold text-stone-900">{confirmation.riderName || 'Rider'}</span>
                                  {confirmation.riderPhone && (
                                    <a href={`tel:${confirmation.riderPhone}`} className="text-[9px] font-mono text-teal-600 hover:underline uppercase tracking-widest">{confirmation.riderPhone}</a>
                                  )}
                               </div>
                            </div>
                            {confirmation.trackingNumber && (
                              <p className="text-[9px] font-mono text-stone-400 ml-10">Tracking: {confirmation.trackingNumber}</p>
                            )}
                         </div>
                       )}

                       {/* Offline Delivery Fee */}
                       <div className="space-y-3">
                          <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-stone-400 block">Delivery Fee</label>
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-white rounded-xl border border-stone-100">
                                <CreditCard size={14} className="text-stone-400" />
                             </div>
                             <div className="flex flex-col">
                                <span className="text-sm font-bold text-stone-900">
                                   {items[0].deliveryFee ? `${currency} ${items[0].deliveryFee.toFixed(2)}` : 'Wait for quote'}
                                </span>
                                <span className="text-[9px] font-mono text-amber-600 uppercase tracking-widest">Paid In-Person to Seller</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* ACTION BUTTON */}
                    {isCustomer && !isDelivered && (
                      <div className="pt-4">
                        {(packageStatus === 'SHIPPED' || packageStatus === 'READY_FOR_DELIVERY' || packageStatus === 'READY_FOR_PICKUP') ? (
                          <div className="space-y-4">
                            <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                               <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
                               <p className="text-[10px] text-amber-700 leading-relaxed">
                                  Confirm only when you have received the package and paid the delivery fee to the seller. This will release the item funds to them.
                               </p>
                            </div>
                            <button
                              onClick={() => confirmPackageDelivery(profId)}
                              disabled={loadingAction === profId}
                              className="w-full h-14 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-mono text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-stone-900/10"
                            >
                              {loadingAction === profId ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><PackageCheck size={18} /> Confirm Receipt & Release Funds</>}
                            </button>
                          </div>
                        ) : (
                          <div className="h-14 border border-stone-200 border-dashed rounded-2xl flex items-center justify-center text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                            Awaiting Dispatch from Seller
                          </div>
                        )}
                      </div>
                    )}

                    {isDelivered && (
                       <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center gap-4">
                          <CheckCircle className="text-emerald-500" size={24} />
                          <div>
                             <p className="text-xs font-bold text-emerald-900 uppercase tracking-widest">Receipt Confirmed</p>
                             <p className="text-[10px] text-emerald-600 font-mono mt-1">Package successfully received and funds released to {seller?.businessName}.</p>
                          </div>
                       </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Right Sidebar: Summary */}
          <div className="lg:col-span-4 space-y-8">
            {/* Total Balance Sheet */}
            <div className="bg-white border border-stone-100 rounded-[2.5rem] p-8 lg:p-10 shadow-sm sticky top-28">
               <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400 mb-8">Financial Summary</h3>
               
               <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Items Total</span>
                    <span className="font-medium">{currency} {currentOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Handling Fee (3%)</span>
                    <span className="font-medium">{currency} {currentOrder.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm italic">
                    <span className="text-stone-500">Shipping (Online)</span>
                    <span className="font-medium">{currency} 0.00</span>
                  </div>
               </div>

               <div className="pt-8 border-t border-stone-200 mb-8 space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-serif">Online Total</span>
                    <span className="text-3xl font-serif">{currency} {currentOrder.totalPrice.toFixed(2)}</span>
                  </div>
                  <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest">Paid via Paystack</p>
               </div>

               <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl mb-8">
                  <div className="flex items-center gap-3 mb-2">
                     <ShieldCheck size={16} className="text-emerald-600" />
                     <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest">TrendiZip Escrow</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 leading-relaxed">
                     Your payment for the items is held securely. We only release it to each seller separately when you confirm their package.
                  </p>
               </div>

               {/* Delivery Address Review */}
               <div className="space-y-4 pt-8 border-t border-stone-100">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Ship To</h4>
                  <div className="flex items-start gap-3">
                     <MapPin size={14} className="text-stone-400 mt-0.5" />
                     <p className="text-xs text-stone-600 leading-relaxed">
                        {currentOrder.address.street}, {currentOrder.address.city}, {currentOrder.address.state}
                     </p>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.PENDING
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      {cfg.icon}
      <span className="text-[9px] font-mono uppercase tracking-widest font-bold">{cfg.label}</span>
    </div>
  )
}

import { ShieldCheck } from 'lucide-react'
