
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";

import Home from "./pages/Home";
import Register from "./pages/Register";
import RegisterAdmin from "./pages/RegisterAdmin";
import AdminInvite from "./pages/AdminInvite";
import NotFound from "./pages/NotFound";

// Nouvelles pages du processus d'inscription
import BasicRegister from "./pages/auth/BasicRegister";
import RegisterConfirmation from "./pages/auth/RegisterConfirmation";
import AuthCallback from "./pages/auth/AuthCallback";
import CompleteClientProfile from "./pages/auth/CompleteClientProfile";
import CompleteDriverProfile from "./pages/auth/CompleteDriverProfile";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";

// Dashboard pages
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import DriverDashboard from "./pages/dashboard/DriverDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            
            {/* Anciennes routes d'inscription (à maintenir pour rétrocompatibilité) */}
            <Route path="/register" element={<Register />} />
            <Route path="/register-admin" element={<RegisterAdmin />} />
            <Route path="/admin-invite" element={<AdminInvite />} />
            
            {/* Nouvelles routes d'inscription */}
            <Route path="/signup" element={<BasicRegister />} />
            <Route path="/register-confirmation" element={<RegisterConfirmation />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/complete-client-profile" element={<CompleteClientProfile />} />
            <Route path="/complete-driver-profile" element={<CompleteDriverProfile />} />
            
            {/* Routes du dashboard admin */}
            <Route path="/admin" element={<DashboardLayout allowedRoles="admin" />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              {/* D'autres routes admin à venir */}
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
            
            {/* Routes du dashboard client */}
            <Route path="/client" element={<DashboardLayout allowedRoles="client" />}>
              <Route path="dashboard" element={<ClientDashboard />} />
              {/* D'autres routes client à venir */}
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
            
            {/* Routes du dashboard chauffeur */}
            <Route path="/driver" element={<DashboardLayout allowedRoles="chauffeur" />}>
              <Route path="dashboard" element={<DriverDashboard />} />
              {/* D'autres routes chauffeur à venir */}
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>
            
            {/* Redirection générique vers le tableau de bord approprié */}
            <Route path="/dashboard" element={<Navigate to="/client/dashboard" replace />} />
            
            {/* Route de secours */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
