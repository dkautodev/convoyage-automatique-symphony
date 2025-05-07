
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/supabase';
import { Bell, User } from 'lucide-react';
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
import { toast } from 'sonner';

const DashboardHeader = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  
  // Déterminer le rôle
  const role: UserRole = profile?.role || 'client';
  
  // Titre du tableau de bord en fonction du rôle
  const dashboardTitle = {
    admin: 'Administration',
    client: 'Espace Client',
    chauffeur: 'Espace Chauffeur'
  }[role];

  // Gestion du clic sur le bouton de déconnexion
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Déconnexion réussie');
      navigate('/home');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };
  
  return (
    <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
      {/* Titre de la page */}
      <h1 className="text-xl font-bold text-neutral-800">
        {dashboardTitle}
      </h1>
      
      {/* Actions utilisateur */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} className="text-neutral-600" />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </Button>
        
        {/* Menu utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center">
                <User size={16} className="text-neutral-600" />
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
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Paramètres</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;
