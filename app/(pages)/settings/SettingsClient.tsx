'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Camera, Loader2, ImageIcon, Instagram, Facebook, Link2, Clock, Globe, Bell, BellOff, CheckCircle2,
  Plus, Trash2, ChevronDown, ChevronUp, FolderPlus
} from 'lucide-react'
import { useEffect } from 'react'
import { PaymentSetupForm } from '@/components/ui/payment-setup-form'
import { useSession } from 'next-auth/react'

// --- Constants & Helper ---
const BIO_WORD_LIMIT = 60;
const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

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
  image?: string
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
  portfolioCollections?: PortfolioCollection[]
}

interface PortfolioCollection {
  id: string
  name: string
  description?: string
  images: string[]
  coverImage?: string
  order: number
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
  const router = useRouter();
  const [profile] = useState<UserProfile>(initialProfile)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState<'profile' | 'business' | 'cover' | 'gallery' | null>(null)
  const [permissionState, setPermissionState] = useState<string>('default')
  const { update } = useSession()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission)
    }
  }, [])

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Notifications not supported in this browser')
      return;
    }
    
    const permission = await window.Notification.requestPermission();
    setPermissionState(permission);

    if (permission === 'granted') {
      new window.Notification('TrendiZip Alerts Enabled', {
        body: 'You will now receive desktop notifications for new activity.',
        icon: '/navlogo.png',
      });
      toast.success('Desktop alerts enabled!')
    } else if (permission === 'denied') {
      toast.error('Permission denied. Please enable in browser settings.')
    }
  };

  const [personalForm, setPersonalForm] = useState({
    firstName: initialProfile.firstName || '',
    lastName: initialProfile.lastName || '',
    phone: initialProfile.phone || '',
    profileImage: initialProfile.profileImage || initialProfile.image || '',
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
  const [portfolioCollections, setPortfolioCollections] = useState<PortfolioCollection[]>(pp?.portfolioCollections || [])
  const [isAddingCollection, setIsAddingCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null)

  const isProfessionalRole = ['PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'].includes(initialProfile.role)
  const hasProfessionalProfile = !!initialProfile.professionalProfile
  const isProfessional = isProfessionalRole && hasProfessionalProfile

  const savePersonalInfo = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personalForm),
      })
      if (res.ok) {
        // Sync session image if profile image was updated
        await update({
          name: `${personalForm.firstName} ${personalForm.lastName}`,
          firstName: personalForm.firstName,
          lastName: personalForm.lastName,
          image: personalForm.profileImage,
        })
        toast.success('Personal info saved')
      }
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveBusinessInfo = async () => {
    if (!pp) return
    if (countWords(businessForm.bio) > BIO_WORD_LIMIT) {
      return toast.error(`Your bio is too long. Please shorten it to ${BIO_WORD_LIMIT} words or less.`);
    }
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

  // Removed unused applyPreset to fix ESLint error

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


  // --- Portfolio Collection Logic ---
  const createCollection = async () => {
    if (!newCollectionName.trim()) return
    try {
      const res = await fetch('/api/professional-profiles/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName })
      })
      if (res.ok) {
        const newCollection = await res.json()
        setPortfolioCollections([...portfolioCollections, newCollection])
        setNewCollectionName('')
        setIsAddingCollection(false)
        setExpandedCollection(newCollection.id)
        toast.success('Collection created')
      }
    } catch {
      toast.error('Failed to create collection')
    }
  }

  const deleteCollection = async (id: string) => {
    try {
      const res = await fetch(`/api/professional-profiles/collections?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPortfolioCollections(portfolioCollections.filter(c => c.id !== id))
        toast.success('Collection removed')
      }
    } catch {
      toast.error('Failed to delete')
    }
  }

  const updateCollection = async (id: string, updates: Partial<PortfolioCollection>) => {
    try {
      const collection = portfolioCollections.find(c => c.id === id)
      if (!collection) return
      
      const res = await fetch('/api/professional-profiles/collections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...collection, ...updates })
      })
      if (res.ok) {
        const updated = await res.json()
        setPortfolioCollections(portfolioCollections.map(c => c.id === id ? updated : c))
      }
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleCollectionUpload = async (e: React.ChangeEvent<HTMLInputElement>, collectionId: string) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    setUploadingImage('gallery')
    try {
      const uploadedUrls: string[] = []
      const uploadPromises = files.map(async (file) => {
        const fd = new FormData(); fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (res.ok) {
          const data = await res.json()
          uploadedUrls.push(data.url)
        }
      })
      await Promise.all(uploadPromises)
      
      const collection = portfolioCollections.find(c => c.id === collectionId)
      if (collection && uploadedUrls.length > 0) {
        updateCollection(collectionId, { 
          images: [...collection.images, ...uploadedUrls] 
        })
        toast.success(`Added ${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''}`)
      }
    } finally {
      setUploadingImage(null)
      e.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] pt-24 lg:pt-32 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <header className="mb-12 border-b border-stone-200 pb-8">
           <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-red-950 mb-4">App Settings</p>
           <h1 className="text-4xl md:text-6xl font-serif italic text-stone-950">Settings.</h1>
        </header>

        <Tabs defaultValue="profile" className="space-y-12">
          <TabsList className="flex gap-8 bg-transparent border-b border-stone-100 h-auto p-0 rounded-none overflow-x-auto whitespace-nowrap scrollbar-hide">
             {['profile', 'business', 'payments', 'notifications'].map(tab => {
                if ((tab === 'business' || tab === 'payments') && !isProfessional) return null;
                return (
                  <TabsTrigger 
                    key={tab} 
                    value={tab} 
                    className="px-0 py-4 text-[10px] font-mono uppercase tracking-[0.2em] data-[state=active]:text-black data-[state=active]:border-b-2 data-[state=active]:border-black bg-transparent rounded-none transition-all relative group/tab"
                  >
                    {tab}
                    <motion.span 
                      className="absolute bottom-0 left-0 w-full h-[1px] bg-stone-900 origin-left scale-x-0 group-hover/tab:scale-x-100 transition-transform duration-300" 
                    />
                  </TabsTrigger>
                );
             })}
          </TabsList>

          <TabsContent value="profile" className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                 <div className="lg:col-span-4 space-y-8">
                    <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden group bg-stone-100 ring-1 ring-stone-900/5 shadow-2xl">
                       <Image 
                        src={personalForm.profileImage || profile.image || "/placeholder-avatar.jpg"} 
                        alt="User" 
                        fill 
                        className="object-cover transition-all duration-1000 group-hover:scale-110 grayscale-[0.5] group-hover:grayscale-0" 
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 to-transparent opacity-60" />
                       <label className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer backdrop-blur-[2px]">
                          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110">
                            {uploadingImage === 'profile' ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" size={24} />}
                          </div>
                          <span className="text-[10px] font-mono text-white uppercase tracking-[0.2em]">Upload Photo</span>
                          <input type="file" className="hidden" onChange={e => handleImageUpload(e, 'profile')} />
                       </label>
                    </div>

                    {!isProfessional && (
                      <div className="p-8 rounded-[2rem] bg-stone-900 text-white space-y-6 relative overflow-hidden group/cta">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -mr-16 -mt-16 rounded-full transition-colors group-hover/cta:bg-red-500/20" />
                        <div className="relative space-y-4">
                          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400">Professional Account</p>
                          <h3 className="text-2xl font-serif italic leading-tight">Upgrade to Professional.</h3>
                          <p className="text-xs text-stone-400 leading-relaxed font-mono">Unlock business tools, portfolio hosting, and payment settings.</p>
                          <Button 
                            onClick={() => router.push('/register-as-professional')} 
                            className="w-full h-12 bg-white text-stone-950 rounded-full text-[10px] font-mono uppercase tracking-widest hover:bg-stone-200"
                          >
                            Get Started
                          </Button>
                        </div>
                      </div>
                    )}
                 </div>
                 <div className="lg:col-span-8 space-y-12">
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <Label className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400">First Name</Label>
                            <Input value={personalForm.firstName} onChange={e => setPersonalForm({...personalForm, firstName: e.target.value})} className="bg-white border-stone-100 h-16 rounded-2xl px-6 focus:ring-0 focus:border-stone-900 transition-all text-lg font-serif italic" />
                         </div>
                         <div className="space-y-4">
                            <Label className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400">Last Name</Label>
                            <Input value={personalForm.lastName} onChange={e => setPersonalForm({...personalForm, lastName: e.target.value})} className="bg-white border-stone-100 h-16 rounded-2xl px-6 focus:ring-0 focus:border-stone-900 transition-all text-lg font-serif italic" />
                         </div>
                      </div>
                      <div className="space-y-4">
                         <Label className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400">Email Address</Label>
                         <div className="relative">
                            <Input value={profile.email} disabled className="bg-stone-50 border-stone-100 h-16 rounded-2xl px-6 opacity-60 font-mono text-sm" />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2">
                               <CheckCircle2 size={16} className="text-emerald-500" />
                            </div>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <Label className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400">Phone Number</Label>
                         <Input value={personalForm.phone} onChange={e => setPersonalForm({...personalForm, phone: e.target.value})} className="bg-white border-stone-100 h-16 rounded-2xl px-6 focus:ring-0 focus:border-stone-900 transition-all font-mono" placeholder="+1 (000) 000-0000" />
                      </div>
                    </div>

                    <div className="pt-8 border-t border-stone-100">
                      <Button onClick={savePersonalInfo} disabled={saving} className="w-full h-20 bg-stone-950 text-white rounded-[2rem] text-xs font-mono uppercase tracking-[0.4em] hover:bg-black transition-all shadow-xl hover:shadow-2xl active:scale-[0.98]">
                         {saving ? (
                           <div className="flex items-center gap-3">
                             <Loader2 className="animate-spin" size={16} />
                             <span>Archiving...</span>
                           </div>
                         ) : "Save Changes"}
                      </Button>
                    </div>
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

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                         <Label className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400">Business Name</Label>
                         <Input value={businessForm.businessName} onChange={e => setBusinessForm({...businessForm, businessName: e.target.value})} className="h-16 rounded-2xl border-stone-100 px-6 text-lg font-serif italic" />
                      </div>
                      
                      <div className="space-y-4">
                         <Label className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400">Category</Label>
                         <div className="relative">
                           <select
                             value={businessForm.specializationId}
                             onChange={e => setBusinessForm({...businessForm, specializationId: e.target.value})}
                             className="w-full h-16 rounded-2xl border border-stone-100 px-6 bg-white text-sm outline-none focus:border-stone-900 transition-all appearance-none font-mono"
                           >
                              <option value="" disabled>Select your craft</option>
                              {specializations?.map(spec => (
                                <option key={spec.id} value={spec.id}>{spec.name}</option>
                              ))}
                           </select>
                           <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" />
                         </div>
                      </div>

                      <div className="space-y-4">
                         <Label className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400">Profile URL (Slug)</Label>
                         <div className="flex group/slug">
                            <span className="h-16 flex items-center px-6 bg-stone-50 border border-r-0 border-stone-100 rounded-l-2xl text-[10px] font-mono text-stone-400 transition-colors group-focus-within/slug:border-stone-900 group-focus-within/slug:text-stone-900">/tz/</span>
                            <Input value={businessForm.slug} onChange={e => setBusinessForm({...businessForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="h-16 rounded-l-none rounded-r-2xl border-stone-100 px-6 font-mono text-sm" />
                         </div>
                      </div>

                      <div className="space-y-4">
                         <Label className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400">Experience</Label>
                         <div className="relative">
                            <Input type="number" min="0" value={businessForm.experience} onChange={e => setBusinessForm({...businessForm, experience: parseInt(e.target.value) || 0})} className="h-16 rounded-2xl border-stone-100 px-6 font-mono" />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase tracking-widest text-stone-300">Years</span>
                         </div>
                      </div>
                   </div>

                    <div className="space-y-6">
                       <div className="flex justify-between items-center">
                          <Label className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400">Business Bio</Label>
                          <span className={cn(
                            "text-[9px] font-mono uppercase tracking-widest",
                            countWords(businessForm.bio) > BIO_WORD_LIMIT ? "text-red-500 font-bold" : "text-stone-400"
                          )}>
                            {countWords(businessForm.bio)} / {BIO_WORD_LIMIT} words
                          </span>
                       </div>
                       <Textarea 
                         value={businessForm.bio} 
                         onChange={e => setBusinessForm({...businessForm, bio: e.target.value})} 
                         className={cn(
                           "min-h-[200px] rounded-[2rem] p-8 font-serif italic text-xl border-stone-100 bg-white leading-relaxed focus:border-stone-900 transition-all",
                           countWords(businessForm.bio) > BIO_WORD_LIMIT && "border-red-200 bg-red-50/10 focus:border-red-500"
                         )}
                         placeholder="Describe your business..."
                       />
                       {countWords(businessForm.bio) > BIO_WORD_LIMIT && (
                         <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest animate-pulse">
                           Registry Alert: Bio exceeds the {BIO_WORD_LIMIT} word limit.
                         </p>
                       )}
                    </div>

                  {/* Portfolio Collections */}
                  <div className="space-y-8 bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
                    <header className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white">
                          <ImageIcon size={14} />
                        </div>
                        <div>
                          <h3 className="text-sm font-serif font-medium">Portfolio Collections</h3>
                          <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Showcase your work in collections</p>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full font-mono text-[9px] uppercase tracking-widest h-10 px-4"
                        onClick={() => setIsAddingCollection(true)}
                      >
                        <Plus size={14} className="mr-2" /> New Collection
                      </Button>
                    </header>

                    {isAddingCollection && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-stone-50 p-6 rounded-3xl border border-dashed border-stone-200 space-y-4">
                        <Input 
                          placeholder="Collection Name (e.g., Bridal Gala 2024)" 
                          value={newCollectionName}
                          onChange={e => setNewCollectionName(e.target.value)}
                          className="h-12 rounded-xl"
                        />
                        <div className="flex justify-end gap-3">
                           <Button type="button" variant="ghost" className="text-[10px] uppercase font-mono h-10 px-4" onClick={() => setIsAddingCollection(false)}>Cancel</Button>
                           <Button type="button" className="text-[10px] uppercase font-mono h-10 px-4 bg-stone-900" onClick={createCollection}>Create</Button>
                        </div>
                      </motion.div>
                    )}

                    <div className="space-y-4">
                      {portfolioCollections.map((collection) => (
                        <div key={collection.id} className="border border-stone-100 rounded-3xl overflow-hidden group/coll bg-white">
                          <div 
                            className="p-5 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors"
                            onClick={() => setExpandedCollection(expandedCollection === collection.id ? null : collection.id)}
                          >
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-16 rounded-lg bg-stone-100 overflow-hidden relative border border-stone-200">
                                  {collection.coverImage || (collection.images && collection.images[0]) ? (
                                    <Image src={collection.coverImage || collection.images[0]} alt="" fill className="object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-300"><ImageIcon size={16}/></div>
                                  )}
                               </div>
                               <div>
                                  <h4 className="text-sm font-serif font-medium text-stone-900">{collection.name}</h4>
                                  <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">{collection.images.length} Items</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <button 
                                onClick={(e) => { e.stopPropagation(); deleteCollection(collection.id); }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover/coll:opacity-100"
                               >
                                 <Trash2 size={14} />
                               </button>
                               {expandedCollection === collection.id ? <ChevronUp size={16} className="text-stone-400"/> : <ChevronDown size={16} className="text-stone-400"/>}
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedCollection === collection.id && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-stone-100"
                              >
                                <div className="p-6 space-y-6 bg-stone-50/50">
                                  <div className="space-y-2">
                                     <Label className="text-[9px] font-mono uppercase text-stone-400 tracking-widest">Description (Optional)</Label>
                                     <Textarea 
                                      value={collection.description || ''} 
                                      onChange={e => updateCollection(collection.id, { description: e.target.value })}
                                      className="min-h-[80px] rounded-2xl bg-white text-sm"
                                      placeholder="Tell the story of this collection..."
                                     />
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {collection.images.map((img, i) => (
                                      <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden group/img bg-stone-200">
                                         <Image src={img} alt="" fill className="object-cover" />
                                         <button 
                                          type="button" 
                                          onClick={() => updateCollection(collection.id, { images: collection.images.filter((_, idx) => idx !== i) })}
                                          className="absolute top-1 right-1 bg-black/50 text-white w-5 h-5 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-[10px]"
                                         >
                                           ×
                                         </button>
                                         <button 
                                          type="button" 
                                          onClick={() => updateCollection(collection.id, { coverImage: img })}
                                          className={cn(
                                            "absolute bottom-1 right-1 px-2 py-1 rounded-md text-[8px] font-mono uppercase tracking-tighter transition-all",
                                            collection.coverImage === img ? "bg-emerald-500 text-white" : "bg-black/50 text-white opacity-0 group-hover/img:opacity-100 hover:bg-black"
                                          )}
                                         >
                                           {collection.coverImage === img ? 'Cover' : 'Set Cover'}
                                         </button>
                                      </div>
                                    ))}
                                    <div className="relative aspect-[3/4] rounded-xl border border-dashed border-stone-300 hover:border-stone-500 transition-colors flex flex-col items-center justify-center cursor-pointer bg-white">
                                      {uploadingImage === 'gallery' ? (
                                        <Loader2 className="animate-spin text-stone-400" size={16}/>
                                      ) : (
                                        <>
                                          <Plus size={16} className="text-stone-300 mb-1"/>
                                          <span className="text-[8px] font-mono uppercase text-stone-400">Add Works</span>
                                        </>
                                      )}
                                      <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleCollectionUpload(e, collection.id)} />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}

                      {portfolioCollections.length === 0 && !isAddingCollection && (
                        <div className="py-12 flex flex-col items-center justify-center text-stone-300 border border-dashed border-stone-200 rounded-[2rem]">
                           <FolderPlus size={32} className="mb-4 opacity-20" />
                           <p className="text-[10px] font-mono uppercase tracking-[0.2em] font-medium">Archive Empty</p>
                           <p className="text-[9px] font-mono uppercase tracking-widest mt-1">Start by creating your first work group</p>
                        </div>
                      )}

                      {/* Legacy Gallery Link/Warning */}
                      {businessForm.galleryImages.length > 0 && (
                        <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <ImageIcon className="text-amber-600" size={16}/>
                              <p className="text-[10px] font-mono text-amber-800 uppercase tracking-widest leading-relaxed">
                                You have {businessForm.galleryImages.length} legacy images. Please reorganize them into collections for visibility.
                              </p>
                           </div>
                           <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[9px] uppercase font-mono text-amber-900 h-8"
                            onClick={() => {
                              // Optional: Automated migration helper logic here if needed
                              toast.info("Manually add these to your new collections above.")
                            }}
                           >
                              Dismiss
                           </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* New Availability Registry */}
                  <div className="space-y-8 bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
                    <header className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white">
                        <Clock size={14} />
                      </div>
                      <div>
                        <h3 className="text-sm font-serif font-medium">Business Hours</h3>
                        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Set your shop hours</p>
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

                   {/* Social Media */}
                   <div className="space-y-8 bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
                      <header className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-900 border border-stone-200">
                          <Link2 size={14} />
                        </div>
                        <div>
                          <h3 className="text-sm font-serif font-medium">Social Media</h3>
                          <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Connect your digital profiles</p>
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

                   <div className="pt-12 border-t border-stone-100">
                      <Button onClick={saveBusinessInfo} disabled={saving} className="w-full h-20 bg-stone-950 text-white rounded-[2rem] text-xs font-mono uppercase tracking-[0.4em] hover:bg-black transition-all shadow-xl hover:shadow-2xl active:scale-[0.98]">
                         {saving ? (
                           <div className="flex items-center gap-3">
                             <Loader2 className="animate-spin" size={16} />
                             <span>Archiving Registry...</span>
                           </div>
                         ) : "Save Business Settings"}
                      </Button>
                   </div>
               </div>
            </TabsContent>
          )}

          <TabsContent value="notifications" className="space-y-12">
             <div className="max-w-2xl mx-auto space-y-8">
                <header className="text-center space-y-4 mb-20">
                   <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-red-950">Notifications</p>
                   <h2 className="text-4xl md:text-6xl font-serif italic text-stone-950">Alerts.</h2>
                </header>

                <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm relative overflow-hidden group">
                  {/* Decorative Gradient */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/50 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-red-100/50 transition-colors duration-700" />
                  
                  <div className="relative flex flex-col md:flex-row items-center gap-8">
                    <div className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500",
                      permissionState === 'granted' ? "bg-emerald-50 text-emerald-600 scale-110" : "bg-stone-50 text-stone-400"
                    )}>
                      {permissionState === 'granted' ? <Bell className="animate-pulse" size={32} /> : <BellOff size={32} />}
                    </div>
                    
                    <div className="flex-1 text-center md:text-left space-y-2">
                       <h3 className="text-xl font-serif font-medium text-stone-900">Desktop Activity Alerts</h3>
                       <p className="text-sm text-stone-500 leading-relaxed max-w-sm">
                         Receive real-time notifications for new messages, orders, and booking confirmations even when you are not actively looking at the site.
                       </p>
                    </div>

                    <div className="w-full md:w-auto">
                      {permissionState === 'granted' ? (
                        <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                           <CheckCircle2 size={16} />
                           <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Active</span>
                        </div>
                      ) : (
                        <Button 
                          onClick={requestNotificationPermission}
                          className="w-full md:w-auto h-14 px-8 bg-stone-950 text-white rounded-2xl text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                          Enable Alerts
                        </Button>
                      )}
                    </div>
                  </div>

                  {permissionState === 'denied' && (
                    <div className="mt-8 p-4 bg-red-50 text-red-900 rounded-2xl text-xs font-mono text-center border border-red-100">
                      Notifications are currently blocked by your browser. Please reset permissions in your address bar to enable alerts.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-stone-50 rounded-[2rem] border border-stone-100 space-y-4">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Email Updates</p>
                    <p className="text-sm text-stone-600 italic font-serif">Always Active</p>
                    <p className="text-[10px] text-stone-400 leading-relaxed font-mono">Critical alerts regarding your account and transactions are sent via email for your records.</p>
                  </div>
                  <div className="p-8 bg-stone-50 rounded-[2rem] border border-stone-100 space-y-4">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Activity Bell</p>
                    <p className="text-sm text-stone-600 italic font-serif">Always Active</p>
                    <p className="text-[10px] text-stone-400 leading-relaxed font-mono">The in-app notification center tracks all your digital footprints across the platform.</p>
                  </div>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="payments">
             <div className="max-w-2xl mx-auto space-y-8">
                <header className="text-center space-y-4 mb-20">
                   <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-red-950">Payments</p>
                   <h2 className="text-4xl md:text-6xl font-serif italic text-stone-950">Payouts.</h2>
                </header>
                <PaymentSetupForm />
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
