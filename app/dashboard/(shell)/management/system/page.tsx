'use client'

import { useState, useEffect } from 'react'
import { Settings, Activity, Save, RefreshCw, Layers, ShieldAlert, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      case 'create': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      case 'update': return 'bg-blue-50 text-blue-700 border border-blue-200'
      case 'delete': return 'bg-rose-50 text-rose-700 border border-rose-200'
      case 'login': return 'bg-purple-50 text-purple-700 border border-purple-200'
      default: return 'bg-slate-50 text-slate-700 border border-slate-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  // Group settings by category
  const settingsByCategory = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = []
    acc[setting.category].push(setting)
    return acc
  }, {} as Record<string, SystemSetting[]>)

  const totalCategories = Object.keys(settingsByCategory).length

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 p-3 sm:p-5 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">System Administration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Platform-wide settings, audit logs, and system maintenance
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" className="h-8 sm:h-9 text-xs font-semibold px-3 sm:px-3.5 rounded-lg flex items-center gap-1.5 self-start sm:self-auto">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Config Keys</span>
            <Settings className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-slate-900">{settings.length}</div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Categories</span>
            <Layers className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-indigo-600">
            {totalCategories}
          </div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Audit Events</span>
            <Activity className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-blue-600">
            {auditLogs.length}
          </div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Critical Events</span>
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-amber-600">
            {auditLogs.filter(l => l.action.toLowerCase() === 'delete').length}
          </div>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-auto border border-slate-200/70 inline-flex flex-wrap gap-1">
          <TabsTrigger
            value="settings"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <Settings className="h-3.5 w-3.5" />
            System Settings ({settings.length})
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <Activity className="h-3.5 w-3.5" />
            Audit Logs ({auditLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-3.5">
          {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
            <div key={category} className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3.5 sm:p-4 space-y-3">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">{category} Configuration</h2>
                <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0.5 rounded">
                  {categorySettings.length} keys
                </Badge>
              </div>
              <div className="space-y-3 pt-1">
                {categorySettings.map((setting) => (
                  <div key={setting.key} className="space-y-1.5 p-2.5 rounded-lg bg-slate-50/60 border border-slate-100">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <Label htmlFor={setting.key} className="text-xs font-semibold text-slate-800">
                          {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                        {setting.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{setting.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5">
                        Updated {new Date(setting.updatedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="flex gap-2 items-center pt-1">
                      {setting.value.length > 100 ? (
                        <Textarea
                          id={setting.key}
                          value={settingsForm[setting.key] || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, [setting.key]: e.target.value })}
                          rows={2}
                          className="flex-1 text-xs rounded-lg min-h-[50px] resize-none"
                        />
                      ) : (
                        <Input
                          id={setting.key}
                          value={settingsForm[setting.key] || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, [setting.key]: e.target.value })}
                          className="flex-1 h-8 text-xs rounded-lg"
                        />
                      )}
                      <Button
                        onClick={() => handleSettingUpdate(setting.key)}
                        disabled={saving === setting.key}
                        size="sm"
                        className="h-8 px-2.5 text-xs rounded-lg shrink-0"
                      >
                        {saving === setting.key ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(settingsByCategory).length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-slate-200/80 shadow-xs text-center p-6">
              <Settings className="h-10 w-10 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-800 mb-1">No system settings</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                System settings will appear here when configured.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-3">
          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </Badge>
                    {log.entity && (
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0.5 rounded">
                        {log.entity}
                      </Badge>
                    )}
                    {log.user && (
                      <span className="text-xs text-slate-600 font-medium">
                        by {log.user.firstName} {log.user.lastName}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono self-end sm:self-auto">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                  {log.entityId && <span>Entity: {log.entityId}</span>}
                  {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                </div>
                {(log.oldValues || log.newValues) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    {log.oldValues && (
                      <div>
                        <p className="text-[11px] font-mono uppercase text-rose-600 font-semibold mb-1">Old State</p>
                        <pre className="text-[11px] font-mono bg-rose-50/70 p-2 rounded-lg border border-rose-100 overflow-x-auto text-rose-900 max-h-32">
                          {JSON.stringify(log.oldValues, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.newValues && (
                      <div>
                        <p className="text-[11px] font-mono uppercase text-emerald-600 font-semibold mb-1">New State</p>
                        <pre className="text-[11px] font-mono bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 overflow-x-auto text-emerald-900 max-h-32">
                          {JSON.stringify(log.newValues, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {auditLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-slate-200/80 shadow-xs text-center p-6">
              <Activity className="h-10 w-10 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-800 mb-1">No audit logs</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Audit logs will appear here as system activities occur.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}