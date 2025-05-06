
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Profile, UserRole } from '@/types/supabase';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Vérifier la session actuelle au chargement
  useEffect(() => {
    async function getSession() {
      try {
        setLoading(true);
        
        // Récupérer la session actuelle
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          setUser(session.user);
          
          // Récupérer le profil utilisateur
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            throw profileError;
          }
          
          setProfile(profileData);
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
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          
          // Récupérer le profil utilisateur
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!profileError) {
            setProfile(profileData);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fonction de connexion
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      if (data?.user) {
        setUser(data.user);
        
        // Récupérer le profil utilisateur
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          throw profileError;
        }
        
        setProfile(profileData);
        
        // Rediriger vers le tableau de bord approprié
        redirectToDashboard(profileData.role);
        
        toast.success('Connexion réussie !');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error('Échec de la connexion: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'inscription
  const register = async (
    email: string, 
    password: string, 
    userData: any, 
    role: UserRole = 'client'
  ) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.user) {
        // Créer le profil utilisateur
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email,
              role,
              full_name: userData.fullName || null
            }
          ]);
        
        if (profileError) {
          throw profileError;
        }
        
        // Créer l'entrée dans la table spécifique au rôle (client, chauffeur)
        if (role === 'client') {
          const { error: clientError } = await supabase
            .from('clients')
            .insert([
              {
                id: data.user.id,
                company_name: userData.companyName,
                siret: userData.siret,
                vat_number: userData.vatNumber || null,
                billing_address: userData.billingAddress,
                phone1: userData.phone1,
                phone2: userData.phone2 || null
              }
            ]);
          
          if (clientError) {
            throw clientError;
          }
        } else if (role === 'chauffeur') {
          const { error: driverError } = await supabase
            .from('drivers')
            .insert([
              {
                id: data.user.id,
                license_number: userData.licenseNumber,
                vat_applicable: userData.vatApplicable || false,
                vat_number: userData.vatApplicable ? userData.vatNumber : null,
                vehicle_type: userData.vehicleType || null
              }
            ]);
          
          if (driverError) {
            throw driverError;
          }
        }
        
        toast.success('Inscription réussie ! Veuillez vous connecter.');
        navigate('/login');
      }
    } catch (err: any) {
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
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      setProfile(null);
      navigate('/home');
      toast.success('Déconnexion réussie');
    } catch (err: any) {
      setError(err.message);
      toast.error('Erreur lors de la déconnexion: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour rediriger vers le tableau de bord approprié
  const redirectToDashboard = (role: UserRole) => {
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

  return {
    user,
    profile,
    loading,
    error,
    login,
    register,
    logout
  };
}
