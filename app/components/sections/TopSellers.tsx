'use client'
import React from 'react';

type Seller = {
  id: number;
  name: string;
  avatarUrl: string;
  sales: number;
};

const topSellers: Seller[] = [
  {
    id: 1,
    name: 'John Doe',
    avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
    sales: 5000,
  },
  {
    id: 2,
    name: 'Jane Smith',
    avatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
    sales: 4800,
  },
  {
    id: 3,
    name: 'Emily Johnson',
    avatarUrl: 'https://randomuser.me/api/portraits/women/3.jpg',
    sales: 4600,
  },
  {
    id: 4,
    name: 'Robert Williams',
    avatarUrl: 'https://randomuser.me/api/portraits/men/4.jpg',
    sales: 4400,
  },
];


function TopSellers() {
  return (
    <div className="top-sellers py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Top Sellers</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {topSellers.map((seller) => (
            <div key={seller.id} className="border p-4 rounded-lg shadow-lg text-center">
              <img
                src={seller.avatarUrl}
                alt={seller.name}
                className="w-24 h-24 mx-auto rounded-full mb-4 border-2 border-green-500"
              />
              <h3 className="text-lg font-semibold text-gray-900">{seller.name}</h3>
              <p className="text-gray-500 text-sm">Sales: ${seller.sales.toLocaleString()}</p>
              <button className="mt-4 bg-[#FFA126] text-white px-4 py-2 rounded-lg hover:bg-green-500">
                View Profile
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TopSellers;
