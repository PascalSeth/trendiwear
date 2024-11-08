import Image from 'next/image';
import React from 'react';

type Props = {}

// Arrays for categories, featured products, and trending products
const categories = [
  { name: 'Men', imageUrl: 'https://source.unsplash.com/random/400x400?men-fashion' },
  { name: 'Women', imageUrl: 'https://source.unsplash.com/random/400x400?women-fashion' },
  { name: 'Accessories', imageUrl: 'https://source.unsplash.com/random/400x400?accessories' },
  { name: 'Shoes', imageUrl: 'https://source.unsplash.com/random/400x400?shoes' },
];

const featuredProducts = [
  { name: 'Product 1', price: '$99.99', imageUrl: 'https://source.unsplash.com/random/400x400?fashion-1' },
  { name: 'Product 2', price: '$129.99', imageUrl: 'https://source.unsplash.com/random/400x400?fashion-2' },
  { name: 'Product 3', price: '$79.99', imageUrl: 'https://source.unsplash.com/random/400x400?fashion-3' },
  { name: 'Product 4', price: '$89.99', imageUrl: 'https://source.unsplash.com/random/400x400?fashion-4' },
];

const trendingProducts = [
  { name: 'Trending 1', price: '$89.99', imageUrl: 'https://source.unsplash.com/random/200x300?fashion-5' },
  { name: 'Trending 2', price: '$109.99', imageUrl: 'https://source.unsplash.com/random/200x300?fashion-6' },
  { name: 'Trending 3', price: '$119.99', imageUrl: 'https://source.unsplash.com/random/200x300?fashion-7' },
  { name: 'Trending 4', price: '$69.99', imageUrl: 'https://source.unsplash.com/random/200x300?fashion-8' },
];

const Page: React.FC<Props> = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Showcase Section */}
      <div className="mb-12">
        <Image
          width={1600}
          height={400}
          src="https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=1600&auto=format&fit=crop&q=75"
          alt="Fashion Showcase"
          className="w-full h-60 md:h-96 object-cover rounded-lg shadow-lg"
        />
      </div>

      {/* Categories Section */}
      <section id="categories" className="mb-16">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.name}
              className="bg-white shadow-lg rounded-lg overflow-hidden hover:scale-105 transform transition-transform duration-300"
            >
              <img src={category.imageUrl} alt={category.name} className="w-full h-40 object-cover" />
              <h3 className="text-xl font-medium text-gray-700 p-4">{category.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="featured" className="mb-16">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">Featured Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.map((product) => (
            <div key={product.name} className="bg-white shadow-lg rounded-lg overflow-hidden">
              <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-800">{product.name}</h3>
                <p className="text-gray-600">{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Products Section */}
      <section id="trending" className="mb-16">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">Trending Now</h2>
        <div className="flex space-x-4 overflow-x-scroll py-4">
          {trendingProducts.map((product) => (
            <div
              key={product.name}
              className="bg-white shadow-lg rounded-lg overflow-hidden min-w-[200px] hover:scale-105 transform transition-transform duration-300"
            >
              <img src={product.imageUrl} alt={product.name} className="w-full h-60 object-cover" />
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-800">{product.name}</h3>
                <p className="text-gray-600">{product.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-600 mt-16">
        <p>&copy; 2024 Fashion Shop. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Page;
