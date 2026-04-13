'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { SubscriptionTiers } from '@/components/subscription/SubscriptionTiers'
import { CurrentSubscriptionStatus } from '@/components/subscription/CurrentSubscriptionStatus'
import { AlertCircle, MessageSquare, ShieldCheck, Verified } from 'lucide-react'

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectTier = async (tierId: string, billingCycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY') => {
    setLoading(true)
    setError(null)

    try {
      const subscriptionResponse = await fetch('/api/subscriptions/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId, billingCycle }),
      })

      if (!subscriptionResponse.ok) throw new Error('Failed to create subscription')
      await subscriptionResponse.json()

      const paymentResponse = await fetch('/api/subscriptions/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId,
          billingCycle,
          callbackUrl: `${window.location.origin}/dashboard/subscription/payment-complete`,
        }),
      })

      if (!paymentResponse.ok) throw new Error('Failed to initialize payment')
      const paymentData = await paymentResponse.json()

      if (paymentData.data?.authorizationUrl) {
        window.location.href = paymentData.data.authorizationUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="py-12 md:py-20 animate-in fade-in duration-700">
      <main className="max-w-7xl mx-auto px-6">
        {/* 2. Current Status Section */}
        <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-20"
        >
          <div className="mb-10 max-w-2xl">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 mb-2">My Identity</h2>
            <h3 className="text-3xl font-black tracking-tighter text-slate-900">Professional Status</h3>
          </div>
          <CurrentSubscriptionStatus />
        </motion.section>

        {/* 3. Error Alert (If any) */}
        {error && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-12 p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4 text-rose-700"
            >
                <div className="w-10 h-10 bg-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                   <h4 className="font-black text-rose-900 leading-none mb-1 uppercase text-sm">Action Forbidden</h4>
                   <p className="text-sm text-rose-600 font-medium">{error}</p>
                </div>
            </motion.div>
        )}

        {/* 4. Plan Selection Section */}
        <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-24"
        >
          <div className="mb-12 text-center max-w-3xl mx-auto">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 mb-2">The Marketplace Explorer</h2>
            <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-6 uppercase italic">Elevate your brand steeze</h3>
            <p className="text-slate-500 text-lg font-medium leading-relaxed">
              Unlock the full potential of your business with plans designed to scale. Choose the phase that fits your current hustle.
            </p>
          </div>
          
          <SubscriptionTiers
            onSelectTier={handleSelectTier}
            loading={loading}
          />
        </motion.section>

        {/* 5. Minimalist FAQ */}
        <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="border-t border-slate-100 pt-24"
        >
           <div className="grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">Common Queries</h3>
                    <p className="text-slate-500 font-medium">Everything you need to know about our billing process and terms.</p>
                    <div className="pt-6">
                        <button className="flex items-center gap-3 text-violet-600 font-black uppercase tracking-widest text-xs hover:gap-5 transition-all">
                            Talk to our team <MessageSquare className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-8 grid md:grid-cols-2 gap-x-12 gap-y-10">
                    {[
                        { q: "Can I move between plans?", a: "Switch phases at any moment. Upgrades apply instantly, while mid-cycle downgrades take effect at your next renewal." },
                        { q: "Trial to Paid transition?", a: "Once your 3-month trial ends, your shop enters 'View Only' mode. Activating a plan instantly restores full creation power." },
                        { q: "Accepted payment tools?", a: "We support Mobile Money (MTN, Telecel, AirtelTigo), Cards, and Bank Transfers via our secure Paystack hub." },
                        { q: "What about the 'Legend' perks?", a: "Legends get priority indexing, analytics insights, and featured placement in our brand spotlight sections." }
                    ].map((item, i) => (
                        <div key={i} className="group cursor-help">
                            <h4 className="text-sm font-black text-slate-900 mb-2 group-hover:text-violet-600 transition-colors uppercase italic">{item.q}</h4>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.a}</p>
                        </div>
                    ))}
                </div>
           </div>
        </motion.section>

        {/* 6. Professional Protection Banner */}
        <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-24 p-8 md:p-12 rounded-[3rem] bg-slate-950 text-white overflow-hidden relative"
        >
            <div className="absolute top-0 right-0 p-12 opacity-10">
                <ShieldCheck className="w-48 h-48" />
            </div>
            <div className="relative z-10 max-w-2xl space-y-6">
                <h3 className="text-3xl font-black tracking-tighter uppercase italic">Professional Shield</h3>
                <p className="text-slate-400 text-lg">
                    Every subscription is protected by our transparent billing policy. No hidden fees, secure escrow for all orders, and 24/7 dedicated support for our Legends and Ohenes.
                </p>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10">
                        <Verified className="w-3 h-3 text-amber-500" /> Secure Payments
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10">
                        <ShieldCheck className="w-3 h-3 text-violet-500" /> Cancel Anytime
                    </div>
                </div>
            </div>
        </motion.section>
      </main>
    </div>
  )
}

