'use client'
import React from 'react';

type ClothingItem = {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  isNew: boolean;
  sellerName: string;
  sellerProfilePicUrl: string;
  category: string; // Added category property
};

const newArrivals: ClothingItem[] = [
  {
    id: 1,
    name: 'Long Sleeve Sweater, Cream and Black Stripe',
    imageUrl: 'https://images.unsplash.com/photo-1510347026072-2c042ed96d42?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    price: 72.00,
    isNew: true,
    sellerName: 'Sophia Turner',
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    category: 'Sweater'
  },
  {
    id: 2,
    name: 'Tatum Turtleneck, Olive',
    imageUrl: 'https://images.unsplash.com/photo-1522751707891-45b4e281010d?q=80&w=1528&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    price: 54.00,
    isNew: true,
    sellerName: 'Emma Brown',
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/45.jpg',
    category: 'Turtleneck'
  },
  {
    id: 3,
    name: 'Sabrina Ribbed Pullover, Dusty Rose',
    imageUrl: 'https://images.unsplash.com/photo-1647688574769-c2e78f477719?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    price: 54.00,
    isNew: true,
    sellerName: 'Olivia White',
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/46.jpg',
    category: 'Pullover'
  },
  {
    id: 4,
    name: 'Sabrina Ribbed Turtleneck, White',
    imageUrl: 'https://media.istockphoto.com/id/1186159221/photo/handsome-man-posing-in-knitted-sweater-isolated-on-grey.webp?s=1024x1024&w=is&k=20&c=sm27ONxDvDngmt0OQnPToEgkCvpT1OjCVVWHv2KIq0g=',
    price: 54.00,
    isNew: true,
    sellerName: 'Amelia Johnson',
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/47.jpg',
    category: 'Turtleneck'
  },
];

function NewArrivals() {
  return (
    <div className="new-arrivals p-8 bg-gray-100">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-4xl font-bold text-gray-900">New Fashion Arrivals</h2>
        <button className="text-lg text-blue-600 hover:underline font-medium">View All</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 px-4">
        {newArrivals.map((item) => (
          <div
            key={item.id}
            className="group relative border rounded-xl overflow-hidden shadow-lg transition-transform duration-300 transform hover:scale-105 bg-white"
          >
            {/* Image Section */}
            <div className="relative">
              {item.isNew && (
                <span className="absolute top-4 left-4 bg-[#FFA126] text-white px-3 py-1 text-xs font-bold rounded-lg shadow-sm">
                  NEW
                </span>
              )}
              <span className="absolute top-4 right-4 bg-gray-800 text-white px-3 py-1 text-xs rounded-lg shadow-sm">
                {item.category}
              </span>
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-80 object-cover rounded-t-xl"
              />

              {/* Seller Information Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-transparent to-transparent">
                <div className="flex items-center">
                  <img
                    src={item.sellerProfilePicUrl}
                    alt={item.sellerName}
                    className="w-10 h-10 rounded-full border-2 border-white mr-3"
                  />
                  <div>
                    <p className="text-white text-sm font-medium">{item.sellerName}</p>
                    <p className="text-xs text-gray-300">Verified Seller</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Information */}
            <div className="p-3">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">{item.name}</h3>
              <p className="text-lg font-medium text-gray-600 mt-2">${item.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NewArrivals;
