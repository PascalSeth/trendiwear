'use client'

import React, { useState, useEffect } from 'react'
import {
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Banknote,
  RotateCcw
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PayoutRequestRecord {
  id: string
  amount: number
  accountNumber: string
  accountName: string
  provider: string
  status: string
  failureReason: string | null
  createdAt: string
  professional: {
    businessName: string
    user?: {
      email: string
      name?: string
    }
  }
}

export default function PayoutRecovery() {
  const [records, setRecords] = useState<PayoutRequestRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchFailedPayouts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/payouts/retry')
      const data = await res.json()
      if (res.ok) {
        setRecords(data.payouts || [])
      }
    } catch (err: unknown) {
      console.error('Failed fetching stuck payouts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFailedPayouts()
  }, [])

  const handleAdminAction = async (payoutId: string, action: 'MARK_PAID' | 'REFUND_WALLET') => {
    setActionLoadingId(payoutId)
    try {
      const response = await fetch('/api/admin/payouts/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, action })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || 'Action completed successfully!')
        setRecords(prev => prev.filter(r => r.id !== payoutId))
      } else {
        toast.error(result.error || 'Action failed')
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      toast.error(errObj.message || 'Error processing request')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Admin Payout Recovery Engine</h2>
            <p className="text-xs font-medium text-slate-500">
              Monitor and resolve merchant payouts that failed due to gateway delays or network glitches.
            </p>
          </div>
        </div>

        <button
          onClick={fetchFailedPayouts}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Refresh Queue
        </button>
      </div>

      {/* PAYOUT QUEUE TABLE */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500">Scanning for stuck payouts...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-black text-slate-900">All Payouts Operational</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no stuck or failed payout requests requiring admin intervention at this time. All automated Mobile Money transfers are running smoothly.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Pending Admin Recovery ({records.length})
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {records.map((item) => {
              const isLoading = actionLoadingId === item.id;
              return (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {item.professional.businessName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                        {item.provider} ({item.accountNumber})
                      </span>
                    </div>

                    <p className="text-xs font-black text-indigo-600">
                      Amount: GH₵ {item.amount.toFixed(2)}
                    </p>

                    {item.failureReason && (
                      <p className="text-[11px] text-rose-600 font-medium bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                        Reason: {item.failureReason}
                      </p>
                    )}

                    <p className="text-[10px] text-slate-400 font-medium">
                      Requested: {format(new Date(item.createdAt), 'PPP p')}
                    </p>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdminAction(item.id, 'MARK_PAID')}
                      disabled={isLoading}
                      className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid Manually
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleAdminAction(item.id, 'REFUND_WALLET')}
                      disabled={isLoading}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Refund to Wallet
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  )
}
