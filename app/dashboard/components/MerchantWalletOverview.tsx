'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, Lock, ShieldCheck, ArrowUpRight, CheckCircle2, 
  Clock, RefreshCw, TrendingUp
} from 'lucide-react';
import { PayoutRequestModal } from './PayoutRequestModal';

interface PayoutRecord {
  id: string;
  amount: number;
  provider: string;
  accountNumber: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REJECTED';
  createdAt: string;
}

interface MerchantWalletOverviewProps {
  initialWithdrawableBalance: number;
  escrowHeldBalance: number;
  currencySymbol?: string;
  momoNumber?: string;
  momoProvider?: string;
}

export const MerchantWalletOverview: React.FC<MerchantWalletOverviewProps> = ({
  initialWithdrawableBalance,
  escrowHeldBalance,
  currencySymbol = 'GH₵',
  momoNumber = '',
  momoProvider = 'MTN',
}) => {
  const [balance, setBalance] = useState<number>(initialWithdrawableBalance);
  const [lifetimeEarnings, setLifetimeEarnings] = useState<number>(initialWithdrawableBalance + escrowHeldBalance);
  const [paidOutTotal, setPaidOutTotal] = useState<number>(0);
  const [pendingEscrow, setPendingEscrow] = useState<number>(escrowHeldBalance);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<PayoutRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const fetchPayoutData = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/payouts/request', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.accountBalance ?? initialWithdrawableBalance);
        setHistory(data.payoutHistory || []);
        if (data.totalLifetimeEarnings !== undefined) setLifetimeEarnings(data.totalLifetimeEarnings);
        if (data.totalPaidOut !== undefined) setPaidOutTotal(data.totalPaidOut);
        if (data.totalEscrowHeld !== undefined) setPendingEscrow(data.totalEscrowHeld);
      }
    } catch (err) {
      console.error('Failed fetching payout data:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [initialWithdrawableBalance]);

  const handlePayoutSuccess = (newBal?: number) => {
    if (typeof newBal === 'number') {
      setBalance(newBal);
    }
    fetchPayoutData();
  };

  useEffect(() => {
    fetchPayoutData();
  }, [fetchPayoutData]);

  const formatMoney = (val: number) =>
    `${currencySymbol} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      
      {/* 3 WALLET STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Lifetime Earnings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Total Lifetime Earnings
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {formatMoney(lifetimeEarnings)}
            </p>
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Gross sales + Escrow + Paid Out
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>Total Paid Out:</span>
            <span className="text-emerald-700 font-extrabold">{formatMoney(paidOutTotal)}</span>
          </div>
        </div>

        {/* Card 2: Withdrawable Wallet Balance */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-800 shadow-md flex flex-col justify-between relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
              Withdrawable Wallet
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Wallet className="h-5 w-5" />
            </div>
          </div>

          <div>
            <p className="text-3xl font-black tracking-tight text-white">
              {formatMoney(balance)}
            </p>
            <p className="text-[11px] font-medium text-emerald-400 flex items-center gap-1 mt-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Instant MoMo withdrawal available
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" /> Withdraw Cash to Mobile Money
          </button>
        </div>

        {/* Card 3: Escrow Held Funds */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Escrow Pending Release
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Lock className="h-5 w-5" />
            </div>
          </div>

          <div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {formatMoney(pendingEscrow)}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Released immediately upon order delivery
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-amber-700">
            <span>Status:</span>
            <span>Buyer Escrow Protected</span>
          </div>
        </div>

      </div>

      {/* RECENT PAYOUT TRANSACTIONS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Recent Payout Transactions</h3>
            <p className="text-xs text-slate-500 font-medium">History of Mobile Money and Bank cashouts</p>
          </div>

          <button
            onClick={fetchPayoutData}
            disabled={loadingHistory}
            className="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No payout transactions yet. Click &quot;Withdraw Cash to Mobile Money&quot; to make your first cashout!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${
                    tx.status === 'PAID' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : tx.status === 'FAILED' 
                      ? 'bg-red-50 text-red-600 border-red-200' 
                      : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {tx.status === 'PAID' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>

                  <div>
                    <p className="font-extrabold text-slate-900">
                      {formatMoney(tx.amount)} → {tx.provider} ({tx.accountNumber})
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  tx.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : tx.status === 'FAILED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {tx.status === 'PAID' ? 'Completed' : tx.status === 'FAILED' ? 'Queued for Admin' : tx.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout Request Modal */}
      <PayoutRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableBalance={balance}
        defaultMomoNumber={momoNumber}
        defaultMomoProvider={momoProvider}
        onSuccess={handlePayoutSuccess}
      />
    </div>
  );
};
