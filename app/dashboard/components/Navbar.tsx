'use client';

import { AvatarIcon, CardStackIcon } from '@radix-ui/react-icons';
import { Bell, Menu, Settings, Shirt, Warehouse, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Role } from '@prisma/client';

// Define type for Navbar props
type NavbarProps = {
  role: Role;
};

const Navbar: React.FC<NavbarProps> = ({ role }) => {
  console.log(role);
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  // Helper function to check if user has admin privileges
  const hasAdminPrivileges = (userRole: Role) => {
    return userRole === 'PROFESSIONAL' || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  };

  // Helper function to check if user is super admin
  const isSuperAdmin = (userRole: Role) => {
    return userRole === 'SUPER_ADMIN';
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 md:px-8 py-3">
        {/* Logo Section */}
        <Link href="/" className="flex items-center">
          <Image src="/navlogo.png" alt="Logo" className="w-8 h-8 md:w-10 md:h-10" width={40} height={40} />
        </Link>

        {/* Desktop Navbar Links */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/dashboard"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/dashboard')
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Dashboard
          </Link>

          {/* Catalogue Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dashboard/catalogue')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Catalogue
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuGroup>
                {hasAdminPrivileges(role) && (
                  <>
                    <DropdownMenuItem className="flex items-center">
                      <Warehouse />
                      <Link href="/dashboard/catalogue/category">Category</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center">
                      <CardStackIcon />
                      <Link href="/dashboard/catalogue/collections">Collections</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem className="flex items-center">
                  <Shirt />
                  <Link href="/dashboard/catalogue/products">Products</Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Additional Links */}
          {[
            { href: '/dashboard/orders', label: 'Orders' },
            { href: '/dashboard/services', label: 'Services' },
            { href: '/dashboard/customers', label: 'Customers' },
            { href: '/dashboard/reports', label: 'Reports' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Professional Link - Only for PROFESSIONAL/ADMIN/SUPER_ADMIN */}
          {hasAdminPrivileges(role) && (
            <Link
              href="/dashboard/professionals"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/dashboard/professionals')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Professionals
            </Link>
          )}

          {/* Trends Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dashboard/trends')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Trends
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuGroup>
                {hasAdminPrivileges(role) && (
                  <>
                    <DropdownMenuItem className="flex items-center">
                      <Warehouse />
                      <Link href="/dashboard/trends/events">Events</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center">
                      <Shirt />
                      <Link href="/dashboard/trends/outfit-inspirations">Outfit Inspirations</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Management Dropdown - Only for SUPER_ADMIN */}
          {isSuperAdmin(role) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard/management')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Management
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuItem className="flex items-center">
                    <Settings />
                    <Link href="/dashboard/management/services">Services</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center">
                    <AvatarIcon />
                    <Link href="/dashboard/management/professional-types">Professional Types</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center">
                    <Bell />
                    <Link href="/dashboard/management/content">Content Moderation</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center">
                    <Settings />
                    <Link href="/dashboard/management/system">System Settings</Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Desktop Profile and Settings */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            href="/settings"
            className={`px-3 py-2 flex items-center rounded-md text-sm font-medium transition-colors ${
              isActive('/settings')
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Settings className="h-4 w-4 mr-2" /> Settings
          </Link>
          <Link
            href="/profile"
            className={`p-2 rounded-md transition-colors ${
              isActive('/profile') ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <AvatarIcon className="h-5 w-5" />
          </Link>
          <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
            <Bell className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4">
          <div className="flex flex-col space-y-2">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            {/* Add other mobile links here */}
            <Link
              href="/settings"
              className={`px-3 py-2 flex items-center rounded-md text-sm font-medium transition-colors ${
                isActive('/settings')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Settings className="h-4 w-4 mr-2" /> Settings
            </Link>
            <Link
              href="/profile"
              className={`px-3 py-2 flex items-center rounded-md text-sm font-medium transition-colors ${
                isActive('/profile')
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <AvatarIcon className="h-4 w-4 mr-2" /> Profile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;