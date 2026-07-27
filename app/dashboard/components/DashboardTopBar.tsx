'use client';

import { 
  Search, User, Menu, PanelLeftClose, PanelLeftOpen, 
  Command, ChevronRight, Settings, LogOut 
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { NotificationBell } from '@/components/ui/notification-bell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';
import { GlobalSearchModal } from './GlobalSearchModal';
import type { UserInfo } from './ServerDashboardShell';

interface DashboardTopBarProps {
  onMenuClick?: () => void;
  onDesktopToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  userInfo: UserInfo;
}

const DashboardTopBar: React.FC<DashboardTopBarProps> = ({
  onMenuClick,
  onDesktopToggleSidebar,
  isSidebarCollapsed = false,
  userInfo,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Determine display name, image, and role badge
  const displayName = userInfo.businessName || userInfo.name;
  const displayImage = userInfo.businessImage || userInfo.image;
  const roleLabel = userInfo.role === 'PROFESSIONAL' ? 'Seller' : 
                    userInfo.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                    userInfo.role === 'ADMIN' ? 'Admin' : 'Dashboard';

  // Compute active page title for header breadcrumb
  const getPageTitle = (path: string) => {
    if (path === '/dashboard') return 'Overview';
    if (path.includes('/ai/visual-studio') || path.includes('/ai-studio')) return 'Visual Fashion Studio';
    if (path.includes('/ai/market-research')) return 'Market & Trend Research';
    if (path.includes('/ai/pricing-strategist')) return 'Pricing & Profit Strategist';
    if (path.includes('/ai/copywriter')) return 'Product Copywriter';
    if (path.includes('/ai/launch-planner')) return 'Collection Launch Planner';
    if (path.includes('/outfit-inspirations')) return 'Outfit Inspirations';
    if (path.includes('/events')) return 'Events & Categories';
    if (path.includes('/analytics')) return 'Analytics';
    if (path.includes('/catalogue/products')) return 'Products';
    if (path.includes('/catalogue/category')) return 'Categories';
    if (path.includes('/catalogue/collections')) return 'Collections';
    if (path.includes('/orders')) return 'Orders';
    if (path.includes('/bookings')) return 'Bookings';
    if (path.includes('/services')) return 'Services';
    if (path.includes('/customers')) return 'Customers';
    if (path.includes('/professionals')) return 'Professionals';
    if (path.includes('/riders')) return 'Riders';
    if (path.includes('/showcase')) return 'Showcase';
    if (path.includes('/settings')) return 'Settings';
    
    const parts = path.split('/').filter(Boolean);
    if (parts.length > 1) {
      const last = parts[parts.length - 1];
      return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
    }
    return 'Dashboard';
  };

  const pageTitle = getPageTitle(pathname || '');

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-xl transition-all duration-300 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
        <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
          
          {/* LEFT SECTION: Sidebar Toggles & Breadcrumb Location */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={onMenuClick}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 lg:hidden"
              aria-label="Toggle Menu"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={onDesktopToggleSidebar}
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs transition-all hover:bg-slate-50 hover:text-indigo-600 active:scale-95 lg:flex"
              aria-label={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-4.5 w-4.5" />
              ) : (
                <PanelLeftClose className="h-4.5 w-4.5" />
              )}
            </button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Breadcrumb Context Badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="font-medium text-slate-400">Dashboard</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <span className="font-bold text-slate-900 tracking-tight">{pageTitle}</span>
            </div>
          </div>

          {/* MIDDLE SECTION: Interactive Command Bar Search Trigger */}
          <div className="hidden max-w-md flex-1 md:flex">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="group relative w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 py-2 px-3.5 text-xs font-medium text-slate-400 shadow-2xs transition-all hover:border-indigo-300 hover:bg-white hover:shadow-xs text-left"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
                  Search products, orders, or tools...
                </span>
              </div>
              <div className="flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 shadow-2xs">
                {isMac ? <Command className="h-2.5 w-2.5" /> : <span className="text-[9px]">Ctrl</span>}
                <span>K</span>
              </div>
            </button>
          </div>

          {/* RIGHT SECTION: Subscription, Notifications & User Capsule */}
          <div className="ml-auto flex items-center gap-3">
            
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:bg-slate-50 hover:text-indigo-600 md:hidden"
              aria-label="Search"
            >
              <Search className="h-4.5 w-4.5" />
            </button>

            {/* Subscription Status Badge */}
            <SubscriptionStatusBadge role={userInfo.role} />

            {/* Notifications Bell */}
            <div className="relative">
              <NotificationBell context="business" />
            </div>

            <div className="h-4 w-px bg-slate-200" />

            {/* Profile Dropdown Capsule */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-1 pr-3 text-left shadow-2xs transition-all hover:border-indigo-200 hover:bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-indigo-100">
                  <div className="relative shrink-0">
                    {displayImage ? (
                      <Image
                        src={displayImage}
                        alt={displayName}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 ring-1 ring-indigo-100">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-emerald-500 shadow-2xs" />
                  </div>

                  <div className="hidden text-left sm:block">
                    <p className="max-w-[120px] truncate text-xs font-bold text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">
                      {displayName}
                    </p>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-tight block mt-0.5">
                      {roleLabel}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56 border-slate-200 bg-white p-1.5 text-slate-900 shadow-xl rounded-xl">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="truncate text-xs font-bold text-slate-900">{displayName}</p>
                  <p className="truncate text-[11px] font-medium text-slate-400">{userInfo.email}</p>
                </div>
                <div className="py-1">
                  <DropdownMenuItem asChild className="rounded-lg text-xs font-medium cursor-pointer">
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-400" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg text-xs font-medium cursor-pointer">
                    <Link href="/dashboard/settings" className="flex items-center gap-2">
                      <Settings className="h-3.5 w-3.5 text-slate-400" /> Settings
                    </Link>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem asChild className="rounded-lg text-xs font-medium text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer">
                  <Link href="/auth/signout" className="flex items-center gap-2">
                    <LogOut className="h-3.5 w-3.5 text-rose-500" /> Sign Out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </header>

      {/* GLOBAL COMMAND PALETTE MODAL */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        isMac={isMac}
      />
    </>
  );
};

export default DashboardTopBar;
