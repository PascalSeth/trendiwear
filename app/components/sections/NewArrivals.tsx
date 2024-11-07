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
};

const newArrivals: ClothingItem[] = [
  {
    id: 1,
    name: 'Long Sleeve Sweater, Cream and Black Stripe',
    imageUrl: 'https://images.unsplash.com/photo-1600328784656-83c7bc673061?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2xvdGhpbmclMjBtb2RlbHxlbnwwfHwwfHx8MA%3D%3D',
    price: 72.00,
    isNew: true,
    sellerName: 'Sophia Turner',
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    id: 2,
    name: 'Tatum Turtleneck, Olive',
    imageUrl: 'https://images.unsplash.com/photo-1600328784656-83c7bc673061?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2xvdGhpbmclMjBtb2RlbHxlbnwwfHwwfHx8MA%3D%3D',
    price: 54.00,
    isNew: true,
    sellerName: 'Emma Brown',
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/45.jpg',
  },
  {
    id: 3,
    name: 'Sabrina Ribbed Pullover, Dusty Rose',
    imageUrl: 'https://images.unsplash.com/photo-1600328784656-83c7bc673061?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2xvdGhpbmclMjBtb2RlbHxlbnwwfHwwfHx8MA%3D%3D',
    price: 54.00,
    isNew: true,
    sellerName: 'Olivia White',
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/46.jpg',
  },
  {
    id: 4,
    name: 'Sabrina Ribbed Turtleneck, White',
    imageUrl: 'https://images.unsplash.com/photo-1600328784656-83c7bc673061?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2xvdGhpbmclMjBtb2RlbHxlbnwwfHwwfHx8MA%3D%3D',
    price: 54.00,
    isNew: true,
    sellerName: 'Amelia Johnson',
    sellerProfilePicUrl: 'https://randomuser.me/api/portraits/women/47.jpg',
  },
];


function NewArrivals() {
  return (
    <div className="new-arrivals max-w-screen-xl mx-auto py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">New Fashion Arrivals</h2>
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
                    className="w-12 h-12 rounded-full border-2 border-white mr-3"
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
