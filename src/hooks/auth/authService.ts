
import { supabase } from '@/integrations/supabase/client';
import { Profile } from './types';
import { toast } from 'sonner';
import { 
  RegisterFormData, 
  BasicRegisterFormData, 
  ClientProfileFormData, 
  DriverProfileFormData 
} from '@/types/auth';
import { TablesInsert } from '@/types/database';
import { VehicleCategory } from '@/types/supabase';
import { uploadDriverDocument } from './utils';

// Récupérer le profil de l'utilisateur
export const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
    
    if (data) {
      // Mettre à jour le timestamp de dernière connexion
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);
      
      return data as Profile;
    }
    
    return null;
  } catch (err: any) {
    console.error('Erreur lors de la récupération du profil:', err);
    return null;
  }
};

// Fonction de connexion
export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    throw error;
  }
  
  return data;
};

// Fonction d'inscription
export const registerBasicUser = async (data: BasicRegisterFormData) => {
  // Préparer les métadonnées utilisateur
  const userMetadata = {
    role: data.role,
  };
  
  // Créer l'utilisateur dans Supabase Auth
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: userMetadata,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    }
  });
  
  if (error) {
    console.error("Erreur d'inscription:", error);
    throw error;
  }
  
  return authData;
};

// Fonction pour compléter le profil client
export const completeClientProfileService = async (userId: string, data: ClientProfileFormData) => {
  // Mettre à jour le profil utilisateur
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      full_name: data.fullName,
      profile_completed: true
    })
    .eq('id', userId);
    
  if (updateError) throw updateError;
  
  // Insérer ou mettre à jour les données client
  const clientData: TablesInsert<'clients'> = {
    id: userId,
    company_name: data.companyName,
    billing_address: data.billingAddress,
    siret: data.siret,
    vat_number: data.tvaNumb || null,
    phone1: data.phone1,
    phone2: data.phone2 || null,
    full_name: data.fullName
  };
  
  const { error: clientError } = await supabase
    .from('clients')
    .upsert(clientData);
    
  if (clientError) throw clientError;
};

// Fonction pour compléter le profil chauffeur
export const completeDriverProfileService = async (userId: string, data: DriverProfileFormData) => {
  // Mettre à jour le profil utilisateur
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      full_name: data.fullName,
      profile_completed: true
    })
    .eq('id', userId);
    
  if (updateError) throw updateError;
  
  // Insérer ou mettre à jour les données chauffeur
  const driverData: TablesInsert<'drivers'> = {
    id: userId,
    full_name: data.fullName,
    company_name: data.companyName,
    billing_address: data.billingAddress,
    license_number: data.licenseNumber,
    vat_applicable: data.tvaApplicable,
    vat_number: data.tvaNumb || null,
    vehicle_type: data.vehicleType as VehicleCategory,
    phone1: data.phone1,
    phone2: data.phone2 || null
  };
  
  const { error: driverError } = await supabase
    .from('drivers')
    .upsert(driverData);
    
  if (driverError) throw driverError;
  
  // Télécharger les documents
  const uploadPromises: Promise<string | null>[] = [];
  const documents = data.documents;
  
  if (documents.kbis) {
    uploadPromises.push(uploadDriverDocument(documents.kbis, 'kbis', userId));
  }
  if (documents.driverLicenseFront) {
    uploadPromises.push(uploadDriverDocument(documents.driverLicenseFront, 'license_front', userId));
  }
  if (documents.driverLicenseBack) {
    uploadPromises.push(uploadDriverDocument(documents.driverLicenseBack, 'license_back', userId));
  }
  if (documents.vigilanceAttestation) {
    uploadPromises.push(uploadDriverDocument(documents.vigilanceAttestation, 'vigilance_attestation', userId));
  }
  if (documents.idDocument) {
    uploadPromises.push(uploadDriverDocument(documents.idDocument, 'id_document', userId));
  }
  
  await Promise.all(uploadPromises);
};

// Fonction pour mettre à jour le profil
export const updateUserProfile = async (userId: string, data: Partial<Profile>) => {
  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId);
  
  if (error) {
    throw error;
  }
};

// Fonction pour réinitialiser le mot de passe
export const resetUserPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password',
  });
  
  if (error) {
    throw error;
  }
};

// Fonction d'inscription (gardée pour rétrocompatibilité)
export const registerLegacyUser = async (data: RegisterFormData) => {
  // Préparer les métadonnées utilisateur
  const userMetadata = {
    role: data.role,
    fullName: data.fullName || data.companyName,
  };

  // Créer l'utilisateur dans Supabase Auth avec les métadonnées nécessaires
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: userMetadata,
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) {
    console.error("Erreur d'inscription:", error);
    throw error;
  }
  
  return authData;
};
