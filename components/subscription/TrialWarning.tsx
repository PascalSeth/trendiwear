'use client'

import { AlertCircle, Clock, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface TrialWarningProps {
  daysRemaining: number
  onDismiss?: () => void
}

export function TrialWarning({ daysRemaining, onDismiss }: TrialWarningProps) {
  if (daysRemaining <= 0) return null

  const isExpiringSoon = daysRemaining <= 7
  const isLastDay = daysRemaining === 1

  return (
    <Card
      className={`border-2 ${
        isLastDay
          ? 'border-red-500 bg-red-50'
          : isExpiringSoon
            ? 'border-yellow-500 bg-yellow-50'
            : 'border-blue-500 bg-blue-50'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {isLastDay ? (
              <AlertCircle className="w-6 h-6 text-red-600" />
            ) : isExpiringSoon ? (
              <Clock className="w-6 h-6 text-yellow-600" />
            ) : (
              <Award className="w-6 h-6 text-blue-600" />
            )}
            <CardTitle
              className={`${
                isLastDay ? 'text-red-900' : isExpiringSoon ? 'text-yellow-900' : 'text-blue-900'
              }`}
            >
              {isLastDay
                ? '⏰ Trial Ending Today!'
                : isExpiringSoon
                  ? `📦 Trial Expiring in ${daysRemaining} Days`
                  : `📅 Free Trial: ${daysRemaining} Days Left`}
            </CardTitle>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p
          className={`text-sm ${
            isLastDay ? 'text-red-800' : isExpiringSoon ? 'text-yellow-800' : 'text-blue-800'
          }`}
        >
          {isLastDay
            ? 'Your free 3-month trial ends today. Subscribe now to continue using all features, or they will be restricted.'
            : isExpiringSoon
              ? `Your free trial expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}. Subscribe to keep your store active and continue serving customers.`
              : 'Take advantage of your free trial to explore all features. When it ends, you can subscribe to continue.'}
        </p>

        <div className="flex gap-2 flex-wrap">
          <Link href="/dashboard/subscription">
            <Button className="bg-black text-white hover:bg-gray-900">
              Subscribe Now
            </Button>
          </Link>
          {!isLastDay && (
            <Button variant="outline">
              Learn More
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-600 mt-2">
          After trial ends, most dashboard features will be restricted to view-only mode unless you have an active subscription.
        </p>
      </CardContent>
    </Card>
  )
}
