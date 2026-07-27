'use client'

import { useEffect, useState } from 'react'
import { 
  AlertCircle, 
  Loader2, 
  Calendar, 
  CreditCard, 
  ArrowRight, 
  ShieldCheck, 
  Diamond, 
  Package, 
  Sparkles,
  Zap
} from 'lucide-react'

interface SubscriptionData {
  isOnTrial: boolean
  daysRemaining: number
  productCount: number
  productLimit: number
  isLimitReached: boolean
  aiCreditsBalance?: number
  aiCreditsLimit?: number
  subscriptionStatus: string | null
  currentSubscription: {
    id: string
    status: string
    billingCycle: string
    currentAmount: number
    nextRenewalDate: string
    startDate: string
    tier: {
      name: string
      description: string
      features: string[]
      analyticsAccess: boolean
      prioritySupport: boolean
      aiCreditsLimit?: number
    }
  } | null
  trial: {
    id: string
    startDate: string
    endDate: string
  } | null
  isTrialExpired: boolean
}

export function CurrentSubscriptionStatus() {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [])

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscriptions/trial')
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      } else {
        setError('Failed to sync membership data')
      }
    } catch (err) {
      console.error('Error fetching subscription:', err)
      setError('An error occurred while connecting to membership server')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-8 flex items-center justify-center min-h-[220px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-bold text-slate-500">Syncing membership status...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-4 text-rose-700">
        <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-rose-900 leading-tight">Membership Sync Error</h4>
          <p className="text-xs font-medium text-rose-600 mt-0.5">{error}</p>
        </div>
      </div>
    )
  }

  // --- 1. EXPIRED TRIAL & NO ACTIVE SUBSCRIPTION ---
  if (!data?.isOnTrial && !data?.currentSubscription && data?.isTrialExpired) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Access Suspended</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Trial Concluded — View-Only Mode Active
          </h2>
          <p className="text-xs font-medium text-slate-500 leading-relaxed">
            Your 90-day free professional trial has expired. Activate a membership plan below to restore full product creation, service bookings, and AI Studio features.
          </p>
        </div>
        <a href="#plan-selection" className="shrink-0 w-full md:w-auto">
          <button className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2">
            Activate Membership Now <ArrowRight className="w-4 h-4" />
          </button>
        </a>
      </div>
    )
  }

  // --- 2. TRIAL ACTIVE STATE ---
  if (data?.isOnTrial && !data?.currentSubscription) {
    const trialProgress = Math.min(100, (data.productCount / (data.productLimit || 1)) * 100)
    const availableCredits = data.aiCreditsBalance ?? 10
    const creditsLimit = data.aiCreditsLimit ?? 10
    
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Active Free Trial
              </span>
              <span className="text-xs font-bold text-slate-400">90-Day Plan</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Free Artisan Plan
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Starter merchant features with 15 listings and 10 monthly AI Studio credits.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a href="#plan-selection">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Upgrade Plan
              </button>
            </a>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Trial Expiry
            </div>
            <p className="text-sm font-black text-slate-900">
              {data.trial?.endDate ? new Date(data.trial.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI Studio Credits
            </div>
            <p className="text-sm font-black text-slate-900">
              ⚡ {availableCredits} / {creditsLimit} Left
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <Package className="w-3.5 h-3.5 text-indigo-600" /> Product Slots
            </div>
            <p className="text-sm font-black text-slate-900">
              {data.productCount} / {data.productLimit} Used
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Capacity Status
            </div>
            <p className={`text-sm font-black ${data.isLimitReached ? 'text-rose-600' : 'text-emerald-600'}`}>
              {data.isLimitReached ? 'Slots Full' : 'Active & Ready'}
            </p>
          </div>

        </div>

        {/* Capacity Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-600">
            <span>Product Listing Capacity</span>
            <span className={data.isLimitReached ? 'text-rose-600 font-extrabold' : 'text-slate-900'}>
              {Math.round(trialProgress)}% Occupied ({data.productCount}/{data.productLimit})
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-700 ${data.isLimitReached ? 'bg-rose-500' : 'bg-indigo-600'}`}
              style={{ width: `${trialProgress}%` }}
            />
          </div>
        </div>

      </div>
    )
  }

  // --- 3. PAID SUBSCRIPTION ACTIVE STATE ---
  if (data?.currentSubscription) {
    const subscription = data.currentSubscription
    const renewalDate = new Date(subscription.nextRenewalDate)
    const startDate = new Date(subscription.startDate || Date.now())
    const today = new Date()
    
    const totalDays = Math.ceil((renewalDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysUsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const progress = Math.min(100, Math.max(0, (daysUsed / (totalDays || 1)) * 100))
    const daysRemaining = Math.max(0, totalDays - daysUsed)
    
    const isInactive = subscription.status === 'INACTIVE'
    const isLegend = subscription.tier?.name?.toLowerCase().includes('legend')
    const availableCredits = data.aiCreditsBalance ?? (subscription.tier?.aiCreditsLimit || 40)
    const creditsLimit = subscription.tier?.aiCreditsLimit || 40

    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        
        {isInactive && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Payment verification pending. Complete checkout or verify transaction to activate your plan.</span>
          </div>
        )}

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                subscription.status === 'ACTIVE' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                  subscription.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-amber-600'
                }`} />
                {subscription.status}
              </span>
              <span className="text-xs font-bold text-slate-400">{subscription.billingCycle} Billing</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {subscription.tier?.name || 'Pro Merchant Plan'}
              {isLegend && <Diamond className="w-5 h-5 text-indigo-600" />}
            </h2>
            <p className="text-xs font-medium text-slate-500">
              {subscription.tier?.description || 'Active professional merchant access'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a href="#plan-selection">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Change / Upgrade Plan
              </button>
            </a>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Next Renewal Date
            </div>
            <p className="text-sm font-black text-slate-900">
              {renewalDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Membership Rate
            </div>
            <p className="text-sm font-black text-slate-900">
              GH₵ {subscription.currentAmount.toFixed(2)} / {subscription.billingCycle.toLowerCase()}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI Studio Credits
            </div>
            <p className="text-sm font-black text-slate-900">
              ⚡ {availableCredits} / {creditsLimit} Left
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Cycle Days Remaining
            </div>
            <p className="text-sm font-black text-slate-900">
              {daysRemaining} Days Left
            </p>
          </div>

        </div>

        {/* Billing Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-600">
            <span>Billing Cycle Completion</span>
            <span className="text-slate-900">{Math.round(progress)}% Completed</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

      </div>
    )
  }

  return null
}
