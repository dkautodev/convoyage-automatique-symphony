
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/supabase';
import { cn } from '@/lib/utils';
import {
  Truck,
  Users,
  FileText,
  Settings,
  Home,
  Package,
  Calendar,
  MapPin,
  CreditCard,
  ClipboardList,
  Building,
  PhoneCall,
  BarChart,
  Cog,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  userRole?: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole = 'client' }) => {
  const { logout } = useAuth();
  
  // Déterminer la couleur de thème en fonction du rôle
  const themeColor = {
    admin: 'bg-admin-light/10 text-admin border-admin',
    client: 'bg-client-light/10 text-client border-client',
    chauffeur: 'bg-driver-light/10 text-driver border-driver'
  }[userRole];
  
  // Liens communs à tous les rôles
  const commonLinks = [
    { icon: <Home size={18} />, label: 'Tableau de bord', to: `/${userRole === 'chauffeur' ? 'driver' : userRole}/dashboard` },
    { icon: <Settings size={18} />, label: 'Paramètres', to: `/${userRole === 'chauffeur' ? 'driver' : userRole}/settings` }
  ];
  
  // Liens spécifiques au rôle administrateur
  const adminLinks = [
    { icon: <Package size={18} />, label: 'Missions', to: '/admin/missions' },
    { icon: <Building size={18} />, label: 'Clients', to: '/admin/clients' },
    { icon: <Users size={18} />, label: 'Chauffeurs', to: '/admin/drivers' },
    { icon: <PhoneCall size={18} />, label: 'Contacts', to: '/admin/contacts' },
    { icon: <Truck size={18} />, label: 'Véhicules', to: '/admin/vehicles' },
    { icon: <CreditCard size={18} />, label: 'Tarifs', to: '/admin/pricing' },
    { icon: <FileText size={18} />, label: 'Documents', to: '/admin/documents' },
    { icon: <BarChart size={18} />, label: 'Rapports', to: '/admin/reports' },
    { icon: <Cog size={18} />, label: 'Configuration', to: '/admin/configuration' }
  ];
  
  // Liens spécifiques au rôle client
  const clientLinks = [
    { icon: <Package size={18} />, label: 'Missions', to: '/client/missions' },
    { icon: <PhoneCall size={18} />, label: 'Contacts', to: '/client/contacts' },
    { icon: <FileText size={18} />, label: 'Documents', to: '/client/documents' }
  ];
  
  // Liens spécifiques au rôle chauffeur
  const driverLinks = [
    { icon: <Package size={18} />, label: 'Missions', to: '/driver/missions' },
    { icon: <Calendar size={18} />, label: 'Planning', to: '/driver/schedule' },
    { icon: <MapPin size={18} />, label: 'Itinéraires', to: '/driver/routes' },
    { icon: <ClipboardList size={18} />, label: 'Rapports', to: '/driver/reports' }
  ];
  
  // Sélection des liens en fonction du rôle
  let roleLinks = [];
  switch (userRole) {
    case 'admin':
      roleLinks = adminLinks;
      break;
    case 'client':
      roleLinks = clientLinks;
      break;
    case 'chauffeur':
      roleLinks = driverLinks;
      break;
    default:
      roleLinks = clientLinks;
  }
  
  // Tous les liens à afficher
  const links = [...commonLinks.slice(0, 1), ...roleLinks, ...commonLinks.slice(1)];
  
  return (
    <aside className={`w-64 min-h-screen border-r ${themeColor} transition-all duration-200`}>
      <div className="h-full flex flex-col">
        {/* En-tête du sidebar */}
        <div className="p-4 border-b flex items-center gap-2">
          <Truck className="h-6 w-6" />
          <h1 className="text-xl font-bold">ConvoySync</h1>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {links.map((link, index) => (
              <li key={index}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                      isActive
                        ? `bg-${userRole === 'admin' ? 'admin' : userRole === 'chauffeur' ? 'driver' : 'client'} text-white`
                        : "hover:bg-gray-100"
                    )
                  }
                >
                  {link.icon}
                  <span>{link.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Bouton de déconnexion */}
        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
