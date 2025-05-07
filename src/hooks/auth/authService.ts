// Contient les services liés à l'authentification
import { supabase } from '@/integrations/supabase/client';
import { Profile } from './types';
import { 
  RegisterFormData, 
  BasicRegisterFormData, 
  ClientProfileFormData, 
  DriverProfileFormData 
} from '@/types/auth';

// Fonction pour récupérer le profil utilisateur
export const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    console.log("Récupération du profil pour l'utilisateur:", userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
    
    console.log("Profil récupéré:", data);
    return data as Profile;
  } catch (err) {
    console.error('Erreur lors de la récupération du profil:', err);
    throw err;
  }
};

// Fonction de connexion
export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    throw error;
  }
  
  return data;
};

// Fonction pour l'inscription simplifiée
export const registerBasicUser = async (data: BasicRegisterFormData) => {
  const { email, password, role } = data;
  
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        email,
        role
      }
    }
  });
  
  if (error) {
    throw error;
  }
  
  return authData;
};

// Fonction pour compléter le profil client
export const completeClientProfileService = async (userId: string, data: ClientProfileFormData) => {
  try {
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName,
        company_name: data.companyName,
        billing_address: data.billingAddress,
        siret: data.siret,
        tva_number: data.tvaNumb,
        phone_1: data.phone1,
        phone_2: data.phone2,
        profile_completed: true
      })
      .eq('id', userId);
    
    if (error) {
      throw error;
    }
    
    return updatedProfile;
  } catch (err) {
    throw err;
  }
};

// Fonction pour compléter le profil chauffeur
export const completeDriverProfileService = async (userId: string, data: DriverProfileFormData) => {
  try {
    console.log("Completing driver profile for user:", userId, "with data:", data);
    
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName,
        driver_license: data.licenseNumber, // Updated to use licenseNumber
        vehicle_type: data.vehicleType,
        vehicle_registration: data.idNumber, // Updated to use idNumber as vehicle registration
        phone_1: data.phone1,
        profile_completed: true
      })
      .eq('id', userId);
    
    if (error) {
      console.error("Error completing driver profile:", error);
      throw error;
    }
    
    console.log("Driver profile updated successfully:", updatedProfile);
    return updatedProfile;
  } catch (err) {
    console.error("Error in completeDriverProfileService:", err);
    throw err;
  }
};

// Fonction d'inscription (gardée pour rétrocompatibilité)
export const registerLegacyUser = async (data: RegisterFormData) => {
  const { email, password, role } = data;
  
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        email,
        role,
        fullName: data.fullName
      }
    }
  });
  
  if (error) {
    throw error;
  }
  
  return authData;
};

// Fonction pour mettre à jour le profil utilisateur
export const updateUserProfile = async (userId: string, data: Partial<Profile>) => {
  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId);
  
  if (error) {
    throw error;
  }
  
  return updatedProfile;
};

// Fonction pour réinitialiser le mot de passe
export const resetUserPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  
  if (error) {
    throw error;
  }
  
  return true;
};
