'use client'
import React from 'react';

const images = [
  { url: 'https://plus.unsplash.com/premium_photo-1663013425512-23e2050e694d?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', title: 'Explore the Latest Trends' },
];

function ShowCase() {
  return (
    <div className="relative pb-10 max-w-screen-xl mx-auto">
      {images.map((image, index) => (
        <div key={index} className="relative w-full h-96">
          <img src={image.url} alt={image.title} className="w-full h-full object-cover rounded-lg" />
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 p-2 rounded-lg">
            <h3 className="text-lg font-bold text-white">{image.title}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ShowCase;
