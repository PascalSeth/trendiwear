'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Package, Heart, ShoppingBag, DollarSign, Truck, Star, X, Check, CheckCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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
  NEW_INSPIRATION: Sparkles,
  PAYMENT_RECEIVED: DollarSign,
  REVIEW_RECEIVED: Star,
  PROMOTION: Sparkles,
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

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications?limit=10');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
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
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative hover:text-red-900 text-stone-400 transition-colors p-1"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-stone-100 overflow-hidden z-50"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-stone-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-stone-500">{unreadCount} unread</p>
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
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-stone-100 rounded-full transition-colors"
                  >
                    <X size={16} className="text-stone-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[400px] overflow-y-auto">
                {loading && notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-stone-500 mt-3">Loading...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-stone-400" />
                    </div>
                    <p className="text-sm font-medium text-stone-900">No notifications yet</p>
                    <p className="text-xs text-stone-500 mt-1">We&apos;ll notify you when something happens</p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {notifications.map((notification) => {
                      const Icon = notificationIcons[notification.type] || Bell;
                      const colorClass = notificationColors[notification.type] || 'bg-stone-100 text-stone-600';
                      
                      return (
                        <button
                          key={notification.id}
                          onClick={() => {
                            if (!notification.isRead) {
                              markAsRead(notification.id);
                            }
                          }}
                          className={cn(
                            "w-full px-4 py-3 text-left hover:bg-stone-50 transition-colors flex items-start gap-3",
                            !notification.isRead && "bg-blue-50/50"
                          )}
                        >
                          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", colorClass)}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn("text-sm line-clamp-1", !notification.isRead ? "font-semibold text-stone-900" : "text-stone-700")}>
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-stone-400 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-stone-100 bg-stone-50">
                  <a
                    href="/notifications"
                    className="block text-center text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    View all notifications
                  </a>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
