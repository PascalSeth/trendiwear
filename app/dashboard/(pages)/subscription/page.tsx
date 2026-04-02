'use client'

import { useState } from 'react'
import { SubscriptionTiers } from '@/components/subscription/SubscriptionTiers'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectTier = async (tierId: string, billingCycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY') => {
    setLoading(true)
    setError(null)

    try {
      // Step 1: Create/update subscription
      const subscriptionResponse = await fetch('/api/subscriptions/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId,
          billingCycle,
        }),
      })

      if (!subscriptionResponse.ok) {
        throw new Error('Failed to create subscription')
      }

      await subscriptionResponse.json()

      // Step 2: Initialize payment
      const paymentResponse = await fetch('/api/subscriptions/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId,
          billingCycle,
          callbackUrl: `${window.location.origin}/dashboard/subscription/payment-complete`,
        }),
      })

      if (!paymentResponse.ok) {
        throw new Error('Failed to initialize payment')
      }

      const paymentData = await paymentResponse.json()

      // Redirect to Paystack payment page
      if (paymentData.data?.authorizationUrl) {
        window.location.href = paymentData.data.authorizationUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Subscription Plans
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Choose a plan that works for your growing fashion business
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Tabs for Current and Available Plans */}
        <div className="mb-8">
          <div className="flex items-center gap-4 border-b border-gray-200">
            <button className="px-4 py-2 border-b-2 border-black text-black font-medium">
              Available Plans
            </button>
            <Link href="/dashboard/subscription/current">
              <button className="px-4 py-2 border-b-2 border-transparent text-gray-600 font-medium hover:text-gray-900">
                Current Subscription
              </button>
            </Link>
          </div>
        </div>

        {/* Subscription Tiers */}
        <div className="mb-12">
          <SubscriptionTiers
            onSelectTier={handleSelectTier}
            loading={loading}
          />
        </div>

        {/* FAQ Section */}
        <div className="mt-20 bg-white rounded-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Can I change my plan anytime?</h3>
              <p className="text-gray-600 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes will take effect on your next billing cycle.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600 text-sm">
                We offer a 7-day money-back guarantee if you&apos;re not satisfied with your subscription.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What happens after my trial ends?</h3>
              <p className="text-gray-600 text-sm">
                Once your 3-month trial ends, most dashboard features become restricted to view-only mode until you subscribe.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600 text-sm">
                We accept Mobile Money (MTN, Telecel, AirtelTigo), cards, and bank transfers via Paystack.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600 text-sm">
                Yes, you can cancel your subscription anytime. You&apos;ll retain access until the end of your billing period.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Do you have annual discounts?</h3>
              <p className="text-gray-600 text-sm">
                Yes! The yearly plan offers significant savings compared to monthly billing. Check the pricing above.
              </p>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-12 text-center p-8 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold mb-2">Need Help Choosing?</h3>
          <p className="text-gray-700 mb-4">
            Our support team is ready to help you find the perfect plan for your business.
          </p>
          <a href="mailto:support@trendiwear.com" className="text-blue-600 hover:text-blue-700 font-medium">
            Contact Support →
          </a>
        </div>
      </div>
    </div>
  )
}
