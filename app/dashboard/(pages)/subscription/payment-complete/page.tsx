'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function PaymentCompletePage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference')

      if (!reference) {
        setStatus('failed')
        setMessage('No payment reference found')
        return
      }

      try {
        // Verify payment with backend
        const response = await fetch(`/api/subscriptions/verify?reference=${reference}`, {
          method: 'GET',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setStatus('success')
            setMessage('Subscription activated successfully! Your new plan is now active.')
          } else {
            setStatus('failed')
            setMessage(data.error || 'Payment verification failed')
          }
        } else {
          setStatus('failed')
          setMessage('Failed to verify payment')
        }
      } catch (error) {
        console.error('Error verifying payment:', error)
        setStatus('failed')
        setMessage('An error occurred while verifying your payment')
      }
    }

    verifyPayment()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-12 h-12 text-green-500" />
            )}
            {status === 'failed' && (
              <AlertCircle className="w-12 h-12 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verifying Payment...'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-center text-gray-600">
            {message}
          </p>

          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">What&apos;s Next?</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>✓ Your subscription is now active</li>
                <li>✓ All features are unlocked</li>
                <li>✓ Your next billing date information is in your account</li>
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-4">
            <Link href="/dashboard" className="w-full">
              <Button className="w-full bg-black text-white hover:bg-gray-900">
                Go to Dashboard
              </Button>
            </Link>

            <Link href="/dashboard/subscription/current" className="w-full">
              <Button variant="outline" className="w-full">
                View Subscription Details
              </Button>
            </Link>
          </div>

          <p className="text-xs text-center text-gray-500">
            Need help? <a href="/support" className="text-blue-600 hover:underline">Contact Support</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
