'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { MapPin, Search, Loader2, X, Navigation, Globe, ChevronRight } from 'lucide-react'
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"

export interface AddressResult {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  latitude: number
  longitude: number
}

interface GooglePrediction {
  place_id: string
  description: string
  mainText: string
  secondaryText: string
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
  const [suggestions, setSuggestions] = useState<GooglePrediction[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const googleRef = useRef<typeof google | null>(null)

  // --- Initialization ---
  useEffect(() => {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      v: "weekly"
    });

    Promise.all([
      importLibrary("places"),
      importLibrary("geocoding")
    ]).then(() => {
      googleRef.current = google;
    }).catch(err => {
      console.error("Google Maps failed to load", err as Error);
      setError("Search engine failed to initialize.");
    });
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value.trim().length > 3 && !suggestions.find(s => s.description === value)) {
        searchAddress(value)
      } else if (value.trim().length <= 3) {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 400)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const searchAddress = async (query: string) => {
    if (!query || !googleRef.current) return;
    
    setIsSearching(true)
    setError(null)

    try {
      const service = new googleRef.current.maps.places.AutocompleteService();
      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        componentRestrictions: { country: 'gh' }
      };

      service.getPlacePredictions(request, (predictions: google.maps.places.AutocompletePrediction[] | null, status: string) => {
        if (googleRef.current && status === googleRef.current.maps.places.PlacesServiceStatus.OK && predictions) {
          const results: GooglePrediction[] = predictions.map((p) => ({
            place_id: p.place_id,
            description: p.description,
            mainText: p.structured_formatting.main_text,
            secondaryText: p.structured_formatting.secondary_text
          }));
          setSuggestions(results)
          setShowSuggestions(results.length > 0)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
        setIsSearching(false)
      });
    } catch (err) {
      console.error('Error searching address:', err)
      setIsSearching(false)
    }
  }

  const parseGoogleAddress = (place: google.maps.GeocoderResult | google.maps.places.PlaceResult): AddressResult => {
    const components = place.address_components || [];
    
    const getComp = (types: string[]) => {
      const comp = components.find((c) => types.some(t => c.types.includes(t)));
      return comp ? comp.long_name : '';
    };

    const streetNumber = getComp(['street_number']);
    const streetName = getComp(['route']);
    const city = getComp(['locality', 'sublocality', 'neighborhood']);
    const state = getComp(['administrative_area_level_1']);
    const zipCode = getComp(['postal_code']);
    const country = getComp(['country']);

    return {
      street: streetNumber ? `${streetNumber} ${streetName}` : streetName || (place as google.maps.places.PlaceResult).name || value,
      city: city || state || '',
      state: state || '',
      zipCode: zipCode || '',
      country: country || 'Ghana',
      latitude: place.geometry?.location?.lat() || 0,
      longitude: place.geometry?.location?.lng() || 0
    };
  };

  const handleSelect = (item: GooglePrediction) => {
    if (!googleRef.current) return;
    setIsSearching(true);

    const geocoder = new googleRef.current.maps.Geocoder();
    geocoder.geocode({ placeId: item.place_id }, (results: google.maps.GeocoderResult[] | null, status: string) => {
      if (googleRef.current && status === googleRef.current.maps.GeocoderStatus.OK && results && results[0]) {
        const result = parseGoogleAddress(results[0]);
        onAddressSelect(result);
        onChange(result.street);
      } else {
        setError("Failed to resolve address details.");
      }
      setIsSearching(false);
      setShowSuggestions(false);
    });
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported.')
      return
    }

    setIsSearching(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords

        if (googleRef.current) {
          const geocoder = new googleRef.current.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results: google.maps.GeocoderResult[] | null, status: string) => {
            if (googleRef.current && status === googleRef.current.maps.GeocoderStatus.OK && results && results[0]) {
              // Security check: Verify if in Ghana
              const isGhana = results[0].address_components.some((comp) => 
                comp.short_name === 'GH' || comp.long_name === 'Ghana'
              );

              if (!isGhana) {
                setError('Registration is currently only available for locations in Ghana.');
                setIsSearching(false);
                return;
              }

              const result = parseGoogleAddress(results[0]);
              onAddressSelect(result)
              onChange(result.street)
            } else {
              setError('Failed to resolve coordinates.')
            }
            setIsSearching(false)
          });
        }
      },
      () => {
        setIsSearching(false)
        setError('Location access denied.')
      },
      { enableHighAccuracy: true }
    )
  }

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between bg-amber-50 border border-amber-100 p-2 rounded-lg"
          >
            <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest px-1">
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-[61] w-full mt-1 bg-white/95 backdrop-blur-xl border border-stone-200 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.12)] overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">Search Results — Ghana</span>
                <Globe size={11} className="text-stone-400" />
            </div>
             <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {suggestions.map((item) => (
                <button
                  key={item.place_id}
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-5 py-3.5 hover:bg-stone-50 border-b border-stone-50 last:border-b-0 group transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center group-hover:bg-stone-900 transition-colors">
                      <MapPin size={14} className="text-stone-400 group-hover:text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-stone-900 group-hover:text-black truncate tracking-tight">
                        {item.mainText}
                      </div>
                      <div className="text-[10px] text-stone-400 group-hover:text-stone-600 truncate mt-0.5">
                        {item.secondaryText}
                      </div>
                    </div>
                    <ChevronRight size={14} className="mt-2 text-stone-200" />
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
