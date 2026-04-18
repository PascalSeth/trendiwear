'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Calendar, MapPin, ChevronRight, 
  Loader2, CalendarX,
  CheckCircle2, Timer, XCircle,
  ArrowRight,
  Check, Info,
  History, Clock3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Booking {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  paymentMethod: 'PLATFORM' | 'IN_PERSON';
  paymentStatus: 'UNPAID' | 'PAID' | 'PENDING_IN_PERSON' | 'REFUNDED';
  bookingDate: string;
  createdAt: string;
  totalPrice: number;
  location?: string;
  notes?: string;
  paystackAccessCode?: string;
  requestExpiresAt?: string;
  service: {
    name: string;
    imageUrl?: string;
    category: { name: string };
  };
  professional: {
    firstName: string;
    lastName: string;
    professionalProfile?: { businessName: string };
  };
}

export function BookingsClient() {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');

  const { data, isLoading } = useSWR(
    '/api/bookings',
    fetcher,
    { refreshInterval: 15000 }
  );

  const bookings = data?.bookings || [];

  useEffect(() => {
    // Check if returned from successful payment
    const reference = searchParams.get('reference');
    if (reference) {
      toast.success('Payment successful! Your appointment is secured.');
    }
  }, [searchParams]);

  const filteredBookings = (bookings as Booking[]).filter((b: Booking) => 
    filter === 'ALL' ? true : b.status === filter
  );

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'PENDING': return <Timer size={14} />;
      case 'CONFIRMED': return <CheckCircle2 size={14} />;
      case 'IN_PROGRESS': return <Clock3 size={14} className="animate-pulse" />;
      case 'COMPLETED': return <CheckCircle2 size={14} />;
      case 'CANCELLED': return <XCircle size={14} />;
      case 'NO_SHOW': return <XCircle size={14} />;
    }
  };

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

  const handlePayment = (booking: Booking) => {
    if (!booking.paystackAccessCode) {
      toast.error('Payment initialization missing. Please refresh or contact support.');
      return;
    }
    // Redirect to Paystack checkout
    window.location.href = `https://checkout.paystack.com/${booking.paystackAccessCode}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pt-12 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-stone-100 pb-12">
        <div className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-9xl font-serif italic font-medium tracking-tighter text-stone-900 leading-[0.8]"
          >
            Sessions.
          </motion.h1>
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">
               Archive — 2026
            </p>
            <span className="h-1 w-1 rounded-full bg-stone-200"></span>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">
               {bookings.length} Registered
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 p-1 bg-stone-50 rounded-full border border-stone-100 shadow-inner">
          {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as 'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED')}
              className={cn(
                "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                filter === s 
                  ? "bg-white text-stone-900 shadow-sm border border-stone-200" 
                  : "text-stone-400 hover:text-stone-600"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-4 text-stone-300 font-serif italic">
          <Loader2 className="animate-spin" size={40} strokeWidth={1} />
          <p className="text-sm tracking-widest">Retrieving sessions...</p>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="grid grid-cols-1 gap-12">
          <AnimatePresence mode='popLayout'>
            {filteredBookings.map((booking: Booking, idx: number) => {
              const needsPayment = booking.status === 'CONFIRMED' && booking.paymentMethod === 'PLATFORM' && booking.paymentStatus === 'UNPAID';
              
              const timelineSteps = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];
              const currentStepIdx = timelineSteps.indexOf(booking.status);

              return (
                <motion.div
                  layout
                  key={booking.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  className={cn(
                    "group relative bg-white rounded-[40px] border overflow-hidden transition-all duration-700 hover:shadow-2xl hover:shadow-stone-200/50",
                    needsPayment ? "border-amber-200" : "border-stone-100"
                  )}
                >
                  <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-stone-100">
                    <div className="flex-1 p-8 md:p-12 lg:p-16 space-y-12">
                      <div className="flex justify-between items-start">
                         <div className="space-y-4">
                            <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.4em]">Reference Trace</span>
                            <h3 className="text-2xl font-mono text-stone-950">#{booking.id.slice(-8).toUpperCase()}</h3>
                         </div>
                         <Badge variant="outline" className={cn("px-5 py-2 rounded-full border flex items-center gap-2", getStatusColor(booking.status))}>
                            {getStatusIcon(booking.status)}
                            <span className="text-[10px] font-black tracking-widest uppercase">{booking.status}</span>
                         </Badge>
                      </div>

                      <div className="flex flex-col md:flex-row gap-12 items-start">
                        <div className="relative w-40 h-52 md:w-32 md:h-40 rounded-[30px] overflow-hidden shrink-0 shadow-2xl group-hover:scale-[1.02] transition-transform duration-700 border-4 border-white">
                          <Image
                            src={booking.service.imageUrl || "https://img.freepik.com/free-photo/fashion-designer-working-suit_23-2148842426.jpg"}
                            alt={booking.service.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 space-y-8">
                          <div className="space-y-2">
                             <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">Curation By</p>
                             <h4 className="text-4xl font-serif italic text-stone-900 leading-none">
                                {booking.professional.professionalProfile?.businessName || `${booking.professional.firstName} ${booking.professional.lastName}`}
                             </h4>
                             <p className="text-xl font-medium text-stone-400 font-serif leading-none mt-2">{booking.service.name}</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 pt-10 border-t border-stone-50">
                            <div className="space-y-4">
                               <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest flex items-center gap-2">
                                  <Calendar size={12} className="text-stone-900" /> Session Date
                               </p>
                               <div className="flex items-center gap-4">
                                  <div className="p-3 bg-stone-50 rounded-2xl">
                                     <ArrowRight size={14} className="text-stone-400" />
                                  </div>
                                  <p className="text-sm font-black text-stone-950 uppercase">
                                     {format(new Date(booking.bookingDate), "MMM dd, yyyy")} @ {format(new Date(booking.bookingDate), "hh:mm a")}
                                  </p>
                               </div>
                            </div>
                            <div className="space-y-4">
                               <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest flex items-center gap-2">
                                  <MapPin size={12} className="text-stone-900" /> Destination
                               </p>
                               <div className="flex items-center gap-4">
                                  <div className="p-3 bg-stone-50 rounded-2xl">
                                     <MapPin size={14} className="text-stone-400" />
                                  </div>
                                  <p className="text-sm font-black text-stone-950 uppercase truncate max-w-[200px]">
                                     {booking.location || 'Professional Studio'}
                                  </p>
                               </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress tracker */}
                      <div className="pt-12 border-t border-stone-50">
                        <div className="relative h-1 bg-stone-100 rounded-full mb-8">
                           {currentStepIdx >= 0 && (
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${(currentStepIdx / (timelineSteps.length - 1)) * 100}%` }}
                               transition={{ duration: 1.5, ease: "circOut" }}
                               className="absolute h-full bg-stone-900 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.2)]"
                             />
                           )}
                           <div className="flex justify-between absolute -top-2.5 left-0 right-0">
                              {timelineSteps.map((step, i) => (
                                <div key={step} className="flex flex-col items-center gap-4">
                                   <div className={cn(
                                     "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-700",
                                     i <= currentStepIdx ? "bg-stone-900 border-stone-900 text-white shadow-lg" : "bg-white border-stone-200"
                                   )}>
                                      {i <= currentStepIdx ? <Check size={10} strokeWidth={4} /> : null}
                                   </div>
                                   <span className={cn(
                                     "text-[8px] font-black uppercase tracking-widest block",
                                     i <= currentStepIdx ? "text-stone-900" : "text-stone-300"
                                   )}>{step.replace('_', ' ')}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline / Action Sidebar */}
                    <div className="lg:w-96 bg-stone-50/50 p-8 lg:p-12 space-y-12 flex flex-col justify-between relative overflow-hidden group-hover:bg-stone-50 transition-colors duration-700">
                       <div className="relative z-10 space-y-10">
                          <div className="flex items-center gap-4">
                             <div className="p-4 bg-white rounded-[20px] shadow-sm border border-stone-100">
                                <History size={20} className="text-stone-400" />
                             </div>
                             <div>
                                <h4 className="text-xl font-serif italic text-stone-900">Timeline Log</h4>
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Status Evolution</p>
                             </div>
                          </div>

                          <div className="space-y-6">
                             {/* Dynamic Prompts based on status */}
                             <div className="p-6 bg-white rounded-[25px] border border-stone-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-2">
                                   <Info size={14} className="text-stone-400" />
                                   <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Active Insight</span>
                                </div>
                                
                                {booking.status === 'PENDING' && (
                                  <p className="text-xs text-stone-600 font-serif italic leading-relaxed">
                                     The professional is currently reviewing your session request. You will be notified immediately upon approval.
                                  </p>
                                )}
                                {booking.status === 'CONFIRMED' && booking.paymentStatus === 'UNPAID' && (
                                  <p className="text-xs text-stone-600 font-serif italic leading-relaxed text-amber-600 font-bold">
                                     Action Required: Please complete the platform settlement to secure your selected time slot.
                                  </p>
                                )}
                                {booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID' && (
                                  <p className="text-xs text-stone-600 font-serif italic leading-relaxed">
                                     Session Secured. Please ensure you are at the designated location at least 10 minutes before the session starts.
                                  </p>
                                )}
                                {booking.status === 'IN_PROGRESS' && (
                                  <p className="text-xs text-stone-600 font-serif italic leading-relaxed text-violet-600 font-bold">
                                     The session is currently in progress. Your professional is curating your bespoke experience.
                                  </p>
                                )}
                                {booking.status === 'COMPLETED' && (
                                  <p className="text-xs text-stone-600 font-serif italic leading-relaxed">
                                     Session Finished. We hope you enjoyed your bespoke experience. Don&apos;t forget to leave a review!
                                  </p>
                                )}
                             </div>

                             <div className="text-[10px] font-bold text-stone-400 font-serif italic pl-2 border-l border-stone-200">
                                Booking initialized on {format(new Date(booking.createdAt || Date.now()), "MMMM dd")}
                             </div>
                          </div>

                          <div>
                             <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Total Fee</p>
                             <p className="text-5xl font-black tracking-tighter text-stone-900">GHS {booking.totalPrice.toFixed(2)}</p>
                          </div>
                       </div>

                       <div className="relative z-10 pt-10 border-t border-stone-100">
                          {needsPayment ? (
                             <Button 
                               onClick={() => handlePayment(booking)}
                               className="w-full h-20 bg-stone-950 hover:bg-black text-white rounded-[25px] text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl flex flex-col items-center justify-center gap-1"
                             >
                                <span>Proceed to Pay</span>
                                <span className="opacity-50 text-[8px]">Secure via Paystack</span>
                             </Button>
                          ) : (
                             <Link href={`/tz/${booking.professional.firstName.toLowerCase()}`}>
                                <Button 
                                  variant="outline" 
                                  className="w-full h-16 rounded-[25px] border-stone-200 hover:border-stone-900 text-[10px] font-black uppercase tracking-widest transition-all bg-white"
                                >
                                  {booking.status === 'COMPLETED' ? 'Book Again' : 'View Profile'} <ChevronRight size={14} className="ml-2" />
                                </Button>
                             </Link>
                          )}
                       </div>

                       <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-1000">
                          <History size={300} strokeWidth={0.5} />
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
          className="flex flex-col items-center justify-center py-40 space-y-12 text-center"
        >
          <div className="w-40 h-40 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 border-stone-100 border">
            <CalendarX size={80} strokeWidth={0.5} />
          </div>
          <div className="space-y-6">
            <h3 className="text-5xl md:text-7xl font-serif italic text-stone-900 leading-[0.8] tracking-tighter">No Sessions.</h3>
            <p className="text-stone-400 max-w-sm mx-auto uppercase text-[10px] font-black tracking-[0.4em] leading-relaxed">
               Your professional journal is currently empty.
            </p>
          </div>
          <Link href="/professionals">
             <Button className="h-20 px-16 bg-stone-950 text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:bg-black transition-all shadow-2xl">
                Find Professionals
             </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
