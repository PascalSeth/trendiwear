'use client';

import { useState, useEffect } from 'react';
import DashboardTopBar from './DashboardTopBar';
import DashboardSidebar from './DashboardSidebar';
import DashboardBottomNav from './DashboardBottomNav';
import { Role } from '@prisma/client';
import { X } from 'lucide-react';
import type { UserInfo } from './ServerDashboardShell';
import { TrialWarning } from '@/components/subscription/TrialWarning';

import { AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardShellProps {
  children: React.ReactNode;
  role: Role;
  userInfo: UserInfo;
}

const DashboardShell: React.FC<DashboardShellProps> = ({ children, role, userInfo }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);



  const currentDaysRemaining = userInfo.daysRemaining;

  // Handle global search shortcut
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
        <div className="flex flex-col h-[100dvh]">
          <header className="sticky top-0 z-50">
            <DashboardTopBar
              onMenuClick={() => setIsMobileSidebarOpen(true)}
              onDesktopToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
              isSidebarCollapsed={isSidebarCollapsed}
              userInfo={userInfo}
            />
          </header>

          {/* Trial Warning */}
          {typeof currentDaysRemaining === 'number' && currentDaysRemaining > 0 && currentDaysRemaining <= 30 && (
            <div className="px-4 mt-2 max-w-[1600px] mx-auto w-full">
               <TrialWarning daysRemaining={currentDaysRemaining} />
            </div>
          )}

          {/* Expired Warning */}
          {typeof currentDaysRemaining === 'number' && currentDaysRemaining <= 0 && role === Role.PROFESSIONAL && !userInfo.hasActiveSubscription && (
            <div className="px-4 mt-2 max-w-[1600px] mx-auto w-full">
               <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm shadow-orange-100">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                     <AlertCircle className="w-6 h-6 animate-pulse" />
                   </div>
                   <div>
                     <p className="text-orange-900 font-black uppercase tracking-tight text-sm italic">Trial Expired</p>
                     <p className="text-orange-700 text-xs font-medium">Your free access has concluded. Subscribe to reactivate your shop features.</p>
                   </div>
                 </div>
                 <Link href="/dashboard/subscription">
                   <button className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center gap-2 group/btn whitespace-nowrap">
                     Subscribe Now <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                   </button>
                 </Link>
               </div>
            </div>
          )}

          <main className="flex-1 p-4 pb-32 sm:p-6 lg:p-10 overflow-y-auto scrollbar-hide">
            <div className="mx-auto w-full max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="relative">
                  {children}
              </div>
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
