'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, ArrowRight, Loader2, Crown, Diamond, Package } from 'lucide-react'

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
}

type BillingCycle = 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export function SubscriptionTiers({
  onSelectTier,
  loading = false,
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
        // Sort tiers by order or name
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
      <div className="w-full flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Curating plans for you...</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-12">
      {/* Billing Selector Toggle */}
      <div className="flex justify-center">
        <div className="relative flex p-1.5 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200">
          {(['WEEKLY', 'MONTHLY', 'YEARLY'] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setActiveCycle(cycle)}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 z-10 ${
                activeCycle === cycle ? 'text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {activeCycle === cycle && (
                <motion.div
                  layoutId="activeCycle"
                  className="absolute inset-0 bg-slate-900 rounded-xl -z-10 shadow-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative">
                {cycle}
                {cycle === 'YEARLY' && (
                  <Badge className="absolute -top-6 -right-4 bg-emerald-500 text-[10px] px-2 py-0 border-none shadow-sm">Save 20%</Badge>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid md:grid-cols-3 gap-8 items-stretch">
        <AnimatePresence mode="wait">
          {tiers.map((tier, index) => {
            const price =
              activeCycle === 'WEEKLY'
                ? tier.weeklyPrice
                : activeCycle === 'MONTHLY'
                  ? tier.monthlyPrice
                  : tier.yearlyPrice

            // Highlight the middle one or a specific one based on business logic
            const isFeatured = tier.name.toLowerCase().includes('ohene') || tier.name.toLowerCase().includes('professional')
            const isLegend = tier.name.toLowerCase().includes('legend')
            const tierIcon = isLegend ? <Diamond /> : isFeatured ? <Crown /> : <Package />

            return (
              <motion.div
                key={`${tier.id}-${activeCycle}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="h-full"
              >
                <Card
                  className={`relative h-full flex flex-col rounded-[2.5rem] border-2 transition-all duration-500 group hover:shadow-2xl hover:-translate-y-2 ${
                    isFeatured 
                      ? 'border-violet-600 bg-violet-50/30' 
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  {isFeatured && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                      Recommended for Growth
                    </div>
                  )}

                  <CardHeader className="pt-10 pb-6 px-8 text-center sm:text-left">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm mx-auto sm:mx-0 ${
                      isFeatured ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tierIcon}
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tighter uppercase italic">{tier.name}</CardTitle>
                    <CardDescription className="text-slate-500 font-medium text-base mt-2 leading-relaxed min-h-[48px]">
                      {tier.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-8 flex-grow">
                    <div className="mb-8 text-center sm:text-left">
                      <div className="flex items-baseline justify-center sm:justify-start gap-1">
                        <span className="text-sm font-black text-slate-400">GH₵</span>
                        <span className="text-6xl font-black tracking-tighter text-slate-900">{price.toFixed(0)}</span>
                        <span className="text-base font-bold text-slate-400">/{activeCycle === 'YEARLY' ? 'YR' : activeCycle === 'MONTHLY' ? 'MO' : 'WK'}</span>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">What&apos;s Included</p>
                       <ul className="space-y-4">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className={`mt-1 flex-shrink-0 ${isFeatured ? 'text-violet-600' : 'text-slate-400'}`}>
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-slate-700 leading-tight">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>

                  <CardFooter className="p-8 mt-auto pt-0">
                    <Button
                      onClick={() => onSelectTier(tier.id, activeCycle)}
                      disabled={loading}
                      className={`w-full py-7 rounded-2xl text-lg font-black uppercase transition-all shadow-xl hover:shadow-2xl ${
                        isFeatured 
                          ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200' 
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200'
                      }`}
                    >
                      {loading ? (
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      ) : (
                        <>Get Started <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}


