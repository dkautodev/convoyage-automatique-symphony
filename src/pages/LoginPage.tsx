
import React from 'react';
import Home from './Home';
import { useAuth } from '@/hooks/auth';
import { Navigate } from 'react-router-dom';

const LoginPage = () => {
  const { user, profile } = useAuth();
  
  // If user is already logged in, redirect to appropriate dashboard
  if (user && profile) {
    if (profile.profile_completed) {
      // Si le profil est complet, rediriger vers le dashboard
      if (profile.role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (profile.role === 'chauffeur') {
        return <Navigate to="/driver/dashboard" replace />;
      } else if (profile.role === 'client') {
        return <Navigate to="/client/dashboard" replace />;
      }
    } else {
      // Si le profil n'est pas complet, rediriger vers la page de complétion
      if (profile.role === 'client') {
        return <Navigate to="/complete-client-profile" replace />;
      } else if (profile.role === 'chauffeur') {
        return <Navigate to="/complete-driver-profile" replace />;
      }
    }
  }
  
  console.log("Rendering LoginPage (which is Home component)");
  return <Home />;
};

export default LoginPage;
