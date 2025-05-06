
export type UserRole = 'client' | 'driver' | 'admin';

export interface RegisterFormData {
  email: string;
  password: string;
  companyName: string;
  billingAddress: string;
  siret: string;
  tvaNumb?: string;
  phone1: string;
  phone2?: string;
  gdprConsent: boolean;
  role: UserRole;
  tvaApplicable?: boolean;
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
