
import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { typedSupabase } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { RegisterFormData } from '@/types/auth';

// Type pour le profil utilisateur
export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  last_login: string | null;
  active: boolean;
};

// Type pour le contexte d'authentification
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
      const { data, error: profileError } = await typedSupabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        throw profileError;
      }
      
      if (data) {
        setProfile(data);
        console.log("Profil récupéré:", data);
        
        // Mettre à jour le timestamp de dernière connexion
        await typedSupabase
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
        
        // Obtenir le rôle depuis le profil que nous venons de récupérer
        const { data: profileData } = await typedSupabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        
        if (profileData) {
          // Rediriger vers le tableau de bord approprié
          redirectToDashboard(profileData.role);
          toast.success('Connexion réussie !');
        } else {
          // Si aucun profil n'est trouvé, rediriger vers la page d'accueil
          navigate('/home');
          toast.error('Profil utilisateur non trouvé');
        }
      }
    } catch (err: any) {
      setError(err.message);
      toast.error('Échec de la connexion: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'inscription mise à jour pour inclure tous les champs
  const register = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Données d'inscription:", data);
      
      // Créer l'utilisateur dans Supabase Auth avec les métadonnées nécessaires
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: data.role,
            fullName: data.fullName || data.companyName,
            companyName: data.companyName,
            billingAddress: JSON.stringify(data.billingAddress), // Convertir l'objet en JSON
            siret: data.siret.replace(/\s/g, ''),
            vatNumber: data.tvaNumb || null,
            vatApplicable: data.role === 'chauffeur' ? data.tvaApplicable : true,
            licenseNumber: data.licenseNumber,
            vehicleType: data.vehicleType,
            phone1: data.phone1,
            phone2: data.phone2 || null,
          }
        }
      });
      
      if (error) {
        console.error("Erreur d'inscription:", error);
        throw error;
      }
      
      if (authData?.user) {
        toast.success('Inscription réussie ! Veuillez vous connecter.');
        navigate('/login');
      }
    } catch (err: any) {
      console.error("Erreur d'inscription:", err);
      setError(err.message);
      toast.error('Échec de l\'inscription: ' + err.message);
    } finally {
      setLoading(false);
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
      
      const { error } = await typedSupabase
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

  // Contexte à partager
  const value = {
    user,
    profile,
    session,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
