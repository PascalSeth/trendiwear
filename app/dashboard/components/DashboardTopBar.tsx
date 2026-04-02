'use client';

import { Search, User, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { NotificationBell } from '@/components/ui/notification-bell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';
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
  const [searchQuery, setSearchQuery] = useState('');

  // Determine display name and image based on role
  const displayName = userInfo.businessName || userInfo.name;
  const displayImage = userInfo.businessImage || userInfo.image;
  const roleLabel = userInfo.role === 'PROFESSIONAL' ? 'Business' : 
                    userInfo.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                    userInfo.role === 'ADMIN' ? 'Admin' : 'Dashboard';

  return (
    <header className="sticky top-0 z-30 border-b border-white/20 bg-white/40 backdrop-blur-md transition-all duration-500">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Animated Accent for Header */}
        <div className="absolute -top-10 left-[20%] h-32 w-64 animate-blob rounded-full bg-violet-400/10 blur-[60px]" />
        <div className="absolute top-0 right-1/4 h-24 w-32 animate-pulse-slow rounded-full bg-cyan-300/10 blur-[40px] [animation-delay:4s]" />
      </div>
      <div className="relative flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/40 bg-white/30 text-slate-600 shadow-sm backdrop-blur-sm transition-all hover:bg-white/60 hover:text-slate-900 lg:hidden"
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-violet-400/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop Sidebar Toggle */}
        <button
          onClick={onDesktopToggleSidebar}
          className="group relative hidden h-10 w-10 items-center justify-center rounded-xl border border-white/40 bg-white/30 text-slate-600 shadow-sm backdrop-blur-sm transition-all hover:bg-white/60 hover:text-slate-900 lg:flex"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-violet-400/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>

        {/* Search Bar */}
        <div className="hidden max-w-xl flex-1 md:flex">
          <div className="group relative w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-violet-500" />
            <input
              type="text"
              placeholder="Search dashboard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/40 bg-white/30 py-2.5 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none backdrop-blur-sm transition-all focus:border-violet-300 focus:bg-white/60 focus:ring-2 focus:ring-violet-100"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="ml-auto flex items-center gap-4">
          {/* Subscription Status */}
          <SubscriptionStatusBadge role={userInfo.role} />

          {/* Notifications */}
          <NotificationBell context="business" />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-xl border border-white/40 bg-white/30 p-1.5 pr-4 shadow-sm backdrop-blur-sm transition-all hover:bg-white/60">
                <div className="relative">
                  {displayImage ? (
                    <Image
                      src={displayImage}
                      alt={displayName}
                      width={34}
                      height={34}
                      className="h-[34px] w-[34px] rounded-full object-cover ring-2 ring-white/60"
                    />
                  ) : (
                    <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-violet-100 ring-2 ring-white/60">
                      <User className="h-4.5 w-4.5 text-violet-600" />
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                </div>
                <div className="hidden text-left md:block">
                  <p className="max-w-[140px] truncate text-sm font-semibold text-slate-900 leading-tight">{displayName}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 opacity-80">{roleLabel}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-slate-200 bg-white text-slate-900 shadow-xl">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-900">{displayName}</p>
                <p className="truncate text-xs text-slate-500">{userInfo.email}</p>
              </div>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="w-full">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="w-full">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem asChild>
                <Link href="/auth/signout" className="w-full text-rose-600">Sign Out</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardTopBar;
