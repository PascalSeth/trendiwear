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
import { Search, User, LogOut, Package, Settings, Menu, Calendar, MessageSquare, X, Plus, ArrowRight } from "lucide-react";
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
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 15);
          ticking = false;
        });
        ticking = true;
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { mutate } = useSWRConfig();
  useSWR(user ? `/api/batch` : null, fetcher, { refreshInterval: 10000 });

  const CATEGORY_TYPES: Record<string, string[]> = {
    'Messages': ['MESSAGE_RECEIVED'],
    'Orders': ['ORDER_UPDATE', 'SHIPPING_UPDATE', 'DELIVERY_ARRIVAL'],
    'Bookings': ['BOOKING_CONFIRMATION', 'BOOKING_UPDATE'],
    'Dashboard': ['PAYMENT_RECEIVED', 'PAYMENT_RELEASED', 'REVIEW_RECEIVED', 'DELIVERY_CONFIRMATION_REQUEST', 'STOCK_ALERT']
  };

  const handleCategoryClick = async (label: string) => {
    try {
      if (label === 'Messages') await fetch('/api/conversations', { method: 'PATCH' });
      const types = CATEGORY_TYPES[label];
      if (types && types.length > 0) {
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
    { href: "/fashion-trends", label: "Fashion Trends" },
    { href: "/tailors-designers", label: "Tailors & Designers" },
    { href: "/shopping", label: "Shopping" },
    { href: "/blog", label: "Blog" },
  ];

  return (
    <>
      <header className={cn(
        "fixed w-full top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 py-1.5 md:py-2",
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs"
          : "bg-white/85 backdrop-blur-md border-b border-stone-200/40"
      )}>
        {/* Animated flowing stitch curves */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 60" fill="none" preserveAspectRatio="none">
            {/* Curve 1 — flows left to right, draws in and fades out */}
            <motion.path
              d="M-50 35 Q 150 8, 350 30 T 650 20 T 950 35 T 1250 25"
              stroke="currentColor"
              className="text-stone-950"
              strokeWidth="1.5"
              strokeDasharray="8 14"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 1, 0],
                opacity: [0, 0.12, 0.12, 0],
                pathOffset: [0, 0, 0.05, 0.1]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.4, 0.7, 1]
              }}
            />
            {/* Curve 2 — offset timing, opposite wave */}
            <motion.path
              d="M-50 20 Q 200 45, 400 22 T 700 38 T 1000 18 T 1250 32"
              stroke="currentColor"
              className="text-stone-950"
              strokeWidth="1.2"
              strokeDasharray="6 18"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 1, 0],
                opacity: [0, 0.08, 0.08, 0],
                pathOffset: [0.1, 0.05, 0, 0]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 5,
                times: [0, 0.35, 0.65, 1]
              }}
            />
          </svg>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between h-10 md:h-11 relative z-10">

          {/* --- LEFT: MENU + LOGO --- */}
          <div className="flex items-center gap-1.5 lg:flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 -ml-1.5 text-stone-900 transition-all active:scale-95"
              aria-label="Open Menu"
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
            <Link href="/" className="group block shrink-0">
              <Image
                src="/navlogo.png"
                alt="TrendiZip"
                width={36}
                height={36}
                priority
                className="transition-all duration-200 group-hover:opacity-80 object-contain w-auto h-7 md:h-8"
              />
            </Link>
          </div>

          {/* --- CENTER: NAVIGATION (Desktop Only) --- */}
          <nav className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link, idx) => (
              <Link key={idx} href={link.href} className={cn(
                "group relative text-[12.5px] font-medium tracking-tight transition-colors whitespace-nowrap",
                isActive(link.href) ? "text-stone-950" : "text-stone-500 hover:text-stone-900"
              )}>
                <span>{link.label}</span>
                {isActive(link.href) && (
                  <motion.span layoutId="nav-underline" className="absolute -bottom-0.5 left-0 w-full h-[1.5px] bg-stone-950" />
                )}
              </Link>
            ))}
          </nav>

          {/* --- RIGHT: ACTIONS (Consolidated) --- */}
          <div className="flex items-center justify-end lg:flex-1 gap-0.5 md:gap-1.5">
            <div className="flex items-center gap-0.5 md:gap-1">
              <button onClick={() => setIsSearchOpen(true)} className="p-1.5 text-stone-600 hover:text-stone-950 transition-colors">
                <Search size={18} strokeWidth={1.5} />
              </button>
              <NotificationBell context="personal" />
              <CartSheetTrigger />

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative ml-0.5 outline-none group flex items-center">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border border-stone-200 group-hover:border-stone-900 transition-all">
                        <Image
                          src={user.profileImage || user.image || "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg"}
                          alt="User" width={36} height={36} className="w-full h-full object-cover"
                        />
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 p-1.5 bg-white border-stone-200 shadow-xl rounded-xl">
                    <div className="px-3 py-2.5 mb-1 border-b border-stone-50">
                      <p className="text-xs font-semibold text-stone-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-stone-500 truncate">{user.email}</p>
                    </div>
                    <div className="space-y-0.5">
                      {[
                        { icon: User, label: 'Profile', href: getProfileUrl() },
                        { icon: MessageSquare, label: 'Messages', href: '/messages' },
                        { icon: Package, label: 'Orders', href: '/orders' },
                        { icon: Calendar, label: 'Bookings', href: '/bookings' },
                      ].map((item, idx) => (
                        <DropdownMenuItem key={idx} asChild className="cursor-pointer focus:bg-stone-50 rounded-md">
                          <Link href={item.href} onClick={() => handleCategoryClick(item.label)} className="flex items-center gap-2.5 px-2.5 py-2 text-stone-600">
                            <item.icon size={16} strokeWidth={1.5} />
                            <span className="text-sm">{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}

                      {role === "CUSTOMER" && (
                        <DropdownMenuItem asChild className="cursor-pointer focus:bg-stone-50 rounded-md">
                          <Link href="/register-as-professional" className="flex items-center gap-2.5 px-2.5 py-2 text-stone-600 border-t border-stone-50 mt-1">
                            <Plus size={16} strokeWidth={1.5} />
                            <span className="text-sm">Be a Professional</span>
                          </Link>
                        </DropdownMenuItem>
                      )}

                      {(role === "PROFESSIONAL" || role === "SUPER_ADMIN" || role === "ADMIN") && (
                        <DropdownMenuItem asChild className="cursor-pointer focus:bg-stone-50 rounded-md">
                          <Link href="/dashboard" className="flex items-center gap-2.5 px-2.5 py-2 text-stone-900 font-medium border-t border-stone-50 mt-1">
                            <Settings size={16} strokeWidth={1.5} />
                            <span className="text-sm">Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                      )}

                      <button onClick={() => signOut()} className="w-full flex items-center gap-2.5 px-2.5 py-2 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 transition-colors mt-1">
                        <LogOut size={16} strokeWidth={1.5} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => window.location.href = '/auth/signin'}
                  className="px-3.5 py-1.5 bg-stone-950 text-white text-[12px] font-medium rounded-full hover:bg-stone-800 transition-all"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* --- MOBILE/TABLET MENU OVERLAY --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="fixed inset-0 z-[100] bg-white lg:hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-stone-100">
              <Image src="/navlogo.png" alt="Logo" width={32} height={32} />
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full bg-stone-100 text-stone-900">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-10">
              <nav className="space-y-8">
                {navLinks.map((link, idx) => (
                  <Link
                    key={idx}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block group"
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("text-2xl font-light", isActive(link.href) ? "text-stone-950 font-normal" : "text-stone-600")}>
                        {link.label}
                      </span>
                      <ArrowRight size={18} className="text-stone-300" />
                    </div>
                  </Link>
                ))}
              </nav>

              <div className="mt-12 pt-8 border-t border-stone-100">
                {user && (role === "PROFESSIONAL" || role === "SUPER_ADMIN" || role === "ADMIN") && (
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between p-4 bg-stone-950 text-white rounded-xl">
                    <span className="font-medium">Go to Dashboard</span>
                    <ArrowRight size={18} />
                  </Link>
                )}
              </div>
            </div>

            <div className="p-8 border-t border-stone-100 bg-stone-50">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image src={user.profileImage || user.image || ""} alt="" width={40} height={40} className="rounded-full" />
                    <p className="text-sm font-bold text-stone-900">{user.name}</p>
                  </div>
                  <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="text-sm font-semibold text-red-600">
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => window.location.href = '/auth/signin'} className="py-3 text-sm font-bold border border-stone-200 rounded-lg">Login</button>
                  <button onClick={() => window.location.href = '/auth/signin?mode=signup'} className="py-3 text-sm font-bold bg-stone-950 text-white rounded-lg">Sign Up</button>
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