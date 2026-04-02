'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Search, Loader2, Info, Check, Navigation, Globe, X, Map as MapIcon } from 'lucide-react'

interface LocationSuggestion {
    place_id: number | string
    description: string
    lat: number
    lng: number
}

interface LocationPickerProps {
    latitude: number | null
    longitude: number | null
    location: string
    onLocationChange: (lat: number, lng: number, address: string) => void
}

export default function LocationPicker({ latitude, longitude, location, onLocationChange }: LocationPickerProps) {
    const [searchQuery, setSearchQuery] = useState(location || '')
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim().length > 2 && searchQuery !== location) {
                searchSuggestions(searchQuery)
            } else if (searchQuery.trim().length <= 2) {
                setSuggestions([])
                setShowSuggestions(false)
            }
        }, 600)

        return () => clearTimeout(timeoutId)
    }, [searchQuery, location])

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

    const searchSuggestions = async (query: string) => {
        if (!query.trim()) return

        setIsSearching(true)
        setError(null)

        try {
            // Restrict search to Ghana using countrycodes=gh
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=gh`,
                {
                    headers: {
                        'Accept-Language': 'en-US,en;q=0.9',
                        'User-Agent': 'Trendiwear-App'
                    }
                }
            )

            if (!response.ok) throw new Error('Search failed')

            const data = await response.json()

            const results: LocationSuggestion[] = data.map((item: { place_id: number | string; display_name: string; lat: string; lon: string }) => ({
                place_id: item.place_id,
                description: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
            }))

            setSuggestions(results)
            setShowSuggestions(results.length > 0)
        } catch (err) {
            console.error('Error searching location:', err)
            setError('Geospatial indexing failed. Please try a different query.')
        } finally {
            setIsSearching(false)
        }
    }

    const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
        onLocationChange(suggestion.lat, suggestion.lng, suggestion.description)
        setSearchQuery(suggestion.description)
        setShowSuggestions(false)
    }

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported.')
            return
        }

        setIsSearching(true)
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
                    const data = await res.json()
                    
                    // Verify if the location is in Ghana
                    const countryCode = data.address?.country_code;
                    if (countryCode && countryCode.toLowerCase() !== 'gh') {
                        setError('Registration is currently only available for locations in Ghana.');
                        setIsSearching(false);
                        return;
                    }

                    const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`

                    onLocationChange(lat, lng, address)
                    setSearchQuery(address)
                    setIsSearching(false)
                } catch {
                    setError('Failed to resolve detected coordinates. Please search manually.')
                    setIsSearching(false)
                }
            },
            () => {
                setIsSearching(false)
                setError('Access to location coordinates denied.')
            }
        )
    }

    return (
        <div className="space-y-6 relative group">
            <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                    <Label htmlFor="location-search" className="text-stone-500 text-[10px] font-semibold uppercase tracking-[0.25em] flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-stone-900" />
                        Precise Business Address
                    </Label>
                    <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ y: 0 }}
                        type="button"
                        onClick={handleDetectLocation}
                        className="text-[10px] font-bold uppercase tracking-widest text-stone-900 hover:text-stone-600 transition-colors flex items-center gap-2 bg-stone-100 px-4 py-2 rounded-full border border-stone-200"
                    >
                        <Navigation size={10} className={isSearching ? 'animate-pulse' : ''} />
                        Detect My Coordinates
                    </motion.button>
                </div>

                <div className="relative">
                    <Input
                        ref={inputRef}
                        id="location-search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        placeholder="Search for your location..."
                        className="bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-0 focus:border-stone-900 h-14 rounded-2xl pl-12 pr-12 transition-shadow hover:shadow-sm"
                        required
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        {isSearching ? (
                            <Loader2 size={18} className="animate-spin text-stone-400" />
                        ) : (
                            <Search size={18} className="text-stone-300 transition-colors" />
                        )}
                    </div>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-900 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {error && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] font-bold uppercase tracking-widest text-red-500 px-2"
                    >
                        {error}
                    </motion.p>
                )}
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
                {showSuggestions && (
                    <motion.div
                        ref={suggestionsRef}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-[60] w-full mt-2 bg-white/95 backdrop-blur-xl border border-stone-200 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.08)] overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Search Results</span>
                            <Globe size={12} className="text-stone-200" />
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar italic-none">
                            {suggestions.map((suggestion, idx) => (
                                <motion.button
                                    key={suggestion.place_id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.03 }}
                                    onClick={() => handleSuggestionSelect(suggestion)}
                                    className="w-full text-left px-6 py-5 hover:bg-stone-50 border-b border-stone-50 last:border-b-0 group/item transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 w-9 h-9 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center group-hover/item:bg-white transition-colors">
                                            <MapPin size={15} className="text-stone-400 group-hover/item:text-stone-900" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm text-stone-800 group-hover/item:text-black truncate">
                                                {suggestion.description.split(',')[0]}
                                            </div>
                                            <div className="text-[11px] text-stone-400 group-hover/item:text-stone-500 truncate mt-1">
                                                {suggestion.description.split(',').slice(1).join(',').trim()}
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                        <div className="px-6 py-4 bg-stone-50/50 flex items-center gap-3">
                            <Info size={11} className="text-stone-300" />
                            <p className="text-[10px] text-stone-400 font-medium">
                                Provided by the open community at OpenStreetMap.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {latitude && longitude && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-7 rounded-[2rem] border border-stone-200 shadow-sm relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50" />
                        
                        <div className="flex items-start justify-between relative">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                                        <Check size={12} className="text-emerald-700" />
                                    </div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-900">
                                        Verification Secured
                                    </h4>
                                </div>
                                <p className="text-stone-900 text-lg font-serif mb-5 line-clamp-2 leading-tight">
                                    {location}
                                </p>
                                
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-[11px] font-mono font-bold text-stone-400 tracking-tighter">
                                            {latitude.toFixed(6)} / {longitude.toFixed(6)}
                                        </span>
                                    </div>
                                    <a 
                                        href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=16`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-900 hover:underline flex items-center gap-2"
                                    >
                                        <MapIcon size={12} />
                                        Examine Map
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e7e5e4;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d6d3d1;
                }
            `}</style>
        </div>
    )
}