'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Search, Loader2, Check, Navigation, Globe, X, Map as MapIcon, ChevronRight, Edit3 } from 'lucide-react'
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
    const [manualMode, setManualMode] = useState(false)
    const [manualAddressInput, setManualAddressInput] = useState(location || '')
    
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
            console.warn("Google Maps failed to load", err as Error);
            // Don't hard-error, allow manual fallback
            setError("Live map unavailable. You can still type and confirm your address manually.");
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
        }, 350)

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
                setError("Failed to resolve location coordinates.");
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
            setError('Geolocation not supported on this browser.');
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
                            // Geocoder failed but we have coordinates
                            const fallbackAddress = `Accra Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                            onLocationChange(lat, lng, fallbackAddress);
                            setSearchQuery(fallbackAddress);
                        }
                        setIsSearching(false);
                    });
                } else {
                    // Google maps not loaded, use coordinates directly with fallback
                    const fallbackAddress = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                    onLocationChange(lat, lng, fallbackAddress);
                    setSearchQuery(fallbackAddress);
                    setIsSearching(false);
                }
            },
            () => {
                setIsSearching(false);
                setError('Location access denied. Please type your area name above.');
            },
            { timeout: 8000 }
        );
    };

    const handleManualAddressConfirm = () => {
        if (!manualAddressInput.trim()) return;
        // Default Ghana center / Accra coordinates if user types manually without map engine
        const fallbackLat = latitude || 5.6037;
        const fallbackLng = longitude || -0.1870;
        onLocationChange(fallbackLat, fallbackLng, manualAddressInput.trim());
        setSearchQuery(manualAddressInput.trim());
        setManualMode(false);
        setError(null);
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
        <div className="space-y-4 relative">
            <div className="space-y-2">
                <div className="flex items-center justify-between pb-0.5 flex-wrap gap-2">
                    <Label htmlFor="location-search" className="text-stone-700 text-xs font-medium flex items-center gap-1.5">
                        <MapPin size={13} className="text-stone-500" />
                        <span>Workshop / Shop Address</span>
                    </Label>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setManualMode(!manualMode)}
                            className="text-[11px] font-medium text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors px-2 py-1 rounded-md cursor-pointer"
                        >
                            <Edit3 size={11} />
                            {manualMode ? "Use Search" : "Manual Entry"}
                        </button>
                        <button
                            type="button"
                            onClick={handleDetectLocation}
                            className="text-[11px] font-medium text-stone-700 hover:text-stone-900 flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200/70 px-2.5 py-1 rounded-md border border-stone-200 transition-colors shadow-2xs cursor-pointer"
                        >
                            <Navigation size={11} className={isSearching ? 'animate-spin text-stone-900' : 'text-stone-500'} />
                            Detect
                        </button>
                    </div>
                </div>

                {manualMode ? (
                    <div className="flex gap-2">
                        <Input
                            value={manualAddressInput}
                            onChange={(e) => setManualAddressInput(e.target.value)}
                            placeholder="e.g. Near Oxford Street, Osu, Accra"
                            className="bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus-visible:ring-1 focus-visible:ring-stone-900 h-11 rounded-lg text-sm"
                        />
                        <button
                            type="button"
                            onClick={handleManualAddressConfirm}
                            className="h-11 px-4 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors shrink-0 shadow-2xs cursor-pointer"
                        >
                            Save
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <Input
                            ref={inputRef}
                            id="location-search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            placeholder="Search area in Ghana (e.g. Osu, Kumasi, East Legon)..."
                            className="bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus-visible:ring-1 focus-visible:ring-stone-900 h-11 rounded-lg pl-10 pr-9 text-sm transition-colors shadow-2xs"
                            required
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                            {isSearching ? <Loader2 size={16} className="animate-spin text-stone-500" /> : <Search size={15} className="text-stone-400" />}
                        </div>
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 p-1 cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                )}

                {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5 leading-relaxed">
                        {error}
                    </motion.p>
                )}
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
                {showSuggestions && (
                    <motion.div
                        ref={suggestionsRef}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden"
                    >
                        <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between bg-stone-50 text-[10px] uppercase font-semibold tracking-wider text-stone-500">
                            <span>Locations in Ghana</span>
                            <Globe size={11} />
                        </div>
                        <div className="max-h-60 overflow-y-auto divide-y divide-stone-50">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion.place_id}
                                    onClick={() => handleSuggestionSelect(suggestion)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-stone-50 flex items-start gap-3 transition-colors group cursor-pointer"
                                >
                                    <div className="mt-0.5 w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center shrink-0 group-hover:bg-stone-900 transition-colors">
                                        <MapPin size={12} className="text-stone-500 group-hover:text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-xs sm:text-sm text-stone-900 truncate">{suggestion.mainText}</div>
                                        <div className="text-[11px] text-stone-400 truncate mt-0.5">{suggestion.secondaryText}</div>
                                    </div>
                                    <ChevronRight size={14} className="mt-1 text-stone-300 shrink-0" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Visual Map Area */}
            <div className={latitude && longitude ? "block space-y-3" : "hidden"}>
                <div 
                    ref={mapRef} 
                    className="w-full h-36 sm:h-48 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shadow-inner grayscale-[0.1]"
                />
                
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-stone-50 border border-stone-200 rounded-lg flex items-start gap-3 shadow-2xs"
                >
                    <div className="w-7 h-7 rounded-md bg-stone-200 flex items-center justify-center shrink-0 text-stone-700">
                        <Check size={14} />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="text-[10px] font-semibold text-stone-700 uppercase tracking-wider">Location Pinned</p>
                        <p className="text-xs text-stone-800 leading-snug break-words">{location}</p>
                        <div className="pt-0.5 flex items-center gap-2 text-[10px] font-mono text-stone-400">
                            <span>GPS: {latitude?.toFixed(4)}, {longitude?.toFixed(4)}</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {!latitude && (
                <div className="p-6 border border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center gap-2 text-center bg-stone-50/40">
                    <div className="w-9 h-9 bg-white rounded-lg border border-stone-200 flex items-center justify-center shadow-2xs">
                        <MapIcon className="text-stone-400" size={16} />
                    </div>
                    <p className="text-xs text-stone-700 font-medium">
                        Search your area or click Detect to pin your workshop
                    </p>
                    <p className="text-[11px] text-stone-400 max-w-[280px] leading-relaxed">
                        Clients will be matched with you based on proximity for custom fittings and faster delivery.
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