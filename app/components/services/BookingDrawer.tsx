'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Clock, X, AlertCircle, Loader2, Check, Sparkles, HelpCircle, Zap, ArrowRight, ArrowLeft, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import type { ServiceWithVariants, ServiceAddon, ServiceRequirement, ServiceVariant } from './ServiceCard';

interface BookingDrawerProps {
  isOpen: boolean;
  service: ServiceWithVariants | null;
  variant?: ServiceVariant | null;
  professionalId: string;
  professionalName: string;
  onClose: () => void;
  onSuccess?: (booking: { id: string; status: string; totalPrice?: number }) => void;
}

type BookingStep = 'customize' | 'schedule' | 'confirm' | 'success';

export const BookingDrawer: React.FC<BookingDrawerProps> = ({
  isOpen,
  service,
  variant,
  professionalId,
  professionalName,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<BookingStep>('customize');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  const [requirementAnswers, setRequirementAnswers] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    bookingDate: '',
    bookingTime: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      setStep('customize');
      setSelectedAddonIds(new Set());
      setRequirementAnswers({});
      setFormData({
        bookingDate: '',
        bookingTime: '',
        location: '',
        notes: '',
      });
      setError('');
    }
  }, [isOpen, service?.id]);

  if (!service) return null;

  const selectedVariant = variant || null;
  const basePrice = selectedVariant ? selectedVariant.price : service.price;
  const selectedAddons = (service.addons || []).filter(a => selectedAddonIds.has(a.id));
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const totalPrice = basePrice + addonsTotal;
  const effectiveDuration = selectedVariant ? selectedVariant.durationMinutes : (service.durationOverride ?? service.duration);

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
      // Check mandatory requirements
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
          serviceId: service.id,
          professionalId,
          variantId: selectedVariant?.id,
          bookingDate: bookingDateTime.toISOString(),
          location: formData.location || null,
          notes: formData.notes || null,
          selectedAddonIds: Array.from(selectedAddonIds),
          requirementAnswers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const booking = await response.json();
      setStep('success');
      setTimeout(() => {
        onSuccess?.(booking);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-[2px] z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-stone-50 rounded-full transition-colors"
                >
                  <X size={20} className="text-stone-400" />
                </button>
                <div>
                   <h2 className="text-sm font-black uppercase tracking-widest text-stone-900">Secure Booking</h2>
                   <div className="flex items-center gap-2 mt-0.5">
                      <div className={cn("h-1 w-8 rounded-full", step === 'customize' ? "bg-amber-500" : "bg-stone-100")} />
                      <div className={cn("h-1 w-8 rounded-full", step === 'schedule' ? "bg-amber-500" : "bg-stone-100")} />
                      <div className={cn("h-1 w-8 rounded-full", step === 'confirm' ? "bg-amber-500" : "bg-stone-100")} />
                   </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Pricing Est.</p>
                <p className="text-lg font-black text-stone-900">GHS {totalPrice.toFixed(2)}</p>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <AnimatePresence mode="wait">
                {step === 'customize' && (
                  <motion.div
                    key="customize"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 space-y-10"
                  >
                    <div className="space-y-6">
                       <div className="space-y-3">
                        <h1 className="text-3xl font-serif font-bold text-stone-900 leading-tight">{service.name}</h1>
                        <div className="flex items-center gap-4 text-[10px] font-black text-stone-400 tracking-widest uppercase">
                            <span className="flex items-center gap-1.5 text-amber-600">
                              <Zap className="w-3.5 h-3.5 fill-current" /> {professionalName}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" /> {effectiveDuration} MIN
                            </span>
                        </div>
                       </div>

                       {/* Proof of Service: Portfolio Gallery */}
                       {service.images && service.images.length > 0 && (
                         <div className="space-y-4 pt-4">
                           <div className="flex items-center justify-between">
                              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-900">Project Portfolio</h3>
                              <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest border border-amber-200 px-2 py-0.5 rounded-full bg-amber-50">Proof of Service</span>
                           </div>
                           <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2 snap-x">
                              {service.images.map((img, i) => (
                                <motion.div 
                                  key={i}
                                  whileHover={{ scale: 1.02 }}
                                  className="w-48 h-64 shrink-0 rounded-[2rem] overflow-hidden border-4 border-stone-50 shadow-xl shadow-stone-100/50 snap-start relative group"
                                >
                                   <Image 
                                     src={img.url} 
                                     alt={`Service reference ${i + 1}`} 
                                     fill 
                                     className="object-cover transition-transform duration-700 group-hover:scale-110"
                                   />
                                   <div className="absolute inset-0 bg-stone-950/0 group-hover:bg-stone-950/10 transition-colors" />
                                </motion.div>
                              ))}
                           </div>
                         </div>
                       )}
                    </div>

                    {/* Add-ons Section */}
                    {service.addons && service.addons.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-stone-900 flex items-center gap-2">
                           <Sparkles size={14} className="text-amber-500" /> Premium Upgrades
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          {service.addons.map((addon: ServiceAddon) => (
                            <div 
                              key={addon.id} 
                              onClick={() => toggleAddon(addon.id)}
                              className={cn(
                                "p-5 rounded-3xl border cursor-pointer transition-all duration-300 flex items-center justify-between group",
                                selectedAddonIds.has(addon.id) 
                                  ? "bg-stone-900 border-stone-900 text-white shadow-xl" 
                                  : "bg-white border-stone-100 hover:border-stone-200"
                              )}
                            >
                              <div className="flex-1 pr-4">
                                <p className={cn("text-sm font-bold", selectedAddonIds.has(addon.id) ? "text-white" : "text-stone-900")}>{addon.name}</p>
                                <p className={cn("text-[10px] mt-1", selectedAddonIds.has(addon.id) ? "text-stone-400" : "text-stone-500")}>{addon.description || 'Elevate your experience'}</p>
                              </div>
                              <div className="text-right">
                                <p className={cn("text-xs font-black", selectedAddonIds.has(addon.id) ? "text-amber-400" : "text-stone-900")}>+ {addon.price.toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Requirements Section */}
                    {service.customRequirements && service.customRequirements.length > 0 && (
                      <div className="space-y-6 pt-6 border-t border-stone-50">
                        <h3 className="text-xs font-black uppercase tracking-widest text-stone-900 flex items-center gap-2">
                           <HelpCircle size={14} className="text-stone-400" /> Project Details
                        </h3>
                        {service.customRequirements.map((req: ServiceRequirement) => (
                          <div key={req.id} className="space-y-3">
                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                               {req.question} {req.isRequired && <span className="text-red-500">*</span>}
                            </label>
                            {req.type === 'TEXT' && (
                              <Textarea 
                                placeholder="Details help us prepare..."
                                value={requirementAnswers[req.id] || ''}
                                onChange={(e) => updateAnswer(req.id, e.target.value)}
                                className="rounded-2xl border-stone-100 bg-stone-50 focus:bg-white transition-all text-sm h-24 no-scrollbar"
                              />
                            )}
                            {req.type === 'YES_NO' && (
                              <div className="flex gap-2">
                                {['Yes', 'No'].map((opt) => (
                                  <button
                                    key={opt}
                                    onClick={() => updateAnswer(req.id, opt)}
                                    className={cn(
                                      "flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all",
                                      requirementAnswers[req.id] === opt 
                                        ? "bg-stone-900 text-white border-stone-900 shadow-lg" 
                                        : "bg-white text-stone-400 border-stone-100 hover:border-stone-200"
                                    )}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )}
                            {req.type === 'MULTIPLE_CHOICE' && (
                              <Select 
                                onValueChange={(val) => updateAnswer(req.id, val)}
                                value={requirementAnswers[req.id] || ''}
                              >
                                <SelectTrigger className="w-full h-14 bg-stone-50 border-stone-100 rounded-2xl px-5 text-sm">
                                  <SelectValue placeholder="Choose one..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                  {(req.options || []).map((opt: string) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 'schedule' && (
                  <motion.div
                    key="schedule"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 space-y-10"
                  >
                    <div className="space-y-2">
                       <h2 className="text-2xl font-serif font-bold text-stone-900">Select Time-slot</h2>
                       <p className="text-xs text-stone-500 font-medium">When would you like to schedule this?</p>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                             <Calendar size={12} /> Preferred Date
                          </label>
                          <Input type="date" min={today} value={formData.bookingDate} onChange={e => setFormData(p => ({ ...p, bookingDate: e.target.value }))} className="h-14 bg-stone-50 border-stone-100 rounded-2xl px-5" />
                       </div>
                       
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                             <Clock size={12} /> Arrival Time
                          </label>
                          <Input type="time" value={formData.bookingTime} onChange={e => setFormData(p => ({ ...p, bookingTime: e.target.value }))} className="h-14 bg-stone-50 border-stone-100 rounded-2xl px-5" />
                       </div>

                       {service.isHomeService && (
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Full Location / Address</label>
                            <Input placeholder="E.g. House No, Street Name, City" value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} className="h-14 bg-stone-50 border-stone-100 rounded-2xl px-5" />
                         </div>
                       )}

                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Additional Notes</label>
                          <Textarea placeholder="Any specific instructions for the pro?" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} className="rounded-2xl border-stone-100 bg-stone-50 focus:bg-white transition-all text-sm h-24" />
                       </div>
                    </div>
                  </motion.div>
                )}

                {step === 'confirm' && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 space-y-10"
                  >
                    <div className="text-center py-6">
                       <div className="w-20 h-20 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                          <Sparkles size={32} className="text-amber-400" />
                       </div>
                       <h2 className="text-2xl font-serif font-bold text-stone-900 uppercase tracking-tight">Final Summary</h2>
                       <p className="text-xs text-stone-400 font-medium uppercase tracking-widest mt-2">Ready to submit for approval</p>
                    </div>

                    <div className="bg-stone-50 rounded-[2.5rem] p-8 border border-stone-100 space-y-6">
                       <div className="space-y-4 pb-6 border-b border-stone-200">
                          <div className="flex justify-between items-center text-xs">
                             <span className="font-bold text-stone-400 uppercase">Standard Service</span>
                             <span className="font-black text-stone-900">GHS {basePrice.toFixed(2)}</span>
                          </div>
                          {selectedAddons.map(a => (
                            <div key={a.id} className="flex justify-between items-center text-xs">
                               <span className="font-bold text-amber-600 uppercase flex items-center gap-2">
                                  <Check size={12} /> {a.name}
                               </span>
                               <span className="font-black text-stone-900">+ {a.price.toFixed(2)}</span>
                            </div>
                          ))}
                       </div>

                       <div className="space-y-4">
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-black text-stone-400 uppercase">Total Estimate</span>
                             <span className="text-4xl font-black text-stone-900 tracking-tighter">GHS {totalPrice.toFixed(2)}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 pt-2">
                             <div className="bg-white rounded-2xl p-4 border border-stone-100">
                                <p className="text-[8px] font-black text-stone-400 uppercase mb-1">Date</p>
                                <p className="text-xs font-black text-stone-900">{formData.bookingDate}</p>
                             </div>
                             <div className="bg-white rounded-2xl p-4 border border-stone-100">
                                <p className="text-[8px] font-black text-stone-400 uppercase mb-1">Time</p>
                                <p className="text-xs font-black text-stone-900">{formData.bookingTime}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}

                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-8 h-full flex flex-col items-center justify-center text-center space-y-8"
                  >
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-100">
                       <Check size={48} className="animate-bounce" />
                    </div>
                    <div className="space-y-3">
                       <h2 className="text-3xl font-serif font-bold text-stone-900">Success!</h2>
                       <p className="text-sm text-stone-500 max-w-xs mx-auto leading-relaxed">
                          Your request has been delivered to <strong>{professionalName}</strong>. You&apos;ll hear from them very soon.
                       </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            {step !== 'success' && (
              <div className="p-8 bg-stone-50/50 border-t border-stone-100">
                 {error && (
                   <Alert variant="destructive" className="mb-6 rounded-[1.5rem] border-none bg-red-50 text-red-900 py-4">
                     <AlertCircle className="w-4 h-4" />
                     <AlertDescription className="text-[10px] font-black uppercase tracking-widest">{error}</AlertDescription>
                   </Alert>
                 )}

                 <div className="flex gap-4">
                    {step !== 'customize' ? (
                       <Button 
                         variant="ghost" 
                         onClick={() => setStep(step === 'confirm' ? 'schedule' : 'customize')} 
                         className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] text-stone-400 hover:text-stone-900"
                       >
                         <ArrowLeft size={16} className="mr-2" /> Back
                       </Button>
                    ) : (
                       <div className="flex-1" />
                    )}

                    <Button
                      onClick={step === 'confirm' ? handleSubmit : handleNextStep}
                      disabled={loading}
                      className={cn(
                        "flex-[2] rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all duration-300",
                        step === 'confirm' ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-stone-900 hover:bg-stone-800 text-white"
                      )}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-2">
                           {step === 'confirm' ? 'FINALIZE BOOKING' : 'NEXT STEP'} <ArrowRight size={14} />
                        </span>
                      )}
                    </Button>
                 </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
