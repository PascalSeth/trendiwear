'use client';
import React, { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LoginLink, LogoutLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";
import { CartSheetTrigger } from "@/components/ui/cart-sheet-trigger";
import { Search, Bell, User, LogOut, Package, Heart, MapPin, Ruler, Settings, HelpCircle, DollarSign, ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

type User = {
  picture?: string | null;
  given_name: string | null;
  family_name: string | null;
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
          <img src="/navlogo.png" alt="BeliBeli" className="h-10 w-10 transition-transform duration-300 group-hover:scale-105" />
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
             <button className="relative hover:text-red-900 text-stone-400 transition-colors">
               <Bell size={18} />
               <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-stone-900 rounded-full"></span>
             </button>
             <CartSheetTrigger />
          </div>

          {/* User Actions */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-200 group-hover:border-stone-900 transition-colors">
                    <Image
                      src={user.picture ?? "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg"}
                      alt="User"
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>
              </DropdownMenuTrigger>
              
              {/* Clean Editorial Dropdown */}
              <DropdownMenuContent align="end" className="w-72 p-0 bg-white border border-stone-200 shadow-xl rounded-none">
                <div className="p-6 border-b border-stone-100">
                  <p className="font-serif text-lg text-red-900 leading-tight">
                    {user.given_name} {user.family_name}
                  </p>
                  <p className="text-xs font-mono uppercase tracking-widest text-stone-400 mt-1">
                    Member
                  </p>
                </div>

                <div className="p-2">
                  {[
                    { icon: User, label: 'My Profile', href: getProfileUrl() },
                    { icon: Package, label: 'My Orders', href: '/orders' },
                    { icon: Heart, label: 'Wishlist', href: '/wishlist' },
                  ].map((item, idx) => (
                    <DropdownMenuItem key={idx} className="group/item cursor-pointer py-3 px-4 hover:bg-stone-50 transition-colors">
                      <item.icon size={16} className="mr-3 text-stone-400 group-hover/item:text-red-900 transition-colors" />
                      <Link href={item.href} className="flex-1 text-sm font-medium text-stone-700">
                        {item.label}
                      </Link>
                      <ChevronRight size={12} className="text-stone-300 group-hover/item:text-red-900 transition-colors" />
                    </DropdownMenuItem>
                  ))}
                </div>

                {/* Professional Section */}
                {(role === "PROFESSIONAL" || role === "SUPER_ADMIN" || role === "ADMIN") && (
                  <div className="p-2 border-t border-stone-100">
                    <DropdownMenuItem className="group/item cursor-pointer py-3 px-4 hover:bg-stone-50 transition-colors">
                      <Settings size={16} className="mr-3 text-stone-400 group-hover/item:text-red-900" />
                      <Link href="/dashboard" className="flex-1 text-sm font-medium text-red-900 font-semibold">
                        Professional Dashboard
                      </Link>
                    </DropdownMenuItem>
                  </div>
                )}

                {/* Become Professional */}
                {role === "CUSTOMER" && (
                  <div className="p-2 border-t border-stone-100">
                    <DropdownMenuItem className="group/item cursor-pointer py-3 px-4 hover:bg-stone-50 transition-colors">
                      <DollarSign size={16} className="mr-3 text-stone-400 group-hover/item:text-red-900" />
                      <Link href="/register-as-professional" className="flex-1 text-sm font-medium text-stone-700">
                        Become a Professional
                      </Link>
                    </DropdownMenuItem>
                  </div>
                )}

                {/* Settings & Support */}
                <div className="p-2 border-t border-stone-100">
                   {[
                    { icon: MapPin, label: 'Addresses', href: '/addresses' },
                    { icon: Ruler, label: 'Measurements', href: '/measurements' },
                    { icon: Settings, label: 'Account Settings', href: '/settings' },
                    { icon: HelpCircle, label: 'Help & Support', href: '/help' },
                  ].map((item, idx) => (
                    <DropdownMenuItem key={idx} className="group/item cursor-pointer py-3 px-4 hover:bg-stone-50 transition-colors">
                      <item.icon size={16} className="mr-3 text-stone-400 group-hover/item:text-red-900 transition-colors" />
                      <Link href={item.href} className="flex-1 text-sm font-medium text-stone-700">
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>

                {/* Logout */}
                <div className="p-2 border-t border-stone-100">
                  <DropdownMenuItem className="group/item cursor-pointer py-3 px-4 hover:bg-stone-50 transition-colors">
                    <LogOut size={16} className="mr-3 text-red-500 group-hover/item:text-red-700 transition-colors" />
                    <LogoutLink className="flex-1 text-sm font-medium text-red-600">
                      Logout
                    </LogoutLink>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <LoginLink className="text-xs font-mono uppercase tracking-[0.2em] text-stone-500 hover:text-red-900 transition-colors">
                Login
              </LoginLink>
              <RegisterLink className="px-6 py-2.5 bg-stone-900 text-white text-xs font-mono uppercase tracking-[0.2em] hover:bg-stone-800 transition-colors">
                Sign up
              </RegisterLink>
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
                  <img src="/navlogo.png" alt="BeliBeli" className="h-8 w-8" />
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-stone-500 hover:text-red-900">
                    <X size={24} />
                  </button>
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
                </div>

                {/* Mobile Auth Footer */}
                <div className="p-6 border-t border-stone-200 bg-stone-50">
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <Image
                            src={user.picture ?? "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg"}
                            alt="User"
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-serif font-medium text-red-900">{user.given_name}</p>
                            <p className="text-xs font-mono text-stone-500">Member</p>
                          </div>
                      </div>
                      <LogoutLink className="block w-full py-3 text-center text-sm font-mono uppercase tracking-widest text-red-600 hover:text-red-700">
                        Logout
                      </LogoutLink>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <LoginLink className="block w-full py-3 text-center text-sm font-mono uppercase tracking-widest text-red-900 border border-stone-300 hover:border-stone-900 transition-colors">
                        Login
                      </LoginLink>
                      <RegisterLink className="block w-full py-3 text-center text-sm font-mono uppercase tracking-widest text-white bg-stone-900 hover:bg-stone-800 transition-colors">
                        Sign up
                      </RegisterLink>
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