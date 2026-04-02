'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Calendar, Clock, MapPin, ChevronRight, 
  Loader2, CalendarX,
  CheckCircle2, Timer, XCircle,
  CreditCard, Wallet, ArrowRight
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
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  paymentMethod: 'PLATFORM' | 'IN_PERSON';
  paymentStatus: 'UNPAID' | 'PAID' | 'PENDING_IN_PERSON' | 'REFUNDED';
  bookingDate: string;
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
      case 'COMPLETED': return <CheckCircle2 size={14} />;
      case 'CANCELLED': return <XCircle size={14} />;
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

  const handlePayment = (booking: Booking) => {
    if (!booking.paystackAccessCode) {
      toast.error('Payment initialization missing. Please refresh or contact support.');
      return;
    }
    // Redirect to Paystack checkout
    window.location.href = `https://checkout.paystack.com/${booking.paystackAccessCode}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-serif font-black tracking-tight text-stone-900"
          >
            My Bookings
          </motion.h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">
            Professional Service History & Sessions
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as Booking['status'] | 'ALL')}
              className={cn(
                "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                filter === s 
                  ? "bg-stone-900 text-white border-stone-900" 
                  : "bg-white text-stone-400 border-stone-100 hover:border-stone-200"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-4 text-stone-300">
          <Loader2 className="animate-spin" size={40} strokeWidth={1} />
          <p className="text-[10px] uppercase font-black tracking-widest">Retrieving sessions...</p>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode='popLayout'>
            {filteredBookings.map((booking: Booking, idx: number) => {
              const needsPayment = booking.status === 'CONFIRMED' && booking.paymentMethod === 'PLATFORM' && booking.paymentStatus === 'UNPAID';
              const isPaid = booking.paymentStatus === 'PAID';
              const isInPerson = booking.paymentMethod === 'IN_PERSON';
              
              return (
                <motion.div
                  layout
                  key={booking.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "group relative bg-white rounded-[2.5rem] p-8 md:p-10 border transition-all duration-500",
                    needsPayment ? "border-amber-200 shadow-xl shadow-amber-50" : "border-stone-100 shadow-sm hover:shadow-2xl hover:shadow-stone-200/50"
                  )}
                >
                  <div className="flex flex-col lg:flex-row gap-10 items-start lg:items-center">
                    {/* Service Image */}
                    <div className="relative w-40 h-40 md:w-32 md:h-32 rounded-[2rem] overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500">
                      <Image
                        src={booking.service.imageUrl || "https://img.freepik.com/free-photo/fashion-designer-working-suit_23-2148842426.jpg"}
                        alt={booking.service.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1 space-y-6">
                      <div className="flex flex-wrap items-center gap-4">
                        <Badge variant="outline" className={cn("px-4 py-1.5 rounded-full border flex items-center gap-2", getStatusColor(booking.status))}>
                          {getStatusIcon(booking.status)}
                          <span className="text-[10px] font-black tracking-widest">{booking.status}</span>
                        </Badge>
                        
                        {isPaid && (
                          <Badge className="bg-emerald-500 text-white border-none px-4 py-1.5 rounded-full flex items-center gap-2">
                            <CreditCard size={12} />
                            <span className="text-[10px] font-black tracking-widest uppercase">Secured</span>
                          </Badge>
                        )}

                        {isInPerson && booking.status === 'CONFIRMED' && booking.paymentStatus !== 'PAID' && (
                          <Badge className="bg-stone-100 text-stone-600 border-none px-4 py-1.5 rounded-full flex items-center gap-2">
                            <Wallet size={12} />
                            <span className="text-[10px] font-black tracking-widest uppercase">Pay in Person</span>
                          </Badge>
                        )}

                        <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">
                          {booking.service.category.name}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-2xl md:text-3xl font-serif font-black text-stone-900 group-hover:italic transition-all">
                          {booking.service.name}
                        </h3>
                        <p className="text-sm font-medium text-stone-500 italic">
                          with {booking.professional.professionalProfile?.businessName || `${booking.professional.firstName} ${booking.professional.lastName}`}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-10 pt-2 border-t border-stone-50 md:border-none">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest flex items-center gap-2">
                             <Calendar size={12} className="text-stone-900" /> Appointment
                          </p>
                          <p className="text-sm font-black text-stone-900 uppercase tracking-widest">
                            {format(new Date(booking.bookingDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest flex items-center gap-2">
                             <Clock size={12} className="text-stone-900" /> Time Window
                          </p>
                          <p className="text-sm font-black text-stone-900 uppercase tracking-widest">
                            {format(new Date(booking.bookingDate), "hh:mm a")}
                          </p>
                        </div>
                        {booking.location && (
                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={12} className="text-stone-900" /> Location
                             </p>
                             <p className="text-sm font-black text-stone-900 uppercase tracking-widest truncate max-w-[200px]">
                               {booking.location}
                             </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="lg:text-right space-y-6 w-full lg:w-auto">
                      <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Fee</p>
                        <p className="text-4xl font-black tracking-tighter text-stone-900">GHS {booking.totalPrice.toFixed(2)}</p>
                      </div>
                      
                      {needsPayment ? (
                        <div className="space-y-3">
                           <Button 
                             onClick={() => handlePayment(booking)}
                             className="w-full lg:w-auto h-16 px-12 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-amber-200"
                           >
                              Secure Appointment <ArrowRight size={14} className="ml-2" />
                           </Button>
                           <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest text-center">Awaiting payment to lock slot</p>
                        </div>
                      ) : (
                         <Link href={`/tz/${booking.professional.firstName.toLowerCase()}`}>
                            <Button 
                              variant="outline" 
                              className="h-14 px-10 rounded-full border-stone-100 hover:border-stone-900 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              {booking.status === 'COMPLETED' ? 'Book Again' : 'View Profile'} <ChevronRight size={14} className="ml-2" />
                            </Button>
                         </Link>
                      )}
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
          className="flex flex-col items-center justify-center py-40 space-y-10 text-center"
        >
          <div className="w-32 h-32 bg-stone-100 rounded-full flex items-center justify-center text-stone-300">
            <CalendarX size={64} strokeWidth={1} />
          </div>
          <div className="space-y-4">
            <h3 className="text-4xl font-serif font-black text-stone-900">No Professional Sessions Found</h3>
            <p className="text-stone-400 max-w-sm mx-auto uppercase text-[10px] font-black tracking-widest leading-loose">
               Experience the boutique life. Book your first professional service to begin your curation.
            </p>
          </div>
          <Link href="/professionals">
             <Button className="h-20 px-16 bg-stone-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:bg-stone-800 transition-all shadow-2xl">
                Explore Professionals
             </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}


