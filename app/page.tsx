// pages/page.tsx
import React from 'react';
import ShowCase from './components/ShowCase';
import NewArrivals from './components/sections/NewArrivals';
import Intro from './components/Intro';
import TopSellers from './components/sections/TopSellers';
import Sketches from './components/sections/Sketches';

const Page: React.FC = () => {
  const categories = [
    {
      image: '/path/to/image1.jpg',
      title: 'Electronics',
      description: 'Latest and trending electronics.',
    },
    {
      image: '/path/to/image2.jpg',
      title: 'Fashion',
      description: 'Stylish outfits and accessories.',
    },
    {
      image: '/path/to/image3.jpg',
      title: 'Home Appliances',
      description: 'Quality appliances for your home.',
    },
    {
      image: '/path/to/image4.jpg',
      title: 'Sports & Outdoors',
      description: 'Gear for your outdoor adventures.',
    },
  ];

  return (
    <div>
      <ShowCase />
      <Intro />
      
      {/* Categories Section */}
      <section className="py-8 px-4">
        <h1 className="text-2xl font-bold mb-4 text-center">Categories</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <div
              key={index}
              className="border rounded-lg overflow-hidden shadow-lg m-4 hover:shadow-xl transition duration-300"
            >
              <img src={category.image} alt={category.title} className="w-full h-40 object-cover" />
              <div className="p-4">
                <h2 className="text-lg font-semibold">{category.title}</h2>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* <NewArrivals />
      <TopSellers />
      <Sketches /> */}
    </div>
  );
};

export default Page;
