'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Wallet, ArrowUpRight, Loader2, 
  AlertCircle, Award, CheckCircle2, ShieldCheck,
  Smartphone, Building2, HelpCircle, ArrowRight,
  Sparkles, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface PayoutLimits {
  tierName: string;
  minThreshold: number;
  isFreePayout: boolean;
  payoutFee: number;
  recentCountThisWeek: number;
}

interface PayoutRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  currencySymbol?: string;
  defaultMomoNumber?: string;
  defaultMomoProvider?: string;
  onSuccess: (newBalance?: number) => void;
}

export const PayoutRequestModal: React.FC<PayoutRequestModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  currencySymbol = 'GH₵',
  defaultMomoNumber = '',
  defaultMomoProvider = 'MTN',
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>(defaultMomoNumber);
  const [accountName, setAccountName] = useState<string>('');
  const [provider, setProvider] = useState<string>(defaultMomoProvider || 'MTN');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingLimits, setLoadingLimits] = useState<boolean>(false);
  const [limits, setLimits] = useState<PayoutLimits | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoadingLimits(true);
      fetch('/api/payouts/request', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.limits) setLimits(data.limits);
          if (data.momoNumber) setAccountNumber((prev) => prev || data.momoNumber);
          if (data.momoProvider) setProvider(data.momoProvider);
        })
        .catch((err) => console.error('Error fetching payout limits:', err))
        .finally(() => setLoadingLimits(false));
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const minThreshold = limits?.minThreshold ?? 50.0;
  const isFreePayout = limits?.isFreePayout ?? true;
  const payoutFee = limits?.payoutFee ?? 0.0;

  const numericAmount = parseFloat(amount) || 0;
  const totalRequired = numericAmount + (numericAmount > 0 ? payoutFee : 0);
  const remainingBalance = Math.max(0, availableBalance - totalRequired);
  const isBelowMin = numericAmount > 0 && numericAmount < minThreshold;
  const isOverBalance = totalRequired > availableBalance;

  const handlePresetAmount = (preset: number) => {
    const val = Math.min(preset, availableBalance);
    setAmount(val > 0 ? val.toFixed(2) : '');
  };

  const handlePercentageAmount = (pct: number) => {
    const val = (availableBalance * pct) / 100;
    setAmount(val > 0 ? val.toFixed(2) : '');
  };

  const handleMaxAmount = () => {
    // If payout fee applies, maximum withdrawable is availableBalance - payoutFee
    const maxWithdrawable = Math.max(0, availableBalance - (isFreePayout ? 0 : payoutFee));
    setAmount(maxWithdrawable.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isNaN(numericAmount) || numericAmount < minThreshold) {
      toast.error(
        `Minimum cashout threshold for your ${limits?.tierName || 'plan'} is ${currencySymbol} ${minThreshold.toFixed(2)}`
      );
      return;
    }

    if (totalRequired > availableBalance) {
      toast.error(
        `Insufficient balance. Total required is ${currencySymbol} ${totalRequired.toFixed(2)} (Withdrawal: ${currencySymbol} ${numericAmount.toFixed(2)} + Fee: ${currencySymbol} ${payoutFee.toFixed(2)})`
      );
      return;
    }

    if (!accountNumber.trim()) {
      toast.error('Please enter a valid Mobile Money or Bank account number');
      return;
    }

    if (!accountName.trim()) {
      toast.error('Please enter the registered account holder name');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
          provider,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit payout request');
      }

      if (data.instantPayout) {
        toast.success(
          `🎉 Instant Payout Complete! ${currencySymbol} ${numericAmount.toFixed(2)} sent to ${provider} (${accountNumber})`
        );
      } else {
        toast.success(
          `Payout request of ${currencySymbol} ${numericAmount.toFixed(2)} queued for processing.`
        );
      }

      onSuccess(data.newAccountBalance);
      onClose();
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      toast.error(errObj.message || 'Error processing withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const providers = [
    {
      id: 'MTN',
      name: 'MTN MoMo',
      code: 'MTN',
      accent: 'border-amber-400 bg-amber-50 text-amber-950',
      badge: 'bg-amber-400 text-stone-950',
      hint: '024 / 054 / 055 / 059 / 025',
    },
    {
      id: 'TELECEL',
      name: 'Telecel Cash',
      code: 'VOD',
      accent: 'border-red-400 bg-red-50 text-red-950',
      badge: 'bg-red-500 text-white',
      hint: '020 / 050',
    },
    {
      id: 'AT',
      name: 'AT / AirtelTigo',
      code: 'ATL',
      accent: 'border-blue-400 bg-blue-50 text-blue-950',
      badge: 'bg-blue-600 text-white',
      hint: '027 / 057 / 026 / 056',
    },
    {
      id: 'BANK',
      name: 'Bank Transfer',
      code: 'BANK',
      accent: 'border-indigo-400 bg-indigo-50 text-indigo-950',
      badge: 'bg-indigo-600 text-white',
      hint: 'Ghana Bank Account',
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/90 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-amber-400 to-amber-500 text-stone-950 rounded-xl shadow-xs">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                Withdraw Earnings
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Instant
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Mobile Money or Bank account payout
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-4 sm:space-y-5">
          
          {/* Executive Obsidian Balance & Tier Card */}
          <div className="rounded-2xl bg-gradient-to-br from-stone-950 via-slate-900 to-stone-900 text-white p-4 sm:p-5 border border-amber-500/20 shadow-lg relative overflow-hidden space-y-3">
            {/* Ambient Background Glow */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between text-xs relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Available Wallet Balance
              </span>

              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-stone-800/90 px-2.5 py-0.5 rounded-full text-amber-300 border border-stone-700">
                <Award className="w-3 h-3 text-amber-400" />
                {limits?.tierName || 'Seller Tier'}
              </span>
            </div>

            <div className="flex items-baseline gap-1 relative z-10">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                {currencySymbol} {availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Limits & Fee Badges */}
            <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400 font-medium relative z-10">
              <div className="flex items-center gap-1.5">
                <span>Min Cashout:</span>
                <strong className="text-white font-bold">
                  {currencySymbol} {minThreshold.toFixed(2)}
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span>Transfer Fee:</span>
                <span className={`font-bold px-2 py-0.5 rounded-md ${
                  isFreePayout 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-stone-800 text-stone-200'
                }`}>
                  {isFreePayout ? 'FREE (GH₵ 0.00)' : `${currencySymbol} ${payoutFee.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            
            {/* Amount Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  Withdrawal Amount
                  <span className="text-red-500">*</span>
                </label>

                {availableBalance > 0 && (
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="text-[11px] font-black text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2.5 py-0.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Withdraw MAX
                  </button>
                )}
              </div>

              {/* Amount Input with Currency prefix */}
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm sm:text-base pointer-events-none select-none">
                  {currencySymbol}
                </span>

                <input
                  type="number"
                  step="0.01"
                  min={minThreshold}
                  max={availableBalance}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 sm:py-3.5 bg-slate-50 border rounded-2xl font-black text-base sm:text-lg text-slate-900 transition-all placeholder:text-slate-300 focus:bg-white focus:outline-hidden ${
                    isOverBalance 
                      ? 'border-red-400 ring-2 ring-red-400/20' 
                      : isBelowMin 
                      ? 'border-amber-400 ring-2 ring-amber-400/20' 
                      : 'border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  }`}
                  required
                />
              </div>

              {/* Quick Percentage & Addition Chips */}
              <div className="space-y-1.5 pt-1">
                {/* Percentage Chips */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handlePercentageAmount(pct)}
                      disabled={availableBalance <= 0}
                      className="py-1.5 px-2 text-[11px] font-bold rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 text-slate-700 transition-all text-center cursor-pointer"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                {/* Addition Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {[50, 100, 200, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetAmount(preset)}
                      disabled={preset > availableBalance}
                      className="shrink-0 py-1 px-2.5 text-[10px] font-bold rounded-lg bg-amber-50 hover:bg-amber-100 disabled:opacity-40 text-amber-900 border border-amber-200/60 transition-all cursor-pointer"
                    >
                      +{currencySymbol} {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Provider Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Destination Account Type
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {providers.map((prov) => {
                  const isSelected = provider === prov.id;
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => setProvider(prov.id)}
                      className={`relative p-2.5 sm:p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-[68px] sm:h-[72px] cursor-pointer ${
                        isSelected
                          ? `${prov.accent} ring-2 ring-amber-500/30 border-current shadow-xs`
                          : 'border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${prov.badge}`}>
                          {prov.code}
                        </span>

                        {isSelected ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                        )}
                      </div>

                      <div>
                        <p className="font-extrabold text-[11px] sm:text-xs truncate">
                          {prov.name}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium truncate">
                          {prov.hint}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account Number & Account Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  {provider === 'BANK' ? (
                    <>
                      <Building2 className="w-3 h-3 text-slate-500" />
                      Bank Account Number
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-3 h-3 text-slate-500" />
                      MoMo Phone Number
                    </>
                  )}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  placeholder={provider === 'BANK' ? 'e.g. 1029384756' : 'e.g. 0244123456'}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  Account Holder Name
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  placeholder="e.g. Kwame Mensah"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden transition-all"
                  required
                />
              </div>
            </div>

            {/* Live Transparent Cashout Receipt Breakdown */}
            {numericAmount > 0 && (
              <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600 font-medium text-[11px]">
                  <span>Withdrawal Amount:</span>
                  <span className="font-bold text-slate-900">{currencySymbol} {numericAmount.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 font-medium text-[11px]">
                  <span>Network / Gateway Fee:</span>
                  <span className={`font-bold ${isFreePayout ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {isFreePayout ? 'FREE (0.00)' : `${currencySymbol} ${payoutFee.toFixed(2)}`}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-black">
                  <span className="text-slate-900">Total Deducted from Wallet:</span>
                  <span className="text-amber-900 font-extrabold">{currencySymbol} {totalRequired.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Remaining Wallet Balance:</span>
                  <span className="font-bold text-slate-700">{currencySymbol} {remainingBalance.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Validation Alerts */}
            {isOverBalance && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[11px] font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  Insufficient funds. You need {currencySymbol} {totalRequired.toFixed(2)} but only have {currencySymbol} {availableBalance.toFixed(2)} available.
                </span>
              </div>
            )}

            {isBelowMin && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Amount is below your plan threshold of {currencySymbol} {minThreshold.toFixed(2)}.
                </span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading || availableBalance < minThreshold || isOverBalance || isBelowMin || !numericAmount}
                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.99] disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed text-stone-950 font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Instant Payout...</span>
                  </>
                ) : availableBalance < minThreshold ? (
                  <span>Minimum Threshold: {currencySymbol} {minThreshold.toFixed(2)}</span>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                    <span>
                      Withdraw {numericAmount > 0 ? `${currencySymbol} ${numericAmount.toFixed(2)}` : 'Cash'} to {provider}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Trust Footer */}
            <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Direct MoMo Clearing via Paystack Transfer Engine • 256-bit SSL</span>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};
