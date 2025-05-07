
import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { UserRole } from '@/types/supabase';

// Fonction pour vérifier si l'utilisateur a le rôle requis pour accéder à une route
const hasRequiredRole = (requiredRole: UserRole | UserRole[], userRole?: UserRole): boolean => {
  if (!userRole) return false;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  return requiredRole === userRole;
};

interface DashboardLayoutProps {
  allowedRoles: UserRole | UserRole[];
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ allowedRoles }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  
  console.log("DashboardLayout - État de l'authentification:", { user, profile, loading });
  
  // Si l'authentification est en cours, afficher un écran de chargement
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!user) {
    console.log("Utilisateur non connecté, redirection vers la page d'inscription");
    return <Navigate to="/signup" state={{ from: location }} replace />;
  }
  
  // Si l'utilisateur n'a pas de profil ou si une erreur s'est produite lors de la récupération du profil
  if (!profile) {
    console.log("Pas de profil disponible, redirection vers la page d'accueil");
    return <Navigate to="/home" state={{ from: location }} replace />;
  }
  
  console.log("Vérification du rôle:", { allowedRoles, userRole: profile.role });
  
  // Si l'utilisateur n'a pas le rôle requis, rediriger vers son tableau de bord approprié
  if (!hasRequiredRole(allowedRoles, profile.role)) {
    console.log("L'utilisateur n'a pas le rôle requis, redirection");
    switch (profile.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'client':
        return <Navigate to="/client/dashboard" replace />;
      case 'chauffeur':
        return <Navigate to="/driver/dashboard" replace />;
      default:
        return <Navigate to="/home" replace />;
    }
  }
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar userRole={profile?.role} />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
