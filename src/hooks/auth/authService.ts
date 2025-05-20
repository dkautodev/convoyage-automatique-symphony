
import { supabase } from '@/integrations/supabase/client';
import type { AuthResponse, User } from '@supabase/supabase-js';
import {
  RegisterFormData,
  BasicRegisterFormData,
  ClientProfileFormData,
  DriverProfileFormData,
  DriverConfigFormData
} from '@/types/auth';
import { Profile, LegalStatusType, Address } from './types';
import { verifyAndUseAdminToken } from './utils';

// Fetch user profile from the database
export const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération du profil utilisateur:', error);
      throw error;
    }

    return data as Profile;
  } catch (err) {
    console.error('Exception dans fetchUserProfile:', err);
    throw err;
  }
};

// Upload driver document to storage
export const uploadDriverDocument = async (file: File, documentType: string, userId: string): Promise<string | null> => {
  try {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${documentType}.${fileExt}`;
    const filePath = `driver-documents/${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error(`Erreur lors du téléchargement du document ${documentType}:`, error);
      return null;
    }

    return data.path;
  } catch (err) {
    console.error(`Exception dans uploadDriverDocument (${documentType}):`, err);
    return null;
  }
};

// Fonction pour vérifier le token d'invitation admin
export const verifyAdminToken = async (token: string, email: string): Promise<boolean> => {
  const result = await verifyAndUseAdminToken(token, email);
  return result.valid;
};

// Fonction pour se connecter
export const loginUser = async (email: string, password: string): Promise<{
  user: User;
  session: any;
} | null> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }

    if (!data.user || !data.session) {
      throw new Error('Connexion échouée: Aucune donnée utilisateur retournée');
    }

    return { user: data.user, session: data.session };
  } catch (err) {
    console.error('Exception dans loginUser:', err);
    throw err;
  }
};

// Fonction pour réinitialiser le mot de passe
export const resetUserPassword = async (email: string): Promise<void> => {
  try {
    // Définir l'URL complète pour la redirection
    const baseUrl = window.location.origin;
    const resetPasswordURL = `${baseUrl}/reset-password`;
    
    console.log(`Sending password reset email with redirect URL: ${resetPasswordURL}`);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetPasswordURL
    });

    if (error) {
      console.error("Erreur lors de la demande de réinitialisation du mot de passe:", error);
      throw error;
    }
  } catch (err) {
    console.error("Exception dans resetUserPassword:", err);
    throw err;
  }
};

// Fonction pour l'inscription simplifiée
export const registerBasicUser = async (data: BasicRegisterFormData): Promise<{ user: User } | null> => {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: data.role,
        }
      }
    });

    if (error) {
      console.error('Erreur lors de l\'inscription:', error.message);
      throw error;
    }

    if (!authData.user) {
      throw new Error('Inscription échouée: Aucune donnée utilisateur retournée');
    }

    return { user: authData.user };
  } catch (err) {
    console.error('Erreur dans registerBasicUser:', err);
    throw err;
  }
};

// Helper function to convert Address to JsonObject
const addressToJsonObject = (address: Address | null): Record<string, any> | null => {
  if (!address) return null;
  
  return {
    formatted_address: address.formatted_address || '',
    street: address.street || '',
    city: address.city || '',
    postal_code: address.postal_code || '',
    country: address.country || 'France',
    place_id: address.place_id || '',
    lat: address.lat || null,
    lng: address.lng || null
  };
};

// Fonction pour compléter le profil client
export const completeClientProfileService = async (userId: string, data: ClientProfileFormData): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName,
        company_name: data.companyName,
        billing_address: addressToJsonObject(data.billingAddress),
        siret: data.siret,
        tva_number: data.tvaNumb,
        phone_1: data.phone1,
        phone_2: data.phone2,
        profile_completed: true,
      })
      .eq('id', userId);

    if (error) {
      console.error('Erreur lors de la mise à jour du profil client:', error);
      throw error;
    }
  } catch (err) {
    console.error('Erreur dans completeClientProfileService:', err);
    throw err;
  }
};

// Fonction pour compléter le profil chauffeur
export const completeDriverProfileService = async (userId: string, data: DriverProfileFormData): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName,
        company_name: data.companyName,
        billing_address: addressToJsonObject(data.billingAddress),
        siret: data.siret,
        tva_number: data.tvaNumb,
        tva_applicable: data.tvaApplicable,
        phone_1: data.phone1,
        phone_2: data.phone2,
        profile_completed: true,
      })
      .eq('id', userId);

    if (error) {
      console.error('Erreur lors de la mise à jour du profil chauffeur:', error);
      throw error;
    }
  } catch (err) {
    console.error('Erreur dans completeDriverProfileService:', err);
    throw err;
  }
};

// Fonction pour compléter la configuration du chauffeur
export const completeDriverConfigService = async (userId: string, data: DriverConfigFormData): Promise<void> => {
  try {
    // Préparer les mises à jour de profil
    const updates: { [key: string]: any } = {
      legal_status: data.legalStatus,
      license_number: data.licenseNumber,
      id_number: data.idNumber,
      profile_completed: true
    };

    // Gérer le téléchargement et l'association des documents
    if (data.documents) {
      for (const [key, file] of Object.entries(data.documents)) {
        const filePath = await uploadDriverDocument(file, key, userId);
        if (filePath) {
          updates[`document_${key}`] = filePath; // Stocker le chemin du fichier
        } else {
          console.warn(`Impossible de télécharger le document ${key}`);
        }
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Erreur lors de la mise à jour de la configuration du chauffeur:', error);
      throw error;
    }
  } catch (err) {
    console.error('Erreur dans completeDriverConfigService:', err);
    throw err;
  }
};

// Fonction d'inscription (gardée pour rétrocompatibilité)
export const registerLegacyUser = async (data: RegisterFormData): Promise<{ user: User } | null> => {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          company_name: data.companyName,
          siret: data.siret,
          role: data.role,
        }
      }
    });

    if (error) {
      console.error('Erreur lors de l\'inscription:', error.message);
      throw error;
    }

    if (!authData.user) {
      throw new Error('Inscription échouée: Aucune donnée utilisateur retournée');
    }

    return { user: authData.user };
  } catch (err) {
    console.error('Erreur dans registerLegacyUser:', err);
    throw err;
  }
};

// Fonction pour mettre à jour le profil
export const updateUserProfile = async (userId: string, data: Partial<Record<string, any>>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId);

    if (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  } catch (err) {
    console.error('Erreur dans updateUserProfile:', err);
    throw err;
  }
};
