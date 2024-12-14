import React from "react";
import Link from "next/link"; // Ensure you're using Next.js's Link component
import { Bell, Menu, SearchIcon, ShoppingCart } from "lucide-react";

;

function Navbar() {
  return (
    <div className="bg-white border-b sticky w-full overflow-hidden top-0 left-0 right-0 bottom-0 z-[999] border-gray-200 shadow-sm">
      {/* Top Navigation Links */}
      <div className='w-full max-lg:hidden'>
      <div className="border-b border-gray-200 py-2">
        <div className="container mx-auto flex items-center justify-between text-sm text-gray-600">
          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link href="/fashion-trends" className="hover:text-[#F59E0B]">
              Fashion Trends
            </Link>
            <Link href="/tailors-designers" className="hover:text-[#F59E0B]">
              Tailors & Designers
            </Link>
            <Link href="/shop" className="hover:text-[#F59E0B]">
              Shop
            </Link>
            <Link href="/blog" className="hover:text-[#F59E0B]">
              Blog
            </Link>
            <Link href="/about" className="hover:text-[#F59E0B]">
              About Us
            </Link>
          </div>
          <div className="flex items-center space-x-1">
            <Link href="#" className=" text-black font-semibold border-r pr-2 border-black">
              Sign Up
            </Link>
            <Link href="#" className=" text-black pl-1 font-semibold">
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar Section */}
      <div className="container mx-auto flex items-center justify-between p-2">
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <img
            src="/navlogo.png" // Replace with your logo path
            alt="BeliBeli Logo"
            className="h-12 w-12"
          />
        </div>

        {/* Search Bar */}
        <div className="flex-grow mx-4">
          <div className="relative flex  border border-gray-300 rounded-md p-2 text-sm focus:outline-none ">
           <SearchIcon/>
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
       </div>
            {/**MOblie view  */}
      {/* Mobile View (Menu Icon) */}
      <div className="lg:hidden flex items-center justify-between p-4">
        {/* Menu Icon */}

        {/* Logo Section */}
        <div className="flex items-center">
 <img
            src="/navlogo.png" // Replace with your logo path
            alt="BeliBeli Logo"
            className="h-10 w-10"
          />
        </div>

        {/* Icons */}
        <div className="flex items-center space-x-4">
          <ShoppingCart className="text-gray-600 h-5 w-5" />
          <Bell className="text-gray-600 h-5 w-5" />
           <Menu className="text-gray-600 h-6 w-6" />

        </div>
      </div>
    </div>
  );
}

export default Navbar;
