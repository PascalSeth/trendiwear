'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Package, Truck, CheckCircle2, Clock, Phone, MessageSquare, MapPin, 
  Loader2, Store
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface OrderItemType {
  id: string;
  quantity: number;
  size?: string;
  color?: string;
  price: number;
  status: string;
  deliveryFee?: number;
  isPreorder?: boolean;
  product: {
    name: string;
    images: string[];
    currency: string;
  };
}

export interface OrderType {
  id: string;
  subtotal: number;
  shippingCost: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  deliveryMethod: string; // 'DELIVERY' | 'PICKUP'
  notes?: string;
  riderName?: string;
  riderPhone?: string;
  trackingNumber?: string;
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
  items: OrderItemType[];
}

interface OrderKanbanBoardProps {
  orders: OrderType[];
  loading: boolean;
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
  onOpenDetails: (order: OrderType) => void;
  onOpenQuickAction: (order: OrderType) => void;
  actionLoadingId: string | null;
}

export const OrderKanbanBoard: React.FC<OrderKanbanBoardProps> = ({
  orders,
  loading,
  onUpdateStatus,
  onOpenDetails,
  onOpenQuickAction,
  actionLoadingId,
}) => {
  // Categorize orders into 4 fulfillment stages
  const newOrders = orders.filter(
    (o) => o.status === 'PROCESSING' || o.status === 'PENDING' || o.status === 'PAID'
  );

  const readyOrders = orders.filter(
    (o) => o.status === 'READY_FOR_PICKUP' || o.status === 'PACKED' || o.status === 'AWAITING_SHIPPING_PAYMENT' || o.status === 'READY_FOR_DELIVERY'
  );

  const inTransitOrders = orders.filter(
    (o) => o.status === 'SHIPPED' || o.status === 'DISPATCHED' || o.status === 'ON_THE_WAY' || o.status === 'IN_TRANSIT'
  );

  const completedOrders = orders.filter(
    (o) => o.status === 'DELIVERED' || o.status === 'COMPLETED'
  );

  const stages = [
    {
      id: 'new',
      title: 'New Paid Orders',
      subtitle: 'Items to pack & prepare',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
      orders: newOrders,
    },
    {
      id: 'ready',
      title: 'Ready for Dispatch / Pickup',
      subtitle: 'Packed for Rider or Store Pickup',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Package,
      orders: readyOrders,
    },
    {
      id: 'transit',
      title: 'Out for Delivery',
      subtitle: 'Riders in transit',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Truck,
      orders: inTransitOrders,
    },
    {
      id: 'completed',
      title: 'Delivered & Collected',
      subtitle: 'Funds released to wallet',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      orders: completedOrders,
    },
  ];

  if (loading) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-12 flex flex-col items-center justify-center min-h-[350px]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500">Loading Order Pipeline...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {stages.map((stage) => {
        const StageIcon = stage.icon;
        return (
          <div key={stage.id} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex flex-col min-h-[500px]">
            
            {/* STAGE COLUMN HEADER */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${stage.badgeBg}`}>
                  <StageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 tracking-tight">{stage.title}</h3>
                  <p className="text-[10px] font-medium text-slate-500">{stage.subtitle}</p>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${stage.badgeBg}`}>
                {stage.orders.length}
              </span>
            </div>

            {/* ORDER CARDS LIST */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {stage.orders.length === 0 ? (
                <div className="h-36 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <p className="text-xs font-bold">No orders in this stage</p>
                </div>
              ) : (
                stage.orders.map((order) => {
                  const firstItem = order.items[0];
                  const totalItemsCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
                  const isActionLoading = actionLoadingId === order.id;
                  const isPickup = order.deliveryMethod?.toUpperCase() === 'PICKUP';

                  // Format WhatsApp & Phone numbers
                  const rawPhone = order.customer?.phone || '';
                  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
                  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('233') ? cleanPhone : '233' + cleanPhone.replace(/^0/, '')}?text=${encodeURIComponent(`Hello ${order.customer.firstName}, regarding your order #${order.id.slice(0, 8)} on TrendiZip...`)}` : '';

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all space-y-3 relative group"
                    >
                      {/* Top Order ID & Delivery Method Badge */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900">#{order.id.slice(0, 8)}</span>
                          
                          {/* Delivery vs Store Pickup Badge */}
                          {isPickup ? (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-black uppercase rounded-full flex items-center gap-1">
                              <Store className="w-3 h-3 text-purple-600" /> Store Pickup
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-black uppercase rounded-full flex items-center gap-1">
                              <Truck className="w-3 h-3 text-indigo-600" /> Delivery
                            </span>
                          )}

                          {order.items.some(i => i.isPreorder) && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded">
                              Pre-Order
                            </span>
                          )}
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>

                      {/* Product Preview */}
                      {firstItem && (
                        <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="relative w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                            {firstItem.product.images?.[0] ? (
                              <Image
                                src={firstItem.product.images[0]}
                                alt={firstItem.product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400 m-auto" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {firstItem.product.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-medium truncate">
                              Qty: {firstItem.quantity} {firstItem.size && `• Size: ${firstItem.size}`} {firstItem.color && `• ${firstItem.color}`}
                            </p>
                            {totalItemsCount > 1 && (
                              <span className="text-[9px] text-indigo-600 font-bold">
                                +{totalItemsCount - firstItem.quantity} more items
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Customer Info & Destination/Pickup Info */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            {order.customer?.firstName} {order.customer?.lastName}
                          </span>
                          <span className="font-black text-slate-900">
                            GH₵ {order.totalPrice.toFixed(2)}
                          </span>
                        </div>

                        {isPickup ? (
                          <div className="flex items-center gap-1 text-[10px] text-purple-700 font-bold bg-purple-50 p-1.5 rounded-lg border border-purple-100">
                            <Store className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                            <span>Customer collecting in store</span>
                          </div>
                        ) : order.address ? (
                          <div className="flex items-start gap-1 text-[10px] text-slate-500 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <span className="truncate">
                              {order.address.street}, {order.address.city}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* Customer Contact Shortcut Buttons */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                        {rawPhone && (
                          <a
                            href={`tel:${rawPhone}`}
                            className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 transition-all"
                            title="Call Customer"
                          >
                            <Phone className="w-3 h-3 text-slate-600" /> Call
                          </a>
                        )}

                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 transition-all border border-emerald-200"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600" /> WhatsApp
                          </a>
                        )}

                        <button
                          onClick={() => onOpenDetails(order)}
                          className="py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg transition-all"
                        >
                          Details
                        </button>
                      </div>

                      {/* DYNAMIC STAGE ACTION BUTTON BASED ON DELIVERY VS STORE PICKUP */}
                      <div className="pt-2">
                        {stage.id === 'new' && (
                          <button
                            onClick={() => onUpdateStatus(order.id, 'READY_FOR_PICKUP')}
                            disabled={isActionLoading}
                            className={`w-full py-2 disabled:bg-slate-300 text-white font-bold text-[11px] rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                              isPickup ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                          >
                            {isActionLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isPickup ? (
                              <>
                                <Store className="w-3.5 h-3.5" /> Ready for Store Pickup
                              </>
                            ) : (
                              <>
                                <Package className="w-3.5 h-3.5" /> Mark Packed &amp; Ready
                              </>
                            )}
                          </button>
                        )}

                        {stage.id === 'ready' && (
                          isPickup ? (
                            <div className="w-full py-2 bg-purple-50 text-purple-900 border border-purple-200 font-bold text-[10px] rounded-lg text-center flex items-center justify-center gap-1.5 px-2">
                              <Store className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>Awaiting Customer Collection (Customer confirms on device)</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => onOpenQuickAction(order)}
                              disabled={isActionLoading}
                              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-[11px] rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5"
                            >
                              <Truck className="w-3.5 h-3.5" /> Dispatch / Assign Rider
                            </button>
                          )
                        )}

                        {stage.id === 'transit' && (
                          <button
                            onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                            disabled={isActionLoading}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-[11px] rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5"
                          >
                            {isActionLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
                              </>
                            )}
                          </button>
                        )}

                        {stage.id === 'completed' && (
                          <div className="w-full py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] rounded-lg text-center flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {isPickup ? 'Collected In-Store' : 'Settled in Wallet'}
                          </div>
                        )}
                      </div>

                    </motion.div>
                  );
                })
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};
