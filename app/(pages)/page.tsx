// pages/page.tsx
import React from 'react';
import ShowCase from '../components/ShowCase';
import TopSellers from '../components/sections/TopSellers';
import NewArrivals from '../components/sections/NewArrivals';
import BlogIntro from '../components/sections/BlogIntro';
import FashionInspo from '../components/Intro';

const Page: React.FC = () => {
  return (
    <div className='w-full min-h-screen'>
      {/* Hero Section - First Impression */}
      <ShowCase />

      {/* Fashion Inspiration - Educational Content */}
      <section className="relative">
        <FashionInspo />
      </section>    
      {/* Top Sellers - Social Proof */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white -z-10" />
        <TopSellers />
      </section>


  {/* New Arrivals - Fresh Content */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50/50 -z-10" />
        <NewArrivals />
      </section>

      {/* Blog Content - Additional Insights */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-slate-50/30 -z-10" />
        <BlogIntro />
      </section>
    </div>
  );
};

export default Page;
