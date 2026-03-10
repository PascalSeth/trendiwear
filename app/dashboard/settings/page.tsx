'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Settings, User } from 'lucide-react'
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
        (sys.settings || []).forEach((s: SystemSetting) => (form[s.key] = s.value))
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

  const settingsByCategory = settings.reduce((acc: Record<string, SystemSetting[]>, s) => {
    acc[s.category] = acc[s.category] || []
    acc[s.category].push(s)
    return acc
  }, {})

  return (
    <div className="space-y-6">
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
      </Tabs>
    </div>
  )
}
