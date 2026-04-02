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
import {
  ShoppingBag, Truck, Eye, Package,
  Check, Loader2, X, AlertCircle, Search, ChevronRight, Clock, RefreshCw,
  MapPin, Phone, Mail, CheckCheck, SendHorizontal, Ban, RotateCcw,
  Hash, Wallet
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
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
  tax: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  trackingNumber?: string;
  notes?: string;
  yangoQuotePrice?: number;
  yangoStatus?: string;
  riderName?: string;
  riderPhone?: string;
  manualDeliveryFee?: number;
  readyForDeliveryAt?: string;
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
    product: {
      name: string;
      images: string[];
      currency: string;
    };
  }>;
  deliveryConfirmation?: { status: string };
  paymentEscrow?: { status: string };
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  PENDING:                  { label: "Pending",            color: "text-amber-600",  bg: "bg-amber-50/50",  border: "border-amber-100",  icon: <Clock className="w-3 h-3" /> },
  CONFIRMED:                { label: "Confirmed",          color: "text-blue-600",   bg: "bg-blue-50/50",   border: "border-blue-100",   icon: <Check className="w-3 h-3" /> },
  PROCESSING:               { label: "Processing",         color: "text-violet-600", bg: "bg-violet-50/50", border: "border-violet-100", icon: <Loader2 className="w-3 h-3 animate-spin-slow" /> },
  READY_FOR_DELIVERY:       { label: "Ready",              color: "text-teal-600",   bg: "bg-teal-50/50",   border: "border-teal-100",   icon: <Package className="w-3 h-3" /> },
  AWAITING_DELIVERY_PAYMENT:{ label: "Awaiting Pay",       color: "text-orange-600", bg: "bg-orange-50/50", border: "border-orange-100", icon: <Wallet className="w-3 h-3" /> },
  SHIPPED:                  { label: "Shipped",            color: "text-sky-600",    bg: "bg-sky-50/50",    border: "border-sky-100",    icon: <Truck className="w-3 h-3" /> },
  DELIVERED:                { label: "Delivered",          color: "text-emerald-600",bg: "bg-emerald-50/50",border: "border-emerald-100",icon: <CheckCheck className="w-3 h-3" /> },
  CANCELLED:                { label: "Cancelled",          color: "text-rose-600",   bg: "bg-rose-50/50",   border: "border-rose-100",   icon: <Ban className="w-3 h-3" /> },
  REFUNDED:                 { label: "Refunded",           color: "text-slate-600",  bg: "bg-slate-50/50",  border: "border-slate-100",  icon: <RotateCcw className="w-3 h-3" /> },
  READY_FOR_PICKUP:         { label: "Pickup Ready",       color: "text-indigo-600", bg: "bg-indigo-50/50", border: "border-indigo-100", icon: <Package className="w-3 h-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "text-slate-600", bg: "bg-slate-50/50", border: "border-slate-100", icon: <AlertCircle className="w-3 h-3" /> };
  return (
    <motion.span 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-md shadow-sm ${cfg.color} ${cfg.bg} ${cfg.border}`}
    >
      {cfg.icon}
      {cfg.label}
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
}: {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string, extra?: { trackingNumber?: string; notes?: string }) => Promise<void>;
  onManualDelivery: (id: string, details: ManualDeliveryDetails) => Promise<void>;
}) {
  const [trackingInput, setTrackingInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setTrackingInput(order.trackingNumber || "");
      setNotesInput(order.notes || "");
    }
  }, [order]);

  if (!order) return null;

  const act = async (status: string, extra?: object) => {
    setLoading(status);
    await onStatusUpdate(order.id, status, extra);
    setLoading(null);
  };

  const currency = order.items[0]?.product.currency || "GHS";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            Order #{order.id.slice(-8).toUpperCase()}
          </SheetTitle>
          <SheetDescription>
            Placed {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-6">
          {/* Status Row */}
          <div className="flex items-center justify-between">
            <StatusBadge status={order.status} />
            <div className="flex items-center gap-2">
              <Badge variant={order.paymentStatus === "PAID" ? "default" : "outline"} className="text-xs">
                {order.paymentStatus}
              </Badge>
              {order.deliveryMethod === "PICKUP" ? (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                  <Package size={10} /> Pickup
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                  <Truck size={10} /> Delivery
                </Badge>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customer</p>
            <p className="font-medium">{order.customer.firstName} {order.customer.lastName}</p>
            <a href={`mailto:${order.customer.email}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <Mail size={12} /> {order.customer.email}
            </a>
            {order.customer.phone && (
              <a href={`tel:${order.customer.phone}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                <Phone size={12} /> {order.customer.phone}
              </a>
            )}
          </div>

          {/* Manual Delivery Details */}
          {order.riderName && (
            <div className="bg-teal-50 border border-teal-100 rounded-lg p-4 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 flex items-center gap-1">
                <Truck size={10} /> Delivery Rider
              </p>
              <p className="text-sm font-medium">{order.riderName}</p>
              <p className="text-sm text-gray-600">{order.riderPhone}</p>
              {order.manualDeliveryFee && (
                <p className="text-sm text-gray-600">Fee: {currency}{order.manualDeliveryFee.toFixed(2)}</p>
              )}
              {order.readyForDeliveryAt && (
                <p className="text-[10px] text-gray-400 mt-2">
                  Marked ready at {new Date(order.readyForDeliveryAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Delivery Address */}
          {order.address && order.deliveryMethod === "DELIVERY" && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1"><MapPin size={10} /> Delivery Address</p>
              <p className="text-sm">{order.address.street}</p>
              <p className="text-sm text-gray-600">{order.address.city}, {order.address.state}</p>
              <p className="text-sm text-gray-600">{order.address.country}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Items ({order.items.length})</p>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                  {item.product.images[0] && (
                    <div className="w-14 h-14 relative flex-shrink-0">
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover rounded-lg border border-gray-100 shadow-sm" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                        Qty: {item.quantity}
                      </span>
                      {item.size && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                          Size: {item.size}
                        </span>
                      )}
                      {item.color && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-stone-50 text-stone-600 px-2 py-0.5 rounded-md">
                          <span className="w-3 h-3 rounded-full border border-stone-200 flex-shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                          Color
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="font-semibold text-sm flex-shrink-0">{currency}{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{currency}{order.subtotal?.toFixed(2)}</span></div>
            {order.shippingCost > 0 && <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span>{currency}{order.shippingCost?.toFixed(2)}</span></div>}
            {order.yangoQuotePrice && <div className="flex justify-between"><span className="text-gray-600">Yango Delivery</span><span>{currency}{order.yangoQuotePrice?.toFixed(2)}</span></div>}
            <div className="flex justify-between font-semibold border-t pt-2"><span>Total</span><span>{currency}{order.totalPrice?.toFixed(2)}</span></div>
          </div>

          {/* Tracking Number */}
          {(order.status === "PROCESSING" || order.status === "SHIPPED") && order.deliveryMethod === "DELIVERY" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tracking Number</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter tracking number..."
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  className="text-sm"
                />
                <Button size="sm" variant="outline" onClick={() => act("SHIPPED", { trackingNumber: trackingInput })}>
                  {loading === "SHIPPED" ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Seller Notes</p>
            <textarea
              className="w-full text-sm border rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add a note about this order..."
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
            />
            <Button size="sm" variant="outline" className="w-full" onClick={() => act(order.status, { notes: notesInput })}>
              Save Notes
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Actions</p>

          {/* Orders arrive as PROCESSING after Paystack payment */}
          {(order.status === "PROCESSING" || order.status === "CONFIRMED") && order.deliveryMethod === "DELIVERY" && (
            <ManualDeliveryDialog 
              order={order} 
              onConfirm={(details) => onManualDelivery(order.id, details)}
            >
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" disabled={!!loading}>
                {loading === "READY_FOR_DELIVERY" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                📦 Mark Ready for Delivery
              </Button>
            </ManualDeliveryDialog>
          )}

          {(order.status === "PROCESSING" || order.status === "CONFIRMED") && order.deliveryMethod === "PICKUP" && (
            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={() => act("READY_FOR_PICKUP")} disabled={!!loading}>
              {loading === "READY_FOR_PICKUP" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
              Mark Ready for Pickup
            </Button>
          )}

          {order.status === "AWAITING_DELIVERY_PAYMENT" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
              ⏳ <strong>Waiting for customer</strong> to accept & pay the Yango delivery fee of GHS {order.yangoQuotePrice?.toFixed(2)}.
            </div>
          )}

          {(order.status === "PROCESSING" || order.status === "READY_FOR_DELIVERY") && order.deliveryMethod === "DELIVERY" && (
            <Button className="w-full border-blue-200 text-blue-700 hover:bg-blue-50" variant="outline" onClick={() => act("SHIPPED", { trackingNumber: trackingInput })} disabled={!!loading}>
              {loading === "SHIPPED" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <SendHorizontal className="w-4 h-4 mr-2" />}
              {order.status === "READY_FOR_DELIVERY" ? "🚀 Ship to Customer" : "Mark as Shipped"}
            </Button>
          )}

          {order.status === "SHIPPED" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span>Great! Order is <strong>In Transit</strong>. Customer will confirm arrival.</span>
            </div>
          )}

          {!["CANCELLED", "DELIVERED", "REFUNDED"].includes(order.status) && (
            <Button className="w-full" variant="destructive" onClick={() => act("CANCELLED")} disabled={!!loading}>
              {loading === "CANCELLED" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
              Cancel Order
            </Button>
          )}

          <Button className="w-full" variant="ghost" asChild>
            <Link href={`/dashboard/orders/${order.id}`}>
              <Eye className="w-4 h-4 mr-2" /> View Full Details Page
            </Link>
          </Button>
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
}: {
  order: Order;
  onOpen: () => void;
  onStatusUpdate: (id: string, status: string) => Promise<void>;
  onManualDelivery: (id: string, details: ManualDeliveryDetails) => Promise<void>;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const act = async (status: string) => {
    setLoading(status);
    await onStatusUpdate(order.id, status);
    setLoading(null);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Orders arrive as PROCESSING after payment — show Yango/Pickup directly */}
      {(order.status === "PROCESSING" || order.status === "CONFIRMED") && order.deliveryMethod === "DELIVERY" && (
        <ManualDeliveryDialog order={order} onConfirm={(details) => onManualDelivery(order.id, details)}>
          <Button size="sm" className="h-8 text-[10px] font-black uppercase tracking-wider px-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md shadow-teal-100 border-none transition-all hover:scale-105 active:scale-95" disabled={!!loading}>
            {loading === "READY_FOR_DELIVERY" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5 mr-1.5" />}
            Fulfill
          </Button>
        </ManualDeliveryDialog>
      )}
      {(order.status === "PROCESSING" || order.status === "CONFIRMED") && order.deliveryMethod === "PICKUP" && (
        <Button size="sm" className="h-8 text-[10px] font-black uppercase tracking-wider px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-100 border-none transition-all hover:scale-105 active:scale-95" onClick={() => act("READY_FOR_PICKUP")} disabled={!!loading}>
          {loading === "READY_FOR_PICKUP" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5 mr-1.5" />}
          Ready
        </Button>
      )}
      {order.status === "AWAITING_DELIVERY_PAYMENT" && (
        <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 animate-pulse">
           <Clock className="w-3 h-3" /> Awaiting Payment
        </span>
      )}
      {order.status === "READY_FOR_DELIVERY" && (
        <Button size="sm" className="h-8 text-[10px] font-black uppercase tracking-wider px-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md shadow-emerald-100 border-none transition-all hover:scale-105 active:scale-95" onClick={() => act("SHIPPED")} disabled={!!loading}>
          {loading === "SHIPPED" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SendHorizontal className="w-3.5 h-3.5 mr-1.5" />}
          Ship
        </Button>
      )}
      {order.status === "SHIPPED" && (
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

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/orders?page=1&limit=100");
      if (response.ok) {
        const result = await response.json();
        setData(result.orders || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (!initialData) fetchOrders(); }, [initialData, fetchOrders]);

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
        setSelectedOrder((prev) => prev?.id === orderId ? { ...prev, status: newStatus, ...(extra?.trackingNumber ? { trackingNumber: extra.trackingNumber } : {}), ...(extra?.notes ? { notes: extra.notes } : {}) } : prev);
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
      } else {
        const data = await response.json();
        showToast(data.error || "Failed to save delivery details.");
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
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 40,
    },
    {
      accessorKey: "id",
      header: "Order",
      cell: ({ row }) => (
        <div>
          <button onClick={() => openOrder(row.original)} className="font-mono text-sm font-medium text-blue-600 hover:underline">
            #{row.original.id.slice(-8).toUpperCase()}
          </button>
          <div className="text-xs text-gray-400">{new Date(row.original.createdAt).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {row.original.customer.firstName[0]}{row.original.customer.lastName[0]}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{row.original.customer.firstName} {row.original.customer.lastName}</div>
            <div className="text-xs text-gray-500 truncate hidden sm:block">{row.original.customer.email}</div>
          </div>
        </div>
      ),
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => (
        <div className="space-y-2 min-w-[200px]">
          {row.original.items.slice(0, 2).map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.product.images[0] && (
                <div className="w-8 h-8 relative flex-shrink-0">
                   <Image src={item.product.images[0]} alt="" fill className="rounded-md object-cover border border-gray-100" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-gray-800 truncate">{item.quantity}× {item.product.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {item.size && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                      {item.size}
                    </span>
                  )}
                  {item.color && (
                    <span className="flex items-center gap-1 text-[9px] font-medium text-stone-500">
                      <span className="w-3 h-3 rounded-full border border-stone-200 inline-block flex-shrink-0" style={{ backgroundColor: item.color }} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {row.original.items.length > 2 && (
            <div className="text-[10px] font-medium text-gray-400">+{row.original.items.length - 2} more items</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "totalPrice",
      header: "Total",
      cell: ({ row }) => {
        const currency = row.original.items[0]?.product.currency || "GHS";
        return (
          <div className="font-semibold text-sm">{currency}{(row.original.totalPrice ?? 0).toFixed(2)}</div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "fulfillment",
      header: "Fulfillment",
      cell: ({ row }) => {
        const method = row.original.deliveryMethod;
        return method === "PICKUP" ? (
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 w-fit">
            <Package size={10} /> Pickup
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 w-fit">
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
    processing: data.filter((o) => ["CONFIRMED", "PROCESSING"].includes(o.status)).length,
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

  const statusFilters = ["All", "PENDING", "CONFIRMED", "PROCESSING", "AWAITING_DELIVERY_PAYMENT", "SHIPPED", "DELIVERED", "CANCELLED", "READY_FOR_PICKUP"];

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
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((status) => {
            const cfg = STATUS_CONFIG[status];
            const active = status === "All"
              ? columnFilters.length === 0
              : columnFilters.some((f) => f.id === "status" && f.value === status);
            return (
              <button
                key={status}
                onClick={() => {
                  if (status === "All") {
                    setColumnFilters([]);
                  } else {
                    setColumnFilters([{ id: "status", value: status }]);
                  }
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? status === "All"
                      ? "bg-gray-900 text-white border-gray-900"
                      : `${cfg?.bg} ${cfg?.color} ${cfg?.border} shadow-sm`
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {status === "All" ? "All" : (cfg?.label ?? status)}
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

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-semibold uppercase tracking-wide text-gray-500">
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
                  className="hover:bg-gray-50 cursor-default"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-gray-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
              onChange={(e) => setDetails({ ...details, riderName: e.target.value, riderId: "" })}
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
              onChange={(e) => setDetails({ ...details, riderPhone: e.target.value, riderId: "" })}
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
              onChange={(e) => setDetails({ ...details, manualDeliveryFee: e.target.value })}
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
              onChange={(e) => setDetails({ ...details, trackingNumber: e.target.value })}
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
