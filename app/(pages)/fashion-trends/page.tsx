'use client'
import React from 'react';
import ShowCase from './ShowCase';


const trends = [
  { name: 'Vintage Casual', description: 'Retro tees, high-waisted jeans, and vintage sneakers.', image: 'https://images.unsplash.com/photo-1673417785716-1fa1f932066d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2FzdWFsfGVufDB8fDB8fHww' },
  { name: 'Athleisure', description: 'Stylish joggers, crop tops, and sporty accessories.', image: 'https://images.unsplash.com/photo-1470468969717-61d5d54fd036?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YXRobGVpc3VyZXxlbnwwfHwwfHx8MA%3D%3D' },
  { name: 'Bohemian', description: 'Flowy fabrics, earthy tones, maxi dresses, and layered jewelry.', image: 'https://images.unsplash.com/photo-1496440737103-cd596325d314?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGJvaGVtaWFuJTIwZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D' },
  { name: 'Minimalist', description: 'Clean lines, neutral colors, tailored trousers, and basic tees.', image: 'https://images.unsplash.com/photo-1725958019641-4c03ceb5d2db?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fE1pbmltYWxpc3QlMjBmYXNoaW9ufGVufDB8fDB8fHww' },
  { name: 'Streetwear', description: 'Graphic tees, hoodies, baggy pants, and statement sneakers.', image: 'https://images.unsplash.com/photo-1520014321782-49b0fe958b59?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8c3RyZWV0d2VhciUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D' },
  { name: 'Grunge', description: 'Distressed jeans, flannel shirts, and combat boots.', image: 'https://images.unsplash.com/photo-1576193929684-06c6c6a8b582?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z3J1bmdlJTIwZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D' },
  { name: 'Preppy', description: 'Polo shirts, khakis, blazers, and loafers with vibrant colors.', image: 'https://images.unsplash.com/photo-1619042821874-587aa4335f39?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cHJlcHB5JTIwZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D' },
  { name: 'Romantic', description: 'Soft fabrics, lace, puffed sleeves, and pastel colors.', image: 'https://images.unsplash.com/photo-1683717810905-7a56f467e3cf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHJvbWFudGljJTIwZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D' },
  { name: 'Gothic', description: 'Black clothing, leather jackets, heavy boots, and dramatic makeup.', image: 'https://images.unsplash.com/photo-1585328588821-b60f13dda129?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGdvdGhpYyUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D' },
  { name: 'Punk', description: 'Ripped jeans, graphic tees, leather jackets, and bold hairstyles.', image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cHVuayUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D' },
  { name: 'Utility', description: 'Functional clothing like cargo pants, work jackets, and practical footwear.', image: 'https://images.unsplash.com/photo-1587797283885-9a123e3e88a0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8dXRpbGl0eSUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D' },
  { name: 'Western', description: 'Cowboy boots, denim jackets, and plaid shirts with fringe details.', image: 'https://images.unsplash.com/photo-1726516336217-f968f5be76cd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8d2VzdGVybiUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D' },
  { name: 'Sporty Chic', description: 'Blending sporty pieces with casual wear, like tennis skirts and sleek sneakers.', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8U3BvcnR5JTIwQ2hpYyUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D' },
  { name: 'Artisanal', description: 'Unique, handcrafted pieces, often featuring bold prints and textures.', image: 'https://images.unsplash.com/photo-1602591620189-de34d60650b2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGFydGlzYW5hbCUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D' },
  { name: 'Eco-Conscious', description: 'Sustainable materials, upcycled fashion, and earth-toned colors.', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { name: 'Maximalism', description: 'Bold prints, bright colors, and layered textures for a vibrant look.', image: 'https://i.pinimg.com/enabled_hi/564x/6d/58/da/6d58dab3b515128c2d2a9bd095a4364f.jpg' },
  { name: 'Nautical', description: 'Striped tops, sailor pants, and accessories in navy and white colors.', image: 'https://images.unsplash.com/photo-1707237463274-04b6ecfedf45?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2FpbG9yJTIwZHJlc3N8ZW58MHx8MHx8fDA%3D' },
  { name: 'Color Blocking', description: 'Bold, contrasting colors paired together in outfits for a striking look.', image: 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y29sb3IlMjBibG9ja2luZyUyMGZhc2hpb258ZW58MHx8MHx8fDA%3D' },
  { name: 'Edgy', description: 'Leather skirts, ripped tights, and studded accessories for a rebellious vibe.', image: 'https://images.unsplash.com/photo-1726516325355-1fede74140c5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGVkZ3klMjBmYXNoaW9ufGVufDB8fDB8fHww' },
  { name: 'Resort Wear', description: 'Lightweight fabrics, tropical prints, and flowing silhouettes for vacation-ready outfits.', image: 'https://i.pinimg.com/564x/91/cb/ea/91cbea3ddbb294f08998d75f398d6ee1.jpg' },
];

function FashionTrends() {
  return (
    <div className="bg-gray-100  px-4 sm:px-6 lg:px-8">
        <ShowCase/>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Trending Fashion Styles
        </h2>
        <p className="mt-4 max-w-2xl text-xl text-gray-500">
          Discover the latest trends and styles in fashion. Stay updated with the hottest collections!
        </p>

        {/* Fashion Grid */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {trends.map((trend, index) => (
            <div key={index} className="relative">
              <img
                className="w-full h-96 object-cover rounded-lg shadow-lg"
                src={trend.image}
                alt={trend.name}
              />
              <div className="absolute bottom-0 left-0 bg-gray-900 bg-opacity-50 p-4 rounded-b-lg">
                <h3 className="text-lg font-bold text-white">{trend.name}</h3>
                <p className="text-sm text-gray-300">{trend.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FashionTrends;
