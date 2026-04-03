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
  Sparkles,
  ChevronDown,
  ChevronRight,
  Home,
  Briefcase,
  Layers,
  FileText,
  CreditCard,
  Truck,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Role } from '@prisma/client';
import { cn } from '@/lib/utils';
import useSWR from 'swr';
import { motion } from 'framer-motion';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type DashboardSidebarProps = {
  role: Role;
  collapsed?: boolean;
};

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavItem[];
  roles?: Role[];
  badgeType?: 'orders' | 'bookings' | 'messages';
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ role, collapsed = false }) => {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Catalogue', 'Management']);

  const { data: notificationsData } = useSWR('/api/notifications?limit=100', fetcher, { refreshInterval: 10000 });
  const unreadNotifications = notificationsData?.notifications || [];

  const hasUnread = (type: 'orders' | 'bookings' | 'messages') => {
    const orderTypes = ['ORDER_UPDATE', 'SHIPPING_UPDATE', 'DELIVERY_ARRIVAL', 'NEW_ORDER', 'DELIVERY_CONFIRMATION_REQUEST'];
    const bookingTypes = ['BOOKING_CONFIRMATION', 'BOOKING_UPDATE', 'NEW_BOOKING'];
    
    if (type === 'orders') return unreadNotifications.some((n: { isRead: boolean; type: string }) => !n.isRead && orderTypes.includes(n.type));
    if (type === 'bookings') return unreadNotifications.some((n: { isRead: boolean; type: string }) => !n.isRead && bookingTypes.includes(n.type));
    return false;
  };

  const isActive = (path: string) => pathname === path;
  const isParentActive = (children: NavItem[]) =>
    children.some((child) => child.href && pathname.startsWith(child.href));

  const isSuperAdmin = (userRole: Role) => userRole === 'SUPER_ADMIN';
  const isProfessional = (userRole: Role) => userRole === 'PROFESSIONAL';

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  // Navigation items based on role
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        label: 'Overview',
        href: '/dashboard',
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
    ];

    if (isProfessional(role)) {
      return [
        ...baseItems,
        {
          label: 'Catalogue',
          icon: <Layers className="h-5 w-5" />,
          children: [
            {
              label: 'Products',
              href: '/dashboard/catalogue/products',
              icon: <Package className="h-4 w-4" />,
            },
            {
              label: 'Services',
              href: '/dashboard/services',
              icon: <Briefcase className="h-4 w-4" />,
            },
          ],
        },
        {
          label: 'Orders',
          href: '/dashboard/orders',
          icon: <ShoppingCart className="h-5 w-5" />,
          badgeType: 'orders',
        },
        {
          label: 'Analytics',
          href: '/dashboard/analytics',
          icon: <BarChart3 className="h-5 w-5" />,
        },
        {
          label: 'Riders',
          href: '/dashboard/riders',
          icon: <Truck className="h-5 w-5" />,
        },
        {
          label: 'Bookings',
          href: '/dashboard/bookings',
          icon: <Calendar className="h-5 w-5" />,
          badgeType: 'bookings',
        },
        {
          label: 'Showcase',
          href: '/dashboard/showcase',
          icon: <Star className="h-5 w-5" />,
        },
      ];
    }

    // Admin/SuperAdmin navigation
    const adminItems: NavItem[] = [
      ...baseItems,
      {
        label: 'Catalogue',
        icon: <Layers className="h-5 w-5" />,
        children: [
          {
            label: 'Categories',
            href: '/dashboard/catalogue/category',
            icon: <Warehouse className="h-4 w-4" />,
          },
          {
            label: 'Collections',
            href: '/dashboard/catalogue/collections',
            icon: <Layers className="h-4 w-4" />,
          },
          {
            label: 'Products',
            href: '/dashboard/catalogue/products',
            icon: <Shirt className="h-4 w-4" />,
          },
        ],
      },
      {
        label: 'Orders',
        href: '/dashboard/orders',
        icon: <ShoppingCart className="h-5 w-5" />,
      },
      {
        label: 'Services',
        href: '/dashboard/services',
        icon: <Briefcase className="h-5 w-5" />,
      },
      {
        label: 'Customers',
        href: '/dashboard/customers',
        icon: <Users className="h-5 w-5" />,
      },
      {
        label: 'Professionals',
        href: '/dashboard/professionals',
        icon: <Users className="h-5 w-5" />,
      },
      {
        label: 'Trends',
        icon: <TrendingUp className="h-5 w-5" />,
        children: [
          {
            label: 'Events',
            href: '/dashboard/trends/events',
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            label: 'Outfit Inspirations',
            href: '/dashboard/trends/outfit-inspirations',
            icon: <Sparkles className="h-4 w-4" />,
          },
        ],
      },
    ];

    // Add Management section for Super Admins
    if (isSuperAdmin(role)) {
      adminItems.push({
        label: 'Management',
        icon: <Settings className="h-5 w-5" />,
        children: [
          {
            label: 'Official Blog',
            href: '/dashboard/management/blogs',
            icon: <FileText className="h-4 w-4" />,
          },
          {
            label: 'Services',
            href: '/dashboard/management/services',
            icon: <Briefcase className="h-4 w-4" />,
          },
          {
            label: 'Subscriptions',
            href: '/dashboard/management/subscriptions',
            icon: <CreditCard className="h-4 w-4" />,
          },
          {
            label: 'Professional Types',
            href: '/dashboard/management/professional-types',
            icon: <Users className="h-4 w-4" />,
          },
          {
            label: 'Content Moderation',
            href: '/dashboard/management/content',
            icon: <Bell className="h-4 w-4" />,
          },
          {
            label: 'Showcase',
            href: '/dashboard/showcase',
            icon: <Star className="h-4 w-4" />,
          },
          {
            label: 'System Settings',
            href: '/dashboard/management/system',
            icon: <Settings className="h-4 w-4" />,
          },
        ],
      });
    }

    return adminItems;
  };

  const navItems = getNavItems();

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.label);
    const active = item.href ? isActive(item.href) : hasChildren && isParentActive(item.children!);

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleMenu(item.label)}
            className={cn(
              'w-full flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300',
              collapsed ? 'justify-center' : 'justify-between',
              active
                ? 'bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)]'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
            )}
          >
            <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
              <div className={cn(
                'p-1.5 rounded-lg transition-colors',
                active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              )}>
                {item.icon}
              </div>
              {!collapsed && (
                <div className="flex items-center gap-2">
                  <span className={cn(active ? 'font-bold' : 'font-medium')}>{item.label}</span>
                  {item.badgeType && hasUnread(item.badgeType) && (
                    <motion.div 
                      layoutId={`badge-${item.label}`}
                      className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
              )}
            </div>
            {!collapsed &&
              (isExpanded ? (
                <ChevronDown className={cn("h-4 w-4", active ? "text-white/70" : "text-slate-400")} />
              ) : (
                <ChevronRight className={cn("h-4 w-4", active ? "text-white/70" : "text-slate-400")} />
              ))}
          </button>
          {isExpanded && !collapsed && (
            <div className="ml-4 mt-2 space-y-1 border-l border-slate-200 pl-3">
              {item.children!.map((child) => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href!}
        className={cn(
          'flex items-center rounded-xl px-3 py-2.5 text-sm transition-all duration-300',
          collapsed ? 'justify-center' : 'gap-3',
          active
            ? 'bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)]'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent',
          depth > 0 && 'text-sm'
        )}
        title={collapsed ? item.label : undefined}
      >
        <div className={cn(
          'p-1.5 rounded-lg transition-colors relative',
          active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
        )}>
          {item.icon}
          {collapsed && item.badgeType && hasUnread(item.badgeType) && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm" />
          )}
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className={cn(active ? 'font-bold' : 'font-medium')}>{item.label}</span>
            {item.badgeType && hasUnread(item.badgeType) && (
              <motion.div 
                layoutId={`badge-${item.label}`}
                className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-200 bg-white/70 backdrop-blur-xl transition-all duration-500 shadow-2xl',
        collapsed ? 'w-24' : 'w-72'
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-50">
        {/* Sidebar Interior Light Effects */}
        <div className="absolute -top-20 -left-10 h-64 w-64 animate-blob rounded-full bg-violet-400/20 blur-[80px]" />
        <div className="absolute bottom-[10%] -right-20 h-80 w-80 animate-blob rounded-full bg-indigo-300/20 blur-[100px] [animation-delay:8s]" />
      </div>
      <div className="relative flex flex-col flex-1 min-h-0">
      {/* Logo Section */}
      <div className={cn('border-b border-slate-100 py-6 flex-shrink-0', collapsed ? 'px-3' : 'px-8')}>
        <Link href="/" className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-4')}>
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <Image
              src="/navlogo.png"
              alt="TrendiWear"
              width={48}
              height={48}
              className="relative h-12 w-12 rounded-xl ring-1 ring-white/50 shadow-xl transition-all duration-300 group-hover:scale-105"
            />
          </div>
          {!collapsed && (
            <div className="ml-1 flex flex-col justify-center">
              <span className="text-[14px] font-black tracking-tighter bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent uppercase">TrendiZip</span>
              <span className="text-[9px] font-bold text-slate-400 opacity-80 tracking-widest uppercase">Seller Hub</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={cn('scrollbar-hide flex-1 space-y-2 overflow-y-auto py-6 min-h-0', collapsed ? 'px-3' : 'px-5')}>
        {navItems.map((item) => renderNavItem(item))}
      </nav>

      {/* Bottom Section */}
      <div className={cn('space-y-2 border-t border-slate-100 py-6 flex-shrink-0', collapsed ? 'px-3' : 'px-5')}>
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center rounded-xl px-3 py-2.5 text-sm transition-all duration-300',
            collapsed ? 'justify-center gap-0' : 'gap-3',
            isActive('/dashboard/settings')
              ? 'bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <div className={cn(
            'p-1.5 rounded-lg',
            isActive('/dashboard/settings') ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
          )}>
            <Settings className="h-5 w-5" />
          </div>
          {!collapsed && <span className="font-medium">Settings</span>}
        </Link>
        <Link
          href="/"
          className={cn(
            'flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300',
            collapsed ? 'justify-center gap-0' : 'gap-3',
            'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/50 bg-slate-50/50'
          )}
          title={collapsed ? 'Back to Site' : undefined}
        >
          <div className="p-1.5 rounded-lg bg-white shadow-sm text-indigo-600">
            <Home className="h-5 w-5" />
          </div>
          {!collapsed && <span>Back to Site</span>}
        </Link>
      </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
