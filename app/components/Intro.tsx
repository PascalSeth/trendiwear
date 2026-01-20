'use client'
import React from 'react';
import Image from 'next/image';
import { ArrowUpRight, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const fashionCategories = [
  {
    id: 'casual',
    title: 'Casual Chic',
    description: 'Effortless everyday elegance',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1471&auto=format&fit=crop',
  },
  {
    id: 'athleisure',
    title: 'Athleisure',
    description: 'Stylish joggers & sporty vibes',
    image: 'https://images.unsplash.com/photo-1470468969717-61d5d54fd036?w=800&q=80',
  },
  {
    id: 'bohemian',
    title: 'Boho Spirit',
    description: 'Free-spirited, artistic vibes',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1420&auto=format&fit=crop',
  },
  {
    id: 'minimalist',
    title: 'Minimalist',
    description: 'Clean lines, tailored pieces',
    image: 'https://images.unsplash.com/photo-1725958019641-4c03ceb5d2db?w=800&q=80',
  },
  {
    id: 'streetwear',
    title: 'Urban Edge',
    description: 'Contemporary street fashion',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1470&auto=format&fit=crop',
  },
  {
    id: 'grunge',
    title: 'Grunge',
    description: 'Distressed & rebellious',
    image: 'https://images.unsplash.com/photo-1576193929684-06c6c6a8b582?w=800&q=80',
  },
  {
    id: 'romantic',
    title: 'Romantic',
    description: 'Soft fabrics & delicate details',
    image: 'https://images.unsplash.com/photo-1683717810905-7a56f467e3cf?w=800&q=80',
  },
  {
    id: 'punk',
    title: 'Punk',
    description: 'Bold & statement-making',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80',
  },
];

function FashionInspo() {

  // Helper to assign random "scatter" styles based on index
  const getScatterClass = (index: number) => {
    switch (index % 8) {
      case 0: return 'md:col-span-2 md:row-span-2'; // Hero Item
      case 1: return 'md:col-span-1 md:row-span-1 translate-y-12 -rotate-1'; // Shifted Down
      case 2: return 'md:col-span-1 md:row-span-2 -translate-y-6 rotate-1'; // Tall, shifted up
      case 3: return 'md:col-span-2 md:row-span-1 translate-y-4'; // Wide
      case 4: return 'md:col-span-1 md:row-span-1 translate-y-16 rotate-1'; // Shifted down
      case 5: return 'md:col-span-1 md:row-span-1'; // Normal
      case 6: return 'md:col-span-1 md:row-span-2'; // Tall
      case 7: return 'md:col-span-1 md:row-span-1 -translate-y-8'; // Shifted Up
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] py-24 px-6 md:px-12 relative overflow-hidden">
      
      {/* Subtle Pattern Background */}
      <div className="fixed inset-0 pointer-events-none opacity-40" 
        style={{ backgroundImage: 'rad-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10">
        {/* Editorial Header */}
        <header className="mb-20 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="font-mono text-xs uppercase tracking-widest text-stone-400">Lookbook 2024</span>
              <div className="h-px w-12 bg-stone-400"></div>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-medium text-stone-900 leading-[0.9]">
              Moodboard
            </h1>
          </div>
          <div className="max-w-sm text-right hidden md:block mt-6">
            <p className="font-serif text-lg italic text-stone-600 leading-relaxed">
              A curated collection of aesthetics, textures, and forms defining the current season.
            </p>
          </div>
        </header>

        {/* SCATTERED LAYOUT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[280px] gap-6 pb-32">
          {fashionCategories.map((category, index) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              key={category.id}
              className={cn(
                "group relative cursor-pointer",
                getScatterClass(index)
              )}
            >
              {/* The "Polaroid" / "Cutout" Container */}
              <div className="absolute inset-0 bg-white border border-stone-200 shadow-xl transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl">
                <div className="relative w-full h-full overflow-hidden bg-stone-100">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover transition-all duration-700 grayscale group-hover:grayscale-0 group-hover:scale-105"
                  />
                  
                  {/* Dark Overlay on Hover for Text Readability */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-multiply" />

                  {/* Content Overlay */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex justify-between items-start">
                      <span className="bg-white/90 backdrop-blur px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-stone-900">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-serif text-white font-medium leading-none drop-shadow-sm">
                        {category.title}
                      </h3>
                      <p className="text-white/90 text-sm mt-2 font-light line-clamp-2">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Static Content (Visible when not hovered) - Floating outside the "card" */}
              <div className="absolute -bottom-6 left-6 z-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-0">
                <span className="bg-stone-900 text-white px-4 py-2 text-xs font-mono uppercase tracking-widest">
                  {category.title.split(' ')[0]}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Asymmetric CTA Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center border-t border-stone-200 pt-20">
          {/* Left: Text */}
          <div className="lg:col-span-7 space-y-8">
            <div className="flex items-center gap-4">
               <span className="font-mono text-xs uppercase tracking-widest text-stone-500">Personal Styling</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-serif text-stone-900 leading-tight">
              Find Your <br/>
              <span className="italic text-stone-600">Signature Style</span>
            </h2>
            <p className="text-stone-600 text-lg font-light max-w-lg leading-relaxed">
              Not sure which aesthetic fits your personality? Our AI-powered quiz analyzes your preferences and curates a bespoke collection tailored just for you.
            </p>
            
            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-4xl font-serif text-stone-900">100%</div>
                <div className="text-xs font-mono uppercase tracking-widest text-stone-500 mt-1">Tailored</div>
              </div>
              <div className="h-12 w-px bg-stone-300"></div>
              <div>
                <div className="text-4xl font-serif text-stone-900">4.9</div>
                <div className="text-xs font-mono uppercase tracking-widest text-stone-500 mt-1">Rating</div>
              </div>
            </div>

            <button className="group mt-8 flex items-center gap-4 text-stone-900 hover:text-stone-600 transition-colors">
              <span className="font-mono text-xs uppercase tracking-widest border-b border-stone-900 pb-1 group-hover:border-stone-600">
                Take Style Quiz
              </span>
              <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </button>
          </div>

          {/* Right: Decorative Collage */}
          <div className="lg:col-span-5 relative h-[500px]">
             <div className="absolute inset-0 border border-stone-200"></div>
             {/* Floating Decorative Element */}
             <div className="absolute top-10 left-10 w-2/3 h-2/3 bg-stone-100 overflow-hidden shadow-2xl rotate-3">
                <Image 
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop"
                  alt="Texture"
                  fill
                  className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
             </div>
             <div className="absolute bottom-10 right-10 w-1/2 h-1/2 bg-stone-200 overflow-hidden shadow-xl -rotate-6 z-10 border-4 border-white">
                <Image 
                  src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop"
                  alt="Texture"
                  fill
                  className="object-cover"
                />
             </div>
             {/* Badge Overlay */}
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
               <div className="bg-white p-6 shadow-lg rotate-12 border border-stone-200">
                 <Heart className="w-6 h-6 text-stone-900 mb-2" />
                 <div className="text-xs font-mono uppercase tracking-widest text-center">Curated</div>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Helper for merging classes (simple version)
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default FashionInspo;