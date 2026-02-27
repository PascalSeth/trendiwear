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
  LogOut,
  Home,
  Briefcase,
  Layers,
  FileText,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Role } from '@prisma/client';
import { cn } from '@/lib/utils';

type DashboardSidebarProps = {
  role: Role;
};

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavItem[];
  roles?: Role[];
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ role }) => {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Catalogue', 'Management']);

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
        label: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
    ];

    if (isProfessional(role)) {
      return [
        ...baseItems,
        {
          label: 'Products',
          href: '/dashboard/catalogue/products',
          icon: <Package className="h-5 w-5" />,
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
          label: 'Analytics',
          href: '/dashboard/analytics',
          icon: <BarChart3 className="h-5 w-5" />,
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
              'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              active
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
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
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          active
            ? 'bg-indigo-100 text-indigo-700 shadow-sm'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          depth > 0 && 'text-sm'
        )}
      >
        {item.icon}
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/navlogo.png"
            alt="TrendiWear"
            width={40}
            height={40}
            className="w-10 h-10"
          />
          <div>
            <h1 className="text-lg font-bold text-gray-900">TrendiWear</h1>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        {navItems.map((item) => renderNavItem(item))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-gray-100 px-4 py-4 space-y-1.5">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            isActive('/dashboard/settings')
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
        >
          <Home className="h-5 w-5" />
          <span>Back to Store</span>
        </Link>
        <Link
          href="/auth/signout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </Link>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
