'use client';

import React, { useState, useEffect } from "react";
import { X, Check, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Category {
  id: string;
  name: string;
  slug: string;
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
    <div className="space-y-6">
      {/* Selected Slots */}
      <div className="flex flex-wrap gap-2 min-h-[48px] p-2 rounded-[2rem] bg-slate-50/50 border border-slate-100">
        <AnimatePresence mode="popLayout">
          {selectedCategoryIds.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 py-2 flex items-center gap-2 text-slate-400 text-xs font-medium"
            >
              <Sparkles className="w-3 h-3" />
              Select up to {maxSelections} categories...
            </motion.div>
          ) : (
            selectedCategoryIds.map(id => {
              const info = getFullCategoryName(id);
              return (
                <motion.button
                  key={id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 10 }}
                  onClick={() => toggleCategory(id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-full flex items-center gap-2 shadow-lg shadow-blue-100 group transition-all hover:bg-rose-500"
                >
                  <span className="text-[10px] font-black uppercase tracking-tight">
                    <span className="opacity-60">{info?.parentName} › </span>
                    {info?.childName}
                  </span>
                  <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
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
                      relative px-4 py-5 rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center gap-2 text-center
                      ${isSelected 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-inner' 
                        : isDisabled 
                          ? 'bg-slate-50 border-transparent text-slate-300 cursor-not-allowed grayscale' 
                          : 'bg-white border-slate-100 text-slate-600 hover:border-blue-100 hover:shadow-md active:scale-95'
                      }
                    `}
                  >
                    {isSelected && (
                      <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg"
                      >
                        <Check className="w-3 h-3" />
                      </motion.div>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-wide leading-tight px-2">
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
