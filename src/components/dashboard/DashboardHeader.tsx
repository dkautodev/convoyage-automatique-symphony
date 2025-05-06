
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

const DashboardHeader = () => {
  const { user, profile, logout } = useAuth();
  
  // Déterminer le thème en fonction du rôle
  const role: UserRole = profile?.role || 'client';
  const roleColor = {
    admin: 'text-admin',
    client: 'text-client',
    chauffeur: 'text-driver'
  }[role];
  
  // Titre du tableau de bord en fonction du rôle
  const dashboardTitle = {
    admin: 'Administration',
    client: 'Espace Client',
    chauffeur: 'Espace Chauffeur'
  }[role];
  
  return (
    <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
      {/* Titre de la page */}
      <h1 className={`text-xl font-bold ${roleColor}`}>
        {dashboardTitle}
      </h1>
      
      {/* Actions utilisateur */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </Button>
        
        {/* Menu utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={16} className="text-gray-600" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{profile?.full_name || user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Paramètres</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;
