import { User } from '@supabase/supabase-js';
import { UserRole, VehicleCategory, Address } from '@/types/supabase';
import { Session } from '@supabase/supabase-js';

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
  role: UserRole;
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
  licenseNumber: string;
  vehicleType: VehicleCategory;
  idNumber: string;
  documents?: Record<string, File>;
}

// Interface pour les anciennes données d'inscription
export interface RegisterFormData {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  companyName?: string;
  siret?: string;
}

// Interface pour le profil utilisateur
export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  company_name?: string | null;
  billing_address?: Address;
  siret?: string | null;
  tva_number?: string | null;
  tva_applicable?: boolean;
  phone_1?: string | null;
  phone_2?: string | null;
  driver_license?: string | null;
  vehicle_type?: VehicleCategory | null;
  vehicle_registration?: string | null;
  created_at: string;
  last_login: string | null;
  active: boolean;
  profile_completed: boolean;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  basicRegister: (data: BasicRegisterFormData) => Promise<void>; // Assurez-vous que cette ligne existe
  completeClientProfile: (data: ClientProfileFormData) => Promise<void>;
  completeDriverProfile: (data: DriverProfileFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyAdminToken: (token: string, email: string) => Promise<boolean>;
  uploadDriverDocument: (file: File, type: string) => Promise<string | null>;
}
