'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { MapPin, Search, Loader2, X, Navigation } from 'lucide-react'

export interface AddressResult {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  latitude: number
  longitude: number
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    pedestrian?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    region?: string;
    postcode?: string;
    country?: string;
  };
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onAddressSelect: (result: AddressResult) => void
  label?: string
  placeholder?: string
}

export default function AddressAutocomplete({ 
  value, 
  onChange, 
  onAddressSelect,
  label = "Street Address",
  placeholder = "Search for your address..."
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only search if the value is not already what was selected (to avoid infinite loops)
      if (value.trim().length > 3 && !suggestions.find(s => s.display_name === value)) {
        searchAddress(value)
      } else if (value.trim().length <= 3) {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 600)

    return () => clearTimeout(timeoutId)
  }, [value, suggestions])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchAddress = async (query: string) => {
    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'Trendiwear-App'
          }
        }
      )

      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      setSuggestions(data)
      setShowSuggestions(data.length > 0)
    } catch (err) {
      console.error('Error searching address:', err)
      setError('Search failed. Please enter manually.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelect = (item: NominatimResult) => {
    const { address, lat, lon } = item
    
    const result: AddressResult = {
      street: address.road || address.pedestrian || address.suburb || value,
      city: address.city || address.town || address.village || address.county || '',
      state: address.state || address.region || '',
      zipCode: address.postcode || '',
      country: address.country || 'Kenya',
      latitude: parseFloat(lat),
      longitude: parseFloat(lon)
    }

    onAddressSelect(result)
    onChange(result.street)
    setShowSuggestions(false)
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported.')
      return
    }

    setIsSearching(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            {
              headers: { 'User-Agent': 'Trendiwear-App' }
            }
          )
          if (!res.ok) throw new Error('Reverse geocoding failed')
          const data = await res.json()
          
          const result: AddressResult = {
            street: data.address.road || data.address.pedestrian || data.address.suburb || `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            city: data.address.city || data.address.town || data.address.village || data.address.county || '',
            state: data.address.state || data.address.region || '',
            zipCode: data.address.postcode || '',
            country: data.address.country || 'Kenya',
            latitude: lat,
            longitude: lng
          }

          onAddressSelect(result)
          onChange(result.street)
          setIsSearching(false)
        } catch (err) {
          console.error('Error detecting location:', err)
          // Fallback to coordinates only if geocoding fails
          onAddressSelect({
            street: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            city: '',
            state: '',
            zipCode: '',
            country: 'Kenya',
            latitude: lat,
            longitude: lng
          })
          onChange(`Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
          setIsSearching(false)
        }
      },
      () => {
        setIsSearching(false)
        setError('Location access denied.')
      },
      { enableHighAccuracy: true }
    )
  }

  return (
    <div className="space-y-2 relative group">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-500">{label}</label>
        <button
          type="button"
          onClick={handleDetectLocation}
          className="text-[10px] font-bold uppercase tracking-widest text-stone-900 hover:text-stone-600 transition-colors flex items-center gap-2 hover:bg-stone-50 px-2 py-1 rounded-md"
        >
          <Navigation size={10} className={isSearching ? 'animate-spin' : ''} />
          Detect
        </button>
      </div>
      
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-0 focus:border-stone-900 h-12 rounded-xl pl-10 pr-10 transition-shadow hover:shadow-sm"
          autoComplete="off"
        />
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <Loader2 size={16} className="animate-spin text-stone-400" />
          ) : (
            <Search size={16} className="text-stone-300 group-focus-within:text-stone-900 transition-colors" />
          )}
        </div>
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); setSuggestions([]); }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-900 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[9px] font-bold text-red-500 uppercase tracking-widest px-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-[61] w-full mt-1 bg-white border border-stone-100 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.06)] overflow-hidden"
          >
             <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {suggestions.map((item) => (
                <button
                  key={item.place_id}
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-5 py-3.5 hover:bg-stone-50 border-b border-stone-50 last:border-b-0 group/item transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <MapPin size={14} className="text-stone-300 group-hover/item:text-stone-900 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 text-ellipsis overflow-hidden">
                      <div className="font-semibold text-xs text-stone-800 group-hover/item:text-black truncate">
                        {item.display_name.split(',')[0]}
                      </div>
                      <div className="text-[10px] text-stone-500 group-hover/item:text-stone-600 truncate mt-0.5">
                        {item.display_name.split(',').slice(1).join(',').trim()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 10px; }
      `}</style>
    </div>
  )
}
