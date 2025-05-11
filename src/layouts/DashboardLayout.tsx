
import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/auth';
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
  const { profile, user, loading } = useAuth();
  const location = useLocation();
  
  // Adding debug logging to trace authentication state
  console.log("DashboardLayout auth state:", { user, profile, loading });
  
  // Afficher un écran de chargement pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Vérifiez si l'utilisateur n'est pas authentifié
  if (!user) {
    // Redirigez l'utilisateur vers la page de connexion
    console.log("DashboardLayout: Utilisateur non authentifié, redirection vers /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si l'utilisateur est authentifié mais n'a pas complété son profil
  if (profile && !profile.profile_completed) {
    // Rediriger vers la page appropriée pour compléter le profil
    console.log("DashboardLayout: Profil incomplet, redirection pour compléter le profil");
    const redirectTo = profile.role === 'chauffeur' ? '/complete-driver-profile' : '/complete-client-profile';
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Determine which dashboard to render based on user role and path
  const renderDashboardContent = () => {
    const path = location.pathname;
    const role = profile?.role || 'client';
    
    console.log(`DashboardLayout: Path = ${path}, Role = ${role}`);
    
    // Check for both specific client path and generic dashboard path
    if (path.includes('/client/dashboard') || (path === '/dashboard' && role === 'client')) {
      console.log("DashboardLayout: Rendering ClientDashboard");
      return <ClientDashboard />;
    }
    
    // Handle other role-specific dashboards
    if (path === '/dashboard' || path === '/driver/dashboard') {
      switch (role) {
        case 'admin':
          console.log("DashboardLayout: Rendering AdminDashboard");
          return <AdminDashboard />;
        case 'chauffeur':
          console.log("DashboardLayout: Rendering DriverDashboard");
          return <DriverDashboard />;
        default:
          console.log("DashboardLayout: Rendering default ClientDashboard");
          return <ClientDashboard />;
      }
    }
    
    // For other paths, use the children prop or Outlet
    console.log("DashboardLayout: Rendering children or Outlet");
    return children || <Outlet />;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Fixed sidebar */}
      <div className="fixed left-0 top-0 h-full z-10">
        <Sidebar userRole={profile?.role || 'client'} />
      </div>
      
      {/* Main content with left margin to accommodate fixed sidebar */}
      <div className="flex-1 ml-64">
        {/* Fixed header */}
        <div className="fixed top-0 right-0 left-64 z-10 bg-white shadow-sm">
          <DashboardHeader />
        </div>
        
        {/* Content area with padding to accommodate fixed header */}
        <div className="container mx-auto py-6 mt-16 px-6">
          {renderDashboardContent()}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
