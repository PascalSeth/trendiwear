'use client'

import React, { useEffect, useRef, useState } from 'react'
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"


interface Seller {
  name: string
  lat: number | null
  lng: number | null
  address: string | null
  fullName: string
}

interface PickupMapProps {
  userAddress?: {
    latitude: number | null
    longitude: number | null
    firstName: string
    lastName: string
    street?: string
  } | null
  sellers: Seller[]
}

export default function PickupMap({ userAddress, sellers }: PickupMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      v: "weekly"
    });

    Promise.all([
      importLibrary("maps"),
      importLibrary("marker"),
      importLibrary("geometry")
    ]).then(() => {
      if (!mapRef.current) return;

      const center = userAddress?.latitude && userAddress?.longitude 
        ? { lat: userAddress.latitude, lng: userAddress.longitude } 
        : { lat: 5.6037, lng: -0.1870 }; // Accra default

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          {
            "featureType": "all",
            "elementType": "all",
            "stylers": [{ "saturation": -100 }, { "gamma": 0.5 }]
          },
          {
            "featureType": "water",
            "elementType": "all",
            "stylers": [{ "color": "#f1f1f1" }, { "visibility": "on" }]
          }
        ]
      });

      const bounds = new google.maps.LatLngBounds();

      // Add User Marker
      if (userAddress?.latitude && userAddress?.longitude) {
        const userLatLng = { lat: userAddress.latitude, lng: userAddress.longitude };
        
        // Premium pulsating-style marker would need a custom OverlayView or complex SVG
        // For now, using standard with custom color if possible, or just a prominent title
        new google.maps.Marker({
          position: userLatLng,
          map,
          title: "Your Location",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#2563eb',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8
          }
        });
        bounds.extend(userLatLng);
      }

      // Add Seller Markers & Path Lines
      sellers.forEach(seller => {
        if (seller.lat && seller.lng) {
          const sellerLatLng = { lat: seller.lat, lng: seller.lng };
          
          new google.maps.Marker({
            position: sellerLatLng,
            map,
            title: seller.name,
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              fillColor: '#78716c',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 1,
              scale: 5
            }
          });
          bounds.extend(sellerLatLng);

          // Draw dashed line
          if (userAddress?.latitude && userAddress?.longitude) {
            new google.maps.Polyline({
              path: [
                { lat: userAddress.latitude, lng: userAddress.longitude },
                sellerLatLng
              ],
              geodesic: true,
              strokeColor: "#a8a29e",
              strokeOpacity: 0, // Dotted line trick
              map: map,
              icons: [{
                icon: {
                  path: 'M 0,-1 0,1',
                  strokeOpacity: 1,
                  scale: 2
                },
                offset: '0',
                repeat: '10px'
              }],
            });
          }
        }
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      }

      setIsLoaded(true);
    }).catch(err => {
      console.error("Google Maps failed in PickupMap", err);
      setError("Failed to load map engine.");
    });
  }, [userAddress, sellers]);

  return (
    <div className="relative w-full h-full bg-stone-100 group overflow-hidden">
      {!isLoaded && !error && (
        <div className="absolute inset-0 z-10 bg-stone-50 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Initializing Atelier Map...</span>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 z-10 bg-stone-100 flex items-center justify-center p-6 text-center">
          <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest leading-relaxed">
            {error}
          </p>
        </div>
      )}

      <div 
        ref={mapRef} 
        className="w-full h-full grayscale hover:grayscale-0 transition-all duration-1000 ease-out"
        style={{ minHeight: '350px' }}
      />

      <div className="absolute top-6 right-6 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
         <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-200 text-[9px] font-mono uppercase tracking-widest text-stone-900 shadow-xl">
           Interacting with Atelier Map
         </span>
      </div>
    </div>
  );
}
