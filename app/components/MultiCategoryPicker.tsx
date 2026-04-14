'use client';

import React, { useState, useEffect } from "react";
import { X, Check, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
}

interface ParentCategory extends Category {
  children: Category[];
}

interface MultiCategoryPickerProps {
  parentCategories: ParentCategory[];
  selectedCategoryIds: string[];
  onChange: (ids: string[]) => void;
  maxSelections?: number;
}

export const MultiCategoryPicker: React.FC<MultiCategoryPickerProps> = ({
  parentCategories,
  selectedCategoryIds,
  onChange,
  maxSelections = 3
}) => {
  const [activeParentId, setActiveParentId] = useState<string | null>(
    parentCategories.length > 0 ? parentCategories[0].id : null
  );

  // Auto-set first parent as active if none is active
  useEffect(() => {
    if (!activeParentId && parentCategories.length > 0) {
      setActiveParentId(parentCategories[0].id);
    }
  }, [parentCategories, activeParentId]);

  const activeParent = parentCategories.find(p => p.id === activeParentId);

  const toggleCategory = (id: string) => {
    if (selectedCategoryIds.includes(id)) {
      onChange(selectedCategoryIds.filter(cid => cid !== id));
    } else {
      if (selectedCategoryIds.length < maxSelections) {
        onChange([...selectedCategoryIds, id]);
      }
    }
  };

  const getFullCategoryName = (childId: string) => {
    for (const parent of parentCategories) {
      const child = parent.children.find(c => c.id === childId);
      if (child) return { parentName: parent.name, childName: child.name };
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Visual Selection Canvas: High-Fidelity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {selectedCategoryIds.length === 0 ? (
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-12 px-8 rounded-[2.5rem] bg-slate-50/50 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-center group transition-colors hover:bg-slate-50"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all duration-500">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Define the piece's identity</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Select up to {maxSelections} categories below</p>
              </div>
            </motion.div>
          ) : (
            selectedCategoryIds.map(id => {
              const info = getFullCategoryName(id);
              // Find the child to get the imageUrl
              const parent = parentCategories.find(p => p.name === info?.parentName);
              const child = parent?.children.find(c => c.id === id);
              const imageUrl = child?.imageUrl || "https://images.unsplash.com/photo-1445205170230-053b830c6039?w=800&q=80"; // Fallback placeholder

              return (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="group relative h-48 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 border border-white"
                >
                  <Image 
                    src={imageUrl} 
                    alt={child?.name || ""} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                  
                  {/* Content Overlay */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-500 block">
                        {info?.parentName}
                      </span>
                      <h4 className="text-lg font-black text-white leading-tight">
                        {info?.childName}
                      </h4>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={() => toggleCategory(id)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-rose-500 shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 hover:bg-rose-500 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 overflow-hidden">
        {/* Sidebar: Parent Categories */}
        <div className="md:col-span-4 bg-slate-50/50 border-r border-slate-100 p-4 space-y-2">
          {parentCategories.map(parent => (
            <button
              key={parent.id}
              onClick={() => setActiveParentId(parent.id)}
              className={`w-full text-left px-5 py-4 rounded-2xl flex items-center justify-between transition-all group ${
                activeParentId === parent.id 
                  ? 'bg-white shadow-lg shadow-slate-200/50 text-blue-600' 
                  : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              <span className="text-xs font-black uppercase tracking-widest">{parent.name}</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${activeParentId === parent.id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100'}`} />
            </button>
          ))}
        </div>

        {/* Child Bubbles Grid */}
        <div className="md:col-span-8 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeParentId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              {activeParent?.children.map(child => {
                const isSelected = selectedCategoryIds.includes(child.id);
                const isDisabled = !isSelected && selectedCategoryIds.length >= maxSelections;

                return (
                  <button
                    key={child.id}
                    disabled={isDisabled}
                    onClick={() => toggleCategory(child.id)}
                    className={`
                      relative aspect-[4/3] rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center gap-3 text-center overflow-hidden group
                      ${isSelected 
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-inner ring-4 ring-blue-50/50' 
                        : isDisabled 
                          ? 'bg-slate-50 border-transparent text-slate-300 cursor-not-allowed grayscale' 
                          : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:shadow-xl active:scale-95'
                      }
                    `}
                  >
                    {/* Background Layer: Subtle Image if not selected */}
                    {child.imageUrl && (
                      <div className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700 ${isSelected ? 'opacity-20' : ''}`}>
                         <Image src={child.imageUrl} alt="" fill className="object-cover" />
                      </div>
                    )}

                    {isSelected && (
                      <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg z-20 border-4 border-white"
                      >
                        <Check className="w-3 h-3" />
                      </motion.div>
                    )}
                    
                    <span className="relative z-10 text-[10px] font-black uppercase tracking-widest leading-tight px-4 group-hover:scale-105 transition-transform">
                      {child.name}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">
        Tip: Listing in multiple categories up to {maxSelections} increases visibility by 3.5x on average.
      </p>
    </div>
  );
};
