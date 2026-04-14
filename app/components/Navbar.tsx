'use client';
import React, { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import dynamic from "next/dynamic";
import { NotificationBell } from "@/components/ui/notification-bell";
import { Search, User, LogOut, Package, Heart, Settings, Menu, Calendar, MessageSquare, X, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import useSWR, { useSWRConfig } from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { SearchOverlay } from "@/components/ui/search-overlay";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const CartSheetTrigger = dynamic(() => import("@/components/ui/cart-sheet-trigger").then(mod => ({ default: mod.CartSheetTrigger })), {
  ssr: false,
  loading: () => <div className="h-6 w-6" />
});

type UserType = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  profileImage?: string | null;
};

type NavbarProps = {
  role: Role;
  user: UserType | null;
  profileSlug?: string;
};

function Navbar({ role, user, profileSlug }: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search on Cmd+K or / (if not in an input)
      if (((e.metaKey || e.ctrlKey) && e.key === "k") || (e.key === "/" && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA')) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { mutate } = useSWRConfig();
  const { data: batchData } = useSWR(
    user ? `/api/batch` : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  const [clearedCategories, setClearedCategories] = useState<Set<string>>(new Set());

  const notifications = batchData?.notifications?.unread || [];
  const unreadMessagesCount = batchData?.notifications?.unreadMessagesCount || 0;
  const unreadCount = notifications.length + unreadMessagesCount;

  const CATEGORY_TYPES: Record<string, string[]> = {
    'Messages': ['MESSAGE_RECEIVED'],
    'Orders': ['ORDER_UPDATE', 'SHIPPING_UPDATE', 'DELIVERY_ARRIVAL'],
    'Bookings': ['BOOKING_CONFIRMATION', 'BOOKING_UPDATE'],
    'Dashboard': [
      'PAYMENT_RECEIVED', 'PAYMENT_RELEASED', 'REVIEW_RECEIVED',
      'DELIVERY_CONFIRMATION_REQUEST', 'STOCK_ALERT'
    ]
  };

  const hasUnreadCategory = (label: string) => {
    if (clearedCategories.has(label)) return false;
    if (label === 'Messages') return unreadMessagesCount > 0;
    const types = CATEGORY_TYPES[label] || [];
    return notifications.some((n: { type: string }) => types.includes(n.type));
  };

  const handleCategoryClick = async (label: string) => {
    setClearedCategories(prev => new Set(prev).add(label));
    try {
      if (label === 'Messages') {
        await fetch('/api/conversations', { method: 'PATCH' });
      }
      const types = CATEGORY_TYPES[label];
      if (types && types.length > 0) {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ types })
        });
      }
      mutate('/api/batch');
    } catch (err) {
      console.error('Failed to persist notification clearance:', err);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  const getProfileUrl = (): string => {
    if (profileSlug) return `/tz/${profileSlug}`;
    return '/profile';
  };

  const navLinks = [
    { href: "/fashion-trends", label: "Fashion Trends", sub: "Visual Inspirations" },
    { href: "/tailors-designers", label: "Tailors & Designers", sub: "Craftsmanship & Artistry" },
    { href: "/shopping", label: "Shopping", sub: "The Curated Collection" },
    { href: "/blog", label: "Blog", sub: "Editorial & News" },
  ];

  return (
    <>
      <div
        className={cn(
          "fixed w-full top-0 z-50 transition-all duration-700 ease-in-out border-b",
          scrolled
            ? 'bg-[#FAFAF9]/95 backdrop-blur-xl border-stone-200/60 shadow-sm py-2'
            : 'bg-transparent border-transparent py-4'
        )}
      >
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex items-center justify-between relative h-12 md:h-16">

          {/* --- MOBILE: LEFT ACTION (Menu Trigger) --- */}
          <div className="md:hidden flex-1 flex items-center">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-stone-900 transition-all hover:text-stone-500 active:scale-90"
              aria-label="Open Menu"
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>
          </div>

          {/* --- LOGO: LEFT ON DESKTOP --- */}
          <div className="hidden md:flex flex-1 items-center">
            <Link href="/" className="group block">
              <Image
                src="/navlogo.png"
                alt="TrendiZip"
                width={50}
                height={50}
                className={cn(
                  "transition-all duration-500 group-hover:scale-110 object-contain w-auto",
                  scrolled ? "h-10" : "h-12 md:h-16"
                )}
              />
            </Link>
          </div>

          {/* --- LOGO: CENTER ON MOBILE --- */}
          <div className="md:hidden absolute left-1/2 -translate-x-1/2 transition-all duration-700 z-10">
            <Link href="/" className="group block">
              <Image
                src="/navlogo.png"
                alt="TrendiZip"
                width={50}
                height={50}
                className="transition-all duration-500 group-hover:scale-110 object-contain w-auto h-12"
              />
            </Link>
          </div>

          {/* --- DESKTOP: CENTER NAVIGATION LINKS --- */}
          <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className={cn(
                  "group relative text-[13px] font-medium tracking-wide transition-all duration-500",
                  isActive(link.href) ? "text-stone-950" : "text-stone-500 hover:text-stone-900"
                )}
              >
                <span className="relative z-10">{link.label}</span>

                {/* Active Underline */}
                {isActive(link.href) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1.5 left-0 w-full h-[1.5px] bg-stone-950"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Hover Underline (Subtle) */}
                {!isActive(link.href) && (
                  <span className="absolute -bottom-1.5 left-0 w-full h-[1.5px] bg-stone-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ease-out" />
                )}
              </Link>
            ))}
          </nav>

          {/* --- RIGHT: ACTIONS (Icon Group) --- */}
          <div className="flex-1 flex justify-end items-center gap-1 md:gap-4">
            <div className="flex items-center gap-1.5 md:gap-3 bg-stone-100/50 md:bg-transparent backdrop-blur-sm md:backdrop-blur-0 px-2 md:px-0 py-1 md:py-0 rounded-full border border-stone-200/50 md:border-0 ml-auto">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-stone-600 hover:text-stone-950 transition-colors rounded-full hover:bg-stone-100/50 md:hover:bg-stone-100"
                aria-label="Search"
              >
                <Search size={20} strokeWidth={1.5} />
              </button>

              {user ? (
                <>
                  <NotificationBell context="personal" />
                  <CartSheetTrigger />
                </>
              ) : (
                <div className="hidden md:flex items-center gap-4">
                  <NotificationBell context="personal" />
                  <CartSheetTrigger />
                </div>
              )}

              {/* User Access Point */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center group outline-none">
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden ring-1 ring-stone-200 group-hover:ring-2 group-hover:ring-stone-400 transition-all duration-300">
                        <Image
                          src={user.profileImage || user.image || "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg"}
                          alt="User"
                          width={36}
                          height={36}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {unreadCount > 0 && !Array.from(clearedCategories).some(c => hasUnreadCategory(c)) && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-stone-950 border-2 border-white rounded-full z-10"
                        />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={12}
                    className="w-64 p-2 bg-white/95 backdrop-blur-xl border-stone-200 shadow-2xl rounded-2xl overflow-hidden"
                  >
                    <div className="px-4 py-3 mb-2 bg-stone-50/50 rounded-xl">
                      <p className="text-[13px] font-semibold text-stone-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="space-y-1">
                      {[
                        { icon: User, label: 'Profile', href: getProfileUrl() },
                        { icon: MessageSquare, label: 'Messages', href: '/messages' },
                        { icon: Package, label: 'Orders', href: '/orders' },
                        { icon: Calendar, label: 'Bookings', href: '/bookings' },
                      ].map((item, idx) => (
                        <DropdownMenuItem key={idx} asChild className="cursor-pointer focus:bg-stone-50 rounded-lg">
                          <Link href={item.href} onClick={() => handleCategoryClick(item.label)} className="flex items-center justify-between w-full px-3 py-2 text-stone-600 hover:text-stone-950 transition-colors">
                            <div className="flex items-center gap-3">
                              <item.icon size={17} strokeWidth={1.25} />
                              <span className="text-[13px]">{item.label}</span>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      {(role === "PROFESSIONAL" || role === "SUPER_ADMIN" || role === "ADMIN") && (
                        <div className="pt-2 mt-2 border-t border-stone-100">
                          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-stone-900 font-medium rounded-lg hover:bg-stone-50 transition-colors">
                            <Settings size={17} strokeWidth={1.25} />
                            <span className="text-[13px]">Dashboard</span>
                          </Link>
                        </div>
                      )}
                      <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2 text-red-600 font-medium rounded-lg hover:bg-red-50/50 transition-colors mt-1">
                        <LogOut size={17} strokeWidth={1.25} />
                        <span className="text-[13px]">Sign Out</span>
                      </button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center">
                  <button
                    onClick={() => window.location.href = '/auth/signin'}
                    className="flex lg:hidden items-center justify-center w-9 h-9 bg-stone-900 rounded-full text-white shadow-lg shadow-stone-200/50 hover:bg-stone-800 transition-all active:scale-95 ml-2"
                  >
                    <User size={16} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => window.location.href = '/auth/signin'}
                    className="hidden lg:block text-[13px] font-medium text-stone-600 hover:text-stone-950 px-4 py-2 transition-colors"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Canvas Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0.5, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[100] bg-[#FAFAF9]/98 backdrop-blur-3xl md:hidden overflow-hidden flex flex-col"
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-stone-100">
              <Image src="/navlogo.png" alt="TrendiZip" width={40} height={40} className="opacity-50" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-100 text-stone-900 active:scale-95 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Canvas Navigation */}
            <div className="flex-1 overflow-y-auto px-6 py-12 flex flex-col gap-12">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-8 px-4">Navigation</p>
                <div className="space-y-6">
                  {navLinks.map((link, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "block group",
                          idx % 2 === 0 ? "text-left pl-4" : "text-right pr-4"
                        )}
                      >
                        <p className={cn(
                          "text-4xl font-light tracking-tighter leading-none mb-1 transition-all group-hover:pl-2 duration-300",
                          isActive(link.href) ? "text-stone-950 font-normal underline underline-offset-8" : "text-stone-400 group-hover:text-stone-600"
                        )}>
                          {link.label}
                        </p>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-300">{link.sub}</p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="mt-auto grid grid-cols-2 gap-3 pb-8">
                <button
                  onClick={() => { setIsSearchOpen(true); setMobileMenuOpen(false); }}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-stone-100 rounded-3xl hover:border-stone-200 transition-all hover:shadow-sm"
                >
                  <Search size={22} className="text-stone-500 mb-2" strokeWidth={1.5} />
                  <span className="text-[11px] font-bold uppercase tracking-tighter">Search</span>
                </button>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-stone-100 rounded-3xl hover:border-stone-200 transition-all hover:shadow-sm"
                >
                  <ShoppingBag size={22} className="text-stone-500 mb-2" strokeWidth={1.5} />
                  <span className="text-[11px] font-bold uppercase tracking-tighter">My Bag</span>
                </button>
              </div>
            </div>

            {/* Auth Footer */}
            <div className="p-6 bg-stone-50/50 border-t border-stone-100 mb-safe">
              {user ? (
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-200" />
                    <div>
                      <p className="text-[13px] font-bold text-stone-950">{user.name || 'User'}</p>
                      <p className="text-[11px] text-stone-500 uppercase tracking-tighter">Verified Member</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setMobileMenuOpen(false); signOut(); }}
                    className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => window.location.href = '/auth/signin?mode=signin'} className="py-4 text-[11px] font-bold uppercase tracking-widest text-stone-900 border border-stone-200 bg-white rounded-2xl active:scale-95 transition-all">
                    Login
                  </button>
                  <button onClick={() => window.location.href = '/auth/signin?mode=signup'} className="py-4 text-[11px] font-bold uppercase tracking-widest text-white bg-stone-950 rounded-2xl active:scale-95 transition-all shadow-xl shadow-stone-200">
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

export default Navbar;