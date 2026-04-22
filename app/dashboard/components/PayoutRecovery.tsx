'use client'

import React, { useState, useEffect } from 'react'
import {
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Banknote,
  History
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface EscrowRecord {
  id: string
  amount: number
  status: string
  failureReason: string | null
  lastAttemptAt: string | null
  createdAt: string
  orderId: string | null
  bookingId: string | null
  professional: {
    professionalProfile: {
      businessName: string
    }
  }
}

export default function PayoutRecovery() {
  const [records, setRecords] = useState<EscrowRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [retryingIds, setRetryingIds] = useState<string[]>([])
  const [availableBalance, setAvailableBalance] = useState<number | null>(null)
  const [, setError] = useState<string | null>(null)

  const fetchFailedPayouts = async () => {
    try {
      setLoading(true)
      const [payoutsRes, balanceRes] = await Promise.all([
        fetch('/api/admin/payouts?status=HELD'),
        fetch('/api/admin/payouts/balance')
      ])

      const pData = await payoutsRes.json()
      // Sort by failure reason then date
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const sorted = (pData.escrows || []).sort((a: any, b: any) => {
        if (a.failureReason && !b.failureReason) return -1
        if (!a.failureReason && b.failureReason) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      setRecords(sorted)

      if (balanceRes.ok) {
        const bData = await balanceRes.json()
        const ghsBalance = bData.data?.find((b: any) => b.currency === 'GHS')?.balance || 0
        setAvailableBalance(ghsBalance / 100) // Convert from pesewas
      }
    } catch (err: any) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFailedPayouts()
  }, [])

  const handleRetry = async (escrowId: string, manual: boolean = false) => {
    if (retryingIds.includes(escrowId)) return
    
    setRetryingIds(prev => [...prev, escrowId])
    try {
      const response = await fetch('/api/admin/payouts/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escrowId, manual })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Remove from list or update
        setRecords(prev => prev.filter(r => r.id !== escrowId))
      } else {
        alert(result.error || 'Retry failed')
        // Refresh to show latest failure reason
        await fetchFailedPayouts()
      }
    } catch {
      alert('Network error during retry')
    } finally {
      setRetryingIds(prev => prev.filter(id => id !== escrowId))
    }
  }

  if (loading && records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        <p className="text-slate-500 font-medium">Scanning for stuck payouts...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Info */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Banknote size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-violet-500/20 rounded-xl backdrop-blur-md">
                  <ShieldCheck className="w-6 h-6 text-violet-400" />
               </div>
               <h2 className="text-2xl font-black tracking-tight">Payout Recovery Center</h2>
            </div>
            <p className="text-slate-300 max-w-xl font-medium">
              Monitor and resolve payouts that failed due to insufficient Paystack balance or gateway errors.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-6 min-w-[240px] space-y-2">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-300">Available Balance</span>
                <a 
                  href="https://dashboard.paystack.com/#/transfers" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] font-black uppercase text-violet-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  Top Up <ExternalLink className="w-2.5 h-2.5" />
                </a>
             </div>
             <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tabular-nums">
                  {availableBalance !== null ? `GHS ${availableBalance.toFixed(2)}` : '---'}
                </span>
             </div>
             <p className="text-[10px] text-slate-400 font-medium">
               Settled funds available for transfers.
             </p>
          </div>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-16 border border-slate-100 flex flex-col items-center justify-center text-center space-y-4 shadow-xl shadow-slate-200/40">
           <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
           </div>
           <div>
              <h3 className="text-xl font-black text-slate-900">All Clear!</h3>
              <p className="text-slate-500">There are no stuck payouts requiring attention at this time.</p>
           </div>
           <button 
            onClick={fetchFailedPayouts}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
           >
             Refresh
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {records.map((record) => (
            <div 
              key={record.id}
              className={cn(
                "group bg-white border rounded-[2rem] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/60",
                record.failureReason ? "border-amber-100 hover:border-amber-200" : "border-slate-100"
              )}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Professional Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                    <History className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <h3 className="font-black text-slate-900 text-lg">
                        {record.professional.professionalProfile.businessName}
                       </h3>
                       <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                         {record.orderId ? 'Order Payout' : 'Booking Payout'}
                       </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                       ID: <span className="text-slate-700 select-all">#{record.id.slice(-8).toUpperCase()}</span>
                       <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                       Created: {format(new Date(record.createdAt), 'MMM dd, p')}
                    </p>
                  </div>
                </div>

                {/* Amount & Failure Info */}
                <div className="flex-1 lg:max-w-xs space-y-2">
                   <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-slate-400">Total:</span>
                      <span className="text-2xl font-black text-slate-900">GHS {record.amount.toFixed(2)}</span>
                   </div>
                   {record.failureReason && (
                     <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-black uppercase tracking-tight">{record.failureReason}</span>
                     </div>
                   )}
                   {record.lastAttemptAt && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase italic">
                        Last Retry: {format(new Date(record.lastAttemptAt), 'MMM dd, HH:mm')}
                      </p>
                   )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                   <button
                    onClick={() => handleRetry(record.id)}
                    disabled={retryingIds.includes(record.id)}
                    className="flex-1 lg:flex-none h-12 px-6 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-violet-600 transition-all hover:shadow-xl hover:shadow-violet-200/50 disabled:opacity-50"
                   >
                     {retryingIds.includes(record.id) ? (
                       <Loader2 className="w-4 h-4 animate-spin" />
                     ) : (
                       <RefreshCw className="w-4 h-4" />
                     )}
                     Retry Payout
                   </button>

                   <button 
                    onClick={() => {
                        if(confirm('This will mark the payout as completed manually. Are you sure?')) {
                            handleRetry(record.id, true)
                        }
                    }}
                    className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-emerald-50 hover:text-emerald-500 border border-slate-100 transition-all group/btn shadow-sm"
                    title="Mark as Manually Paid"
                   >
                      <CheckCircle2 className="w-5 h-5" />
                   </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
