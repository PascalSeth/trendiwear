'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, CreditCard, Package, ArrowRight, X, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';

interface SetupGuideProps {
  isVerified: boolean;
  paymentSetupComplete: boolean;
  hasProductsOrServices: boolean;
  businessName: string;
  profileId: string;
}

export default function SetupGuide({
  isVerified,
  paymentSetupComplete,
  hasProductsOrServices,
  businessName,
  profileId,
}: SetupGuideProps) {
  const steps = [
    {
      id: 'store',
      title: 'Add Your First Item',
      description: 'Upload a product or create a service to start building your catalogue.',
      icon: <Package className="w-5 h-5" />,
      isCompleted: hasProductsOrServices,
      actionText: 'Add Product/Service',
      actionUrl: '/dashboard/catalogue/products',
    },
    {
      id: 'payment',
      title: 'Configure Payouts',
      description: 'Set up your mobile money credentials so you can receive earnings directly.',
      icon: <CreditCard className="w-5 h-5" />,
      isCompleted: paymentSetupComplete,
      actionText: 'Setup Payments',
      actionUrl: '/dashboard/settings', // Will prompt user to switch to Payments tab
    },
    {
      id: 'verification',
      title: 'Get Verified',
      description: 'Request a verified badge to increase trust and gain 40% more visibility in search.',
      icon: <ShieldAlert className="w-5 h-5" />,
      isCompleted: isVerified,
      actionText: 'Verify Now',
      actionUrl: `mailto:verify@trendiwear.com?subject=Verification Request&body=Business: ${businessName} (ID: ${profileId})`,
      isExternal: true,
    },
  ];

  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progressPercentage = Math.round((completedCount / steps.length) * 100);
  const isAllComplete = completedCount === steps.length;

  // By default, expand if there are remaining steps, collapse if 100% complete.
  const [isExpanded, setIsExpanded] = useState(!isAllComplete);
  // Optional: let user dismiss it completely if they want
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // If they just completed the last step while on this page
    if (isAllComplete && isExpanded) {
      setTimeout(() => setIsExpanded(false), 3000);
    }
  }, [isAllComplete, isExpanded]);

  if (isDismissed) return null;

  return (
    <div className="animate-in fade-in slide-in-from-top-4 duration-700 w-full mb-8">
      <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
        
        {/* Background Decorative Gradients */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none"></div>

        {/* Header Section */}
        <div 
          className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer hover:bg-white/40 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="relative">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                <circle
                  cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent"
                  strokeDasharray={150.8} // 2 * pi * r
                  strokeDashoffset={150.8 - (150.8 * progressPercentage) / 100}
                  className={`${isAllComplete ? 'text-emerald-500' : 'text-indigo-600'} transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {isAllComplete ? (
                   <Check className="w-6 h-6 text-emerald-500" />
                ) : (
                   <span className="text-sm font-bold text-slate-800">{progressPercentage}%</span>
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {isAllComplete ? "You're All Set!" : "Setup Your Virtual Store"}
                {isAllComplete && <Sparkles className="w-5 h-5 text-amber-500" />}
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                {isAllComplete 
                  ? "Your business profile is fully optimized." 
                  : `${completedCount} of ${steps.length} onboarding tasks completed.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
             {isAllComplete && !isExpanded && (
               <button 
                 onClick={(e) => { e.stopPropagation(); setIsDismissed(true); }}
                 className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors mr-2"
                 title="Dismiss"
               >
                 <X className="w-5 h-5" />
               </button>
             )}
             <div className="p-2 bg-slate-50 rounded-full text-slate-400">
               {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
             </div>
          </div>
        </div>

        {/* Expandable Checklist */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 md:px-8 md:pb-8 pt-2">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {steps.map((step) => (
                    <div 
                      key={step.id} 
                      className={`relative flex flex-col p-5 rounded-2xl border transition-all duration-300 ${
                        step.isCompleted 
                          ? 'bg-emerald-50/50 border-emerald-100 shadow-sm' 
                          : 'bg-white border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:border-indigo-200 hover:shadow-md'
                      }`}
                    >
                      {step.isCompleted && (
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10 animate-in zoom-in">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${
                          step.isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {step.icon}
                        </div>
                        <div>
                          <h4 className={`font-bold ${step.isCompleted ? 'text-emerald-900' : 'text-slate-900'}`}>
                            {step.title}
                          </h4>
                        </div>
                      </div>
                      
                      <p className={`text-sm mb-6 flex-1 ${step.isCompleted ? 'text-emerald-700/80' : 'text-slate-500'}`}>
                        {step.description}
                      </p>
                      
                      <div className="mt-auto">
                        {!step.isCompleted ? (
                          step.isExternal ? (
                            <a 
                              href={step.actionUrl}
                              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md transition-colors group"
                            >
                              {step.actionText} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </a>
                          ) : (
                            <Link 
                              href={step.actionUrl}
                              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md transition-colors group"
                            >
                              {step.actionText} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          )
                        ) : (
                          <div className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-emerald-100/50 text-emerald-700 text-sm font-semibold rounded-xl">
                            Completed
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
