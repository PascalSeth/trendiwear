import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChevronDown, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface ServiceVariant {
  id: string
  name: string
  description?: string
  price: number
  durationMinutes: number
  isActive: boolean
}

export interface ServiceAddon {
  id: string
  name: string
  description?: string
  price: number
  isActive: boolean
}

export interface ServiceRequirement {
  id: string
  question: string
  type: 'TEXT' | 'MULTIPLE_CHOICE' | 'YES_NO'
  options: string[]
  isRequired: boolean
}

export interface ServiceWithVariants {
  professionalServiceId?: string | null
  professionalId?: string | null
  id: string
  name: string
  description?: string
  imageUrl?: string
  duration: number // in minutes
  durationOverride?: number
  isHomeService: boolean
  price: number
  category?: {
    name: string
  }
  categoryName?: string | null
  variants?: ServiceVariant[]
  addons?: ServiceAddon[]
  customRequirements?: ServiceRequirement[]
  images?: { url: string }[]
  _count?: {
    bookings: number
  }
}

interface ServiceCardProps {
  service: ServiceWithVariants
  onBook: (service: ServiceWithVariants, variant?: ServiceVariant) => void
  isLoading?: boolean
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onBook,
  isLoading = false,
}) => {
  const [expandVariants, setExpandVariants] = useState(false)
  const effectiveDuration = service.durationOverride ?? service.duration
  const hasVariants = service.variants && service.variants.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-[2rem] border border-stone-100 overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500"
    >
      {/* Service Image / Hero Area */}
      <div className="relative w-full h-56 bg-stone-50 overflow-hidden">
        {service.imageUrl ? (
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
             <Star className="w-12 h-12 text-stone-200" />
          </div>
        )}
        
        {/* Overlay Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
           {service.category && (
              <Badge className="bg-white/90 backdrop-blur text-stone-900 border-none shadow-sm hover:bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                {service.category.name}
              </Badge>
           )}
           {service.isHomeService && (
              <Badge className="bg-amber-500/90 backdrop-blur text-white border-none shadow-sm px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                Home Service
              </Badge>
           )}
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Service Info */}
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
             <h3 className="text-xl font-serif font-bold text-stone-900 group-hover:text-amber-600 transition-colors">
               {service.name}
             </h3>
             <div className="flex items-center gap-1.5 px-2 py-1 bg-stone-50 rounded-lg text-stone-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-tighter">{effectiveDuration} MIN</span>
             </div>
          </div>
          {service.description && (
            <p className="text-sm text-stone-500 leading-relaxed line-clamp-2">
              {service.description}
            </p>
          )}
        </div>

        {/* Pricing & Booking */}
        <div className="flex items-center justify-between pt-6 border-t border-stone-50">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Starting from</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-stone-400">GHS</span>
              <span className="text-2xl font-black text-stone-900">{service.price.toFixed(2)}</span>
            </div>
          </div>
          
          <Button
            onClick={() => onBook(service)}
            disabled={isLoading}
            className="rounded-2xl bg-stone-900 text-white hover:bg-stone-800 h-12 px-8 font-black uppercase tracking-widest text-[10px] transition-all duration-300 shadow-xl shadow-stone-200"
          >
            BOOK NOW
          </Button>
        </div>

        {/* Professional Variants List */}
        {hasVariants && (
          <div className="pt-2">
            <button
              onClick={() => setExpandVariants(!expandVariants)}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-600 transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              <span>View Pricing Tiers ({service.variants?.length})</span>
              <ChevronDown
                className="w-3 h-3 transition-transform duration-500"
                style={{ transform: expandVariants ? 'rotate(180deg)' : 'rotate(0)' }}
              />
            </button>

            <AnimatePresence>
              {expandVariants && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 gap-2 pt-4">
                    {service.variants?.map((variant) => (
                      <motion.div
                        key={variant.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-stone-50/50 rounded-2xl border border-stone-100 hover:border-amber-200 hover:bg-amber-50 cursor-pointer transition-all group/v"
                        onClick={() => onBook(service, variant)}
                      >
                        <div className="flex-1">
                          <h4 className="text-xs font-black text-stone-900 uppercase tracking-wide group-hover/v:text-amber-600">{variant.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                             <div className="flex items-center gap-1 text-stone-400">
                                <Clock size={10} />
                                <span className="text-[9px] font-bold">{variant.durationMinutes} MIN</span>
                             </div>
                             {variant.description && <span className="text-[9px] text-stone-400 border-l border-stone-200 pl-3 line-clamp-1">{variant.description}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-stone-900">GHS {variant.price.toFixed(2)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}
