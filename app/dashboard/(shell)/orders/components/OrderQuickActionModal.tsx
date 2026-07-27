'use client';

import React, { useState } from 'react';
import { 
  X, Truck, Loader2, Phone, User, Hash, MapPin
} from 'lucide-react';
import { OrderType } from './OrderKanbanBoard';
import { toast } from 'sonner';

interface OrderQuickActionModalProps {
  order: OrderType | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const OrderQuickActionModal: React.FC<OrderQuickActionModalProps> = ({
  order,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [riderName, setRiderName] = useState<string>('');
  const [riderPhone, setRiderPhone] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen || !order) return null;

  const handleDispatch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderName,
          riderPhone,
          trackingNumber,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to dispatch order');
      }

      toast.success(`Order #${order.id.slice(0, 8)} dispatched successfully!`);
      onRefresh();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const errObj = err as { message?: string };
      toast.error(errObj.message || 'Failed to dispatch order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden space-y-4 p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Dispatch Order #{order.id.slice(0, 8)}</h3>
              <p className="text-[11px] text-slate-500 font-medium">Assign delivery details &amp; notify customer</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Customer Address Card */}
        {order.address && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Customer: {order.customer?.firstName} {order.customer?.lastName}</span>
            </div>
            <p className="text-[11px] text-slate-600 pl-5">
              {order.address.street}, {order.address.city}, {order.address.state}
            </p>
          </div>
        )}

        {/* Form Inputs */}
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Rider / Courier Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Kwame Mensah (Express Dispatch)"
                value={riderName}
                onChange={(e) => setRiderName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Rider Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                placeholder="e.g. 0244123456"
                value={riderPhone}
                onChange={(e) => setRiderPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Tracking Number / Waybill (Optional)</label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. TRK-983421"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleDispatch}
            disabled={submitting}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
            Confirm Dispatch
          </button>
        </div>

      </div>
    </div>
  );
};
