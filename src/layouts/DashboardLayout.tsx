import React, { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import Sidebar from '@/components/dashboard/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

// Import dashboard page components 
import AdminDashboard from '@/pages/dashboard/admin/AdminDashboard';
import ClientDashboard from '@/pages/dashboard/client/ClientDashboard';
import DriverDashboard from '@/components/dashboard/driver/DriverDashboard';
interface DashboardLayoutProps {
  children: ReactNode;
}
const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children
}) => {
  const {
    profile,
    user,
    loading
  } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on location change (page navigation)
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Adding debug logging to trace authentication state
  console.log("DashboardLayout auth state:", {
    user,
    profile,
    loading
  });

  // Afficher un écran de chargement pendant la vérification de l'authentification
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>;
  }

  // Vérifiez si l'utilisateur n'est pas authentifié
  if (!user) {
    // Redirigez l'utilisateur vers la page de connexion
    console.log("DashboardLayout: Utilisateur non authentifié, redirection vers /login");
    return <Navigate to="/login" state={{
      from: location
    }} replace />;
  }

  // Si l'utilisateur est authentifié mais n'a pas complété son profil
  if (profile && !profile.profile_completed) {
    // Rediriger vers la page appropriée pour compléter le profil
    console.log("DashboardLayout: Profil incomplet, redirection pour compléter le profil");
    const redirectTo = profile.role === 'chauffeur' ? '/complete-driver-profile' : '/complete-client-profile';
    return <Navigate to={redirectTo} state={{
      from: location
    }} replace />;
  }

  // Toggle sidebar function
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar function
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Determine which dashboard to render based on user role and path
  const renderDashboardContent = () => {
    const path = location.pathname;
    const role = profile?.role || 'client';
    console.log(`DashboardLayout: Path = ${path}, Role = ${role}`);

    // Check for both specific client path and generic dashboard path
    if (path.includes('/client/dashboard') || path === '/dashboard' && role === 'client') {
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
  return <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Main flex container */}
      <div className="flex flex-1 h-full">
        {/* Sidebar - fixed on desktop, slideover on mobile */}
        <div className={`${isMobile ? `fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}` : 'w-64 shrink-0'}`}>
          <Sidebar userRole={profile?.role || 'client'} onClose={closeSidebar} />
        </div>
        
        {/* Overlay to close sidebar on mobile */}
        {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={closeSidebar} />}
        
        {/* Main content area - flex-1 to take up all available space */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Fixed header */}
          <div className="sticky top-0 z-10 bg-white shadow-sm">
            <DashboardHeader toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
          </div>
          
          {/* Content area with padding and overflow handling */}
          <div className="p-3 sm:p-6 flex-1 overflow-x-hidden overflow-y-auto py-0 px-0">
            {renderDashboardContent()}
          </div>
        </div>
      </div>
    </div>;
};
export default DashboardLayout;