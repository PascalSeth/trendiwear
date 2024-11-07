'use client'
import React from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ArrowLeft, ArrowRight } from 'lucide-react';

const categories = [
  { name: 'Sunglasses', image: 'image_url_1' },
  { name: 'Digital Watches', image: 'image_url_2' },
  { name: 'Fashion Jewelry Sets', image: 'image_url_3' },
  { name: 'Quartz Watches', image: 'image_url_4' },
  { name: 'Hairgrips', image: 'image_url_5' },
  { name: 'Hairbands', image: 'image_url_6' },
  { name: 'Fashion Stud Earrings', image: 'image_url_7' },
  { name: 'Hair Clips', image: 'image_url_8' },
  // Add more categories as needed
];

const dresses = [
  { id: 1, name: 'Dress 1', price: '$49.99', image: 'dress_image_url_1' },
  { id: 2, name: 'Dress 2', price: '$59.99', image: 'dress_image_url_2' },
  // Add more dress data here
];

function Shop() {
  const NextArrow = (props:any) => {
    const { onClick } = props;
    return (
      <div
        onClick={onClick}
        className="p-3 right-3 absolute top-1/2 transform -translate-y-1/2 bg-white cursor-pointer rounded-full shadow-lg z-20"
        style={{ marginRight: '-20px' }} // moves arrow outside the carousel
      >
        <ArrowRight />
      </div>
    );
  };

  const PrevArrow = (props:any) => {
    const { onClick } = props;
    return (
      <div
        onClick={onClick}
        className="p-3 left-3 absolute top-1/2 transform -translate-y-1/2 bg-white cursor-pointer rounded-full shadow-lg z-20"
        style={{ marginLeft: '-20px' }} // moves arrow outside the carousel
      >
        <ArrowLeft />
      </div>
    );
  };

  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 7,
    slidesToScroll: 1,
    arrows: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 5 }
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 3 }
      }
    ]
  };

  return (
    <div className="shop-container flex flex-col">
      {/* Categories Carousel */}
      <div className="categories-carousel p-4  bg-gray-100 relative">
        <Slider {...settings}>
          {categories.map((category, index) => (
            <div key={index} className="justify-center px-10  w-full flex flex-col  items-center">
              <img
                src={category.image}
                alt={category.name}
                className="w-16 h-16 rounded-full object-cover mb-2 border-2 border-gray-300"
              />
              <span className="text-center text-sm font-medium">{category.name}</span>
            </div>
          ))}
        </Slider>
      </div>

      {/* Main Content */}
      <div className="main-content flex mt-8">
        
        {/* Filter Section */}
        <div className="filter-section w-1/4 p-4">
          <h2 className="font-semibold mb-4">Refine By</h2>
          <div className="filter-category mb-4">
            <h3 className="font-semibold">Style</h3>
            <label className="flex items-center mt-2">
              <input type="checkbox" className="mr-2" /> Bodycon Dress (4646)
            </label>
            {/* Add more filters as needed */}
          </div>
          <button className="mt-4 p-2 bg-black text-white rounded-lg">Hide Filters</button>
        </div>

        {/* Dresses Display Section */}
        <div className="dresses-display w-3/4 p-4">
          <div className="flex justify-between items-center mb-4">
            <span>6845 Style(s)</span>
            <div className="flex items-center">
              <span className="mr-2">Sort By:</span>
              <select className="border p-2">
                <option>Must Haves</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                {/* Add more sorting options if needed */}
              </select>
            </div>
          </div>

          {/* Grid of Dresses */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {dresses.map((dress) => (
              <div key={dress.id} className="dress-item">
                <img src={dress.image} alt={dress.name} className="w-full h-auto mb-2" />
                <h4 className="font-semibold">{dress.name}</h4>
                <p className="text-pink-600">{dress.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Shop;
