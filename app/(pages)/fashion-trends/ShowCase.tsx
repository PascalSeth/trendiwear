'use client'
import React from 'react';
import Slider from "react-slick";

const images = [
  { url: 'https://images.unsplash.com/photo-1444942436885-ca7deb7d9a33?w=1200&auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGNhc3VhbHxlbnwwfHwwfHx8MA%3D%3D', title: 'Explore the Latest Trends' },
  { url: 'https://images.unsplash.com/photo-1453858273663-c1df03018e67?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8ZmFzaW9ufGVufDB8fDB8fHww', title: 'Stylish and Comfortable' },
  { url: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=1200&auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGNsb3RoaW5nfGVufDB8fDB8fHww', title: 'Discover Your New Look' }
];

function ShowCase() {
  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
  };

  return (
    <div className="relative pb-3 max-w-screen-xl mx-auto">
      <Slider {...settings}>
        {images.map((image, index) => (
          <div key={index} className="relative w-full h-96">
            <img src={image.url} alt={image.title} className="w-full h-full object-cover rounded-lg" />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 p-2 rounded-lg">
              <h3 className="text-lg font-bold text-white">{image.title}</h3>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default ShowCase;
