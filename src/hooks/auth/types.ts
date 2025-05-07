
import { Tables } from '@/types/database';
import { User, Session } from '@supabase/supabase-js';
import { UserRole } from '@/types/supabase';

// Type pour le profil utilisateur
export type Profile = Tables<'profiles'>;

// Type pour le contexte d'authentification
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
  register: (data: RegisterFormData) => Promise<void>; // Gardé pour rétrocompatibilité
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyAdminToken: (token: string, email: string) => Promise<boolean>;
  uploadDriverDocument: (file: File, type: string) => Promise<string | null>;
}

// Re-export types from the original auth.ts to avoid breaking imports
export type { 
  RegisterFormData, 
  BasicRegisterFormData, 
  ClientProfileFormData, 
  DriverProfileFormData 
} from '@/types/auth';
