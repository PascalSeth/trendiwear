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

  const [redirectCount, setRedirectCount] = useState(3)

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

        // Start redirect countdown on success
        if (data.success) {
          const timer = setInterval(() => {
            setRedirectCount((prev) => {
              if (prev <= 1) {
                clearInterval(timer)
                window.location.href = '/orders'
              }
              return prev - 1
            })
          }, 1000)
        }
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
            <Loader2 className="w-12 h-12 animate-spin text-stone-900 mb-4" />
            <h2 className="text-xl font-serif text-stone-900 mb-2">Verifying Payment</h2>
            <p className="text-stone-500 text-center font-serif italic text-sm">Please wait while we confirm your payment with the seller...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (result?.success) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-stone-100 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardContent className="flex flex-col items-center py-12 px-8">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8 ring-1 ring-emerald-100">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            
            <h2 className="text-3xl font-serif italic text-stone-950 mb-3 text-center">Payment Successful!</h2>
            <p className="text-stone-500 text-center font-serif italic text-sm mb-8 leading-relaxed">
              Your order has been confirmed. The seller is now preparing your items.
            </p>

            {result.order && (
              <div className="w-full bg-stone-50/50 border border-stone-100 rounded-3xl p-6 mb-8 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400 font-mono uppercase tracking-widest">Order ID</span>
                  <span className="font-mono text-stone-900">#{result.order.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-mono uppercase tracking-widest text-[10px]">Amount Paid</span>
                  <span className="font-serif font-medium text-stone-900">{result.order.currency || 'GHS'} {result.order.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                  <span className="text-stone-400 font-mono uppercase tracking-widest text-[10px]">Status</span>
                  <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-emerald-600 font-bold">
                    <Package className="w-3 h-3" />
                    Processing
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4 w-full">
              <div className="text-center py-2">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 animate-pulse">
                  Redirecting to your orders in {redirectCount}s...
                </p>
              </div>

              <Button asChild className="w-full bg-stone-950 hover:bg-black text-white rounded-full h-14 font-mono text-[10px] uppercase tracking-[0.2em] transition-all">
                <Link href={`/orders`}>
                  View My Orders
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full border-stone-200 rounded-full h-14 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-stone-950 transition-all">
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
