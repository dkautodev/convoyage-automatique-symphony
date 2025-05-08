
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

// Fonction pour vérifier un token d'invitation admin
export const verifyAdminToken = async (token: string, email: string): Promise<boolean> => {
  try {
    console.log("Vérification du token admin:", token, "pour l'email:", email);
    
    if (!token || !email) {
      console.error('Token ou email manquant');
      return false;
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    console.log("Email normalisé pour la vérification:", normalizedEmail);
    
    // Vérifier si le token existe, correspond à l'email, n'a pas été utilisé et n'a pas expiré
    const { data: tokenData, error } = await supabase
      .from('admin_invitation_tokens')
      .select('*')
      .eq('token', token)
      .eq('email', normalizedEmail)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    
    if (error) {
      console.error('Erreur lors de la vérification du token:', error);
      return false;
    }
    
    console.log("Résultat de vérification du token:", tokenData);
    return tokenData !== null;
  } catch (err) {
    console.error('Erreur lors de la vérification du token admin:', err);
    return false;
  }
};

// Fonction pour marquer un token admin comme utilisé
export const markAdminTokenAsUsed = async (token: string, email: string): Promise<boolean> => {
  try {
    console.log("Marquage du token comme utilisé:", token, "pour l'email:", email);
    
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
      .eq('token', token)
      .eq('email', normalizedEmail);
    
    if (error) {
      console.error('Erreur lors du marquage du token comme utilisé:', error);
      return false;
    }
    
    console.log("Token marqué comme utilisé avec succès");
    return true;
  } catch (err) {
    console.error('Erreur lors du marquage du token admin comme utilisé:', err);
    return false;
  }
};
