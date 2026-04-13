'use client'

import { CurrentSubscriptionStatus } from '@/components/subscription/CurrentSubscriptionStatus'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CurrentSubscriptionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            My Subscription
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your current subscription plan and billing information
          </p>
        </div>

        {/* Current Subscription */}
        <CurrentSubscriptionStatus />

        {/* Back Button */}
        <div className="mt-8">
          <Link href="/dashboard/subscription">
            <Button variant="outline" className="w-full">
              ← View All Plans
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
