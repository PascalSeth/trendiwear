'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { 
  AlertCircle, 
  Loader2, 
  Calendar, 
  CreditCard, 
  ArrowRight, 
  User, 
  ShieldCheck, 
  Diamond, 
  Package, 
  Layers,
  ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'

interface SubscriptionData {
  isOnTrial: boolean
  daysRemaining: number
  productCount: number
  productLimit: number
  isLimitReached: boolean
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
    } catch (error) {
      console.error('Error fetching subscription:', error)
      setError('An error occurred while connecting to session server')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-violet-600 animate-spin" />
          <div className="absolute inset-0 blur-xl bg-violet-400/20 rounded-full animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-rose-700 shadow-sm"
      >
        <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-rose-900 leading-none mb-1">Session Outage</h3>
          <p className="text-sm text-rose-600 font-medium">{error}</p>
        </div>
      </motion.div>
    )
  }

  // --- 1. NO ACCESS STATE (Expired Trial and No Subscription) ---
  if (!data?.isOnTrial && !data?.currentSubscription && data?.isTrialExpired) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden group p-10 rounded-[2.5rem] bg-white border border-slate-200 shadow-2xl shadow-slate-200/50"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-slate-50 rounded-full group-hover:scale-110 transition-transform duration-1000" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center flex-shrink-0 shadow-inner">
            <Package className="w-10 h-10 text-slate-400" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2 uppercase italic">Access Suspended</h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md">
              Your professional trial has concluded. Activate a plan to resume shop operations and unlock unlimited features.
            </p>
          </div>
          <Link href="/dashboard/subscription" className="w-full md:w-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-8 py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 group/btn"
            >
              Reactivate Now <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        </div>
      </motion.div>
    )
  }

  // --- 2. TRIAL STATE ---
  if (data?.isOnTrial && !data?.currentSubscription) {
    const trialProgress = (data.productCount / data.productLimit) * 100
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full"
      >
        <div className="absolute inset-x-0 inset-y-0 -m-4 blur-3xl rounded-[3rem] opacity-20 -z-10 bg-slate-400" />

        <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl">
          <div className="relative p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-900">
                    <Layers className="w-6 h-6" />
                  </div>
                  <Badge className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-none bg-slate-900 text-white animate-pulse">
                    On Trial
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-slate-900">Professional Trial</h1>
                <p className="text-lg font-medium text-slate-500 max-w-md">
                  Experience full shop capabilities for 3 months. Upgrade anytime to lift product limits.
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 text-right">
                <span className="text-sm font-black uppercase tracking-widest opacity-60 text-slate-500">Inventory Status</span>
                <div className="text-5xl font-black tracking-tighter text-slate-900">
                  {data.productCount} <span className="text-xl opacity-40 ml-1">/ {data.productLimit} slots</span>
                </div>
              </div>
            </div>

            {/* Trial Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl mb-12 bg-slate-50 border border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest opacity-50 text-slate-900">
                  <Calendar className="w-4 h-4" /> Trial Expiry
                </div>
                <div className="text-xl font-black tracking-tight text-slate-900">
                  {new Date(data.trial?.endDate || '').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest opacity-50 text-slate-900">
                   <ShieldCheck className="w-4 h-4" /> Days Remaining
                </div>
                <div className="text-xl font-black tracking-tight text-slate-900">{data.daysRemaining} Days Left</div>
              </div>
            </div>

            {/* Inventory Gauge */}
            <div className="space-y-6 mb-12">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <span>Shop Capacity Usage</span>
                <span className={data.isLimitReached ? 'text-rose-600' : 'text-slate-900'}>
                    {data.isLimitReached ? 'Limit Reached' : `${Math.round(trialProgress)}% Occupied`}
                </span>
              </div>
              <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-100/50">
                  <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${trialProgress}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${data.isLimitReached ? 'bg-rose-500' : 'bg-slate-900 shadow-[0_0_20px_rgba(15,23,42,0.1)]'}`}
                  />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard/subscription" className="flex-1">
                <button className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-slate-900/10">
                  Unlock Unlimited Slots <ArrowUpRight className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // --- 3. PAID SUBSCRIPTION STATE ---
  if (data?.currentSubscription) {
    const subscription = data.currentSubscription
    const renewalDate = new Date(subscription.nextRenewalDate)
    const startDate = new Date(subscription.startDate || Date.now())
    const today = new Date()
    
    const totalDays = Math.ceil((renewalDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysUsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const progress = Math.min(100, Math.max(0, (daysUsed / (totalDays || 1)) * 100))
    const daysRemaining = Math.max(0, totalDays - daysUsed)

    const isLegend = subscription.tier?.name?.toLowerCase().includes('legend')
    const isOhene = subscription.tier?.name?.toLowerCase().includes('ohene') || 
                    subscription.tier?.name?.toLowerCase().includes('obaahemaa')

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full"
      >
        <div className={`absolute inset-x-0 inset-y-0 -m-4 blur-3xl rounded-[3rem] opacity-20 -z-10 ${
          isLegend ? 'bg-indigo-600' : isOhene ? 'bg-amber-500' : 'bg-violet-600'
        }`} />

        <div className={`overflow-hidden rounded-[2.5rem] border shadow-2xl ${
          isLegend 
            ? 'bg-slate-950 border-white/10 text-white' 
            : isOhene 
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400/50 text-white' 
              : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="relative p-8 md:p-10">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl flex items-center justify-center ${
                    isLegend ? 'bg-indigo-500/20' : isOhene ? 'bg-white/20' : 'bg-slate-100'
                  }`}>
                    {isLegend ? <Diamond className="w-6 h-6 text-indigo-400" /> : <User className="w-6 h-6 text-current" />}
                  </div>
                  <Badge className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-none animate-pulse ${
                      isLegend ? 'bg-indigo-500 text-white' : isOhene ? 'bg-white text-amber-600' : 'bg-slate-900 text-white'
                  }`}>
                    {subscription.status}
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">{subscription.tier?.name || 'Standard Plan'}</h1>
                <p className={`text-lg font-medium opacity-80 max-w-md ${isLegend || isOhene ? 'text-white/90' : 'text-slate-600'}`}>
                  {subscription.tier?.description || 'Active professional access'}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 text-right">
                <span className={`text-sm font-black uppercase tracking-widest opacity-60 ${isLegend || isOhene ? 'text-white' : 'text-slate-500'}`}>Membership Worth</span>
                <div className="text-5xl font-black tracking-tighter">
                  GH₵ {subscription.currentAmount.toFixed(2)}
                  <span className="text-xl opacity-60 ml-2">/ {subscription.billingCycle.toLowerCase()}</span>
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-3xl mb-12 backdrop-blur-md ${
              isLegend ? 'bg-white/5 border border-white/10' : isOhene ? 'bg-white/10 border border-white/20' : 'bg-slate-50 border border-slate-100'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-60">
                  <Calendar className="w-4 h-4" /> Next Billing
                </div>
                <div className="text-xl font-black tracking-tight">{renewalDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric'})}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-60">
                  <CreditCard className="w-4 h-4" /> Payment Plan
                </div>
                <div className="text-xl font-black tracking-tight uppercase">{subscription.billingCycle} Cycle</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-60">
                  <ShieldCheck className="w-4 h-4" /> Days Remaining
                </div>
                <div className="text-xl font-black tracking-tight">{daysRemaining} Days Left</div>
              </div>
            </div>

            <div className="space-y-6 mb-12">
              <div className="flex justify-between items-center text-sm font-black uppercase tracking-widest">
                <span>Cycle Usage</span>
                <span className="opacity-60">{Math.round(progress)}% Complete</span>
              </div>
              <div className="relative h-4 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                          isLegend ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]' : isOhene ? 'bg-white' : 'bg-violet-600'
                      }`}
                  />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard/subscription" className="flex-1">
                <button className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group ${
                  isLegend 
                    ? 'bg-white text-slate-900 hover:bg-slate-100' 
                    : isOhene 
                      ? 'bg-white text-amber-600 hover:bg-amber-50' 
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/10'
                }`}>
                  Modify Plan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
          
          <div className="absolute -bottom-8 -right-8 opacity-[0.03] select-none pointer-events-none text-slate-500">
              <h1 className="text-[12rem] font-black italic uppercase tracking-tighter leading-none">TRENDI</h1>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="w-full text-center py-10">
       <div className="w-20 h-20 bg-slate-100 rounded-3xl mx-auto flex items-center justify-center mb-6">
          <Layers className="w-10 h-10 text-slate-300" />
       </div>
       <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Awaiting Identity Context...</p>
    </div>
  )
}


