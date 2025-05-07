import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Tables, TablesInsert } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { RegisterFormData, BasicRegisterFormData, ClientProfileFormData, DriverProfileFormData } from '@/types/auth';

// Type pour le profil utilisateur
export type Profile = Tables<'profiles'>;

// Type pour le contexte d'authentification
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  basicRegister: (data: BasicRegisterFormData) => Promise<void>;
  completeClientProfile: (data: ClientProfileFormData) => Promise<void>;
  completeDriverProfile: (data: DriverProfileFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>; // Gardé pour rétrocompatibilité
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyAdminToken: (token: string, email: string) => Promise<boolean>;
  uploadDriverDocument: (file: File, type: string) => Promise<string | null>;
}

// Création du contexte d'authentification
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte d'authentification
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}

// Fournisseur du contexte d'authentification
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Récupérer le profil de l'utilisateur
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Erreur lors de la récupération du profil:', profileError);
        throw profileError;
      }
      
      if (data) {
        setProfile(data as Profile);
        console.log("Profil récupéré:", data);
        
        // Mettre à jour le timestamp de dernière connexion
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userId);
      }
    } catch (err: any) {
      console.error('Erreur lors de la récupération du profil:', err);
      setError(err.message);
    }
  }, []);

  // Vérifier la session actuelle au chargement
  useEffect(() => {
    async function getSession() {
      try {
        setLoading(true);
        
        // Récupérer la session actuelle
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        setSession(currentSession);

        if (currentSession?.user) {
          setUser(currentSession.user);
          await fetchProfile(currentSession.user.id);
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
      async (event, session) => {
        console.log('Événement d\'authentification:', event);
        
        if (session) {
          setSession(session);
          setUser(session.user);
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await fetchProfile(session.user.id);
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
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
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        
        // Récupérer le profil après connexion
        await fetchProfile(data.user.id);
        
        if (profile) {
          // Si le profil n'est pas complet, rediriger vers la page d'achèvement de profil
          if (!profile.profile_completed) {
            navigateToProfileCompletion(profile.role);
            toast.success('Veuillez compléter votre profil');
          } else {
            // Sinon rediriger vers le tableau de bord approprié
            redirectToDashboard(profile.role);
            toast.success('Connexion réussie !');
          }
        }
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
      
      // Préparer les métadonnées utilisateur
      const userMetadata = {
        role: data.role,
      };
      
      console.log("Données envoyées à Supabase:", {
        email: data.email,
        password: data.password,
        options: { data: userMetadata }
      });
      
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
      
      if (authData?.user) {
        toast.success('Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.');
        navigate('/register-confirmation');
      }
    } catch (err: any) {
      console.error("Erreur d'inscription:", err);
      setError(err.message);
      toast.error('Échec de l\'inscription: ' + err.message);
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
      
      // Mettre à jour le profil utilisateur
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          profile_completed: true
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Insérer ou mettre à jour les données client
      const clientData: TablesInsert<'clients'> = {
        id: user.id,
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
      
      // Mettre à jour le profil localement
      setProfile(prev => prev ? { ...prev, full_name: data.fullName, profile_completed: true } : null);
      
      toast.success('Profil complété avec succès');
      redirectToDashboard('client');
      
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors de la complétion du profil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour compléter le profil chauffeur
  const completeDriverProfile = async (data: DriverProfileFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      console.log("Données du profil chauffeur:", data);
      
      // Mettre à jour le profil utilisateur
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          profile_completed: true
        })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Insérer ou mettre à jour les données chauffeur
      const driverData: TablesInsert<'drivers'> = {
        id: user.id,
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
        uploadPromises.push(uploadDriverDocument(documents.kbis, 'kbis'));
      }
      if (documents.driverLicenseFront) {
        uploadPromises.push(uploadDriverDocument(documents.driverLicenseFront, 'license_front'));
      }
      if (documents.driverLicenseBack) {
        uploadPromises.push(uploadDriverDocument(documents.driverLicenseBack, 'license_back'));
      }
      if (documents.vigilanceAttestation) {
        uploadPromises.push(uploadDriverDocument(documents.vigilanceAttestation, 'vigilance_attestation'));
      }
      if (documents.idDocument) {
        uploadPromises.push(uploadDriverDocument(documents.idDocument, 'id_document'));
      }
      
      await Promise.all(uploadPromises);
      
      // Mettre à jour le profil localement
      setProfile(prev => prev ? { ...prev, full_name: data.fullName, profile_completed: true } : null);
      
      toast.success('Profil complété avec succès');
      redirectToDashboard('chauffeur');
      
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors de la complétion du profil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour télécharger un document chauffeur
  const uploadDriverDocument = async (file: File, type: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const fileName = `${user.id}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('driver_documents')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      return data?.path || null;
    } catch (err: any) {
      console.error(`Erreur lors du téléchargement du document ${type}:`, err);
      toast.error(`Échec du téléchargement du document ${type}`);
      return null;
    }
  };

  // Fonction d'inscription (gardée pour rétrocompatibilité)
  const register = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Données d'inscription:", data);
      
      // Préparer les métadonnées utilisateur
      const userMetadata = {
        role: data.role,
        fullName: data.fullName || data.companyName,
      };

      console.log("Données envoyées à Supabase:", {
        email: data.email,
        password: data.password,
        options: { data: userMetadata }
      });
      
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
      
      if (authData?.user) {
        toast.success('Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.');
        navigate('/register-confirmation');
      }
    } catch (err: any) {
      console.error("Erreur d'inscription:", err);
      setError(err.message);
      toast.error('Échec de l\'inscription: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour vérifier un token d'invitation admin
  const verifyAdminToken = async (token: string, email: string): Promise<boolean> => {
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

  // Fonction de déconnexion
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      setProfile(null);
      setSession(null);
      navigate('/home');
      toast.success('Déconnexion réussie');
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors de la déconnexion: ' + err.message);
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
      
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
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
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Un email de réinitialisation de mot de passe a été envoyé');
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors de la réinitialisation du mot de passe: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour rediriger vers le tableau de bord approprié
  const redirectToDashboard = (role: UserRole) => {
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
  const navigateToProfileCompletion = (role: UserRole) => {
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

  // Contexte à partager
  const value = {
    user,
    profile,
    session,
    loading,
    error,
    login,
    basicRegister,
    completeClientProfile,
    completeDriverProfile,
    register, // Gardé pour rétrocompatibilité
    logout,
    updateProfile,
    resetPassword,
    verifyAdminToken,
    uploadDriverDocument
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
