
import { UserRole } from '@/types/supabase';
import { NavigateFunction } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Fonction pour rediriger vers le tableau de bord approprié
export const redirectToDashboard = (role: UserRole, navigate: NavigateFunction) => {
  console.log("Redirection selon le rôle:", role);
  switch (role) {
    case 'admin':
      navigate('/admin/dashboard');
      break;
    case 'client':
      navigate('/client/dashboard');
      break;
    case 'chauffeur':
      navigate('/driver/dashboard');
      break;
    default:
      navigate('/home');
  }
};

// Fonction pour rediriger vers la page d'achèvement de profil appropriée
export const navigateToProfileCompletion = (role: UserRole, navigate: NavigateFunction) => {
  switch (role) {
    case 'client':
      navigate('/complete-client-profile');
      break;
    case 'chauffeur':
      navigate('/complete-driver-profile');
      break;
    case 'admin':
      // Les admins n'ont pas besoin de compléter leur profil
      navigate('/admin/dashboard');
      break;
    default:
      navigate('/home');
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

// Fonction pour vérifier un token d'invitation admin
export const verifyAdminToken = async (token: string, email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('admin_invitation_tokens')
      .select('*')
      .eq('token', token)
      .eq('email', email)
      .eq('used', false)
      .single();
      
    if (error || !data) return false;
    
    // Vérifier si le token n'a pas expiré
    const expiryDate = new Date(data.expires_at);
    const now = new Date();
    
    if (now > expiryDate) return false;
    
    // Marquer le token comme utilisé
    await supabase
      .from('admin_invitation_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', data.id);
      
    return true;
  } catch (error) {
    console.error("Erreur lors de la vérification du token admin:", error);
    return false;
  }
};
