'use client';
import React from 'react';
import Slider from "react-slick";
import { motion } from 'framer-motion';

const images = [
  { 
    url: 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2xvdGhpbmd8ZW58MHx8MHx8fDA%3D', 
    title: 'Explore the Latest Trends',
    description: 'Influential, innovative, and progressive. Versace is reinventing fashion for a unique look.'
  },
  { 
    url: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y2xvdGhpbmd8ZW58MHx8MHx8fDA%3D', 
    title: 'Stylish and Comfortable',
    description: 'Feel stylish yet comfortable in our modern fashion choices.'
  },
  { 
    url: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGNsb3RoaW5nfGVufDB8fDB8fHww', 
    title: 'Discover Your New Look',
    description: 'Unleash the latest trends and create your unique style.'
  }
];

function ShowCase() {

  const settings = {
    dots: false,
    infinite: true,
    autoplay: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,

  };

  return (
    <div className="relative max-w-7xl w-full overflow-hidden rounded-[2pc] mx-auto">
      <Slider {...settings} className='rounded-[2pc] w-full max-lg:px-5'>
        {images.map((image, index) => (
          <div key={index} className="relative w-full rounded-[2pc] h-[80vh] max-lg:h-96">
            <img src={image.url} alt={image.title} className="w-full rounded-[2pc] h-full object-cover" />
            {/* Partial shadow overlay */}
            <div className="absolute inset-0 flex flex-col items-start justify-center text-white text-left p-6" style={{ background: 'linear-gradient(to top, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0))' }}>
              <motion.h2 
                className="text-3xl sm:text-5xl font-bold mb-4"
                initial={{ opacity: 0, y: 50 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {image.title}
              </motion.h2>
              <motion.p 
                className="mb-6 text-lg sm:text-xl"
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                {image.description}
              </motion.p>
              <motion.div 
                className="flex space-x-4"
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <motion.button 
                  className="px-6 py-2 bg-white text-black rounded-full hover:bg-gray-300 transition"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  Shop Now
                </motion.button>
                <motion.button 
                  className="px-6 py-2 bg-white text-black rounded-full hover:bg-gray-300 transition"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  Find Out More
                </motion.button>
              </motion.div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default ShowCase;
