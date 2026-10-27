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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
        
        {/* Card 1: Lifetime Earnings */}
        <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Lifetime Earnings
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>

          <div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {formatMoney(lifetimeEarnings)}
            </p>
            <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Gross sales + Escrow + Paid Out
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-600">
            <span>Total Paid Out:</span>
            <span className="text-emerald-700 font-bold">{formatMoney(paidOutTotal)}</span>
          </div>
        </div>

        {/* Card 2: Withdrawable Wallet Balance */}
        <div className="bg-stone-950 text-white p-4 sm:p-4.5 rounded-xl border border-stone-800 shadow-xs flex flex-col justify-between relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Withdrawable Wallet
            </span>
            <div className="p-2 rounded-lg bg-stone-800/80 text-amber-400 border border-stone-700/60">
              <Wallet className="h-4 w-4" />
            </div>
          </div>

          <div>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {formatMoney(balance)}
            </p>
            <p className="text-[10px] font-medium text-emerald-400 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="h-3 w-3" /> Instant MoMo withdrawal available
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full h-8 sm:h-9 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw Cash to MoMo
          </button>
        </div>

        {/* Card 3: Escrow Held Funds */}
        <div className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Escrow Pending Release
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Lock className="h-4 w-4" />
            </div>
          </div>

          <div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {formatMoney(pendingEscrow)}
            </p>
            <p className="text-[10px] font-medium text-slate-500 mt-0.5">
              Released immediately upon order delivery
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-amber-700">
            <span>Status:</span>
            <span>Buyer Escrow Protected</span>
          </div>
        </div>

      </div>

      {/* RECENT PAYOUT TRANSACTIONS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Recent Payout Transactions</h3>
            <p className="text-xs text-slate-500 font-medium">History of Mobile Money and Bank cashouts</p>
          </div>

          <button
            onClick={fetchPayoutData}
            disabled={loadingHistory}
            className="p-2 text-slate-500 hover:text-amber-600 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-1.5 text-xs font-bold"
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
        currencySymbol={currencySymbol}
        defaultMomoNumber={momoNumber}
        defaultMomoProvider={momoProvider}
        onSuccess={handlePayoutSuccess}
      />
    </div>
  );
};
