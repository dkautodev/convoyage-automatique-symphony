import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Clipboard, 
  Truck, 
  MapPin, 
  Calendar, 
  Settings, 
  LogOut,
  UserPlus,
  Shield,
  Plus,
  Building,
  User
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';

interface SidebarProps {
  userRole: string | undefined;
  collapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole, collapsed, onToggle }) => {
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Sidebar items based on user role
  const sidebarItems = useMemo(() => {
    switch (userRole) {
      case 'admin':
        return [
          { label: 'Tableau de bord', icon: Home, href: '/admin/dashboard' },
          { label: 'Clients', icon: Building, href: '/admin/clients' },
          { label: 'Chauffeurs', icon: Truck, href: '/admin/drivers' },
          { label: 'Contacts', icon: User, href: '/admin/contacts' },
          { label: 'Missions', icon: Clipboard, href: '/admin/missions' },
          { label: 'Invitations Admin', icon: Shield, href: '/admin/invite' },
        ];
      
      case 'client':
        return [
          { label: 'Tableau de bord', icon: Home, href: '/client/dashboard' },
          { label: 'Missions', icon: Clipboard, href: '/client/missions' },
          { label: 'Contacts', icon: User, href: '/client/contacts' },
        ];
      
      case 'chauffeur':
        return [
          { label: 'Tableau de bord', icon: Home, href: '/driver/dashboard' },
          { label: 'Missions', icon: Calendar, href: '/driver/missions' },
          { label: 'Itinéraires', icon: MapPin, href: '/driver/itineraires' },
        ];
      
      default:
        return [];
    }
  }, [userRole]);

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full w-64 bg-white border-r flex flex-col transition-transform duration-200 ease-in-out z-50",
        collapsed ? "-translate-x-64" : "translate-x-0"
      )}
    >
      <div className="flex items-center gap-2 mb-8 p-4">
        <MapPin className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">ConvoySync</h1>
      </div>
      
      <nav className="space-y-1 flex-1 p-4">
        {sidebarItems.map((item) => (
          <Link key={item.label} to={item.href} className="w-full">
            <Button variant="ghost" className={cn("w-full justify-start", isActive(item.href) ? "font-semibold" : "")}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
      
      <div className="border-t pt-4 mt-4 p-4">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
