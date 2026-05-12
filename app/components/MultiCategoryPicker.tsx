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
  const [view, setView] = useState<"parents" | "children">("parents");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter logic for search
  const filteredParents = parentCategories.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.children.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Auto-set first parent as active if none is active
  useEffect(() => {
    if (!activeParentId && parentCategories.length > 0) {
      setActiveParentId(parentCategories[0].id);
    }
  }, [parentCategories, activeParentId]);

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

  const activeParent = parentCategories.find(p => p.id === activeParentId);

  return (
    <div className="space-y-6">
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Selected Items: Visual Previews */}
      <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar min-h-[60px] items-center snap-x">
        <AnimatePresence mode="popLayout">
          {selectedCategoryIds.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-50/50 border border-slate-100 border-dashed">
               <Sparkles className="w-3 h-3 text-blue-400" />
               <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Selection Studio Empty</span>
            </div>
          ) : (
            selectedCategoryIds.map(id => {
              const info = getFullCategoryName(id);
              const parent = parentCategories.find(p => p.name === info?.parentName);
              const child = parent?.children.find(c => c.id === id);
              const imageUrl = child?.imageUrl || parent?.imageUrl || "https://images.unsplash.com/photo-1445205170230-053b830c6039?w=200&q=80";

              return (
                <motion.button
                  key={id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => toggleCategory(id)}
                  className="shrink-0 flex items-center gap-3 pr-4 pl-1.5 py-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all group snap-start"
                >
                  <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-inner">
                    <Image src={imageUrl} alt="" fill className="object-cover" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[7px] font-black text-blue-500 uppercase tracking-tighter opacity-70 leading-none mb-0.5">{info?.parentName}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{info?.childName}</span>
                      <X className="w-2.5 h-2.5 text-slate-300 group-hover:text-rose-500 transition-colors" />
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 overflow-hidden flex flex-col min-h-[500px]">
        {/* Search & Navigation Header */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex items-center gap-4">
            {view === "children" && (
              <button 
                onClick={() => setView("parents")}
                className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                <X className="w-4 h-4 rotate-45" />
              </button>
            )}
            <div className="flex-1 relative">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
              <input 
                type="text"
                placeholder={view === "parents" ? "Search categories..." : `Search in ${activeParent?.name}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-slate-50 rounded-2xl pl-12 pr-6 text-[11px] font-bold text-slate-600 outline-none focus:ring-2 ring-blue-100 transition-all placeholder:text-slate-300"
              />
            </div>
          </div>
          
          {view === "children" && (
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 px-1">
              <span>{activeParent?.name}</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-blue-600">Select Sub-category</span>
            </div>
          )}
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[600px] hide-scrollbar">
          <AnimatePresence mode="wait">
            {view === "parents" ? (
              <motion.div
                key="parents-grid"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
              >
                {filteredParents.map(parent => (
                  <button
                    key={parent.id}
                    onClick={() => {
                      setActiveParentId(parent.id);
                      setView("children");
                    }}
                    className="group relative aspect-square rounded-[2rem] overflow-hidden border-2 border-transparent hover:border-blue-200 transition-all shadow-sm"
                  >
                    <Image 
                      src={parent.imageUrl || `https://images.unsplash.com/photo-1445205170230-053b830c6039?w=400&q=80`} 
                      alt={parent.name} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                    <div className="absolute inset-0 p-4 flex flex-col justify-end items-center text-center">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{parent.name}</span>
                      <p className="text-[8px] text-blue-300 font-bold uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {parent.children.length} types
                      </p>
                    </div>
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="children-grid"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-4"
              >
                {activeParent?.children
                  .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(child => {
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
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg ring-4 ring-blue-50/50' 
                            : isDisabled 
                              ? 'bg-slate-50 border-transparent text-slate-300 cursor-not-allowed grayscale' 
                              : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 active:scale-95'
                          }
                        `}
                      >
                        {child.imageUrl && (
                          <div className={`absolute inset-0 transition-opacity duration-700 ${isSelected ? 'opacity-40' : 'opacity-10 group-hover:opacity-30'}`}>
                             <Image src={child.imageUrl} alt="" fill className="object-cover" />
                          </div>
                        )}
                        
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-600/60 backdrop-blur-[2px]" />
                        )}

                        <span className={`relative z-10 text-[10px] font-black uppercase tracking-widest leading-tight px-4 transition-all ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}>
                          {child.name}
                        </span>
                        
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-lg z-20">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">
        Tip: You can select up to {maxSelections} categories for maximum reach.
      </p>
    </div>
  );
};
