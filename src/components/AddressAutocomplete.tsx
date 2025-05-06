
import React, { useState, useEffect, useRef } from 'react';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, MapPin } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: string, placeId: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
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
  
  // Debounce search input
  useEffect(() => {
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
  }, [value, searchPlaces, clearPredictions]);
  
  const handleSelect = async (prediction: any) => {
    try {
      const details = await getPlaceDetails(prediction.place_id);
      if (details) {
        onChange(details.formatted_address);
        onSelect(details.formatted_address, prediction.place_id);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error selecting address:', error);
    }
  };

  const handleClear = () => {
    onChange('');
    setShowSuggestions(false);
    clearPredictions();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setFocused(true);
            if (value) setShowSuggestions(true);
          }}
          onBlur={() => {
            // Delay hiding to allow click on suggestions
            setTimeout(() => {
              setFocused(false);
              setShowSuggestions(false);
            }, 200);
          }}
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
      
      {showSuggestions && predictions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg overflow-hidden">
          <ul className="py-1 max-h-60 overflow-auto">
            {predictions.map((prediction) => (
              <li
                key={prediction.place_id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(prediction);
                }}
                className="px-4 py-2 hover:bg-muted cursor-pointer flex items-start gap-2"
              >
                <MapPin size={16} className="mt-1 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium">{prediction.structured_formatting.main_text}</p>
                  <p className="text-sm text-muted-foreground">{prediction.structured_formatting.secondary_text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      
      {loading && focused && (
        <div className="absolute right-3 top-3">
          <div className="h-4 w-4 border-t-2 border-primary rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
