'use client';

import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Calendar, 
  Menu, 
  Users,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Role } from '@prisma/client';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DashboardBottomNavProps {
  role: Role;
  onMenuClick: () => void;
}

const DashboardBottomNav: React.FC<DashboardBottomNavProps> = ({ role, onMenuClick }) => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const getNavItems = () => {
    const baseItems = [
      {
        label: 'Home',
        href: '/dashboard',
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
    ];

    if (role === Role.PROFESSIONAL) {
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
          label: 'Bookings',
          href: '/dashboard/bookings',
          icon: <Calendar className="h-5 w-5" />,
        },
      ];
    }

    return [
      ...baseItems,
      {
        label: 'Catalogue',
        href: '/dashboard/catalogue/products',
        icon: <Layers className="h-5 w-5" />,
      },
      {
        label: 'Orders',
        href: '/dashboard/orders',
        icon: <ShoppingCart className="h-5 w-5" />,
      },
      {
        label: 'Users',
        href: '/dashboard/customers', // Defaulting to customers for admins
        icon: <Users className="h-5 w-5" />,
      },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="relative">
        {/* Visual Background with Glassmorphism */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]" />
        
        {/* Navigation Items */}
        <div className="relative flex items-center justify-around h-20 px-2 pb-safe">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 min-w-[64px] transition-all duration-300",
                  active ? "text-violet-600" : "text-slate-400"
                )}
              >
                <div className={cn(
                  "relative p-2 rounded-2xl transition-all duration-500",
                  active ? "bg-violet-50 shadow-sm" : "hover:bg-slate-50"
                )}>
                  {active && (
                    <motion.div
                      layoutId="bottom-nav-indicator"
                      className="absolute inset-0 bg-violet-100/50 rounded-2xl -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {item.icon}
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  active ? "opacity-100" : "opacity-70"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* "More" Button to open Sidebar */}
          <button
            onClick={onMenuClick}
            className="flex flex-col items-center justify-center gap-1.5 min-w-[64px] text-slate-400 hover:text-slate-900 transition-all duration-300"
          >
            <div className="p-2 rounded-2xl hover:bg-slate-50">
              <Menu className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              More
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default DashboardBottomNav;
