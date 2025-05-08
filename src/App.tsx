
import React, { useEffect, useState } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation, I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import './App.css';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import PricingGrid from './pages/dashboard/admin/PricingGrid';
import { AuthProvider } from './hooks/auth';
import Profile from './pages/Profile';

// Créer une configuration de route simplifiée pour déboguer
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
    path: "/admin/dashboard",
    element: (
      <DashboardLayout>
        <div>Tableau de bord administrateur</div>
      </DashboardLayout>
    ),
  },
  {
    path: "/admin/pricing-grid",
    element: (
      <DashboardLayout>
        <PricingGrid />
      </DashboardLayout>
    )
  },
  {
    path: "/profile",
    element: (
      <DashboardLayout>
        <Profile />
      </DashboardLayout>
    )
  },
]);

// Wrap the App component with AppWithI18n to avoid i18n issues in hooks
const AppWithI18n = () => {
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Détecter la langue du navigateur au chargement de l'application
    const browserLanguage = navigator.language.split('-')[0]; // Récupère la partie principale de la langue (ex: "fr" de "fr-CA")
    
    // Vérifier si la méthode changeLanguage existe avant de l'appeler
    if (i18n.language !== browserLanguage && typeof i18n.changeLanguage === 'function') {
      i18n.changeLanguage(browserLanguage);
    }
  }, [i18n]);

  return <AppWithI18n />;
}

export default App;
