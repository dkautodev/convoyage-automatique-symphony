
import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface AddressMapProps {
  lat?: number;
  lng?: number;
}

export default function AddressMap({ lat, lng }: AddressMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  useEffect(() => {
    // Initialize map only if we have coordinates and Google Maps is loaded
    if (!lat || !lng || !mapRef.current || !window.google) return;
    
    const position = { lat, lng };
    
    // Create map instance if not already created
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: position,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });
    } else {
      // Or just update center
      mapInstanceRef.current.setCenter(position);
    }
    
    // Create or update marker
    if (!markerRef.current) {
      markerRef.current = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        animation: window.google.maps.Animation.DROP
      });
    } else {
      markerRef.current.setPosition(position);
    }
  }, [lat, lng]);
  
  if (!lat || !lng) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center text-muted-foreground h-[200px] flex items-center justify-center">
          <p>Enter an address to see the location</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0">
        <div ref={mapRef} className="h-[200px] w-full" />
      </CardContent>
    </Card>
  );
}
