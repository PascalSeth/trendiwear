'use client'
import Image from 'next/image';
import React from 'react';

const images = [
  { url: 'https://images.unsplash.com/photo-1470309864661-68328b2cd0a5?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', title: 'Explore the Latest Trends' },
];

function ShowCase() {
  return (
    <div className="relative p-5 max-w-screen-xl mx-auto">
      {images.map((image, index) => (
        <div key={index} className="relative w-full h-96">
          <Image
            width={1950}
            height={600}
            src={image.url}
            alt={image.title}
            className="w-full h-full object-cover rounded-lg shadow-lg"
        />
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 p-2 rounded-lg">
            <h3 className="text-lg font-bold text-white">{image.title}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ShowCase;

