'use client'
import React, { useState } from 'react';

const categories = [
  { name: 'Best Sellers', items: [
      { id: 1, title: 'Black Bomber', price: '$98.00', img: 'https://images.unsplash.com/photo-1656077727614-0ddda354698e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2xvdGhpbmclMjBtb2RlbHxlbnwwfHwwfHx8MA%3D%3D', tag: 'BEST SELLER' },
      { id: 2, title: 'Bomber Jacket, Camo', price: '$98.00', img: 'https://images.unsplash.com/photo-1656077727614-0ddda354698e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2xvdGhpbmclMjBtb2RlbHxlbnwwfHwwfHx8MA%3D%3D' },
      { id: 3, title: 'Sage Bomber Jacket', price: '$98.00', img: 'https://images.unsplash.com/photo-1656077727614-0ddda354698e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2xvdGhpbmclMjBtb2RlbHxlbnwwfHwwfHx8MA%3D%3D' },
      { id: 4, title: 'Midnight Dash Bomber Jacket', price: '$98.00', img: 'https://images.unsplash.com/photo-1656077727614-0ddda354698e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2xvdGhpbmclMjBtb2RlbHxlbnwwfHwwfHx8MA%3D%3D' }
    ] 
  },
  { name: 'The Jetsetters', items: [ /* Other products */ ] },
  { name: 'Bomber Jacket', items: [ /* Other products */ ] },
  { name: 'One Piece Swimsuits', items: [ /* Other products */ ] },
];

function CategoryComponent() {
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  return (
    <div className="container mx-auto my-10">
      <h2 className="text-center text-3xl font-bold mb-6">BEST SELLERS</h2>
      
      {/* Category Tabs */}
      <div className="flex justify-center space-x-8 border-b mb-6">
        {categories.map((category, index) => (
          <button
            key={index}
            onClick={() => setActiveCategory(category)}
            className={`pb-2 ${activeCategory.name === category.name ? 'border-b-2 border-black' : ''} hover:text-gray-600`}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      {/* Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {activeCategory.items.map((item) => (
          <div key={item.id} className="text-center">
            <div className="relative">
              <img src={item.img} alt={item.title} className="w-full h-64 object-cover rounded-md" />
              {item.tag && (
                <div className="absolute top-2 left-2 bg-white text-black px-2 py-1 text-xs rounded-md">
                  {item.tag}
                </div>
              )}
            </div>
            <h3 className="mt-4 font-semibold text-lg">{item.title}</h3>
            <p className="mt-1 text-gray-700">{item.price}</p>
          </div>
        ))}
      </div>

      {/* Shop All Button */}
      <div className="flex justify-center mt-10">
        <button className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition">
          SHOP ALL {activeCategory.name.toUpperCase()}
        </button>
      </div>
    </div>
  );
}

export default CategoryComponent;
