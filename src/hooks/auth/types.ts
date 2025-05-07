
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

// Ajout de l'interface AuthContextType
export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  basicRegister: (data: BasicRegisterFormData) => Promise<void>;
  completeClientProfile: (data: ClientProfileFormData) => Promise<void>;
  completeDriverProfile: (data: DriverProfileFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyAdminToken: (token: string, email: string) => Promise<boolean>;
  uploadDriverDocument: (file: File, type: string) => Promise<string>;
}
