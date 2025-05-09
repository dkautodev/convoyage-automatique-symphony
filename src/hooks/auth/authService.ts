
// Contient les services liés à l'authentification
import { supabase } from '@/integrations/supabase/client';
import { Profile } from './types';
import { 
  RegisterFormData, 
  BasicRegisterFormData, 
  ClientProfileFormData, 
  DriverProfileFormData 
} from '@/types/auth';
import { Json } from '@/integrations/supabase/types';
import { Address } from '@/types/supabase';
import { checkDriverFieldsConstraint } from './databaseFunctions';

// Fonction utilitaire pour convertir une adresse en Json
const convertAddressToJson = (address: Address): Json => {
  return address as unknown as Json;
};

// Fonction utilitaire pour convertir Json en Address
const convertJsonToAddress = (json: Json): Address => {
  return json as unknown as Address;
};

// Fonction pour récupérer le profil utilisateur
export const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    console.log("Récupération du profil pour l'utilisateur:", userId);
    
    // Première tentative: récupérer directement depuis profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
    
    if (data) {
      console.log("Profil récupéré avec succès:", data);
      // Conversion des champs Json en types spécifiques
      const profileData: Profile = {
        ...data,
        billing_address: data.billing_address ? convertJsonToAddress(data.billing_address) : undefined
      };
      return profileData;
    }
    
    // Plan B: récupérer les informations d'utilisateur depuis auth.users via metadata
    console.log("Aucun profil trouvé, utilisation de la méthode alternative");
    const { data: userData } = await supabase.auth.getUser();
    
    if (userData?.user) {
      // Créer un profil basique à partir des métadonnées utilisateur
      const userMetadata = userData.user.user_metadata;
      const basicProfile: Profile = {
        id: userId,
        email: userData.user.email || '',
        role: (userMetadata?.role as any) || 'client',
        full_name: userMetadata?.fullName || null,
        created_at: userData.user.created_at,
        last_login: userData.user.last_sign_in_at || null,
        active: true,
        profile_completed: false
      };
      
      console.log("Profil récupéré depuis les métadonnées utilisateur:", basicProfile);
      return basicProfile;
    }
    
    console.warn("Aucun profil trouvé pour l'utilisateur:", userId);
    return null;
  } catch (err) {
    console.error('Erreur lors de la récupération du profil:', err);
    
    // Dernière tentative avec l'API auth
    try {
      console.log("Tentative de récupération des informations de base via auth");
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData?.user) {
        const userMetadata = userData.user.user_metadata;
        const basicProfile: Profile = {
          id: userId,
          email: userData.user.email || '',
          role: (userMetadata?.role as any) || 'client',
          full_name: userMetadata?.fullName || null,
          created_at: userData.user.created_at,
          last_login: userData.user.last_sign_in_at || null,
          active: true,
          profile_completed: false
        };
        
        console.log("Profil de secours créé:", basicProfile);
        return basicProfile;
      }
    } catch (fallbackErr) {
      console.error('Échec de la récupération de secours:', fallbackErr);
    }
    
    return null; // Retourner null au lieu de lever l'exception pour éviter les interruptions
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
  try {
    const { email, password, role } = data;
    
    console.log("Tentative d'inscription avec:", { email, role });
    
    // Si c'est un chauffeur, désactiver temporairement la contrainte
    if (role === 'chauffeur') {
      console.log("Désactivation temporaire de la contrainte pour l'inscription d'un chauffeur");
      await checkDriverFieldsConstraint();
    }
    
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          // Autres métadonnées si nécessaire
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      console.error("Erreur d'inscription:", error);
      throw error;
    }
    
    console.log("Résultat inscription:", authData);
    return authData;
  } catch (err) {
    console.error("Erreur dans registerBasicUser:", err);
    throw err;
  }
};

// Fonction pour compléter le profil client
export const completeClientProfileService = async (userId: string, data: ClientProfileFormData) => {
  try {
    console.log("Completing client profile for user:", userId, "with data:", data);
    
    // Instead of using RPC, directly update the profiles table
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName,
        company_name: data.companyName,
        billing_address: convertAddressToJson(data.billingAddress),
        siret: data.siret,
        tva_number: data.tvaNumb,
        phone_1: data.phone1,
        phone_2: data.phone2,
        profile_completed: true
      })
      .eq('id', userId)
      .select();
    
    if (error) {
      console.error("Error completing client profile:", error);
      throw error;
    }
    
    console.log("Client profile updated successfully:", updatedProfile);
    return updatedProfile;
  } catch (err) {
    console.error("Error in completeClientProfileService:", err);
    throw err;
  }
};

// Fonction pour télécharger les documents du chauffeur
const uploadDriverDocuments = async (userId: string, documents: Record<string, File>) => {
  try {
    const uploadedPaths: Record<string, string> = {};
    
    // Parcourir chaque document et le télécharger
    for (const [type, file] of Object.entries(documents)) {
      if (!file) continue;
      
      const fileExt = file.name.split('.').pop();
      const filePath = `drivers/${userId}/${type}_${Date.now()}.${fileExt}`;
      
      console.log(`Uploading ${type} document for driver ${userId}: ${filePath}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('driver_documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error(`Error uploading ${type} document:`, uploadError);
        throw uploadError;
      }
      
      console.log(`Successfully uploaded ${type} document:`, uploadData);
      uploadedPaths[type] = filePath;
    }
    
    return uploadedPaths;
  } catch (err) {
    console.error("Error in uploadDriverDocuments:", err);
    throw err;
  }
};

// Fonction pour compléter le profil chauffeur - Mise à jour pour créer l'entrée dans la table drivers
export const completeDriverProfileService = async (userId: string, data: DriverProfileFormData) => {
  try {
    console.log("Completing driver profile for user:", userId, "with data:", data);
    
    let documentPaths: Record<string, string> = {};
    
    // Télécharger les documents si fournis
    if (data.documents && Object.keys(data.documents).length > 0) {
      try {
        documentPaths = await uploadDriverDocuments(userId, data.documents);
        console.log("Documents uploaded successfully:", documentPaths);
      } catch (docError) {
        console.error("Error uploading documents, continuing with profile update:", docError);
      }
    }
    
    // Commencer une transaction pour garantir l'intégrité des données
    // D'abord, mettre à jour le profil principal
    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName,
        company_name: data.companyName,
        billing_address: convertAddressToJson(data.billingAddress),
        siret: data.siret,
        tva_number: data.tvaNumb,
        tva_applicable: data.tvaApplicable,
        phone_1: data.phone1,
        phone_2: data.phone2,
        driver_license: data.licenseNumber,
        vehicle_type: data.vehicleType,
        vehicle_registration: data.idNumber,
        profile_completed: true
      })
      .eq('id', userId)
      .select();
    
    if (profileError) {
      console.error("Error updating profile:", profileError);
      throw profileError;
    }
    
    console.log("Updated profile successfully:", updatedProfile);
    
    // Vérifier si le chauffeur existe déjà dans la table drivers
    const { data: existingDriver, error: checkError } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking driver:", checkError);
      throw checkError;
    }
    
    console.log("Existing driver check result:", existingDriver);
    
    // Création des données à insérer/mettre à jour
    const driverData = {
      id: userId,
      full_name: data.fullName,
      company_name: data.companyName,
      billing_address: convertAddressToJson(data.billingAddress),
      license_number: data.licenseNumber,
      vat_applicable: data.tvaApplicable,
      vat_number: data.tvaNumb,
      phone1: data.phone1,
      phone2: data.phone2,
      vehicle_type: data.vehicleType,
      // Ajouter les chemins des documents s'ils existent
      license_document_path: documentPaths.driverLicenseFront || null,
      id_document_path: documentPaths.idDocument || null,
      kbis_document_path: documentPaths.kbis || null,
      vigilance_document_path: documentPaths.vigilanceAttestation || null
    };
    
    console.log("Driver data to save:", driverData);
    
    let driverResult;
    
    // Insérer ou mettre à jour dans la table des chauffeurs
    if (!existingDriver) {
      // Si le chauffeur n'existe pas, l'insérer
      console.log("Creating new driver record in drivers table with data:", driverData);
      const { data: insertedDriver, error: driverError } = await supabase
        .from('drivers')
        .insert(driverData)
        .select();
      
      if (driverError) {
        console.error("Error inserting driver:", driverError);
        throw driverError;
      }
      
      driverResult = insertedDriver;
      console.log("Driver inserted successfully:", insertedDriver);
    } else {
      // Si le chauffeur existe, le mettre à jour
      console.log("Updating existing driver record in drivers table with data:", driverData);
      const { data: updatedDriver, error: driverError } = await supabase
        .from('drivers')
        .update(driverData)
        .eq('id', userId)
        .select();
      
      if (driverError) {
        console.error("Error updating driver:", driverError);
        throw driverError;
      }
      
      driverResult = updatedDriver;
      console.log("Driver updated successfully:", updatedDriver);
    }
    
    console.log("Driver profile completed successfully");
    return updatedProfile;
  } catch (err) {
    console.error("Error in completeDriverProfileService:", err);
    throw err;
  }
};

// Fonction d'inscription (gardée pour rétrocompatibilité)
export const registerLegacyUser = async (data: RegisterFormData) => {
  try {
    const { email, password, role, fullName } = data;
    
    console.log("Tentative d'inscription legacy avec:", { email, role, fullName });
    
    // Si c'est un chauffeur, désactiver temporairement la contrainte
    if (role === 'chauffeur') {
      console.log("Désactivation temporaire de la contrainte pour l'inscription d'un chauffeur");
      await checkDriverFieldsConstraint();
    }
    
    // Utiliser signUp avec les métadonnées appropriées
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          fullName
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      console.error("Erreur d'inscription legacy:", error);
      throw error;
    }
    
    console.log("Résultat inscription legacy:", authData);
    return authData;
  } catch (err) {
    console.error("Erreur dans registerLegacyUser:", err);
    throw err;
  }
};

// Fonction pour mettre à jour le profil utilisateur
export const updateUserProfile = async (userId: string, data: Partial<Profile>) => {
  // Créer une copie pour éviter de modifier l'objet d'origine
  const updateData: Record<string, any> = {...data};
  
  // Conversion explicite de l'adresse en Json si elle existe
  if (updateData.billing_address) {
    updateData.billing_address = convertAddressToJson(updateData.billing_address);
  }
  
  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select();
  
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
