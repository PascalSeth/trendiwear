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
  Wand2,
  Bot,
  DollarSign,
  Rocket,
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
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Catalogue', 'Management', 'Trends', 'Trendi AI']);

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
          {
            label: 'Trendi AI',
            icon: Bot,
            children: [
              { label: 'Visual Fashion Studio', href: '/dashboard/ai/visual-studio', icon: Wand2 },
              { label: 'Market & Trend Research', href: '/dashboard/ai/market-research', icon: TrendingUp },
              { label: 'Pricing & Profit Strategist', href: '/dashboard/ai/pricing-strategist', icon: DollarSign },
              { label: 'Product Copywriter', href: '/dashboard/ai/copywriter', icon: FileText },
              { label: 'Collection Launch Planner', href: '/dashboard/ai/launch-planner', icon: Rocket },
            ],
          },
          { label: 'Outfit Inspirations', href: '/dashboard/trends/outfit-inspirations', icon: Compass },
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
          {
            label: 'Trendi AI',
            icon: Bot,
            children: [
              { label: 'Visual Fashion Studio', href: '/dashboard/ai/visual-studio', icon: Wand2 },
              { label: 'Market & Trend Research', href: '/dashboard/ai/market-research', icon: TrendingUp },
              { label: 'Pricing & Profit Strategist', href: '/dashboard/ai/pricing-strategist', icon: DollarSign },
              { label: 'Product Copywriter', href: '/dashboard/ai/copywriter', icon: FileText },
              { label: 'Collection Launch Planner', href: '/dashboard/ai/launch-planner', icon: Rocket },
            ],
          },
          { label: 'Outfit Inspirations', href: '/dashboard/trends/outfit-inspirations', icon: Compass },
        ]
      });

      groups.push({
        group: 'TRENDS & EVENTS',
        items: [
          {
            label: 'Events & Categories',
            href: '/dashboard/trends/events',
            icon: Calendar,
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
        'group flex items-center rounded-xl px-2.5 py-2 text-xs font-medium transition-all duration-300 relative',
        collapsed ? 'justify-center' : 'justify-between',
        active
          ? 'bg-indigo-600 text-white shadow-[0_6px_16px_-4px_rgba(79,70,229,0.35)] font-semibold'
          : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'
      )}>
        {/* Active Indicator */}
        {active && !collapsed && (
          <motion.div 
            layoutId="activeNav"
            className="absolute left-0 w-1 h-5 bg-white rounded-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}

        <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
          <item.icon className={cn(
            'h-4 w-4 transition-transform duration-300 group-hover:scale-110 shrink-0',
            active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
          )} />
          
          {!collapsed && (
            <div className="flex items-center gap-1.5 truncate">
              <span className="truncate">{item.label}</span>
              {item.badgeType && hasUnread(item.badgeType) && (
                <span className="flex h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
              )}
            </div>
          )}
        </div>

        {!collapsed && hasChildren && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className={cn("h-3.5 w-3.5 opacity-50 shrink-0", active ? "text-white" : "text-slate-400")} />
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
                className="overflow-hidden ml-3 border-l border-slate-100 pl-2 space-y-1"
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
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur-3xl transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* Logo Section */}
        <div className={cn('pt-5 pb-4 flex-shrink-0 border-b border-slate-100', collapsed ? 'px-2' : 'px-4')}>
          <Link href="/" className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-2.5')}>
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-lg blur-sm opacity-20 group-hover:opacity-40 transition-opacity" />
              <Image
                src="/navlogo.png"
                alt="Logo"
                width={32}
                height={32}
                className="relative h-8 w-8 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0 truncate">
                <span className="text-base font-black tracking-tighter text-slate-900 leading-none truncate">TrendiZip</span>
                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5 truncate">Seller Hub</span>
              </div>
            )}
          </Link>
        </div>

        {/* Unified Navigation List */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide px-2.5 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1.5">
              {!collapsed && (
                <h3 className="px-2.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {group.group}
                </h3>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => renderNavItem(item))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / User Anchored Section */}
        <div className={cn('p-3 border-t border-slate-100 flex-shrink-0 bg-slate-50/50', collapsed ? 'px-2' : 'px-3')}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-indigo-200 shrink-0">
                {role[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-900 truncate uppercase tracking-tight">{role}</p>
                <p className="text-[9px] font-medium text-slate-400 truncate flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </p>
              </div>
              <Link 
                href="/auth/signout"
                className="h-7 w-7 rounded-lg bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors flex items-center justify-center border border-slate-200 shadow-xs shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Link 
                href="/auth/signout"
                className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
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
