
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster'; 
import Header from '@/components/Header';
import Sidebar from '@/components/dashboard/Sidebar';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { ArrowLeft, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, profile } = useAuth();
  
  // Fermer le menu quand on change de page
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // S'assurer que tout le contenu est correctement à l'échelle
  useEffect(() => {
    document.documentElement.classList.add('h-full', 'overflow-x-hidden');
    document.body.classList.add('min-h-screen', 'h-full', 'bg-gray-100');
    
    return () => {
      document.documentElement.classList.remove('h-full', 'overflow-x-hidden');
      document.body.classList.remove('min-h-screen', 'h-full', 'bg-gray-100');
    };
  }, []);

  // Si l'utilisateur n'est pas connecté, afficher un écran de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Déterminer le rôle de l'utilisateur
  const userRole = profile?.role || 'client';

  return (
    <div className="h-screen flex overflow-hidden bg-muted/30">
      {/* Sidebar pour mobile - s'ouvre en modal */}
      <div 
        className={`fixed inset-0 z-40 md:hidden bg-black/50 transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 md:w-72 flex-shrink-0 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="h-full flex flex-col">
          {/* Logo en bas du menu en mobile */}
          <div className="md:hidden mt-auto p-4 border-t flex justify-center">
            <img src="/lovable-uploads/4f0af89a-3624-4a59-9623-2e9852b51049.png" alt="Logo" className="h-12" />
          </div>
          
          <Sidebar userRole={userRole} />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* En-tête avec bouton de menu optimisé */}
        <div className="relative z-10 flex-shrink-0 h-16 bg-white shadow-sm flex items-center">
          <button
            type="button"
            className="px-4 text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          
          {/* Logo desktop - visible uniquement sur desktop */}
          <div className="hidden md:flex items-center ml-4">
            <img src="/lovable-uploads/4f0af89a-3624-4a59-9623-2e9852b51049.png" alt="Logo" className="h-10" />
          </div>
          
          <Header />
        </div>

        {/* Zone de contenu principale - assurer qu'elle est correctement mise à l'échelle */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="py-6 px-4 sm:px-6 md:px-8 min-h-screen w-full max-w-full">
            {children}
          </div>
        </main>
      </div>
      
      {/* Toaster (notifications) */}
      <SonnerToaster position="bottom-right" closeButton duration={2000} />
    </div>
  );
};

export default DashboardLayout;
