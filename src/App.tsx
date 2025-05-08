
import React, { useEffect, useState } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import './App.css';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import PricingGridPage from './pages/dashboard/admin/PricingGrid';

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
        <PricingGridPage />
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
