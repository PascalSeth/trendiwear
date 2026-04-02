'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Camera, Loader2, ImageIcon, Instagram, Facebook, Link2, Clock, Globe 
} from 'lucide-react'
import { PaymentSetupForm } from '@/components/ui/payment-setup-form'

// --- Types ---
interface DayHours {
  enabled: boolean
  open: string
  close: string
}

interface BusinessHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  profileImage?: string
  role: string
  professionalProfile?: ProfessionalProfile
}

interface ProfessionalProfile {
  id: string
  businessName: string
  businessImage?: string
  coverImage?: string
  galleryImages?: string[]
  specializationId: string
  experience: number
  bio?: string
  portfolioUrl?: string
  location?: string
  latitude?: number
  longitude?: number
  availability?: string
  freeDeliveryThreshold?: number
  spotlightVideoUrl?: string
  slug?: string
  socialMedia?: SocialMedia[]
  paymentSetupComplete?: boolean
}

interface SocialMedia {
  id?: string
  platform: string
  url: string
}

interface ProfessionalType {
  id: string
  name: string
}

interface SettingsClientProps {
  initialProfile: UserProfile;
  specializations: ProfessionalType[];
}

const DEFAULT_HOURS: BusinessHours = {
  monday: { enabled: false, open: '09:00', close: '17:00' },
  tuesday: { enabled: false, open: '09:00', close: '17:00' },
  wednesday: { enabled: false, open: '09:00', close: '17:00' },
  thursday: { enabled: false, open: '09:00', close: '17:00' },
  friday: { enabled: false, open: '09:00', close: '17:00' },
  saturday: { enabled: false, open: '09:00', close: '17:00' },
  sunday: { enabled: false, open: '09:00', close: '17:00' },
}

const DAY_LABELS: Record<keyof BusinessHours, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

function parseAvailability(availability: string | null | undefined): BusinessHours {
  if (!availability) return DEFAULT_HOURS
  try {
    const parsed = JSON.parse(availability)
    return { ...DEFAULT_HOURS, ...parsed }
  } catch {
    return DEFAULT_HOURS
  }
}

export default function SettingsClient({ initialProfile, specializations }: SettingsClientProps) {
  const [profile] = useState<UserProfile>(initialProfile)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState<'profile' | 'business' | 'cover' | 'gallery' | null>(null)

  const [personalForm, setPersonalForm] = useState({
    firstName: initialProfile.firstName || '',
    lastName: initialProfile.lastName || '',
    phone: initialProfile.phone || '',
    profileImage: initialProfile.profileImage || '',
  })

  const pp = initialProfile.professionalProfile
  const [businessForm, setBusinessForm] = useState({
    businessName: pp?.businessName || '',
    businessImage: pp?.businessImage || '',
    coverImage: pp?.coverImage || '',
    galleryImages: pp?.galleryImages || [],
    specializationId: pp?.specializationId || '',
    experience: pp?.experience || 0,
    bio: pp?.bio || '',
    portfolioUrl: pp?.portfolioUrl || '',
    location: pp?.location || '',
    latitude: pp?.latitude || null as number | null,
    longitude: pp?.longitude || null as number | null,
    freeDeliveryThreshold: pp?.freeDeliveryThreshold || 0,
    spotlightVideoUrl: pp?.spotlightVideoUrl || '',
    slug: pp?.slug || '',
  })

  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>((pp?.socialMedia || []).map(s => ({ platform: s.platform, url: s.url })))

  const [businessHours, setBusinessHours] = useState<BusinessHours>(parseAvailability(pp?.availability))
  const isProfessional = ['PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'].includes(initialProfile.role)

  const savePersonalInfo = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personalForm),
      })
      if (res.ok) toast.success('Personal info saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveBusinessInfo = async () => {
    if (!pp) return
    setSaving(true)
    try {
      const res = await fetch(`/api/professional-profiles/${pp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...businessForm,
          availability: JSON.stringify(businessHours),
          socialMedia: socialMedia.filter(s => s.platform && s.url).map(s => ({
            platform: s.platform,
            url: s.url
          }))
        }),
      })
      if (res.ok) toast.success('Business info saved')
    } catch {
      toast.error('Failed to save business info')
    } finally {
      setSaving(false)
    }
  }

  const updateBusinessHours = (day: keyof BusinessHours, updates: Partial<DayHours>) => {
    const newHours = {
      ...businessHours,
      [day]: { ...businessHours[day], ...updates }
    };
    setBusinessHours(newHours);
  };

  const applyPreset = (preset: '9-5' | '24/7' | 'closed') => {
    const newHours = { ...businessHours };
    if (preset === '9-5') {
      Object.keys(newHours).forEach(day => {
        newHours[day as keyof BusinessHours] = { enabled: !['saturday', 'sunday'].includes(day), open: '09:00', close: '17:00' };
      });
    } else if (preset === '24/7') {
      Object.keys(newHours).forEach(day => {
        newHours[day as keyof BusinessHours] = { enabled: true, open: '00:00', close: '23:59' };
      });
    }
    setBusinessHours(newHours);
  };

  const updateSocialMedia = (platform: string, url: string) => {
    const exists = socialMedia.find(s => s.platform === platform);
    if (exists) {
      setSocialMedia(socialMedia.map(s => s.platform === platform ? { ...s, url } : s));
    } else {
      setSocialMedia([...socialMedia, { platform, url }]);
    }
  };

  const toggleSocial = (platform: string) => {
    const exists = socialMedia.find(s => s.platform === platform);
    if (exists) {
      setSocialMedia(socialMedia.filter(s => s.platform !== platform));
    } else {
      setSocialMedia([...socialMedia, { platform, url: '' }]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'business' | 'cover') => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(type)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (res.ok) {
        const data = await res.json()
        const url = data.url
        if (type === 'profile') setPersonalForm(p => ({ ...p, profileImage: url }))
        else if (type === 'business') setBusinessForm(p => ({ ...p, businessImage: url }))
        else if (type === 'cover') setBusinessForm(p => ({ ...p, coverImage: url }))
        toast.success('Image uploaded')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploadingImage(null)
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    setUploadingImage('gallery')
    try {
      const uploadedUrls: string[] = []
      
      const uploadPromises = files.map(async (file) => {
        const fd = new FormData(); 
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (res.ok) {
          const data = await res.json()
          uploadedUrls.push(data.url)
        } else {
          toast.error(`Failed to upload ${file.name}`)
        }
      })
      
      await Promise.all(uploadPromises)
      
      if (uploadedUrls.length > 0) {
        setBusinessForm(p => ({ ...p, galleryImages: [...p.galleryImages, ...uploadedUrls] }))
        toast.success(`Added ${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''} to gallery`)
      }
    } catch {
      toast.error('Upload process failed')
    } finally {
      setUploadingImage(null)
      e.target.value = '' // Reset input
    }
  }

  const removeGalleryImage = (index: number) => {
    setBusinessForm(p => ({
      ...p,
      galleryImages: p.galleryImages.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] pt-24 lg:pt-32 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <header className="mb-12 border-b border-stone-200 pb-8">
           <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-red-950 mb-4">User Settings</p>
           <h1 className="text-4xl md:text-6xl font-serif italic text-stone-950">Identity Archives.</h1>
        </header>

        <Tabs defaultValue="profile" className="space-y-12">
          <TabsList className="flex gap-8 bg-transparent border-b border-stone-100 h-auto p-0 rounded-none overflow-x-auto whitespace-nowrap scrollbar-hide">
             {['profile', 'business', 'payments', 'notifications'].map(tab => (
               <TabsTrigger 
                 key={tab} 
                 value={tab} 
                 className="px-0 py-4 text-[10px] font-mono uppercase tracking-[0.2em] data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-black bg-transparent rounded-none transition-all"
               >
                 {tab}
               </TabsTrigger>
             ))}
          </TabsList>

          <TabsContent value="profile" className="space-y-12">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4">
                   <div className="relative aspect-square rounded-3xl overflow-hidden group bg-stone-100 ring-1 ring-stone-900/5">
                      <Image src={personalForm.profileImage || "/placeholder-avatar.jpg"} alt="User" fill className="object-cover transition-all duration-700 group-hover:scale-110" />
                      <label className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                         {uploadingImage === 'profile' ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" />}
                         <input type="file" className="hidden" onChange={e => handleImageUpload(e, 'profile')} />
                      </label>
                   </div>
                </div>
                <div className="lg:col-span-8 space-y-8">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-400">First Name</Label>
                         <Input value={personalForm.firstName} onChange={e => setPersonalForm({...personalForm, firstName: e.target.value})} className="bg-white border-stone-200 h-14 rounded-2xl" />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Last Name</Label>
                         <Input value={personalForm.lastName} onChange={e => setPersonalForm({...personalForm, lastName: e.target.value})} className="bg-white border-stone-200 h-14 rounded-2xl" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Email (Permanent)</Label>
                      <Input value={profile.email} disabled className="bg-stone-50 border-stone-200 h-14 rounded-2xl opacity-50 font-mono text-xs" />
                   </div>
                   <Button onClick={savePersonalInfo} disabled={saving} className="w-full h-16 bg-stone-950 text-white rounded-full text-[10px] font-mono uppercase tracking-[0.3em] hover:bg-black transition-all">
                      {saving ? "Archiving..." : "Update Archive"}
                   </Button>
                </div>
             </div>
          </TabsContent>

          {isProfessional && (
            <TabsContent value="business" className="space-y-12">
               <div className="space-y-12">
                  <div className="relative h-64 rounded-3xl overflow-hidden group bg-stone-100 ring-1 ring-stone-900/5">
                     <Image src={businessForm.coverImage || "/placeholder-cover.jpg"} alt="Cover" fill className="object-cover" />
                     <label className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                        {uploadingImage === 'cover' ? <Loader2 className="animate-spin text-white" /> : <ImageIcon className="text-white" />}
                        <input type="file" className="hidden" onChange={e => handleImageUpload(e, 'cover')} />
                     </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Business Name</Label>
                        <Input value={businessForm.businessName} onChange={e => setBusinessForm({...businessForm, businessName: e.target.value})} className="h-14 rounded-2xl" />
                     </div>
                     
                     <div className="space-y-2">
                        <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Specialization</Label>
                        <select
                          value={businessForm.specializationId}
                          onChange={e => setBusinessForm({...businessForm, specializationId: e.target.value})}
                          className="w-full h-14 rounded-2xl border border-stone-200 px-4 bg-white text-sm outline-none focus:border-stone-900 transition-colors"
                        >
                           <option value="" disabled>Select your craft</option>
                           {specializations?.map(spec => (
                             <option key={spec.id} value={spec.id}>{spec.name}</option>
                           ))}
                        </select>
                     </div>

                     <div className="space-y-2">
                        <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Atelier Slug</Label>
                        <div className="flex">
                           <span className="h-14 flex items-center px-4 bg-stone-100 border border-r-0 border-stone-200 rounded-l-2xl text-[10px] font-mono">/tz/</span>
                           <Input value={businessForm.slug} onChange={e => setBusinessForm({...businessForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="h-14 rounded-l-none rounded-r-2xl" />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Experience (Years)</Label>
                        <Input type="number" min="0" value={businessForm.experience} onChange={e => setBusinessForm({...businessForm, experience: parseInt(e.target.value) || 0})} className="h-14 rounded-2xl" />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Business Bio</Label>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => applyPreset('9-5')}
                            className="text-[10px] font-mono px-3 py-1.5 bg-stone-100 border border-stone-200 hover:border-stone-400 transition-colors uppercase tracking-widest rounded-lg"
                          >
                            Weekdays
                          </button>
                          <button 
                            type="button"
                            onClick={() => applyPreset('24/7')}
                            className="text-[10px] font-mono px-3 py-1.5 bg-stone-100 border border-stone-200 hover:border-stone-400 transition-colors uppercase tracking-widest rounded-lg"
                          >
                            24/7
                          </button>
                        </div>
                     </div>
                     <Textarea value={businessForm.bio} onChange={e => setBusinessForm({...businessForm, bio: e.target.value})} className="min-h-[150px] rounded-3xl p-6 font-serif italic text-lg" />
                  </div>

                  {/* Portfolio / Gallery Registry */}
                  <div className="space-y-8 bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
                    <header className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white">
                        <ImageIcon size={14} />
                      </div>
                      <div>
                        <h3 className="text-sm font-serif font-medium">Portfolio Gallery</h3>
                        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Showcase your best work</p>
                      </div>
                    </header>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {businessForm.galleryImages.map((img, i) => (
                        <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden group bg-stone-100">
                          <Image src={img} alt={`Gallery ${i}`} fill className="object-cover" />
                          <button type="button" onClick={() => removeGalleryImage(i)} className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold leading-none flex items-center justify-center">×</button>
                        </div>
                      ))}
                      <div className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-stone-200 hover:border-stone-400 transition-colors bg-stone-50 flex items-center justify-center cursor-pointer overflow-hidden">
                        {uploadingImage === 'gallery' ? <Loader2 className="w-6 h-6 animate-spin text-stone-400" /> : <div className="text-center"><Camera className="w-6 h-6 mx-auto mb-2 text-stone-300" /><span className="text-[10px] font-mono uppercase text-stone-400">Add Photos</span></div>}
                        <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleGalleryUpload} />
                      </div>
                    </div>
                  </div>

                  {/* New Availability Registry */}
                  <div className="space-y-8 bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
                    <header className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white">
                        <Clock size={14} />
                      </div>
                      <div>
                        <h3 className="text-sm font-serif font-medium">Availability Registry</h3>
                        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Set your atelier hours</p>
                      </div>
                    </header>

                    <div className="space-y-6">
                      <div className="flex justify-between items-center gap-2">
                        {(Object.keys(businessHours) as Array<keyof BusinessHours>).map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => updateBusinessHours(day, { enabled: !businessHours[day].enabled })}
                            className={cn(
                              "w-11 h-11 rounded-full text-[10px] font-bold transition-all border flex items-center justify-center",
                              businessHours[day].enabled 
                                ? "bg-stone-900 border-stone-900 text-stone-100 shadow-md scale-105" 
                                : "bg-stone-50 border-stone-200 text-stone-400 hover:border-stone-400"
                            )}
                          >
                            {DAY_LABELS[day]}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence>
                          {(Object.keys(businessHours) as Array<keyof BusinessHours>).filter(d => businessHours[d].enabled).map((day) => (
                            <motion.div 
                              key={day} 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="flex items-center justify-between p-5 bg-stone-50 border border-stone-100 rounded-3xl"
                            >
                              <span className="text-xs font-mono uppercase tracking-widest text-stone-900 font-bold w-12">{DAY_LABELS[day]}</span>
                              <div className="flex items-center gap-3">
                                <select 
                                  value={businessHours[day].open}
                                  onChange={(e) => updateBusinessHours(day, { open: e.target.value })}
                                  className="bg-transparent text-[11px] font-mono border-b border-stone-200 focus:border-stone-900 outline-none py-1"
                                >
                                  {Array.from({ length: 24 }).map((_, i) => {
                                    const hour = i.toString().padStart(2, '0') + ':00';
                                    return <option key={hour} value={hour}>{hour}</option>;
                                  })}
                                </select>
                                <span className="text-stone-300">—</span>
                                <select 
                                  value={businessHours[day].close}
                                  onChange={(e) => updateBusinessHours(day, { close: e.target.value })}
                                  className="bg-transparent text-[11px] font-mono border-b border-stone-200 focus:border-stone-900 outline-none py-1"
                                >
                                  {Array.from({ length: 24 }).map((_, i) => {
                                    const hour = i.toString().padStart(2, '0') + ':00';
                                    return <option key={hour} value={hour}>{hour}</option>;
                                  })}
                                </select>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                   {/* Social Registry */}
                   <div className="space-y-8 bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
                      <header className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-900 border border-stone-200">
                          <Link2 size={14} />
                        </div>
                        <div>
                          <h3 className="text-sm font-serif font-medium">Digital Presence</h3>
                          <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Connect your social platforms</p>
                        </div>
                      </header>

                      <div className="space-y-6">
                        <div className="flex gap-4 p-2 bg-stone-50 rounded-2xl w-fit border border-stone-100">
                          {[
                            { id: 'INSTAGRAM', Icon: Instagram, color: 'hover:text-pink-600' },
                            { id: 'FACEBOOK', Icon: Facebook, color: 'hover:text-blue-800' },
                            { id: 'WEBSITE', Icon: Globe, color: 'hover:text-stone-900' }
                          ].map((platform) => {
                            const isActive = socialMedia.some(sm => sm.platform === platform.id);
                            return (
                              <button
                                key={platform.id}
                                type="button"
                                onClick={() => toggleSocial(platform.id)}
                                className={cn(
                                  "p-3 rounded-xl transition-all duration-300",
                                  isActive 
                                    ? "bg-white text-stone-900 shadow-sm scale-110 ring-1 ring-stone-200" 
                                    : "text-stone-400 hover:bg-white " + platform.color
                                )}
                              >
                                <platform.Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                              </button>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <AnimatePresence>
                            {socialMedia.map((sm) => {
                               const platformInfo = [
                                 { id: 'INSTAGRAM', prefix: 'instagram.com/', placeholder: 'handle', Icon: Instagram },
                                 { id: 'FACEBOOK', prefix: 'facebook.com/', placeholder: 'page', Icon: Facebook },
                                 { id: 'WEBSITE', prefix: 'https://', placeholder: 'yourdomain.com', Icon: Globe }
                               ].find(p => p.id === sm.platform);

                               if (!platformInfo) return null;

                               return (
                                 <motion.div
                                   key={sm.platform}
                                   initial={{ opacity: 0, y: 10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   exit={{ opacity: 0, scale: 0.95 }}
                                   className="relative"
                                 >
                                   <div className="flex items-center gap-3 bg-stone-50 p-5 rounded-3xl border border-stone-100 focus-within:border-stone-900 focus-within:bg-white transition-all">
                                     <platformInfo.Icon size={16} className="text-stone-400" />
                                     <span className="text-[10px] font-mono text-stone-300 uppercase tracking-tighter w-24 truncate">{platformInfo.prefix}</span>
                                     <input
                                       type="text"
                                       value={sm.url}
                                       onChange={(e) => updateSocialMedia(sm.platform, e.target.value)}
                                       placeholder={platformInfo.placeholder}
                                       className="bg-transparent flex-1 text-sm text-stone-900 outline-none placeholder-stone-300 font-medium"
                                     />
                                   </div>
                                 </motion.div>
                               );
                            })}
                          </AnimatePresence>
                        </div>
                      </div>
                   </div>

                   <Button onClick={saveBusinessInfo} disabled={saving} className="w-full h-16 bg-stone-950 text-white rounded-full text-[10px] font-mono uppercase tracking-[0.3em] hover:bg-black transition-all">
                      Save Business Profile
                  </Button>
               </div>
            </TabsContent>
          )}

          <TabsContent value="payments">
             <div className="max-w-2xl mx-auto space-y-8">
                <header className="text-center space-y-4">
                   <h2 className="text-3xl font-serif italic">Monetization Registry.</h2>
                   <p className="text-stone-500 font-mono text-[10px] uppercase tracking-widest">Connect your bank or wallet to receive payouts.</p>
                </header>
                <PaymentSetupForm />
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
