
import { useState, useEffect, useRef } from 'react';
import { GoogleAddressSuggestion, GoogleGeocodingResult } from '../types/auth';

declare global {
  interface Window {
    google: any;
    initAutocomplete: () => void;
  }
}

const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"; // This should be replaced with an environment variable

export const useGooglePlaces = () => {
  const [predictions, setPredictions] = useState<GoogleAddressSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAddress, setSelectedAddress] = useState<GoogleGeocodingResult | null>(null);
  const [mapPosition, setMapPosition] = useState<{lat: number, lng: number} | null>(null);
  
  useEffect(() => {
    // Load Google Maps API script
    if (!window.google) {
      setLoading(true);
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setLoading(false);
      };
      document.head.appendChild(script);
    }
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  const searchPlaces = async (query: string) => {
    if (!window.google || !query.trim()) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    
    try {
      const service = new window.google.maps.places.AutocompleteService();
      
      service.getPlacePredictions(
        { input: query, types: ['address'], componentRestrictions: { country: 'fr' } },
        (results: GoogleAddressSuggestion[], status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Erreur lors de la recherche d\'adresses :', error);
      setLoading(false);
      setPredictions([]);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    if (!window.google) return null;
    
    setLoading(true);
    
    try {
      const geocoder = new window.google.maps.Geocoder();
      
      return new Promise<GoogleGeocodingResult>((resolve, reject) => {
        geocoder.geocode({ placeId }, (results: GoogleGeocodingResult[], status: string) => {
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            setSelectedAddress(result);
            setMapPosition({
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng
            });
            resolve(result);
          } else {
            reject(new Error('Lieu non trouvé'));
          }
          setLoading(false);
        });
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du lieu :', error);
      setLoading(false);
      return null;
    }
  };

  const clearPredictions = () => {
    setPredictions([]);
  };

  return {
    predictions,
    loading,
    selectedAddress,
    mapPosition,
    searchPlaces,
    getPlaceDetails,
    clearPredictions
  };
};
