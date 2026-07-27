"use client";

import React, { useState, useMemo } from "react";
import useSWR from 'swr';
import Image from "next/image";
import {
  Truck, Package, Loader2, Search, 
  Clock, LayoutGrid, List, CheckCircle2
} from "lucide-react";
import { toast } from 'sonner';

import { OrderKanbanBoard, OrderType } from "./components/OrderKanbanBoard";
import { OrderQuickActionModal } from "./components/OrderQuickActionModal";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OrdersDataTable() {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [quickActionOrder, setQuickActionOrder] = useState<OrderType | null>(null);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch orders from API
  const { data, mutate, isLoading } = useSWR('/api/orders?dashboard=true', fetcher, {
    refreshInterval: 10000,
  });

  const rawOrders: OrderType[] = useMemo(() => {
    return data?.orders || data || [];
  }, [data]);

  // Compute metrics
  const newCount = rawOrders.filter(o => o.status === 'PROCESSING' || o.status === 'PENDING' || o.status === 'PAID').length;
  const readyCount = rawOrders.filter(o => o.status === 'READY_FOR_PICKUP' || o.status === 'PACKED' || o.status === 'AWAITING_SHIPPING_PAYMENT').length;
  const transitCount = rawOrders.filter(o => o.status === 'SHIPPED' || o.status === 'DISPATCHED' || o.status === 'ON_THE_WAY' || o.status === 'IN_TRANSIT').length;
  const completedCount = rawOrders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;

  const deliveryCount = rawOrders.filter(o => o.deliveryMethod?.toUpperCase() !== 'PICKUP').length;
  const pickupCount = rawOrders.filter(o => o.deliveryMethod?.toUpperCase() === 'PICKUP').length;

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return rawOrders.filter((order) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        order.id.toLowerCase().includes(searchLower) ||
        `${order.customer?.firstName} ${order.customer?.lastName}`.toLowerCase().includes(searchLower) ||
        order.items.some(i => i.product.name.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      // Tab filter
      if (activeTab === 'delivery') return order.deliveryMethod?.toUpperCase() !== 'PICKUP';
      if (activeTab === 'pickup') return order.deliveryMethod?.toUpperCase() === 'PICKUP';
      if (activeTab === 'new') return order.status === 'PROCESSING' || order.status === 'PENDING' || order.status === 'PAID';
      if (activeTab === 'ready') return order.status === 'READY_FOR_PICKUP' || order.status === 'PACKED' || order.status === 'AWAITING_SHIPPING_PAYMENT';
      if (activeTab === 'transit') return order.status === 'SHIPPED' || order.status === 'DISPATCHED' || order.status === 'ON_THE_WAY' || order.status === 'IN_TRANSIT';
      if (activeTab === 'completed') return order.status === 'DELIVERED' || order.status === 'COMPLETED';

      return true;
    });
  }, [rawOrders, searchQuery, activeTab]);

  // Handle status update
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update order status');
      }

      toast.success(`Order #${orderId.slice(0, 8)} status updated!`);
      mutate();
    } catch (err: unknown) {
      console.error(err);
      const errObj = err as { message?: string };
      toast.error(errObj.message || 'Failed to update order status');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* EXECUTIVE HEADER & METRIC SUMMARY CARDS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Merchant Fulfillment Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Order Fulfillment Hub
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Process new purchases, assign delivery riders, and track escrow settlements in real-time.
          </p>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'kanban'
                ? 'bg-white text-indigo-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Pipeline Board
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-white text-indigo-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" /> Data Table
          </button>
        </div>
      </div>

      {/* 4 SUMMARY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div 
          onClick={() => setActiveTab('new')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'new' ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-500/20' : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Action Required
            </span>
            {newCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                {newCount} New
              </span>
            )}
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{newCount} Orders</p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Need packing &amp; confirmation</p>
        </div>

        <div 
          onClick={() => setActiveTab('ready')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'ready' ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Ready to Dispatch
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{readyCount} Orders</p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Packed &amp; waiting for rider</p>
        </div>

        <div 
          onClick={() => setActiveTab('transit')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'transit' ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" /> Out for Delivery
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{transitCount} Orders</p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Currently in transit</p>
        </div>

        <div 
          onClick={() => setActiveTab('completed')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'completed' ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{completedCount} Orders</p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Escrow funds settled</p>
        </div>

      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Orders', count: rawOrders.length },
            { id: 'delivery', label: '🚚 Delivery', count: deliveryCount },
            { id: 'pickup', label: '🏬 Store Pickup', count: pickupCount },
            { id: 'new', label: 'Action Required', count: newCount },
            { id: 'ready', label: 'Ready for Dispatch/Pickup', count: readyCount },
            { id: 'transit', label: 'In Transit', count: transitCount },
            { id: 'completed', label: 'Completed', count: completedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Order ID, Customer, Product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

      </div>

      {/* VIEW RENDER: KANBAN BOARD VS TABLE */}
      {viewMode === 'kanban' ? (
        <OrderKanbanBoard
          orders={filteredOrders}
          loading={isLoading}
          onUpdateStatus={handleUpdateStatus}
          onOpenDetails={(order) => {
            setSelectedOrder(order);
            setIsDetailOpen(true);
          }}
          onOpenQuickAction={(order) => {
            setQuickActionOrder(order);
            setIsQuickActionOpen(true);
          }}
          actionLoadingId={actionLoadingId}
        />
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items Purchased</th>
                  <th className="py-3.5 px-4">Total (GHS)</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Fulfillment Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                      Loading Orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const firstItem = order.items[0];

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{order.customer?.firstName} {order.customer?.lastName}</p>
                          <p className="text-[10px] text-slate-500">{order.customer?.phone || order.customer?.email}</p>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          {firstItem && (
                            <div className="flex items-center gap-2">
                              <div className="relative w-8 h-8 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                {firstItem.product.images?.[0] && (
                                  <Image src={firstItem.product.images[0]} alt={firstItem.product.name} fill className="object-cover" />
                                )}
                              </div>
                              <span className="truncate font-bold text-slate-800">{firstItem.product.name}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          GH₵ {order.totalPrice.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailOpen(true);
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-all"
                          >
                            View Order
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DISPATCH QUICK ACTION MODAL */}
      <OrderQuickActionModal
        order={quickActionOrder}
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onRefresh={mutate}
      />

      {/* SLIDE-OVER ORDER DETAIL DRAWER */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-6 space-y-6">
          {selectedOrder && (
            <div className="space-y-6 font-sans">
              
              {/* Header */}
              <div className="pb-4 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Order Audit Trail</span>
                <SheetTitle className="text-xl font-black text-slate-900 mt-1">
                  Order #{selectedOrder.id.slice(0, 8)}
                </SheetTitle>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Customer Contact Capsule */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Customer Details</h4>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-900">{selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</p>
                  <p className="text-slate-500">{selectedOrder.customer?.email}</p>
                  {selectedOrder.customer?.phone && (
                    <p className="text-slate-500 font-mono">Tel: {selectedOrder.customer.phone}</p>
                  )}
                </div>

                {selectedOrder.address && (
                  <div className="pt-2 border-t border-slate-200/60 text-xs">
                    <p className="font-bold text-slate-700 mb-0.5">Delivery Destination:</p>
                    <p className="text-slate-600 leading-relaxed">
                      {selectedOrder.address.street}, {selectedOrder.address.city}, {selectedOrder.address.state}, {selectedOrder.address.country}
                    </p>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Order Items ({selectedOrder.items.length})</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                          {item.product.images?.[0] && (
                            <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                          )}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">{item.product.name}</h5>
                          <p className="text-[10px] text-slate-500">Qty: {item.quantity} {item.size && `• ${item.size}`} {item.color && `• ${item.color}`}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-900">GH₵ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>GH₵ {selectedOrder.subtotal?.toFixed(2) || selectedOrder.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Shipping Fee</span>
                  <span>GH₵ {selectedOrder.shippingCost?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between font-black text-white text-sm pt-2 border-t border-slate-800">
                  <span>Total Amount Paid</span>
                  <span>GH₵ {selectedOrder.totalPrice.toFixed(2)}</span>
                </div>
              </div>

            </div>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
