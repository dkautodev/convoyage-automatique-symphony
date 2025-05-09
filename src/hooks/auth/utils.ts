
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase';

// Redirection vers le tableau de bord approprié en fonction du rôle
export const redirectToDashboard = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'client':
      return '/client/dashboard';
    case 'chauffeur':
      return '/driver/dashboard';
    default:
      return '/home';
  }
};

// Navigation vers la page pour compléter le profil
export const navigateToProfileCompletion = (role: UserRole) => {
  switch (role) {
    case 'client':
      return '/complete-client-profile';
    case 'chauffeur':
      return '/complete-driver-profile';
    default:
      return '/home';
  }
};

// Vérifier la validité d'un token d'invitation admin
export const verifyAdminToken = async (token: string, email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('admin_invitation_tokens')
      .select('*')
      .eq('token', token)
      .eq('email', email)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    
    if (error) {
      console.error('Erreur lors de la vérification du token:', error);
      return false;
    }
    
    if (data) {
      // Marquer le token comme utilisé
      await supabase
        .from('admin_invitation_tokens')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', data.id);
      
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('Erreur dans verifyAdminToken:', err);
    return false;
  }
};

// Nouvelle fonction qui permet à la fois de vérifier et de marquer le token d'invitation comme utilisé
export const verifyAndUseAdminToken = async (token: string, email: string): Promise<{ valid: boolean; message?: string }> => {
  try {
    console.log(`Vérification du token: ${token} pour l'email: ${email}`);
    
    // Vérifier si le token existe et est valide
    const { data, error } = await supabase
      .from('admin_invitation_tokens')
      .select('*')
      .eq('token', token)
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      console.error('Erreur lors de la vérification du token:', error);
      return { valid: false, message: `Erreur de base de données: ${error.message}` };
    }
    
    if (!data) {
      return { valid: false, message: "Token d'invitation invalide ou email non correspondant" };
    }
    
    // Vérifier si le token a déjà été utilisé
    if (data.used) {
      return { valid: false, message: "Ce token d'invitation a déjà été utilisé" };
    }
    
    // Vérifier si le token a expiré
    if (new Date(data.expires_at) < new Date()) {
      return { valid: false, message: "Ce token d'invitation a expiré" };
    }
    
    // Marquer le token comme utilisé
    const { error: updateError } = await supabase
      .from('admin_invitation_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', data.id);
    
    if (updateError) {
      console.error('Erreur lors de la mise à jour du token:', updateError);
      return { valid: false, message: `Erreur de mise à jour: ${updateError.message}` };
    }
    
    return { valid: true };
  } catch (err: any) {
    console.error('Erreur dans verifyAndUseAdminToken:', err);
    return { valid: false, message: `Erreur inattendue: ${err.message}` };
  }
};

// Fonction pour télécharger des documents de chauffeur
export const uploadDriverDocument = async (file: File, type: string, userId: string): Promise<string | null> => {
  try {
    if (!file || !userId) {
      console.error("Fichier ou ID utilisateur manquant");
      return null;
    }
    
    // Vérifier si le bucket existe, sinon le créer
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'driver_documents');
    
    if (!bucketExists) {
      console.log("Le bucket 'driver_documents' n'existe pas, tentative de création...");
      try {
        const { data, error } = await supabase.storage.createBucket('driver_documents', {
          public: false,
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (error) {
          console.error("Erreur lors de la création du bucket:", error);
          return null;
        }
        
        console.log("Bucket créé avec succès:", data);
      } catch (bucketErr) {
        console.error("Erreur lors de la création du bucket:", bucketErr);
        return null;
      }
    }
    
    // Créer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${type}_${Date.now()}.${fileExt}`;
    
    // Télécharger le fichier
    const { data, error } = await supabase.storage
      .from('driver_documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error("Erreur lors du téléchargement du document:", error);
      return null;
    }
    
    console.log("Document téléchargé avec succès:", data);
    return fileName;
  } catch (err) {
    console.error("Erreur dans uploadDriverDocument:", err);
    return null;
  }
};
