'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  Calendar, Clock, MapPin, Check, X, 
  Loader2, AlertCircle, 
  User, CheckCircle, Smartphone, Mail,
  CalendarCheck, Hourglass,
  BadgeCheck, Coins, Ruler, Activity
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
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
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
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

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

  // const handleRequestBalance = async (id: string) => {
  //   setUpdatingId(id);
  //   try {
  //     const res = await fetch(`/api/bookings/${id}/invoice`, {
  //       method: 'POST',
  //     });
  //
  //     if (!res.ok) {
  //       const error = await res.json();
  //       throw new Error(error.error || 'Invoice generation failed');
  //     }
  //
  //     await res.json();
  //     toast.success('Final Balance invoice sent to customer!');
  //     // Refresh to update UI if needed
  //     await fetchBookings();
  //   } catch (err: unknown) {
  //     const errorMessage = err instanceof Error ? err.message : 'Failed to request balance';
  //     toast.error(errorMessage);
  //   } finally {
  //     setUpdatingId(null);
  //   }
  // };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'CONFIRMED': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'IN_PROGRESS': return 'bg-violet-50 text-violet-600 border-violet-100';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'CANCELLED': return 'bg-red-50 text-red-600 border-red-100';
      case 'NO_SHOW': return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'ALL') return true;
    return b.status === activeTab;
  });

  const stats = {
    pending: bookings.filter(b => b.status === 'PENDING').length,
    upcoming: bookings.filter(b => b.status === 'CONFIRMED').length,
    active: bookings.filter(b => b.status === 'IN_PROGRESS').length,
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
    <div className="space-y-4 sm:space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-violet-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Appointments &amp; Bookings</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Booking Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage requested sessions, appointments, and client fittings.</p>
        </div>
        <div className="flex items-center gap-3 px-3.5 py-2 bg-slate-50/80 rounded-xl border border-slate-200/80">
          <CalendarCheck className="text-violet-600 shrink-0" size={20} strokeWidth={2.5} />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Next Session</p>
            <p className="text-sm sm:text-base font-bold text-slate-900 leading-tight">{stats.upcoming} Upcoming</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl w-fit">
        {[
          { id: 'ALL', label: 'All', count: bookings.length },
          { id: 'PENDING', label: 'Requests', count: stats.pending },
          { id: 'CONFIRMED', label: 'Upcoming', count: stats.upcoming },
          { id: 'IN_PROGRESS', label: 'Ongoing', count: stats.active },
          { id: 'COMPLETED', label: 'Completed', count: bookings.filter(b => b.status === 'COMPLETED').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'ALL' | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              activeTab === tab.id 
                ? "bg-white text-slate-900 shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            {tab.label}
            {tab.count > 0 && <span className="ml-1.5 opacity-60 text-[11px]">({tab.count})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white rounded-xl border border-slate-200/80">
          <Loader2 className="animate-spin text-slate-300" size={28} />
          <p className="text-xs font-semibold text-slate-400">Loading appointments...</p>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {filteredBookings.map((booking) => {
              const timelineSteps = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];
              const currentStepIdx = timelineSteps.indexOf(booking.status);
              
              const isExpired = booking.status === 'PENDING' && booking.requestExpiresAt && !isAfter(new Date(booking.requestExpiresAt), new Date());
              const isPaid = booking.paymentStatus === 'PAID';

              return (
                <motion.div
                  layout
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-violet-200 transition-all p-4 sm:p-5",
                    isExpired && "opacity-60 grayscale bg-slate-50/50"
                  )}
                >
                  <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 items-start">
                    {/* Left: Customer Info */}
                    <div className="w-full lg:w-56 shrink-0 p-3 sm:p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                          <User size={18} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 leading-tight truncate">{booking.customer.firstName} {booking.customer.lastName}</p>
                          <Badge variant="outline" className={cn("mt-1 px-2 py-0.2 text-[9px] font-bold rounded-md", getStatusColor(booking.status))}>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1.5 pt-2 border-t border-slate-200/70 text-xs">
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 truncate">
                          <Mail size={12} className="text-slate-400 shrink-0" /> <span className="truncate">{booking.customer.email}</span>
                        </div>
                        {booking.customer.phone && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-600">
                            <Smartphone size={12} className="text-slate-400 shrink-0" /> {booking.customer.phone}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Center: Service & Details */}
                    <div className="flex-1 min-w-0 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex gap-3 items-center">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                            <Image 
                              src={booking.service.imageUrl || "https://img.freepik.com/free-photo/tailor-measuring-man_23-2148412497.jpg"} 
                              alt={booking.service.name} 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate leading-snug">{booking.service.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-400">Ref: #{booking.id.slice(-6).toUpperCase()}</span>
                              {isPaid && (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-md flex items-center gap-1 px-1.5 py-0 text-[10px] font-semibold">
                                  <BadgeCheck size={11} /> Paid
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {booking.status === 'PENDING' && (
                          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center gap-2 text-xs self-start sm:self-auto">
                            <Hourglass className={cn("text-amber-500 shrink-0", !isExpired && "animate-pulse")} size={14} />
                            <div>
                              <span className={cn("text-[11px] font-bold", isExpired ? "text-red-600" : "text-amber-800")}>
                                {getExpiryLabel(booking.requestExpiresAt)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fulfillment Map */}
                      <div className="relative px-3 py-4 bg-slate-50/70 rounded-xl border border-slate-100 overflow-hidden">
                        <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-slate-200 -translate-y-1/2" />
                        {currentStepIdx >= 0 && (
                          <div 
                            className="absolute top-1/2 left-6 h-0.5 bg-violet-600 -translate-y-1/2 transition-all duration-700"
                            style={{ width: `calc(${(currentStepIdx / (timelineSteps.length - 1)) * 100}% - 12px)`, maxWidth: 'calc(100% - 48px)' }}
                          />
                        )}
                        <div className="flex justify-between items-center relative z-10">
                          {timelineSteps.map((step, idx) => {
                            const isDone = idx <= currentStepIdx;
                            const isCurrent = idx === currentStepIdx;
                            const label = step.replace('_', ' ');
                            return (
                              <div key={step} className="flex flex-col items-center gap-1.5">
                                <div className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all",
                                  isDone ? "bg-slate-900 border-slate-900 text-white shadow-xs" : "bg-white border-slate-200 text-slate-300",
                                  isCurrent && "ring-4 ring-slate-900/10"
                                )}>
                                  {isDone ? <Check size={11} strokeWidth={3} /> : <div className="w-1 h-1 rounded-full bg-current" />}
                                </div>
                                <span className={cn(
                                  "text-[9px] font-semibold uppercase tracking-wider",
                                  isDone ? "text-slate-900" : "text-slate-400"
                                )}>{label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Appointment Info Pills */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50/50 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className="text-slate-500 shrink-0" />
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase font-semibold">Date</p>
                            <p className="font-semibold text-slate-800">{format(new Date(booking.bookingDate), 'MMM dd, yyyy')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-slate-500 shrink-0" />
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase font-semibold">Time</p>
                            <p className="font-semibold text-slate-800">{format(new Date(booking.bookingDate), 'hh:mm a')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-slate-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[9px] text-slate-400 uppercase font-semibold">Location</p>
                            <p className="font-semibold text-slate-800 truncate">{booking.location || 'In-Studio'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Notes & Measurements */}
                      {(booking.notes || booking.snapshotMeasurements) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {booking.notes && (
                            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <AlertCircle size={11} /> Special Request
                              </p>
                              <p className="text-slate-600 text-[11px] leading-relaxed italic">{booking.notes}</p>
                            </div>
                          )}
                          {booking.snapshotMeasurements && (
                            <div className="p-2.5 rounded-lg border border-blue-100 bg-blue-50/30 space-y-1.5">
                              <div className="flex justify-between items-center">
                                <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <Ruler size={11} /> Measurements ({String(booking.snapshotMeasurements?.unit || 'in')})
                                </p>
                              </div>
                              <div className="grid grid-cols-4 gap-1 text-center">
                                {[
                                  { label: 'Chest', key: 'bust' },
                                  { label: 'Waist', key: 'waist' },
                                  { label: 'Hips', key: 'hips' },
                                  { label: 'Height', key: 'height' },
                                ].map(m => booking.snapshotMeasurements?.[m.key] && (
                                  <div key={m.key} className="bg-white/80 rounded p-1 border border-blue-100/60">
                                    <p className="text-[8px] text-slate-400 uppercase">{m.label}</p>
                                    <p className="text-[11px] font-bold text-slate-800">{String(booking.snapshotMeasurements?.[m.key])}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions & Pricing */}
                    <div className="w-full lg:w-48 shrink-0 flex flex-col justify-between pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-4 space-y-3">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Service Fee</p>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <p className="text-base sm:text-lg font-bold text-slate-900">GH₵ {booking.totalPrice?.toFixed(2) || '0.00'}</p>
                          {booking.paymentMethod === 'IN_PERSON' && <Coins size={12} className="text-blue-500" />}
                        </div>
                        <Badge className={cn(
                          "mt-1 text-[9px] font-semibold rounded px-1.5 py-0 border",
                          booking.paymentStatus === 'PAID' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {booking.paymentStatus === 'PAID' ? 'Paid' : 'Pending Payment'}
                        </Badge>
                      </div>

                      {/* Status Actions */}
                      <div className="space-y-1.5">
                        {booking.status === 'PENDING' && !isExpired && !booking.isQuoteBased && (
                          <>
                            <Button 
                              disabled={updatingId === booking.id}
                              onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                              className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all"
                            >
                              {updatingId === booking.id ? <Loader2 className="animate-spin" size={13} /> : <><Check size={13} className="mr-1" strokeWidth={2.5} /> Accept</>}
                            </Button>
                            <Button 
                              disabled={updatingId === booking.id}
                              variant="outline"
                              onClick={() => handleUpdateStatus(booking.id, 'CANCELLED')}
                              className="w-full h-7 border-slate-200 hover:border-red-400 hover:text-red-600 rounded-lg text-xs font-medium"
                            >
                              <X size={12} className="mr-1" /> Decline
                            </Button>
                          </>
                        )}

                        {booking.status === 'CONFIRMED' && (
                          <>
                            <Button 
                              disabled={updatingId === booking.id}
                              onClick={() => handleUpdateStatus(booking.id, 'IN_PROGRESS')}
                              className="w-full h-8 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold"
                            >
                              {updatingId === booking.id ? <Loader2 className="animate-spin" size={13} /> : <><Activity size={13} className="mr-1" /> Start Session</>}
                            </Button>
                            <Button 
                              disabled={updatingId === booking.id}
                              variant="ghost"
                              onClick={() => handleUpdateStatus(booking.id, 'NO_SHOW')}
                              className="w-full h-7 text-slate-500 hover:text-red-600 text-xs"
                            >
                              Mark No Show
                            </Button>
                          </>
                        )}

                        {booking.status === 'IN_PROGRESS' && (
                          <Button 
                            disabled={updatingId === booking.id}
                            onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                            className="w-full h-8 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                          >
                            {updatingId === booking.id ? <Loader2 className="animate-spin" size={13} /> : <><CheckCircle size={13} className="mr-1" /> Complete</>}
                          </Button>
                        )}

                        {isExpired && (
                          <div className="bg-red-50 p-2 rounded-lg border border-red-100 text-center">
                            <p className="text-[10px] font-bold text-red-600">Expired</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-3"
        >
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
            <Calendar size={24} strokeWidth={1.5} />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold text-slate-900">No Appointments</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">No appointments found matching the current filter.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
