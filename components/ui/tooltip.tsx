'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return <div className="relative inline-flex items-center group">{children}</div>;
};

export const TooltipTrigger = ({ children }: { children: React.ReactNode }) => {
  return <div className="inline-block cursor-help">{children}</div>;
};

export const TooltipContent = ({ 
  children, 
  className,
  side = 'top'
}: { 
  children: React.ReactNode; 
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) => {
  return (
    <div className={cn(
      "absolute z-[999] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300",
      side === 'top' && "bottom-full mb-3 left-1/2 -translate-x-1/2 translate-y-2 group-hover:translate-y-0",
      side === 'bottom' && "top-full mt-3 left-1/2 -translate-x-1/2 -translate-y-2 group-hover:translate-y-0",
      className
    )}>
      <div className="relative bg-stone-900 text-white px-4 py-2.5 rounded-xl text-[11px] font-medium leading-relaxed shadow-2xl border border-white/10 min-w-[120px] max-w-[220px] break-words text-center">
        {children}
        {/* Refined Arrow */}
        <div 
          className={cn(
             "absolute w-2 h-2 bg-stone-900 rotate-45 border border-white/10 border-t-0 border-l-0",
             side === 'top' && "bottom-[-4.5px] left-1/2 -translate-x-1/2 border-r border-b",
             side === 'bottom' && "top-[-4.5px] left-1/2 -translate-x-1/2 border-l border-t"
          )} 
        />
      </div>
    </div>
  );
};
