'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Subscription {
  id: string
  status: string
  billingCycle: string
  currentAmount: number
  nextRenewalDate: string
  tier: {
    name: string
    description: string
    features: string[]
    analyticsAccess: boolean
    prioritySupport: boolean
  }
}

export function CurrentSubscriptionStatus() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCurrentSubscription()
  }, [])

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/manage')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.data)
      } else if (response.status === 404) {
        setSubscription(null)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
      setError('Failed to load subscription status')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading subscription status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-8">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Your trial has ended. Subscribe to a plan to continue using all features.
          </p>
          <Link href="/dashboard/subscription">
            <Button className="bg-black text-white hover:bg-gray-900">
              View Plans
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const renewalDate = new Date(subscription.nextRenewalDate)
  const today = new Date()
  const daysRemaining = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{subscription.tier.name}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{subscription.tier.description}</p>
          </div>
          <Badge
            variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}
            className={subscription.status === 'ACTIVE' ? 'bg-green-600' : ''}
          >
            {subscription.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Billing Info */}
        <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Billing Cycle</p>
            <p className="font-semibold text-lg">{subscription.billingCycle}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Amount per Cycle</p>
            <p className="font-semibold text-lg">GHS {subscription.currentAmount.toFixed(2)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Next Renewal Date</p>
            <p className="font-semibold">
              {renewalDate.toLocaleDateString()} ({daysRemaining} days)
            </p>
          </div>
        </div>

        {/* Features */}
        <div>
          <h3 className="font-semibold mb-3">Included Features</h3>
          <ul className="space-y-2">
            {subscription.tier.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>{feature}</span>
              </li>
            ))}
            {subscription.tier.analyticsAccess && (
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Advanced Analytics</span>
              </li>
            )}
            {subscription.tier.prioritySupport && (
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Priority Support</span>
              </li>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Link href="/dashboard/subscription">
            <Button variant="outline">
              Change Plan
            </Button>
          </Link>
          <Button variant="destructive" className="ml-auto">
            Cancel Subscription
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
