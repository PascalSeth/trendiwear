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
import { Search, User, LogOut, Package, Heart, Settings, Menu, Calendar, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import useSWR, { useSWRConfig } from "swr";
import { motion } from "framer-motion";

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

  const isActive = (path: string) => pathname === path;

  const getProfileUrl = (): string => {
    if (profileSlug) return `/tz/${profileSlug}`;
    return '/profile';
  };

  const navLinks = [
    { href: "/fashion-trends", label: "Fashion Trends" },
    { href: "/tailors-designers", label: "Tailors & Designers" },
    { href: "/shopping", label: "Shopping" },
    { href: "/blog", label: "Blog" },
  ];

  return (
    <div
      className={cn(
        "fixed w-full top-0 z-50 transition-all duration-500 ease-out border-b",
        scrolled
          ? 'bg-[#FAFAF9]/95 backdrop-blur-md border-stone-200 py-3 md:py-4'
          : 'bg-[#FAFAF9]/90 backdrop-blur-md border-transparent py-5 md:py-6'
      )}
    >
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex items-center justify-between relative h-10 md:h-12">

        {/* --- MOBILE: LEFT ACTION (Menu Trigger) --- */}
        <div className="md:hidden flex-1 flex items-center">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2 -ml-2 text-stone-900 transition-colors">
                <Menu size={22} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] bg-[#FAFAF9] p-0 border-l border-stone-200">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-stone-200">
                  <Image src="/navlogo.png" alt="TrendiZip" width={32} height={32} />
                </div>
                
                {/* Mobile Secondary Menu */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                  <div className="space-y-4">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400">Main Collection</p>
                    <div className="space-y-4">
                      {navLinks.map((link, idx) => (
                        <Link
                          key={idx}
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "block text-2xl font-serif text-stone-900 hover:italic transition-all duration-300",
                            isActive(link.href) && "italic font-semibold"
                          )}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {user && (
                    <div className="pt-8 border-t border-stone-100 space-y-6">
                      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-400">Digital Atelier</p>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { icon: MessageSquare, label: 'Messages', href: '/messages' },
                          { icon: Package, label: 'Orders', href: '/orders' },
                          { icon: Calendar, label: 'Bookings', href: '/bookings' },
                          { icon: Heart, label: 'Wishlist', href: '/wishlist' },
                        ].map((item, idx) => (
                          <Link
                            key={idx}
                            href={item.href}
                            onClick={() => {
                              handleCategoryClick(item.label);
                              setMobileMenuOpen(false);
                            }}
                            className="flex flex-col gap-2 p-4 bg-white border border-stone-100 rounded-2xl hover:border-stone-200 transition-colors"
                          >
                            <div className="relative w-fit">
                              <item.icon size={20} strokeWidth={1.5} className="text-stone-400" />
                              {hasUnreadCategory(item.label) && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
                              )}
                            </div>
                            <span className="text-xs font-mono uppercase tracking-widest text-stone-600 font-medium">{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Footer Logout/Auth */}
                <div className="p-6 border-t border-stone-200 bg-stone-50/50">
                  {user ? (
                    <button onClick={() => signOut()} className="w-full py-4 text-center text-[10px] font-mono uppercase tracking-[0.3em] text-red-600 hover:bg-white transition-colors border border-stone-200 bg-white rounded-xl">
                      Sign Out
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => window.location.href='/auth/signin?mode=signin'} className="py-4 text-center text-[10px] font-mono uppercase tracking-[0.3em] text-stone-900 border border-stone-200 bg-white rounded-xl">
                        Log In
                      </button>
                      <button onClick={() => window.location.href='/auth/signin?mode=signup'} className="py-4 text-center text-[10px] font-mono uppercase tracking-[0.3em] text-white bg-stone-900 rounded-xl shadow-lg">
                        Sign Up
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* --- LOGO: CENTER ON MOBILE, LEFT ON DESKTOP --- */}
        <div className="md:flex-shrink-0 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 transition-all duration-700 z-10">
          <Link href="/" className="group block">
            <Image
              src="/navlogo.png"
              alt="TrendiZip"
              width={34}
              height={34}
              className="transition-transform duration-500 group-hover:scale-110 md:w-10 md:h-10"
            />
          </Link>
        </div>

        {/* --- DESKTOP: CENTER NAVIGATION LINKS --- */}
        <nav className="hidden md:flex items-center gap-12 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              className={cn(
                "relative text-[10px] font-mono uppercase tracking-[0.4em] transition-all duration-300",
                isActive(link.href) ? "text-stone-950 font-black" : "text-stone-400 hover:text-stone-900"
              )}
            >
              {link.label}
              <span className={cn(
                "absolute -bottom-1 left-0 w-full h-[1.5px] bg-stone-900 transition-transform duration-500 origin-left ease-out",
                isActive(link.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              )}></span>
            </Link>
          ))}
        </nav>

        {/* --- RIGHT: ACTIONS (Icon Group) --- */}
        <div className="flex-1 flex justify-end items-center gap-1 md:gap-4">
          
          {/* Desktop Search Trigger */}
          <div className="hidden lg:flex items-center group relative cursor-pointer">
            <Search className="w-4 h-4 text-stone-400 group-hover:text-stone-900 transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              className="ml-3 bg-transparent border-b border-transparent focus:border-stone-300 focus:outline-none text-[10px] font-mono uppercase tracking-widest text-stone-600 placeholder-stone-400 w-0 group-hover:w-32 transition-all duration-500 ease-out"
            />
          </div>

          {/* Action Row - Mobile Capsule Styling */}
          <div className="flex items-center gap-1 md:gap-4 bg-stone-100/50 md:bg-transparent backdrop-blur-sm md:backdrop-blur-0 px-1.5 md:px-0 py-1 md:py-0 rounded-full border border-stone-200/50 md:border-0 ml-auto">
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
                  <button className="flex items-center group relative outline-none">
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
                  <div className="px-4 py-3 mb-2 bg-stone-50 rounded-xl">
                    <p className="text-xs font-bold font-mono uppercase tracking-widest text-stone-900 truncate">{user.name}</p>
                    <p className="text-[10px] font-mono text-stone-400 truncate mt-0.5 uppercase tracking-tighter">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    {[
                      { icon: User, label: 'Profile', href: getProfileUrl() },
                      { icon: MessageSquare, label: 'Messages', href: '/messages' },
                      { icon: Package, label: 'Orders', href: '/orders' },
                      { icon: Calendar, label: 'Bookings', href: '/bookings' },
                    ].map((item, idx) => (
                      <DropdownMenuItem key={idx} asChild className="cursor-pointer focus:bg-stone-50 rounded-lg">
                        <Link href={item.href} onClick={() => handleCategoryClick(item.label)} className="flex items-center justify-between w-full px-3 py-2 text-stone-600 hover:text-stone-950">
                          <div className="flex items-center gap-3">
                            <item.icon size={16} strokeWidth={1.5} />
                            <span className="text-xs font-mono uppercase tracking-widest">{item.label}</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    {(role === "PROFESSIONAL" || role === "SUPER_ADMIN" || role === "ADMIN") && (
                      <div className="pt-2 mt-2 border-t border-stone-100">
                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-stone-900 font-bold rounded-lg hover:bg-stone-50 transition-colors">
                          <Settings size={16} strokeWidth={1.5} />
                          <span className="text-xs font-mono uppercase tracking-widest">Dashboard</span>
                        </Link>
                      </div>
                    )}
                    <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors mt-2">
                       <LogOut size={16} strokeWidth={1.5} />
                       <span className="text-xs font-mono uppercase tracking-widest">Sign Out</span>
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center">
                <button 
                  onClick={() => window.location.href='/auth/signin'} 
                  className="flex lg:hidden items-center gap-2 px-3 py-1.5 bg-stone-900 rounded-full text-[9px] font-mono uppercase tracking-[0.2em] text-white shadow-lg shadow-stone-200/50 hover:bg-stone-800 transition-all active:scale-95 ml-2"
                >
                  <User size={12} strokeWidth={2} />
                  <span>Login</span>
                </button>
                <button 
                  onClick={() => window.location.href='/auth/signin'} 
                  className="hidden lg:block text-[10px] font-mono uppercase tracking-[0.4em] text-stone-500 hover:text-stone-900 px-4 py-2 transition-colors"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Navbar;