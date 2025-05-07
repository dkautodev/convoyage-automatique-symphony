
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/auth";

import Home from "./pages/Home";
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
      <AuthProvider>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          
          {/* Routes d'inscription - redirection des anciennes routes vers /signup */}
          <Route path="/register" element={<Navigate to="/signup" replace />} />
          <Route path="/register-admin" element={<Navigate to="/signup" replace />} />
          <Route path="/admin-invite" element={<Navigate to="/signup" replace />} />
          
          {/* Nouvelles routes d'inscription */}
          <Route path="/signup" element={<BasicRegister />} />
          <Route path="/register-confirmation" element={<RegisterConfirmation />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/complete-client-profile" element={<CompleteClientProfile />} />
          <Route path="/complete-driver-profile" element={<CompleteDriverProfile />} />
          
          {/* Routes du dashboard admin */}
          <Route path="/admin" element={<DashboardLayout allowedRoles="admin" />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
          
          {/* Routes du dashboard client */}
          <Route path="/client" element={<DashboardLayout allowedRoles="client" />}>
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
          
          {/* Routes du dashboard chauffeur */}
          <Route path="/driver" element={<DashboardLayout allowedRoles="chauffeur" />}>
            <Route path="dashboard" element={<DriverDashboard />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
          
          {/* Route de secours */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
