'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, Loader2, Award, ArrowRight } from 'lucide-react';
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
  }, [role]);

  const fetchSubscriptionStatus = async () => {
    try {
      // First try to get user subscription status
      const response = await fetch('/api/subscriptions/manage');
      if (response.ok) {
        const data = await response.json();
        
        // Check if has active subscription
        if (data.data?.hasActiveSubscription && data.data?.subscription) {
          setSubscription({
            status: 'ACTIVE',
            subscriptionStatus: 'ACTIVE',
            tierName: data.data.subscription.tier?.name,
            nextRenewalDate: data.data.subscription.nextRenewalDate,
          });
        } else if (data.data?.isTrialActive) {
          // On trial - fetch full trial details
          const trialResponse = await fetch('/api/subscriptions/trial');
          if (trialResponse.ok) {
            const trialData = await trialResponse.json();
            setSubscription({
              status: 'TRIAL',
              subscriptionStatus: 'TRIAL',
              tierName: 'Free Trial',
              daysRemaining: trialData.data?.daysRemaining || data.data.daysRemaining,
              trialEndDate: trialData.data?.trialEndDate,
              isOnTrial: true,
            });
          } else {
            setSubscription({
              status: 'TRIAL',
              subscriptionStatus: 'TRIAL',
              tierName: 'Free Trial',
              daysRemaining: data.data.daysRemaining,
              isOnTrial: true,
            });
          }
        } else {
          // Check if trial
          const trialResponse = await fetch('/api/subscriptions/trial');
          if (trialResponse.ok) {
            const trialData = await trialResponse.json();
            if (trialData.data?.isOnTrial) {
              setSubscription({
                status: 'TRIAL',
                subscriptionStatus: 'TRIAL',
                tierName: 'Free Trial',
                daysRemaining: trialData.data.daysRemaining,
                trialEndDate: trialData.data.trialEndDate,
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
        }
      } else if (response.status === 404) {
        // Check if user is on trial
        const trialResponse = await fetch('/api/subscriptions/trial');
        if (trialResponse.ok) {
          const trialData = await trialResponse.json();
          if (trialData.data?.isOnTrial) {
            setSubscription({
              status: 'TRIAL',
              subscriptionStatus: 'TRIAL',
              tierName: 'Free Trial',
              daysRemaining: trialData.data.daysRemaining,
              trialEndDate: trialData.data.trialEndDate,
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
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        <span className="text-xs text-slate-500 hidden sm:inline">Loading...</span>
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
          <button className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all duration-300 cursor-pointer">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-400/0 via-emerald-400/5 to-emerald-400/0 group-hover:via-emerald-400/10 transition-all" />
            <div className="relative flex items-center gap-2">
              <div className="relative">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-pulse opacity-0" />
              </div>
              <span className="text-xs font-bold tracking-wide text-emerald-700 hidden sm:inline">
                {subscription.tierName || (role === Role.SUPER_ADMIN ? 'Super Admin' : 'Premium')}
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-white/95 backdrop-blur-md border border-emerald-100 shadow-lg rounded-xl">
          <DropdownMenuLabel className="text-emerald-900 font-semibold">
            {role === Role.SUPER_ADMIN ? 'System Administration' : role === Role.ADMIN ? 'Administrator' : 'Active Subscription'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-emerald-100" />
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Level:</span>
              <span className="text-sm font-semibold text-emerald-700">{subscription.tierName || (role === Role.SUPER_ADMIN ? 'Full Platform' : 'Premium')}</span>
            </div>
            {(role !== Role.SUPER_ADMIN && role !== Role.ADMIN) && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Renews:</span>
                <span className="text-sm font-semibold text-slate-900">{renewalDate}</span>
              </div>
            )}
            {(role === Role.SUPER_ADMIN || role === Role.ADMIN) && (
              <p className="text-xs text-slate-500 italic mt-2">
                System accounts have unrestricted access to all dashboard features and modules.
              </p>
            )}
          </div>
          {(role !== Role.SUPER_ADMIN && role !== Role.ADMIN) && (
            <>
              <DropdownMenuSeparator className="bg-emerald-100" />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/subscription" className="w-full cursor-pointer">
                  <span className="flex items-center gap-2">
                    <span>Manage Plan</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Trial Badge
  if (subscription.status === 'TRIAL') {
    const daysText = subscription.daysRemaining === 1 ? 'day' : 'days';
    const isLowDays = subscription.daysRemaining ? subscription.daysRemaining <= 3 : false;
    const isPulse = isLowDays;
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
          <button className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 cursor-pointer ${
            isLowDays
              ? 'border-orange-200 bg-orange-50 hover:bg-orange-100'
              : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
          }`}>
            <div className={`absolute inset-0 rounded-lg transition-all ${
              isLowDays
                ? 'bg-gradient-to-r from-orange-400/0 via-orange-400/5 to-orange-400/0 group-hover:via-orange-400/10'
                : 'bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 group-hover:via-blue-400/10'
            }`} />
            <div className="relative flex items-center gap-2">
              {isLowDays ? (
                <AlertCircle className={`h-4 w-4 text-orange-600 ${isPulse ? 'animate-pulse' : ''}`} />
              ) : (
                <Award className="h-4 w-4 text-blue-600" />
              )}
              <span className={`text-xs font-bold tracking-wide hidden sm:inline ${
                isLowDays ? 'text-orange-700' : 'text-blue-700'
              }`}>
                Trial: {subscription.daysRemaining}d
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className={`w-72 backdrop-blur-md shadow-lg rounded-xl ${
            isLowDays 
              ? 'bg-orange-50/95 border border-orange-200' 
              : 'bg-blue-50/95 border border-blue-200'
          }`}
        >
          <DropdownMenuLabel className={`font-semibold ${isLowDays ? 'text-orange-900' : 'text-blue-900'}`}>
            {isLowDays ? '⏰ Trial Ending Soon' : '✦ Free Trial Active'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className={isLowDays ? 'bg-orange-200' : 'bg-blue-200'} />
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Status:</span>
              <span className={`text-sm font-bold ${isLowDays ? 'text-orange-700' : 'text-blue-700'}`}>
                Trial
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Days Remaining:</span>
              <span className={`text-sm font-bold ${isLowDays ? 'text-orange-700' : 'text-blue-700'}`}>
                {subscription.daysRemaining} {daysText}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Expires:</span>
              <span className="text-sm font-semibold text-slate-900">{trialEndDate}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${isLowDays ? 'bg-orange-500' : 'bg-blue-500'}`}
                style={{
                  width: `${Math.max(10, Math.min(90, (subscription.daysRemaining || 0) * 3.33))}%`
                }}
              />
            </div>
            {isLowDays && (
              <p className="text-xs text-orange-700 font-medium">
                🔔 Your trial is ending soon. Upgrade to continue using all features.
              </p>
            )}
          </div>
          <DropdownMenuSeparator className={isLowDays ? 'bg-orange-200' : 'bg-blue-200'} />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/subscription" className="w-full cursor-pointer">
              <span className="flex items-center gap-2 font-semibold">
                <span>Upgrade Now</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Inactive/No Subscription Badge
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all duration-300 cursor-pointer">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-slate-400/0 via-slate-400/5 to-slate-400/0 group-hover:via-slate-400/10 transition-all" />
          <div className="relative flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-600" />
            <span className="text-xs font-bold tracking-wide text-slate-700 hidden sm:inline">
              No Subscription
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg rounded-xl">
        <DropdownMenuLabel className="text-slate-900 font-semibold">No Active Plan</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-200" />
        <div className="p-3 space-y-2">
          <p className="text-sm text-slate-600">Your trial has ended. Subscribe to unlock full features:</p>
          <ul className="text-xs text-slate-600 space-y-1 ml-2">
            <li>✓ Create unlimited services</li>
            <li>✓ Advanced analytics & insights</li>
            <li>✓ Priority support</li>
          </ul>
        </div>
        <DropdownMenuSeparator className="bg-slate-200" />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/subscription" className="w-full cursor-pointer">
            <span className="flex items-center gap-2 font-semibold text-blue-600">
              <span>View Plans</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
