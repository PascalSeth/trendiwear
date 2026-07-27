'use client'

import { useState } from 'react'
import { SubscriptionTiers } from '@/components/subscription/SubscriptionTiers'
import { CurrentSubscriptionStatus } from '@/components/subscription/CurrentSubscriptionStatus'
import { AlertCircle, HelpCircle, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false)
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSelectTier = async (tierId: string, billingCycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY') => {
    setLoading(true)
    setSelectedTierId(tierId)
    setError(null)

    try {
      // Directly initialize Paystack payment without setting status to INACTIVE beforehand
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
        const errorData = await paymentResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to initialize subscription checkout')
      }

      const paymentData = await paymentResponse.json()

      if (paymentData.data?.authorizationUrl) {
        toast.success('Redirecting to Paystack secure checkout...')
        window.location.href = paymentData.data.authorizationUrl
      } else {
        throw new Error('Payment gateway did not return authorization URL')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred during checkout'
      setError(msg)
      toast.error(msg)
      setLoading(false)
      setSelectedTierId(null)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6 font-sans">
      
      {/* EXECUTIVE HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Seller Membership &amp; Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Subscription &amp; Plans
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Manage your store membership tier, active trial status, feature permissions, and billing cycles.
          </p>
        </div>
      </div>

      {/* Error Banner if any */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Current Subscription & Trial Status */}
      <CurrentSubscriptionStatus />

      {/* Subscription Tiers Grid */}
      <div className="space-y-4 pt-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Select Membership Plan</h2>
          <p className="text-xs font-medium text-slate-500">
            Choose a plan that suits your business scale. Cancel or switch billing cycles anytime.
          </p>
        </div>

        <SubscriptionTiers
          onSelectTier={handleSelectTier}
          loading={loading}
          selectedTierId={selectedTierId}
        />
      </div>

      {/* Billing FAQ Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6 mt-8">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">Frequently Asked Billing Questions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { q: "Can I switch plans anytime?", a: "Yes. You can upgrade or switch billing cycles anytime. Your new plan benefits apply immediately upon payment confirmation." },
            { q: "What happens when my free trial ends?", a: "Your store enters View-Only mode. Activating any membership tier immediately restores product creation and order processing." },
            { q: "What payment methods are supported?", a: "We support Mobile Money (MTN MoMo, Telecel Cash, AT Money), Cards, and Bank Transfers via Paystack." },
            { q: "Is my payment safe?", a: "All transactions are encrypted and processed securely by Paystack. No sensitive card or pin details are stored on our servers." }
          ].map((item, i) => (
            <div key={i} className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <h4 className="text-xs font-bold text-slate-900">{item.q}</h4>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Protection Policy Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> Transparent Billing Policy
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">Protected &amp; Encrypted Membership</h3>
          <p className="text-xs text-slate-400 max-w-xl">
            No hidden setup fees. Instant activation upon Paystack verification, protected escrow, and 24/7 priority seller support.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Cancel Anytime
          </span>
        </div>
      </div>

    </div>
  )
}
