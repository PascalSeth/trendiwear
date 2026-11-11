'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Wallet, Lock, ShieldCheck, ArrowUpRight, CheckCircle2, 
  Clock, RefreshCw, TrendingUp, AlertCircle, Sparkles,
  Smartphone, Building2, Filter, ChevronRight
} from 'lucide-react';
import { PayoutRequestModal } from './PayoutRequestModal';
import { ProviderLogo } from './ProviderLogos';

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

type FilterStatus = 'ALL' | 'PAID' | 'PROCESSING' | 'FAILED';

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
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

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

  const filteredHistory = useMemo(() => {
    if (statusFilter === 'ALL') return history;
    if (statusFilter === 'PAID') return history.filter((tx) => tx.status === 'PAID');
    if (statusFilter === 'PROCESSING') return history.filter((tx) => tx.status === 'PENDING' || tx.status === 'PROCESSING');
    if (statusFilter === 'FAILED') return history.filter((tx) => tx.status === 'FAILED' || tx.status === 'REJECTED');
    return history;
  }, [history, statusFilter]);

  const getProviderIcon = (provider: string) => {
    return <ProviderLogo provider={provider} className="w-3.5 h-3.5" />;
  };

  const getProviderBadge = (provider: string) => {
    const p = (provider || '').toUpperCase();
    if (p.includes('MTN')) return 'bg-amber-100 text-amber-900 border-amber-200';
    if (p.includes('TELECEL') || p.includes('VODAFONE')) return 'bg-red-100 text-red-900 border-red-200';
    if (p.includes('AT') || p.includes('AIRTEL')) return 'bg-blue-100 text-blue-900 border-blue-200';
    if (p.includes('BANK')) return 'bg-indigo-100 text-indigo-900 border-indigo-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* 3 WALLET STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-4.5">
        
        {/* Card 1: Lifetime Earnings */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Lifetime Earnings
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatMoney(lifetimeEarnings)}
            </p>
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Gross sales + Escrow + Paid Out</span>
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Total Paid Out:</span>
            <span className="text-emerald-700 font-extrabold">{formatMoney(paidOutTotal)}</span>
          </div>
        </div>

        {/* Card 2: HERO Withdrawable Wallet Balance */}
        <div className="bg-gradient-to-br from-stone-950 via-slate-950 to-stone-900 text-white p-4 sm:p-5 rounded-2xl border border-amber-500/30 shadow-lg flex flex-col justify-between relative overflow-hidden space-y-4">
          {/* Ambient Glow */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Withdrawable Wallet
            </span>
            <div className="p-2 rounded-xl bg-stone-800/90 text-amber-400 border border-amber-500/30 shadow-xs">
              <Wallet className="h-4 w-4" />
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              {formatMoney(balance)}
            </p>
            <p className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5 mt-1">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span>Instant MoMo withdrawal available</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full h-10 sm:h-11 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer relative z-10"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[3]" />
            <span>Withdraw Cash to MoMo</span>
          </button>
        </div>

        {/* Card 3: Escrow Held Funds */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 sm:col-span-2 lg:col-span-1 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Escrow Pending Release
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80">
              <Lock className="h-4 w-4" />
            </div>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatMoney(pendingEscrow)}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Released immediately upon buyer order delivery
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-800">
            <span>Escrow Status:</span>
            <span className="inline-flex items-center gap-1 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Buyer Protected
            </span>
          </div>
        </div>

      </div>

      {/* RECENT PAYOUT TRANSACTIONS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
        
        {/* Section Header with Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              Recent Payout Transactions
              {history.length > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {history.length}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              History of Mobile Money and Bank cashouts
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Filter Tabs */}
            <div className="inline-flex p-0.5 rounded-xl bg-slate-100 text-[11px] font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PAID')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === 'PAID' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PROCESSING')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === 'PROCESSING' ? 'bg-white text-amber-800 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Queued
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchPayoutData}
              disabled={loadingHistory}
              className="p-1.5 sm:px-3 sm:py-1.5 text-slate-600 hover:text-amber-700 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-1.5 text-xs font-bold border border-slate-200/80"
              title="Refresh payout transactions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin text-amber-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Transaction Content */}
        {history.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No payout transactions yet</p>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto mt-0.5">
                Whenever you cash out funds from your wallet, you will see a real-time record and delivery status here.
              </p>
            </div>
            {balance > 0 && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Make First Cashout
              </button>
            )}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-slate-100">
            No transactions matching filter &quot;{statusFilter}&quot;.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredHistory.map((tx) => {
              const isPaid = tx.status === 'PAID';
              const isFailed = tx.status === 'FAILED' || tx.status === 'REJECTED';
              const isProcessing = tx.status === 'PROCESSING' || tx.status === 'PENDING';

              return (
                <div 
                  key={tx.id} 
                  className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 hover:bg-slate-50/60 rounded-xl px-2 sm:px-3 -mx-2 sm:-mx-3 transition-colors"
                >
                  {/* Left Column: Authentic Provider Logo + Status Indicator & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <ProviderLogo provider={tx.provider} className="w-10 h-10" />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white border-2 border-white shadow-2xs ${
                        isPaid ? 'bg-emerald-500' : isFailed ? 'bg-red-500' : 'bg-amber-500'
                      }`}>
                        {isPaid ? (
                          <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" />
                        ) : isFailed ? (
                          <AlertCircle className="w-2.5 h-2.5 stroke-[3]" />
                        ) : (
                          <Clock className="w-2.5 h-2.5 stroke-[3]" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${getProviderBadge(tx.provider)}`}>
                          {tx.provider}
                        </span>
                        <span className="text-xs font-bold text-slate-700 truncate">
                          {tx.accountNumber}
                        </span>
                      </div>

                      <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Amount + Status Badge */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pl-11 sm:pl-0">
                    <div className="text-left sm:text-right">
                      <p className="font-black text-sm sm:text-base text-slate-900 tracking-tight">
                        {formatMoney(tx.amount)}
                      </p>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      isPaid
                        ? 'bg-emerald-100 text-emerald-800'
                        : isFailed
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed</span>
                        </>
                      ) : isFailed ? (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>Queued for Admin</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>In Progress</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
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
