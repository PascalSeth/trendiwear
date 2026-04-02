'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle } from 'lucide-react'


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

export function SubscriptionTiers({
  onSelectTier,
  loading = false,
}: SubscriptionTiersProps) {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [  loadingTiers, setLoadingTiers] = useState(true)

  useEffect(() => {
    fetchTiers()
  }, [])

  const fetchTiers = async () => {
    try {
      const response = await fetch('/api/subscriptions/tiers')
      if (response.ok) {
        const data = await response.json()
        setTiers(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching tiers:', error)
    } finally {
      setLoadingTiers(false)
    }
  }

  if (loadingTiers) {
    return <div className="text-center py-8">Loading subscription plans...</div>
  }

  return (
    <div className="w-full">
      {/* Three Phases Grid */}
      <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
        {tiers.flatMap((tier) =>
          (['WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((cycle) => {
            const price =
              cycle === 'WEEKLY'
                ? tier.weeklyPrice
                : cycle === 'MONTHLY'
                  ? tier.monthlyPrice
                  : tier.yearlyPrice

            // We can highlight the Monthly one as "Most Popular"
            const isFeatured = cycle === 'MONTHLY'

            return (
              <Card
                key={`${tier.id}-${cycle}`}
                className={`relative flex flex-col transition-all hover:shadow-xl ${
                  isFeatured ? 'ring-2 ring-black scale-105 z-10' : 'opacity-95'
                }`}
              >
                {isFeatured && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge variant="default" className="bg-black text-white px-4 py-1">
                      Best Value
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {cycle} PHASE
                  </div>
                  <CardTitle className="text-2xl font-black">{tier.name}</CardTitle>
                  <CardDescription className="min-h-[40px]">{tier.description}</CardDescription>
                  <div className="mt-6">
                    <div className="text-5xl font-black tracking-tighter">
                      GHS {price.toFixed(2)}
                    </div>
                    <div className="text-sm font-medium text-gray-500 mt-1">
                      per {cycle.toLowerCase()}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow space-y-4">
                  <div className="h-px bg-gray-100 w-full my-4" />
                  <ul className="space-y-4">
                    {tier.features.slice(0, 5).map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-gray-700">
                        {feature}
                      </span>
                    </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-6">
                  <Button
                    onClick={() => onSelectTier(tier.id, cycle)}
                    disabled={loading}
                    className={`w-full py-6 text-lg font-bold transition-all ${
                      isFeatured 
                        ? 'bg-black hover:bg-gray-800 text-white shadow-lg' 
                        : 'bg-white border-2 border-black text-black hover:bg-gray-50'
                    }`}
                  >
                    {loading ? 'Processing...' : `Start ${cycle.toLowerCase()} Plan`}
                  </Button>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
