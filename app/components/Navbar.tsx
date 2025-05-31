'use client';
import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { LoginLink, LogoutLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Bell, DollarSign, Menu, SearchIcon, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";

type User = {
  picture?: string | null;
  given_name: string | null;
  family_name: string | null;
};

type NavbarProps = {
  role: Role;
  user: User | null; // Allow user to be null
};

function Navbar({ role, user }: NavbarProps) {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;

  const isProfessionalOrOwner = role === "PROFESSIONAL" || role === "SUPER_ADMIN" || role === "ADMIN";

  return (
    <div className="bg-white border-b sticky w-full overflow-hidden top-0 left-0 right-0 bottom-0 z-[999] border-gray-200 shadow-sm">
      {/* Top Navigation Links */}
      <div className="w-full max-lg:hidden">
        <div className="border-b border-gray-200 py-2">
          <div className="container mx-auto flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <Link href="/fashion-trends" className={`hover:text-[#F59E0B] ${isActive('/fashion-trends') ? 'text-[#F59E0B]' : ''}`}>
                Fashion Trends
              </Link>
              <Link href="/tailors-designers" className={`hover:text-[#F59E0B] ${isActive('/tailors-designers') ? 'text-[#F59E0B]' : ''}`}>
                Tailors & Designers
              </Link>
              <Link href="/shop" className={`hover:text-[#F59E0B] ${isActive('/shop') ? 'text-[#F59E0B]' : ''}`}>
                Shop
              </Link>
              <Link href="/blog" className={`hover:text-[#F59E0B] ${isActive('/blog') ? 'text-[#F59E0B]' : ''}`}>
                Blog
              </Link>
              <Link href="/about" className={`hover:text-[#F59E0B] ${isActive('/about') ? 'text-[#F59E0B]' : ''}`}>
                About Us
              </Link>
            </div>
            <div className="flex items-center space-x-1">
              {user ? (
                <>
                  {/* Dropdown menu for logged-in users */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Image
                        className="hover:cursor-pointer w-8 h-8 rounded-full"
                        src={user.picture ?? "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg"}
                        alt="User Profile"
                        width={32}
                        height={32}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="z-[999] text-black bg-white"
                    >
                      <DropdownMenuItem className="rounded-[8px] hover:cursor-pointer items-center flex font-medium">
                        {user.given_name} {user.family_name}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-[8px] hover:cursor-pointer items-center flex font-medium">
                        <Link
                          href={isProfessionalOrOwner ? "/dashboard" : "/register-as-professional"}
                          className="rounded-[8px] hover:bg-orange-200 p-2 hover:text-white w-full hover:cursor-pointer items-center flex font-medium"
                        >
                          {isProfessionalOrOwner ? "Dashboard" : "Earn as a Professional"}
                          {isProfessionalOrOwner ? "" : <DollarSign size={14} />}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-[8px] hover:cursor-pointer items-center flex font-semibold">
                        <div className="rounded-[8px] hover:bg-orange-200 p-2 hover:text-white w-full hover:cursor-pointer items-center flex font-semibold">
                          <LogoutLink className="w-full">Logout</LogoutLink>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  {/* Registration and login links for users who are not logged in */}
                  <div className="max-lg:hidden space-x-2 flex items-center">
                    <RegisterLink className="px-2 py-0.5 rounded-[8px] w-20 text-center text-white font-semibold hover:bg-[#48a0ff60] bg-[#48A0ff]">
                      Sign up
                    </RegisterLink>
                    <LoginLink className="px-2 py-0.5 rounded-[8px] w-20 text-center text-white font-semibold hover:bg-gray-300 bg-gray-400">
                      Login
                    </LoginLink>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar Section */}
      <div className="container max-lg:hidden mx-auto flex items-center justify-between p-2">
        {/* Logo Section */}
        <Link href="/" className="flex items-center space-x-2">
          <img
            src="/navlogo.png"
            alt="BeliBeli Logo"
            className="h-12 w-12"
          />
        </Link>

        {/* Search Bar */}
        <div className="flex-grow mx-4">
          <div className="relative flex border border-gray-300 rounded-md p-2 text-sm focus:outline-none">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search product or brand here..."
              className="w-full border pl-2 border-none focus:outline-none"
            />
          </div>
        </div>

        {/* Notification and Cart Icons */}
        <div className="flex items-center space-x-4">
          <Bell className="text-gray-600" />
          <ShoppingCart className="text-gray-600" />
        </div>
      </div>

      {/* Mobile View (Menu Icon) */}
      <div className="lg:hidden flex items-center justify-between p-4">
        {/* Menu Icon */}
        <div className="flex items-center">
          <img
            src="/navlogo.png"
            alt="BeliBeli Logo"
            className="h-10 w-10"
          />
        </div>

        {/* Icons */}
        <div className="flex items-center space-x-4">
          <ShoppingCart className="text-gray-600 h-5 w-5" />
          <Bell className="text-gray-600 h-5 w-5" />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Image
                  className="hover:cursor-pointer w-6 h-6 rounded-full"
                  src={user.picture ?? "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg"}
                  alt="User Profile"
                  width={24}
                  height={24}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="z-[999] text-black bg-white"
              >
                <DropdownMenuItem className="rounded-[8px] hover:cursor-pointer items-center flex font-medium">
                  {user.given_name} {user.family_name}
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-[8px] hover:cursor-pointer items-center flex font-medium">
                  <Link
                    href={isProfessionalOrOwner ? "/dashboard" : "/register-as-professional"}
                    className="rounded-[8px] hover:bg-orange-200 p-2 hover:text-white w-full hover:cursor-pointer items-center flex font-medium"
                  >
                    {isProfessionalOrOwner ? "Dashboard" : "Earn as a Professional"}
                    {isProfessionalOrOwner ? "" : <DollarSign size={14} />}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-[8px] hover:cursor-pointer items-center flex font-semibold">
                  <div className="rounded-[8px] hover:bg-orange-200 p-2 hover:text-white w-full hover:cursor-pointer items-center flex font-semibold">
                    <LogoutLink className="w-full">Logout</LogoutLink>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Menu className="text-gray-600 h-6 w-6" />
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;