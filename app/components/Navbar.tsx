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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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
        "fixed w-full top-0 z-50 transition-all duration-300",
        scrolled ? 'py-2' : 'py-4'
      )}>
        {/* --- BACKGROUND LAYERS --- */}
        <div className={cn(
          "absolute inset-0 transition-all duration-300 border-b z-0",
          scrolled ? 'bg-white/95 backdrop-blur-md border-stone-200 shadow-sm' : 'bg-transparent border-transparent'
        )} />

        {/* --- ARTISAN LOOM & PEARLS BACKGROUND (HIGH VISIBILITY) --- */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
          {/* Layer 1: The Loom (Spanning Threads) */}
          <div className="absolute inset-0 flex flex-col justify-center gap-6 opacity-40">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  x: (mousePos.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * (0.015 * i),
                  opacity: i % 2 === 0 ? [0.3, 0.5, 0.3] : [0.15, 0.3, 0.15]
                }}
                transition={{ type: "spring", damping: 40, stiffness: 60 }}
                className={cn(
                  "w-full h-[1.5px] bg-gradient-to-r from-transparent via-stone-900/30 to-transparent relative",
                  i === 2 && "h-[0.5px] border-t border-dashed border-stone-950/20 bg-transparent"
                )}
              />
            ))}
            
            {/* Signature Sculpted Thread */}
            <svg width="100%" height="60" viewBox="0 0 1000 60" fill="none" preserveAspectRatio="none" className="absolute top-1/2 -translate-y-1/2 opacity-30">
              <motion.path 
                animate={{ 
                  d: [
                    "M0 30 Q 250 10, 500 30 T 1000 30",
                    "M0 30 Q 250 50, 500 30 T 1000 30",
                    "M0 30 Q 250 10, 500 30 T 1000 30"
                  ]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                stroke="currentColor" 
                className="text-stone-950"
                strokeWidth="1" 
                strokeDasharray="6 12"
              />
            </svg>
          </div>

          {/* Layer 2: The Obsidian Pearls (Right-Side Bubbling Clusters) - High Contrast */}
          <div className="absolute right-0 top-0 bottom-0 w-[450px]">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                initial={{ y: 60, opacity: 0 }}
                animate={{
                  y: [-20, -100],
                  x: (i % 2 === 0 ? [0, 40, 20] : [0, -40, -20]),
                  opacity: [0, 0.4, 0.4, 0],
                  scale: [0.8, 1.2, 0.9]
                }}
                transition={{
                  duration: 10 + i * 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 2
                }}
                className={cn(
                  "absolute rounded-full flex items-start justify-start p-1.5 overflow-hidden",
                  i === 1 ? "bottom-[-10px] right-20 w-12 h-12 bg-stone-800/15" :
                  i === 2 ? "bottom-0 right-40 w-20 h-20 bg-stone-700/10" :
                  i === 3 ? "bottom-2 right-64 w-28 h-28 bg-stone-900/10" :
                  i === 4 ? "bottom-[-20px] right-10 w-16 h-16 bg-stone-800/20" :
                  i === 5 ? "bottom-10 right-80 w-10 h-10 bg-stone-500/20" :
                  "bottom-0 right-4 w-24 h-24 bg-stone-900/15"
                )}
              >
                {/* Pearl Shine/Glint (Top Left Highlight) */}
                <div className="w-2 h-2 bg-white/40 rounded-full blur-[1px]" />
              </motion.div>
            ))}
          </div>

          {/* Layer 3: Artisan Light Shimmer */}
          <motion.div
            animate={{ 
              x: ["-100%", "200%"],
              opacity: [0, 0.4, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-stone-200/40 to-transparent w-[400px] -skew-x-12"
          />
        </div>

        <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10 flex items-center justify-between relative h-12 md:h-16 z-10">

          {/* --- LEFT: MENU + LOGO (Joined Look) --- */}
          <div className="flex items-center gap-2 lg:flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-stone-900 transition-all active:scale-95"
              aria-label="Open Menu"
            >
              <Menu size={24} strokeWidth={1.5} />
            </button>
            <Link href="/" className="group block shrink-0">
              <Image
                src="/navlogo.png"
                alt="TrendiZip"
                width={50}
                height={50}
                className={cn(
                  "transition-all duration-300 group-hover:opacity-80 object-contain w-auto",
                  scrolled ? "h-8 md:h-9" : "h-10 md:h-14"
                )}
              />
            </Link>
          </div>

          {/* --- CENTER: NAVIGATION (Desktop Only) --- */}
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link, idx) => (
              <Link key={idx} href={link.href} className={cn(
                "group relative text-[13px] font-medium tracking-tight transition-colors whitespace-nowrap",
                isActive(link.href) ? "text-stone-950" : "text-stone-500 hover:text-stone-900"
              )}>
                <span>{link.label}</span>
                {isActive(link.href) && (
                  <motion.span layoutId="nav-underline" className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-stone-950" />
                )}
              </Link>
            ))}
          </nav>

          {/* --- RIGHT: ACTIONS (Consolidated) --- */}
          <div className="flex items-center justify-end lg:flex-1 gap-1 md:gap-3">
            <div className="flex items-center gap-1 md:gap-2">
              <button onClick={() => setIsSearchOpen(true)} className="p-2 text-stone-600 hover:text-stone-950 transition-colors">
                <Search size={20} strokeWidth={1.5} />
              </button>
              <NotificationBell context="personal" />
              <CartSheetTrigger />

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative ml-1 outline-none group flex items-center">
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden border border-stone-200 group-hover:border-stone-900 transition-all">
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
                  className="px-4 py-2 bg-stone-950 text-white text-[13px] font-medium rounded-full hover:bg-stone-800 transition-all"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

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
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">{link.sub}</p>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-3xl font-light", isActive(link.href) ? "text-stone-950" : "text-stone-500")}>
                        {link.label}
                      </span>
                      <ArrowRight size={20} className="text-stone-200" />
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