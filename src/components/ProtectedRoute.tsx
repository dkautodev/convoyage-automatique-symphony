
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si des rôles spécifiques sont requis et que l'utilisateur n'a pas le bon rôle
  if (roles && profile?.role && !roles.includes(profile.role)) {
    // Rediriger vers la page appropriée en fonction du rôle de l'utilisateur
    if (profile.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (profile.role === 'client') {
      return <Navigate to="/client" replace />;
    } else if (profile.role === 'chauffeur') {
      return <Navigate to="/driver" replace />;
    }
    // Si le rôle n'est pas reconnu, rediriger vers la page de connexion
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
