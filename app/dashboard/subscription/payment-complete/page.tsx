'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Loader2, ArrowRight, LayoutDashboard, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function PaymentCompletePage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('Acquiring secure verification from our billing hub...')

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference')

      if (!reference) {
        setStatus('failed')
        setMessage('A valid payment reference was not provided. Please check your transaction history.')
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
            setMessage('Your membership has been verified and activated. Welcome to the elite tier of Trendi.')
          } else {
            setStatus('failed')
            setMessage(data.error || 'The verification process encountered an issue. No funds have been lost.')
          }
        } else {
          setStatus('failed')
          setMessage('Our verification servers are currently untraceable. Please retry in a moment.')
        }
      } catch (error) {
        console.error('Error verifying payment:', error)
        setStatus('failed')
        setMessage('A network anomaly occurred during verification. Your payment is secure.')
      }
    }

    // Small delay for drama and smooth entrance
    const timer = setTimeout(() => {
        verifyPayment()
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [searchParams])

  return (
    <div className="min-h-screen bg-[#FDFCFE] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.05),transparent_50%)] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg relative"
      >
        <Card className="rounded-[3rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
          <CardContent className="p-10 md:p-12">
            <div className="flex flex-col items-center text-center space-y-8">
              
              {/* Icon Animation Hub */}
              <div className="relative">
                <AnimatePresence mode="wait">
                  {status === 'loading' && (
                    <motion.div 
                        key="loading"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        className="w-24 h-24 bg-violet-50 rounded-[2.5rem] flex items-center justify-center"
                    >
                      <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
                    </motion.div>
                  )}
                  {status === 'success' && (
                    <motion.div 
                        key="success"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center"
                    >
                      <CheckCircle className="w-10 h-10 text-emerald-600" />
                    </motion.div>
                  )}
                  {status === 'failed' && (
                    <motion.div 
                        key="failed"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center"
                    >
                      <AlertCircle className="w-10 h-10 text-rose-600" />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Glow ring */}
                <div className={`absolute -inset-4 blur-2xl rounded-full opacity-20 -z-10 animate-pulse ${
                    status === 'success' ? 'bg-emerald-400' : status === 'failed' ? 'bg-rose-400' : 'bg-violet-400'
                }`} />
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                    {status === 'loading' && 'Authenticating Cycle'}
                    {status === 'success' && 'Transaction Finalized'}
                    {status === 'failed' && 'Cycle Interrupted'}
                </h1>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="w-full h-px bg-slate-100" />

              {status === 'success' && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full grid grid-cols-2 gap-4"
                >
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                    <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Features</p>
                    <p className="text-sm font-black text-slate-900">Unlocked</p>
                  </div>
                </motion.div>
              )}

              <div className="w-full flex flex-col gap-3">
                <Link href="/dashboard" className="w-full group">
                  <Button className="w-full py-7 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                    <LayoutDashboard className="w-5 h-5 mr-2" /> Go to Dashboard
                  </Button>
                </Link>

                <Link href="/dashboard/subscription" className="w-full">
                  <Button variant="ghost" className="w-full py-7 rounded-2xl text-slate-500 font-bold hover:text-slate-900 hover:bg-slate-50 transition-all">
                    Membership Overview <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                   Power To The Professional
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

