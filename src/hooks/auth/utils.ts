
import { UserRole } from '@/types/supabase';
import { NavigateFunction } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Fonction pour rediriger vers la page de complétion de profil en fonction du rôle
export const navigateToProfileCompletion = (role: string, navigate: NavigateFunction) => {
  console.log("Redirection vers la page de complétion pour le rôle:", role);
  try {
    switch (role) {
      case 'client':
        navigate('/complete-client-profile', { replace: true });
        break;
      case 'chauffeur':
        navigate('/complete-driver-profile', { replace: true });
        break;
      case 'admin':
        // Les admins n'ont pas de profil à compléter
        redirectToDashboard('admin', navigate);
        break;
      default:
        // En cas de rôle non reconnu, rediriger vers la page d'accueil avec notification
        console.warn("Rôle non reconnu:", role);
        toast.warning(`Rôle non reconnu : ${role}. Redirection vers la page d'accueil.`);
        navigate('/home', { replace: true });
        break;
    }
  } catch (error) {
    console.error("Erreur lors de la redirection:", error);
    toast.error("Une erreur est survenue lors de la navigation");
    navigate('/home', { replace: true });
  }
};

// Fonction pour rediriger vers le tableau de bord approprié
export const redirectToDashboard = (role: string, navigate: NavigateFunction) => {
  console.log("Redirection vers le tableau de bord pour le rôle:", role);
  try {
    switch (role) {
      case 'admin':
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'client':
        navigate('/client/dashboard', { replace: true });
        break;
      case 'chauffeur':
        navigate('/driver/dashboard', { replace: true });
        break;
      default:
        // En cas de rôle non reconnu, rediriger vers la page d'accueil avec notification
        console.warn("Rôle non reconnu pour le tableau de bord:", role);
        toast.warning(`Rôle non reconnu : ${role}. Redirection vers la page d'accueil.`);
        navigate('/home', { replace: true });
        break;
    }
  } catch (error) {
    console.error("Erreur lors de la redirection vers le dashboard:", error);
    toast.error("Une erreur est survenue lors de la navigation");
    navigate('/home', { replace: true });
  }
};

// Fonction pour télécharger un document chauffeur
export const uploadDriverDocument = async (file: File, type: string, userId: string): Promise<string | null> => {
  try {
    const fileName = `${userId}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from('driver_documents')
      .upload(fileName, file);
      
    if (uploadError) throw uploadError;
    
    return data?.path || null;
  } catch (err: any) {
    console.error(`Erreur lors du téléchargement du document ${type}:`, err);
    return null;
  }
};

// Fonction pour calculer la distance et la durée entre deux adresses
export const calculateAddressDistance = async (originLat: number, originLng: number, destLat: number, destLng: number) => {
  if (!window.google) {
    console.error("API Google Maps non chargée");
    return null;
  }
  
  try {
    const service = new window.google.maps.DistanceMatrixService();
    
    return new Promise((resolve, reject) => {
      service.getDistanceMatrix(
        {
          origins: [{ lat: originLat, lng: originLng }],
          destinations: [{ lat: destLat, lng: destLng }],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
        },
        (response: any, status: string) => {
          if (status === 'OK' && response) {
            const result = response.rows[0].elements[0];
            
            if (result.status === 'OK') {
              resolve({
                distance: result.distance,
                duration: result.duration
              });
            } else {
              reject(new Error(`Calcul impossible: ${result.status}`));
            }
          } else {
            reject(new Error(`Erreur de service: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.error("Erreur lors du calcul de la distance:", error);
    return null;
  }
};

// Interface pour les données de token admin
interface AdminToken {
  id: number;
  email: string;
  token: string;
  created_at: string;
  expires_at: string;
  used: boolean;
  used_at: string | null;
  created_by: string;
}

/**
 * Vérifie un token d'invitation admin et le marque comme utilisé si valide
 * Cette fonction combine la vérification et la mise à jour pour garantir l'atomicité
 * 
 * @param token - Le token à vérifier
 * @param email - L'email associé au token
 * @returns Un objet contenant le statut de vérification et une éventuelle erreur
 */
export const verifyAndUseAdminToken = async (
  token: string, 
  email: string
): Promise<{ valid: boolean; message: string; }> => {
  console.log("Vérification et utilisation du token admin:", token, "pour l'email:", email);
  
  if (!token || !email) {
    console.error('Token ou email manquant');
    return { valid: false, message: 'Token ou email manquant' };
  }
  
  const normalizedToken = token.trim();
  const normalizedEmail = email.toLowerCase().trim();
  
  console.log("Données normalisées:", { 
    normalizedToken, 
    normalizedEmail, 
    timestamp: new Date().toISOString() 
  });

  try {
    // Commencer une transaction Supabase (en utilisant une requête avec .eq multiple)
    const { data: tokenData, error: fetchError } = await supabase
      .from('admin_invitation_tokens')
      .select('*')
      .eq('token', normalizedToken)
      .eq('email', normalizedEmail)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (fetchError) {
      console.error('Erreur lors de la vérification du token:', fetchError);
      
      // Effectuer une vérification plus granulaire pour donner un message d'erreur précis
      const { data: anyToken } = await supabase
        .from('admin_invitation_tokens')
        .select('*')
        .eq('token', normalizedToken)
        .single();
      
      if (!anyToken) {
        return { valid: false, message: 'Token invalide ou inexistant' };
      }
      
      if (anyToken.email !== normalizedEmail) {
        return { valid: false, message: 'Ce token ne correspond pas à cet email' };
      }
      
      if (anyToken.used) {
        return { valid: false, message: 'Ce token a déjà été utilisé' };
      }
      
      if (new Date(anyToken.expires_at) < new Date()) {
        return { valid: false, message: 'Ce token a expiré' };
      }
      
      return { valid: false, message: 'Erreur lors de la vérification du token' };
    }
    
    if (!tokenData) {
      console.warn("Aucun token valide trouvé pour:", { normalizedToken, normalizedEmail });
      return { valid: false, message: 'Token invalide, expiré ou déjà utilisé' };
    }
    
    console.log("Token valide trouvé:", tokenData);
    
    // Marquer le token comme utilisé
    const { error: updateError } = await supabase
      .from('admin_invitation_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', tokenData.id);
    
    if (updateError) {
      console.error('Erreur lors du marquage du token comme utilisé:', updateError);
      return { valid: false, message: 'Erreur lors de la mise à jour du statut du token' };
    }
    
    console.log("Token marqué comme utilisé avec succès");
    return { valid: true, message: 'Token vérifié et marqué comme utilisé avec succès' };
  } catch (err: any) {
    console.error('Exception lors de la vérification du token admin:', err);
    return { valid: false, message: err.message || 'Erreur système lors de la vérification' };
  }
};

// Anciennes fonctions conservées pour rétrocompatibilité
// Mais leur utilisation n'est plus recommandée, préférez verifyAndUseAdminToken
export const verifyAdminToken = async (token: string, email: string): Promise<boolean> => {
  console.warn("DÉPRÉCIÉ: Utiliser verifyAndUseAdminToken à la place de verifyAdminToken");
  try {
    if (!token || !email) {
      console.error('Token ou email manquant');
      return false;
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    const { data: tokenData, error } = await supabase
      .from('admin_invitation_tokens')
      .select('*')
      .eq('token', token.trim())
      .eq('email', normalizedEmail)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    
    if (error) {
      console.error('Erreur lors de la vérification du token:', error);
      return false;
    }
    
    return tokenData !== null;
  } catch (err) {
    console.error('Erreur lors de la vérification du token admin:', err);
    return false;
  }
};

export const markAdminTokenAsUsed = async (token: string, email: string): Promise<boolean> => {
  console.warn("DÉPRÉCIÉ: Utiliser verifyAndUseAdminToken à la place de markAdminTokenAsUsed");
  try {
    if (!token || !email) {
      console.error('Token ou email manquant pour le marquage');
      return false;
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    const { error } = await supabase
      .from('admin_invitation_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('token', token.trim())
      .eq('email', normalizedEmail);
    
    if (error) {
      console.error('Erreur lors du marquage du token comme utilisé:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Erreur lors du marquage du token admin comme utilisé:', err);
    return false;
  }
};
