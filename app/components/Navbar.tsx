'use client'
import { Button } from '@/components/ui/button';
import { Menu, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

function Navbar() {
  return (
    <div className='sticky top-0 right-0 left-0 w-full bg-white z-[999] shadow-lg'>
      <div className='max-lg:hidden flex space-x-3 max-w-6xl justify-between mx-auto items-center py-2 pb-0'>
        <Link href='/' className='w-fit'>
          <Image src='/navlogo.png' alt='Logo' width={120} height={60} />
        </Link>

        <div className='w-full max-lg:hidden'>
          <form action=''>
            <input
              className='w-full border border-gray-300 rounded-md p-2'
              type='text'
              placeholder='Search profiles, sketches, collections...'
            />
          </form>
        </div>

        <div className='flex items-center space-x-3'>
          <div className='flex items-center space-x-3'>
            <Button>Sign Up</Button>
            <Button>Login</Button>
          </div>
          <ShoppingBag />
        </div>
      </div>

      <div className='lg:hidden flex justify-between items-center max-w-6xl mx-auto py-2 px-4'>
        <Link href='/' className='w-fit'>
          <Image src='/navlogo.png' alt='Logo' width={100} height={80} />
        </Link>

        <div className=''>
        <Menu/>
        </div>
      </div>

      {/* Menu section */}
      <div className='bg-gray-10  max-lg:hidden  font-medium shadow-md py-3'>
        <div className='flex justify-evenly max-lg:justify-start space-x-8'>

          <Link href='/fashion-trends' className='hover:text-[#F59E0B]'>
            Fashion Trends
          </Link>
          <Link href='/tailors-designers' className='hover:text-[#F59E0B]'>
            Tailors & Designers
          </Link>
          <Link href='/Shop' className='hover:text-[#F59E0B]'>
            Shop
          </Link>
             <Link href='/blog' className='hover:text-[#F59E0B]'>
            Blog
          </Link>
           <Link href='/about' className='hover:text-[#F59E0B]'>
            About Us
          </Link>
          {/* <Link href='/contact' className='hover:text-[#F59E0B]'>
            Contact Us
          </Link> */}
      
          {/* <Link href='/help' className='hover:text-[#F59E0B]'>
            Help Center
          </Link> */}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
