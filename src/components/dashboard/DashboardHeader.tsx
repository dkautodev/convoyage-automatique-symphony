
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Bell, User, LogOut, Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardHeaderProps {
  toggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

const DashboardHeader = ({ toggleSidebar, sidebarOpen }: DashboardHeaderProps) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Déterminer le rôle
  const role: string = profile?.role || 'client';
  
  // Titre du tableau de bord en fonction du rôle
  const dashboardTitle = {
    admin: 'Administration',
    client: 'Espace Client',
    chauffeur: 'Espace Chauffeur'
  }[role];

  // Gestion du clic sur le bouton de déconnexion
  const handleLogout = () => {
    console.log("Déconnexion demandée depuis le DashboardHeader");
    logout()
      .catch(error => {
        console.error('Erreur lors de la déconnexion (DashboardHeader):', error);
      });
  };

  // Fonction pour naviguer vers le profil
  const navigateToProfile = () => {
    navigate('/profile');
  };
  
  // Fonction pour naviguer vers les paramètres
  const navigateToSettings = () => {
    navigate('/settings');
  };
  
  return (
    <header className="px-3 sm:px-6 py-3 flex items-center justify-between h-16">
      {/* Mobile menu toggle button - only show when sidebar is closed */}
      {isMobile && toggleSidebar && !sidebarOpen && (
        <Button 
          variant="ghost" 
          size="icon"
          className="mr-2 h-10 w-10"
          onClick={toggleSidebar}
        >
          <Menu size={24} />
        </Button>
      )}
      
      {/* Titre de la page - centré sur mobile */}
      <h1 className="text-lg sm:text-xl font-bold text-neutral-800 truncate text-center flex-1">
        {dashboardTitle}
      </h1>
      
      {/* Actions utilisateur */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-10 w-10">
          <Bell size={24} className="text-neutral-600" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>
        </Button>
        
        {/* Menu utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-10 w-10 sm:w-auto">
              <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center">
                <User size={20} className="text-neutral-600" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{profile?.full_name || user?.email}</p>
                <p className="text-xs text-neutral-500 capitalize">{role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={navigateToProfile} className="cursor-pointer">Profil</DropdownMenuItem>
            <DropdownMenuItem onClick={navigateToSettings} className="cursor-pointer">Paramètres</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;
