'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Search, Loader2, Check, Navigation, Globe, X, Map as MapIcon, ChevronRight } from 'lucide-react'
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"

interface LocationSuggestion {
    place_id: string
    description: string
    mainText?: string
    secondaryText?: string
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
    const mapRef = useRef<HTMLDivElement>(null)
    const googleRef = useRef<typeof google | null>(null)
    const mapInstanceRef = useRef<google.maps.Map | null>(null)
    const markerRef = useRef<google.maps.Marker | null>(null)

    // --- Initialization ---
    useEffect(() => {
        setOptions({
            key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
            v: "weekly"
        });

        Promise.all([
            importLibrary("maps"),
            importLibrary("places"),
            importLibrary("geocoding"),
            importLibrary("marker")
        ]).then(() => {
            googleRef.current = google;
            if (latitude && longitude && mapRef.current) {
                initMap(latitude, longitude);
            }
        }).catch(err => {
            console.error("Google Maps failed to load", err as Error);
            setError("Map engine failed to initialize.");
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const initMap = (lat: number, lng: number) => {
        if (!googleRef.current || !mapRef.current) return;

        const center = { lat, lng };
        const mapOptions: google.maps.MapOptions = {
            center,
            zoom: 16,
            disableDefaultUI: true,
            zoomControl: true,
        };

        if (!mapInstanceRef.current) {
            mapInstanceRef.current = new googleRef.current.maps.Map(mapRef.current, mapOptions);
            
            markerRef.current = new googleRef.current.maps.Marker({
                position: center,
                map: mapInstanceRef.current,
                draggable: true,
                animation: googleRef.current.maps.Animation.DROP
            });

            markerRef.current?.addListener('dragend', () => {
                const pos = markerRef.current?.getPosition();
                if (pos) {
                    handleReverseGeocode(pos.lat(), pos.lng());
                }
            });
        } else {
            mapInstanceRef.current.setCenter(center);
            markerRef.current?.setPosition(center);
        }
    };

    // --- Search Logic ---
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim().length > 2 && searchQuery !== location) {
                searchSuggestions(searchQuery)
            } else if (searchQuery.trim().length <= 2) {
                setSuggestions([])
                setShowSuggestions(false)
            }
        }, 400)

        return () => clearTimeout(timeoutId)
    }, [searchQuery, location])

    const searchSuggestions = async (query: string) => {
        if (!query.trim() || !googleRef.current) return;

        setIsSearching(true);
        setError(null);

        try {
            const service = new googleRef.current.maps.places.AutocompleteService();
            const request: google.maps.places.AutocompletionRequest = {
                input: query,
                componentRestrictions: { country: 'gh' }
            };

            service.getPlacePredictions(request, (predictions: google.maps.places.AutocompletePrediction[] | null, status: string) => {
                if (googleRef.current && status === googleRef.current.maps.places.PlacesServiceStatus.OK && predictions) {
                    const results: LocationSuggestion[] = predictions.map((p) => ({
                        place_id: p.place_id,
                        description: p.description,
                        mainText: p.structured_formatting.main_text,
                        secondaryText: p.structured_formatting.secondary_text
                    }));
                    setSuggestions(results);
                    setShowSuggestions(results.length > 0);
                } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
                setIsSearching(false);
            });
        } catch (err) {
            console.error('Error searching location:', err);
            setIsSearching(false);
        }
    };

    const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
        if (!googleRef.current) return;

        setIsSearching(true);
        const geocoder = new googleRef.current.maps.Geocoder();
        
        geocoder.geocode({ placeId: suggestion.place_id }, (results: google.maps.GeocoderResult[] | null, status: string) => {
            if (googleRef.current && status === googleRef.current.maps.GeocoderStatus.OK && results && results[0]) {
                const { lat, lng } = results[0].geometry.location;
                const address = results[0].formatted_address;
                
                onLocationChange(lat(), lng(), address);
                setSearchQuery(address);
                initMap(lat(), lng());
            } else {
                setError("Failed to resolve location details.");
            }
            setIsSearching(false);
            setShowSuggestions(false);
        });
    };

    const handleReverseGeocode = (lat: number, lng: number) => {
        if (!googleRef.current) return;

        const geocoder = new googleRef.current.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results: google.maps.GeocoderResult[] | null, status: string) => {
            if (googleRef.current && status === googleRef.current.maps.GeocoderStatus.OK && results && results[0]) {
                const address = results[0].formatted_address;
                onLocationChange(lat, lng, address);
                setSearchQuery(address);
            }
        });
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported.');
            return;
        }

        setIsSearching(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                
                if (googleRef.current) {
                    const geocoder = new googleRef.current.maps.Geocoder();
                    geocoder.geocode({ location: { lat, lng } }, (results: google.maps.GeocoderResult[] | null, status: string) => {
                        if (googleRef.current && status === googleRef.current.maps.GeocoderStatus.OK && results && results[0]) {
                            // Security check: Verify if in Ghana (though restricted in query before, we check result here too)
                            const isGhana = results[0].address_components.some((comp) => 
                                comp.short_name === 'GH' || comp.long_name === 'Ghana'
                            );

                            if (!isGhana) {
                                setError('Registration is currently only available for locations in Ghana.');
                                setIsSearching(false);
                                return;
                            }

                            const address = results[0].formatted_address;
                            onLocationChange(lat, lng, address);
                            setSearchQuery(address);
                            initMap(lat, lng);
                        } else {
                            setError('Failed to resolve detected coordinates.');
                        }
                        setIsSearching(false);
                    });
                }
            },
            () => {
                setIsSearching(false);
                setError('Access to location coordinates denied.');
            }
        );
    };

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-6 relative">
            <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                    <Label htmlFor="location-search" className="text-stone-500 text-[10px] font-semibold uppercase tracking-[0.25em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                        Business Workshop Address
                    </Label>
                    <motion.button
                        whileHover={{ y: -1, backgroundColor: '#f5f5f4' }}
                        whileTap={{ y: 0 }}
                        type="button"
                        onClick={handleDetectLocation}
                        className="text-[10px] font-bold uppercase tracking-widest text-stone-900 flex items-center gap-2 bg-stone-100 px-4 py-2 rounded-full border border-stone-200 transition-all"
                    >
                        <Navigation size={10} className={isSearching ? 'animate-pulse' : ''} />
                        Detect Me
                    </motion.button>
                </div>

                <div className="relative">
                    <Input
                        ref={inputRef}
                        id="location-search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        placeholder="e.g. Osu, Accra or Kumasi Central..."
                        className="bg-white border-stone-200 text-stone-900 placeholder-stone-400 focus:ring-0 focus:border-stone-900 h-14 rounded-2xl pl-12 pr-12 transition-shadow hover:shadow-sm"
                        required
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        {isSearching ? <Loader2 size={18} className="animate-spin text-stone-400" /> : <Search size={18} className="text-stone-300" />}
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
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-bold uppercase tracking-widest text-red-500 px-2">
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
                        className="absolute z-[100] w-full mt-2 bg-white/95 backdrop-blur-xl border border-stone-200 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.12)] overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Search Results — Ghana</span>
                            <Globe size={11} className="text-stone-400" />
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion.place_id}
                                    onClick={() => handleSuggestionSelect(suggestion)}
                                    className="w-full text-left px-6 py-4 hover:bg-stone-50 border-b border-stone-50 last:border-b-0 group transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center group-hover:bg-stone-900 transition-colors">
                                            <MapPin size={14} className="text-stone-400 group-hover:text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm text-stone-900 truncate tracking-tight">{suggestion.mainText}</div>
                                            <div className="text-[11px] text-stone-400 truncate mt-0.5">{suggestion.secondaryText}</div>
                                        </div>
                                        <ChevronRight size={14} className="mt-2 text-stone-300" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Visual Map Area */}
            <div className={latitude && longitude ? "block" : "hidden"}>
                <div 
                    ref={mapRef} 
                    className="w-full h-44 lg:h-56 rounded-3xl bg-stone-100 border-2 border-stone-100 overflow-hidden shadow-inner grayscale-[0.2]"
                />
                
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 lg:p-5 bg-white border border-stone-100 rounded-3xl flex items-start gap-3 lg:gap-4 shadow-sm"
                >
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Check size={18} className="text-emerald-600" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Pin Location Verified</p>
                        <p className="text-sm text-stone-700 leading-relaxed max-w-[280px]">{location}</p>
                        <div className="pt-2 flex items-center gap-3">
                            <span className="text-[10px] font-mono text-stone-400">{latitude?.toFixed(6)}</span>
                            <span className="text-stone-200">|</span>
                            <span className="text-[10px] font-mono text-stone-400">{longitude?.toFixed(6)}</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {!latitude && (
                <div className="p-10 border-2 border-dashed border-stone-100 rounded-3xl flex flex-col items-center justify-center gap-4 text-center">
                    <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center">
                        <MapIcon className="text-stone-200" size={24} />
                    </div>
                    <p className="text-xs text-stone-400 max-w-[200px] leading-relaxed">
                        Search or detect your location to pin it on the map. Drag the marker if needed.
                    </p>
                </div>
            )}
            
            <style jsx global>{`
                .gm-style-cc { display: none !important; }
                .gm-svpc { display: none !important; }
            `}</style>
        </div>
    )
}