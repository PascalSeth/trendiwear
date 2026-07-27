'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Crown, Diamond, Package, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react'

interface SubscriptionTier {
  id: string
  name: string
  description?: string
  weeklyPrice: number
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  analyticsAccess: boolean
  prioritySupport: boolean
  featuredBadge: boolean
  monthlyListings: number
  storageLimit: number
}

interface SubscriptionTiersProps {
  onSelectTier: (tierId: string, billingCycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY') => void
  loading?: boolean
  selectedTierId?: string | null
}

type BillingCycle = 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export function SubscriptionTiers({
  onSelectTier,
  loading = false,
  selectedTierId = null
}: SubscriptionTiersProps) {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [loadingTiers, setLoadingTiers] = useState(true)
  const [activeCycle, setActiveCycle] = useState<BillingCycle>('MONTHLY')

  useEffect(() => {
    fetchTiers()
  }, [])

  const fetchTiers = async () => {
    try {
      const response = await fetch('/api/subscriptions/tiers')
      if (response.ok) {
        const data = await response.json()
        const sorted = (data.data || []).sort((a: SubscriptionTier, b: SubscriptionTier) => (a.id > b.id ? 1 : -1))
        setTiers(sorted)
      }
    } catch (error) {
      console.error('Error fetching tiers:', error)
    } finally {
      setLoadingTiers(false)
    }
  }

  if (loadingTiers) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-12 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading subscription plans...</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8" id="plan-selection">
      
      {/* Billing Selector Toggle Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/80">
          {(['WEEKLY', 'MONTHLY', 'YEARLY'] as BillingCycle[]).map((cycle) => {
            const isActive = activeCycle === cycle
            return (
              <button
                key={cycle}
                onClick={() => setActiveCycle(cycle)}
                className={`relative px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>
                  {cycle === 'WEEKLY' ? 'Weekly' : cycle === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                </span>
                {cycle === 'YEARLY' && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-extrabold uppercase">
                    Save 20%
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {tiers.map((tier) => {
          const price =
            activeCycle === 'WEEKLY'
              ? tier.weeklyPrice
              : activeCycle === 'MONTHLY'
                ? tier.monthlyPrice
                : tier.yearlyPrice

          const isFree = price === 0
          const isFeatured = tier.featuredBadge || tier.name.toLowerCase().includes('ohene') || tier.name.toLowerCase().includes('royal')
          const isLegend = tier.name.toLowerCase().includes('legend')
          const isProcessing = loading && selectedTierId === tier.id

          return (
            <div
              key={`${tier.id}-${activeCycle}`}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between space-y-6 transition-all duration-300 relative ${
                isFeatured 
                  ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20' 
                  : 'border-slate-200/80 shadow-xs hover:border-indigo-300'
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Recommended Choice
                </div>
              )}

              {/* Card Header & Price */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{tier.name}</h3>
                  <div className={`p-2 rounded-xl ${isFeatured ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                    {isLegend ? <Diamond className="w-5 h-5" /> : isFeatured ? <Crown className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                  </div>
                </div>

                <p className="text-xs font-medium text-slate-500 min-h-[36px]">
                  {tier.description || 'Essential features to power your storefront.'}
                </p>

                <div className="flex items-baseline gap-1 pt-2">
                  {isFree ? (
                    <span className="text-3xl font-black tracking-tight text-slate-900">Free Starter</span>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-slate-400">GH₵</span>
                      <span className="text-4xl font-black tracking-tight text-slate-900">{price.toFixed(0)}</span>
                      <span className="text-xs font-bold text-slate-400">/{activeCycle.toLowerCase()}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3 pt-2 border-t border-slate-100 flex-grow">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Plan Features</span>
                <ul className="space-y-2.5">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Subscribe CTA Button */}
              <div className="pt-4 border-t border-slate-100">
                <Button
                  onClick={() => onSelectTier(tier.id, activeCycle)}
                  disabled={loading}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 ${
                    isFeatured
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      {isFree ? 'Activate Free Plan' : `Subscribe to ${tier.name}`} <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}
