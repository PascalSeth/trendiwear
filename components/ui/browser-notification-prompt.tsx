'use client'

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export function BrowserNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const checkPermission = () => {
      // If already granted or denied, hide immediately
      if (Notification.permission !== 'default') {
        setShowPrompt(false);
        return true;
      }
      return false;
    };

    // Initial check
    if (checkPermission()) return;

    // Show soft prompt after a delay, but only if still default
    const isDismissed = localStorage.getItem('notificationPromptDismissed') === 'true';
    if (!isDismissed) {
      const timer = setTimeout(() => {
        if (!checkPermission()) {
          setShowPrompt(true);
        }
      }, 5000);

      // Re-check on window focus (in case they enabled it in browser settings)
      window.addEventListener('focus', checkPermission);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('focus', checkPermission);
      };
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('Concierge alerts enabled!');
    }
    setShowPrompt(false);
  };

  const dismissPrompt = () => {
    localStorage.setItem('notificationPromptDismissed', 'true');
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
           initial={{ opacity: 0, y: 50, x: 20, scale: 0.9 }}
           animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
           exit={{ opacity: 0, y: 20, scale: 0.9 }}
           className="fixed bottom-6 right-6 z-[9999] bg-stone-900 text-white rounded-3xl p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] w-[calc(100vw-3rem)] sm:w-[340px] border border-stone-800"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <Bell size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold tracking-tight truncate">Stay Updated</p>
              <p className="text-[11px] text-stone-400 leading-tight mt-0.5 line-clamp-2">Enable concierge alerts to receive live atelier updates.</p>
              <div className="flex gap-4 pt-3">
                <button
                  onClick={requestPermission}
                  className="bg-white text-stone-900 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-colors"
                >
                  Enable
                </button>
                <button
                  onClick={dismissPrompt}
                  className="text-stone-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors flex items-center"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
