'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Save, Settings, User, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { PaymentSetupForm } from '@/components/ui/payment-setup-form'

interface SystemSetting {
  id: string
  key: string
  value: string
  description?: string
  category: string
  updatedAt?: string
}

interface UserProfileSummary {
  firstName?: string
  lastName?: string
  email?: string
  role?: string
}

export default function DashboardSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [profileSummary, setProfileSummary] = useState<UserProfileSummary | null>(null)
  const [superAdminRequireSubscription, setSuperAdminRequireSubscription] = useState(false)
  const [savingSubscription, setSavingSubscription] = useState(false)

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
          // Load the super admin subscription requirement setting
          if (s.key === 'superAdminRequireSubscription') {
            setSuperAdminRequireSubscription(s.value === 'true')
          }
        })
        setSettingsForm(form)
      }
    } catch {
      toast.error('Failed to load dashboard settings')
    } finally {
      // Loading complete
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
      toast.success('Updated')
      fetchAll()
    } catch {
      toast.error('Failed to update setting')
    } finally {
      setSavingKey(null)
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
      toast.success(value ? 'Super admins now require subscription' : 'Super admins no longer require subscription')
    } catch {
      toast.error('Failed to update subscription requirement')
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
    <div className="space-y-6 pt-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Settings</h1>
          <p className="text-muted-foreground">Account and platform settings for the dashboard</p>
        </div>
        <div className="flex gap-2">
          <Link href="/settings">
            <Button variant="outline">Open Account Settings</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account" className="flex items-center gap-2"><User className="h-4 w-4"/>Account</TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2"><Settings className="h-4 w-4"/>Platform</TabsTrigger>
          {profileSummary?.role === 'SUPER_ADMIN' && (
            <TabsTrigger value="subscription" className="flex items-center gap-2"><Lock className="h-4 w-4"/>Subscriptions</TabsTrigger>
          )}
          {/* Payments tab mirrors /settings payments (MoMo setup) */}
          <TabsTrigger value="payments" className="flex items-center gap-2"><User className="h-4 w-4"/>Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {profileSummary ? (
                <div className="space-y-2">
                  <div className="font-medium">{profileSummary.firstName} {profileSummary.lastName}</div>
                  <div className="text-sm text-muted-foreground">{profileSummary.email}</div>
                  <div className="text-sm">Role: {profileSummary.role}</div>
                  <div className="mt-3">
                    <Link href="/settings">
                      <Button>Manage Account</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div>No profile loaded</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          {Object.entries(settingsByCategory).length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">No platform settings available</CardContent>
            </Card>
          )}

          {Object.entries(settingsByCategory).map(([cat, items]) => (
            <Card key={cat}>
              <CardHeader>
                <CardTitle className="capitalize">{cat} Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((s) => (
                  <div key={s.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">{s.key}</Label>
                      <div className="text-xs text-muted-foreground">{s.updatedAt ? new Date(s.updatedAt).toLocaleString() : ''}</div>
                    </div>
                    <div className="flex gap-2">
                      {s.value.length > 120 ? (
                        <Textarea value={settingsForm[s.key] || ''} onChange={(e) => setSettingsForm({ ...settingsForm, [s.key]: e.target.value })} className="flex-1" />
                      ) : (
                        <Input value={settingsForm[s.key] || ''} onChange={(e) => setSettingsForm({ ...settingsForm, [s.key]: e.target.value })} className="flex-1" />
                      )}
                      <Button size="sm" onClick={() => handleUpdate(s.key)} disabled={savingKey === s.key}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                    {s.description && <div className="text-sm text-muted-foreground">{s.description}</div>}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Payments tab in dashboard - uses same PaymentSetupForm as main settings */}
        <TabsContent value="payments">
          <PaymentSetupForm />
        </TabsContent>

        {/* Subscription settings - only for super admin */}
        {profileSummary?.role === 'SUPER_ADMIN' && (
          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Requirements</CardTitle>
                <CardDescription>Configure subscription settings for your platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-lg p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Require Subscription for Super Admins</Label>
                        <p className="text-sm text-muted-foreground">
                          When disabled, super admins will have full access without subscription requirements
                        </p>
                      </div>
                      <Switch
                        checked={superAdminRequireSubscription}
                        onCheckedChange={handleSuperAdminSubscriptionToggle}
                        disabled={savingSubscription}
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
                    <p className="font-medium mb-1">Current Status:</p>
                    <p>
                      Super admins are currently <strong>{superAdminRequireSubscription ? 'required' : 'not required'}</strong> to have an active subscription to access dashboard features.
                    </p>
                  </div>

                  {savingSubscription && (
                    <div className="text-sm text-muted-foreground">Saving...</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
