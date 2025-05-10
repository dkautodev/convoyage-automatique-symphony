
import React, { useState, useEffect, useRef } from 'react';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, MapPin } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: string, placeId: string, addressData?: any) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

// Déclarer une variable globale pour stocker temporairement les données d'adresse
declare global {
  interface Window {
    selectedAddressData: any;
  }
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter address...',
  className,
  error
}: AddressAutocompleteProps) {
  const { predictions, loading, searchPlaces, getPlaceDetails, clearPredictions } = useGooglePlaces();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  
  // Debounce search input
  useEffect(() => {
    if (isAddressSelected) return; // Ne pas rechercher si une adresse a été sélectionnée
    
    const timer = setTimeout(() => {
      if (value) {
        searchPlaces(value);
        setShowSuggestions(true);
      } else {
        clearPredictions();
        setShowSuggestions(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [value, searchPlaces, clearPredictions, isAddressSelected]);
  
  const handleSelect = async (prediction: any) => {
    try {
      // Forcer la fermeture des suggestions immédiatement
      setShowSuggestions(false);
      setIsAddressSelected(true);
      
      const details = await getPlaceDetails(prediction.place_id);
      if (details) {
        // Stocker temporairement les données de l'adresse pour que le composant parent puisse les récupérer
        window.selectedAddressData = details;
        
        onChange(details.formatted_address);
        
        // Attendre un court instant pour s'assurer que l'interface se met à jour correctement
        setTimeout(() => {
          onSelect(details.formatted_address, prediction.place_id, details);
          // Enlever le focus de l'input pour éviter que les suggestions réapparaissent
          if (inputRef.current) {
            inputRef.current.blur();
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error selecting address:', error);
      setIsAddressSelected(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setShowSuggestions(false);
    setIsAddressSelected(false);
    clearPredictions();
    window.selectedAddressData = null;
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Gérer le focus pour mieux contrôler l'affichage des suggestions
  const handleFocus = () => {
    setFocused(true);
    // Seulement montrer les suggestions si l'adresse n'a pas été sélectionnée
    if (value && !isAddressSelected) {
      searchPlaces(value);
      setShowSuggestions(true);
    }
  };
  
  const handleBlur = () => {
    // Utiliser un délai pour permettre le clic sur les suggestions
    setTimeout(() => {
      setFocused(false);
      // Ne fermez pas les suggestions si l'utilisateur a cliqué sur une suggestion
      if (!isAddressSelected) {
        setShowSuggestions(false);
      }
    }, 200);
  };
  
  // Permettre à l'utilisateur de recommencer la saisie
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Si l'utilisateur modifie l'adresse après une sélection, réactiver la recherche
    if (isAddressSelected) {
      setIsAddressSelected(false);
      window.selectedAddressData = null;
    }
  };
  
  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`pr-10 ${className} ${error ? 'border-red-500' : ''}`}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
            tabIndex={-1}
          >
            <X size={18} />
          </Button>
        )}
      </div>
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      
      {showSuggestions && predictions.length > 0 && !isAddressSelected && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg overflow-hidden">
          <ul className="py-1 max-h-60 overflow-auto">
            {predictions.map((prediction) => (
              <li
                key={prediction.place_id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(prediction);
                }}
                className="px-4 py-3 hover:bg-muted cursor-pointer flex items-start gap-2 border-b last:border-0 border-gray-100"
              >
                <MapPin size={18} className="mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">{prediction.structured_formatting.main_text}</p>
                  <p className="text-sm text-muted-foreground">{prediction.structured_formatting.secondary_text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      
      {loading && focused && !isAddressSelected && (
        <div className="absolute right-3 top-3">
          <div className="h-4 w-4 border-t-2 border-primary rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
