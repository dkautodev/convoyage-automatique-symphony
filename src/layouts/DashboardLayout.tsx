
import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import Sidebar from '@/components/dashboard/Sidebar';

// Import dashboard page components 
import AdminDashboard from '@/pages/dashboard/admin/AdminDashboard';
import ClientDashboard from '@/pages/dashboard/client/ClientDashboard';
import DriverDashboard from '@/pages/dashboard/driver/DriverDashboard';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { profile, user } = useAuth();
  const location = useLocation();
  
  // Vérifiez si l'utilisateur est en train de charger ou n'est pas authentifié
  const isLoading = !user && !profile;

  if (isLoading) {
    return <div>Chargement...</div>; // Vous pouvez remplacer cela par un spinner
  }

  if (!profile) {
    // Redirigez l'utilisateur vers la page d'accueil s'il n'est pas connecté
    return <Navigate to="/home" state={{ from: location }} replace />;
  }

  // Determine which dashboard to render based on user role and path
  const renderDashboardContent = () => {
    const path = location.pathname;
    const role = profile?.role || 'client';
    
    if (path.endsWith('/dashboard') || path.endsWith('/')) {
      switch (role) {
        case 'admin':
          return <AdminDashboard />;
        case 'client':
          return <ClientDashboard />;
        case 'chauffeur':
          return <DriverDashboard />;
        default:
          return <ClientDashboard />;
      }
    }
    
    // For other paths, use the children prop instead of Outlet
    return children || <Outlet />;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar userRole={profile.role} />
      <div className="flex-1">
        <DashboardHeader />
        <div className="container mx-auto py-6">
          {renderDashboardContent()}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
