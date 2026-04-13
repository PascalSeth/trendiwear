'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Ruler, Save, User, Info, Shirt, Scissors } from 'lucide-react'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Measurement {
  id: string
  // Core
  bust?: number; waist?: number; hips?: number; shoulder?: number;  armLength?: number; inseam?: number; height?: number; weight?: number;
  // Upper
  neck?: number; underbust?: number; hpsToWaist?: number; napeToWaist?: number; bicep?: number; wrist?: number;
  // Lower
  thigh?: number; knee?: number; ankle?: number; crotchRise?: number;
  // Metadata
  unit?: string;
  topSize?: string; bottomSize?: string; dressSize?: string; shoeSize?: string;
  bodyType?: string; stylePreferences?: string[]; preferredColors?: string[]; notes?: string;
}

interface MeasurementsResponse {
  measurements: Measurement | null
}

export default function MeasurementsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSegment, setActiveSegment] = useState<'CORE' | 'UPPER' | 'LOWER'>('CORE')
  const [unit, setUnit] = useState<'in' | 'cm'>('in')
  
  const [formData, setFormData] = useState({
    bust: '', waist: '', hips: '', shoulder: '', armLength: '', inseam: '', height: '', weight: '',
    neck: '', underbust: '', hpsToWaist: '', napeToWaist: '', bicep: '', wrist: '',
    thigh: '', knee: '', ankle: '', crotchRise: '',
    topSize: '', bottomSize: '', dressSize: '', shoeSize: '',
    bodyType: '', stylePreferences: [] as string[], preferredColors: [] as string[], notes: '',
  })

  // Conversion logic for UI
  const convertValue = (val: string, toUnit: 'in' | 'cm') => {
    if (!val) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    if (toUnit === 'cm') return (num * 2.54).toFixed(1);
    return (num / 2.54).toFixed(1);
  };

  const handleToggleUnit = () => {
    const nextUnit = unit === 'in' ? 'cm' : 'in';
    const newData = { ...formData };
    
    // Length conversion (in <-> cm)
    const lengthKeys = [
      'bust', 'waist', 'hips', 'shoulder', 'armLength', 'inseam', 
      'height', 'neck', 'underbust', 'hpsToWaist', 
      'napeToWaist', 'bicep', 'wrist', 'thigh', 'knee', 'ankle', 'crotchRise'
    ];
    lengthKeys.forEach(key => {
      const k = key as keyof typeof formData;
      const val = formData[k];
      if (typeof val === 'string' && val) {
        (newData as Record<string, string | string[] | number | undefined>)[k] = convertValue(val, nextUnit);
      }
    });

    // Weight conversion (lbs <-> kg)
    if (formData.weight) {
      const w = parseFloat(formData.weight);
      if (!isNaN(w)) {
        (newData as Record<string, string | string[] | number | undefined>).weight = nextUnit === 'in' 
          ? (w * 2.20462).toFixed(1) // to lbs
          : (w / 2.20462).toFixed(1); // to kg
      }
    }

    setFormData(newData);
    setUnit(nextUnit);
  };

  const fetchMeasurements = async () => {
    try {
      const response = await fetch('/api/measurements')
      if (response.ok) {
        const data: MeasurementsResponse = await response.json()
        if (data.measurements) {
          const m = data.measurements;
          const savedUnit = (m.unit as 'in' | 'cm') || 'in';
          setUnit(savedUnit);
          setFormData({
            bust: m.bust?.toString() || '',
            waist: m.waist?.toString() || '',
            hips: m.hips?.toString() || '',
            shoulder: m.shoulder?.toString() || '',
            armLength: m.armLength?.toString() || '',
            inseam: m.inseam?.toString() || '',
            height: m.height?.toString() || '',
            weight: m.weight?.toString() || '',
            neck: m.neck?.toString() || '',
            underbust: m.underbust?.toString() || '',
            hpsToWaist: m.hpsToWaist?.toString() || '',
            napeToWaist: m.napeToWaist?.toString() || '',
            bicep: m.bicep?.toString() || '',
            wrist: m.wrist?.toString() || '',
            thigh: m.thigh?.toString() || '',
            knee: m.knee?.toString() || '',
            ankle: m.ankle?.toString() || '',
            crotchRise: m.crotchRise?.toString() || '',
            topSize: m.topSize || '',
            bottomSize: m.bottomSize || '',
            dressSize: m.dressSize || '',
            shoeSize: m.shoeSize || '',
            bodyType: m.bodyType || '',
            stylePreferences: m.stylePreferences || [],
            preferredColors: m.preferredColors || [],
            notes: m.notes || '',
          })
        }
      }
    } catch (error) {
      console.error('Error fetching measurements:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeasurements()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const dataToSend = {
        unit,
        ...Object.fromEntries(
          Object.entries(formData).map(([key, value]) => [
            key,
            Array.isArray(value) ? value : value === '' ? undefined : isNaN(Number(value)) ? value : Number(value)
          ])
        ),
      }

      const response = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })

      if (response.ok) {
        fetchMeasurements()
      }
    } catch (error) {
      console.error('Error saving measurements:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleStylePreference = (preference: string) => {
    setFormData(prev => ({
      ...prev,
      stylePreferences: prev.stylePreferences.includes(preference)
        ? prev.stylePreferences.filter(p => p !== preference)
        : [...prev.stylePreferences, preference]
    }))
  }

  const togglePreferredColor = (color: string) => {
    setFormData(prev => ({
      ...prev,
      preferredColors: prev.preferredColors.includes(color)
        ? prev.preferredColors.filter(c => c !== color)
        : [...prev.preferredColors, color]
    }))
  }

  const styleOptions = [
    'CASUAL', 'FORMAL', 'BOHEMIAN', 'STREETWEAR', 'MINIMALIST',
    'ROMANTIC', 'ATHLETIC', 'VINTAGE', 'PROFESSIONAL', 'ECLECTIC'
  ]

  const colorOptions = [
    'BLACK', 'WHITE', 'GRAY', 'NAVY', 'RED', 'PINK', 'BLUE',
    'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'BROWN', 'BEIGE'
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-stone-50 pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          
          {/* Header Area: Compact & Clean */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-stone-100">
                  <Scissors className="text-stone-900" size={20} />
               </div>
               <div>
                  <h1 className="text-2xl font-black text-stone-900 tracking-tight">Measurement Studio</h1>
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Bespoke Specifications</p>
               </div>
            </div>

            <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-stone-100 shadow-sm">
               <div className="flex bg-stone-50 p-1 rounded-lg">
                  {['in', 'cm'].map((u) => (
                    <button 
                      key={u} 
                      onClick={handleToggleUnit}
                      className={cn(
                        "px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                        unit === u ? "bg-stone-900 text-white shadow-sm" : "text-stone-400 hover:text-stone-600"
                      )}
                    >
                       {u}
                    </button>
                  ))}
               </div>
               <Button 
                 onClick={() => (document.querySelector('form') as HTMLFormElement)?.requestSubmit()}
                 disabled={saving}
                 className="h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-blue-100"
               >
                  {saving ? <Loader2 className="animate-spin" /> : <><Save size={14} className="mr-2" /> Save Blueprint</>}
               </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Navigation Sidebar: Tighter */}
              <div className="lg:col-span-1 space-y-2">
                 {[
                    { id: 'CORE', label: 'Core Metrics', icon: Ruler },
                    { id: 'UPPER', label: 'Upper Body', icon: Shirt },
                    { id: 'LOWER', label: 'Lower Body', icon: User },
                 ].map((seg) => (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => setActiveSegment(seg.id as 'CORE' | 'UPPER' | 'LOWER')}
                      className={cn(
                        "w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-3",
                        activeSegment === seg.id 
                          ? "border-stone-900 bg-white shadow-md translate-x-1" 
                          : "border-transparent bg-stone-100/50 opacity-60 hover:opacity-100 hover:bg-white"
                      )}
                    >
                       <seg.icon size={16} className={activeSegment === seg.id ? "text-stone-900" : "text-stone-400"} />
                       <span className="text-[9px] font-black uppercase tracking-[0.15em]">{seg.label}</span>
                    </button>
                 ))}
              </div>

              {/* Dynamic Measurement Sections */}
              <div className="lg:col-span-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSegment}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <Card className="rounded-3xl border border-stone-100 shadow-sm bg-white">
                      <CardContent className="pt-16 p-8 space-y-8">
                        
                        {activeSegment === 'CORE' && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                             {[
                                { id: 'height', label: 'Height', help: 'Total height.' },
                                { id: 'weight', label: `Weight (${unit === 'in' ? 'lbs' : 'kg'})`, help: 'Total body mass.' },
                                { id: 'bust', label: 'Chest', help: 'Fullest part.' },
                                { id: 'waist', label: 'Waist', help: 'Natural waist.' },
                                { id: 'hips', label: 'Hips', help: 'Fullest seat.' },
                                { id: 'shoulder', label: 'Shoulder', help: 'Shoulder width.' },
                             ].map(f => (
                                <div key={f.id} className="space-y-3">
                                   <div className="flex justify-between px-1">
                                      <Label className="text-[9px] font-black uppercase tracking-widest text-stone-400">{f.label}</Label>
                                      <Tooltip>
                                         <TooltipTrigger><Info size={12} className="text-stone-200" /></TooltipTrigger>
                                         <TooltipContent side="top">{f.help}</TooltipContent>
                                      </Tooltip>
                                   </div>
                                   <div className="relative">
                                      <Input
                                        type="number"
                                        step="0.1"
                                        value={formData[f.id as keyof typeof formData] as string}
                                        onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })}
                                        className="h-12 rounded-xl text-sm font-black bg-stone-50 border-none pr-10 shadow-inner focus-visible:ring-1 focus-visible:ring-stone-200"
                                      />
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-stone-300 uppercase tracking-widest">
                                        {f.id === 'weight' ? (unit === 'in' ? 'lbs' : 'kg') : unit}
                                      </span>
                                   </div>
                                </div>
                             ))}
                          </div>
                        )}

                        {activeSegment === 'UPPER' && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                             {[
                                { id: 'neck', label: 'Neck', help: 'Around base of neck.' },
                                { id: 'armLength', label: 'Sleeve', help: 'Shoulder to wrist.' },
                                { id: 'bicep', label: 'Bicep', help: 'Upper arm circle.' },
                                { id: 'wrist', label: 'Wrist', help: 'Around wrist bone.' },
                                { id: 'underbust', label: 'Lower Chest', help: 'Under the bust.' },
                                { id: 'hpsToWaist', label: 'Shld-Waist', help: 'Front vertical.' },
                                { id: 'napeToWaist', label: 'Back Length', help: 'Neck to waist.' },
                             ].map(f => (
                                <div key={f.id} className="space-y-3">
                                   <div className="flex justify-between px-1">
                                      <Label className="text-[9px] font-black uppercase tracking-widest text-stone-400">{f.label}</Label>
                                      <Tooltip>
                                         <TooltipTrigger><Info size={12} className="text-stone-200" /></TooltipTrigger>
                                         <TooltipContent side="top">{f.help}</TooltipContent>
                                      </Tooltip>
                                   </div>
                                   <div className="relative">
                                      <Input
                                        type="number"
                                        step="0.1"
                                        value={formData[f.id as keyof typeof formData] as string}
                                        onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })}
                                        className="h-12 rounded-xl text-sm font-black bg-stone-50 border-none pr-10 shadow-inner focus-visible:ring-1 focus-visible:ring-stone-200"
                                      />
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-stone-300 uppercase tracking-widest">{unit}</span>
                                   </div>
                                </div>
                             ))}
                          </div>
                        )}

                        {activeSegment === 'LOWER' && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                             {[
                                { id: 'inseam', label: 'Inner Leg', help: 'Crotch to ankle.' },
                                { id: 'thigh', label: 'Thigh', help: 'Upper leg circle.' },
                                { id: 'knee', label: 'Knee', help: 'Around knee.' },
                                { id: 'ankle', label: 'Ankle', help: 'Around ankle bone.' },
                                { id: 'crotchRise', label: 'Seat Depth', help: 'Waist to crotch.' },
                             ].map(f => (
                                <div key={f.id} className="space-y-3">
                                   <div className="flex justify-between px-1">
                                      <Label className="text-[9px] font-black uppercase tracking-widest text-stone-400">{f.label}</Label>
                                      <Tooltip>
                                         <TooltipTrigger><Info size={12} className="text-stone-200" /></TooltipTrigger>
                                         <TooltipContent side="top">{f.help}</TooltipContent>
                                      </Tooltip>
                                   </div>
                                   <div className="relative">
                                      <Input
                                        type="number"
                                        step="0.1"
                                        value={formData[f.id as keyof typeof formData] as string}
                                        onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })}
                                        className="h-12 rounded-xl text-sm font-black bg-stone-50 border-none pr-10 shadow-inner focus-visible:ring-1 focus-visible:ring-stone-200"
                                      />
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-stone-300 uppercase tracking-widest">{unit}</span>
                                   </div>
                                </div>
                             ))}
                          </div>
                        )}

                      </CardContent>
                    </Card>
                  </motion.div>
                </AnimatePresence>
                
                {/* Secondary Preferences: Single Column / More Compact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                   <Card className="rounded-3xl border border-stone-100 shadow-sm p-6 bg-white">
                      <h3 className="text-[9px] font-black uppercase tracking-widest text-stone-900 mb-4 flex items-center gap-2">
                         <div className="w-6 h-6 rounded-lg bg-stone-50 flex items-center justify-center font-black text-[8px] text-stone-400">04</div>
                         Body Shape
                      </h3>
                      <Select
                        value={formData.bodyType}
                        onValueChange={(value) => setFormData({ ...formData, bodyType: value })}
                      >
                        <SelectTrigger className="h-10 rounded-xl bg-stone-50 border-none text-[10px] font-black uppercase tracking-widest px-6 focus:ring-1 focus:ring-stone-200">
                          <SelectValue placeholder="Identify body type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl p-1">
                          {['HOURGLASS', 'PEAR', 'APPLE', 'RECTANGLE', 'INVERTED_TRIANGLE'].map(bt => (
                            <SelectItem key={bt} value={bt} className="h-10 rounded-lg text-[9px] font-black uppercase tracking-widest">{bt.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </Card>

                   <Card className="rounded-3xl border border-stone-100 shadow-sm p-6 bg-white">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-stone-900 flex items-center gap-2">
                           <div className="w-6 h-6 rounded-lg bg-stone-50 flex items-center justify-center font-black text-[8px] text-stone-400">05</div>
                           Retail Sizes
                        </h3>
                        <Tooltip>
                           <TooltipTrigger><Info size={12} className="text-stone-300" /></TooltipTrigger>
                           <TooltipContent side="top">Reference sizes from brands you already wear (e.g. Nike, Zara).</TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                         {[
                           { id: 'topSize', label: 'Top' },
                           { id: 'bottomSize', label: 'Btm' },
                           { id: 'dressSize', label: 'Drs' },
                           { id: 'shoeSize', label: 'Shoe' }
                         ].map(s => (
                            <div key={s.id} className="space-y-1">
                               <p className="text-[7px] font-black uppercase text-stone-400 text-center">{s.label}</p>
                               <Input
                                 placeholder="M"
                                 value={formData[s.id as keyof typeof formData] as string}
                                 onChange={(e) => setFormData({ ...formData, [s.id]: e.target.value })}
                                 className="h-10 rounded-xl bg-stone-50 border-none text-center font-black uppercase tracking-widest text-[10px] focus-visible:ring-1 focus-visible:ring-stone-200 shadow-inner"
                               />
                            </div>
                         ))}
                      </div>
                   </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                   <Card className="rounded-3xl border border-stone-100 shadow-sm p-6 bg-white">
                      <h3 className="text-[9px] font-black uppercase tracking-widest text-stone-900 mb-6 flex items-center gap-2">
                         <div className="w-6 h-6 rounded-lg bg-stone-50 flex items-center justify-center font-black text-[8px] text-stone-400">06</div>
                         Primary Style
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {styleOptions.map((style) => (
                          <Badge
                            key={style}
                            variant={formData.stylePreferences.includes(style) ? "default" : "outline"}
                            className={cn(
                              "cursor-pointer px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                              formData.stylePreferences.includes(style) ? "bg-stone-900 text-white" : "bg-stone-50 border-none text-stone-400 hover:bg-stone-100"
                            )}
                            onClick={() => toggleStylePreference(style)}
                          >
                            {style.toLowerCase()}
                          </Badge>
                        ))}
                      </div>
                   </Card>

                   <Card className="rounded-3xl border border-stone-100 shadow-sm p-6 bg-white">
                      <h3 className="text-[9px] font-black uppercase tracking-widest text-stone-900 mb-6 flex items-center gap-2">
                         <div className="w-6 h-6 rounded-lg bg-stone-50 flex items-center justify-center font-black text-[8px] text-stone-400">07</div>
                         Color Likes
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {colorOptions.map((color) => (
                          <Badge
                            key={color}
                            variant={formData.preferredColors.includes(color) ? "default" : "outline"}
                            className={cn(
                              "cursor-pointer px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                              formData.preferredColors.includes(color) ? "bg-stone-900 text-white" : "bg-stone-50 border-none text-stone-400 hover:bg-stone-100"
                            )}
                            onClick={() => togglePreferredColor(color)}
                          >
                            {color.toLowerCase()}
                          </Badge>
                        ))}
                      </div>
                   </Card>
                </div>

                <Card className="rounded-3xl border border-stone-100 shadow-sm p-6 bg-white mt-6">
                   <h3 className="text-[9px] font-black uppercase tracking-widest text-stone-900 mb-4">Master Tailor Notes</h3>
                   <Textarea
                     value={formData.notes}
                     onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                     placeholder="Add special requirements..."
                     className="bg-stone-50 border-none rounded-xl p-4 text-[10px] font-medium shadow-inner focus-visible:ring-1 focus-visible:ring-stone-200"
                     rows={3}
                   />
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </TooltipProvider>
  )
}

function Loader2({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center gap-1", className)}>
       <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-duration:0.6s]" />
       <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.2s] [animation-duration:0.6s]" />
       <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.4s] [animation-duration:0.6s]" />
    </div>
  )
}
