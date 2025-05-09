
import { LegalStatusType, Address } from '@/hooks/auth/types';

// Interface pour le résultat du geocoding de Google
export interface GoogleGeocodingResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: () => number | number;
      lng: () => number | number;
    };
  };
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
  extracted_data?: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
}

// Interface pour les suggestions d'adresse de Google
export interface GoogleAddressSuggestion {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

// Interface pour les données d'inscription basique
export interface BasicRegisterFormData {
  email: string;
  password: string;
  role: string;
  adminToken?: string;
}

// Interface pour les données d'inscription du client
export interface ClientProfileFormData {
  fullName: string;
  companyName: string;
  billingAddress: Address;
  siret: string;
  tvaNumb?: string;
  phone1: string;
  phone2?: string;
}

// Interface pour les données d'inscription du chauffeur
export interface DriverProfileFormData {
  fullName: string;
  companyName: string;
  billingAddress: Address;
  siret: string;
  tvaApplicable: boolean;
  tvaNumb?: string;
  phone1: string;
  phone2?: string;
  documents?: Record<string, File>;
}

// Interface pour la seconde étape du profil chauffeur
export interface DriverConfigFormData {
  legalStatus: LegalStatusType;
  licenseNumber: string;
  idNumber: string;
  documents?: Record<string, File>;
}

// Interface pour les anciennes données d'inscription
export interface RegisterFormData {
  email: string;
  password: string;
  role: string;
  fullName: string;
  companyName?: string;
  siret?: string;
}
