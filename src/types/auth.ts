
import { UserRole } from './supabase';

// Type pour le formulaire initial d'inscription
export interface BasicRegisterFormData {
  email: string;
  password: string;
  passwordConfirmation?: string; // Ajout de la confirmation de mot de passe
  role: UserRole;
  adminToken?: string; // Optionnel, utilisé uniquement pour les inscriptions admin
}

// Type pour le profil complet du client
export interface ClientProfileFormData {
  companyName: string;
  fullName: string;
  billingAddress: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
    formatted_address?: string;
    lat?: number;
    lng?: number;
  };
  siret: string;
  tvaNumb?: string;
  phone1: string;
  phone2?: string;
}

// Type pour le profil complet du chauffeur
export interface DriverProfileFormData {
  companyName: string;
  fullName: string;
  billingAddress: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
    formatted_address?: string;
    lat?: number;
    lng?: number;
  };
  siret: string;
  tvaApplicable: boolean;
  tvaNumb?: string;
  phone1: string;
  phone2?: string;
  licenseNumber: string;
  vehicleType: string; // Changé en string pour corriger l'erreur TS2769
  idNumber: string; // Numéro CNI/Passeport
  documents: {
    kbis?: File;
    driverLicenseFront?: File;
    driverLicenseBack?: File;
    vigilanceAttestation?: File;
    idDocument?: File;
  };
}

// Type pour le formulaire d'inscription complet (pour compatibilité avec le code existant)
export interface RegisterFormData {
  email: string;
  password: string;
  companyName: string;
  billingAddress: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
    formatted_address?: string;
    lat?: number;
    lng?: number;
  };
  siret: string;
  tvaNumb?: string;
  phone1: string;
  phone2?: string;
  gdprConsent: boolean;
  role: UserRole;
  tvaApplicable?: boolean;
  licenseNumber?: string;
  vehicleType?: string; // Changé en string pour correspondre au changement dans DriverProfileFormData
  fullName?: string;
}

export interface AddressComponentType {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GoogleAddressSuggestion {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface GoogleGeocodingResult {
  address_components: AddressComponentType[];
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id: string;
}
