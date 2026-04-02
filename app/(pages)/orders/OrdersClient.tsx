'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Truck, Package, CheckCircle, Clock, ShoppingBag, Eye, 
  ArrowRight, CreditCard, MapPin, Search, Loader2, PackageCheck, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

// --- Types ---
interface OrderItem {
  id: string
  quantity: number
  price: number
  size?: string
  color?: string
  product: {
    name: string
    images: string[]
    price: number
    currency: string
  }
}

interface Order {
  id: string
  status: string
  totalPrice: number
  createdAt: string
  address: {
    street: string
    city: string
    state: string
    country: string
  }
  items: OrderItem[]
}

interface OrdersClientProps {
  initialOrders: Order[];
  totalPages: number;
  currentPage: number;
}

const statusColors: Record<string, string> = {
  'PENDING': 'bg-amber-50 text-amber-600 border-amber-100',
  'PAID': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'PROCESSING': 'bg-blue-50 text-blue-600 border-blue-100',
  'SHIPPED': 'bg-violet-50 text-violet-600 border-violet-100',
  'DELIVERED': 'bg-stone-50 text-stone-600 border-stone-100',
  'CANCELLED': 'bg-rose-50 text-rose-600 border-rose-100',
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'PENDING': return <Clock size={14} />
    case 'PAID': return <CreditCard size={14} />
    case 'PROCESSING': return <Package size={14} />
    case 'SHIPPED': return <Truck size={14} />
    case 'DELIVERED': return <CheckCircle size={14} />
    default: return <ShoppingBag size={14} />
  }
}

export default function OrdersClient({ initialOrders, totalPages: total, currentPage }: OrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const confirmDelivery = async (orderId: string) => {
    setConfirmingId(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-delivery`, { method: 'POST' })
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'DELIVERED' } : o))
        toast.success('Delivery confirmed! Thank you.')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to confirm delivery')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setConfirmingId(null)
    }
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center pt-24">
        <div className="text-center space-y-8 px-6">
          <div className="w-32 h-32 bg-stone-100 rounded-full flex items-center justify-center mx-auto ring-1 ring-stone-900/5">
             <ShoppingBag size={48} className="text-stone-300" />
          </div>
          <div className="space-y-4">
             <h2 className="text-4xl font-serif italic text-stone-900">Your collection is empty.</h2>
             <p className="text-stone-500 font-serif italic text-lg max-w-sm mx-auto">Start your fashion journey with TrendiZip curated collections.</p>
          </div>
          <Link href="/shopping" className="inline-flex items-center gap-4 bg-stone-900 text-white px-10 py-5 rounded-full font-mono text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all">
             Discover Styles <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] pt-24 lg:pt-32 pb-32">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-stone-200 pb-12">
           <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-red-950 mb-6">Archive — 2026</p>
              <h1 className="text-6xl md:text-8xl font-serif italic text-stone-950 leading-[0.9]">Orders.</h1>
           </div>
           <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-full ring-1 ring-stone-900/5 shadow-sm">
              <Search size={16} className="text-stone-400" />
              <input type="text" placeholder="Trace ID or item..." className="bg-transparent border-none outline-none font-mono text-[10px] uppercase tracking-widest w-48" />
           </div>
        </header>

        <div className="space-y-12">
           {orders.map((order, idx) => (
             <motion.div 
               key={order.id}
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8, delay: idx * 0.1 }}
               className="group relative bg-white border border-stone-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700"
             >
                <div className="flex flex-col lg:flex-row">
                   <div className="flex-1 p-8 lg:p-12 space-y-10">
                      <div className="flex justify-between items-start">
                         <div className="space-y-2">
                            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Order Reference</span>
                            <h3 className="text-xl font-mono text-stone-950">#{order.id.slice(-8).toUpperCase()}</h3>
                         </div>
                         <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-mono uppercase tracking-widest ${statusColors[order.status]}`}>
                            <StatusIcon status={order.status} /> {order.status}
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-stone-50 pt-10">
                         <div className="space-y-4">
                            <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Delivery Coordinates</p>
                            <div className="flex items-start gap-4">
                               <div className="p-3 bg-stone-50 rounded-2xl">
                                  <MapPin size={18} className="text-stone-900" />
                               </div>
                               <div className="text-sm text-stone-600 font-serif italic leading-relaxed">
                                  {order.address.street},<br />
                                  {order.address.city}, {order.address.state}
                               </div>
                            </div>
                         </div>
                         <div className="space-y-4">
                            <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Fulfillment Items</p>
                            <div className="flex -space-x-4">
                               {order.items.slice(0, 3).map((item) => (
                                 <div key={item.id} className="relative w-16 h-16 rounded-2xl overflow-hidden border-4 border-white shadow-lg ring-1 ring-stone-900/5">
                                    <Image src={item.product.images[0] || "/placeholder-product.jpg"} alt="Item" fill className="object-cover" />
                                 </div>
                               ))}
                               {order.items.length > 3 && (
                                 <div className="w-16 h-16 rounded-2xl bg-stone-950 text-white flex items-center justify-center text-[10px] font-bold border-4 border-white shadow-lg">
                                    +{order.items.length - 3}
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center justify-between pt-10 border-t border-stone-50">
                         <div className="space-y-1">
                            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Acquisition Total</span>
                            <p className="text-4xl font-serif font-medium leading-none">GHS {order.totalPrice.toFixed(2)}</p>
                         </div>
                         <Link href={`/orders/${order.id}`} className="flex items-center gap-4 bg-stone-950 text-white h-16 px-8 rounded-full font-mono text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all">
                            Full Trace <Eye size={14} />
                         </Link>
                      </div>
                   </div>
                   <div className="lg:w-96 bg-stone-50 p-8 lg:p-12 relative overflow-hidden group-hover:bg-red-950/5 transition-colors">
                      <div className="relative z-10 flex flex-col justify-center h-full space-y-6">
                         <div className="p-4 bg-white rounded-3xl inline-block shadow-sm ring-1 ring-stone-900/5">
                            <Clock size={24} className="text-amber-600" />
                         </div>
                         <h4 className="text-2xl font-serif italic text-stone-900 leading-tight">Timeline Log</h4>
                         <p className="text-sm text-stone-500 font-serif italic leading-relaxed">
                            Order initialized on {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric'})} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}.
                         </p>

                         {/* Status-specific action prompts */}
                         {order.status === 'SHIPPED' && (
                           <div className="space-y-4 pt-4 border-t border-stone-200">
                             <div className="flex items-center gap-3 text-violet-600">
                               <Truck size={16} />
                               <span className="text-xs font-mono uppercase tracking-widest">In Transit</span>
                             </div>
                             <p className="text-xs text-stone-500 leading-relaxed">Your package is on its way! Once it arrives, please confirm delivery below.</p>
                             <button
                               onClick={() => confirmDelivery(order.id)}
                               disabled={confirmingId === order.id}
                               className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-2xl font-mono text-[10px] uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                             >
                               {confirmingId === order.id ? (
                                 <><Loader2 size={14} className="animate-spin" /> Confirming...</>
                               ) : (
                                 <><PackageCheck size={14} /> Confirm Arrival</>
                               )}
                             </button>
                           </div>
                         )}

                         {order.status === 'PROCESSING' && (
                           <div className="flex items-center gap-3 pt-4 border-t border-stone-200 text-blue-600">
                             <Package size={16} />
                             <span className="text-xs font-mono uppercase tracking-widest">Being Prepared</span>
                           </div>
                         )}

                         {order.status === 'DELIVERED' && (
                           <div className="flex items-center gap-3 pt-4 border-t border-stone-200 text-emerald-600">
                             <CheckCircle size={16} />
                             <span className="text-xs font-mono uppercase tracking-widest">Delivery Confirmed</span>
                           </div>
                         )}

                         {order.status === 'PENDING' && (
                           <div className="flex items-center gap-3 pt-4 border-t border-stone-200 text-amber-600">
                             <AlertCircle size={16} />
                             <span className="text-xs font-mono uppercase tracking-widest">Awaiting Payment</span>
                           </div>
                         )}
                      </div>
                      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                         <ShoppingBag size={200} />
                      </div>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>

        {total > 1 && (
          <div className="mt-24 flex justify-center items-center gap-8 border-t border-stone-200 pt-16">
             <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">Section {currentPage} of {total}</span>
             <div className="flex gap-2">
                {[...Array(total)].map((_, i) => (
                  <button key={i} className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${i + 1 === currentPage ? 'bg-stone-950 text-white border-stone-950' : 'border-stone-200 text-stone-400 hover:border-black hover:text-black'}`}>
                    {i + 1}
                  </button>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  )
}
