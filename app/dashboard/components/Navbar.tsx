'use client';

import { AvatarIcon, CardStackIcon } from '@radix-ui/react-icons';
import { Bell, Settings, Shirt, Warehouse } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';


const Navbar = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="bg-gradient-to-r from-gray-50 via-white to-gray-400 shadow-md">
      <div className="flex items-center justify-between px-8 py-2">
        {/* Logo Section */}
        <Link href="/" className="w-fit">
          <Image src="/navlogo.png" alt="Logo" className='w-12 h-12' width={40} height={60} />
        </Link>

        {/* Navbar Links */}
        <div className="flex items-center space-x-6 text-sm font-medium text-gray-600">
          <Link
            href='/dashboard'
            className={`px-4 py-2 rounded-full ${
              isActive('/dashboard') ? 'bg-gray-300 text-gray-900' : 'hover:bg-gray-200'
            }`}
          >
            Dashboard
          </Link>

          {/* Catalogue Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`px-4 py-2 rounded-full ${
                  isActive('/dashboard/catalogue') ? 'bg-gray-300 text-gray-900' : 'hover:bg-gray-200'
                }`}
              >
                Catalogue
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuItem  className='flex items-center '>
                  <Warehouse/>
                  <Link href="/dashboard/catalogue/inventory">Inventory</Link>
                </DropdownMenuItem>
                <DropdownMenuItem  className='flex items-center '>
                  <CardStackIcon/>
                  <Link href="/dashboard/catalogue/collections">Collections</Link>
                </DropdownMenuItem>
                <DropdownMenuItem  className='flex items-center '>
                  <Shirt/>
                  <Link href="/dashboard/catalogue/products">Products</Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>

          {[{ href: "/dashboard/orders", label: "Orders" }, { href: "/dashboard/customers", label: "Customers" }, { href: "/dashboard/professionals", label: "Professionals" }, { href: "/dashboard/reports", label: "Reports" }].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-full ${
                isActive(link.href) ? 'bg-gray-300 text-gray-900' : 'hover:bg-gray-200'
              }`}
            >
              {link.label}
            </Link>
          ))}

           {/* Catalogue Dropdown */}
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`px-4 py-2 rounded-full ${
                  isActive('/dashboard/catalogue') ? 'bg-gray-300 text-gray-900' : 'hover:bg-gray-200'
                }`}
              >
                Trends
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuItem  className='flex items-center '>
                  <Warehouse/>
                  <Link href="/dashboard/catalogue/inventory">Categories</Link>
                </DropdownMenuItem>
                <DropdownMenuItem  className='flex items-center '>
                  <CardStackIcon/>
                  <Link href="/dashboard/catalogue/collections">Sub-Categories</Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>

        </div>

           
        {/* Profile and Settings */}
        <div className="flex items-center space-x-4">
          <Link
            href="/settings"
            className={`px-4 py-2 flex items-center rounded-full ${
              isActive('/settings') ? 'bg-gray-300 text-gray-900' : 'hover:bg-gray-200'
            }`}
          >
            <Settings /> Settings
          </Link>
          <Link
            href="/profile"
            className={`px-4 py-2 flex items-center rounded-full ${
              isActive('/profile') ? 'bg-gray-300 text-gray-900' : 'hover:bg-gray-200'
            }`}
          >
            <AvatarIcon className="flex items-center justify-center p-2 rounded-full bg-gray-200 hover:bg-gray-300" />
          </Link>
          <Bell />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
