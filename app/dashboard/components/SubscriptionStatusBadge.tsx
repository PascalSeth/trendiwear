'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Award, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

import { Role } from '@prisma/client';

interface SubscriptionData {
  status: 'ACTIVE' | 'INACTIVE' | 'TRIAL' | 'EXPIRED';
  tierName?: string;
  daysRemaining?: number;
  nextRenewalDate?: string;
  trialEndDate?: string;
  isOnTrial?: boolean;
  subscriptionStatus?: string;
}

export function SubscriptionStatusBadge({ role }: { role?: Role }) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptionStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/subscriptions/trial');
      if (response.ok) {
        const result = await response.json();
        const data = result.data;

        if (data?.currentSubscription && data.currentSubscription.status === 'ACTIVE') {
          setSubscription({
            status: 'ACTIVE',
            subscriptionStatus: 'ACTIVE',
            tierName: data.currentSubscription.tier?.name || 'Pro Plan',
            nextRenewalDate: data.currentSubscription.nextRenewalDate,
          });
        } else if (data?.isOnTrial) {
          setSubscription({
            status: 'TRIAL',
            subscriptionStatus: 'TRIAL',
            tierName: 'Free Trial',
            daysRemaining: data.daysRemaining,
            trialEndDate: data.trialEndDate,
            isOnTrial: true,
          });
        } else {
          setSubscription({
            status: 'INACTIVE',
            subscriptionStatus: 'EXPIRED',
          });
        }
      } else {
        setSubscription({
          status: 'INACTIVE',
          subscriptionStatus: 'EXPIRED',
        });
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setSubscription({
        status: 'INACTIVE',
        subscriptionStatus: 'EXPIRED',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role === Role.SUPER_ADMIN || role === Role.ADMIN) {
      setSubscription({
        status: 'ACTIVE',
        subscriptionStatus: 'ACTIVE',
        tierName: role === Role.SUPER_ADMIN ? 'Super Admin' : 'Admin',
      });
      setLoading(false);
      return;
    }

    fetchSubscriptionStatus();
    // Refresh every 5 minutes
    const interval = setInterval(fetchSubscriptionStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [role, fetchSubscriptionStatus]);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
        <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Checking plan...</span>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  // Active Subscription Badge
  if (subscription.status === 'ACTIVE') {
    const renewalDate = subscription.nextRenewalDate 
      ? new Date(subscription.nextRenewalDate).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      : 'N/A';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all duration-300 cursor-pointer shadow-2xs">
            <div className="relative flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold tracking-wide text-emerald-800 hidden sm:inline">
                {subscription.tierName || (role === Role.SUPER_ADMIN ? 'Super Admin' : 'Premium')}
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-white border border-emerald-100 shadow-xl rounded-2xl p-0 overflow-hidden">
          <div className="bg-emerald-600 p-3 text-white">
            <DropdownMenuLabel className="p-0 font-black text-white text-xs uppercase tracking-wider">
              {role === Role.SUPER_ADMIN ? 'System Administration' : role === Role.ADMIN ? 'Administrator' : 'Active Subscription'}
            </DropdownMenuLabel>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Membership:</span>
              <span className="font-bold text-emerald-700">{subscription.tierName || (role === Role.SUPER_ADMIN ? 'Full Platform' : 'Premium')}</span>
            </div>
            {(role !== Role.SUPER_ADMIN && role !== Role.ADMIN) && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Renewal Date:</span>
                <span className="font-bold text-slate-900">{renewalDate}</span>
              </div>
            )}
            {(role === Role.SUPER_ADMIN || role === Role.ADMIN) && (
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                System accounts have full admin privileges across all platform modules.
              </p>
            )}
          </div>
          {(role !== Role.SUPER_ADMIN && role !== Role.ADMIN) && (
            <>
              <DropdownMenuSeparator className="bg-slate-100" />
              <div className="p-2">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/subscription" className="w-full cursor-pointer flex items-center justify-between p-2 rounded-xl text-xs font-bold text-slate-900 hover:bg-slate-50">
                    <span>Manage Subscription</span>
                    <ArrowRight className="h-3.5 w-3.5 text-indigo-600" />
                  </Link>
                </DropdownMenuItem>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Trial Badge
  if (subscription.status === 'TRIAL') {
    const daysText = subscription.daysRemaining === 1 ? 'day' : 'days';
    const isLowDays = subscription.daysRemaining ? subscription.daysRemaining <= 7 : false;
    const trialEndDate = subscription.trialEndDate 
      ? new Date(subscription.trialEndDate).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        })
      : 'N/A';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer shadow-2xs ${
            isLowDays
              ? 'border-amber-200 bg-amber-50 hover:bg-amber-100'
              : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100'
          }`}>
            <div className="relative flex items-center gap-1.5">
              {isLowDays ? (
                <AlertCircle className="h-4 w-4 text-amber-600 animate-pulse" />
              ) : (
                <Award className="h-4 w-4 text-indigo-600" />
              )}
              <span className={`text-xs font-bold tracking-wide hidden sm:inline ${
                isLowDays ? 'text-amber-800' : 'text-indigo-800'
              }`}>
                Trial: {subscription.daysRemaining}d left
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-72 bg-white border border-slate-200/80 shadow-xl rounded-2xl p-0 overflow-hidden"
        >
          <div className={`p-3.5 text-white ${isLowDays ? 'bg-amber-600' : 'bg-indigo-600'}`}>
            <DropdownMenuLabel className="p-0 font-black text-white text-xs uppercase tracking-wider">
              {isLowDays ? '⏰ Trial Expiring Soon' : '✦ 90-Day Free Trial'}
            </DropdownMenuLabel>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Status:</span>
              <span className={`font-bold ${isLowDays ? 'text-amber-700' : 'text-indigo-700'}`}>
                Free Professional Trial
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Time Remaining:</span>
              <span className="font-bold text-slate-900">
                {subscription.daysRemaining} {daysText}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Expiry Date:</span>
              <span className="font-bold text-slate-900">{trialEndDate}</span>
            </div>

            {isLowDays && (
              <p className="text-[11px] text-amber-700 font-medium bg-amber-50 p-2.5 rounded-xl border border-amber-200/60">
                Upgrade your store plan to maintain uninterrupted product creation &amp; service booking.
              </p>
            )}
          </div>

          <DropdownMenuSeparator className="bg-slate-100" />
          <div className="p-2">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/subscription" className="w-full cursor-pointer flex items-center justify-between p-2 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50">
                <span>Unlock Unlimited Plans</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Inactive / Expired Badge
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-all duration-300 cursor-pointer shadow-2xs">
          <div className="relative flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-rose-600 animate-pulse" />
            <span className="text-xs font-bold tracking-wide text-rose-800 hidden sm:inline uppercase">
              Plan Expired
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-white border border-rose-200 shadow-xl rounded-2xl p-0 overflow-hidden">
        <div className="bg-rose-600 p-3 text-white">
          <DropdownMenuLabel className="p-0 font-black uppercase tracking-wider text-white text-xs flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            Access Restricted
          </DropdownMenuLabel>
        </div>
        
        <div className="p-4 space-y-3">
          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            Your free trial has ended. Select a membership tier to restore product listing and shop management.
          </p>

          <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
            <Link href="/dashboard/subscription" className="w-full">
              <button className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xs">
                Reactivate Membership <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
