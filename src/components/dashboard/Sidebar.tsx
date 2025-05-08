
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, Users, FileText, Settings, LogOut, 
  Building, Truck, PackageOpen, Euro, ShieldCheck, 
  ChevronDown, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { toast } from 'sonner';

interface SidebarProps {
  userRole: string;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Définir les liens en fonction du rôle de l'utilisateur
  const getLinks = () => {
    switch (userRole) {
      case 'admin':
        return [
          { href: '/admin/dashboard', icon: <LayoutDashboard className="mr-2 h-4 w-4" />, label: 'Tableau de bord' },
          { href: '/admin/clients', icon: <Building className="mr-2 h-4 w-4" />, label: 'Clients' },
          { href: '/admin/drivers', icon: <Truck className="mr-2 h-4 w-4" />, label: 'Chauffeurs' },
          { href: '/admin/missions', icon: <PackageOpen className="mr-2 h-4 w-4" />, label: 'Missions' },
          { href: '/admin/pricing-grid', icon: <Euro className="mr-2 h-4 w-4" />, label: 'Tarifs' }
        ];
      case 'client':
        return [
          { href: '/client/dashboard', icon: <LayoutDashboard className="mr-2 h-4 w-4" />, label: 'Tableau de bord' },
          { href: '/client/missions', icon: <PackageOpen className="mr-2 h-4 w-4" />, label: 'Mes missions' },
          { href: '/client/new-mission', icon: <FileText className="mr-2 h-4 w-4" />, label: 'Nouvelle mission' }
        ];
      case 'chauffeur':
        return [
          { href: '/driver/dashboard', icon: <LayoutDashboard className="mr-2 h-4 w-4" />, label: 'Tableau de bord' },
          { href: '/driver/missions', icon: <PackageOpen className="mr-2 h-4 w-4" />, label: 'Missions' }
        ];
      default:
        return [
          { href: '/client/dashboard', icon: <LayoutDashboard className="mr-2 h-4 w-4" />, label: 'Tableau de bord' }
        ];
    }
  };

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
    <div className="h-screen border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-64 flex flex-col">
      <div className="p-6">
        <NavLink to="/" className="flex items-center gap-2 font-bold text-xl">
          <ShieldCheck className="h-6 w-6" />
          <span>ConvoySync</span>
        </NavLink>
      </div>
      
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {getLinks().map((link, index) => (
            <NavLink
              key={index}
              to={link.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
      
      <div className="p-4 border-t">
        <div className="space-y-1">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <Users className="mr-2 h-4 w-4" />
            Profile
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </NavLink>
          <Button 
            variant="ghost"
            className="w-full justify-start px-3 py-2 text-sm font-medium"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
