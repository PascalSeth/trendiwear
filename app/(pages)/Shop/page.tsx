'use client';
import Image from 'next/image';
import React from 'react';

const categories = [
  { name: 'Men', imageUrl: 'https://media.istockphoto.com/id/1217805751/photo/thrift-store-shopping.jpg?s=1024x1024&w=is&k=20&c=gJm2CH3TrX6AImHhUD592jrUHHAUgG-7VnNcIiVAtCo=' },
  { name: 'Women', imageUrl: 'https://media.istockphoto.com/id/1421055695/photo/woman-selecting-clothes-from-her-wardrobe-for-donating-to-a-charity-shop-decluttering-sorting.jpg?s=1024x1024&w=is&k=20&c=zjQJMrArYs9sqSX7bS7R89gaw-SNDYflLqmJOVWbpVo=' },
  { name: 'Accessories', imageUrl: 'https://media.istockphoto.com/id/650233226/photo/military-style-watch.jpg?s=1024x1024&w=is&k=20&c=b6URueLYS6uPlDHVA8hDtvmgFxdcMsWl-n9MWtlmX7o=' },
  { name: 'Shoes', imageUrl: 'https://plus.unsplash.com/premium_photo-1682435561654-20d84cef00eb?q=80&w=1436&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
];

const featuredProducts = [
  { id: 1, name: 'Product 1', price: 99.99, imageUrl: 'https://media.istockphoto.com/id/1307867160/photo/comfortably-in-love.jpg?s=612x612&w=0&k=20&c=tFrZfbrjPjLrj1xkDf3OBUqxDjOUvpbbzYkzaiGVINs=', category: 'Accessories', sellerName: 'Sophia Turner', isNew: true, sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: 2, name: 'Product 2', price: 119.99, imageUrl: 'https://media.istockphoto.com/id/658909998/photo/jacket-dude.jpg?s=612x612&w=0&k=20&c=TlVOCoC0qCh--Gi0q0CWxIwmUZQIgNFQOlYR-CAa6qo=', category: 'Men', sellerName: 'Emma Brown', isNew: false, sellerProfilePicUrl: 'https://randomuser.me/api/portraits/men/45.jpg' }, 
  { id: 2, name: 'Product 3', price: 9.99, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2hvZXN8ZW58MHx8MHx8fDA%3D', category: 'Men', sellerName: 'Emma Brown', isNew: false, sellerProfilePicUrl: 'https://randomuser.me/api/portraits/men/45.jpg' },
  { id: 2, name: 'Product 4', price: 19.99, imageUrl: 'https://media.istockphoto.com/id/1492086083/photo/fashionable-young-woman-adjusting-her-elegant-hat-while-sitting-on-a-chair-against-brown.jpg?s=612x612&w=0&k=20&c=SA2HlhKwJIgBzpzifkSSuNeJag1eBiiBVof_imXgfU8=', category: 'Men', sellerName: 'Emma Brown', isNew: false, sellerProfilePicUrl: 'https://randomuser.me/api/portraits/men/45.jpg' },
];

const trendingProducts = [
  { id: 3, name: 'Trending 1', price: 89.99, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2hvZXN8ZW58MHx8MHx8fDA%3D', category: 'Shoes', sellerName: 'Olivia White', isNew: true, sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/46.jpg' },
  { id: 4, name: 'Trending 2', price: 109.99, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2hvZXN8ZW58MHx8MHx8fDA%3D', category: 'Accessories', sellerName: 'Amelia Johnson', isNew: false, sellerProfilePicUrl: 'https://randomuser.me/api/portraits/men/47.jpg' },
  // add other trending products here
];

function ProductSection({ title, products }: { title: string; products: typeof featuredProducts }) {
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <div key={product.id} className="relative border rounded-xl overflow-hidden shadow-lg transform transition-transform hover:scale-105 bg-white">
            {/* Image and Category Badge */}
            <div className="relative">
              {product.isNew && <span className="absolute top-4 left-4 bg-[#FFA126] text-white px-3 py-1 text-xs font-bold rounded-lg">NEW</span>}
              <span className="absolute top-4 right-4 bg-gray-800 text-white px-3 py-1 text-xs rounded-lg">{product.category}</span>
              <img src={product.imageUrl} alt={product.name} className="w-full h-60 object-cover rounded-t-xl" />
              
              {/* Seller Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-transparent to-transparent">
                <div className="flex items-center">
                  <img src={product.sellerProfilePicUrl} alt={product.sellerName} className="w-10 h-10 rounded-full border-2 border-white mr-3" />
                  <div>
                    <p className="text-white text-sm font-medium">{product.sellerName}</p>
                    <p className="text-xs text-gray-300">Verified Seller</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-3">
              <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
              <p className="text-lg font-medium text-gray-600 mt-2">${product.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const Page = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    {/* Showcase Section */}
    <div className="mb-12">
      <Image width={1600} height={400} src="https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=1600&auto=format&fit=crop&q=75" alt="Fashion Showcase" className="w-full h-60 md:h-96 object-cover rounded-lg shadow-lg" />
    </div>

    {/* Categories Section */}
    <section id="categories" className="mb-16">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">Categories</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {categories.map((category) => (
          <div key={category.name} className="relative overflow-hidden rounded-lg shadow-lg hover:scale-105 transition-transform">
            <img src={category.imageUrl} alt={category.name} className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <h3 className="text-xl font-semibold text-white">{category.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Featured Products Section */}
    <ProductSection title="Featured Products" products={featuredProducts} />

    {/* Trending Products Section */}
    <ProductSection title="Trending Now" products={trendingProducts} />

    {/* Footer */}
    <footer className="text-center text-gray-600 mt-16">
      <p>&copy; 2024 Fashion Shop. All rights reserved.</p>
    </footer>
  </div>
);

export default Page;
