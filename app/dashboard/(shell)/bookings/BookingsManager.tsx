'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  Calendar, Clock, MapPin, Check, X, 
  Loader2, AlertCircle, 
  User, CheckCircle, Smartphone, Mail,
  CalendarCheck, CreditCard, Wallet, Hourglass,
  BadgeCheck, Coins, Ruler
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, differenceInMinutes, isAfter } from 'date-fns';
import { toast } from 'sonner';

interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface Booking {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  paymentMethod: 'PLATFORM' | 'IN_PERSON';
  paymentStatus: 'UNPAID' | 'PAID' | 'PENDING_IN_PERSON' | 'REFUNDED' | 'PARTIALLY_PAID';
  bookingDate: string;
  totalPrice: number;
  location?: string;
  notes?: string;
  requestExpiresAt?: string;
  isQuoteBased?: boolean;
  quoteStatus?: string;
  depositAmount?: number;
  balanceAmount?: number;
  inspirationImages?: string[];
  snapshotMeasurements?: Record<string, string | number | boolean | null | undefined>;
  service: {
    name: string;
    imageUrl?: string;
  };
  customer: Customer;
}

export function BookingsManager() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.bookings) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard bookings:', err);
      toast.error('Could not load appointment requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 60000); // Refresh every minute for timers
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: string, status: Booking['status'], extra?: Record<string, unknown>) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extra }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Update failed');
      }

      toast.success(`Booking status updated successfully`);
      await fetchBookings();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update booking status';
      toast.error(errorMessage);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRequestBalance = async (id: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}/invoice`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Invoice generation failed');
      }

      await res.json();
      toast.success('Final Balance invoice sent to customer!');
      // Refresh to update UI if needed
      await fetchBookings();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request balance';
      toast.error(errorMessage);
    } finally {
      setUpdatingId(null);
    }
  };



  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'CONFIRMED': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'CANCELLED': return 'bg-red-50 text-red-600 border-red-100';
    }
  };

  const getExpiryLabel = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const expiryDate = new Date(expiresAt);
    if (!isAfter(expiryDate, new Date())) return <span className="text-red-500 font-black tracking-[0.2em]">EXPIRED</span>;
    
    const minutesLeft = differenceInMinutes(expiryDate, new Date());
    if (minutesLeft < 60) return `${minutesLeft}m left to confirm`;
    return `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m left`;
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Professional Stream</h1>
          <p className="text-slate-500 font-medium tracking-tight">Curation of requested sessions and service appointments</p>
        </div>
        <div className="flex items-center gap-4 px-8 py-6 bg-white rounded-3xl border border-slate-100 shadow-sm border-b-4 border-b-violet-500">
           <CalendarCheck className="text-violet-600" size={32} strokeWidth={2.5} />
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Active Pipeline</p>
              <p className="text-2xl font-black text-slate-900 leading-none mt-1">{bookings.filter(b => b.status === 'PENDING').length} Requests</p>
           </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <Loader2 className="animate-spin text-slate-200" size={40} />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Calibrating Stream...</p>
        </div>
      ) : bookings.length > 0 ? (
        <div className="grid grid-cols-1 gap-8">
          <AnimatePresence mode="popLayout">
            {bookings.map((booking) => {
              const isExpired = booking.status === 'PENDING' && booking.requestExpiresAt && !isAfter(new Date(booking.requestExpiresAt), new Date());
              const isPaid = booking.paymentStatus === 'PAID';
              const isInPersonPending = booking.paymentMethod === 'IN_PERSON' && booking.status === 'CONFIRMED' && booking.paymentStatus === 'PENDING_IN_PERSON';
              const isPlatformUnpaid = booking.paymentMethod === 'PLATFORM' && booking.status === 'CONFIRMED' && booking.paymentStatus === 'UNPAID';
              
              const isWaitingForTailorQuote = booking.isQuoteBased && booking.quoteStatus === 'REQUESTED';
              const isWaitingForClientQuote = booking.isQuoteBased && booking.quoteStatus === 'QUOTE_PROVIDED';

              return (
                <motion.div
                  layout
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "bg-white rounded-[3rem] border overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500",
                    isExpired ? "opacity-60 grayscale border-slate-100" : "border-slate-100",
                    isPlatformUnpaid ? "border-amber-200" : ""
                  )}
                >
                  <div className="p-8 md:p-12">
                     <div className="flex flex-col lg:flex-row gap-12 items-start">
                        {/* Left: Customer Info */}
                        <div className="space-y-6 w-full lg:w-64 shrink-0 px-4 py-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-50">
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-slate-400 ring-8 ring-white border border-slate-100 overflow-hidden shadow-inner">
                                 <User size={32} strokeWidth={1.5} />
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-900 leading-tight uppercase tracking-tight">{booking.customer.firstName} {booking.customer.lastName}</p>
                                 <Badge variant="outline" className={cn("mt-2 px-3 py-1 rounded-full", getStatusColor(booking.status))}>
                                    <span className="text-[9px] font-black tracking-widest">{booking.status}</span>
                                 </Badge>
                              </div>
                           </div>
                           <div className="space-y-3 pt-4 border-t border-slate-100">
                              <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 truncate">
                                 <Mail size={14} className="text-slate-300" /> {booking.customer.email}
                              </div>
                              {booking.customer.phone && (
                                 <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                                    <Smartphone size={14} className="text-slate-300" /> {booking.customer.phone}
                                 </div>
                              )}
                           </div>
                        </div>

                        {/* Center: Service & Details */}
                        <div className="flex-1 space-y-8">
                           <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                              <div className="flex gap-6 items-start">
                                 <div className="relative w-28 h-28 rounded-[2rem] overflow-hidden shrink-0 border-4 border-slate-50 shadow-lg">
                                    <Image 
                                      src={booking.service.imageUrl || "https://img.freepik.com/free-photo/tailor-measuring-man_23-2148412497.jpg"} 
                                      alt={booking.service.name} 
                                      fill 
                                      className="object-cover" 
                                    />
                                 </div>
                                 <div className="space-y-1 pt-2">
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Curation Request</p>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight group-hover:italic transition-all">{booking.service.name}</h3>
                                    <div className="flex items-center gap-3">
                                      <p className="text-xs font-bold text-slate-400 italic font-serif">Ref ID: {booking.id.slice(-8).toUpperCase()}</p>
                                      {isPaid && (
                                        <Badge className="bg-emerald-500 text-white rounded-full flex items-center gap-1.5 px-3">
                                          <BadgeCheck size={12} /> <span className="text-[9px] font-black tracking-widest uppercase">Secured</span>
                                        </Badge>
                                      )}
                                    </div>
                                 </div>
                              </div>

                              {booking.status === 'PENDING' && (
                                <div className="px-5 py-3 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-3">
                                   <Hourglass className={cn("text-amber-500", !isExpired && "animate-pulse")} size={18} />
                                   <div>
                                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Confirmation Window</p>
                                      <p className={cn("text-xs font-black uppercase tracking-widest", isExpired ? "text-red-500" : "text-amber-700")}>
                                        {getExpiryLabel(booking.requestExpiresAt)}
                                      </p>
                                   </div>
                                </div>
                              )}
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10 rounded-[2.5rem] bg-slate-50/70 border border-slate-100/50">
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar size={12} className="text-slate-900" /> Appointment
                                 </p>
                                 <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">
                                    {format(new Date(booking.bookingDate), 'MMM dd, yyyy')}
                                 </p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={12} className="text-slate-900" /> Time Slot
                                 </p>
                                 <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">
                                    {format(new Date(booking.bookingDate), 'hh:mm a')}
                                 </p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={12} className="text-slate-900" /> Location
                                 </p>
                                 <p className="text-sm font-black text-slate-900 truncate tracking-tighter">
                                    {booking.location || 'BeliBeli Studio'}
                                 </p>
                              </div>
                           </div>

                           {/* Notes & Payment Alert */}
                           <div className="flex flex-col md:flex-row gap-6">
                              {booking.notes && (
                                <div className="flex-1 p-6 rounded-3xl border border-stone-100 bg-stone-50/50">
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                      <AlertCircle size={12} /> Special Request
                                   </p>
                                   <p className="text-xs text-slate-600 leading-relaxed italic">{booking.notes}</p>
                                </div>
                              )}
                              
                              {/* Display Snapshot Measurements */}
                              {booking.snapshotMeasurements && (
                                <div className="flex-1 p-8 rounded-[2.5rem] border border-blue-50 bg-blue-50/10 space-y-6">
                                  <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                      <Ruler size={14} /> Bespoke Specification
                                    </p>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                                      Unit: {booking.snapshotMeasurements?.unit || 'in'}
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    {/* Group 1: Core */}
                                    <div className="space-y-3">
                                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-100 pb-1">Core Metrics</p>
                                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] font-medium">
                                        {[
                                          { label: 'Chest', key: 'bust' },
                                          { label: 'Waist', key: 'waist' },
                                          { label: 'Hips', key: 'hips' },
                                          { label: 'Height', key: 'height' },
                                        ].map(m => booking.snapshotMeasurements?.[m.key] && (
                                          <div key={m.key} className="flex justify-between border-b border-slate-50/50 pb-1">
                                            <span className="text-slate-400 capitalize">{m.label}:</span>
                                            <span className="font-black text-slate-900">{booking.snapshotMeasurements?.[m.key]}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Group 2: Upper */}
                                    {(booking.snapshotMeasurements?.neck || booking.snapshotMeasurements?.shoulder || booking.snapshotMeasurements?.armLength) && (
                                      <div className="space-y-3">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-100 pb-1">Upper Body</p>
                                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] font-medium">
                                          {[
                                            { label: 'Neck', key: 'neck' },
                                            { label: 'Shoulders', key: 'shoulder' },
                                            { label: 'Sleeve', key: 'armLength' },
                                            { label: 'Bicep', key: 'bicep' },
                                            { label: 'Wrist', key: 'wrist' },
                                          ].map(m => booking.snapshotMeasurements?.[m.key] && (
                                            <div key={m.key} className="flex justify-between border-b border-slate-50/50 pb-1">
                                              <span className="text-slate-400 capitalize">{m.label}:</span>
                                              <span className="font-black text-slate-900">{booking.snapshotMeasurements?.[m.key]}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Group 3: Lower */}
                                    {(booking.snapshotMeasurements?.inseam || booking.snapshotMeasurements?.thigh || booking.snapshotMeasurements?.crotchRise) && (
                                      <div className="space-y-3">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-100 pb-1">Lower Body</p>
                                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] font-medium">
                                          {[
                                            { label: 'Inner Leg', key: 'inseam' },
                                            { label: 'Thigh', key: 'thigh' },
                                            { label: 'Knee', key: 'knee' },
                                            { label: 'Ankle', key: 'ankle' },
                                            { label: 'Seat Depth', key: 'crotchRise' },
                                          ].map(m => booking.snapshotMeasurements?.[m.key] && (
                                            <div key={m.key} className="flex justify-between border-b border-slate-50/50 pb-1">
                                              <span className="text-slate-400 capitalize">{m.label}:</span>
                                              <span className="font-black text-slate-900">{booking.snapshotMeasurements?.[m.key]}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Display Inspiration Images */}
                              {booking.inspirationImages && booking.inspirationImages.length > 0 && (
                                <div className="flex-1 p-6 rounded-3xl border border-purple-50 bg-purple-50/20">
                                  <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <AlertCircle size={12} /> Inspiration References
                                  </p>
                                  <div className="flex gap-2 overflow-x-auto pb-1">
                                    {booking.inspirationImages.map((img, idx) => (
                                      <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-sm border border-slate-100">
                                        <Image src={img} alt={`Ref ${idx}`} fill className="object-cover hover:scale-150 transition-transform" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {isPlatformUnpaid && !booking.isQuoteBased && (
                                <div className="flex-1 p-6 rounded-3xl border border-amber-200 bg-amber-50/50 flex items-center gap-4">
                                   <CreditCard className="text-amber-500 shrink-0" size={24} />
                                   <div>
                                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest leading-none">Awaiting Online Deposit</p>
                                      <p className="text-[10px] font-bold text-amber-500 mt-1">Confirmed but not secured. Others can still pay for this slot.</p>
                                   </div>
                                </div>
                              )}
                              {isInPersonPending && (
                                <div className="flex-1 p-6 rounded-3xl border border-blue-200 bg-blue-50/50 flex items-center gap-4">
                                   <Wallet className="text-blue-500 shrink-0" size={24} />
                                   <div>
                                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">Cash Settlement Pending</p>
                                      <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase">Received payment? Mark as complete upon session.</p>
                                   </div>
                                </div>
                              )}
                           </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="w-full lg:w-48 space-y-4 pt-10 lg:pt-0">
                           {/* Standard Service Actions */}
                           {booking.status === 'PENDING' && !isExpired && !booking.isQuoteBased && (
                              <div className="space-y-3">
                                 <Button 
                                   disabled={updatingId === booking.id}
                                   onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                                   className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 transition-all active:scale-95"
                                 >
                                    {updatingId === booking.id ? <Loader2 className="animate-spin" size={16} /> : <><Check size={18} className="mr-2" strokeWidth={3} /> Approve Slot</>}
                                 </Button>
                                 <Button 
                                   disabled={updatingId === booking.id}
                                   variant="outline"
                                   onClick={() => handleUpdateStatus(booking.id, 'CANCELLED')}
                                   className="w-full h-14 border-slate-100 hover:border-red-500 hover:text-red-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all"
                                 >
                                    <X size={16} className="mr-2" strokeWidth={3} /> Decline
                                 </Button>
                              </div>
                           )}

                           {/* Request For Quote Actions */}
                           {booking.status === 'PENDING' && !isExpired && isWaitingForTailorQuote && (
                              <div className="space-y-3">
                                 <Button 
                                   disabled={updatingId === booking.id}
                                   onClick={() => {
                                      const quote = prompt('Enter your Custom Service Quote to charge the client (GHS):', '0');
                                      if (quote && !isNaN(Number(quote)) && Number(quote) > 0) {
                                         handleUpdateStatus(booking.id, 'PENDING', { quoteStatus: 'QUOTE_PROVIDED', quotePrice: Number(quote) });
                                      }
                                   }}
                                   className="w-full h-16 bg-gradient-to-br from-violet-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-200 transition-all active:scale-95"
                                 >
                                    {updatingId === booking.id ? <Loader2 className="animate-spin" size={16} /> : <><CreditCard size={18} className="mr-2" /> Submit Quote</>}
                                 </Button>
                                 <Button 
                                   disabled={updatingId === booking.id}
                                   variant="outline"
                                   onClick={() => handleUpdateStatus(booking.id, 'CANCELLED')}
                                   className="w-full h-14 border-slate-100 hover:border-red-500 hover:text-red-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all"
                                 >
                                    <X size={16} className="mr-2" strokeWidth={3} /> Reject Request
                                 </Button>
                              </div>
                           )}

                           {booking.status === 'PENDING' && !isExpired && isWaitingForClientQuote && (
                              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Quote Sent</p>
                                 <p className="text-[10px] font-bold text-slate-800">Waiting for client to pay deposit</p>
                              </div>
                           )}

                           {booking.status === 'CONFIRMED' && (
                              <Button 
                                disabled={updatingId === booking.id}
                                onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                                className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-2xl"
                              >
                                 {updatingId === booking.id ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle size={18} className="mr-2" /> Finish Session</>}
                              </Button>
                           )}

                           {isExpired && (
                              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center">
                                 <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Timed Out</p>
                                 <p className="text-[10px] font-medium text-red-400">Request expired before confirmation</p>
                              </div>
                           )}
                           
                           {booking.paymentStatus === 'PARTIALLY_PAID' && (
                              <div className="pt-2">
                                <Button 
                                  disabled={updatingId === booking.id}
                                  onClick={() => handleRequestBalance(booking.id)}
                                  className="w-full h-12 bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                  {updatingId === booking.id ? <Loader2 className="animate-spin" size={16} /> : <><Wallet size={16} className="mr-2" /> Request Balance</>}
                                </Button>
                              </div>
                           )}

                           <div className="pt-6 text-center border-t border-slate-50">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Fee Accrual</p>
                              <div className="flex items-center justify-center gap-1">
                                 {booking.isQuoteBased && booking.quoteStatus === 'REQUESTED' ? (
                                   <p className="text-xl font-black text-slate-400 tracking-tighter italic">Pending Quote</p>
                                 ) : (
                                   <p className="text-3xl font-black text-slate-900 tracking-tighter">GHS {booking.totalPrice?.toFixed(2) || '0.00'}</p>
                                 )}
                                 {booking.paymentMethod === 'IN_PERSON' && <Coins size={14} className="text-blue-500" />}
                              </div>
                              {booking.depositAmount && booking.totalPrice && (
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">
                                  {((booking.depositAmount / booking.totalPrice) * 100).toFixed(0)}% Deposit Setup
                                </p>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
           <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border-4 border-white shadow-inner">
              <Calendar size={64} strokeWidth={1} />
           </div>
           <div className="text-center space-y-4">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Quiet Stream</h3>
              <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto italic font-serif leading-relaxed">Your professional pipeline is currently waiting for the next curation. Take this time to refine your craft.</p>
           </div>
        </div>
      )}
    </div>
  );
}
