
export type UserRole = 'client' | 'chauffeur' | 'admin';

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
  vatNumber?: string;
  phone1: string;
  phone2?: string;
  gdprConsent: boolean;
  role: UserRole;
  vatApplicable?: boolean;
  licenseNumber?: string;
  vehicleType?: string;
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
