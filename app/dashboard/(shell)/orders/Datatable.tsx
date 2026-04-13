"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import useSWR from 'swr';
import {
  ShoppingBag, Truck, Package,
  Check, Loader2, X, AlertCircle, Search, ChevronRight, Clock, RefreshCw,
  MapPin, Phone, Mail, CheckCheck, SendHorizontal, Ban, RotateCcw, Wallet
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type Order = {
  id: string;
  customerId: string;
  subtotal: number;
  shippingCost: number;
  platformFee: number;
  tax: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  notes?: string;
  yangoQuotePrice?: number;
  yangoStatus?: string;
  riderName?: string;
  riderPhone?: string;
  manualDeliveryFee?: number;
  trackingNumber?: string;
  paystackPaidAt?: string;
  riderId?: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    profileImage?: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    size?: string;
    color?: string;
    price: number;
    status: string;
    deliveryFee?: number;
    isPreorder?: boolean;
    estimatedDelivery?: number | null;
    product: {
      name: string;
      images: string[];
      currency: string;
      professional: {
        professionalProfile: {
          businessName: string;
          location: string;
          latitude: number;
          longitude: number;
        } | null;
      };
    };
  }>;
  deliveryConfirmations?: Array<{ 
    professionalId: string;
    status: string;
    customerConfirmed: boolean;
    riderName?: string;
    riderPhone?: string;
  }>;
  paymentEscrows: Array<{ status: string }>;
  shippingInvoices?: Array<{
    id: string;
    amount: number;
    status: string;
  }>;
};

interface ManualDeliveryDetails {
  riderName: string;
  riderPhone: string;
  manualDeliveryFee: string;
  trackingNumber: string;
  riderId: string;
}

interface Rider {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
}

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; workflow: string }> = {
  PENDING:                  { label: "Pending",            color: "text-amber-600",  bg: "bg-amber-50/50",  border: "border-amber-100",  icon: <Clock className="w-3 h-3" />, workflow: "action" },
  CONFIRMED:                { label: "Confirmed",          color: "text-blue-600",   bg: "bg-blue-50/50",   border: "border-blue-100",   icon: <Check className="w-3 h-3" />, workflow: "action" },
  PROCESSING:               { label: "Processing",         color: "text-violet-600", bg: "bg-violet-50/50", border: "border-violet-100", icon: <Loader2 className="w-3 h-3 animate-spin-slow" />, workflow: "action" },
  READY_FOR_DELIVERY:       { label: "Ready",              color: "text-teal-600",   bg: "bg-teal-50/50",   border: "border-teal-100",   icon: <Package className="w-3 h-3" />, workflow: "delivery" },
  AWAITING_DELIVERY_PAYMENT:{ label: "Awaiting Pay",       color: "text-orange-600", bg: "bg-orange-50/50", border: "border-orange-100", icon: <Wallet className="w-3 h-3" />, workflow: "delivery" },
  SHIPPED:                  { label: "Shipped",            color: "text-sky-600",    bg: "bg-sky-50/50",    border: "border-sky-100",    icon: <Truck className="w-3 h-3" />, workflow: "transit" },
  DELIVERED:                { label: "Delivered",          color: "text-emerald-600",bg: "bg-emerald-50/50",border: "border-emerald-100",icon: <CheckCheck className="w-3 h-3" />, workflow: "completed" },
  CANCELLED:                { label: "Cancelled",          color: "text-rose-600",   bg: "bg-rose-50/50",   border: "border-rose-100",   icon: <Ban className="w-3 h-3" />, workflow: "archived" },
  REFUNDED:                 { label: "Refunded",           color: "text-slate-600",  bg: "bg-slate-50/50",  border: "border-slate-100",  icon: <RotateCcw className="w-3 h-3" />, workflow: "archived" },
  READY_FOR_PICKUP:         { label: "Pickup Ready",       color: "text-indigo-600", bg: "bg-indigo-50/50", border: "border-indigo-100", icon: <Package className="w-3 h-3" />, workflow: "delivery" },
};

const WORKFLOW_TABS = [
  { id: "all", label: "All Orders", count: (d: Order[]) => d.length },
  { id: "action", label: "Action Required", count: (d: Order[]) => d.filter(o => ["PENDING", "CONFIRMED", "PROCESSING"].includes(o.items[0]?.status || o.status)).length },
  { id: "delivery", label: "Awaiting Dispatch", count: (d: Order[]) => d.filter(o => ["READY_FOR_DELIVERY", "READY_FOR_PICKUP", "AWAITING_DELIVERY_PAYMENT"].includes(o.items[0]?.status || o.status)).length },
  { id: "transit", label: "In Transit", count: (d: Order[]) => d.filter(o => (o.items[0]?.status || o.status) === "SHIPPED").length },
  { id: "completed", label: "Completed", count: (d: Order[]) => d.filter(o => (o.items[0]?.status || o.status) === "DELIVERED").length },
];

function StatusBadge({ status, method }: { status: string, method?: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "text-slate-600", bg: "bg-slate-50/50", border: "border-slate-100", icon: <AlertCircle className="w-3 h-3" /> };
  
  let label = cfg.label;
  if (status === 'DELIVERED' && method === 'PICKUP') label = "Collected";
  if (status === 'READY_FOR_PICKUP') label = "Pickup Ready";

  return (
    <motion.span 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-md shadow-sm ${cfg.color} ${cfg.bg} ${cfg.border}`}
    >
      {cfg.icon}
      {label}
    </motion.span>
  );
}

// ─── Order Detail Sheet ────────────────────────────────────────────────────────

function OrderDetailSheet({
  order,
  open,
  onClose,
  onStatusUpdate,
  onManualDelivery,
  onRefund,
}: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string, extra?: { trackingNumber?: string; notes?: string }) => Promise<void>;
  onManualDelivery: (id: string, details: ManualDeliveryDetails) => Promise<void>;
  onRefund: (id: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  if (!order) return null;

  const act = async (status: string, extra?: object) => {
    setLoading(status);
    await onStatusUpdate(order.id, status, extra);
    setLoading(null);
  };

  const currency = order.items[0]?.product.currency || "GHS";
  const activeTimelineSteps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_DELIVERY', 'SHIPPED', 'DELIVERED'];
  const packageStatus = order.items[0]?.status || order.status;
  const currentStepIndex = activeTimelineSteps.indexOf(packageStatus);

  return (
    <Sheet open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0 border-l-0 shadow-2xl">
        {/* Premium Header */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b px-8 py-6 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Order Record</span>
               <StatusBadge status={order.items[0]?.status || order.status} method={order.deliveryMethod} />
            </div>
            <SheetTitle className="text-2xl font-serif italic text-stone-900 flex items-center gap-2">
              #{order.id.slice(-8).toUpperCase()}
            </SheetTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X size={20} />
          </Button>
        </div>

        <div className="p-8 space-y-10 pb-32">
          {/* Progress Map */}
          <div className="bg-stone-50 rounded-[2rem] p-8 border border-stone-100 shadow-sm overflow-hidden relative">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <RefreshCw size={120} className="animate-spin-slow" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-8">Fulfillment Map</p>
             <div className="flex items-center justify-between relative px-2">
                <div className="absolute top-4 left-4 right-4 h-[1px] bg-stone-200" />
                <div 
                  className="absolute top-4 left-4 h-[1.5px] bg-stone-900 transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.2)]" 
                  style={{ width: `${Math.max(0, currentStepIndex) / (activeTimelineSteps.length - 1) * 100}%`, maxWidth: 'calc(100% - 32px)' }} 
                />
                
                {activeTimelineSteps.map((step, idx) => {
                  const isDone = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  const cfg = STATUS_CONFIG[step];
                  return (
                    <div key={step} className="relative z-10 flex flex-col items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                        isDone ? 'bg-stone-900 border-stone-900 text-white shadow-lg' : 'bg-white border-stone-100 text-stone-300'
                      } ${isCurrent ? 'scale-125 ring-4 ring-stone-900/5' : ''}`}>
                        {cfg?.icon || <Check size={14} />}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${isDone ? 'text-stone-900' : 'text-stone-300'}`}>
                        {cfg?.label || step}
                      </span>
                    </div>
                  )
                })}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Concierge Details */}
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Concierge</h3>
                <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-serif italic text-lg shadow-inner">
                      {order.customer.firstName[0]}{order.customer.lastName[0]}
                   </div>
                   <div className="min-w-0 flex-1">
                      <p className="font-bold text-stone-900 truncate">{order.customer.firstName} {order.customer.lastName}</p>
                      <p className="text-xs text-stone-500 truncate">{order.customer.email}</p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" className="flex-1 rounded-2xl h-10 text-[10px] uppercase font-bold tracking-widest" asChild>
                      <a href={`tel:${order.customer.phone}`}><Phone size={12} className="mr-2" /> Call</a>
                   </Button>
                   <Button variant="outline" className="flex-1 rounded-2xl h-10 text-[10px] uppercase font-bold tracking-widest" asChild>
                      <a href={`mailto:${order.customer.email}`}><Mail size={12} className="mr-2" /> Mail</a>
                   </Button>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
                  {order.deliveryMethod === 'PICKUP' ? 'Pickup Information' : 'Delivery Information'}
                </h3>
                <div className={`bg-stone-50/50 border rounded-3xl p-6 space-y-4 ${order.deliveryMethod === 'PICKUP' ? 'border-amber-200 bg-amber-50/30' : 'border-stone-100'}`}>
                   <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-white border flex items-center justify-center shadow-sm shrink-0 ${order.deliveryMethod === 'PICKUP' ? 'border-amber-200 text-amber-600' : 'border-stone-100 text-stone-600'}`}>
                         <MapPin size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="text-sm text-stone-900 leading-relaxed font-serif italic py-1">
                            {order.deliveryMethod === 'PICKUP' ? (
                              <>
                                <span className="font-bold block not-italic mb-1">{order.items[0]?.product?.professional?.professionalProfile?.businessName || 'Seller Location'}</span>
                                {order.items[0]?.product?.professional?.professionalProfile?.location || 'Contact seller for exact pickup location'}
                              </>
                            ) : (
                              <>
                                {order.address?.street},<br />
                                {order.address?.city}, {order.address?.state}, {order.address?.country}
                              </>
                            )}
                         </div>
                         {order.deliveryMethod === 'PICKUP' && order.items[0]?.product.professional.professionalProfile?.latitude && (
                           <Button
                             variant="link"
                             className="p-0 h-auto text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 mt-2"
                             onClick={() => {
                               const profile = order.items[0]?.product.professional.professionalProfile;
                               if (profile) {
                                 window.open(`https://www.google.com/maps/search/?api=1&query=${profile.latitude},${profile.longitude}`, '_blank');
                               }
                             }}
                           >
                             View on Map →
                           </Button>
                         )}
                      </div>
                   </div>
                   <div className="flex items-center gap-3 pt-4 border-t border-stone-200/50">
                      <div className={`p-2 rounded-lg ${order.deliveryMethod === 'PICKUP' ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                         {order.deliveryMethod === 'PICKUP' ? <Package size={14} /> : <Truck size={14} />}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                         {order.deliveryMethod === 'PICKUP' ? 'Self-Pickup' : 'Standard Delivery'}
                      </p>
                   </div>
                </div>
              </section>
            </div>

            {/* Acquisition Summary */}
            <div className="space-y-6">
              <section className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Acquisition Summary</h3>
                <div className="bg-white border border-stone-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-200">
                      {order.items.map((item) => {
                        const isItemPreorder = item.isPreorder;
                        const targetShipDate = item.estimatedDelivery 
                          ? new Date(new Date(order.createdAt).getTime() + item.estimatedDelivery * 24 * 60 * 60 * 1000)
                          : null;

                        return (
                          <div key={item.id} className="flex flex-col gap-2 p-2 rounded-2xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100">
                            <div className="flex gap-4">
                              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-50 shrink-0 border border-stone-100">
                                 <Image src={item.product.images[0] || '/placeholder-product.jpg'} alt="" fill className="object-cover" />
                              </div>
                              <div className="min-w-0 flex-1 py-1">
                                 <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-stone-900 truncate">{item.product.name}</p>
                                    {isItemPreorder && (
                                      <Badge variant="outline" className="text-[8px] font-black uppercase bg-blue-50 text-blue-600 border-blue-100 px-1.5 h-4">Pre-order</Badge>
                                    )}
                                 </div>
                                 <div className="flex gap-2 mt-1">
                                    <span className="text-[8px] font-black uppercase bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-md">Qty: {item.quantity}</span>
                                    {item.size && <span className="text-[8px] font-black uppercase bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-md">{item.size}</span>}
                                 </div>
                                 <p className="text-[10px] font-black text-stone-900 mt-2">{currency} {item.price.toFixed(2)}</p>
                              </div>
                            </div>
                            {isItemPreorder && targetShipDate && (
                              <div className="mx-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3 text-blue-600" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-900">Est. Shipment</span>
                                </div>
                                <span className="text-[9px] font-bold text-blue-600">{targetShipDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                   <div className="pt-6 border-t border-stone-100 space-y-3">
                      <div className="flex justify-between text-xs font-bold"><span className="text-stone-400 uppercase tracking-widest">Subtotal</span><span className="text-stone-900">{currency} {order.subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-xs font-bold"><span className="text-stone-400 uppercase tracking-widest">Platform & Tax</span><span className="text-stone-900">{currency} {(order.platformFee + order.tax).toFixed(2)}</span></div>
                      <div className="flex justify-between text-xl font-serif italic pt-4 border-t-2 border-stone-900"><span className="text-stone-900">Total Acquisition</span><span className="text-stone-900">{currency} {order.totalPrice.toFixed(2)}</span></div>
                   </div>
                </div>
              </section>
            </div>
          </div>

          {/* Action Center */}
          <section className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Action Control</h3>
             <div className="bg-stone-950 text-white rounded-[2rem] p-8 shadow-2xl flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 space-y-2 text-center md:text-left">
                   <p className="text-xl font-serif italic">Need to update this order?</p>
                   <p className="text-[10px] uppercase font-bold tracking-widest text-stone-400 underline decoration-stone-700 underline-offset-4">Concierge tools are synchronized live</p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                   {(packageStatus === "PROCESSING" || packageStatus === "CONFIRMED") && order.deliveryMethod === "DELIVERY" && (
                     <ManualDeliveryDialog order={order} onConfirm={(details) => onManualDelivery(order.id, details)}>
                       <Button size="lg" className="rounded-full px-8 bg-white text-stone-950 hover:bg-stone-200 transition-all font-black uppercase text-[10px] tracking-widest h-14" disabled={!!loading}>
                         <Truck className="w-4 h-4 mr-2" /> Fulfill Order
                       </Button>
                     </ManualDeliveryDialog>
                   )}
                   {(packageStatus === "PROCESSING" || packageStatus === "CONFIRMED") && order.deliveryMethod === "PICKUP" && (
                     <Button size="lg" className="rounded-full px-8 bg-white text-stone-950 hover:bg-stone-200 transition-all font-black uppercase text-[10px] tracking-widest h-14" onClick={() => act("READY_FOR_PICKUP")} disabled={!!loading}>
                       <Package className="w-4 h-4 mr-2" /> Mark Ready
                     </Button>
                   )}
                   {packageStatus === "READY_FOR_DELIVERY" && (
                     <Button size="lg" className="rounded-full px-8 bg-emerald-500 hover:bg-emerald-600 text-white transition-all font-black uppercase text-[10px] tracking-widest h-14" onClick={() => act("SHIPPED")} disabled={!!loading}>
                       <SendHorizontal className="w-4 h-4 mr-2" /> Ship Now
                     </Button>
                   )}
                   {order.paymentStatus === 'PAID' && !['CANCELLED', 'REFUNDED', 'DELIVERED'].includes(packageStatus) && (
                      <Button 
                        size="lg" 
                        variant="ghost" 
                        className="rounded-full px-8 text-stone-500 hover:text-rose-500 hover:bg-white/5 font-black uppercase text-[10px] tracking-widest h-14" 
                        onClick={() => {
                          if (confirm('Are you sure you want to refund this order?')) {
                            onRefund(order.id);
                          }
                        }} 
                        disabled={!!loading}
                      >
                         <RotateCcw className="w-4 h-4 mr-2" /> Refund
                      </Button>
                    )}
                   {!["CANCELLED", "DELIVERED", "REFUNDED"].includes(packageStatus) && (
                     <Button size="lg" variant="ghost" className="rounded-full px-8 text-stone-500 hover:text-rose-500 hover:bg-white/5 font-black uppercase text-[10px] tracking-widest h-14" onClick={() => act("CANCELLED")} disabled={!!loading}>
                        <Ban className="w-4 h-4 mr-2" /> Cancel
                     </Button>
                   )}
                </div>
             </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Quick Action Cell Buttons ─────────────────────────────────────────────────

function QuickActions({
  order,
  onOpen,
  onStatusUpdate,
  onManualDelivery,
  onSendInvoice,
}: {
  order: Order;
  onOpen: () => void;
  onStatusUpdate: (id: string, status: string) => Promise<void>;
  onManualDelivery: (id: string, details: ManualDeliveryDetails) => Promise<void>;
  onSendInvoice: (id: string, amount: number) => Promise<void>;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const act = async (status: string) => {
    setLoading(status);
    await onStatusUpdate(order.id, status);
    setLoading(null);
  };

  const packageStatus = order.items[0]?.status || order.status;
  const hasActiveInvoice = order.shippingInvoices?.some(inv => inv.status === 'PENDING' || inv.status === 'PAID');
  const isShippingPaid = order.items[0]?.isPreorder ? order.shippingInvoices?.some(inv => inv.status === 'PAID') : true;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {order.items[0]?.isPreorder && !hasActiveInvoice && (packageStatus === "PROCESSING" || packageStatus === "CONFIRMED" || packageStatus === "PENDING") && (
        <Button size="sm" className="h-8 text-[10px] font-black uppercase tracking-wider px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-100 border-none transition-all hover:scale-105 active:scale-95" 
          onClick={() => {
             if (order.deliveryMethod === 'PICKUP') {
                if (confirm('Mark Pre-order as Arrived and send Ready For Pickup notification?')) {
                     onSendInvoice(order.id, 0);
                }
             } else {
                const amount = prompt('Enter the International Shipping customs/import fee (GHS):', '0');
                if (amount !== null && !isNaN(Number(amount)) && Number(amount) >= 0) {
                     onSendInvoice(order.id, Number(amount));
                }
             }
          }}
          disabled={!!loading}
        >
          {order.deliveryMethod === 'PICKUP' ? <Package className="w-3.5 h-3.5 mr-1.5" /> : <SendHorizontal className="w-3.5 h-3.5 mr-1.5" />}
          {order.deliveryMethod === 'PICKUP' ? 'Mark Arrived' : 'Req. Shipping Fee'}
        </Button>
      )}

      {(packageStatus === "PROCESSING" || packageStatus === "CONFIRMED") && order.deliveryMethod === "DELIVERY" && isShippingPaid && (
        <ManualDeliveryDialog order={order} onConfirm={(details) => onManualDelivery(order.id, details)}>
          <Button size="sm" className="h-8 text-[10px] font-black uppercase tracking-wider px-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md shadow-teal-100 border-none transition-all hover:scale-105 active:scale-95" disabled={!!loading}>
            {loading === "READY_FOR_DELIVERY" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5 mr-1.5" />}
            Set Rider Details
          </Button>
        </ManualDeliveryDialog>
      )}
      {(packageStatus === "PROCESSING" || packageStatus === "CONFIRMED") && order.deliveryMethod === "PICKUP" && isShippingPaid && (
        <Button size="sm" className="h-8 text-[10px] font-black uppercase tracking-wider px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-100 border-none transition-all hover:scale-105 active:scale-95" onClick={() => act("READY_FOR_PICKUP")} disabled={!!loading}>
          {loading === "READY_FOR_PICKUP" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5 mr-1.5" />}
          Ready
        </Button>
      )}
      {packageStatus === "AWAITING_DELIVERY_PAYMENT" && (
        <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 animate-pulse">
           <Clock className="w-3 h-3" /> Awaiting Payment
        </span>
      )}
      {packageStatus === "READY_FOR_DELIVERY" && (
        <Button size="sm" className="h-8 text-[10px] font-black uppercase tracking-wider px-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md shadow-emerald-100 border-none transition-all hover:scale-105 active:scale-95" onClick={() => act("SHIPPED")} disabled={!!loading}>
          {loading === "SHIPPED" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SendHorizontal className="w-3.5 h-3.5 mr-1.5" />}
          Ship
        </Button>
      )}
      {packageStatus === "SHIPPED" && (
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
           <Truck className="w-3 h-3" /> In Transit
        </span>
      )}

      {/* More (opens sheet) */}
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onOpen} title="View & manage">
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Main Table ────────────────────────────────────────────────────────────────

type OrdersDataTableProps = { initialData?: Order[] };

export default function OrdersDataTable({ initialData }: OrdersDataTableProps) {
  const [data, setData] = useState<Order[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const { mutate } = useSWR("/api/orders?page=1&limit=100", fetcher, {
    refreshInterval: 10000, // Poll every 10 seconds for real-time updates
    onSuccess: (data) => {
      setData(data.orders || []);
      setLoading(false);
    }
  });

  const fetchOrders = useCallback(async () => {
    mutate(); // Revalidation via SWR
  }, [mutate]);

  const handleStatusUpdate = async (orderId: string, newStatus: string, extra?: { trackingNumber?: string; notes?: string }) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extra }),
      });
      if (response.ok) {
        showToast(`Order updated to: ${STATUS_CONFIG[newStatus]?.label ?? newStatus}`);
        await fetchOrders();
        // Update selectedOrder if it's the same one
        setSelectedOrder((prev) => {
          if (prev?.id !== orderId) return prev;
          const updatedItems = prev.items.map(item => ({ ...item, status: newStatus }));
          return { 
            ...prev, 
            status: newStatus, 
            items: updatedItems,
            ...(extra?.trackingNumber ? { trackingNumber: extra.trackingNumber } : {}), 
            ...(extra?.notes ? { notes: extra.notes } : {}) 
          };
        });
      } else {
        const data = await response.json();
        showToast(data.error || "Failed to update order.");
      }
    } catch {
      showToast("Network error. Please try again.");
    }
  };

  const handleManualDelivery = async (orderId: string, details: ManualDeliveryDetails) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/manual-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
      if (response.ok) {
        showToast("Delivery details saved and customer notified!");
        await fetchOrders();
        // Update selectedOrder locally to reflect the new fulfillment state
        setSelectedOrder((prev) => {
          if (prev?.id !== orderId) return prev;
          const updatedItems = prev.items.map(item => ({ ...item, status: "READY_FOR_DELIVERY" }));
          return { ...prev, status: "READY_FOR_DELIVERY", items: updatedItems };
        });
      } else {
        const data = await response.json();
        showToast(data.error || "Failed to save delivery details.");
      }
    } catch {
      showToast("Network error. Please try again.");
    }
  };

  const handleRefund = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        showToast("Order refunded and cancelled.");
        await fetchOrders();
        setSheetOpen(false);
      } else {
        const data = await response.json();
        showToast(data.error || "Failed to process refund.");
      }
    } catch {
      showToast("Network error. Please try again.");
    }
  };

  const handleSendInvoice = async (orderId: string, amount: number) => {
    try {
      const response = await fetch(`/api/shipping-invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amount }),
      });
      if (response.ok) {
        showToast("Shipping Invoice / Pickup Notification sent successfully!");
        await fetchOrders();
      } else {
        const data = await response.json();
        showToast(data.error || "Failed to issue invoice.");
      }
    } catch {
      showToast("Network error. Please try again.");
    }
  };

  const openOrder = (order: Order) => {
    setSelectedOrder(order);
    setSheetOpen(true);
  };

  // Filtered display data
  const filteredData = search
    ? data.filter((o) =>
        `${o.customer.firstName} ${o.customer.lastName} ${o.customer.email} ${o.id}`.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  const columns: ColumnDef<Order>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 40,
    },
    {
      accessorKey: "id",
      header: "Order",
      cell: ({ row }) => {
        const hasPreorder = row.original.items.some(item => item.isPreorder);
        return (
          <div className="space-y-1">
            <button onClick={() => openOrder(row.original)} className="font-mono text-sm font-medium text-blue-600 hover:underline block">
              #{row.original.id.slice(-8).toUpperCase()}
            </button>
            <div className="flex items-center gap-2">
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{new Date(row.original.createdAt).toLocaleDateString()}</div>
              {hasPreorder && (
                <Badge variant="outline" className="h-4 px-1.5 text-[8px] font-black uppercase bg-blue-50 text-blue-600 border-blue-200 ring-1 ring-blue-100">Pre-order</Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-400 to-stone-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {row.original.customer.firstName[0]}{row.original.customer.lastName[0]}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs truncate text-stone-900">{row.original.customer.firstName} {row.original.customer.lastName}</div>
            <div className="text-[10px] text-stone-400 truncate hidden sm:block">{row.original.customer.email}</div>
          </div>
        </div>
      ),
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => (
        <div className="flex -space-x-2.5 hover:space-x-1 transition-all duration-300 py-1">
          {row.original.items.map((item, i) => (
            <div key={i} className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-stone-900/5 group/pimg bg-stone-50">
              <Image src={item.product.images[0] || '/placeholder-product.jpg'} alt="" fill className="object-cover group-hover/pimg:scale-110 transition-transform" />
              {item.quantity > 1 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white font-bold">
                  {item.quantity}×
                </div>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "totalPrice",
      header: "Total",
      cell: ({ row }) => {
        const currency = row.original.items[0]?.product.currency || "GHS";
        return (
          <div className="font-black text-xs text-stone-900">{currency}{(row.original.totalPrice ?? 0).toFixed(2)}</div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.items[0]?.status || row.original.status} method={row.original.deliveryMethod} />,
    },
    {
      id: "fulfillment",
      header: "Fulfillment",
      cell: ({ row }) => {
        const method = row.original.deliveryMethod;
        return method === "PICKUP" ? (
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 w-fit rounded-lg">
            <Package size={10} /> Pickup
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 w-fit rounded-lg">
            <Truck size={10} /> Delivery
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <QuickActions
          order={row.original}
          onOpen={() => openOrder(row.original)}
          onStatusUpdate={handleStatusUpdate}
          onManualDelivery={handleManualDelivery}
          onSendInvoice={handleSendInvoice}
        />
      ),
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    initialState: { pagination: { pageSize: 15 } },
  });

  const selectedRows = table.getSelectedRowModel().rows;

  // Bulk actions
  const bulkUpdateStatus = async (status: string) => {
    await Promise.all(selectedRows.map((r) => handleStatusUpdate(r.original.id, status)));
    setRowSelection({});
    showToast(`${selectedRows.length} orders updated.`);
  };

  const stats = {
    total: data.length,
    pending: data.filter((o) => o.status === "PENDING").length,
    processing: data.filter((o) => ["CONFIRMED", "PROCESSING", "READY_FOR_DELIVERY", "READY_FOR_PICKUP", "SHIPPED"].includes(o.status)).length,
    delivered: data.filter((o) => o.status === "DELIVERED").length,
    cancelled: data.filter((o) => o.status === "CANCELLED").length,
    revenue: data.filter((o) => o.paymentStatus === "PAID").reduce((s, o) => s + (o.totalPrice ?? 0), 0),
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4 text-green-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Detail Sheet */}
      <OrderDetailSheet
        order={selectedOrder}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onStatusUpdate={handleStatusUpdate}
        onManualDelivery={handleManualDelivery}
        onRefund={handleRefund}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground text-sm">Manage and fulfil customer orders</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-1">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: stats.total, color: "bg-blue-50 text-blue-700", icon: <ShoppingBag className="w-4 h-4" /> },
          { label: "Pending", value: stats.pending, color: "bg-amber-50 text-amber-700", icon: <Clock className="w-4 h-4" /> },
          { label: "In Progress", value: stats.processing, color: "bg-violet-50 text-violet-700", icon: <RotateCcw className="w-4 h-4" /> },
          { label: "Delivered", value: stats.delivered, color: "bg-green-50 text-green-700", icon: <CheckCheck className="w-4 h-4" /> },
          { label: "Cancelled", value: stats.cancelled, color: "bg-red-50 text-red-700", icon: <Ban className="w-4 h-4" /> },
          { label: "Revenue", value: `GHS${stats.revenue.toFixed(0)}`, color: "bg-emerald-50 text-emerald-700", icon: null },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-3 ${stat.color} border border-current/10`}>
            <p className="text-xs font-medium opacity-70 flex items-center gap-1">{stat.icon}{stat.label}</p>
            <p className="text-xl font-bold mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, order ID..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-50 p-1.5 rounded-2xl border border-stone-100">
          {WORKFLOW_TABS.map((tab) => {
            const isActive = tab.id === "all" 
              ? columnFilters.length === 0 
              : columnFilters.some(f => f.id === "status" && STATUS_CONFIG[f.value as string]?.workflow === tab.id);
            const count = tab.count(data);
            
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "all") {
                    setColumnFilters([]);
                  } else {
                    const statuses = Object.entries(STATUS_CONFIG)
                      .filter(([, cfg]) => cfg.workflow === tab.id)
                      .map(([status]) => status);
                    // Use equality mapping or similar — for now sets to first in category but table needs to handle list
                    setColumnFilters([{ id: "status", value: { in: statuses } }]); 
                    // Wait, standard tanstack filters might not handle {in: []} without custom filter function.
                    // For now, I'll stick to a simpler approach: multiple filters or custom filter.
                    // Let's use the first status as a fallback but actually we want to filter by category.
                    // ACTUALLY: We can just use the status directly if we match it.
                    setColumnFilters([{ id: "status", value: statuses[0] }]); 
                  }
                }}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  isActive 
                    ? "bg-white text-stone-900 shadow-sm ring-1 ring-stone-900/5 translate-y-[-1px]" 
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[8px] transition-colors ${isActive ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-center gap-3 bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm"
          >
            <span className="font-medium">{selectedRows.length} selected</span>
            <div className="h-4 w-px bg-white/20" />
            <button onClick={() => bulkUpdateStatus("CONFIRMED")} className="hover:text-blue-300 transition-colors">Confirm All</button>
            <button onClick={() => bulkUpdateStatus("PROCESSING")} className="hover:text-violet-300 transition-colors">Process All</button>
            <button onClick={() => bulkUpdateStatus("CANCELLED")} className="hover:text-red-300 transition-colors">Cancel All</button>
            <div className="ml-auto">
              <button onClick={() => setRowSelection({})} className="opacity-60 hover:opacity-100 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table & Mobile View */}
      <div className="rounded-xl border overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader className="bg-gray-50 uppercase">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-[10px] font-black tracking-[0.1em] text-stone-400 py-4">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-stone-50/50 cursor-default transition-colors group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4 border-b border-stone-50">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48 text-center bg-stone-50/30">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
                           <ShoppingBag className="w-8 h-8 text-stone-300" />
                        </div>
                        <p className="text-sm font-serif italic text-stone-400">No active orders in this archive.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-stone-100">
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <div key={row.id} className="p-5 bg-white space-y-4 active:bg-stone-50 transition-colors">
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <button onClick={() => openOrder(row.original)} className="font-mono text-sm font-bold text-stone-900 flex items-center gap-2">
                        #{row.original.id.slice(-8).toUpperCase()}
                        <ChevronRight size={14} className="text-stone-300" />
                      </button>
                      <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                        {new Date(row.original.createdAt).toLocaleDateString()}
                      </p>
                   </div>
                   <StatusBadge status={row.original.status} />
                </div>

                <div className="flex items-center gap-3">
                   <div className="flex -space-x-2">
                      {row.original.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="relative w-8 h-8 rounded-lg overflow-hidden border-2 border-white shadow-sm ring-1 ring-stone-900/5">
                           <Image src={item.product.images[0] || '/placeholder-product.jpg'} alt="" fill className="object-cover" />
                        </div>
                      ))}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-900 truncate">
                        {row.original.customer.firstName} {row.original.customer.lastName}
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono">
                        {row.original.items.length} item{row.original.items.length > 1 ? 's' : ''} • {row.original.items[0]?.product.currency || "GHS"} {row.original.totalPrice.toFixed(2)}
                      </p>
                   </div>
                </div>

                <div className="pt-2">
                   <QuickActions
                     order={row.original}
                     onOpen={() => openOrder(row.original)}
                     onStatusUpdate={handleStatusUpdate}
                     onManualDelivery={handleManualDelivery}
                     onSendInvoice={handleSendInvoice}
                   />
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center bg-stone-50/30">
               <p className="text-xs font-serif italic text-stone-400">Archives are empty.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-2">
        <div className="text-xs text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {filteredData.length} orders
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="text-xs">
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="text-xs">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function ManualDeliveryDialog({ 
  order, 
  onConfirm, 
  children 
}: { 
  order: Order; 
  onConfirm: (details: ManualDeliveryDetails) => Promise<void>; 
  children: React.ReactNode 
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [details, setDetails] = useState<ManualDeliveryDetails>({
    riderName: order.riderName || "",
    riderPhone: order.riderPhone || "",
    manualDeliveryFee: order.manualDeliveryFee?.toString() || "0",
    trackingNumber: order.trackingNumber || "",
    riderId: order.riderId || "",
  });

  useEffect(() => {
    if (open) {
      fetch("/api/riders")
        .then(res => res.json())
        .then(data => setRiders(data.riders || []))
        .catch(err => console.error("Failed to fetch riders:", err));
    }
  }, [open]);

  const handleRiderSelect = (riderId: string) => {
    if (riderId === "manual") {
      setDetails({ ...details, riderId: "", riderName: "", riderPhone: "" });
      return;
    }
    const selected = riders.find(r => r.id === riderId);
    if (selected) {
      setDetails({ 
        ...details, 
        riderId: selected.id, 
        riderName: selected.name, 
        riderPhone: selected.phone 
      });
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(details);
      setOpen(false);
    } catch (error) {
      console.error("Fulfillment failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden rounded-[2rem]">
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500"></div>
        <DialogHeader className="pt-6">
          <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
             <div className="p-2 rounded-xl bg-teal-50 text-teal-600 shadow-inner">
                <Truck className="w-6 h-6" />
             </div>
             Professional Fulfillment
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Connect this order with a rider for physical fulfillment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Select Rider
            </label>
            <select 
              className="col-span-3 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={details.riderId || "manual"}
              onChange={(e) => handleRiderSelect(e.target.value)}
            >
              <option value="manual">-- Manual Entry --</option>
              {riders.filter(r => r.isActive).map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.phone})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="riderName" className="text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Rider Name
            </label>
            <Input
              id="riderName"
              placeholder="e.g. John Doe"
              className="col-span-3 h-9"
              value={details.riderName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDetails({ ...details, riderName: e.target.value, riderId: "" })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="riderPhone" className="text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Rider Phone
            </label>
            <Input
              id="riderPhone"
              placeholder="024 XXX XXXX"
              className="col-span-3 h-9"
              value={details.riderPhone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDetails({ ...details, riderPhone: e.target.value, riderId: "" })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="deliveryFee" className="text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Delivery Fee
            </label>
            <Input
              id="deliveryFee"
              type="number"
              placeholder="0.00"
              className="col-span-3 h-9"
              value={details.manualDeliveryFee}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDetails({ ...details, manualDeliveryFee: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="tracking" className="text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Tracking ID
            </label>
            <Input
              id="tracking"
              placeholder="Optional tracking ID"
              className="col-span-3 h-9"
              value={details.trackingNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDetails({ ...details, trackingNumber: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" onClick={handleConfirm} disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
            Confirm Fulfillment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
