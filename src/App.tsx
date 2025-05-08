import React, { useEffect, useState } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from 'react-query';
import { useTranslation } from 'react-i18next';
import i18n from './i18n'; // Import de la configuration i18next
import './App.css';
import { useAuth } from './hooks/auth';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { CompleteClientProfile } from './pages/CompleteClientProfile';
import { CompleteDriverProfile } from './pages/CompleteDriverProfile';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { ClientDashboard } from './pages/dashboard/ClientDashboard';
import { DriverDashboard } from './pages/dashboard/DriverDashboard';
import { Missions } from './pages/Missions';
import { NewMission } from './pages/NewMission';
import { EditMission } from './pages/EditMission';
import { Vehicles } from './pages/Vehicles';
import { Clients } from './pages/Clients';
import { Drivers } from './pages/Drivers';
import { Contacts } from './pages/Contacts';
import { Pricing } from './pages/Pricing';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { AdminRegister } from './pages/AdminRegister';
import { PricingGridPage as PricingGrid } from './pages/dashboard/admin/PricingGrid';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/login",
    element: (
      <AuthLayout>
        <Login />
      </AuthLayout>
    ),
  },
  {
    path: "/register",
    element: (
      <AuthLayout>
        <Register />
      </AuthLayout>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <AuthLayout>
        <ForgotPassword />
      </AuthLayout>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <AuthLayout>
        <ResetPassword />
      </AuthLayout>
    ),
  },
  {
    path: "/verify-email",
    element: (
      <AuthLayout>
        <VerifyEmail />
      </AuthLayout>
    ),
  },
  {
    path: "/admin/register",
    element: (
      <AuthLayout>
        <AdminRegister />
      </AuthLayout>
    ),
  },
  {
    path: "/profile",
    element: (
      <DashboardLayout>
        <Profile />
      </DashboardLayout>
    ),
  },
  {
    path: "/complete-client-profile",
    element: (
      <DashboardLayout>
        <CompleteClientProfile />
      </DashboardLayout>
    ),
  },
  {
    path: "/complete-driver-profile",
    element: (
      <DashboardLayout>
        <CompleteDriverProfile />
      </DashboardLayout>
    ),
  },
  {
    path: "/admin/dashboard",
    element: (
      <DashboardLayout>
        <AdminDashboard />
      </DashboardLayout>
    ),
  },
  {
    path: "/client/dashboard",
    element: (
      <DashboardLayout>
        <ClientDashboard />
      </DashboardLayout>
    ),
  },
  {
    path: "/driver/dashboard",
    element: (
      <DashboardLayout>
        <DriverDashboard />
      </DashboardLayout>
    ),
  },
  {
    path: "/missions",
    element: (
      <DashboardLayout>
        <Missions />
      </DashboardLayout>
    ),
  },
  {
    path: "/missions/new",
    element: (
      <DashboardLayout>
        <NewMission />
      </DashboardLayout>
    ),
  },
  {
    path: "/missions/:id/edit",
    element: (
      <DashboardLayout>
        <EditMission />
      </DashboardLayout>
    ),
  },
  {
    path: "/vehicles",
    element: (
      <DashboardLayout>
        <Vehicles />
      </DashboardLayout>
    ),
  },
  {
    path: "/clients",
    element: (
      <DashboardLayout>
        <Clients />
      </DashboardLayout>
    ),
  },
  {
    path: "/drivers",
    element: (
      <DashboardLayout>
        <Drivers />
      </DashboardLayout>
    ),
  },
  {
    path: "/contacts",
    element: (
      <DashboardLayout>
        <Contacts />
      </DashboardLayout>
    ),
  },
  {
    path: "/pricing",
    element: <Pricing />,
  },
  {
    path: "/admin/pricing-grid",
    element: (
      <DashboardLayout>
        <PricingGrid />
      </DashboardLayout>
    )
  },
]);

function App() {
  const { i18n } = useTranslation();
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    // Détecter la langue du navigateur au chargement de l'application
    const browserLanguage = navigator.language.split('-')[0]; // Récupère la partie principale de la langue (ex: "fr" de "fr-CA")
    if (i18n.language !== browserLanguage) {
      i18n.changeLanguage(browserLanguage);
    }
  }, [i18n]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
