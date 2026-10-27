'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, DollarSign, Package, TrendingUp, ShieldCheck, CheckCircle2, Clock, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface SubscriptionTier {
  id: string
  name: string
  description?: string
  weeklyPrice: number
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  storageLimit: number
  monthlyListings: number
  analyticsAccess: boolean
  prioritySupport: boolean
  featuredBadge: boolean
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

interface Subscription {
  id: string
  professionalId: string
  tierId: string
  billingCycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED'
  currentAmount: number
  startDate: string
  nextRenewalDate: string
  cancelledAt?: string
  autoRenew: boolean
  tier: {
    name: string
  }
  professional?: {
    id: string
    name?: string
    businessName?: string
  }
}

interface ProfessionalTrial {
  id: string
  professionalId: string
  endDate: string
  completed: boolean
  startDate: string
  daysRemaining: number
  professional?: {
    id: string
    name?: string
    businessName?: string
  }
}

export default function SubscriptionManagement() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [trials, setTrials] = useState<ProfessionalTrial[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null)
  const [activeTab, setActiveTab] = useState('tiers')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    weeklyPrice: '0',
    monthlyPrice: '0',
    yearlyPrice: '0',
    billingCycle: 'MONTHLY',
    features: '',
    storageLimit: '1000',
    monthlyListings: '10',
    analyticsAccess: false,
    prioritySupport: false,
    featuredBadge: false,
    isActive: true,
    order: '0',
  })

  // Helper to get billing cycle and price for a tier
  const getBillingInfo = (tier: SubscriptionTier) => {
    if (tier.weeklyPrice > 0) return { cycle: 'WEEKLY', price: tier.weeklyPrice, label: 'Weekly' }
    if (tier.monthlyPrice > 0) return { cycle: 'MONTHLY', price: tier.monthlyPrice, label: 'Monthly' }
    if (tier.yearlyPrice > 0) return { cycle: 'YEARLY', price: tier.yearlyPrice, label: 'Yearly' }
    return { cycle: 'MONTHLY', price: 0, label: 'Monthly' }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [tiersRes, subsRes, trialsRes] = await Promise.all([
        fetch('/api/subscriptions/tiers'),
        fetch('/api/subscriptions/admin/all'),
        fetch('/api/subscriptions/admin/trials'),
      ])

      if (tiersRes.ok) {
        const data = await tiersRes.json()
        setTiers(data.data || data)
      }

      if (subsRes.ok) {
        const data = await subsRes.json()
        setSubscriptions(data.data || data)
      }

      if (trialsRes.ok) {
        const data = await trialsRes.json()
        setTrials(data.data || data)
      }
    } catch (error) {
      toast.error('Failed to load subscription data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        weeklyPrice: parseFloat(formData.weeklyPrice),
        monthlyPrice: parseFloat(formData.monthlyPrice),
        yearlyPrice: parseFloat(formData.yearlyPrice),
        features: formData.features.split(',').map((f) => f.trim()).filter(Boolean),
        storageLimit: parseInt(formData.storageLimit),
        monthlyListings: parseInt(formData.monthlyListings),
        analyticsAccess: formData.analyticsAccess,
        prioritySupport: formData.prioritySupport,
        featuredBadge: formData.featuredBadge,
        isActive: formData.isActive,
        order: parseInt(formData.order),
      }

      const url = editingTier ? `/api/subscriptions/tiers/${editingTier.id}` : '/api/subscriptions/tiers'
      const method = editingTier ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save tier')
      }

      toast.success(editingTier ? 'Tier updated successfully' : 'Tier created successfully')
      fetchAllData()
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save tier')
    }
  }

  const handleEdit = (tier: SubscriptionTier) => {
    setEditingTier(tier)
    let billingCycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY' = 'MONTHLY'
    if (tier.weeklyPrice > 0) billingCycle = 'WEEKLY'
    else if (tier.monthlyPrice > 0) billingCycle = 'MONTHLY'
    else if (tier.yearlyPrice > 0) billingCycle = 'YEARLY'

    setFormData({
      name: tier.name,
      description: tier.description || '',
      weeklyPrice: tier.weeklyPrice.toString(),
      monthlyPrice: tier.monthlyPrice.toString(),
      yearlyPrice: tier.yearlyPrice.toString(),
      billingCycle: billingCycle,
      features: tier.features.join(', '),
      storageLimit: tier.storageLimit.toString(),
      monthlyListings: tier.monthlyListings.toString(),
      analyticsAccess: tier.analyticsAccess,
      prioritySupport: tier.prioritySupport,
      featuredBadge: tier.featuredBadge,
      isActive: tier.isActive,
      order: tier.order.toString(),
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription tier?')) return

    try {
      const response = await fetch(`/api/subscriptions/tiers/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete tier')

      toast.success('Tier deleted successfully')
      fetchAllData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete tier')
    }
  }

  const resetForm = () => {
    setEditingTier(null)
    setFormData({
      name: '',
      description: '',
      weeklyPrice: '0',
      monthlyPrice: '0',
      yearlyPrice: '0',
      billingCycle: 'MONTHLY',
      features: '',
      storageLimit: '1000',
      monthlyListings: '10',
      analyticsAccess: false,
      prioritySupport: false,
      featuredBadge: false,
      isActive: true,
      order: '0',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  const activeSubscriptionsCount = subscriptions.filter(s => s.status === 'ACTIVE').length
  const activeTrialsCount = trials.filter(t => !t.completed).length

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 p-3 sm:p-5 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Subscription Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage subscription tiers, active subscriptions, and trials
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Tiers Configured</span>
            <Package className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-slate-900">{tiers.length}</div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Active Tiers</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-emerald-600">
            {tiers.filter(t => t.isActive).length}
          </div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Active Subscriptions</span>
            <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-blue-600">
            {activeSubscriptionsCount}
          </div>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500">
            <span>Active Trials</span>
            <Clock className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-amber-600">
            {activeTrialsCount}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-auto border border-slate-200/70 inline-flex flex-wrap gap-1">
          <TabsTrigger
            value="tiers"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <Package className="h-3.5 w-3.5" />
            Tiers ({tiers.length})
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Subscriptions ({subscriptions.length})
          </TabsTrigger>
          <TabsTrigger
            value="trials"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
          >
            <Clock className="h-3.5 w-3.5" />
            Trials ({trials.length})
          </TabsTrigger>
        </TabsList>

        {/* Subscription Tiers Tab */}
        <TabsContent value="tiers" className="space-y-3">
          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Subscription Tiers</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()} className="h-8 sm:h-9 text-xs font-semibold px-3 sm:px-3.5 rounded-lg flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add Tier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl p-4 sm:p-5 rounded-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    {editingTier ? 'Edit Tier' : 'Create New Tier'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Tier Name*</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Pro, Premium"
                        className="h-8 sm:h-9 text-xs rounded-lg"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Order</Label>
                      <Input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                        className="h-8 sm:h-9 text-xs rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-700">Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe this tier..."
                      className="text-xs rounded-lg min-h-[60px] resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Billing Cycle*</Label>
                      <select
                        value={formData.billingCycle}
                        onChange={(e) => {
                          const cycle = e.target.value as 'WEEKLY' | 'MONTHLY' | 'YEARLY'
                          setFormData({
                            ...formData,
                            billingCycle: cycle,
                            weeklyPrice: cycle === 'WEEKLY' ? formData.weeklyPrice : '0',
                            monthlyPrice: cycle === 'MONTHLY' ? formData.monthlyPrice : '0',
                            yearlyPrice: cycle === 'YEARLY' ? formData.yearlyPrice : '0',
                          })
                        }}
                        className="w-full h-8 sm:h-9 px-3 text-xs border rounded-lg border-slate-200 bg-white"
                      >
                        <option value="WEEKLY">Weekly Billing</option>
                        <option value="MONTHLY">Monthly Billing</option>
                        <option value="YEARLY">Yearly Billing</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Price (GHS)*</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={
                          formData.billingCycle === 'WEEKLY'
                            ? formData.weeklyPrice
                            : formData.billingCycle === 'MONTHLY'
                            ? formData.monthlyPrice
                            : formData.yearlyPrice
                        }
                        onChange={(e) => {
                          const newFormData = { ...formData }
                          if (formData.billingCycle === 'WEEKLY') {
                            newFormData.weeklyPrice = e.target.value
                          } else if (formData.billingCycle === 'MONTHLY') {
                            newFormData.monthlyPrice = e.target.value
                          } else {
                            newFormData.yearlyPrice = e.target.value
                          }
                          setFormData(newFormData)
                        }}
                        placeholder="Enter price"
                        className="h-8 sm:h-9 text-xs rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Storage Limit (MB)</Label>
                      <Input
                        type="number"
                        value={formData.storageLimit}
                        onChange={(e) => setFormData({ ...formData, storageLimit: e.target.value })}
                        className="h-8 sm:h-9 text-xs rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-700">Monthly Listings</Label>
                      <Input
                        type="number"
                        value={formData.monthlyListings}
                        onChange={(e) => setFormData({ ...formData, monthlyListings: e.target.value })}
                        className="h-8 sm:h-9 text-xs rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-slate-700">Features (comma-separated)</Label>
                    <Textarea
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      placeholder="e.g., Advanced Analytics, Priority Support, Custom Domain"
                      className="text-xs rounded-lg min-h-[60px] resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-700">Analytics Access</Label>
                      <Switch
                        checked={formData.analyticsAccess}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, analyticsAccess: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-700">Priority Support</Label>
                      <Switch
                        checked={formData.prioritySupport}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, prioritySupport: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-700">Featured Badge</Label>
                      <Switch
                        checked={formData.featuredBadge}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, featuredBadge: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-700">Active Status</Label>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="h-8 px-3 text-xs rounded-lg">
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="h-8 px-3.5 text-xs rounded-lg">
                      {editingTier ? 'Update Tier' : 'Create Tier'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {tiers.map((tier) => {
              const { price, label } = getBillingInfo(tier)
              return (
                <div
                  key={tier.id}
                  className={`bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all space-y-3 ${
                    !tier.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{tier.name}</h3>
                        {tier.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{tier.description}</p>
                        )}
                      </div>
                      <Badge
                        variant={tier.isActive ? "default" : "secondary"}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      >
                        {tier.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-100 flex items-baseline justify-between">
                      <span className="text-[11px] font-mono text-slate-500 uppercase">{label}</span>
                      <span className="text-base font-bold font-mono text-indigo-600">
                        GHS {(price / 100).toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{tier.monthlyListings} listings/month</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{tier.storageLimit}MB storage</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {tier.analyticsAccess && (
                        <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0.5 rounded">
                          <TrendingUp className="w-2.5 h-2.5 mr-1" />
                          Analytics
                        </Badge>
                      )}
                      {tier.prioritySupport && (
                        <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0.5 rounded">
                          Priority Support
                        </Badge>
                      )}
                      {tier.featuredBadge && (
                        <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0.5 rounded">
                          Featured Badge
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(tier)}
                      className="h-7 sm:h-8 flex-1 text-xs rounded-lg"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(tier.id)}
                      className="h-7 sm:h-8 px-2.5 text-xs rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        {/* Active Subscriptions Tab */}
        <TabsContent value="active" className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-3 border-b border-slate-200/80 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">All Subscriptions</h2>
              <span className="text-xs text-slate-500 font-mono">{subscriptions.length} active records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80 border-b border-slate-200/80">
                  <tr>
                    <th className="px-3.5 py-2 text-left text-[10px] font-mono uppercase text-slate-500">Professional</th>
                    <th className="px-3.5 py-2 text-left text-[10px] font-mono uppercase text-slate-500">Tier</th>
                    <th className="px-3.5 py-2 text-left text-[10px] font-mono uppercase text-slate-500">Billing</th>
                    <th className="px-3.5 py-2 text-left text-[10px] font-mono uppercase text-slate-500">Amount</th>
                    <th className="px-3.5 py-2 text-left text-[10px] font-mono uppercase text-slate-500">Status</th>
                    <th className="px-3.5 py-2 text-left text-[10px] font-mono uppercase text-slate-500">Renewal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500">
                        No subscriptions found
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3.5 py-2.5 text-xs font-medium text-slate-900">
                          {sub.professional?.businessName || sub.professional?.name || 'N/A'}
                        </td>
                        <td className="px-3.5 py-2.5 text-xs text-slate-600 font-medium">{sub.tier?.name}</td>
                        <td className="px-3.5 py-2.5 text-xs text-slate-500 capitalize">{sub.billingCycle.toLowerCase()}</td>
                        <td className="px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-900">GHS {sub.currentAmount}</td>
                        <td className="px-3.5 py-2.5">
                          <Badge
                            variant={
                              sub.status === 'ACTIVE'
                                ? 'default'
                                : sub.status === 'CANCELLED'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          >
                            {sub.status}
                          </Badge>
                        </td>
                        <td className="px-3.5 py-2.5 text-xs text-slate-500 font-mono">
                          {new Date(sub.nextRenewalDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Trials Tab */}
        <TabsContent value="trials" className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-3 border-b border-slate-200/80 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">All Professional Trials</h2>
              <span className="text-xs text-slate-500 font-mono">{trials.length} trial records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80 border-b border-slate-200/80">
                  <tr>
                    <th className="px-3.5 py-2 text-left text-[10px] font-mono uppercase text-slate-500">Professional</th>
                    <th className="px-3.5 py-2 text-left text-[10px] font-mono uppercase text-slate-500">Started</th>
                    <th className="px-3.5 py-2 text-left text-[10px] font-mono uppercase text-slate-500">Trial Ends</th>
                    <th className="px-3.5 py-2 text-left text-[10px] font-mono uppercase text-slate-500">Remaining</th>
                    <th className="px-3.5 py-2 text-left text-[10px] font-mono uppercase text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trials.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-500">
                        No trials found
                      </td>
                    </tr>
                  ) : (
                    trials.map((trial) => {
                      const daysRemaining = Math.ceil(
                        (new Date(trial.endDate).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                      return (
                        <tr key={trial.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-3.5 py-2.5 text-xs font-medium text-slate-900">
                            {trial.professional?.businessName || trial.professional?.name || 'N/A'}
                          </td>
                          <td className="px-3.5 py-2.5 text-xs text-slate-500 font-mono">
                            {new Date(trial.startDate).toLocaleDateString()}
                          </td>
                          <td className="px-3.5 py-2.5 text-xs text-slate-500 font-mono">
                            {new Date(trial.endDate).toLocaleDateString()}
                          </td>
                          <td className="px-3.5 py-2.5 text-xs font-mono font-medium text-slate-800">{daysRemaining} days</td>
                          <td className="px-3.5 py-2.5">
                            <Badge
                              variant={trial.completed ? 'secondary' : daysRemaining > 3 ? 'default' : 'destructive'}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            >
                              {trial.completed ? 'Completed' : daysRemaining > 0 ? 'Active' : 'Expired'}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

