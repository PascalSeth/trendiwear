'use client'
import React from 'react';
import ShowCase from './ShowCase';

type BlogPost = {
  id: number;
  category: string;
  time?: string;
  title: string;
  description?: string;
  imageUrl: string;
  tags?: string[];
  bgColor?: string;
};

const blogPosts: BlogPost[] = [
  {
    id: 1,
    category: "Gym",
    time: "2:26",
    title: "Best Full-Body Home Gym Machines!",
    imageUrl: "https://plus.unsplash.com/premium_photo-1664202526475-8f43ee70166d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGNsb3RoaW5nfGVufDB8fDB8fHww",
    bgColor: "bg-cover bg-center text-white",
  },
  {
    id: 2,
    category: "Gym",
    title: "Ready, Set, Go! How to Start Running to Stay Fit",
    description: "Walking is recognized as a safe and effective mode of exercise...",
    imageUrl: "",
    bgColor: "bg-green-100",
  },
  {
    id: 3,
    category: "Gym",
    time: "2:26",
    title: "Athletic Training Is Soft and Hard Styles of Training",
    imageUrl: "https://plus.unsplash.com/premium_photo-1664202526475-8f43ee70166d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGNsb3RoaW5nfGVufDB8fDB8fHww",
    bgColor: "bg-cover bg-center text-white",
  },
  {
    id: 4,
    category: "Gym",
    time: "1:20",
    title: "Overcoming Laziness in Sports",
    imageUrl: "https://plus.unsplash.com/premium_photo-1664202526475-8f43ee70166d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGNsb3RoaW5nfGVufDB8fDB8fHww",
    bgColor: "bg-purple-100",
  },
];

const categories = [
  "Medical Knowledge",
  "Bodybuilding",
  "Regain Food",
  "Sickness",
  "Lifestyle",
  "Diet",
  "Diseases",
  "Healthy Food",
];

function Blog() {
  return (
    <div className="bg-white ">
      <ShowCase />
      <h1 className="text-3xl px-10 md:text-4xl font-bold mb-6">Blog</h1>

      <div className="grid p-10 py-2 grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Render the main featured post */}
        {blogPosts.slice(0, 1).map((post) => (
          <div
            key={post.id}
            className={`col-span-1 rounded-lg p-6 ${post.bgColor} bg-cover bg-center`}
            style={{ backgroundImage: post.imageUrl ? `url(${post.imageUrl})` : undefined }}
          >
            <p className="text-sm mb-2">{`Category: ${post.category} | ${post.time}`}</p>
            <h2 className="text-xl md:text-2xl font-bold mb-4">{post.title}</h2>
          </div>
        ))}

        {/* Render the rest of the posts on the right */}
        <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
         
          {/* Categories card */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category, index) => (
                <span key={index} className="bg-yellow-200 text-gray-700 text-sm px-3 py-1 rounded-full">
                  {category}
                </span>
              ))}
            </div>
            <button className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">View All Categories</button>
          </div> {blogPosts.slice(1).map((post) => (
            <div
              key={post.id}
              className={`rounded-lg p-6 ${post.bgColor} bg-cover bg-center`}
              style={{ backgroundImage: post.imageUrl ? `url(${post.imageUrl})` : undefined }}
            >
              <p className="text-sm mb-2">{`Category: ${post.category} ${post.time ? `| ${post.time}` : ""}`}</p>
              <h2 className="text-lg md:text-xl font-bold mb-2">{post.title}</h2>
              {post.description && <p className="text-sm text-gray-700 mb-4">{post.description}</p>}
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}

export default Blog;
