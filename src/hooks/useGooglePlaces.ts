
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

    // Forcer "France" dans la requête si aucun n'est présent
    const adjustedQuery = !query.includes('France') 
      ? `${query}, France` 
      : query;

    serviceRef.current.getPlacePredictions(
      {
        input: adjustedQuery,
        types: ['address', 'establishment'], // Optionnel : inclure les établissements
        componentRestrictions: {
          country: ['fr'] // Exclure TOUS les autres pays européens
        }
      },
      (results: GoogleAddressSuggestion[], status: string) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          results &&
          results.length > 0
        ) {
          // Ne plus trier, car seul "France" est autorisé
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
            
            // Fix: Handle the latitude and longitude extraction properly
            let latitude: number = 0;
            let longitude: number = 0;
            
            // Access the location object directly to avoid TypeScript errors
            const location = result.geometry.location;
            
            // Check if location has lat and lng as functions or properties
            if (location) {
              // Handle location as a direct object with lat/lng properties
              if (typeof location === 'object') {
                // Si location.lat est une fonction
                if (typeof location.lat === 'function' && typeof location.lng === 'function') {
                  try {
                    latitude = location.lat();
                    longitude = location.lng();
                  } catch (e) {
                    console.error('Error calling lat/lng functions:', e);
                  }
                }
                // Si location.lat est une propriété directe
                else if (typeof location.lat === 'number' && typeof location.lng === 'number') {
                  latitude = location.lat;
                  longitude = location.lng;
                }
              }
            }
            
            // Améliorer l'objet résultat avec les données extraites
            const enhancedResult = {
              ...result,
              extracted_data: {
                street: `${addressComponents.street_number} ${addressComponents.route}`.trim(),
                city: addressComponents.locality,
                postal_code: addressComponents.postal_code,
                country: addressComponents.country,
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
            
            // Effacer les prédictions après avoir récupéré les détails
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
              // IMPORTANT: Ajouter la valeur numérique de la distance en mètres
              const distanceValue = response.rows[0].elements[0].distance.value;
              console.log('Distance calculée:', distance, 'Durée:', duration);
              resolve({
                distance,
                duration,
                distanceValue // Ajouter cette valeur
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
