'use client';
import React, { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {  signOut } from "next-auth/react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import dynamic from "next/dynamic";
import { NotificationBell } from "@/components/ui/notification-bell";
import { Search, User, LogOut, Package, Heart, MapPin, Ruler, Settings, HelpCircle, DollarSign, Menu, Calendar} from "lucide-react";
import { cn } from "@/lib/utils";

const CartSheetTrigger = dynamic(() => import("@/components/ui/cart-sheet-trigger").then(mod => ({ default: mod.CartSheetTrigger })), {
  ssr: false,
  loading: () => <div className="h-6 w-6" />
});

type User = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type NavbarProps = {
  role: Role;
  user: User | null;
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

  const isActive = (path: string) => pathname === path;

  const getProfileUrl = (): string => {
    if (profileSlug) return `/tz/${profileSlug}`;
    return '/profile';
  };

  // KEPT ORIGINAL TEXT
  const navLinks = [
    { href: "/fashion-trends", label: "Fashion Trends" },
    { href: "/tailors-designers", label: "Tailors & Designers" },
    { href: "/shopping", label: "Shopping" },
    { href: "/blog", label: "Blog" },
    // { href: "/about", label: "About Us" },
  ];

  return (
    <div 
      className={cn(
        "fixed w-full top-0 z-50 transition-all duration-500 ease-out border-b",
        scrolled 
          ? 'bg-[#FAFAF9]/95 backdrop-blur-md border-stone-200 py-4' 
          : 'bg-[#FAFAF9]/80 backdrop-blur-md border-transparent py-6'
      )}
    >
      <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between">
        
        {/* Left: Original Logo */}
        <Link href="/" className="flex-shrink-0 group">
          <Image 
            src="/navlogo.png" 
            alt="TrendiZip" 
            width={40} 
            height={40} 
            className="transition-transform duration-300 group-hover:scale-105" 
          />
        </Link>

        {/* Center: Navigation Links (Styled Editorially) */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              className={cn(
                "relative text-xs font-mono uppercase tracking-[0.2em] transition-colors duration-300",
                isActive(link.href) ? "text-red-900" : "text-stone-500 hover:text-red-900"
              )}
            >
              {link.label}
              <span className={cn(
                "absolute -bottom-2 left-0 w-full h-[1px] bg-stone-900 transition-transform duration-300",
                isActive(link.href) ? "scale-x-100" : "scale-x-0 hover:scale-x-100"
              )}></span>
            </Link>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-6">
          {/* Minimal Search (Keeps original placeholder) */}
          <div className="hidden lg:flex items-center group">
            <Search className="w-4 h-4 text-stone-400 group-hover:text-red-900 transition-colors" />
            <input
              type="text"
              placeholder="Search product or brand..."
              className="ml-3 bg-transparent border-b border-transparent focus:border-stone-300 focus:outline-none text-sm text-stone-600 placeholder-stone-400 w-0 group-hover:w-48 transition-all duration-500 ease-out"
            />
          </div>

          {/* Icons */}
          <div className="hidden md:flex items-center gap-4">
             <NotificationBell context="personal" />
             <CartSheetTrigger />
          </div>

          {/* User Actions */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-stone-200 group-hover:ring-2 group-hover:ring-stone-400 transition-all duration-300">
                    <Image
                      src={user.image ?? "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg"}
                      alt="User"
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>
              </DropdownMenuTrigger>
              
              {/* Minimal Awwards-worthy Dropdown */}
              <DropdownMenuContent 
                align="end" 
                sideOffset={8}
                className="w-64 p-0 bg-white border-0 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] rounded-2xl overflow-hidden"
              >
                {/* User Header */}
                <div className="px-5 py-4 border-b border-stone-100">
                  <p className="text-sm font-medium text-stone-900 truncate">{user.name}</p>
                  <p className="text-xs text-stone-400 truncate mt-0.5">{user.email}</p>
                </div>

                {/* Scrollable Menu */}
                <div className="max-h-[50vh] overflow-y-auto overscroll-contain py-2">
                  {[
                    { icon: User, label: 'Profile', href: getProfileUrl() },
                    { icon: Package, label: 'Orders', href: '/orders' },
                    { icon: Calendar, label: 'Bookings', href: '/bookings' },
                    { icon: Heart, label: 'Wishlist', href: '/wishlist' },
                  ].map((item, idx) => (
                    <DropdownMenuItem key={idx} asChild className="cursor-pointer focus:bg-stone-50">
                      <Link href={item.href} className="flex items-center gap-3 px-5 py-2.5 text-stone-600 hover:text-stone-900 transition-colors">
                        <item.icon size={16} strokeWidth={1.5} />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}

                  {/* Dashboard for Professionals */}
                  {(role === "PROFESSIONAL" || role === "SUPER_ADMIN" || role === "ADMIN") && (
                    <>
                      <div className="h-px bg-stone-100 my-2 mx-5" />
                      <DropdownMenuItem asChild className="cursor-pointer focus:bg-stone-50">
                        <Link href="/dashboard" className="flex items-center gap-3 px-5 py-2.5 text-stone-900 font-medium transition-colors">
                          <Settings size={16} strokeWidth={1.5} />
                          <span className="text-sm">Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Become Professional */}
                  {role === "CUSTOMER" && (
                    <>
                      <div className="h-px bg-stone-100 my-2 mx-5" />
                      <DropdownMenuItem asChild className="cursor-pointer focus:bg-stone-50">
                        <Link href="/register-as-professional" className="flex items-center gap-3 px-5 py-2.5 text-stone-600 hover:text-stone-900 transition-colors">
                          <DollarSign size={16} strokeWidth={1.5} />
                          <span className="text-sm">Become a Pro</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <div className="h-px bg-stone-100 my-2 mx-5" />

                  {[
                    { icon: MapPin, label: 'Addresses', href: '/addresses' },
                    { icon: Ruler, label: 'Measurements', href: '/measurements' },
                    { icon: Settings, label: 'Settings', href: '/settings' },
                    { icon: HelpCircle, label: 'Help', href: '/help' },
                  ].map((item, idx) => (
                    <DropdownMenuItem key={idx} asChild className="cursor-pointer focus:bg-stone-50">
                      <Link href={item.href} className="flex items-center gap-3 px-5 py-2.5 text-stone-600 hover:text-stone-900 transition-colors">
                        <item.icon size={16} strokeWidth={1.5} />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>

                {/* Logout */}
                <div className="border-t border-stone-100 p-2">
                  <DropdownMenuItem asChild className="cursor-pointer focus:bg-red-50 rounded-lg">
                    <button 
                      onClick={() => signOut({ callbackUrl: '/auth/signin' })} 
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut size={16} strokeWidth={1.5} />
                      <span className="text-sm">Sign out</span>
                    </button>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => window.location.href = '/auth/signin?mode=signin'} className="text-xs font-mono uppercase tracking-[0.2em] text-stone-500 hover:text-red-900 transition-colors">
                Login
              </button>
              <button onClick={() => window.location.href = '/auth/signin?mode=signup'} className="px-6 py-2.5 bg-stone-900 text-white text-xs font-mono uppercase tracking-[0.2em] hover:bg-stone-800 transition-colors">
                Sign up
              </button>
            </div>
          )}

          {/* Mobile Hamburger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button className="p-2 -mr-2 text-stone-500 hover:text-red-900 transition-colors">
                <Menu size={24} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] bg-[#FAFAF9] p-0 border-l border-stone-200">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="h-full flex flex-col">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-6 border-b border-stone-200">
                  <Image src="/navlogo.png" alt="TrendiZip" width={32} height={32} />
                </div>

                {/* Mobile Search */}
                <div className="px-6 py-4">
                  <div className="relative">
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search product or brand..."
                      className="w-full pl-8 py-2 bg-transparent border-b border-stone-200 focus:outline-none focus:border-stone-900 text-red-900 placeholder-stone-400"
                    />
                  </div>
                </div>

                {/* Mobile Nav Links (Original Text) */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  {navLinks.map((link, idx) => (
                    <Link
                      key={idx}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "block text-lg font-serif text-red-900 hover:italic transition-all duration-300",
                        isActive(link.href) && "font-bold"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  
                  {user && (
                    <div className="pt-6 mt-6 border-t border-stone-100 space-y-6">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Personal Curation</p>
                      {[
                        { icon: Package, label: 'Orders', href: '/orders' },
                        { icon: Calendar, label: 'Bookings', href: '/bookings' },
                        { icon: Heart, label: 'Wishlist', href: '/wishlist' },
                      ].map((item, idx) => (
                        <Link
                          key={idx}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-4 text-stone-600 hover:text-stone-900 transition-all font-serif italic text-lg"
                        >
                          <item.icon size={20} strokeWidth={1} />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile Auth Footer */}
                <div className="p-6 border-t border-stone-200 bg-stone-50">
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <Image
                            src={user.image ?? "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg"}
                            alt="User"
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-serif font-medium text-red-900">{user.name}</p>
                            <p className="text-xs font-mono text-stone-500">{role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'PROFESSIONAL' ? 'Professional' : 'Member'}</p>
                          </div>
                      </div>
                      {(role === "PROFESSIONAL" || role === "SUPER_ADMIN" || role === "ADMIN") && (
                        <Link 
                          href="/dashboard" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full py-3 mt-4 text-center text-sm font-mono uppercase tracking-widest bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                        >
                          Dashboard
                        </Link>
                      )}
                      <button onClick={() => signOut()} className="block w-full py-3 text-center text-sm font-mono uppercase tracking-widest text-red-600 hover:text-red-700">
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button onClick={() => window.location.href = '/auth/signin?mode=signin'} className="block w-full py-3 text-center text-sm font-mono uppercase tracking-widest text-red-900 border border-stone-300 hover:border-stone-900 transition-colors">
                        Login
                      </button>
                      <button onClick={() => window.location.href = '/auth/signin?mode=signup'} className="block w-full py-3 text-center text-sm font-mono uppercase tracking-widest text-white bg-stone-900 hover:bg-stone-800 transition-colors">
                        Sign up
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}

export default Navbar;