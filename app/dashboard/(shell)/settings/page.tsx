'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { SystemSetting } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Save, Settings, User, Lock, ShieldCheck, Wallet, Store, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { PaymentSetupForm } from '@/components/ui/payment-setup-form'
import VerificationCenter from '@/app/dashboard/components/VerificationCenter'

interface UserProfileSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  professionalProfile?: {
    id: string;
    isActive: boolean;
    businessName: string;
  };
}

export default function DashboardSettingsPage() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'account'
  
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [profileSummary, setProfileSummary] = useState<UserProfileSummary | null>(null)
  const [superAdminRequireSubscription, setSuperAdminRequireSubscription] = useState(false)
  const [savingSubscription, setSavingSubscription] = useState(false)
  const [, setLoadingProfile] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [meRes, sysRes] = await Promise.all([fetch('/api/me'), fetch('/api/system-settings')])
      if (meRes.ok) {
        const me = await meRes.json()
        try {
          const uRes = await fetch(`/api/users/${me.user.id}`)
          if (uRes.ok) setProfileSummary(await uRes.json())
        } catch {}
      }

      if (sysRes.ok) {
        const sys = await sysRes.json()
        setSettings(sys.settings || [])
        const form: Record<string, string> = {};
        (sys.settings || []).forEach((s: SystemSetting) => {
          form[s.key] = s.value
          if (s.key === 'superAdminRequireSubscription') {
            setSuperAdminRequireSubscription(s.value === 'true')
          }
        })
        setSettingsForm(form)
      }
    } catch {
      toast.error('Failed to load dashboard settings')
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleUpdate = async (key: string) => {
    setSavingKey(key)
    try {
      const res = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: settingsForm[key] }),
      })
      if (!res.ok) throw new Error('failed')
      toast.success('System setting updated successfully')
      fetchAll()
    } catch {
      toast.error('Failed to update system setting')
    } finally {
      setSavingKey(null)
    }
  }

  const handleShopStatusToggle = async (value: boolean) => {
    if (!profileSummary?.professionalProfile?.id) return
    
    try {
      const res = await fetch(`/api/professional-profiles/${profileSummary.professionalProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: value }),
      })
      
      if (res.ok) {
        setProfileSummary({
          ...profileSummary,
          professionalProfile: {
            ...profileSummary.professionalProfile,
            isActive: value
          }
        })
        toast.success(value ? 'Shop is now visible to customers' : 'Shop is now hidden from public search')
      } else {
        throw new Error('Failed to update status')
      }
    } catch {
      toast.error('Failed to update shop visibility status')
    }
  }

  const handleSuperAdminSubscriptionToggle = async (value: boolean) => {
    setSavingSubscription(true)
    try {
      const res = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'superAdminRequireSubscription',
          value: value.toString(),
          description: 'Whether super admin users need an active subscription to access dashboard features',
          category: 'subscription'
        }),
      })
      if (!res.ok) throw new Error('failed')
      setSuperAdminRequireSubscription(value)
      toast.success(value ? 'Super admins now require an active subscription' : 'Super admins exempt from subscription')
    } catch {
      toast.error('Failed to update subscription policy')
    } finally {
      setSavingSubscription(false)
    }
  }

  const settingsByCategory = settings.reduce((acc: Record<string, SystemSetting[]>, s) => {
    acc[s.category] = acc[s.category] || []
    acc[s.category].push(s)
    return acc
  }, {})

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6 font-sans">
      
      {/* EXECUTIVE HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Merchant Settings &amp; Configuration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard Settings
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Manage your merchant account profile, shop visibility, payouts setup, document verification, and platform parameters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/settings"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200/80 transition-all flex items-center gap-2"
          >
            <User className="h-4 w-4 text-indigo-600" /> Account Profile
          </Link>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs inline-flex flex-wrap gap-1">
          <TabsTrigger value="account" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-600 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2">
            <User className="h-3.5 w-3.5" /> Account Profile
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-600 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5" /> Payouts &amp; MoMo
          </TabsTrigger>
          <TabsTrigger value="verification" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-600 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" /> Verification Center
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-600 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2">
            <Settings className="h-3.5 w-3.5" /> Platform Settings
          </TabsTrigger>
          {profileSummary?.role === 'SUPER_ADMIN' && (
            <TabsTrigger value="subscription" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-600 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" /> Subscriptions Policy
            </TabsTrigger>
          )}
        </TabsList>

        {/* TAB 1: ACCOUNT PROFILE & SHOP VISIBILITY */}
        <TabsContent value="account">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Merchant Account Summary</h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Overview of your registered business profile and shop state.</p>
              </div>
              <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs px-3 py-1">
                {profileSummary?.role || 'PROFESSIONAL'}
              </Badge>
            </div>

            {profileSummary ? (
              <div className="space-y-6">
                
                {/* User Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Merchant Name</span>
                    <span className="text-sm font-bold text-slate-900">{profileSummary.firstName} {profileSummary.lastName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Account Email</span>
                    <span className="text-sm font-bold text-slate-900 truncate block">{profileSummary.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Business Name</span>
                    <span className="text-sm font-bold text-slate-900">{profileSummary.professionalProfile?.businessName || 'Independent Vendor'}</span>
                  </div>
                </div>

                {/* Shop Visibility Switch */}
                {profileSummary.professionalProfile && (
                  <div className="p-5 bg-white rounded-xl border border-slate-200/80 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Store className="w-4 h-4 text-indigo-600" /> Public Shop Visibility
                        </Label>
                        <p className="text-xs font-medium text-slate-500 max-w-lg">
                          When switched off, your products, services, and profile will be hidden from customer search results and catalog drops.
                        </p>
                      </div>
                      <Switch
                        checked={profileSummary.professionalProfile.isActive}
                        onCheckedChange={handleShopStatusToggle}
                      />
                    </div>
                    
                    <div className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2 ${
                      profileSummary.professionalProfile.isActive 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      <CheckCircle2 className={`w-4 h-4 ${profileSummary.professionalProfile.isActive ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <span>
                        Your storefront is currently <strong>{profileSummary.professionalProfile.isActive ? 'ONLINE & VISIBLE' : 'OFFLINE / HIDDEN'}</strong> to marketplace shoppers.
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end">
                  <Link href="/settings">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2">
                      Manage Detailed Profile Settings <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>

              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 font-medium text-xs">Loading profile summary...</div>
            )}
          </div>
        </TabsContent>

        {/* TAB 2: PAYMENTS & MOMO SETUP */}
        <TabsContent value="payments">
          <PaymentSetupForm />
        </TabsContent>

        {/* TAB 3: VERIFICATION CENTER */}
        <TabsContent value="verification">
          <VerificationCenter />
        </TabsContent>

        {/* TAB 4: PLATFORM SYSTEM SETTINGS */}
        <TabsContent value="system" className="space-y-6">
          {Object.entries(settingsByCategory).length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs font-bold">
              No custom platform parameters registered.
            </div>
          ) : (
            Object.entries(settingsByCategory).map(([cat, items]) => (
              <div key={cat} className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider capitalize">{cat} System Parameters</h3>
                </div>
                <div className="space-y-4">
                  {items.map((s) => (
                    <div key={s.key} className="space-y-1.5 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-900">{s.key}</Label>
                        <span className="text-[10px] font-medium text-slate-400">
                          {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('en-GB') : ''}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {s.value.length > 120 ? (
                          <Textarea 
                            value={settingsForm[s.key] || ''} 
                            onChange={(e) => setSettingsForm({ ...settingsForm, [s.key]: e.target.value })} 
                            className="flex-1 text-xs bg-white rounded-xl border-slate-200" 
                          />
                        ) : (
                          <Input 
                            value={settingsForm[s.key] || ''} 
                            onChange={(e) => setSettingsForm({ ...settingsForm, [s.key]: e.target.value })} 
                            className="flex-1 text-xs bg-white rounded-xl border-slate-200" 
                          />
                        )}
                        <Button 
                          onClick={() => handleUpdate(s.key)} 
                          disabled={savingKey === s.key}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 rounded-xl shadow-xs"
                        >
                          {savingKey === s.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                      </div>
                      {s.description && <p className="text-[11px] font-medium text-slate-500">{s.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* TAB 5: SUBSCRIPTIONS POLICY (SUPER ADMIN ONLY) */}
        {profileSummary?.role === 'SUPER_ADMIN' && (
          <TabsContent value="subscription">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Super Admin Membership Policy</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Enforce or exempt super admins from active subscription checks.</p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-slate-900">Require Active Subscription for Super Admins</Label>
                    <p className="text-[11px] font-medium text-slate-500">
                      When disabled, super admin accounts have full unrestricted access without subscription checks.
                    </p>
                  </div>
                  <Switch
                    checked={superAdminRequireSubscription}
                    onCheckedChange={handleSuperAdminSubscriptionToggle}
                    disabled={savingSubscription}
                  />
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-medium text-indigo-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Super admins are currently <strong>{superAdminRequireSubscription ? 'REQUIRED' : 'EXEMPT'}</strong> from active plan checks.
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

      </Tabs>
    </div>
  )
}
