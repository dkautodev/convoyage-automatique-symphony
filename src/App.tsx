
import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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

// Wrap the App component with AppWithI18n to properly structure providers
const AppWithProviders = () => {
  const [queryClient] = React.useState(() => new QueryClient());
  
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthProvider>
  );
};

function App() {
  const { t, i18n } = useTranslation();

  React.useEffect(() => {
    // Détecter la langue du navigateur au chargement de l'application
    const browserLanguage = navigator.language.split('-')[0]; // Récupère la partie principale de la langue (ex: "fr" de "fr-CA")
    
    // Vérifier si la langue actuelle est différente de la langue du navigateur
    if (i18n.language !== browserLanguage && typeof i18n.changeLanguage === 'function') {
      try {
        i18n.changeLanguage(browserLanguage);
      } catch (error) {
        console.error('Error changing language:', error);
      }
    }
  }, [i18n]);

  return <AppWithProviders />;
}

export default App;
