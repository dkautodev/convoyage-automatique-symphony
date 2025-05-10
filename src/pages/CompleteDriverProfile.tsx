
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth';

const CompleteDriverProfile: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Redirect to dashboard if profile is already completed
  React.useEffect(() => {
    if (profile?.profile_completed) {
      navigate('/driver/dashboard');
    }
  }, [profile, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Complétez votre profil chauffeur
        </h1>
        
        <p className="text-gray-600 mb-8 text-center">
          Vous allez être redirigé vers le formulaire d'inscription complet pour chauffeurs.
        </p>

        <div className="text-center mt-6">
          <p>Redirection en cours...</p>
        </div>
      </div>
    </div>
  );
};

export default CompleteDriverProfile;
