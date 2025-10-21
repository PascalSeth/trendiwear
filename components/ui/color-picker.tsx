'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ColorPickerProps {
  value: string[];
  onChange: (colors: string[]) => void;
  maxColors?: number;
}

export function ColorPicker({ value, onChange, maxColors = 10 }: ColorPickerProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const addColor = (color: string) => {
    if (!value.includes(color) && value.length < maxColors) {
      onChange([...value, color]);
    }
    setIsPickerOpen(false);
  };

  const removeColor = (colorToRemove: string) => {
    onChange(value.filter(color => color !== colorToRemove));
  };

  const predefinedColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008000',
    '#FF4500', '#DC143C', '#4169E1', '#32CD32', '#FFD700'
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {value.map((color, index) => (
          <div
            key={index}
            className="relative group"
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
              style={{ backgroundColor: color }}
              onClick={() => removeColor(color)}
              title="Click to remove"
            />
            <button
              type="button"
              onClick={() => removeColor(color)}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ))}

        {value.length < maxColors && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
              title="Add color"
            >
              <span className="text-gray-500 text-lg">+</span>
            </button>

            {isPickerOpen && (
              <div className="absolute top-10 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px]">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Choose Color</h4>
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Predefined colors */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => addColor(color)}
                      className="w-8 h-8 rounded-full border border-gray-300 hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: color }}
                      disabled={value.includes(color)}
                      title={color}
                    />
                  ))}
                </div>

                {/* Custom color picker */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-600">Custom Color</label>
                  <input
                    type="color"
                    onChange={(e) => addColor(e.target.value)}
                    className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {value.length === 0 && (
        <p className="text-sm text-gray-500">No colors selected. Click the + button to add colors.</p>
      )}

      {value.length > 0 && (
        <p className="text-xs text-gray-500">
          {value.length} of {maxColors} colors selected. Click on a color to remove it.
        </p>
      )}
    </div>
  );
}