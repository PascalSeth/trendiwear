'use client'
import React from 'react';
import ShowCase from './ShowCase';

// Dummy data for tailors and designers
const professionals = [
  {
    id: '1',
    name: 'Esha Mirza',
    profession: 'Fashion Researcher',
    experience: '8 years',
    rating: 4.9,
    reviews: 12,
    price: 15,
    portfolioUrl: '/portfolio/esha-mirza',
    contactEmail: 'esha@example.com',
    location: 'New York, NY',
    imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dGFpbG9yJTIwcHJvZmlsZSUyMHBpY3xlbnwwfHwwfHx8MA%3D%3D',
    businessImage: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2xvdGhpbmd8ZW58MHx8MHx8fDA%3D',
  },
  {
    id: '2',
    name: 'Sara',
    profession: 'Instagram Influencer',
    experience: '5 years',
    rating: 4.9,
    reviews: 359,
    price: 5,
    portfolioUrl: '/portfolio/sara',
    contactEmail: 'sara@example.com',
    location: 'Los Angeles, CA',
    imageUrl: 'https://images.unsplash.com/photo-1505033575518-a36ea2ef75ae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D',
    businessImage: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8ZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D',
  },
  {
    id: '3',
    name: 'Digital Sonam',
    profession: 'Fashion Writer',
    experience: '10 years',
    rating: 5.0,
    reviews: 3,
    price: 50,
    portfolioUrl: '/portfolio/digital-sonam',
    contactEmail: 'sonam@example.com',
    location: 'Chicago, IL',
    imageUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D',
    businessImage: 'https://media.istockphoto.com/id/1830028076/photo/poster-contemporary-art-collage-women-and-men-dancing-dressed-retro-clothes-bright-comics.webp?a=1&b=1&s=612x612&w=0&k=20&c=G7KNItd4ZS4qj7ro5hRfnG7x7LaQiPVt-nIpAEh7a4s=',
  },
  {
    id: '4',
    name: 'Mark',
    profession: 'Content Marketer',
    experience: '4 years',
    rating: 4.0,
    reviews: 51,
    price: 5,
    portfolioUrl: '/portfolio/mark',
    contactEmail: 'mark@example.com',
    location: 'Miami, FL',
    imageUrl: 'https://images.unsplash.com/photo-1533636721434-0e2d61030955?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D/images/designer2.jpg',
    businessImage: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGZhc2hpb258ZW58MHx8MHx8fDA%3D',
  },
];


function Page() {
  return (
    <div className="w-full h-full px-4 pt-0 py-8">
      <div>
        <ShowCase/>
      </div>
      <h1 className="text-4xl font-bold mb-8  text-gray-800">Tailors & Designers</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {professionals.map((professional) => (
          <div key={professional.id} className="bg-white shadow-lg rounded-lg overflow-hidden transition-transform duration-300 hover:shadow-xl">
            <img
              src={professional.businessImage}
              alt={`${professional.name}'s business`}
              className="w-full h-48 object-cover"
            />
            <div className="flex justify-center">
              <img
                src={professional.imageUrl}
                alt={`${professional.name}'s profile`}
                className="w-24 h-24 rounded-full border-4 border-white -mt-12 object-cover"
              />
            </div>
            <div className="p-2">
              <div className='flex items-center justify-between'>
              <h2 className="text-xl font-semibold text-gray-800">{professional.name}</h2>
              <div className="text-yellow-500">{'★'.repeat(Math.round(professional.rating))}</div> 
              </div>
              <div className='flex items-center justify-between'>
                  <p className="text-gray-500">{professional.profession}</p>
              <p className=" text-gray-700"> {professional.experience}</p>
               
              </div>
         </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Page;
