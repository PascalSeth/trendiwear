"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AtelierBackgroundProps {
  className?: string;
}

/**
 * AtelierBackground - Optimized for High-End Mobile Performance
 * Professional, hand-crafted organic ink strokes and architectural guides.
 */
export const AtelierBackground: React.FC<AtelierBackgroundProps> = ({ className }) => {
  return (
    <div className={cn("pointer-events-none select-none overflow-hidden h-[100dvh] w-full", className)}>
      
      {/* 1. PREMIUM GRAIN TEXTURE (Optimized for Mobile) */}
      <div className="absolute inset-0 opacity-[0.04] sm:opacity-[0.03] pointer-events-none mix-blend-overlay z-50">
         <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform-gpu">
            <filter id="noiseFilter">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="0.8" 
                numOctaves="2" 
                stitchTiles="stitch" 
              />
            </filter>
            <rect width="100%" height="100%" filter="url(#noiseFilter)" />
         </svg>
      </div>

      {/* 2. ARCHITECTURAL GUIDES (Editorial Grid) */}
      <div className="absolute inset-0 opacity-[0.08] sm:opacity-[0.05] text-stone-900 pointer-events-none transform-gpu">
        <div className="absolute top-[10%] left-0 w-full h-[1px] bg-current" />
        <div className="absolute bottom-[10%] left-0 w-full h-[1px] bg-current" />
        <div className="absolute left-[10%] top-0 w-[1px] h-full bg-current" />
        <div className="absolute right-[10%] top-0 w-[1px] h-full bg-current" />
      </div>

      {/* 3. INK SKETCH: The Fluid Silhouette (Responsive Scaling) */}
      <div className="absolute top-[-5%] right-[-15%] sm:right-[-10%] w-[120%] sm:w-[90%] h-auto opacity-[0.45] sm:opacity-[0.2] text-stone-400 pointer-events-none transform-gpu">
        <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ willChange: 'transform' }}>
          <motion.path
            d="M50,200 C100,50 250,350 450,150"
            stroke="currentColor"
            strokeWidth="3"
            className="sm:stroke-[1.2]"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 15, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
          />
           <motion.path
            d="M60,210 C110,60 260,360 460,160"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeDasharray="10 5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 18, ease: "easeInOut", delay: 2, repeat: Infinity, repeatType: "reverse" }}
          />
        </svg>
      </div>

      {/* 4. THE DESIGNER'S NOTE: Organic Scribble (Centered for Mobile) */}
      <div className="absolute top-[40%] left-[-10%] sm:left-[-15%] w-[60%] sm:w-[45%] h-auto opacity-[0.35] sm:opacity-[0.15] text-amber-900/40 pointer-events-none transform-gpu">
        <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ willChange: 'transform' }}>
          <motion.path
            d="M50,150 C50,250 250,50 250,150 C250,250 50,50 50,150"
            stroke="currentColor"
            strokeWidth="3.5"
            className="sm:stroke-[2]"
            strokeLinecap="round"
            initial={{ pathLength: 0, rotate: -5 }}
            animate={{ 
              pathLength: [0, 1, 1, 0],
              rotate: [-5, 5, -5]
            }}
            transition={{ 
              duration: 25, 
              repeat: Infinity, 
              ease: "linear"
            }}
          />
        </svg>
      </div>

      {/* 5. CASCADING HEMLINES: Layered Waves (Bottom Right) */}
      <div className="absolute bottom-[-5%] right-[-10%] w-[80%] sm:w-[60%] h-auto opacity-[0.15] sm:opacity-[0.1] text-stone-500 pointer-events-none transform-gpu">
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ willChange: 'transform' }}>
          {[...Array(3)].map((_, i) => (
            <motion.path
              key={i}
              d={`M0,${100 + i * 40} C100,${50 + i * 40} 300,${250 + i * 40} 500,${150 + i * 40}`}
              stroke="currentColor"
              strokeWidth={1.5 - i * 0.3}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ 
                duration: 8 + i * 2, 
                repeat: Infinity, 
                repeatType: "reverse", 
                ease: "easeInOut",
                delay: i * 2
              }}
            />
          ))}
        </svg>
      </div>

      {/* 6. FLOATING DEPTH: Blur Blobs (Optimized for Mobile) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {[
            { top: '25%', left: '5%', color: 'bg-stone-200' },
            { top: '75%', left: '85%', color: 'bg-amber-100' },
          ].map((blob, idx) => (
            <motion.div
              key={idx}
              className={cn("absolute w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-[80px] sm:blur-[120px] opacity-25 sm:opacity-20", blob.color)}
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: [0.8, 1.1, 0.8],
                x: [0, 30, 0],
                y: [0, 20, 0]
              }}
              transition={{ 
                duration: 15 + idx * 5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              style={{ 
                top: blob.top, 
                left: blob.left,
              }}
            />
          ))}
      </div>

    </div>
  );
};
