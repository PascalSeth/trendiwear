'use client'
import { ArrowLeft, ArrowRight } from 'lucide-react';
import React from 'react';
import Slider from 'react-slick';

interface Comment {
  name: string;
  title: string;
  content: string;
  verified: boolean;
}

const comments: Comment[] = [
  {
    name: 'TONYA H',
    title: 'MY FIRST ORDER',
    content: 'This was my first order with Albion Fit and I’m impressed. I’ll be coming back to see the new arrivals!',
    verified: true,
  },
  {
    name: 'SARAH S',
    title: 'LOVE LOVE LOVE ALBION!!!',
    content: 'Love love love Albion clothes!! Only suits I buy now!!',
    verified: true,
  },
  {
    name: 'MARTHA P',
    title: 'BEST STORE!',
    content: 'Best store! Best owners and employees. You can tell they sincerely care about their shoppers.',
    verified: true,
  },
];

const CommentSlider = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    nextArrow: <ArrowLeft className="text-gray-600" />,
    prevArrow: <ArrowRight className="text-gray-600" />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="py-12 max-w-6xl mx-auto">
      <h2 className="text-3xl font-semibold text-center mb-8">Beloved by Thousands</h2>
      <Slider {...settings}>
        {comments.map((comment, index) => (
          <div key={index} className="p-6 flex items-center">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="flex justify-center mb-3">
                <span className="text-yellow-400 flex items-center">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                        <path d="M12 17.27l6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                </span>
              </div>
              <h3 className="text-lg font-bold">{comment.title}</h3>
              <p className="text-gray-500 mb-4">{comment.content}</p>
              <p className="text-sm font-semibold">{comment.name}</p>
              {comment.verified && (
                <p className="text-xs text-gray-400">
                  <span className="inline-block mr-1">✔</span> Verified Buyer
                </p>
              )}
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default CommentSlider;
