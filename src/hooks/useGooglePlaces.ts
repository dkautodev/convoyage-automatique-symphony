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
  const serviceRef = useRef<any>(null);
  
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
      if (!serviceRef.current) {
        serviceRef.current = new window.google.maps.places.AutocompleteService();
      }
      
      // Include both addresses and establishments (companies) in search
      serviceRef.current.getPlacePredictions(
        { 
          input: query, 
          types: ['address', 'establishment'],
          // Include European countries with France prioritized
          componentRestrictions: { country: ['fr', 'de', 'es', 'it', 'be', 'ch', 'nl', 'pt', 'gb', 'at', 'pl'] }
        },
        (results: GoogleAddressSuggestion[], status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            // Sort results to prioritize French addresses
            const sortedResults = [...results].sort((a, b) => {
              const aIsFrance = a.description.includes('France');
              const bIsFrance = b.description.includes('France');
              
              if (aIsFrance && !bIsFrance) return -1;
              if (!aIsFrance && bIsFrance) return 1;
              return 0;
            });
            
            setPredictions(sortedResults);
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
            
            // Extract address components including establishment name
            const addressComponents = {
              street_number: '',
              route: '',
              locality: '',
              postal_code: '',
              country: '',
              establishment: '' // Add establishment name
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
              } else if (component.types.includes('establishment')) {
                addressComponents.establishment = component.long_name;
              }
            });
            
            // Handle latitude and longitude extraction
            let latitude: number = 0;
            let longitude: number = 0;
            
            const location = result.geometry.location;
            
            if (location) {
              if (typeof location === 'object') {
                if (typeof location.lat === 'function' && typeof location.lng === 'function') {
                  try {
                    latitude = location.lat();
                    longitude = location.lng();
                  } catch (e) {
                    console.error('Error calling lat/lng functions:', e);
                  }
                }
                else if (typeof location.lat === 'number' && typeof location.lng === 'number') {
                  latitude = location.lat;
                  longitude = location.lng;
                }
              }
            }
            
            // Enhanced result with extracted data including establishment name
            const enhancedResult = {
              ...result,
              extracted_data: {
                street: `${addressComponents.street_number} ${addressComponents.route}`.trim(),
                city: addressComponents.locality,
                postal_code: addressComponents.postal_code,
                country: addressComponents.country,
                establishment: addressComponents.establishment, // Include establishment name
              },
              lat: latitude,
              lng: longitude
            };

            setSelectedAddress(enhancedResult);
            setMapPosition({
              lat: latitude,
              lng: longitude
            });

            console.log("Détails de l'adresse récupérés:", enhancedResult);
            resolve(enhancedResult);
            
            setPredictions([]);
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
      if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
        console.error('Coordonnées d\'origine ou de destination invalides', origin, destination);
        return null;
      }

      console.log('Calcul de distance entre:', origin, 'et', destination);
      const service = new window.google.maps.DistanceMatrixService();
      
      return new Promise<{distance: string, duration: string, distanceValue: number}>((resolve, reject) => {
        service.getDistanceMatrix(
          {
            origins: [new window.google.maps.LatLng(origin.lat, origin.lng)],
            destinations: [new window.google.maps.LatLng(destination.lat, destination.lng)],
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.METRIC,
          },
          (response: any, status: string) => {
            console.log('Réponse DistanceMatrix:', response, 'Status:', status);
            if (status === 'OK' && response && 
                response.rows && response.rows[0] && 
                response.rows[0].elements && response.rows[0].elements[0] &&
                response.rows[0].elements[0].status === 'OK') {
              const distance = response.rows[0].elements[0].distance.text;
              const duration = response.rows[0].elements[0].duration.text;
              const distanceValue = response.rows[0].elements[0].distance.value;
              console.log('Distance calculée:', distance, 'Durée:', duration);
              resolve({
                distance,
                duration,
                distanceValue
              });
            } else {
              console.error('Erreur lors du calcul de la distance:', status, response);
              reject(new Error('Impossible de calculer la distance'));
            }
          }
        );
      });
    } catch (error) {
      console.error('Exception lors du calcul de la distance:', error);
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
