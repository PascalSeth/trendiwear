'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LocationSuggestion {
  place_id: string
  display_name: string
  lat: string
  lon: string
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
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounced search for suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        searchSuggestions(searchQuery)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Close suggestions when clicking outside
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
    try {
      // Use Nominatim API for OpenStreetMap geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&bounded=1&viewbox=-180,-90,180,90` // Global search with more results
      )
      const data: LocationSuggestion[] = await response.json()
      setSuggestions(data)
      setShowSuggestions(data.length > 0)
    } catch (error) {
      console.error('Error searching location:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    const lat = parseFloat(suggestion.lat)
    const lng = parseFloat(suggestion.lon)
    const address = suggestion.display_name

    onLocationChange(lat, lng, address)
    setSearchQuery(address)
    setShowSuggestions(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="space-y-4 relative">
      <div className="space-y-2">
        <Label htmlFor="location-search" className="text-white font-medium">Business Location *</Label>
        <div className="relative">
          <Input
            ref={inputRef}
            id="location-search"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Type any location (e.g., Nairobi, New York, London, shopping mall name)..."
            className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl"
            required
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-400">
          Start typing and select your location from the suggestions
        </p>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              onClick={() => handleSuggestionSelect(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-800 first:rounded-t-xl last:rounded-b-xl border-b border-gray-700 last:border-b-0 text-white text-sm"
            >
              <div className="font-medium truncate">{suggestion.display_name.split(',')[0]}</div>
              <div className="text-gray-400 text-xs truncate">{suggestion.display_name}</div>
            </button>
          ))}
        </div>
      )}

      {latitude && longitude && (
        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
          <h4 className="text-white font-medium mb-2">Selected Location</h4>
          <p className="text-gray-300 text-sm mb-2">{location}</p>
          <div className="text-sm text-gray-400">
            Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </div>
        </div>
      )}
    </div>
  )
}