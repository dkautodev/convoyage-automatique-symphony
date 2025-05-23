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
  const [mapPosition, setMapPosition] = useState<{ lat: number; lng: number } | null>(null);
  const serviceRef = useRef<any>(null);

  // Chargement initial de l'API Google Maps
  useEffect(() => {
    if (!window.google) {
      setLoading(true);
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key= ${GOOGLE_MAPS_API_KEY}&libraries=places`;
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
      // Nettoyage si nécessaire
    };
  }, []);

  // Recherche d'adresses via Google Places (limité à la France)
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

    const adjustedQuery = !query.includes('France') ? `${query}, France` : query;

    console.log("🚀 Appel à Google Places avec :", {
      input: adjustedQuery,
      types: ['address', 'establishment', 'airport'],
      componentRestrictions: { country: 'fr' }
    });

    serviceRef.current.getPlacePredictions(
      {
        input: adjustedQuery,
        types: ['address', 'establishment', 'airport'],
        componentRestrictions: {
          country: 'fr'
        }
      },
      (results: GoogleAddressSuggestion[], status: string) => {
        console.log("📊 Réponse de Google Places :", {
          status,
          resultsCount: results?.length || 0
        });

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

  // Récupère les détails complets d'une adresse via placeId
  const getPlaceDetails = async (placeId: string) => {
    if (!window.google) return null;

    setLoading(true);

    try {
      const geocoder = new window.google.maps.Geocoder();

      return new Promise<GoogleGeocodingResult>((resolve, reject) => {
        geocoder.geocode({ placeId }, (results: GoogleGeocodingResult[], status: string) => {
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];

            // Extraction des composants d'adresse
            const addressComponents = {
              street_number: '',
              route: '',
              locality: '',
              postal_code: '',
              country: ''
            };

            result.address_components.forEach((component: any) => {
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

            // Vérification que c'est bien une adresse en France
            if (addressComponents.country !== 'France') {
              console.warn("Adresse non française ignorée :", result.formatted_address);
              reject(new Error('Seules les adresses françaises sont autorisées'));
              return;
            }

            let latitude: number = 0;
            let longitude: number = 0;

            const location = result.geometry?.location;

            if (location) {
              if (typeof location.lat === 'function' && typeof location.lng === 'function') {
                latitude = location.lat();
                longitude = location.lng();
              } else if (typeof location.lat === 'number' && typeof location.lng === 'number') {
                latitude = location.lat;
                longitude = location.lng;
              }
            }

            // Créer un objet enrichi
            const enhancedResult = {
              ...result,
              extracted_data: {
                street: `${addressComponents.street_number} ${addressComponents.route}`.trim(),
                city: addressComponents.locality,
                postal_code: addressComponents.postal_code,
                country: addressComponents.country
              },
              lat: latitude,
              lng: longitude
            };

            setSelectedAddress(enhancedResult);
            setMapPosition({ lat: latitude, lng: longitude });
            setPredictions([]);

            console.log("Détails de l'adresse récupérés :", enhancedResult);
            resolve(enhancedResult);
          } else {
            console.error("Erreur lors de la récupération des détails :", status);
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