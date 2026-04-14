'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bell, Package, Heart, ShoppingBag, DollarSign, Truck, Star, X, Check, CheckCheck, Lightbulb, Gem } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: string;
}

const notificationIcons: Record<string, React.ElementType> = {
  ORDER_UPDATE: Package,
  BOOKING_CONFIRMATION: Check,
  NEW_INSPIRATION: Lightbulb,
  PAYMENT_RECEIVED: DollarSign,
  REVIEW_RECEIVED: Star,
  PROMOTION: Gem,
  SYSTEM_UPDATE: Bell,
  DELIVERY_CONFIRMATION_REQUEST: Truck,
  PAYMENT_RELEASED: DollarSign,
  MESSAGE_RECEIVED: Bell,
  WISHLIST_SALE: Heart,
  STOCK_ALERT: ShoppingBag,
  SHIPPING_UPDATE: Truck,
  DELIVERY_ARRIVAL: Package,
};

const notificationColors: Record<string, string> = {
  ORDER_UPDATE: 'bg-blue-100 text-blue-600',
  BOOKING_CONFIRMATION: 'bg-green-100 text-green-600',
  NEW_INSPIRATION: 'bg-purple-100 text-purple-600',
  PAYMENT_RECEIVED: 'bg-emerald-100 text-emerald-600',
  REVIEW_RECEIVED: 'bg-amber-100 text-amber-600',
  PROMOTION: 'bg-pink-100 text-pink-600',
  SYSTEM_UPDATE: 'bg-stone-100 text-stone-600',
  DELIVERY_CONFIRMATION_REQUEST: 'bg-orange-100 text-orange-600',
  PAYMENT_RELEASED: 'bg-emerald-100 text-emerald-600',
  MESSAGE_RECEIVED: 'bg-blue-100 text-blue-600',
  WISHLIST_SALE: 'bg-red-100 text-red-600',
  STOCK_ALERT: 'bg-yellow-100 text-yellow-600',
  SHIPPING_UPDATE: 'bg-indigo-100 text-indigo-600',
  DELIVERY_ARRIVAL: 'bg-green-100 text-green-600',
};

// Component
export function NotificationBell({ context }: { context?: 'business' | 'personal' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [permissionState, setPermissionState] = useState<string>('default');
  const lastNotifiedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);
  
  const queryParams = new URLSearchParams({
    limit: '10',
    minimal: 'true',
    unreadOnly: 'true',
  });
  if (context) queryParams.append('context', context);
  
  const swrKey = `/api/notifications?${queryParams.toString()}`;

  const { data, mutate, isLoading } = useSWR(
    swrKey,
    fetcher,
    { refreshInterval: 10000 }
  );

  const notifications = useMemo(() => data?.notifications || [], [data?.notifications]);
  const unreadCount = useMemo(() => data?.unreadCount || 0, [data?.unreadCount]);

  // Browser Notification Logic (Alerts only, prompt is global)
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Trigger browser notification for new alerts
    if (permissionState === 'granted' && notifications.length > 0) {
      if (lastNotifiedIdRef.current) {
        // Find all notifications that arrived after the one we last alerted
        const lastIdx = notifications.findIndex((n: Notification) => n.id === lastNotifiedIdRef.current);
        
        // If the last notified ID isn't in the list (too old), we just look at what's new
        // Otherwise, everything from 0 to lastIdx-1 is "new"
        const newCount = lastIdx === -1 ? Math.min(notifications.length, 3) : lastIdx;
        
        // Notify for each new one (up to 3 at once to avoid spam)
        for (let i = newCount - 1; i >= 0; i--) {
          const item = notifications[i];
          new window.Notification(item.title, {
            body: item.message,
            icon: '/navlogo.png',
          });
        }
      }
      lastNotifiedIdRef.current = notifications[0].id;
    } else if (notifications.length > 0) {
      lastNotifiedIdRef.current = notifications[0].id;
    }
  }, [notifications, permissionState]);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    
    const permission = await window.Notification.requestPermission();
    setPermissionState(permission);

    if (permission === 'granted') {
      new window.Notification('TrendiZip Alerts Enabled', {
        body: 'You will now receive desktop notifications for new activity.',
        icon: '/navlogo.png',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      if (res.ok) {
        mutate({
          ...data,
          notifications: notifications.map((n: Notification) => ({ ...n, isRead: true })),
          unreadCount: 0
        }, false);
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      if (res.ok) {
        mutate({
          ...data,
          notifications: notifications.map((n: Notification) => 
            (n.id === notificationId ? { ...n, isRead: true } : n)
          ),
          unreadCount: Math.max(0, unreadCount - 1)
        }, false);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) mutate();
        }}
        className="relative hover:text-red-900 text-stone-400 transition-colors p-1"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-stone-950 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#FAFAF9]"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-stone-100 overflow-hidden z-50"
            >
              <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-bold text-stone-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-[12px] text-stone-500 font-medium">{unreadCount} unread items</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck size={14} />
                      Mark all read
                    </button>
                  )}
                  {permissionState !== 'granted' && (
                    <button
                      onClick={requestPermission}
                      className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1 ml-2"
                    >
                      Enable Desktop Alerts
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-stone-50 rounded-full transition-colors ml-1"
                  >
                    <X size={17} strokeWidth={1.5} className="text-stone-400" />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {isLoading && notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-stone-500 mt-3">Loading...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {notifications.map((notification: Notification) => {
                      const Icon = notificationIcons[notification.type] || Bell;
                      const colorClass = notificationColors[notification.type] || 'bg-stone-100 text-stone-600';
                      return (
                        <button
                          key={notification.id}
                          onClick={() => {
                            if (!notification.isRead) markAsRead(notification.id);
                            if (notification.type === 'MESSAGE_RECEIVED') {
                              window.location.href = '/messages';
                              setIsOpen(false);
                            }
                          }}
                          className={cn(
                            "w-full px-4 py-3 text-left hover:bg-stone-50 transition-colors flex items-start gap-3",
                            !notification.isRead && "bg-blue-50/50"
                          )}
                        >
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", colorClass)}>
                            <Icon size={18} strokeWidth={1.25} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-[14px] line-clamp-1 leading-tight", !notification.isRead ? "font-bold text-stone-950" : "font-medium text-stone-700")}>
                                {notification.title}
                            </p>
                            <p className="text-[13px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                              {notification.message}
                            </p>
                            <p className="text-[11px] font-medium text-stone-400 mt-1.5 uppercase tracking-wider">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
