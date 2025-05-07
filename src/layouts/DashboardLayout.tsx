import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import AdminDashboard from '@/pages/dashboard/admin/AdminDashboard';
import ClientDashboard from '@/pages/dashboard/client/ClientDashboard';
import DriverDashboard from '@/pages/dashboard/driver/DriverDashboard';
import Clients from '@/pages/dashboard/admin/Clients';
import Drivers from '@/pages/dashboard/admin/Drivers';
import Missions from '@/pages/dashboard/admin/Missions';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PricingGridPage from '@/pages/dashboard/admin/PricingGrid';

const DashboardLayout = () => {
  const { profile, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Vérifiez si l'utilisateur est en train de charger ou n'est pas authentifié
  if (isLoading) {
    return <div>Chargement...</div>; // Vous pouvez remplacer cela par un spinner
  }

  if (!profile) {
    // Redirigez l'utilisateur vers la page d'accueil s'il n'est pas connecté
    return <Navigate to="/home" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader />
      <div className="container mx-auto py-6">
        <Routes>
          {/* Routes génériques */}
          <Route path="/" element={<Navigate to="dashboard" replace />} />

          {/* Routes admin */}
          {profile?.role === 'admin' && (
            <>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<div>Page des utilisateurs</div>} />
              <Route path="clients" element={<Clients />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="missions" element={<Missions />} />
              <Route path="pricing-grid" element={<PricingGridPage />} />
            </>
          )}

          {/* Routes client */}
          {profile?.role === 'client' && (
            <Route path="dashboard" element={<ClientDashboard />} />
          )}

          {/* Routes chauffeur */}
          {profile?.role === 'chauffeur' && (
            <Route path="dashboard" element={<DriverDashboard />} />
          )}

          {/* Route par défaut - redirige vers le tableau de bord */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default DashboardLayout;
