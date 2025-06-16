
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
  error,
  disabled = false
}: AddressAutocompleteProps) {
  const { predictions, loading, searchPlaces, getPlaceDetails, clearPredictions } = useGooglePlaces();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const [previousValue, setPreviousValue] = useState(value);
  const [lastSelectedValue, setLastSelectedValue] = useState<string>('');
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Détecter les changements de valeur depuis l'extérieur (comme le swap)
  useEffect(() => {
    if (value !== previousValue) {
      console.log("[AddressAutocomplete] Valeur changée depuis l'extérieur:", previousValue, "->", value);
      
      // Si la nouvelle valeur est différente de celle qu'on avait sélectionnée,
      // cela signifie que c'est un changement externe (comme un swap)
      if (value !== lastSelectedValue) {
        setIsAddressSelected(false);
        window.selectedAddressData = null;
      }
      
      setPreviousValue(value);
    }
  }, [value, previousValue, lastSelectedValue]);

  // Debounce search input
  useEffect(() => {
    if (isAddressSelected || disabled) return; // Ne pas rechercher si une adresse a été sélectionnée ou si désactivé
    
    const timer = setTimeout(() => {
      // Afficher les suggestions uniquement si l'input est en focus
      if (value && focused) {
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
  }, [value, searchPlaces, clearPredictions, isAddressSelected, focused, disabled]);

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
      // Forcer la fermeture des suggestions immédiatement
      setShowSuggestions(false);
      setIsAddressSelected(true);
      
      const details = await getPlaceDetails(prediction.place_id);
      if (details) {
        // Stocker temporairement les données de l'adresse pour que le composant parent puisse les récupérer
        window.selectedAddressData = details;
        
        onChange(details.formatted_address);
        setPreviousValue(details.formatted_address);
        setLastSelectedValue(details.formatted_address);
        
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
    if (disabled) return; // Ne pas permettre de vider si désactivé
    
    onChange('');
    setPreviousValue('');
    setLastSelectedValue('');
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
    if (disabled) return; // Ne pas permettre le focus si désactivé
    
    setFocused(true);
    // Seulement montrer les suggestions si l'adresse n'a pas été sélectionnée et qu'il y a une valeur
    if (value && !isAddressSelected) {
      searchPlaces(value);
      setShowSuggestions(true);
    }
  };
  
  const handleBlur = (e: React.FocusEvent) => {
    // On conserve cet état pour les styles CSS mais on ne ferme pas les suggestions ici
    // car cela pourrait empêcher de cliquer sur une suggestion
    // La fermeture se fait via le click outside handler
    if (
      suggestionsRef.current && 
      !suggestionsRef.current.contains(e.relatedTarget as Node)
    ) {
      // Ne pas modifier si on clique sur une suggestion
    }
  };
  
  // Permettre à l'utilisateur de recommencer la saisie
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return; // Ne pas permettre la modification si désactivé
    
    const newValue = e.target.value;
    console.log("[AddressAutocomplete] handleInputChange:", newValue);
    onChange(newValue);
    setPreviousValue(newValue);

    // Si l'utilisateur modifie l'adresse après une sélection, réactiver la recherche
    if (isAddressSelected) {
      setIsAddressSelected(false);
      setLastSelectedValue('');
      window.selectedAddressData = null;
    }
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
      
      {/* Conditionnellement afficher les suggestions seulement quand focused est true,
          une adresse n'est pas déjà sélectionnée, et nous avons des prédictions */}
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
