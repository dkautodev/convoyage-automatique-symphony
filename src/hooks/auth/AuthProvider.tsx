import { useEffect, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { AuthContext } from './AuthContext';
import { AuthContextType, Profile, LegalStatusType } from './types';
import { 
  fetchUserProfile, 
  loginUser, 
  registerBasicUser,
  completeClientProfileService, 
  completeDriverProfileService,
  completeDriverBasicProfileService,
  completeDriverConfigService,
  registerLegacyUser,
  updateUserProfile,
  resetUserPassword
} from './authService';
import { 
  redirectToDashboard, 
  navigateToProfileCompletion, 
  verifyAdminToken, 
  uploadDriverDocument 
} from './utils';
import { 
  RegisterFormData, 
  BasicRegisterFormData, 
  ClientProfileFormData, 
  DriverProfileFormData,
  DriverConfigFormData,
  LegalStatusType as AuthLegalStatusType
} from '@/types/auth';

// Export the useAuth hook for external use
export { useAuth } from './useAuth';

// Étendre l'interface BasicRegisterFormData pour inclure adminToken
declare module '@/types/auth' {
  interface BasicRegisterFormData {
    adminToken?: string;
  }
}

// Fournisseur du contexte d'authentification
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fonction utilitaire pour la redirection basée sur le rôle
  const handleRoleBasedRedirection = useCallback((role: string, isProfileCompleted: boolean) => {
    if (!isProfileCompleted) {
      console.log(`User with role ${role} has incomplete profile, redirecting to profile completion page`);
      switch (role) {
        case 'client':
          navigate('/complete-client-profile');
          break;
        case 'chauffeur':
          navigate('/complete-driver-profile');
          break;
        default:
          navigate('/home');
      }
      return;
    }

    console.log(`User with role ${role} has complete profile, redirecting to dashboard`);
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
  }, [navigate]);

  // Récupérer le profil de l'utilisateur
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log("Démarrage de la récupération du profil pour:", userId);
      const profileData = await fetchUserProfile(userId);
      
      if (profileData) {
        console.log("Profil récupéré avec succès:", profileData);
        setProfile(profileData);
        return profileData;
      } else {
        console.warn("Aucun profil trouvé pour l'utilisateur:", userId);
        setProfile(null);
        return null;
      }
    } catch (err: any) {
      console.error('Erreur lors de la récupération du profil:', err);
      
      // Ne pas définir d'erreur si c'est une erreur de récursion de politique
      if (err.code !== '42P17') {
        setError(err.message);
      } else {
        console.warn("Erreur de récursion détectée dans la politique, ignorée");
      }
      return null;
    }
  }, []);

  // Vérifier la session actuelle au chargement
  useEffect(() => {
    async function getSession() {
      try {
        setLoading(true);
        console.log("Vérification de la session...");
        
        // Récupérer la session actuelle
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        console.log("Session récupérée:", currentSession ? "Session valide" : "Pas de session");
        setSession(currentSession);

        if (currentSession?.user) {
          console.log("Utilisateur authentifié:", currentSession.user.email);
          setUser(currentSession.user);
          await fetchProfile(currentSession.user.id);
        } else {
          console.log("Aucun utilisateur connecté");
          setUser(null);
          setProfile(null);
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Erreur lors de la récupération de la session:', err);
      } finally {
        setLoading(false);
      }
    }

    getSession();

    // S'abonner aux changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Événement d\'authentification:', event);
        
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log("Utilisateur connecté, récupération du profil");
            setTimeout(() => {
              // Utiliser setTimeout pour éviter les deadlocks avec Supabase
              fetchProfile(newSession.user.id);
            }, 0);
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          console.log("Session terminée");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Fonction de connexion
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Tentative de connexion pour:", email);
      const data = await loginUser(email, password);
      
      if (data?.user) {
        console.log("Connexion réussie pour:", email);
        setUser(data.user);
        setSession(data.session);
        
        // Récupérer le profil après connexion avec un setTimeout pour éviter les deadlocks
        setTimeout(async () => {
          // Récupérer le profil après connexion
          const currentProfile = await fetchProfile(data.user.id);
          
          if (currentProfile) {
            console.log("Profil récupéré après connexion:", currentProfile);
            // Si le profil n'est pas complet, rediriger vers la page d'achèvement de profil
            if (!currentProfile.profile_completed) {
              console.log("Le profil n'est pas complet, redirection vers la page d'achèvement", currentProfile.role);
              handleRoleBasedRedirection(currentProfile.role, false);
              toast.success('Veuillez compléter votre profil');
            } else {
              // Sinon rediriger vers le tableau de bord approprié
              console.log("Redirection vers le tableau de bord:", currentProfile.role);
              handleRoleBasedRedirection(currentProfile.role, true);
              toast.success('Connexion réussie !');
            }
          } else {
            console.warn("Aucun profil trouvé après connexion");
            // Redirection vers la page d'accueil si pas de profil
            navigate('/home');
          }
        }, 0);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error('Échec de la connexion: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Nouvelle fonction pour l'inscription simplifiée
  const basicRegister = async (data: BasicRegisterFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Données d'inscription de base:", data);
      
      // Vérifier le token admin si nécessaire
      if (data.role === 'admin' && data.adminToken) {
        const isValidToken = await verifyAdminToken(data.adminToken, data.email);
        if (!isValidToken) {
          throw new Error('Token d\'invitation admin invalide ou expiré');
        }
      }
      
      const authData = await registerBasicUser(data);
      
      if (authData?.user) {
        toast.success('Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.');
        navigate('/home');
      }
    } catch (err: any) {
      console.error("Erreur d'inscription:", err);
      setError(err.message);
      toast.error('Échec de l\'inscription: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour compléter la première étape du profil chauffeur
  const completeDriverBasicProfile = async (data: DriverProfileFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      console.log("Données du profil chauffeur (étape 1):", data);
      
      const result = await completeDriverBasicProfileService(user.id, data);
      
      // Mettre à jour le profil localement
      setProfile(prev => prev ? { ...prev, full_name: data.fullName, profile_completed: true } : null);
      
      toast.success('Première étape complétée avec succès');
      
      // Redirection vers la seconde étape
      navigate('/complete-driver-config');
      
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors de la complétion du profil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour compléter la seconde étape du profil chauffeur
  const completeDriverConfig = async (data: DriverConfigFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      console.log("Données de configuration chauffeur (étape 2):", data);
      
      await completeDriverConfigService(user.id, data);
      
      toast.success('Configuration du chauffeur complétée avec succès');
      
      // Important: Assurez-vous que le profil est correctement mis à jour avant la redirection
      setProfile(prev => prev ? { ...prev, profile_completed: true } : null);
      
      // Utiliser le chemin exact correspondant à la route définie dans App.tsx
      navigate('/driver/dashboard');
      
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors de la configuration du chauffeur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour compléter le profil chauffeur (version originale pour compatibilité)
  const completeDriverProfile = async (data: DriverProfileFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      console.log("Données du profil chauffeur (méthode complète):", data);
      
      await completeDriverProfileService(user.id, data);
      
      // Mettre à jour le profil localement
      setProfile(prev => prev ? { ...prev, full_name: data.fullName, profile_completed: true } : null);
      
      toast.success('Profil complété avec succès');
      handleRoleBasedRedirection('chauffeur', true);
      
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors de la complétion du profil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour compléter le profil client
  const completeClientProfile = async (data: ClientProfileFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      console.log("Données du profil client:", data);
      
      await completeClientProfileService(user.id, data);
      
      // Mettre à jour le profil localement
      setProfile(prev => prev ? { ...prev, full_name: data.fullName, profile_completed: true } : null);
      
      toast.success('Profil complété avec succès');
      handleRoleBasedRedirection('client', true);
      
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors de la complétion du profil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'inscription (gardée pour rétrocompatibilité)
  const register = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Données d'inscription:", data);
      
      const authData = await registerLegacyUser(data);
      
      if (authData?.user) {
        toast.success(`Compte ${data.role} créé avec succès ! Veuillez vous connecter pour accéder à votre compte.`);
        navigate('/home');
      }
    } catch (err: any) {
      console.error("Erreur d'inscription:", err);
      setError(err.message);
      toast.error('Échec de l\'inscription: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion - correction de la gestion des erreurs
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Tentative de déconnexion...");
      
      // Vider d'abord les états locaux pour éviter les problèmes de synchronisation
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Ensuite effectuer la déconnexion côté Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Erreur Supabase lors de la déconnexion:", error);
        throw error;
      }
      
      console.log("Déconnexion réussie côté Supabase");
      
      // Rediriger vers la page d'accueil
      navigate('/home', { replace: true });
      toast.success('Déconnexion réussie');
    } catch (err: any) {
      console.error("Erreur complète lors de la déconnexion:", err);
      
      // Même en cas d'erreur, on s'assure que l'utilisateur est redirigé
      navigate('/home', { replace: true });
      
      // Afficher un message d'erreur mais aussi informer que la session locale est terminée
      toast.error(`Erreur technique lors de la déconnexion: ${err.message}`);
      toast.success('Session locale terminée');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour mettre à jour le profil
  const updateProfile = async (data: Partial<Profile>) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      await updateUserProfile(user.id, data);
      
      // Mettre à jour le profil localement
      setProfile(prev => prev ? { ...prev, ...data } : null);
      toast.success('Profil mis à jour avec succès');
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors de la mise à jour du profil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour réinitialiser le mot de passe
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await resetUserPassword(email);
      
      toast.success('Un email de réinitialisation de mot de passe a été envoyé');
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors de la réinitialisation du mot de passe: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Contexte à partager
  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    error,
    login,
    basicRegister,
    completeClientProfile,
    completeDriverProfile,
    completeDriverBasicProfile,
    completeDriverConfig,
    register, // Gardé pour rétrocompatibilité
    logout,
    updateProfile,
    resetPassword,
    verifyAdminToken,
    uploadDriverDocument: (file: File, type: string) => uploadDriverDocument(file, type, user?.id || '')
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
