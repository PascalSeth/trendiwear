'use client'

import { AlertTriangle, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface RestrictedAccessProps {
  features: string[]
  onUpgrade?: () => void
}

export function RestrictedAccessWarning({ features, onUpgrade }: RestrictedAccessProps) {
  return (
    <Card className="border-2 border-red-500 bg-red-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <CardTitle className="text-red-900">Limited Access - Subscribe to Unlock</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-red-800">
          Your free trial has ended. The following features are currently restricted:
        </p>

        <div className="bg-white rounded-lg p-3 border border-red-200">
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-red-700">
                <Lock className="w-4 h-4" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-red-700">
          To regain access to all features, please subscribe to one of our plans below.
        </p>

        <div className="flex gap-2 pt-2">
          <Link href="/dashboard/subscription" className="flex-1">
            <Button className="w-full bg-red-600 text-white hover:bg-red-700">
              View Subscription Plans
            </Button>
          </Link>
          {onUpgrade && (
            <Button
              onClick={onUpgrade}
              variant="outline"
              className="flex-1"
            >
              Learn More
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
