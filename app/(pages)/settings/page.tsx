'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Settings, Save, User, Mail, Phone, Building2, MapPin, Globe, 
  Camera, Shield, Bell, Lock, Loader2, CheckCircle2, Image as ImageIcon,
  Instagram, Facebook, Link2, Clock, Wallet
} from 'lucide-react'
import LocationPicker from '@/app/components/LocationPicker'
import { PaymentSetupForm } from '@/components/ui/payment-setup-form'

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

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00'
]

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

function parseAvailability(availability: string): BusinessHours {
  try {
    const parsed = JSON.parse(availability)
    if (parsed && typeof parsed === 'object' && 'monday' in parsed) {
      return { ...DEFAULT_HOURS, ...parsed }
    }
  } catch {
    // Not JSON, return default
  }
  return DEFAULT_HOURS
}

function formatAvailabilityForDisplay(hours: BusinessHours): string {
  const days = Object.entries(hours)
    .filter(([, value]) => value.enabled)
    .map(([day, value]) => {
      const dayLabel = DAY_LABELS[day as keyof BusinessHours].slice(0, 3)
      return `${dayLabel}: ${formatTime(value.open)} - ${formatTime(value.close)}`
    })
  return days.length > 0 ? days.join(', ') : 'Hours not set'
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

export default function SettingsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingField, setSavingField] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [specializations, setSpecializations] = useState<ProfessionalType[]>([])
  const [uploadingImage, setUploadingImage] = useState<'profile' | 'business' | 'cover' | null>(null)

  // Form states
  const [personalForm, setPersonalForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    profileImage: '',
  })

  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    businessImage: '',
    coverImage: '',
    specializationId: '',
    experience: 0,
    bio: '',
    portfolioUrl: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    availability: '',
    freeDeliveryThreshold: 0,
    spotlightVideoUrl: '',
    slug: '',
  })

  const [socialMedia, setSocialMedia] = useState({
    website: '',
    instagram: '',
    facebook: '',
  })

  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_HOURS)

  const [notificationSettings, setNotificationSettings] = useState({
    emailOrders: true,
    emailPromotions: false,
    emailReviews: true,
    pushOrders: true,
    pushMessages: true,
  })

  const isProfessional = profile?.role && ['PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'].includes(profile.role)

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/me')
      if (response.ok) {
        const data = await response.json()
        const userData = data.user
        
        // Fetch full user details including professional profile
        const userResponse = await fetch(`/api/users/${userData.id}`)
        if (userResponse.ok) {
          const fullUser = await userResponse.json()
          setProfile(fullUser)
          
          setPersonalForm({
            firstName: fullUser.firstName || '',
            lastName: fullUser.lastName || '',
            phone: fullUser.phone || '',
            profileImage: fullUser.profileImage || '',
          })

          if (fullUser.professionalProfile) {
            const pp = fullUser.professionalProfile
            setBusinessForm({
              businessName: pp.businessName || '',
              businessImage: pp.businessImage || '',
              coverImage: pp.coverImage || '',
              specializationId: pp.specializationId || '',
              experience: pp.experience || 0,
              bio: pp.bio || '',
              portfolioUrl: pp.portfolioUrl || '',
              location: pp.location || '',
              latitude: pp.latitude || null,
              longitude: pp.longitude || null,
              availability: pp.availability || '',
              freeDeliveryThreshold: pp.freeDeliveryThreshold || 0,
              spotlightVideoUrl: pp.spotlightVideoUrl || '',
              slug: pp.slug || '',
            })

            // Parse business hours from availability
            if (pp.availability) {
              setBusinessHours(parseAvailability(pp.availability))
            }

            // Parse social media
            const sm = pp.socialMedia || []
            setSocialMedia({
              website: sm.find((s: SocialMedia) => s.platform === 'website')?.url || '',
              instagram: sm.find((s: SocialMedia) => s.platform === 'instagram')?.url || '',
              facebook: sm.find((s: SocialMedia) => s.platform === 'facebook')?.url || '',
            })
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch specializations
  const fetchSpecializations = async () => {
    try {
      const response = await fetch('/api/professional-types')
      if (response.ok) {
        const data = await response.json()
        setSpecializations(data)
      }
    } catch (error) {
      console.error('Error fetching specializations:', error)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (status === 'authenticated') {
      fetchProfile()
      fetchSpecializations()
    }
  }, [status, router, fetchProfile])

  // Real-time save for personal info
  const savePersonalInfo = async () => {
    if (!profile) return
    setSaving(true)
    setSavingField('personal')

    try {
      const response = await fetch(`/api/users/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personalForm),
      })

      if (response.ok) {
        toast.success('Personal information updated')
        fetchProfile()
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update personal information')
    } finally {
      setSaving(false)
      setSavingField(null)
    }
  }

  // Real-time save for business info
  const saveBusinessInfo = async () => {
    if (!profile?.professionalProfile) return
    setSaving(true)
    setSavingField('business')

    try {
      const response = await fetch(`/api/professional-profiles/${profile.professionalProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...businessForm,
          availability: JSON.stringify(businessHours),
          experience: parseInt(String(businessForm.experience)) || 0,
          freeDeliveryThreshold: parseFloat(String(businessForm.freeDeliveryThreshold)) || null,
        }),
      })

      if (response.ok) {
        toast.success('Business profile updated')
        fetchProfile()
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      console.error('Error updating business profile:', error)
      toast.error('Failed to update business profile')
    } finally {
      setSaving(false)
      setSavingField(null)
    }
  }

  // Save social media links
  const saveSocialMedia = async () => {
    if (!profile?.professionalProfile) return
    setSaving(true)
    setSavingField('social')

    try {
      // Update social media through professional profile
      const socialMediaArray = [
        { platform: 'website', url: socialMedia.website },
        { platform: 'instagram', url: socialMedia.instagram },
        { platform: 'facebook', url: socialMedia.facebook },
      ].filter(sm => sm.url)

      const response = await fetch(`/api/professional-profiles/${profile.professionalProfile.id}/social-media`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socialMedia: socialMediaArray }),
      })

      if (response.ok) {
        toast.success('Social media links updated')
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      console.error('Error updating social media:', error)
      toast.error('Failed to update social media links')
    } finally {
      setSaving(false)
      setSavingField(null)
    }
  }

  // Image upload handler
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'profile' | 'business' | 'cover'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(type)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const imageUrl = data.url

        if (type === 'profile') {
          setPersonalForm(prev => ({ ...prev, profileImage: imageUrl }))
          // Auto-save
          await fetch(`/api/users/${profile?.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...personalForm, profileImage: imageUrl }),
          })
          toast.success('Profile picture updated')
        } else if (type === 'business') {
          setBusinessForm(prev => ({ ...prev, businessImage: imageUrl }))
          if (profile?.professionalProfile) {
            await fetch(`/api/professional-profiles/${profile.professionalProfile.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ businessImage: imageUrl }),
            })
            toast.success('Business image updated')
          }
        } else if (type === 'cover') {
          setBusinessForm(prev => ({ ...prev, coverImage: imageUrl }))
          if (profile?.professionalProfile) {
            await fetch(`/api/professional-profiles/${profile.professionalProfile.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ coverImage: imageUrl }),
            })
            toast.success('Cover image updated')
          }
        }

        fetchProfile()
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploadingImage(null)
    }
  }

  // Handle location change
  const handleLocationChange = (lat: number, lng: number, address: string) => {
    setBusinessForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location: address,
    }))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">
            Manage your profile, {isProfessional && 'business settings, '}and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto gap-2 bg-transparent">
            <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:shadow">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            {isProfessional && (
              <TabsTrigger value="business" className="data-[state=active]:bg-white data-[state=active]:shadow">
                <Building2 className="w-4 h-4 mr-2" />
                Business
              </TabsTrigger>
            )}
            {isProfessional && (
              <TabsTrigger value="payments" className="data-[state=active]:bg-white data-[state=active]:shadow">
                <Wallet className="w-4 h-4 mr-2" />
                Payments
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications" className="data-[state=active]:bg-white data-[state=active]:shadow">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:shadow">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Picture */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Camera className="w-5 h-5 mr-2" />
                    Profile Picture
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <div className="relative group">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                      <AvatarImage src={personalForm.profileImage} alt="Profile" />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {personalForm.firstName?.[0]}{personalForm.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      {uploadingImage === 'profile' ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'profile')}
                        className="hidden"
                        disabled={uploadingImage !== null}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Click to upload a new photo<br />
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Settings className="w-5 h-5 mr-2" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); savePersonalInfo(); }} className="space-y-5">
                    {/* Email (Read-only) */}
                    <div>
                      <Label htmlFor="email" className="flex items-center text-sm font-medium">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="bg-gray-50 mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed
                      </p>
                    </div>

                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={personalForm.firstName}
                          onChange={(e) => setPersonalForm({ ...personalForm, firstName: e.target.value })}
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={personalForm.lastName}
                          onChange={(e) => setPersonalForm({ ...personalForm, lastName: e.target.value })}
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <Label htmlFor="phone" className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={personalForm.phone}
                        onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                        placeholder="+233 XX XXX XXXX"
                        className="mt-1"
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-2">
                      <Button type="submit" disabled={saving && savingField === 'personal'}>
                        {saving && savingField === 'personal' ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Business Tab (Professional Only) */}
          {isProfessional && (
            <TabsContent value="business">
              <div className="space-y-6">
                {/* Cover & Business Image */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <ImageIcon className="w-5 h-5 mr-2" />
                      Business Images
                    </CardTitle>
                    <CardDescription>
                      Upload your cover photo and business logo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Cover Image */}
                    <div>
                      <Label className="mb-2 block">Cover Image</Label>
                      <div className="relative h-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg overflow-hidden group">
                        {businessForm.coverImage ? (
                          <Image
                            src={businessForm.coverImage}
                            alt="Cover"
                            fill
                            className="object-cover"
                            quality={100}
                            sizes="(max-width: 768px) 100vw, 800px"
                            unoptimized
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <ImageIcon className="w-12 h-12" />
                          </div>
                        )}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                          {uploadingImage === 'cover' ? (
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          ) : (
                            <div className="text-center text-white">
                              <Camera className="w-8 h-8 mx-auto mb-2" />
                              <span className="text-sm">Change Cover Photo</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'cover')}
                            className="hidden"
                            disabled={uploadingImage !== null}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Recommended: 1200x400 pixels</p>
                    </div>

                    {/* Business Logo */}
                    <div>
                      <Label className="mb-2 block">Business Logo / Profile</Label>
                      <div className="flex items-center gap-4">
                        <div className="relative group">
                          <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                            <AvatarImage src={businessForm.businessImage} alt="Business" />
                            <AvatarFallback className="text-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                              {businessForm.businessName?.[0] || 'B'}
                            </AvatarFallback>
                          </Avatar>
                          <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            {uploadingImage === 'business' ? (
                              <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : (
                              <Camera className="w-6 h-6 text-white" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'business')}
                              className="hidden"
                              disabled={uploadingImage !== null}
                            />
                          </label>
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>This appears on your storefront and products</p>
                          <p className="text-xs mt-1">Recommended: 200x200 pixels</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Building2 className="w-5 h-5 mr-2" />
                      Business Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={(e) => { e.preventDefault(); saveBusinessInfo(); }} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="businessName">Business Name</Label>
                          <Input
                            id="businessName"
                            value={businessForm.businessName}
                            onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                            required
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="slug">Profile URL Slug</Label>
                          <div className="flex mt-1">
                            <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                              /tz/
                            </span>
                            <Input
                              id="slug"
                              value={businessForm.slug}
                              onChange={(e) => setBusinessForm({ ...businessForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                              className="rounded-l-none"
                              placeholder="your-business"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="specialization">Specialization</Label>
                          <Select
                            value={businessForm.specializationId}
                            onValueChange={(value) => setBusinessForm({ ...businessForm, specializationId: value })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select specialization" />
                            </SelectTrigger>
                            <SelectContent>
                              {specializations.map((spec) => (
                                <SelectItem key={spec.id} value={spec.id}>
                                  {spec.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="experience">Years of Experience</Label>
                          <Input
                            id="experience"
                            type="number"
                            min="0"
                            value={businessForm.experience}
                            onChange={(e) => setBusinessForm({ ...businessForm, experience: parseInt(e.target.value) || 0 })}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="bio">Business Bio</Label>
                        <Textarea
                          id="bio"
                          value={businessForm.bio}
                          onChange={(e) => setBusinessForm({ ...businessForm, bio: e.target.value })}
                          placeholder="Tell customers about your business..."
                          className="mt-1 min-h-[100px]"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                          <Input
                            id="portfolioUrl"
                            type="url"
                            value={businessForm.portfolioUrl}
                            onChange={(e) => setBusinessForm({ ...businessForm, portfolioUrl: e.target.value })}
                            placeholder="https://..."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="freeDeliveryThreshold">Free Delivery Threshold (GHS)</Label>
                          <Input
                            id="freeDeliveryThreshold"
                            type="number"
                            min="0"
                            step="0.01"
                            value={businessForm.freeDeliveryThreshold || ''}
                            onChange={(e) => setBusinessForm({ ...businessForm, freeDeliveryThreshold: parseFloat(e.target.value) || 0 })}
                            placeholder="Orders above this amount get free delivery"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Business Hours */}
                      <div className="space-y-3">
                        <Label className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          Business Hours
                        </Label>
                        <p className="text-sm text-gray-500 mb-3">
                          Set your opening hours. Toggle days you&apos;re open.
                        </p>
                        <div className="space-y-2 border rounded-lg p-4 bg-gray-50">
                          {(Object.keys(businessHours) as Array<keyof BusinessHours>).map((day) => (
                            <div key={day} className="flex items-center gap-3 py-2 border-b last:border-0">
                              <div className="flex items-center gap-2 w-28">
                                <Switch
                                  checked={businessHours[day].enabled}
                                  onCheckedChange={(checked) => 
                                    setBusinessHours(prev => ({
                                      ...prev,
                                      [day]: { ...prev[day], enabled: checked }
                                    }))
                                  }
                                />
                                <span className={`text-sm font-medium ${businessHours[day].enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {DAY_LABELS[day].slice(0, 3)}
                                </span>
                              </div>
                              {businessHours[day].enabled ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <Select
                                    value={businessHours[day].open}
                                    onValueChange={(value) =>
                                      setBusinessHours(prev => ({
                                        ...prev,
                                        [day]: { ...prev[day], open: value }
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="w-28 h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TIME_OPTIONS.map((time) => (
                                        <SelectItem key={time} value={time} className="text-sm">
                                          {formatTime(time)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <span className="text-gray-400">to</span>
                                  <Select
                                    value={businessHours[day].close}
                                    onValueChange={(value) =>
                                      setBusinessHours(prev => ({
                                        ...prev,
                                        [day]: { ...prev[day], close: value }
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="w-28 h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TIME_OPTIONS.map((time) => (
                                        <SelectItem key={time} value={time} className="text-sm">
                                          {formatTime(time)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400 italic">Closed</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          Preview: {formatAvailabilityForDisplay(businessHours)}
                        </p>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={saving && savingField === 'business'}>
                          {saving && savingField === 'business' ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Business Info
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Location */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <MapPin className="w-5 h-5 mr-2" />
                      Business Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LocationPicker
                      latitude={businessForm.latitude}
                      longitude={businessForm.longitude}
                      location={businessForm.location}
                      onLocationChange={handleLocationChange}
                    />
                    <div className="flex justify-end mt-4">
                      <Button onClick={saveBusinessInfo} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Location
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Media */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Globe className="w-5 h-5 mr-2" />
                      Social Media Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={(e) => { e.preventDefault(); saveSocialMedia(); }} className="space-y-4">
                      <div>
                        <Label htmlFor="website" className="flex items-center">
                          <Link2 className="w-4 h-4 mr-2 text-gray-400" />
                          Website
                        </Label>
                        <Input
                          id="website"
                          type="url"
                          value={socialMedia.website}
                          onChange={(e) => setSocialMedia({ ...socialMedia, website: e.target.value })}
                          placeholder="https://yourwebsite.com"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="instagram" className="flex items-center">
                          <Instagram className="w-4 h-4 mr-2 text-pink-500" />
                          Instagram
                        </Label>
                        <Input
                          id="instagram"
                          type="url"
                          value={socialMedia.instagram}
                          onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })}
                          placeholder="https://instagram.com/yourbusiness"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="facebook" className="flex items-center">
                          <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                          Facebook
                        </Label>
                        <Input
                          id="facebook"
                          type="url"
                          value={socialMedia.facebook}
                          onChange={(e) => setSocialMedia({ ...socialMedia, facebook: e.target.value })}
                          placeholder="https://facebook.com/yourbusiness"
                          className="mt-1"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={saving && savingField === 'social'}>
                          {saving && savingField === 'social' ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Social Links
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Payments Tab - For Professionals */}
          {isProfessional && (
            <TabsContent value="payments">
              <PaymentSetupForm />
            </TabsContent>
          )}

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Email Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Order Updates</Label>
                        <p className="text-sm text-gray-500">Receive email updates about your orders</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailOrders}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailOrders: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Promotional Emails</Label>
                        <p className="text-sm text-gray-500">Receive offers and promotions</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailPromotions}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailPromotions: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Review Notifications</Label>
                        <p className="text-sm text-gray-500">Get notified when you receive reviews</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailReviews}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailReviews: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Push Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Order Updates</Label>
                        <p className="text-sm text-gray-500">Instant updates about your orders</p>
                      </div>
                      <Switch
                        checked={notificationSettings.pushOrders}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, pushOrders: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Messages</Label>
                        <p className="text-sm text-gray-500">New message notifications</p>
                      </div>
                      <Switch
                        checked={notificationSettings.pushMessages}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, pushMessages: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={() => toast.success('Notification preferences saved')}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Lock className="w-5 h-5 mr-2" />
                    Password
                  </CardTitle>
                  <CardDescription>
                    Change your account password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="Enter current password"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit">
                        <Lock className="w-4 h-4 mr-2" />
                        Update Password
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-red-600">
                    <Shield className="w-5 h-5 mr-2" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <h4 className="font-medium text-red-800">Delete Account</h4>
                      <p className="text-sm text-red-600">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
