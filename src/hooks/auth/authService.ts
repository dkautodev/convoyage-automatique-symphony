import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './types';
import type { 
  RegisterFormData, 
  BasicRegisterFormData, 
  ClientProfileFormData, 
  DriverProfileFormData,
  DriverConfigFormData
} from '@/types/auth';
import { uploadFile } from '@/integrations/supabase/storage';
import { UserRole } from '@/types/supabase';

// Fonction pour récupérer le profil utilisateur
export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  try {
    console.log("Service: Récupération du profil pour", userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Service: Erreur lors de la récupération du profil", error);
      throw error;
    }

    if (data) {
      console.log("Service: Profil récupéré avec succès", data);
      return data as Profile;
    } else {
      console.warn("Service: Aucun profil trouvé pour l'utilisateur", userId);
      return null;
    }
  } catch (error) {
    console.error("Service: Erreur lors de la récupération du profil", error);
    throw error;
  }
}

// Fonction pour connecter l'utilisateur
export async function loginUser(email: string, password: string) {
  try {
    console.log("Service: Tentative de connexion pour", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Service: Erreur lors de la connexion", error);
      throw error;
    }

    console.log("Service: Connexion réussie pour", email);
    return data;
  } catch (error) {
    console.error("Service: Erreur lors de la connexion", error);
    throw error;
  }
}

// Fonction pour enregistrer un nouvel utilisateur (legacy)
export async function registerLegacyUser(data: RegisterFormData) {
  try {
    console.log("Service: Inscription de l'utilisateur (legacy)", data.email);

    // Enregistrer l'utilisateur via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: data.role,
        },
      },
    });

    if (authError) {
      console.error("Service: Erreur lors de l'inscription de l'utilisateur", authError);
      throw authError;
    }

    console.log("Service: Utilisateur inscrit avec succès, ID:", authData.user?.id);

    // Créer un profil utilisateur dans la base de données
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user?.id,
          email: data.email,
          role: data.role,
          full_name: data.fullName,
          company_name: data.companyName,
          siret: data.siret,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          active: true,
          profile_completed: false,
        },
      ]);

    if (profileError) {
      console.error("Service: Erreur lors de la création du profil", profileError);
      throw profileError;
    }

    console.log("Service: Profil utilisateur créé avec succès pour", authData.user?.id);
    return authData;

  } catch (error) {
    console.error("Service: Erreur lors de l'inscription de l'utilisateur", error);
    throw error;
  }
}

// Fonction pour enregistrer un nouvel utilisateur (basic)
export async function registerBasicUser(data: BasicRegisterFormData) {
  try {
    console.log("Service: Inscription de l'utilisateur (basic)", data.email);

    // Enregistrer l'utilisateur via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: data.role,
        },
      },
    });

    if (authError) {
      console.error("Service: Erreur lors de l'inscription de l'utilisateur", authError);
      throw authError;
    }

    console.log("Service: Utilisateur inscrit avec succès, ID:", authData.user?.id);

    // Créer un profil utilisateur dans la base de données
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user?.id,
          email: data.email,
          role: data.role,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          active: true,
          profile_completed: false,
        },
      ]);

    if (profileError) {
      console.error("Service: Erreur lors de la création du profil", profileError);
      throw profileError;
    }

    console.log("Service: Profil utilisateur créé avec succès pour", authData.user?.id);
    return authData;

  } catch (error) {
    console.error("Service: Erreur lors de l'inscription de l'utilisateur", error);
    throw error;
  }
}

// Fonction pour compléter le profil client
export async function completeClientProfileService(
  userId: string,
  data: ClientProfileFormData
): Promise<void> {
  try {
    console.log("Service: Complétion du profil client pour", userId);

    // Mise à jour du profil avec les nouvelles données
    const { error } = await supabase
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

    if (error) throw error;

    console.log("Service: Profil client complété avec succès");
  } catch (error) {
    console.error("Service: Erreur lors de la complétion du profil client", error);
    throw error;
  }
}

// Fonction pour compléter la première étape du profil chauffeur
export async function completeDriverBasicProfileService(
  userId: string,
  data: DriverProfileFormData
): Promise<void> {
  try {
    console.log("Service: Complétion de la première étape du profil chauffeur pour", userId);

    // Mise à jour du profil avec les nouvelles données
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName,
        company_name: data.companyName,
        billing_address: data.billingAddress,
        siret: data.siret,
        tva_applicable: data.tvaApplicable,
        tva_number: data.tvaNumb,
        phone_1: data.phone1,
        phone_2: data.phone2,
      })
      .eq('id', userId);

    if (error) throw error;

    console.log("Service: Première étape du profil chauffeur complétée avec succès");
  } catch (error) {
    console.error("Service: Erreur lors de la complétion de la première étape du profil chauffeur", error);
    throw error;
  }
}

// Fonction pour compléter le profil chauffeur (legacy)
export async function completeDriverProfileService(
  userId: string,
  data: DriverProfileFormData
): Promise<void> {
  try {
    console.log("Service: Complétion du profil chauffeur pour", userId);

    // Mise à jour du profil avec les nouvelles données
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName,
        company_name: data.companyName,
        billing_address: data.billingAddress,
        siret: data.siret,
        tva_applicable: data.tvaApplicable,
        tva_number: data.tvaNumb,
        phone_1: data.phone1,
        phone_2: data.phone2,
        profile_completed: true
      })
      .eq('id', userId);

    if (error) throw error;

    console.log("Service: Profil chauffeur complété avec succès");
  } catch (error) {
    console.error("Service: Erreur lors de la complétion du profil chauffeur", error);
    throw error;
  }
}

// Fonction pour compléter la seconde étape du profil chauffeur
export async function completeDriverConfigService(
  userId: string, 
  data: DriverConfigFormData
): Promise<void> {
  try {
    console.log("Service: Enregistrement de la configuration chauffeur pour", userId);
    
    // Mise à jour du profil avec les nouvelles données
    const { error } = await supabase
      .from('profiles')
      .update({
        driver_license: data.licenseNumber,
        id_document: data.idNumber,
        legal_status: data.legalStatus,
        profile_completed: true
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    // Téléchargement des documents si présents
    if (data.documents) {
      for (const [type, file] of Object.entries(data.documents)) {
        await uploadDriverDocument(file, type, userId);
      }
    }
    
    console.log("Service: Configuration du chauffeur enregistrée avec succès");
    
  } catch (error) {
    console.error("Service: Erreur lors de l'enregistrement de la configuration chauffeur", error);
    throw error;
  }
}

// Fonction pour mettre à jour le profil utilisateur
export async function updateUserProfile(userId: string, data: Partial<Profile>): Promise<void> {
  try {
    console.log("Service: Mise à jour du profil pour", userId, "avec", data);

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId);

    if (error) {
      console.error("Service: Erreur lors de la mise à jour du profil", error);
      throw error;
    }

    console.log("Service: Profil mis à jour avec succès pour", userId);
  } catch (error) {
    console.error("Service: Erreur lors de la mise à jour du profil", error);
    throw error;
  }
}

// Fonction pour réinitialiser le mot de passe de l'utilisateur
export async function resetUserPassword(email: string): Promise<void> {
  try {
    console.log("Service: Demande de réinitialisation du mot de passe pour", email);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      console.error("Service: Erreur lors de la demande de réinitialisation du mot de passe", error);
      throw error;
    }

    console.log("Service: Demande de réinitialisation du mot de passe réussie pour", email);
  } catch (error) {
    console.error("Service: Erreur lors de la demande de réinitialisation du mot de passe", error);
    throw error;
  }
}

// Fonction pour vérifier le token d'admin
export async function verifyAdminToken(token: string, email: string): Promise<boolean> {
  try {
    console.log("Service: Vérification du token d'admin pour", email);

    const { data, error } = await supabase
      .from('admin_invitations')
      .select('*')
      .eq('token', token)
      .eq('email', email)
      .single();

    if (error) {
      console.error("Service: Erreur lors de la vérification du token d'admin", error);
      return false;
    }

    if (!data) {
      console.warn("Service: Token d'admin invalide pour", email);
      return false;
    }

    // Vérifier si le token est expiré
    const expiryDate = new Date(data.expires_at);
    if (expiryDate < new Date()) {
      console.warn("Service: Token d'admin expiré pour", email);
      return false;
    }

    console.log("Service: Token d'admin valide pour", email);
    return true;
  } catch (error) {
    console.error("Service: Erreur lors de la vérification du token d'admin", error);
    return false;
  }
}

// Fonction pour uploader un document chauffeur
export async function uploadDriverDocument(file: File, type: string, userId: string): Promise<string | null> {
  try {
    console.log(`Service: Upload du document ${type} pour l'utilisateur ${userId}`);

    const path = `driver_documents/${userId}/${type}.${file.name.split('.').pop()}`;
    const result = await uploadFile(path, file);

    if (result) {
      console.log(`Service: Document ${type} uploadé avec succès à ${path}`);
      return path;
    } else {
      console.error(`Service: Erreur lors de l'upload du document ${type}`);
      return null;
    }
  } catch (error) {
    console.error(`Service: Erreur lors de l'upload du document ${type}`, error);
    return null;
  }
}
