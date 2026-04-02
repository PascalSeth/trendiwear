'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, ArrowRight, Package, Clock } from 'lucide-react'
import Link from 'next/link'

interface PaymentResult {
  success: boolean
  status: string
  message: string
  order?: {
    id: string
    totalPrice: number
    paymentStatus: string
    status: string
    paidAt: string
    channel?: string
    currency?: string
  }
}

export default function PaymentCompletePage() {
  const searchParams = useSearchParams()
  
  const reference = searchParams.get('reference') || searchParams.get('trxref')
  
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        setResult({
          success: false,
          status: 'error',
          message: 'No payment reference found',
        })
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`)
        const data = await response.json()
        
        setResult(data)
      } catch (error) {
        console.error('Payment verification error:', error)
        setResult({
          success: false,
          status: 'error',
          message: 'Failed to verify payment. Please check your order status.',
        })
      } finally {
        setIsLoading(false)
      }
    }

    verifyPayment()
  }, [reference])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-500 text-center">Please wait while we confirm your payment...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (result?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 text-center mb-6">
              Your order has been confirmed and is being processed.
            </p>

            {result.order && (
              <div className="w-full bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-500">Order ID</span>
                  <span className="font-mono text-sm">#{result.order.id.substring(0, 8)}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-500">Amount Paid</span>
                  <span className="font-semibold">{result.order.currency || 'GHS'} {result.order.totalPrice.toFixed(2)}</span>
                </div>
                {result.order.channel && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-500">Payment Method</span>
                    <span className="text-sm capitalize">{result.order.channel.replace('_', ' ')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className="inline-flex items-center gap-1 text-sm text-green-600">
                    <Package className="w-4 h-4" />
                    Processing
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col w-full gap-3">
              <Button asChild className="w-full">
                <Link href={`/orders`}>
                  View My Orders
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/shopping">
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (result?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-8">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-12 h-12 text-amber-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Pending</h2>
            <p className="text-gray-500 text-center mb-6">
              Your payment is still being processed. This may take a few moments.
            </p>

            <div className="flex flex-col w-full gap-3">
              <Button onClick={() => window.location.reload()} className="w-full">
                <Loader2 className="w-4 h-4 mr-2" />
                Check Again
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/orders">
                  View Orders
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Payment failed
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
          <p className="text-gray-500 text-center mb-6">
            {result?.message || 'Your payment could not be completed. Please try again.'}
          </p>

          <div className="flex flex-col w-full gap-3">
            <Button asChild className="w-full">
              <Link href={`/cart`}>
                Try Again
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/help">
                Contact Support
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
