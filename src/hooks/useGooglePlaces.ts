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

      // Forcer "France" dans la requête si absent
      const adjustedQuery = !query.includes('France') ? `${query}, France` : query;

      // Appel à l'API Google Places
      serviceRef.current.getPlacePredictions(
        {
          input: adjustedQuery,
          types: ['address', 'establishment'], // Inclure adresses et établissements
          componentRestrictions: {
            country: 'fr' // Restriction à la France uniquement
          }
        },
        (results: GoogleAddressSuggestion[], status: string) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            results &&
            results.length > 0
          ) {
            setPredictions(results); // Aucun tri nécessaire maintenant
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

            // Gestion robuste de la géométrie
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

  // Calcul de distance entre deux points
  const calculateDistance = async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ) => {
    if (!window.google) return null;

    try {
      if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
        console.error('Coordonnées invalides pour le calcul de distance', origin, destination);
        return null;
      }

      const service = new window.google.maps.DistanceMatrixService();

      return new Promise<{ distance: string; duration: string; distanceValue: number }>(
        (resolve, reject) => {
          service.getDistanceMatrix(
            {
              origins: [new window.google.maps.LatLng(origin.lat, origin.lng)],
              destinations: [new window.google.maps.LatLng(destination.lat, destination.lng)],
              travelMode: window.google.maps.TravelMode.DRIVING,
              unitSystem: window.google.maps.UnitSystem.METRIC,
            },
            (response: any, status: string) => {
              if (
                status === 'OK' &&
                response &&
                response.rows &&
                response.rows[0] &&
                response.rows[0].elements &&
                response.rows[0].elements[0] &&
                response.rows[0].elements[0].status === 'OK'
              ) {
                const element = response.rows[0].elements[0];
                const distance = element.distance.text;
                const duration = element.duration.text;
                const distanceValue = element.distance.value;

                console.log('Distance calculée :', distance, 'Durée :', duration);
                resolve({
                  distance,
                  duration,
                  distanceValue
                });
              } else {
                console.error('Erreur lors du calcul de la distance :', status, response);
                reject(new Error('Impossible de calculer la distance'));
              }
            }
          );
        }
      );
    } catch (error) {
      console.error('Exception lors du calcul de la distance :', error);
      return null;
    }
  };

  // Efface les suggestions affichées
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