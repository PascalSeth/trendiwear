'use client'

import React, { useEffect, useRef, useState } from 'react'
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"

interface OrderMapProps {
  customerLocation: {
    lat: number
    lng: number
    address: string
  }
  sellers: Array<{
    lat: number
    lng: number
    businessName: string
    address: string
  }>
}

export default function OrderMap({ customerLocation, sellers }: OrderMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      v: "weekly"
    });

    Promise.all([
      importLibrary("maps"),
      importLibrary("marker")
    ]).then(() => {
      if (!mapRef.current) return;

      const center = customerLocation;
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

      // Customer Marker
      const customerLatLng = { lat: customerLocation.lat, lng: customerLocation.lng };
      new google.maps.Marker({
        position: customerLatLng,
        map,
        title: "Your Delivery Address",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 7
        }
      });
      bounds.extend(customerLatLng);

      // Seller Markers
      sellers.forEach(seller => {
        if (seller.lat && seller.lng) {
          const sellerLatLng = { lat: seller.lat, lng: seller.lng };
          new google.maps.Marker({
            position: sellerLatLng,
            map,
            title: seller.businessName,
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

          // Path Line
          new google.maps.Polyline({
            path: [customerLatLng, sellerLatLng],
            geodesic: true,
            strokeColor: "#a8a29e",
            strokeOpacity: 0,
            map: map,
            icons: [{
              icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 },
              offset: '0',
              repeat: '10px'
            }],
          });
        }
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      }

      setIsLoaded(true);
    }).catch(err => console.error("OrderMap failed", err));
  }, [customerLocation, sellers]);

  return (
    <div className="relative w-full h-full bg-stone-100 group rounded-[2rem] overflow-hidden border border-stone-200 shadow-sm">
      {!isLoaded && (
        <div className="absolute inset-0 z-10 bg-stone-50 flex flex-col items-center justify-center gap-3">
          <div className="w-5 h-5 border border-stone-200 border-t-stone-900 rounded-full animate-spin" />
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-full grayscale hover:grayscale-0 transition-all duration-1000 ease-out"
        style={{ minHeight: '300px' }}
      />
    </div>
  );
}
