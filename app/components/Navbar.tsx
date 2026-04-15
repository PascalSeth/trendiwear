'use client';
import React, { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import dynamic from "next/dynamic";
import { NotificationBell } from "@/components/ui/notification-bell";
import { Search, User, LogOut, Package, Settings, Menu, Calendar, MessageSquare, X, ShoppingBag, Plus, Layout, ArrowRight } from "lucide-react";
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
  const { data: batchData } = useSWR(user ? `/api/batch` : null, fetcher, { refreshInterval: 10000 });

  const [clearedCategories, setClearedCategories] = useState<Set<string>>(new Set());
  const notifications = batchData?.notifications?.unread || [];
  const unreadMessagesCount = batchData?.notifications?.unreadMessagesCount || 0;
  const unreadCount = notifications.length + unreadMessagesCount;

  const CATEGORY_TYPES: Record<string, string[]> = {
    'Messages': ['MESSAGE_RECEIVED'],
    'Orders': ['ORDER_UPDATE', 'SHIPPING_UPDATE', 'DELIVERY_ARRIVAL'],
    'Bookings': ['BOOKING_CONFIRMATION', 'BOOKING_UPDATE'],
    'Dashboard': ['PAYMENT_RECEIVED', 'PAYMENT_RELEASED', 'REVIEW_RECEIVED', 'DELIVERY_CONFIRMATION_REQUEST', 'STOCK_ALERT']
  };

  const handleCategoryClick = async (label: string) => {
    setClearedCategories(prev => new Set(prev).add(label));
    try {
      if (label === 'Messages') await fetch('/api/conversations', { method: 'PATCH' });
      const types = CATEGORY_TYPES[label];
      if (types?.length > 0) {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ types })
        });
      }
      mutate('/api/batch');
    } catch (err) { console.error(err); }
  };

  const isActive = (path: string) => path === '/' ? pathname === '/' : pathname?.startsWith(path);
  const getProfileUrl = () => profileSlug ? `/tz/${profileSlug}` : '/profile';

  const navLinks = [
    { href: "/fashion-trends", label: "Fashion Trends", sub: "Visual Inspirations" },
    { href: "/tailors-designers", label: "Tailors & Designers", sub: "Craftsmanship & Artistry" },
    { href: "/shopping", label: "Shopping", sub: "The Curated Collection" },
    { href: "/blog", label: "Blog", sub: "Editorial & News" },
  ];

  return (
    <>
      <div className={cn(
        "fixed w-full top-0 z-50 transition-all duration-500 ease-in-out border-b",
        scrolled ? 'bg-white/80 backdrop-blur-xl border-stone-200/60 py-2' : 'bg-transparent border-transparent py-4'
      )}>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex items-center justify-between h-12 md:h-16">

          {/* --- LEFT SECTION: MENU + LOGO (JOINED) --- */}
          <div className="flex items-center gap-2 md:gap-8 flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-stone-900 transition-all active:scale-90"
            >
              <div className="flex flex-col gap-1 w-5">
                <span className="h-[1.5px] w-full bg-current" />
                <span className="h-[1.5px] w-[70%] bg-current" />
              </div>
            </button>

            <Link href="/" className="group flex items-center">
              <Image
                src="/navlogo.png"
                alt="Logo"
                width={50}
                height={50}
                className={cn(
                  "transition-all duration-500 group-hover:scale-105 object-contain w-auto",
                  scrolled ? "h-9 md:h-10" : "h-11 md:h-16"
                )}
              />
            </Link>
          </div>

          {/* --- DESKTOP: CENTER NAVIGATION --- */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link, idx) => (
              <Link key={idx} href={link.href} className={cn(
                "group relative text-[13px] font-medium tracking-tight transition-all",
                isActive(link.href) ? "text-stone-950" : "text-stone-500 hover:text-stone-950"
              )}>
                <span>{link.label}</span>
                {isActive(link.href) && (
                  <motion.span layoutId="nav-underline" className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-stone-950" />
                )}
              </Link>
            ))}
          </nav>

          {/* --- RIGHT SECTION: ACTIONS --- */}
          <div className="flex items-center justify-end flex-1 gap-1 md:gap-3">
            <div className={cn(
              "flex items-center gap-0.5 md:gap-2 px-1.5 py-1 rounded-full transition-all duration-500",
              scrolled ? "bg-stone-100/50 border border-stone-200/20" : "bg-white/10"
            )}>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-stone-600 hover:text-stone-950 transition-colors"
              >
                <Search size={19} strokeWidth={1.5} />
              </button>

              <NotificationBell context="personal" />
              <CartSheetTrigger />

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative ml-1 outline-none">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-200 ring-offset-2 ring-stone-950 transition-all hover:ring-1">
                        <Image
                          src={user.profileImage || user.image || "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg"}
                          alt="User"
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />}
                    </button>
                  </DropdownMenuTrigger>
                  {/* Dropdown Content - same logic as before */}
                  <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-stone-200">
                    {/* ... Existing Dropdown items ... */}
                    <div className="px-4 py-3 mb-2 bg-stone-50 rounded-xl">
                      <p className="text-[13px] font-semibold truncate">{user.name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                    </div>
                    <div className="space-y-0.5">
                      {[
                        { icon: User, label: 'Profile', href: getProfileUrl() },
                        { icon: MessageSquare, label: 'Messages', href: '/messages' },
                        { icon: Package, label: 'Orders', href: '/orders' },
                        { icon: Calendar, label: 'Bookings', href: '/bookings' },
                      ].map((item, idx) => (
                        <DropdownMenuItem key={idx} asChild className="rounded-lg">
                          <Link href={item.href} onClick={() => handleCategoryClick(item.label)} className="flex items-center gap-3 px-3 py-2 text-[13px] text-stone-600">
                            <item.icon size={16} strokeWidth={1.5} />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      <div className="h-px bg-stone-100 my-1" />
                      <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-red-600 font-medium">
                        <LogOut size={16} strokeWidth={1.5} /> Sign Out
                      </button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => window.location.href = '/auth/signin'}
                  className="ml-2 w-8 h-8 flex items-center justify-center bg-stone-950 text-white rounded-full hover:bg-stone-800 transition-all"
                >
                  <User size={14} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE OVERLAY (EDITORIAL STYLE) --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed inset-0 z-[100] bg-white md:hidden flex flex-col"
          >
            {/* Overlay Header */}
            <div className="flex items-center justify-between px-6 h-20 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Image src="/navlogo.png" alt="Logo" width={40} height={40} className="opacity-50" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Navigation</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-50 text-stone-900"
              >
                <X size={20} />
              </button>
            </div>

            {/* Links Section */}
            <div className="flex-1 overflow-y-auto px-8 py-10">
              <nav className="space-y-8">
                {navLinks.map((link, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="group block"
                    >
                      <div className="flex items-end justify-between border-b border-stone-100 pb-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-1">{link.sub}</p>
                          <p className="text-3xl font-light tracking-tight text-stone-900 group-active:translate-x-2 transition-transform">
                            {link.label}
                          </p>
                        </div>
                        <ArrowRight size={20} className="text-stone-300 group-active:text-stone-950 transition-colors" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Editorial Footer for Menu */}
              <div className="mt-16 grid grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 rounded-2xl">
                  <p className="text-[10px] font-bold text-stone-400 uppercase mb-2">Need help?</p>
                  <p className="text-xs text-stone-600 leading-relaxed">Browse our curated guides or contact support.</p>
                </div>
                <div className="p-4 bg-stone-950 rounded-2xl text-white">
                  <p className="text-[10px] font-bold text-stone-500 uppercase mb-2">Exclusive</p>
                  <p className="text-xs leading-relaxed">Join as a pro to list your designs.</p>
                </div>
              </div>
            </div>

            {/* Auth Action Footer */}
            <div className="p-6 bg-stone-50 border-t border-stone-100">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image src={user.image || '/avatar-placeholder.png'} alt="" width={40} height={40} className="rounded-full ring-2 ring-white shadow-sm" />
                    <div>
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-[10px] text-stone-500 uppercase tracking-tighter">View Account</p>
                    </div>
                  </div>
                  <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="px-4 py-2 text-xs font-bold uppercase border border-stone-200 rounded-full">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => window.location.href = '/auth/signin'} className="py-4 text-[11px] font-bold uppercase tracking-widest bg-white border border-stone-200 rounded-xl">
                    Login
                  </button>
                  <button onClick={() => window.location.href = '/auth/signin?mode=signup'} className="py-4 text-[11px] font-bold uppercase tracking-widest bg-stone-950 text-white rounded-xl shadow-lg shadow-stone-200">
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