'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, DollarSign, Package, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    billingCycle: 'MONTHLY', // 'WEEKLY', 'MONTHLY', or 'YEARLY'
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
    // Determine billing cycle based on which price is set
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
    return <div className="p-8 text-center">Loading subscription data...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
        <p className="mt-2 text-gray-600">Manage subscription tiers, active subscriptions, and trials</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="tiers">Subscription Tiers</TabsTrigger>
          <TabsTrigger value="active">All Subscriptions ({subscriptions.length})</TabsTrigger>
          <TabsTrigger value="trials">All Trials ({trials.length})</TabsTrigger>
        </TabsList>

        {/* Subscription Tiers Tab */}
        <TabsContent value="tiers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Subscription Tiers</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingTier ? 'Edit Tier' : 'Create New Tier'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tier Name*</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Pro, Premium"
                        required
                      />
                    </div>
                    <div>
                      <Label>Order</Label>
                      <Input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe this tier"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Billing Cycle*</Label>
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
                        className="w-full px-3 py-2 border rounded-md border-gray-300"
                      >
                        <option value="WEEKLY">Weekly Billing</option>
                        <option value="MONTHLY">Monthly Billing</option>
                        <option value="YEARLY">Yearly Billing</option>
                      </select>
                    </div>
                    <div>
                      <Label>Price*</Label>
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
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Storage Limit (MB)</Label>
                      <Input
                        type="number"
                        value={formData.storageLimit}
                        onChange={(e) => setFormData({ ...formData, storageLimit: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Monthly Listings</Label>
                      <Input
                        type="number"
                        value={formData.monthlyListings}
                        onChange={(e) => setFormData({ ...formData, monthlyListings: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Features (comma-separated)</Label>
                    <Textarea
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      placeholder="e.g., Advanced Analytics, Priority Support, Custom Domain"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Analytics Access</Label>
                      <Switch
                        checked={formData.analyticsAccess}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, analyticsAccess: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Priority Support</Label>
                      <Switch
                        checked={formData.prioritySupport}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, prioritySupport: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Featured Badge</Label>
                      <Switch
                        checked={formData.featuredBadge}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, featuredBadge: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Active</Label>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    {editingTier ? 'Update Tier' : 'Create Tier'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <Card key={tier.id} className={!tier.isActive ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{tier.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{tier.description}</p>
                    </div>
                    {!tier.isActive && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {(() => {
                      const { price, label } = getBillingInfo(tier)
                      return (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{label}:</span>
                          <span className="font-semibold text-lg text-blue-600">GHS {(price / 100).toFixed(2)}</span>
                        </div>
                      )
                    })()}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span>{tier.monthlyListings} listings/month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span>{tier.storageLimit}MB storage</span>
                    </div>
                    {tier.analyticsAccess && (
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Analytics
                      </Badge>
                    )}
                    {tier.prioritySupport && (
                      <Badge variant="outline" className="text-xs">
                        Priority Support
                      </Badge>
                    )}
                    {tier.featuredBadge && (
                      <Badge variant="outline" className="text-xs">
                        Featured Badge
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(tier)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(tier.id)}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Active Subscriptions Tab */}
        <TabsContent value="active" className="space-y-4">
          <h2 className="text-xl font-semibold">All Subscriptions</h2>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Professional</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Tier</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Billing</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Amount</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Next Renewal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{sub.professional?.businessName || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">{sub.tier.name}</td>
                      <td className="px-4 py-2 text-sm capitalize">{sub.billingCycle.toLowerCase()}</td>
                      <td className="px-4 py-2 text-sm font-medium">GHS {sub.currentAmount}</td>
                      <td className="px-4 py-2">
                        <Badge
                          variant={
                            sub.status === 'ACTIVE'
                              ? 'default'
                              : sub.status === 'CANCELLED'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {new Date(sub.nextRenewalDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Trials Tab */}
        <TabsContent value="trials" className="space-y-4">
          <h2 className="text-xl font-semibold">All Trials</h2>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Professional</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Started</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Trial Ends</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Days Remaining</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {trials.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
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
                      <tr key={trial.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">
                          {trial.professional?.businessName || 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {new Date(trial.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {new Date(trial.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium">{daysRemaining} days</td>
                        <td className="px-4 py-2">
                          <Badge variant={trial.completed ? 'secondary' : daysRemaining > 3 ? 'default' : 'destructive'}>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
