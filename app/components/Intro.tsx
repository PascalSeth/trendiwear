'use client'
import Link from 'next/link'
import React from 'react'

const featuredItems = [
  {
    image: 'https://images.unsplash.com/photo-1624381805840-a88d1510240d?q=80&w=1538&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Outdoor Active',
  },
  {
    image: 'https://images.unsplash.com/photo-1600328784656-83c7bc673061?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2xvdGhpbmclMjBtb2RlbHxlbnwwfHwwfHx8MA%3D%3D',
    title: 'Casual Comfort',
  },
];

const additionalInspirations = [
  {
    image: 'https://images.unsplash.com/photo-1642447411662-59ab77473a8d?q=80&w=1394&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Say it with style',
  },
  {
    image: 'https://plus.unsplash.com/premium_photo-1682125676787-cb15544ae3c0?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Funky never get old',
  },
  {
    image: 'https://images.unsplash.com/photo-1617258856099-476dcceae20d?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Exotic Style',
  },
];

function Intro() {
  return (
    <div className="p-10 w-full">
      <div className="">
        
        {/* Main Feature Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Feature Card */}
          <div className="lg:col-span-2 relative">
            <div className="bg-gradient-to-br p-5 from-[#FFA126] to-slate-800 h-full flex flex-col justify-center items-center rounded-lg shadow-lg">
              <h3 className="text-lg font-bold text-gray-300">Fashion Inspirations</h3>
              <p className="text-gray-300 mt-2 text-center px-6">
                Explore our gallery of clothing and accessories to find your favorite combinations for  outfits that can inspire you to apply on your daily activity on all occasions.
              </p>
              <Link href={'/fashion-trends'} className="mt-4 bg-black text-white px-4 py-2 rounded">Browse Inspirations</Link>
            </div>
          </div>

          {/* Right Column: Smaller Featured Items */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {featuredItems.map((item, index) => (
              <div key={index} className="relative">
                <img
                  className="w-full h-48 object-cover rounded-lg shadow-lg"
                  src={item.image}
                  alt={item.title}
                />
                <div className="absolute top-0 left-0 bg-white bg-opacity-20 p-4 rounded-br-lg">
                  <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Inspirations Section */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-6">
          {additionalInspirations.map((item, index) => (
            <div key={index} className="relative">
              <img
                className="w-full h-60 object-cover rounded-lg shadow-lg"
                src={item.image}
                alt={item.title}
              />
              <div className="absolute top-0 left-0 bg-white bg-opacity-20 p-4 rounded-br-lg">
                <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Intro
