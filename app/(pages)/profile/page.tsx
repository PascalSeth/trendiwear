'use client'
import React from 'react';
import CategoryComponent from './Categories';
import CommentSlider from './Comments';

function Profile() {
  return (
    <div className="relative">
      <div className="relative w-full h-screen">
        <img 
          src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1376&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
          alt="Profile Background" 
          className="w-full h-full object-cover object-center" 
        />
        
        {/* For larger screens */}
        <div className="absolute max-lg:hidden top-1/3 right-20 flex flex-col items-center justify-center text-white space-y-4">
          <h3 className="text-5xl font-bold">NEW ARRIVALS</h3>
          <p className="text-sm font-medium tracking-wide">Family Owned | US-Made Fabric | Timeless Design</p>
          <p className="mt-4 text-lg">40,000+ 5 Star Reviews</p>
          <button className="mt-6 px-6 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition duration-300">
            SHOP NOW
          </button>
        </div>

        {/* For smaller screens */}
        <div className="lg:hidden absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-center text-black bg-white bg-opacity-80 px-6 py-4 rounded-md shadow-md space-y-3">
          <h3 className="text-3xl font-bold">NEW ARRIVALS</h3>
          <p className="text-xs font-medium tracking-wide">Family Owned | US-Made Fabric | Timeless Design</p>
          <p className="mt-2 text-base">40,000+ 5 Star Reviews</p>
          <button className="mt-4 px-6 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition duration-300">
            SHOP NOW
          </button>
        </div>
      </div>

      <CategoryComponent/>
      <CommentSlider/>
    </div>
  );
}

export default Profile;
