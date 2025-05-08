
import React, { useEffect } from 'react';
import {
  Routes,
  Route,
  useNavigate
} from "react-router-dom";
import { useTranslation } from 'react-i18next';
import './App.css';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import PricingGrid from './pages/dashboard/admin/PricingGrid';
import { AuthProvider } from './hooks/auth';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Login from './pages/Login';
import ClientDashboard from './pages/dashboard/client/ClientDashboard';
import CompleteClientProfile from './pages/auth/CompleteClientProfile';
import CompleteDriverProfile from './pages/auth/CompleteDriverProfile';

function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
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

  return (
    <AuthProvider>
      <Routes>
        {/* Pages publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* Pages d'authentification et profil */}
        <Route path="/complete-client-profile" element={<CompleteClientProfile />} />
        <Route path="/complete-driver-profile" element={<CompleteDriverProfile />} />
        
        {/* Pages du tableau de bord administrateur */}
        <Route path="/admin/dashboard" element={
          <DashboardLayout>
            <div>Tableau de bord administrateur</div>
          </DashboardLayout>
        } />
        <Route path="/admin/pricing-grid" element={
          <DashboardLayout>
            <PricingGrid />
          </DashboardLayout>
        } />
        
        {/* Pages client */}
        <Route path="/client/dashboard" element={
          <DashboardLayout>
            <ClientDashboard />
          </DashboardLayout>
        } />
        
        {/* Pages utilisateur */}
        <Route path="/profile" element={
          <DashboardLayout>
            <Profile />
          </DashboardLayout>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;
