'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronDown, Sparkles, ArrowRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceWithVariants, ServiceVariant } from './ServiceCard';

interface ServiceListItemProps {
  service: ServiceWithVariants;
  onBook: (service: ServiceWithVariants, variant?: ServiceVariant) => void;
  index: number;
}

export const ServiceListItem: React.FC<ServiceListItemProps> = ({
  service,
  onBook,
  index,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [expandVariants, setExpandVariants] = useState(false);
  const effectiveDuration = service.durationOverride ?? service.duration;
  const hasVariants = service.variants && service.variants.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative border-b border-stone-100 py-12 md:py-16 overflow-visible"
    >
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-12">
        
        {/* Left: Branding & Identifier - Ensure it stays on top */}
        <div className="relative z-30 flex items-center gap-6 md:w-32 shrink-0">
           <span className="text-[10px] font-black text-stone-300 tracking-[0.3em] uppercase">0{index + 1}</span>
           <div className={cn("h-px w-12 bg-stone-100 transition-all duration-500", isHovered && "w-20 bg-amber-400")} />
        </div>

        {/* Center: Hero Typography & Info */}
        <div className="flex-1 space-y-4 relative z-20">
           <div className="relative inline-block cursor-default">
              <h3 className="text-4xl md:text-6xl font-serif font-bold text-stone-900 tracking-tight transition-colors duration-500 group-hover:text-amber-600">
                {service.name}
              </h3>
              
              {/* Hover-Reveal Image Fragment - POSITIONING REFINED */}
              <AnimatePresence>
                {isHovered && service.imageUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 0, y: 20, rotate: 5 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      x: 0, 
                      y: 0, 
                      rotate: -2,
                      transition: { type: 'spring', stiffness: 100, damping: 15 }
                    }}
                    exit={{ opacity: 0, scale: 0.8, y: 20, rotate: 5 }}
                    className="absolute -top-[150%] left-[40%] hidden lg:block w-72 h-96 z-10 pointer-events-none shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] rounded-3xl overflow-hidden border-[12px] border-white"
                  >
                    <Image 
                      src={service.imageUrl} 
                      alt={service.name} 
                      fill 
                      className="object-cover" 
                    />
                    <div className="absolute inset-0 bg-amber-500/5 mix-blend-overlay" />
                  </motion.div>
                )}
              </AnimatePresence>
           </div>

           <div className="flex flex-wrap items-center gap-8 pt-2">
              <div className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">
                 <Clock size={12} className="text-stone-300" />
                 <span>{effectiveDuration} MIN</span>
              </div>
              
              {service.isHomeService && (
                <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                   <Sparkles size={12} />
                   <span>At-Home Service</span>
                </div>
              )}

              {service._count?.bookings && service._count.bookings > 5 && (
                <div className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">
                   <Star size={12} className="text-amber-500 fill-amber-500" />
                   <span>Highly Coveted</span>
                </div>
              )}
           </div>

           {service.description && (
             <p className="max-w-xl text-stone-500 text-sm leading-relaxed font-medium transition-colors group-hover:text-stone-900">
                {service.description}
             </p>
           )}
        </div>

        {/* Right: Pricing & CTA - HIGHER Z-INDEX */}
        <div className="relative z-30 flex flex-col items-start md:items-end gap-6 md:w-64 shrink-0">
           <div className="text-right">
              <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] mb-1">Entrance Price</p>
              <div className="flex items-baseline gap-2">
                 <span className="text-xs font-bold text-stone-400">GHS</span>
                 <span className="text-4xl font-black text-stone-900 tracking-tighter">{service.price.toFixed(2)}</span>
              </div>
           </div>

           <div className="flex items-center gap-4">
              {hasVariants && (
                <button
                  onClick={() => setExpandVariants(!expandVariants)}
                  className="group/b flex items-center gap-3 text-[10px] font-black text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-widest"
                >
                  {expandVariants ? 'Conceal' : 'Tiers'} <ChevronDown size={14} className={cn("transition-transform duration-500", expandVariants && "rotate-180")} />
                </button>
              )}
              
              <button
                onClick={() => onBook(service)}
                className="group/btn relative h-12 px-8 bg-stone-950 text-white rounded-full overflow-hidden transition-all duration-500 hover:bg-amber-600 hover:shadow-xl shadow-stone-200"
              >
                 <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                   Reserve <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                 </span>
              </button>
           </div>
        </div>
      </div>

      {/* Inline Variant Expansion */}
      <AnimatePresence>
        {expandVariants && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.variants?.map((variant) => (
                <motion.div
                  key={variant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onBook(service, variant)}
                  className="group/v p-8 bg-stone-50/50 rounded-[2rem] border border-stone-100 hover:bg-white hover:border-amber-200 hover:shadow-2xl hover:shadow-amber-100/50 cursor-pointer transition-all duration-500"
                >
                  <div className="flex justify-between items-start mb-6">
                     <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest">{variant.name}</h4>
                     <p className="text-sm font-black text-amber-600">GHS {variant.price.toFixed(2)}</p>
                  </div>
                  {variant.description && (
                    <p className="text-xs text-stone-500 font-medium leading-relaxed mb-6">
                       {variant.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[8px] font-black text-stone-400 uppercase tracking-widest">
                     <Clock size={10} />
                     <span>{variant.durationMinutes} MIN SESSION</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Graphic Element */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-px bg-stone-50 -z-10 group-hover:bg-stone-100 transition-colors" />
    </motion.div>
  );
};
