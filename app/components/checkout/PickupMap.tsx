'use client'

import React, { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { calculateDistance } from '@/lib/utils/geo'
import type * as Leaflet from 'leaflet';

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
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    let map: ReturnType<typeof Leaflet.map> | null = null;
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current) return;

      const L = await import('leaflet');
      if (!isMounted) return;
      
      // Secondary check: Did React already initialize a map on this DOM node during a race?
      if (initializedRef.current) return;
      
      // Fix marker icons using type coercion instead of ts-expect-error
      const DefaultIcon = L.Icon.Default as unknown as { 
        prototype: { _fixed?: boolean, _getIconUrl?: unknown }, 
        mergeOptions: (options: unknown) => void 
      };
      
      if (!DefaultIcon.prototype._fixed) {
        delete DefaultIcon.prototype._getIconUrl;
        DefaultIcon.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
        DefaultIcon.prototype._fixed = true;
      }

      const center: [number, number] = userAddress?.latitude && userAddress?.longitude 
        ? [userAddress.latitude, userAddress.longitude] 
        : [5.6037, -0.1870];

      try {
        map = L.map(mapContainerRef.current, {
          center,
          zoom: 12,
          scrollWheelZoom: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Only proceed if still mounted
        if (!isMounted || !mapContainerRef.current) {
          if (map) map.remove();
          return;
        }

        const bounds = L.latLngBounds([]);

        // Custom Blue Pulse Icon for User
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div>
              <div class="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        // Add User Marker
        if (userAddress?.latitude && userAddress?.longitude && isMounted) {
          const userLatLng: [number, number] = [userAddress.latitude, userAddress.longitude];
          L.marker(userLatLng, { icon: userIcon })
            .addTo(map)
            .bindPopup(`
              <div class="p-1">
                <div class="font-mono text-[10px] uppercase tracking-widest text-blue-600 mb-1">Your Delivery Address</div>
                <div class="font-bold text-stone-900 mb-1">${userAddress.firstName} ${userAddress.lastName}</div>
                <div class="text-[10px] text-stone-500 leading-relaxed italic">${userAddress.street || 'Selected Location'}</div>
              </div>
            `);
          bounds.extend(userLatLng);
        }

        // Add Seller Markers & Lines
        sellers.forEach((seller) => {
          if (seller.lat && seller.lng && isMounted) {
            const sellerLatLng: [number, number] = [seller.lat, seller.lng];
            const dist = userAddress?.latitude && userAddress?.longitude
              ? calculateDistance(userAddress.latitude, userAddress.longitude, seller.lat, seller.lng)
              : null;

            const distHtml = dist !== null 
              ? `<div class="pt-2 border-t border-stone-100 flex items-center justify-between">
                   <div class="flex items-center gap-1.5">
                     <div class="w-1 h-1 rounded-full bg-emerald-500"></div>
                     <span class="font-mono text-[10px] uppercase tracking-widest font-black text-emerald-600">${dist} km</span>
                   </div>
                   <span class="text-[9px] font-mono uppercase tracking-[0.2em] text-stone-400">Away</span>
                 </div>`
              : '';

            L.marker(sellerLatLng)
              .addTo(map)
              .bindPopup(`
                <div class="p-1 space-y-2 min-w-[150px]">
                  <div class="font-mono text-[10px] uppercase tracking-widest text-amber-600 flex items-center gap-2">
                    <span>📍</span> The Seller
                  </div>
                  <div class="font-serif text-base text-stone-900 leading-tight">${seller.name}</div>
                  <div class="text-[10px] text-stone-500 leading-relaxed italic">${seller.address}</div>
                  ${distHtml}
                </div>
              `);
            
            bounds.extend(sellerLatLng);

            // Draw dashed line between user and seller
            if (userAddress?.latitude && userAddress?.longitude) {
              L.polyline([[userAddress.latitude, userAddress.longitude], sellerLatLng], {
                color: '#D4D4D8',
                weight: 1,
                dashArray: '5, 10',
                opacity: 0.6
              }).addTo(map);
            }
          }
        });

        // Auto-fit to show all locations
        if (bounds.isValid() && isMounted) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }

        if (isMounted) {
          setIsLoaded(true);
        } else {
          map.remove();
        }
      } catch (err) {
        console.warn('Map initialization failed:', err);
      }
      initializedRef.current = true;
    };

    initMap();

    return () => {
      isMounted = false;
      if (map) {
        map.remove();
        initializedRef.current = false;
      }
    }
  }, [userAddress, sellers]);

  return (
    <div className="relative w-full h-full bg-stone-100 group">
      {/* Loading State Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 bg-stone-50 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Initializing Map...</span>
        </div>
      )}

      {/* The Map Div with Profile Aesthetics */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full grayscale hover:grayscale-0 transition-all duration-1500 ease-out z-0"
        style={{ minHeight: '350px' }}
      />

      {/* Profile Style Indicator Overlay (Optional, matches tz/id feel) */}
      <div className="absolute top-6 right-6 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
         <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-200 text-[9px] font-mono uppercase tracking-widest text-stone-900 shadow-xl">
           Interacting with Atelier Map
         </span>
      </div>
    </div>
  )
}
