'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, LayoutDashboard, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function PaymentCompletePage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('Verifying transaction with Paystack billing server...')

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference')

      if (!reference) {
        setStatus('failed')
        setMessage('No payment reference was provided in the callback URL.')
        return
      }

      try {
        const response = await fetch(`/api/subscriptions/verify?reference=${reference}`, {
          method: 'GET',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setStatus('success')
            setMessage('Your membership payment has been verified and activated! Welcome to your updated plan.')
          } else {
            setStatus('failed')
            setMessage(data.error || 'Payment verification encountered an issue. Please contact support.')
          }
        } else {
          const errData = await response.json().catch(() => ({}))
          setStatus('failed')
          setMessage(errData.error || 'Unable to verify payment with the gateway server.')
        }
      } catch (error) {
        console.error('Error verifying payment:', error)
        setStatus('failed')
        setMessage('Network error during verification. Your payment status is safe.')
      }
    }

    const timer = setTimeout(() => {
      verifyPayment()
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [searchParams])

  return (
    <div className="w-full max-w-xl mx-auto py-12 px-4 font-sans">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 shadow-xs space-y-6 text-center">
        
        {/* Status Animated Icon */}
        <div className="flex justify-center">
          <AnimatePresence mode="wait">
            {status === 'loading' && (
              <motion.div 
                key="loading"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"
              >
                <Loader2 className="w-8 h-8 animate-spin" />
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div 
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-200"
              >
                <CheckCircle2 className="w-8 h-8" />
              </motion.div>
            )}

            {status === 'failed' && (
              <motion.div 
                key="failed"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-200"
              >
                <AlertCircle className="w-8 h-8" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {status === 'loading' && 'Verifying Payment...'}
            {status === 'success' && 'Membership Activated!'}
            {status === 'failed' && 'Verification Unsuccessful'}
          </h1>
          <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-md mx-auto">
            {message}
          </p>
        </div>

        {status === 'success' && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-left space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Payment Status</p>
            <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Paystack Transaction Verified &amp; Active
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/dashboard" className="flex-1">
            <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2">
              <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
            </button>
          </Link>
          <Link href="/dashboard/subscription" className="flex-1">
            <button className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200/80 transition-all flex items-center justify-center gap-1.5">
              Subscription Overview <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>

      </div>
    </div>
  )
}
