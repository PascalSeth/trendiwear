'use client';

import React, { useState } from 'react';
import { X, Check, Plus, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string[];
  onChange: (colors: string[]) => void;
  maxColors?: number;
}

const FASHION_COLORS: { hex: string; name: string }[] = [
  { hex: '#000000', name: 'Black' },
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#F5F5DC', name: 'Beige' },
  { hex: '#78350F', name: 'Brown' },
  { hex: '#6B7280', name: 'Grey' },
  { hex: '#1E3A8A', name: 'Navy' },
  { hex: '#2563EB', name: 'Royal Blue' },
  { hex: '#38BDF8', name: 'Sky Blue' },
  { hex: '#065F46', name: 'Emerald' },
  { hex: '#16A34A', name: 'Green' },
  { hex: '#65A30D', name: 'Olive' },
  { hex: '#EAB308', name: 'Gold / Yellow' },
  { hex: '#F97316', name: 'Orange' },
  { hex: '#DC2626', name: 'Red' },
  { hex: '#800020', name: 'Burgundy' },
  { hex: '#EC4899', name: 'Pink' },
  { hex: '#9333EA', name: 'Purple' },
];

function isLightColor(color: string): boolean {
  if (!color || !color.startsWith('#')) return false;
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 160;
}

export function ColorPicker({ value = [], onChange, maxColors = 8 }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState('#2563EB');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const isColorSelected = (hex: string): boolean => {
    const clean = hex.toLowerCase().trim();
    return value.some(v => v.toLowerCase().trim() === clean);
  };

  const toggleColor = (hex: string) => {
    const clean = hex.toLowerCase().trim();
    const exists = isColorSelected(clean);

    if (exists) {
      onChange(value.filter(v => v.toLowerCase().trim() !== clean));
    } else {
      if (value.length >= maxColors) {
        return;
      }
      onChange([...value, hex]);
    }
  };

  const removeColor = (colorToRemove: string) => {
    const clean = colorToRemove.toLowerCase().trim();
    onChange(value.filter(color => color.toLowerCase().trim() !== clean));
  };

  const handleAddCustomColor = () => {
    if (!customColor) return;
    toggleColor(customColor);
    setShowCustomPicker(false);
  };

  // Find color display name if known
  const getColorName = (hex: string): string => {
    const found = FASHION_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
    return found ? found.name : hex.toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* 1. SELECTED COLORS CHIPS (If any are selected) */}
      {value.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
              Selected Colors ({value.length}/{maxColors})
            </span>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-stone-400 hover:text-stone-700 text-[10px] font-semibold transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {value.map((color) => {
              const light = isLightColor(color);
              return (
                <div
                  key={color}
                  className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-white border border-stone-200/90 shadow-2xs text-xs font-semibold text-stone-800"
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full shrink-0 shadow-inner",
                      light && "border border-stone-300"
                    )}
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[11px] font-bold text-stone-700">
                    {getColorName(color)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeColor(color);
                    }}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors ml-0.5"
                    title={`Remove ${getColorName(color)}`}
                  >
                    <X size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. DIRECT TOGGLE PALETTE GRID (Tap to toggle on / tap to toggle off) */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
          Fashion Palette (Tap to select or unselect)
        </span>

        <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
          {FASHION_COLORS.map((c) => {
            const selected = isColorSelected(c.hex);
            const light = isLightColor(c.hex);

            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => toggleColor(c.hex)}
                disabled={!selected && value.length >= maxColors}
                title={`${c.name} - ${selected ? 'Selected (Tap to remove)' : 'Tap to add'}`}
                className={cn(
                  "relative aspect-square rounded-xl border flex flex-col items-center justify-center transition-all group active:scale-95",
                  selected
                    ? "ring-2 ring-stone-900 ring-offset-2 border-stone-900 shadow-xs"
                    : "border-stone-200 hover:scale-105 hover:shadow-2xs",
                  !selected && value.length >= maxColors && "opacity-40 cursor-not-allowed hover:scale-100"
                )}
                style={{ backgroundColor: c.hex }}
              >
                {selected && (
                  <Check
                    size={14}
                    className={cn(
                      "stroke-[3] drop-shadow-xs",
                      light ? "text-stone-900" : "text-white"
                    )}
                  />
                )}
                <span className="sr-only">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CUSTOM COLOR PICKER (Controlled & deliberate, no auto-closing) */}
      <div className="pt-2 border-t border-stone-100">
        {!showCustomPicker ? (
          <button
            type="button"
            onClick={() => setShowCustomPicker(true)}
            disabled={value.length >= maxColors}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors disabled:opacity-50"
          >
            <Plus size={13} className="text-amber-600" />
            <span>Add Custom Hex / Shade</span>
          </button>
        ) : (
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3 max-w-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <Palette size={13} className="text-amber-600" /> Custom Color
              </span>
              <button
                type="button"
                onClick={() => setShowCustomPicker(false)}
                className="text-stone-400 hover:text-stone-600 text-xs"
              >
                Cancel
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-stone-300 cursor-pointer p-0.5 bg-white shrink-0"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="#HEX"
                className="h-9 px-3 rounded-lg border border-stone-200 bg-white text-xs font-mono font-bold uppercase w-28 focus:border-stone-900 outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomColor}
                disabled={isColorSelected(customColor) || value.length >= maxColors}
                className="h-9 px-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shrink-0"
              >
                {isColorSelected(customColor) ? "Added" : "Add Color"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}