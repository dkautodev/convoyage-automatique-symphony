
import { UserRole, VehicleCategory } from "@/types/supabase";
import { Address } from "@/types/supabase";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  last_login: string | null;
  active: boolean;
  profile_completed?: boolean;
  
  // Colonnes ajoutées
  company_name?: string;
  billing_address?: Address;
  siret?: string;
  tva_number?: string;
  tva_applicable?: boolean;
  phone_1?: string;
  phone_2?: string;
  driver_license?: string;
  vehicle_type?: VehicleCategory;
  vehicle_registration?: string;
}

export type AuthSession = {
  user: {
    id: string;
    email?: string;
    user_metadata: {
      role?: string;
      fullName?: string;
    };
  };
  access_token: string;
  refresh_token: string;
};

export type AuthState = {
  profile: Profile | null;
  session: AuthSession | null;
  initialized: boolean;
  isLoading: boolean;
  error: string | null;
};
