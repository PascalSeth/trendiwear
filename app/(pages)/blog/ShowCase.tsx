'use client';
import Image from 'next/image';
import React from 'react';

const images = [
  {
    url: 'https://images.unsplash.com/photo-1485125639709-a60c3a500bf1?w=1600&auto=format&fit=crop&q=75',
    category: 'Fashion',
    title: 'On TikTok A New Kind Of Fashion Influencer Is Born',
    author: 'FRANCES SOLÁ-SANTIAGO'
  },
];

function ShowCase() {
  return (
    <div className="relative pb-10 w-full">
      {images.map((image, index) => (
        <div key={index} className="relative w-full h-[80vh] max-lg:h-[65vh]">
          <Image
            width={1600}
            height={600}
            src={image.url}
            alt={image.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 p-6 bg-gradient-to-t from-black to-transparent w-full">
            <h2 className="text-4xl font-bold text-white mb-2">Fashion Blogs</h2>
            <p className="text-sm font-semibold text-white uppercase mb-1">{image.category}</p>
            <h3 className="text-2xl font-bold text-white mb-2">{image.title}</h3>
            <p className="text-sm text-white">by {image.author}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ShowCase;
