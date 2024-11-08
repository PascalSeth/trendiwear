'use client'
import React from 'react';
import Link from 'next/link';

const featuredPost = {
  id: 1,
  category: "Fashion",
  date: "Nov 08, 2023",
  title: "Discover the Latest Trends in Fall Fashion",
  imageUrl: "https://plus.unsplash.com/premium_photo-1683121263622-664434494177?q=80&w=1376&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
};

const sideCards = [
  {
    id: 2,
    category: "STYLE TIPS",
    title: "Become a Style Insider",
    description: "Get exclusive tips and tricks from top fashion experts",
    link: "/membership",
  },
  {
    id: 3,
    imageUrl: "https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=400&fit=crop&q=60",
    title: "See all fashion picks",
    link: "/picks",
  },
];

function BlogIntro() {
  return (
    <section className="w-full p-8 md:p-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-4xl font-bold">Best of the Week</h2>
        <Link href="/blog">
          <h1 className="text-gray-600 hover:underline">See all posts →</h1>
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Featured Post */}
        <div className="col-span-2 relative rounded-lg overflow-hidden shadow-lg">
          <img
            src={featuredPost.imageUrl}
            alt={featuredPost.title}
            className="w-full h-80 object-cover object-center"
          />
          <div className="absolute top-4 left-4 bg-white text-gray-800 text-xs px-3 py-1 rounded-full shadow-md">
            {featuredPost.date}
          </div>
          <div className="absolute top-4 right-4 bg-white text-gray-800 text-xs px-3 py-1 rounded-full shadow-md">
            {featuredPost.category}
          </div>
          <div className="absolute bottom-4 left-4 p-4 bg-white bg-opacity-75 rounded-lg">
            <h3 className="text-2xl font-bold mb-2">{featuredPost.title}</h3>
            <Link href={`/blog/${featuredPost.id}`}>
              <h1 className="text-blue-500 font-semibold hover:underline">Read more →</h1>
            </Link>
          </div>
        </div>

        {/* Side Cards */}
        <div className="flex flex-col gap-6">
          {sideCards.map((card) => (
            <div
              key={card.id}
              className="relative p-4 bg-gray-100 rounded-lg shadow-md flex flex-col justify-between"
            >
              {card.imageUrl ? (
                <img src={card.imageUrl} alt={card.title} className="w-full h-40 object-cover rounded-lg" />
              ) : (
                <div className="text-gray-700 text-sm">{card.category}</div>
              )}
              <h4 className="text-lg font-semibold mt-4">{card.title}</h4>
              {card.description && <p className="text-sm text-gray-600">{card.description}</p>}
              <Link href={card.link}>
                <h1 className="mt-4 text-blue-500 font-semibold hover:underline">{card.imageUrl ? 'See all picks' : 'Learn more →'}</h1>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BlogIntro;
