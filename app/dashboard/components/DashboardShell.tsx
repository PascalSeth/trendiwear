'use client';

import { useState, useEffect } from 'react';
import DashboardTopBar from './DashboardTopBar';
import DashboardSidebar from './DashboardSidebar';
import DashboardBottomNav from './DashboardBottomNav';
import { Role } from '@prisma/client';
import { X } from 'lucide-react';
import type { UserInfo } from './ServerDashboardShell';
import { TrialWarning } from '@/components/subscription/TrialWarning';
import { SubscriptionTiers } from '@/components/subscription/SubscriptionTiers';
import { AlertCircle } from 'lucide-react';

interface DashboardShellProps {
  children: React.ReactNode;
  role: Role;
  userInfo: UserInfo;
}

const DashboardShell: React.FC<DashboardShellProps> = ({ children, role, userInfo }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Consider trial expired if trialEndDate exists and is in the past
  const isTrialExpired = userInfo.trialEndDate 
    ? new Date(userInfo.trialEndDate) < new Date() 
    : false;
  
  // They must subscribe if they are a PROFESSIONAL, trial is expired, and no active subscription
  const mustSubscribe = role === Role.PROFESSIONAL && isTrialExpired && !userInfo.hasActiveSubscription;

  useEffect(() => {
    // Optionally still fetch for most up-to-date trial status or skip if already have from server
    if (role === Role.PROFESSIONAL) {
      if (userInfo.trialEndDate) {
        const remaining = Math.max(0, Math.ceil((new Date(userInfo.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        setDaysRemaining(remaining);
      } else {
        const checkTrial = async () => {
          try {
            const res = await fetch('/api/subscriptions/trial');
            if (res.ok) {
              const response = await res.json();
              if (response.data?.daysRemaining !== undefined) {
                setDaysRemaining(response.data.daysRemaining);
              }
            }
          } catch (error) {
            console.error('Error checking trial status:', error);
          }
        };
        checkTrial();
      }
    }
  }, [role, userInfo.trialEndDate]);

  const handleSelectTier = async (tierId: string, billingCycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY') => {
    setSubscriptionLoading(true);
    try {
      const paymentResponse = await fetch('/api/subscriptions/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId,
          billingCycle,
          callbackUrl: `${window.location.origin}/dashboard/subscription/payment-complete`,
        }),
      });

      if (!paymentResponse.ok) throw new Error('Failed to initialize payment');
      const paymentData = await paymentResponse.json();
      if (paymentData.data?.authorizationUrl) {
        window.location.href = paymentData.data.authorizationUrl;
      }
    } catch (err) {
      console.error(err);
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Trigger search - for now just console log or focus if we had a global search component
        console.log('Search triggered');
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 selection:bg-violet-100 selection:text-violet-900">
      {/* Dynamic Background Art */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Animated Blobs with Gradient Masks */}
        <div className="absolute -top-[10%] -left-[5%] h-[40%] w-[40%] animate-blob rounded-full bg-gradient-to-br from-violet-400/20 to-indigo-500/5 blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[50%] animate-blob rounded-full bg-gradient-to-tr from-cyan-300/15 to-blue-400/5 blur-[120px] [animation-delay:3s]" />
        <div className="absolute -bottom-[10%] left-[20%] h-[40%] w-[40%] animate-blob rounded-full bg-gradient-to-bl from-rose-300/10 to-violet-400/5 blur-[100px] [animation-delay:7s]" />
        
        {/* Subtle Mesh Grid */}
        <div className="absolute inset-0 opacity-[0.015] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]">
            <div className="h-full w-full bg-[size:32px_32px] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)]" />
        </div>

        {/* Floating "Orbs" of Light */}
        <div className="absolute top-1/4 left-1/3 h-2 w-2 animate-float-slow rounded-full bg-violet-400/30 shadow-[0_0_40px_rgba(139,92,246,0.4)]" />
        <div className="absolute top-3/4 right-1/3 h-1.5 w-1.5 animate-pulse-slow rounded-full bg-cyan-400/30 shadow-[0_0_30px_rgba(34,211,238,0.3)] [animation-delay:2s]" />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar 
          role={role} 
          collapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(prev => !prev)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-all duration-300"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[280px] border-r border-slate-200 bg-white/90 shadow-2xl backdrop-blur-2xl">
            <div className="relative h-full">
                <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
                >
                <X className="h-5 w-5" />
                </button>
                <DashboardSidebar role={role} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`relative min-h-screen transition-all duration-500 ease-in-out ${
          isSidebarCollapsed ? 'lg:ml-24' : 'lg:ml-72'
        }`}
      >
        <div className="flex flex-col h-screen">
          <header className="sticky top-0 z-50">
            <DashboardTopBar
              onDesktopToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
              isSidebarCollapsed={isSidebarCollapsed}
              userInfo={userInfo}
            />
          </header>

          {/* Trial Warning */}
          {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 30 && (
            <div className="px-4 mt-2 max-w-[1600px] mx-auto w-full">
               <TrialWarning daysRemaining={daysRemaining} />
            </div>
          )}

          <main className="flex-1 p-4 pb-32 sm:p-6 lg:p-10 overflow-y-auto scrollbar-hide">
            <div className="mx-auto w-full max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
              {mustSubscribe ? (
                <div className="flex flex-col items-center justify-center min-h-[75vh] text-center">
                  <div className="mb-10 p-8 bg-white/70 backdrop-blur-md rounded-3xl border border-white/50 shadow-xl max-w-2xl">
                    <div className="flex items-center justify-center w-20 h-20 bg-amber-50 text-amber-500 rounded-2xl mx-auto mb-6 shadow-inner">
                      <AlertCircle className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-3">
                      Trial Phase <span className="text-violet-600">Expired</span>
                    </h1>
                    <p className="text-slate-500 text-lg leading-relaxed">
                      Your professional trial has ended. Elevate your business by selecting 
                      a subscription plan that fits your growth ambitions.
                    </p>
                  </div>
                  
                  <div className="w-full">
                    <SubscriptionTiers 
                      onSelectTier={handleSelectTier} 
                      loading={subscriptionLoading}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative">
                    {children}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <DashboardBottomNav 
        role={role} 
        onMenuClick={() => setIsMobileSidebarOpen(true)} 
      />
    </div>
  );
};

export default DashboardShell;
