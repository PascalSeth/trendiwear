'use client'

import { useState, useEffect } from 'react'
import { Settings, Activity, Save, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface SystemSetting {
  id: string
  key: string
  value: string
  description?: string
  category: string
  updatedBy: string
  updatedAt: string
}

interface AuditLog {
  id: string
  userId?: string
  action: string
  entity?: string
  entityId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
  createdAt: string
  user?: {
    firstName: string
    lastName: string
  }
}

export default function SystemAdministration() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [settingsRes, auditRes] = await Promise.all([
        fetch('/api/system-settings'),
        fetch('/api/audit-logs?limit=50')
      ])

      const settingsData = await settingsRes.json()
      const auditData = await auditRes.json()

      setSettings(settingsData.settings || [])
      setAuditLogs(auditData.logs || [])

      // Initialize form with current values
      const formData: Record<string, string> = {}
      settingsData.settings?.forEach((setting: SystemSetting) => {
        formData[setting.key] = setting.value
      })
      setSettingsForm(formData)

    } catch {
      toast.error('Failed to load system data')
    } finally {
      setLoading(false)
    }
  }

  const handleSettingUpdate = async (key: string) => {
    setSaving(key)
    try {
      const response = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          value: settingsForm[key]
        }),
      })

      if (!response.ok) throw new Error('Failed to update setting')

      toast.success('Setting updated successfully')
      fetchData()
    } catch {
      toast.error('Failed to update setting')
    } finally {
      setSaving(null)
    }
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'bg-green-100 text-green-800'
      case 'update': return 'bg-blue-100 text-blue-800'
      case 'delete': return 'bg-red-100 text-red-800'
      case 'login': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Group settings by category
  const settingsByCategory = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = []
    acc[setting.category].push(setting)
    return acc
  }, {} as Record<string, SystemSetting[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
          <p className="text-muted-foreground">
            Platform-wide settings, audit logs, and system maintenance
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Audit Logs ({auditLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize">{category} Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categorySettings.map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor={setting.key} className="font-medium">
                          {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                        {setting.description && (
                          <p className="text-sm text-muted-foreground">{setting.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Updated {new Date(setting.updatedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {setting.value.length > 100 ? (
                        <Textarea
                          id={setting.key}
                          value={settingsForm[setting.key] || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, [setting.key]: e.target.value })}
                          rows={3}
                          className="flex-1"
                        />
                      ) : (
                        <Input
                          id={setting.key}
                          value={settingsForm[setting.key] || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, [setting.key]: e.target.value })}
                          className="flex-1"
                        />
                      )}
                      <Button
                        onClick={() => handleSettingUpdate(setting.key)}
                        disabled={saving === setting.key}
                        size="sm"
                      >
                        {saving === setting.key ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {Object.keys(settingsByCategory).length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No system settings</h3>
                <p className="text-muted-foreground text-center">
                  System settings will appear here when configured
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                        {log.entity && (
                          <Badge variant="outline">
                            {log.entity}
                          </Badge>
                        )}
                        {log.user && (
                          <span className="text-sm text-muted-foreground">
                            by {log.user.firstName} {log.user.lastName}
                          </span>
                        )}
                      </div>
                      {log.entityId && (
                        <p className="text-sm text-muted-foreground">
                          Entity ID: {log.entityId}
                        </p>
                      )}
                      {log.ipAddress && (
                        <p className="text-xs text-muted-foreground">
                          IP: {log.ipAddress}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {(log.oldValues || log.newValues) && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {log.oldValues && (
                          <div>
                            <p className="font-medium text-red-600 mb-1">Old Values</p>
                            <pre className="text-xs bg-red-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.oldValues, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.newValues && (
                          <div>
                            <p className="font-medium text-green-600 mb-1">New Values</p>
                            <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.newValues, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {auditLogs.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No audit logs</h3>
                <p className="text-muted-foreground text-center">
                  Audit logs will appear here as system activities occur
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}