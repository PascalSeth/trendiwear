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
import { Search, User, LogOut, Package, Settings, Menu, Calendar, MessageSquare, X, Plus, Layout, ArrowRight } from "lucide-react";
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
    { href: "/fashion-trends", label: "Fashion Trends", sub: "Visual Inspirations" },
    { href: "/tailors-designers", label: "Tailors & Designers", sub: "Craftsmanship & Artistry" },
    { href: "/shopping", label: "Shopping", sub: "The Curated Collection" },
    { href: "/blog", label: "Blog", sub: "Editorial & News" },
  ];

  return (
    <>
      <div className={cn(
        "fixed w-full top-0 z-50 transition-all duration-500 border-b",
        scrolled ? 'bg-white/90 backdrop-blur-xl border-stone-200/60 py-2' : 'bg-transparent border-transparent py-4'
      )}>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex items-center justify-between relative h-12 md:h-16">

          {/* --- LEFT: MENU + LOGO (The requested "joined" look) --- */}
          <div className="flex items-center gap-2 md:gap-0 flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-stone-900 transition-all active:scale-90"
              aria-label="Open Menu"
            >
              <Menu size={24} strokeWidth={1.5} />
            </button>
            <Link href="/" className="group block">
              <Image
                src="/navlogo.png"
                alt="TrendiZip"
                width={50}
                height={50}
                className={cn(
                  "transition-all duration-500 group-hover:scale-105 object-contain w-auto",
                  scrolled ? "h-9" : "h-11 md:h-16"
                )}
              />
            </Link>
          </div>

          {/* --- DESKTOP: CENTER NAVIGATION --- */}
          <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link, idx) => (
              <Link key={idx} href={link.href} className={cn(
                "group relative text-[13px] font-medium tracking-wide transition-all",
                isActive(link.href) ? "text-stone-950" : "text-stone-500 hover:text-stone-900"
              )}>
                <span>{link.label}</span>
                {isActive(link.href) && (
                  <motion.span layoutId="nav-underline" className="absolute -bottom-1.5 left-0 w-full h-[1.5px] bg-stone-950" />
                )}
              </Link>
            ))}
          </nav>

          {/* --- RIGHT: ACTIONS (Grouped) --- */}
          <div className="flex items-center justify-end flex-1 gap-1 md:gap-4">
            <div className="flex items-center gap-1 md:gap-3 px-2 py-1 rounded-full bg-stone-100/40 md:bg-transparent backdrop-blur-md md:backdrop-blur-0 border border-stone-200/30 md:border-0">
              <button onClick={() => setIsSearchOpen(true)} className="p-2 text-stone-600 hover:text-stone-950 transition-colors">
                <Search size={20} strokeWidth={1.5} />
              </button>
              <NotificationBell context="personal" />
              <CartSheetTrigger />

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative ml-1 outline-none group">
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden ring-1 ring-stone-200 group-hover:ring-stone-900 transition-all">
                        <Image
                          src={user.profileImage || user.image || "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg"}
                          alt="User" width={36} height={36} className="w-full h-full object-cover"
                        />
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-2 bg-white/95 backdrop-blur-xl border-stone-200 shadow-2xl rounded-2xl">
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
                          <Link href={item.href} onClick={() => handleCategoryClick(item.label)} className="flex items-center gap-3 px-3 py-2 text-stone-600">
                            <item.icon size={17} strokeWidth={1.25} />
                            <span className="text-[13px]">{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      ))}

                      {/* Customer Role logic */}
                      {role === "CUSTOMER" && (
                        <div className="pt-2 mt-2 border-t border-stone-100">
                          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">Professional Hub</p>
                          <DropdownMenuItem asChild className="cursor-pointer focus:bg-stone-50 rounded-lg mt-0.5">
                            <Link href="/register-as-professional" className="flex items-center gap-3 px-3 py-2 text-stone-600">
                              <Plus size={17} strokeWidth={1.25} />
                              <span className="text-[13px]">Become a Professional</span>
                            </Link>
                          </DropdownMenuItem>
                        </div>
                      )}

                      {/* Management logic */}
                      {(role === "PROFESSIONAL" || role === "SUPER_ADMIN" || role === "ADMIN") && (
                        <div className="pt-2 mt-2 border-t border-stone-100">
                          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">Management</p>
                          <DropdownMenuItem asChild className="cursor-pointer focus:bg-stone-50 rounded-lg">
                            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-stone-900 font-medium">
                              <Settings size={17} strokeWidth={1.25} />
                              <span className="text-[13px]">Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                          {role === "PROFESSIONAL" && profileSlug && (
                            <DropdownMenuItem asChild className="cursor-pointer focus:bg-stone-50 rounded-lg">
                              <Link href={`/tz/${profileSlug}`} className="flex items-center gap-3 px-3 py-2 text-stone-600">
                                <Layout size={17} strokeWidth={1.25} />
                                <span className="text-[13px]">My Public Profile</span>
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </div>
                      )}
                      <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2 text-red-600 font-medium rounded-lg hover:bg-red-50/50 mt-1 transition-colors">
                        <LogOut size={17} strokeWidth={1.25} />
                        <span className="text-[13px]">Sign Out</span>
                      </button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => window.location.href = '/auth/signin'}
                  className="w-8 h-8 md:w-auto md:px-4 md:py-2 flex items-center justify-center bg-stone-950 text-white md:text-stone-900 md:bg-transparent rounded-full md:text-[13px] md:font-medium"
                >
                  <User size={16} className="md:hidden" />
                  <span className="hidden md:block">Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- CREATIVE MOBILE MENU OVERLAY --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white md:hidden overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-stone-50">
              <div className="flex items-center gap-3">
                <Image src="/navlogo.png" alt="Logo" width={32} height={32} />
                <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Navigation</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-100 text-stone-900 active:scale-95 transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-10 space-y-12">
              {/* Main Links */}
              <nav className="space-y-6">
                {navLinks.map((link, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}>
                    <Link href={link.href} onClick={() => setMobileMenuOpen(false)} className="group flex items-end justify-between border-b border-stone-100 pb-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300 mb-1">{link.sub}</p>
                        <p className={cn("text-3xl font-light tracking-tight", isActive(link.href) ? "text-stone-950 font-normal" : "text-stone-500")}>
                          {link.label}
                        </p>
                      </div>
                      <ArrowRight size={20} className="text-stone-200 group-hover:text-stone-950 transition-colors" />
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Dashboard & Pro Logic Section inside Mobile Menu */}
              <div className="space-y-6 pt-6">
                <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Your Hub</p>
                <div className="grid grid-cols-1 gap-3">
                  {user && (role === "PROFESSIONAL" || role === "SUPER_ADMIN" || role === "ADMIN") && (
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between p-4 bg-stone-950 text-white rounded-2xl shadow-xl shadow-stone-200">
                      <div className="flex items-center gap-3">
                        <Settings size={20} strokeWidth={1.5} />
                        <span className="font-medium text-sm">Open Dashboard</span>
                      </div>
                      <ArrowRight size={18} />
                    </Link>
                  )}
                  {user && role === "CUSTOMER" && (
                    <Link href="/register-as-professional" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                      <div className="flex items-center gap-3 text-stone-900">
                        <Plus size={20} strokeWidth={1.5} />
                        <span className="font-medium text-sm">Become a Professional</span>
                      </div>
                      <ArrowRight size={18} className="text-stone-400" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-stone-50/80 border-t border-stone-100">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Image src={user.profileImage || user.image || ""} alt="" width={44} height={44} className="rounded-full ring-2 ring-white" />
                    <div>
                      <p className="text-sm font-bold text-stone-900">{user.name}</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-widest">Verified Member</p>
                    </div>
                  </div>
                  <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="p-3 text-red-600 bg-red-50 rounded-full active:scale-90 transition-all">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => window.location.href = '/auth/signin'} className="py-4 text-[11px] font-bold uppercase tracking-widest text-stone-900 border border-stone-200 bg-white rounded-xl">Login</button>
                  <button onClick={() => window.location.href = '/auth/signin?mode=signup'} className="py-4 text-[11px] font-bold uppercase tracking-widest text-white bg-stone-950 rounded-xl">Sign Up</button>
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