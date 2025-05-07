
import { useState, useEffect, useRef } from 'react';
import { GoogleAddressSuggestion, GoogleGeocodingResult } from '../types/auth';

declare global {
  interface Window {
    google: any;
    initAutocomplete: () => void;
  }
}

const GOOGLE_MAPS_API_KEY = "AIzaSyA5RjbR6obTrUwTbVGvCZ3JSG_SvHZ_NBs"; 

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
        console.log("Google Maps API chargée avec succès");
      };
      script.onerror = () => {
        setLoading(false);
        console.error("Erreur lors du chargement de l'API Google Maps");
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
            
            // Extraire les composants d'adresse
            const addressComponents = {
              street_number: '',
              route: '',
              locality: '',
              postal_code: '',
              country: ''
            };
            
            result.address_components.forEach(component => {
              if (component.types.includes('street_number')) {
                addressComponents.street_number = component.long_name;
              } else if (component.types.includes('route')) {
                addressComponents.route = component.long_name;
              } else if (component.types.includes('locality')) {
                addressComponents.locality = component.long_name;
              } else if (component.types.includes('postal_code')) {
                addressComponents.postal_code = component.long_name;
              } else if (component.types.includes('country')) {
                addressComponents.country = component.long_name;
              }
            });
            
            // Fix: Properly handle the lat/lng values
            const lat = result.geometry.location.lat;
            const lng = result.geometry.location.lng;
            
            // Améliorer l'objet résultat avec les données extraites
            const enhancedResult = {
              ...result,
              extracted_data: {
                street: `${addressComponents.street_number} ${addressComponents.route}`.trim(),
                city: addressComponents.locality,
                postal_code: addressComponents.postal_code,
                country: addressComponents.country,
              }
            };

            setSelectedAddress(enhancedResult);
            setMapPosition({
              lat: typeof lat === 'function' ? lat() : lat,
              lng: typeof lng === 'function' ? lng() : lng
            });

            console.log("Détails de l'adresse récupérés:", enhancedResult);
            resolve(enhancedResult);
          } else {
            console.error("Erreur lors de la récupération des détails:", status);
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

  const calculateDistance = async (origin: {lat: number, lng: number}, destination: {lat: number, lng: number}) => {
    if (!window.google) return null;
    
    try {
      const service = new window.google.maps.DistanceMatrixService();
      
      return new Promise<{distance: string, duration: string}>((resolve, reject) => {
        service.getDistanceMatrix(
          {
            origins: [new window.google.maps.LatLng(origin.lat, origin.lng)],
            destinations: [new window.google.maps.LatLng(destination.lat, destination.lng)],
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.METRIC,
          },
          (response: any, status: string) => {
            if (status === 'OK' && response) {
              const distance = response.rows[0].elements[0].distance.text;
              const duration = response.rows[0].elements[0].duration.text;
              resolve({
                distance,
                duration
              });
            } else {
              reject(new Error('Impossible de calculer la distance'));
            }
          }
        );
      });
    } catch (error) {
      console.error('Erreur lors du calcul de la distance:', error);
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
    calculateDistance,
    clearPredictions
  };
};
