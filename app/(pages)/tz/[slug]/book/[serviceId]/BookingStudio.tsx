'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Clock, AlertCircle, Loader2, Check, Gem, Sun,
  ArrowRight, Calendar as CalendarIcon,
  ChevronLeft, Camera, CreditCard, Wallet, Hourglass, X,
  Info, ChevronRight
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { TransformedService } from '@/lib/services';
import { addDays, format } from 'date-fns';

interface BookingStudioProps {
  service: TransformedService;
  professional: {
    userId: string;
    businessName?: string;
    businessImage?: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  slug: string;
}

type BookingStep = 'customize' | 'schedule' | 'confirm' | 'success';

export const BookingStudio: React.FC<BookingStudioProps> = ({
  service,
  professional,
  slug,
}) => {
  const router = useRouter();
  const [step, setStep] = useState<BookingStep>('customize');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  const [requirementAnswers, setRequirementAnswers] = useState<Record<string, string>>({});
  
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [formData, setFormData] = useState({
    bookingDate: '',
    bookingTime: '',
    location: '',
    notes: '',
    paymentMethod: 'PLATFORM' as 'PLATFORM' | 'IN_PERSON',
  });

  const [inspirationUrls, setInspirationUrls] = useState<string[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');

  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [measurementUnit, setMeasurementUnit] = useState<'in' | 'cm'>('in');
  const [measurementStep, setMeasurementStep] = useState(1);
  const [measurementData, setMeasurementData] = useState({
    // Core
    bust: '',
    waist: '',
    hips: '',
    height: '',
    weight: '',
    // Upper
    neck: '',
    shoulder: '',
    armLength: '',
    bicep: '',
    wrist: '',
    underbust: '',
    hpsToWaist: '',
    napeToWaist: '',
    // Lower
    inseam: '',
    thigh: '',
    knee: '',
    ankle: '',
    crotchRise: ''
  });
  const [savingMeasurements, setSavingMeasurements] = useState(false);

  const convertValue = (val: string, toUnit: 'in' | 'cm') => {
    if (!val) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    if (toUnit === 'cm') return (num * 2.54).toFixed(1);
    return (num / 2.54).toFixed(1);
  };

  const toggleUnit = () => {
    const nextUnit = measurementUnit === 'in' ? 'cm' : 'in';
    const newData = { ...measurementData };
    
    // Length conversion
    const lengthKeys = [
      'bust', 'waist', 'hips', 'shoulder', 'armLength', 'inseam', 'height',
      'neck', 'underbust', 'hpsToWaist', 'napeToWaist', 'bicep', 'wrist',
      'thigh', 'knee', 'ankle', 'crotchRise'
    ];
    lengthKeys.forEach((key) => {
      const k = key as keyof typeof measurementData;
      if (newData[k]) {
        newData[k] = convertValue(newData[k], nextUnit);
      }
    });

    // Weight conversion (lbs <-> kg)
    if (newData.weight) {
      const w = parseFloat(newData.weight);
      if (!isNaN(w)) {
        newData.weight = nextUnit === 'in' 
          ? (w * 2.20462).toFixed(1)   // to lbs
          : (w / 2.20462).toFixed(1);  // to kg
      }
    }

    setMeasurementData(newData);
    setMeasurementUnit(nextUnit);
  };

  const isQuoteBased = service.price === 0;

  // Fetch Slots
  useEffect(() => {
    if (!formData.bookingDate) return;
    
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setError('');
      try {
        const res = await fetch(`/api/services/${service.professionalServiceId}/slots?date=${formData.bookingDate}&professionalId=${professional.userId}`);
        const data = await res.json();
        if (data.slots) {
          setAvailableSlots(data.slots);
        } else {
          setAvailableSlots([]);
        }
      } catch {
        setError('Failed to load available slots');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [formData.bookingDate, service.professionalServiceId, professional.userId]);

  const selectedAddons = (service.addons || []).filter(a => selectedAddonIds.has(a.id));
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const totalPrice = service.price + addonsTotal;
  const effectiveDuration = service.durationOverride ?? service.duration;

  const toggleAddon = (id: string) => {
    const next = new Set(selectedAddonIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAddonIds(next);
  };

  const updateAnswer = (id: string, value: string) => {
    setRequirementAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleNextStep = () => {
    if (step === 'customize') {
      const missing = (service.customRequirements || []).find(r => r.isRequired && !requirementAnswers[r.id]);
      if (missing) {
        setError(`Required: ${missing.question}`);
        return;
      }
      setError('');
      setStep('schedule');
    } else if (step === 'schedule') {
      if (!formData.bookingDate || !formData.bookingTime) {
        setError('Please select date and time');
        return;
      }
      if (service.isHomeService && !formData.location) {
        setError('Location is required for home services');
        return;
      }
      setError('');
      setStep('confirm');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const bookingDateTime = new Date(`${formData.bookingDate}T${formData.bookingTime}`);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.professionalServiceId,
          professionalId: professional.userId,
          bookingDate: bookingDateTime.toISOString(),
          location: formData.location || null,
          notes: formData.notes || null,
          selectedAddonIds: Array.from(selectedAddonIds),
          requirementAnswers,
          paymentMethod: formData.paymentMethod,
          isQuoteBased,
          inspirationImages: inspirationUrls,
          requiresMeasurements: service.customRequirements?.some(r => r.isRequired) || true // Pass flag
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 'MEASUREMENTS_REQUIRED') {
           setShowMeasurementModal(true);
           setLoading(false);
           return;
        }
        throw new Error(errorData.error || 'Failed to create booking');
      }

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      if (!showMeasurementModal) {
         setLoading(false);
      }
    }
  };

  const handleSaveMeasurements = async () => {
     setSavingMeasurements(true);
     try {
        // Convert all values to numbers for the API
        const payload: Record<string, number | string> = { unit: measurementUnit };
        Object.entries(measurementData).forEach(([key, val]) => {
           if (val) payload[key] = parseFloat(val);
        });

        const res = await fetch('/api/measurements', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to save measurements');
        setShowMeasurementModal(false);
        handleSubmit(); // Re-trigger booking
     } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to save measurements');
     } finally {
        setSavingMeasurements(false);
     }
  };

  // Enforce No same-day bookings
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const mainImage = service.images?.[0]?.url || service.imageUrl;

  return (
    <div className="relative min-h-screen bg-stone-50 font-sans selection:bg-stone-900 selection:text-white">
      
      {/* 1. HERO SECTION: Massive, immersive service impact */}
      <section className="relative w-full h-[60vh] overflow-hidden">
        {mainImage ? (
           <motion.div 
             initial={{ scale: 1.1 }}
             animate={{ scale: 1 }}
             transition={{ duration: 1.5, ease: "easeOut" }}
             className="relative w-full h-full"
           >
             <Image 
               src={mainImage} 
               alt={service.name} 
               fill 
               className="object-cover" 
               priority
             />
             <div className="absolute inset-0 bg-stone-900/10 transition-colors duration-700" />
             <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-stone-50/20 to-transparent" />
           </motion.div>
        ) : (
           <div className="w-full h-full bg-stone-100 flex items-center justify-center">
              <Camera size={64} className="text-stone-200" />
           </div>
        )}

        <div className="absolute bottom-0 left-0 w-full p-8 md:p-24 z-10">
           <div className="max-w-7xl mx-auto space-y-6">
              <Link href={`/tz/${slug}`} className="inline-flex items-center gap-3 px-6 py-2 bg-white/80 backdrop-blur-xl rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 hover:text-stone-900 transition-all shadow-xl shadow-stone-900/5 group border border-white/50">
                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Return to Profile
              </Link>
              
              <div className="space-y-2">
                 <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-8xl lg:text-9xl font-serif font-black tracking-tight text-stone-900"
                 >
                   {service.name}
                 </motion.h1>
                 <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 pl-2"
                 >
                    <span className="flex items-center gap-2 text-stone-900 italic font-medium tracking-normal text-sm">by {professional.businessName || professional.user.firstName}</span>
                    <div className="h-px w-12 bg-stone-200" />
                    <span>Selected Booking</span>
                 </motion.div>
              </div>
           </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT: Natural editorial flow */}
      <main className="max-w-7xl mx-auto px-8 md:px-24 py-20 pb-40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
          
          {/* Left: Service Essence */}
          <div className="lg:col-span-12 xl:col-span-6 space-y-16">
             <div className="space-y-12">
                <div className="prose prose-stone">
                   <p className="text-2xl font-serif text-stone-500 leading-relaxed max-w-2xl italic">
                      {service.description || "Every professional session is meticulously crafted to ensure a bespoke experience that reflects your unique style and vision."}
                   </p>
                </div>

                <div className="flex gap-12">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Duration</p>
                      <p className="text-sm font-black text-stone-900 uppercase tracking-widest">{effectiveDuration} Minutes</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Service Location</p>
                      <p className="text-sm font-black text-stone-900 uppercase tracking-widest">
                        {service.isHomeService ? "Flexible / On-Site" : "Professional Workspace"}
                      </p>
                   </div>
                </div>
             </div>

             {service.images && service.images.length > 0 && (
                <div className="grid grid-cols-2 gap-4 pt-10">
                   {service.images.slice(0, 4).map((img, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className={cn(
                          "relative rounded-[2rem] overflow-hidden border-2 border-white shadow-2xl shadow-stone-200/50",
                          i === 0 ? "h-96 md:h-[500px] col-span-2" : "h-64 md:h-80"
                        )}
                      >
                         <Image src={img.url} alt={`Gallery ${i}`} fill className="object-cover hover:scale-105 transition-transform duration-700" />
                      </motion.div>
                   ))}
                </div>
             )}
          </div>

          {/* Right: The Studio Configuration Pod */}
          <div className="lg:col-span-12 xl:col-span-6">
             <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-12 lg:p-20 shadow-[0_48px_140px_-20px_rgba(0,0,0,0.06)] border border-stone-100 flex flex-col min-h-[600px] md:min-h-[700px]">
                
                {/* Internal Stepper */}
                <div className="flex items-center justify-between mb-16">
                   <div className="space-y-1">
                      <p className="text-[8px] font-black text-stone-300 uppercase tracking-[0.3em]">Phase {step === 'customize' ? '01' : step === 'schedule' ? '02' : '03'}</p>
                      <p className="text-xs font-black text-stone-900 uppercase tracking-widest">{step.toUpperCase()}</p>
                   </div>
                   <div className="flex gap-2">
                      {['customize', 'schedule', 'confirm'].map(s => (
                         <div key={s} className={cn("h-1 rounded-full transition-all duration-700", step === s ? "w-8 bg-stone-900" : "w-2 bg-stone-100")} />
                      ))}
                   </div>
                </div>

                <AnimatePresence mode="wait">
                  {step === 'customize' && (
                    <motion.div key="customize" className="space-y-16" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                       <div className="space-y-8">
                          <h3 className="text-4xl font-serif font-black text-stone-900 tracking-tight">Curation & Upgrades</h3>
                          
                          {service.addons && service.addons.length > 0 && (
                            <div className="grid grid-cols-1 gap-4">
                               {service.addons.map(addon => (
                                 <button
                                   key={addon.id}
                                   onClick={() => toggleAddon(addon.id)}
                                   className={cn(
                                     "p-8 rounded-[3rem] border-2 text-left transition-all duration-500 flex items-center justify-between group",
                                     selectedAddonIds.has(addon.id) ? "border-stone-900 bg-stone-50" : "border-stone-50 hover:border-stone-100"
                                   )}
                                 >
                                    <div className="flex items-center gap-6">
                                       <div className={cn("p-4 rounded-3xl transition-colors", selectedAddonIds.has(addon.id) ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-300")}>
                                          <Gem size={20} />
                                       </div>
                                       <div>
                                          <p className="text-xs font-black uppercase tracking-widest text-stone-900">{addon.name}</p>
                                          <p className="text-[10px] text-stone-400 uppercase mt-1">Immersive Expansion</p>
                                       </div>
                                    </div>
                                    <p className="text-sm font-black text-stone-900 leading-none">GHS {addon.price.toFixed(2)}</p>
                                 </button>
                               ))}
                            </div>
                          )}

                          {service.customRequirements && service.customRequirements.length > 0 && (
                             <div className="space-y-12 pt-10">
                                {service.customRequirements.map(req => (
                                  <div key={req.id} className="space-y-4">
                                     <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest pl-2">
                                        {req.question} {req.isRequired && <span className="text-stone-900">*</span>}
                                     </label>
                                     {req.type === 'TEXT' && (
                                        <Textarea placeholder="Share your specific vision..." value={requirementAnswers[req.id] || ''} onChange={e => updateAnswer(req.id, e.target.value)} className="rounded-[2.5rem] border-stone-50 bg-stone-50/50 focus:bg-white transition-all text-sm h-32 px-8 py-6 shadow-inner" />
                                     )}
                                     {req.type === 'YES_NO' && (
                                        <div className="flex gap-4">
                                           {['Yes', 'No'].map(opt => (
                                              <button key={opt} onClick={() => updateAnswer(req.id, opt)} className={cn("flex-1 py-6 rounded-full font-black text-[10px] uppercase tracking-widest border-2 transition-all", requirementAnswers[req.id] === opt ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-300 border-stone-50 hover:border-stone-100")}>{opt}</button>
                                           ))}
                                        </div>
                                     )}
                                  </div>
                                ))}
                             </div>
                          )}

                           {/* Request For Quote (RFQ) Media Intake Box */}
                           {isQuoteBased && (
                              <div className="space-y-4 pt-10">
                                 <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-widest pl-2 flex items-center gap-2">
                                   <Camera size={14} /> Inspiration Links
                                 </h4>
                                 <p className="text-xs text-stone-500 italic px-2 pb-2">Paste URLs to Pinterest, Instagram, or Google Images to give the professional a visual concept of your custom request.</p>
                                 <div className="flex gap-2">
                                    <Input 
                                      placeholder="https://pinterest.com/..." 
                                      value={currentUrl} 
                                      onChange={e => setCurrentUrl(e.target.value)}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                           e.preventDefault();
                                           if (currentUrl.trim()) {
                                              setInspirationUrls(p => [...p, currentUrl.trim()]);
                                              setCurrentUrl('');
                                           }
                                        }
                                      }}
                                      className="rounded-full bg-stone-50 border-stone-100 shadow-inner px-6" 
                                    />
                                    <Button 
                                      onClick={() => {
                                        if (currentUrl.trim()) {
                                           setInspirationUrls(p => [...p, currentUrl.trim()]);
                                           setCurrentUrl('');
                                        }
                                      }}
                                      className="rounded-full px-6"
                                    >Add</Button>
                                 </div>
                                 <div className="flex flex-wrap gap-2 pt-2">
                                    {inspirationUrls.map((url, idx) => (
                                      <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-full text-[10px] font-black uppercase tracking-widest text-stone-600">
                                         <span className="truncate max-w-[150px]">{url}</span>
                                         <button onClick={() => setInspirationUrls(p => p.filter((_, i) => i !== idx))}><X size={12} className="text-red-500 hover:text-red-700" /></button>
                                      </div>
                                    ))}
                                 </div>
                              </div>
                           )}
                       </div>
                    </motion.div>
                  )}

                  {step === 'schedule' && (
                    <motion.div key="schedule" className="space-y-16" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                       <h3 className="text-4xl font-serif font-black text-stone-900 tracking-tight text-balance">When should the service begin?</h3>
                       <div className="space-y-12">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em] pl-6 flex items-center gap-2">
                                <CalendarIcon size={14} className="text-stone-900" /> Select Date
                             </label>
                             <Input 
                               type="date" 
                               min={tomorrow} 
                               value={formData.bookingDate} 
                               onChange={e => setFormData(p => ({ ...p, bookingDate: e.target.value, bookingTime: '' }))} 
                               className="h-20 bg-stone-50/90 border-stone-100 rounded-full px-12 text-sm font-black uppercase tracking-widest shadow-inner focus:bg-white transition-all" 
                             />
                          </div>

                          {formData.bookingDate && (
                            <div className="space-y-6">
                               <label className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em] pl-6 flex items-center gap-2">
                                  <Clock size={14} className="text-stone-900" /> Available Windows
                               </label>
                               
                               {loadingSlots ? (
                                 <div className="flex items-center gap-4 py-8 pl-6">
                                    <Loader2 className="animate-spin text-stone-300" size={24} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Verifying availability...</p>
                                 </div>
                               ) : availableSlots.length > 0 ? (
                                 <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                    {availableSlots.map(time => (
                                      <button
                                        key={time}
                                        onClick={() => setFormData(p => ({ ...p, bookingTime: time }))}
                                        className={cn(
                                          "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                          formData.bookingTime === time 
                                            ? "bg-stone-900 text-white border-stone-900 shadow-xl" 
                                            : "bg-white text-stone-400 border-stone-50 hover:border-stone-200"
                                        )}
                                      >
                                        {time}
                                      </button>
                                    ))}
                                 </div>
                               ) : (
                                 <div className="p-10 rounded-[2.5rem] bg-stone-50 border border-stone-100 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 leading-relaxed">
                                       No available windows for this date. Please select another.
                                    </p>
                                 </div>
                               )}
                            </div>
                          )}
                          
                          {service.isHomeService && (
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest pl-6">Service Address</label>
                                <Input placeholder="Entry residential or session address" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} className="h-20 bg-stone-50/90 border-stone-100 rounded-full px-12 shadow-inner" />
                             </div>
                          )}

                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-stone-300 uppercase tracking-widest pl-6">Session Notes</label>
                             <Textarea placeholder="Vision or preferences..." value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} className="rounded-[2.5rem] border-stone-100 bg-stone-50/90 focus:bg-white transition-all text-sm px-10 py-8 shadow-inner" />
                          </div>
                       </div>
                    </motion.div>
                  )}

                  {step === 'confirm' && (
                    <motion.div key="confirm" className="space-y-16" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                       <h3 className="text-4xl font-serif font-black text-stone-900 tracking-tight">Final Commitment</h3>
                       
                       <div className="space-y-8">
                          <div className="bg-stone-900 rounded-[3rem] p-10 text-white shadow-2xl">
                             <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/40 mb-6 font-mono">Boutique Bill</p>
                             <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                   <span className="text-white/60 font-mono">Core Service</span>
                                   <span>GHS {service.price.toFixed(2)}</span>
                                </div>
                                {selectedAddons.map(a => (
                                  <div key={a.id} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                     <span className="text-white/60 font-mono italic">+ {a.name}</span>
                                     <span>{a.price.toFixed(2)}</span>
                                  </div>
                                ))}
                                <div className="h-px bg-white/10 my-6" />
                                <div className="flex justify-between items-end">
                                   <span className="text-[10px] font-black uppercase tracking-[0.4em]">{isQuoteBased ? 'Current Accrual' : 'Total Accrual'}</span>
                                   <span className="text-5xl font-black tracking-tighter leading-none">{isQuoteBased ? 'QUOTE' : `GHS ${totalPrice.toFixed(2)}`}</span>
                                </div>
                                {isQuoteBased && (
                                   <p className="text-[10px] text-white/40 italic font-serif mt-2">The professional will review your request and references, and issue a Quote. You will be prompted to pay a 50% deposit later.</p>
                                )}
                                {!isQuoteBased && (
                                   <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                     <Check size={12} /> Deposit Split (50% To Secure): GHS {(totalPrice / 2).toFixed(2)}
                                   </p>
                                )}
                             </div>
                          </div>

                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em] pl-6">Settlement Method</label>
                             <div className="grid grid-cols-2 gap-4">
                                <button
                                  onClick={() => setFormData(p => ({ ...p, paymentMethod: 'PLATFORM' }))}
                                  className={cn(
                                    "p-8 rounded-[2rem] border-2 text-left transition-all",
                                    formData.paymentMethod === 'PLATFORM' ? "border-stone-900 bg-stone-50" : "border-stone-50 grayscale opacity-60"
                                  )}
                                >
                                   <CreditCard size={24} className="mb-4" />
                                   <p className="text-[10px] font-black uppercase tracking-widest">Online Secure</p>
                                </button>
                                <button
                                  onClick={() => setFormData(p => ({ ...p, paymentMethod: 'IN_PERSON' }))}
                                  className={cn(
                                    "p-8 rounded-[2rem] border-2 text-left transition-all",
                                    formData.paymentMethod === 'IN_PERSON' ? "border-stone-900 bg-stone-50" : "border-stone-50 grayscale opacity-60"
                                  )}
                                >
                                   <Wallet size={24} className="mb-4" />
                                   <p className="text-[10px] font-black uppercase tracking-widest">Pay in Person</p>
                                </button>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  )}

                  {step === 'success' && (
                    <motion.div key="success" className="h-full flex flex-col items-center justify-center text-center space-y-12 py-12" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                       <div className="relative">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 scale-125 opacity-20"
                          >
                             <Sun size={160} className="text-stone-900" />
                          </motion.div>
                          <div className="relative w-40 h-40 bg-stone-900 text-emerald-400 rounded-full flex items-center justify-center shadow-3xl shadow-stone-200">
                             <Check size={80} strokeWidth={3} />
                          </div>
                       </div>
                       <div className="space-y-6">
                          <h2 className="text-6xl font-serif font-black text-stone-900 tracking-tight">Request Sent</h2>
                          <div className="p-10 bg-white border border-stone-100 rounded-[3rem] shadow-xl max-w-md mx-auto space-y-6">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 leading-relaxed">
                                Professional has <span className="text-stone-900">6 hours</span> to confirm. 
                                {formData.paymentMethod === 'PLATFORM' 
                                  ? " You will receive a direct link to complete payment once approved."
                                  : " You will receive a confirmation alert once approved. Settlement is handled in-person."
                                }
                             </p>
                             <div className="flex items-center justify-center gap-2">
                                <Hourglass size={14} className="text-stone-300 animate-pulse" />
                                <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest">Awaiting Professional Approval</span>
                             </div>
                          </div>
                       </div>
                       <Button onClick={() => router.push(`/bookings`)} className="h-20 px-16 bg-stone-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:bg-stone-800 transition-all shadow-2xl">
                          Track Progress in Bookings
                       </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {step !== 'success' && (
                  <div className="pt-16 mt-auto">
                     {error && (
                        <div className="mb-8">
                           <Alert variant="destructive" className="rounded-[2.5rem] bg-red-50 text-red-900 py-6 px-10 border-none shadow-2xl">
                              <AlertCircle className="w-5 h-5 flex-shrink-0" />
                              <AlertDescription className="text-[10px] font-black uppercase tracking-widest ml-4">{error}</AlertDescription>
                           </Alert>
                        </div>
                     )}

                     <div className="flex flex-col sm:flex-row gap-4">
                        {step !== 'customize' && (
                           <Button variant="ghost" onClick={() => setStep(step === 'confirm' ? 'schedule' : 'customize')} className="flex-1 rounded-full h-20 font-black uppercase tracking-[0.3em] text-[10px] text-stone-300 hover:text-stone-900 border border-stone-50">
                             <ChevronLeft size={16} className="mr-2" /> Back
                           </Button>
                        )}
                        <Button
                           onClick={step === 'confirm' ? handleSubmit : handleNextStep}
                           disabled={loading}
                           className={cn(
                               "flex-[2] rounded-full h-20 font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl transition-all duration-700",
                               step === 'confirm' ? "bg-stone-900 hover:bg-stone-800 text-white" : "bg-stone-900 hover:bg-stone-800 text-white"
                           )}
                        >
                           {loading ? (
                               <Loader2 className="w-6 h-6 animate-spin" />
                           ) : (
                               <span className="flex items-center gap-4">
                                  {step === 'confirm' ? (isQuoteBased ? 'REQUEST CUSTOM QUOTE' : 'REQUEST RESERVATION') : 'CONTINUE CURATION'} <ArrowRight size={18} />
                               </span>
                           )}
                        </Button>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>
        
        {/* Measurement Intercept Modal: The Bespoke Standard */}
        <AnimatePresence>
          {showMeasurementModal && (
            <TooltipProvider>
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" />
                 <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh]">
                    
                    {/* Header with Unit Toggle */}
                    <div className="p-10 pb-6 border-b border-stone-50 flex justify-between items-center">
                       <div>
                          <h3 className="text-3xl font-black text-stone-900 tracking-tighter">Bespoke Blueprint</h3>
                          <div className="flex items-center gap-4 mt-2">
                             <div className="flex bg-stone-100 p-1 rounded-full border border-stone-200 shadow-inner">
                                {['in', 'cm'].map((u) => (
                                   <button 
                                     key={u} 
                                     onClick={toggleUnit}
                                     className={cn(
                                       "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                       measurementUnit === u ? "bg-white text-stone-900 shadow-md" : "text-stone-400 hover:text-stone-600"
                                     )}
                                   >
                                      {u}
                                   </button>
                                ))}
                             </div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">Metric Calibration</p>
                          </div>
                       </div>
                       <button onClick={() => setShowMeasurementModal(false)} className="p-4 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors text-stone-400"><X size={20} /></button>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex px-10 py-4 gap-2 border-b border-stone-50">
                       {[1, 2, 3].map(s => (
                          <div key={s} className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                             <motion.div 
                               initial={false} 
                               animate={{ width: measurementStep >= s ? '100%' : '0%' }} 
                               className={cn("h-full", measurementStep === s ? "bg-stone-900" : "bg-stone-400")} 
                             />
                          </div>
                       ))}
                    </div>

                    {/* Form Content: Step-by-Step */}
                    <div className="flex-1 overflow-y-auto pt-20 p-10">
                       <AnimatePresence mode="wait">
                          {measurementStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                               <div className="flex items-center gap-4 mb-2">
                                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">01</div>
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Core Essentials</h4>
                               </div>
                               <div className="grid grid-cols-2 gap-6">
                                  {[
                                     { id: 'bust', label: 'Full Chest', help: 'Measure around the fullest part of your chest.' },
                                     { id: 'waist', label: 'Waistline', help: 'Measure around your natural waist (narrowest part).' },
                                     { id: 'hips', label: 'Seat / Hips', help: 'Fullest part of your hips and bottom.' },
                                     { id: 'height', label: 'Total Height', help: 'Your full height from floor to head.' },
                                     { id: 'weight', label: `Weight (${measurementUnit === 'in' ? 'lbs' : 'kg'})`, help: 'Total body mass.' },
                                  ].map(f => (
                                     <div key={f.id} className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                           <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{f.label}</label>
                                           <Tooltip>
                                              <TooltipTrigger><Info size={12} className="text-stone-300 hover:text-stone-900 transition-colors" /></TooltipTrigger>
                                              <TooltipContent side="top">{f.help}</TooltipContent>
                                           </Tooltip>
                                        </div>
                                        <div className="relative group">
                                           <Input type="number" step="0.1" value={measurementData[f.id as keyof typeof measurementData]} onChange={e => setMeasurementData(p => ({...p, [f.id]: e.target.value}))} className="h-16 rounded-2xl text-lg font-black bg-stone-50 border-stone-100 pr-12 focus:bg-white transition-all shadow-inner" />
                                           <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-[10px] uppercase text-stone-300 tracking-widest">
                                              {f.id === 'weight' ? (measurementUnit === 'in' ? 'lbs' : 'kg') : measurementUnit}
                                           </span>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </motion.div>
                          )}

                          {measurementStep === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                               <div className="flex items-center gap-4 mb-2">
                                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">02</div>
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Upper Body & Arms</h4>
                               </div>
                               <div className="grid grid-cols-2 gap-6">
                                  {[
                                     { id: 'neck', label: 'Neck / Collar', help: 'Around the base of your neck.' },
                                     { id: 'shoulder', label: 'Shoulder Width', help: 'Width from edge to edge across your back.' },
                                     { id: 'armLength', label: 'Sleeve Length', help: 'From shoulder bone to wrist bone.' },
                                     { id: 'bicep', label: 'Upper Arm', help: 'Fullest part of your relaxed arm.' },
                                     { id: 'wrist', label: 'Wrist Bone', help: 'Circumference around the wrist bone.' },
                                     { id: 'underbust', label: 'Lower Chest', help: 'Directly beneath the bust.' },
                                     { id: 'hpsToWaist', label: 'Front Length', help: 'From high shoulder point down to waist.' },
                                     { id: 'napeToWaist', label: 'Back Length', help: 'From base of neck down to waist.' },
                                  ].map(f => (
                                     <div key={f.id} className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                           <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{f.label}</label>
                                           <Tooltip>
                                              <TooltipTrigger><Info size={12} className="text-stone-300 hover:text-stone-900 transition-colors" /></TooltipTrigger>
                                              <TooltipContent side="top">{f.help}</TooltipContent>
                                           </Tooltip>
                                        </div>
                                        <div className="relative">
                                           <Input type="number" step="0.1" value={measurementData[f.id as keyof typeof measurementData]} onChange={e => setMeasurementData(p => ({...p, [f.id]: e.target.value}))} className="h-16 rounded-2xl text-lg font-black bg-stone-50 border-stone-100 pr-12 shadow-inner" />
                                           <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-[10px] uppercase text-stone-300 tracking-widest">{measurementUnit}</span>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </motion.div>
                          )}

                          {measurementStep === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                               <div className="flex items-center gap-4 mb-2">
                                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">03</div>
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Lower Body / Legs</h4>
                               </div>
                               <div className="grid grid-cols-2 gap-6">
                                  {[
                                     { id: 'inseam', label: 'Inner Leg', help: 'Inside of leg from crotch to ankle.' },
                                     { id: 'thigh', label: 'Upper Thigh', help: 'Fullest part of your upper leg.' },
                                     { id: 'knee', label: 'Knee Width', help: 'At the knee joint while standing.' },
                                     { id: 'ankle', label: 'Ankle Bone', help: 'Around the ankle bone.' },
                                     { id: 'crotchRise', label: 'Seat Depth', help: 'Tailoring distance from waist to crotch.' },
                                  ].map(f => (
                                     <div key={f.id} className="space-y-2">
                                        <div className="flex justify-between items-center px-1">
                                           <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{f.label}</label>
                                           <Tooltip>
                                              <TooltipTrigger><Info size={12} className="text-stone-300 hover:text-stone-900 transition-colors" /></TooltipTrigger>
                                              <TooltipContent side="top">{f.help}</TooltipContent>
                                           </Tooltip>
                                        </div>
                                        <div className="relative">
                                           <Input type="number" step="0.1" value={measurementData[f.id as keyof typeof measurementData]} onChange={e => setMeasurementData(p => ({...p, [f.id]: e.target.value}))} className="h-16 rounded-2xl text-lg font-black bg-stone-50 border-stone-100 pr-12 shadow-inner" />
                                           <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-[10px] uppercase text-stone-300 tracking-widest">{measurementUnit}</span>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </motion.div>
                          )}
                       </AnimatePresence>
                    </div>

                    {/* Footer Controls */}
                    <div className="p-10 pt-6 border-t border-stone-50 bg-stone-50/30 flex gap-4">
                       {measurementStep > 1 && (
                          <Button 
                            variant="ghost" 
                            onClick={() => setMeasurementStep(p => p - 1)} 
                            className="h-16 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-stone-100/50 hover:bg-white"
                          >
                             Back
                          </Button>
                       )}
                       {measurementStep < 3 ? (
                          <Button 
                            onClick={() => setMeasurementStep(p => p + 1)} 
                            className="flex-1 h-16 rounded-2xl bg-stone-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95"
                          >
                             Next Step <ChevronRight size={16} className="ml-2" />
                          </Button>
                       ) : (
                          <Button 
                            onClick={handleSaveMeasurements} 
                            disabled={savingMeasurements} 
                            className="flex-1 h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 transition-all active:scale-95"
                          >
                             {savingMeasurements ? <Loader2 className="animate-spin" /> : "Finalize & Secure Slot"}
                          </Button>
                       )}
                    </div>
                 </motion.div>
              </div>
            </TooltipProvider>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
