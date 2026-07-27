'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Wallet, ArrowUpRight, Loader2, 
  AlertCircle, Award
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
  defaultMomoNumber?: string;
  defaultMomoProvider?: string;
  onSuccess: (newBalance?: number) => void;
}

export const PayoutRequestModal: React.FC<PayoutRequestModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  defaultMomoNumber = '',
  defaultMomoProvider = 'MTN',
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>(defaultMomoNumber);
  const [accountName, setAccountName] = useState<string>('');
  const [provider, setProvider] = useState<string>(defaultMomoProvider);
  const [loading, setLoading] = useState<boolean>(false);
  const [limits, setLimits] = useState<PayoutLimits | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/payouts/request')
        .then((res) => res.json())
        .then((data) => {
          if (data.limits) setLimits(data.limits);
          if (data.momoNumber) setAccountNumber(prev => prev || data.momoNumber);
          if (data.momoProvider) setProvider(data.momoProvider);
        })
        .catch((err) => console.error('Error fetching payout limits:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const minThreshold = limits?.minThreshold || 50.0;
  const isFreePayout = limits?.isFreePayout ?? true;
  const payoutFee = limits?.payoutFee || 0.0;

  const handlePresetAmount = (preset: number) => {
    const val = Math.min(preset, availableBalance);
    setAmount(val.toString());
  };

  const handleMaxAmount = () => {
    setAmount(availableBalance.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount < minThreshold) {
      toast.error(`Minimum withdrawal threshold for your ${limits?.tierName || 'plan'} is GH₵ ${minThreshold.toFixed(2)}`);
      return;
    }

    const totalRequired = numericAmount + payoutFee;
    if (totalRequired > availableBalance) {
      toast.error(`Insufficient balance. Required GH₵ ${totalRequired.toFixed(2)} (Withdrawal: GH₵ ${numericAmount.toFixed(2)} + Fee: GH₵ ${payoutFee.toFixed(2)})`);
      return;
    }

    if (!accountNumber.trim()) {
      toast.error('Please enter a valid Mobile Money or Bank account number');
      return;
    }

    if (!accountName.trim()) {
      toast.error('Please enter the account holder name');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          accountNumber,
          accountName,
          provider,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit payout request');
      }

      if (data.instantPayout) {
        toast.success(`🎉 Instant Payout Complete! GH₵ ${numericAmount.toFixed(2)} sent to ${provider} (${accountNumber})`);
      } else {
        toast.success(`Payout request of GH₵ ${numericAmount.toFixed(2)} queued for processing.`);
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Withdraw Earnings</h3>
              <p className="text-xs font-medium text-slate-500">Instant transfer to Mobile Money / Bank</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tier Status & Current Available Balance Card */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-indigo-200/80 font-bold uppercase tracking-wider">
            <span>Available Balance</span>
            <span className="flex items-center gap-1 text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-300 border border-indigo-500/30">
              <Award className="w-3 h-3 text-amber-400" /> {limits?.tierName || 'Merchant'}
            </span>
          </div>

          <div className="text-3xl font-black tracking-tight text-white">
            GH₵ {availableBalance.toFixed(2)}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-indigo-800/60 text-[10px] text-indigo-200 font-medium">
            <span>Min Threshold: <strong className="text-white">GH₵ {minThreshold.toFixed(2)}</strong></span>
            <span>Fee: <strong className="text-emerald-400">{isFreePayout ? 'FREE (0.00)' : `GH₵ ${payoutFee.toFixed(2)}`}</strong></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Withdrawal Amount (GH₵)</label>
              <button
                type="button"
                onClick={handleMaxAmount}
                className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full"
              >
                Use MAX
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">GH₵</span>
              <input
                type="number"
                step="0.01"
                min={minThreshold}
                max={availableBalance}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 mt-2">
              {[1, 2, 5, 10, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetAmount(preset)}
                  disabled={preset > availableBalance}
                  className="flex-1 py-1 px-2 text-[10px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 transition-all"
                >
                  +GH₵ {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Provider Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Payout Provider</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'MTN', label: 'MTN MoMo' },
                { id: 'TELECEL', label: 'Telecel' },
                { id: 'AT', label: 'AT / Airtel' },
                { id: 'BANK', label: 'Bank' },
              ].map((prov) => (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => setProvider(prov.id)}
                  className={`py-2 px-1 text-[10px] font-black rounded-xl border transition-all text-center ${
                    provider === prov.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  {prov.label}
                </button>
              ))}
            </div>
          </div>

          {/* Account Number & Account Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {provider === 'BANK' ? 'Account Number' : 'MoMo Phone Number'}
              </label>
              <input
                type="text"
                placeholder={provider === 'BANK' ? '1234567890' : '024XXXXXXX'}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                placeholder="e.g. Kwame Mensah"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || availableBalance < minThreshold}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : availableBalance < minThreshold ? (
              <span>Minimum Withdrawal: GH₵ {minThreshold.toFixed(2)}</span>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" /> Withdraw GH₵ {amount || '0.00'} Now
              </>
            )}
          </button>

          {availableBalance < minThreshold && (
            <p className="text-[11px] text-amber-800 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Available balance (GH₵ {availableBalance.toFixed(2)}) is below the GH₵ {minThreshold.toFixed(2)} plan threshold.</span>
            </p>
          )}

          <p className="text-[10px] text-center text-slate-400 font-medium">
            Protected by Paystack Instant MoMo Transfer Engine. 100% Secure.
          </p>

        </form>

      </div>
    </div>
  );
};
