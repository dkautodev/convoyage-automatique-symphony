
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth';
import { toast } from 'sonner';

export default function AuthCallback() {
  const [message, setMessage] = useState("Traitement de l'authentification...");
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    // Traiter le callback d'authentification
    const { hash } = window.location;
    
    const handleEmailConfirmation = async () => {
      try {
        if (hash && hash.includes('access_token')) {
          setMessage("Confirmation de l'email...");
          const { error } = await supabase.auth.getSession();
          
          if (error) {
            throw error;
          }

          setMessage("Email confirmé avec succès! Redirection...");
          toast.success("Email confirmé avec succès!");
          
          // Redirection basée sur le profil
          setTimeout(() => {
            if (profile) {
              if (profile.profile_completed) {
                // Si le profil est déjà complet, rediriger vers le tableau de bord
                navigate(`/${profile.role}/dashboard`);
              } else {
                // Sinon, rediriger vers la page de complétion de profil
                switch (profile.role) {
                  case 'client':
                    navigate('/complete-client-profile');
                    break;
                  case 'chauffeur':
                    navigate('/complete-driver-profile');
                    break;
                  case 'admin':
                    navigate('/admin/dashboard');
                    break;
                  default:
                    navigate('/login');
                }
              }
            } else {
              // Si pas de profil, rediriger vers la page de connexion
              navigate('/login');
            }
          }, 2000);
        } else {
          setMessage("Aucun token d'authentification trouvé. Redirection...");
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (error: any) {
        console.error("Erreur lors de la confirmation d'email:", error);
        setMessage(`Erreur: ${error.message}. Redirection...`);
        toast.error(`Erreur lors de la confirmation d'email: ${error.message}`);
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleEmailConfirmation();
  }, [navigate, profile]);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="text-center p-8 max-w-md rounded-lg bg-background shadow-lg">
        <div className="h-12 w-12 border-t-4 border-b-4 border-primary rounded-full animate-spin mx-auto mb-6"></div>
        <h1 className="text-xl font-semibold mb-4">{message}</h1>
      </div>
    </div>
  );
}
