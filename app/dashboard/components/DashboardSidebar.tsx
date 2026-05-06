'use client';

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Shirt,
  Warehouse,
  Bell,
  Star,
  TrendingUp,
  Calendar,
  Compass,
  ChevronDown,
  ChevronRight,
  Home,
  Briefcase,
  Layers,
  FileText,
  CreditCard,
  Truck,
  LogOut,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Role } from '@prisma/client';
import { cn } from '@/lib/utils';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type DashboardSidebarProps = {
  role: Role;
  collapsed?: boolean;
  onToggle?: () => void;
};

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
  roles?: Role[];
  badgeType?: 'orders' | 'bookings' | 'messages';
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ role, onToggle, collapsed = false }) => {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Catalogue', 'Management', 'Trends']);

  const { data: notificationsData } = useSWR('/api/notifications?limit=100', fetcher, { refreshInterval: 10000 });
  const unreadNotifications = notificationsData?.notifications || [];

  const hasUnread = (type: 'orders' | 'bookings' | 'messages') => {
    const orderTypes = ['ORDER_UPDATE', 'SHIPPING_UPDATE', 'DELIVERY_ARRIVAL', 'NEW_ORDER', 'DELIVERY_CONFIRMATION_REQUEST'];
    const bookingTypes = ['BOOKING_CONFIRMATION', 'BOOKING_UPDATE', 'NEW_BOOKING'];
    
    interface Notification {
      isRead: boolean;
      type: string;
    }

    if (type === 'orders') return unreadNotifications.some((n: Notification) => !n.isRead && orderTypes.includes(n.type));
    if (type === 'bookings') return unreadNotifications.some((n: Notification) => !n.isRead && bookingTypes.includes(n.type));
    return false;
  };

  const isActive = (path: string) => pathname === path;
  const isParentActive = (children: NavItem[]) =>
    children.some((child) => child.href && pathname.startsWith(child.href));

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const navGroups = useMemo((): NavGroup[] => {
    const groups: NavGroup[] = [];
    
    // 1. MAIN Group
    const mainItems: NavItem[] = [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    ];
    groups.push({ group: 'MAIN', items: mainItems });

    // 2. COMMERCE Group
    if (role === 'PROFESSIONAL') {
      groups.push({
        group: 'COMMERCE',
        items: [
          {
            label: 'Catalogue',
            icon: Layers,
            children: [
              { label: 'Products', href: '/dashboard/catalogue/products', icon: Package },
              { label: 'Services', href: '/dashboard/services', icon: Briefcase },
            ],
          },
          { label: 'Orders', href: '/dashboard/orders', icon: ShoppingCart, badgeType: 'orders' },
          { label: 'Bookings', href: '/dashboard/bookings', icon: Calendar, badgeType: 'bookings' },
          { label: 'Riders', href: '/dashboard/riders', icon: Truck },
          { label: 'Showcase', href: '/dashboard/showcase', icon: Star },
        ]
      });
    }

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      groups.push({
        group: 'COMMERCE',
        items: [
          {
            label: 'Catalogue',
            icon: Layers,
            children: [
              { label: 'Categories', href: '/dashboard/catalogue/category', icon: Warehouse },
              { label: 'Collections', href: '/dashboard/catalogue/collections', icon: Layers },
              { label: 'Products', href: '/dashboard/catalogue/products', icon: Shirt },
            ],
          },
          { label: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
          { label: 'Services', href: '/dashboard/services', icon: Briefcase },
          { label: 'Customers', href: '/dashboard/customers', icon: Users },
          { label: 'Professionals', href: '/dashboard/professionals', icon: Users },
        ]
      });

      groups.push({
        group: 'TRENDS',
        items: [
          {
            label: 'Trends',
            icon: TrendingUp,
            children: [
              { label: 'Events', href: '/dashboard/trends/events', icon: Calendar },
              { label: 'Outfit Inspirations', href: '/dashboard/trends/outfit-inspirations', icon: Compass },
            ],
          },
        ]
      });
    }

    // 3. MANAGEMENT Group (Super Admin)
    if (role === 'SUPER_ADMIN') {
      groups.push({
        group: 'MANAGEMENT',
        items: [
          {
            label: 'System',
            icon: Settings,
            children: [
              { label: 'Blogs', href: '/dashboard/management/blogs', icon: FileText },
              { label: 'Global Services', href: '/dashboard/management/services', icon: Briefcase },
              { label: 'Subscriptions', href: '/dashboard/management/subscriptions', icon: CreditCard },
              { label: 'Moderation', href: '/dashboard/management/content', icon: Bell },
              { label: 'Settings', href: '/dashboard/management/system', icon: Settings },
            ],
          },
        ]
      });
    }

    // 4. ACCOUNT Group (Common for all)
    groups.push({
      group: 'ACCOUNT',
      items: [
        { label: 'Settings', href: '/dashboard/settings', icon: Settings },
        { label: 'Back to Site', href: '/', icon: Home },
      ]
    });

    return groups;
  }, [role]);

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.label);
    const active = item.href ? isActive(item.href) : hasChildren && isParentActive(item.children!);

    const content = (
      <div className={cn(
        'group flex items-center rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-300 relative',
        collapsed ? 'justify-center' : 'justify-between',
        active
          ? 'bg-indigo-600 text-white shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)]'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      )}>
        {/* Active Indicator */}
        {active && !collapsed && (
          <motion.div 
            layoutId="activeNav"
            className="absolute left-0 w-1 h-6 bg-white rounded-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}

        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <item.icon className={cn(
            'h-5 w-5 transition-transform duration-300 group-hover:scale-110',
            active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
          )} />
          
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span>{item.label}</span>
              {item.badgeType && hasUnread(item.badgeType) && (
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </div>
          )}
        </div>

        {!collapsed && hasChildren && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className={cn("h-4 w-4 opacity-50", active ? "text-white" : "text-slate-400")} />
          </motion.div>
        )}
      </div>
    );

    if (hasChildren) {
      return (
        <div key={item.label} className="space-y-1">
          <button onClick={() => toggleMenu(item.label)} className="w-full">
            {content}
          </button>
          <AnimatePresence>
            {isExpanded && !collapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden ml-4 border-l border-slate-100 pl-2 space-y-1"
              >
                {item.children!.map((child) => renderNavItem(child, depth + 1))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <Link key={item.label} href={item.href!} className="block">
        {content}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-200 bg-white/70 backdrop-blur-3xl transition-all duration-500 ease-in-out',
        collapsed ? 'w-24' : 'w-72'
      )}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* Logo Section */}
        <div className={cn('pt-8 pb-6 flex-shrink-0 border-b border-slate-50', collapsed ? 'px-2' : 'px-8')}>
          <Link href="/" className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-4')}>
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              <Image
                src="/navlogo.png"
                alt="Logo"
                width={40}
                height={40}
                className="relative h-10 w-10 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-slate-900 leading-none">TrendiZip</span>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Seller Hub</span>
              </div>
            )}
          </Link>
        </div>

        {/* Unified Navigation List */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 lg:px-4 py-6 space-y-8">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-3">
              {!collapsed && (
                <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {group.group}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => renderNavItem(item))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / User Anchored Section */}
        <div className={cn('p-4 lg:p-6 border-t border-slate-100 flex-shrink-0 bg-slate-50/30', collapsed ? 'px-2' : 'px-6')}>
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-200">
                {role[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate uppercase tracking-tight">{role}</p>
                <p className="text-[10px] font-medium text-slate-400 truncate flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </p>
              </div>
              <Link 
                href="/auth/signout"
                className="h-8 w-8 rounded-xl bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors flex items-center justify-center border border-slate-200 shadow-sm"
              >
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Link 
                href="/auth/signout"
                className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Toggle Button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute -right-5 top-20 hidden lg:flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-xl border border-slate-200 transition-all hover:scale-110 hover:text-indigo-600 z-50 group"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      )}
    </aside>
  );
};

const ChevronLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

export default DashboardSidebar;
