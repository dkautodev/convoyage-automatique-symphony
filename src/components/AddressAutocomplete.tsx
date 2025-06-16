
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
  disabled?: boolean;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter address...',
  className,
  error,
  disabled = false
}: AddressAutocompleteProps) {
  const { predictions, loading, searchPlaces, getPlaceDetails, clearPredictions } = useGooglePlaces();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevValueRef = useRef<string>('');
  
  // Détecter les changements de valeur externes (comme le swap)
  useEffect(() => {
    if (value !== prevValueRef.current) {
      console.log("[AddressAutocomplete] Changement de valeur externe détecté:", prevValueRef.current, "->", value);
      
      // Si la valeur change et qu'on avait une adresse sélectionnée, réinitialiser
      if (isAddressSelected && value !== prevValueRef.current) {
        console.log("[AddressAutocomplete] Réinitialisation après changement externe");
        setIsAddressSelected(false);
        setShowSuggestions(false);
      }
      
      prevValueRef.current = value;
    }
  }, [value, isAddressSelected]);

  // Debounce search input - version simplifiée
  useEffect(() => {
    if (disabled || isAddressSelected) return;
    
    const timer = setTimeout(() => {
      if (value && focused && !isAddressSelected) {
        console.log("[AddressAutocomplete] Recherche pour:", value);
        searchPlaces(value);
        setShowSuggestions(true);
      } else {
        clearPredictions();
        if (!focused) {
          setShowSuggestions(false);
        }
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [value, searchPlaces, clearPredictions, focused, disabled, isAddressSelected]);

  // Add click outside listener to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSelect = async (prediction: any) => {
    try {
      console.log("[AddressAutocomplete] Sélection d'une adresse:", prediction);
      setShowSuggestions(false);
      setIsAddressSelected(true);
      
      const details = await getPlaceDetails(prediction.place_id);
      if (details) {
        const selectedAddress = details.formatted_address;
        console.log("[AddressAutocomplete] Adresse sélectionnée:", selectedAddress);
        
        // Mettre à jour la valeur et marquer comme sélectionnée
        onChange(selectedAddress);
        prevValueRef.current = selectedAddress;
        
        setTimeout(() => {
          onSelect(selectedAddress, prediction.place_id, details);
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
    if (disabled) return;
    
    console.log("[AddressAutocomplete] Nettoyage du champ");
    onChange('');
    prevValueRef.current = '';
    setShowSuggestions(false);
    setIsAddressSelected(false);
    clearPredictions();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const handleFocus = () => {
    if (disabled) return;
    
    console.log("[AddressAutocomplete] Focus sur le champ");
    setFocused(true);
    if (value && !isAddressSelected) {
      searchPlaces(value);
      setShowSuggestions(true);
    }
  };
  
  const handleBlur = (e: React.FocusEvent) => {
    if (
      suggestionsRef.current && 
      !suggestionsRef.current.contains(e.relatedTarget as Node)
    ) {
      // Ne pas modifier si on clique sur une suggestion
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const newValue = e.target.value;
    console.log("[AddressAutocomplete] Modification manuelle:", newValue);
    
    // Si l'utilisateur modifie l'adresse après une sélection, réactiver la recherche
    if (isAddressSelected) {
      setIsAddressSelected(false);
    }
    
    onChange(newValue);
    prevValueRef.current = newValue;
  };
  
  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`pr-10 ${className} ${error ? 'border-red-500' : ''} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          disabled={disabled}
        />
        {value && !disabled && (
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
      
      {showSuggestions && predictions.length > 0 && !isAddressSelected && focused && !disabled && (
        <Card ref={suggestionsRef} className="absolute z-50 w-full mt-1 shadow-lg overflow-hidden">
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
      
      {loading && focused && !isAddressSelected && !disabled && (
        <div className="absolute right-3 top-3">
          <div className="h-4 w-4 border-t-2 border-primary rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
