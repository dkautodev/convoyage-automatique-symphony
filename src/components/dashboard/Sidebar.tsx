import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Truck, Home, Package, Users, Tag, UserPlus, Contact, FileText, Settings, User, ListCheck } from 'lucide-react';

interface SidebarProps {
  userRole: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  userRole
}) => {
  const location = useLocation();

  // Helper function to determine if a link is active
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Function to get the proper color class based on user role
  const getRoleColorClass = (type: 'text' | 'bg' | 'hover-bg') => {
    if (userRole === 'admin') {
      return type === 'text' ? 'text-neutral-900' : type === 'bg' ? 'bg-neutral-100' : 'hover:bg-neutral-100';
    } else if (userRole === 'client') {
      return type === 'text' ? 'text-neutral-800' : type === 'bg' ? 'bg-neutral-100' : 'hover:bg-neutral-100';
    } else if (userRole === 'chauffeur') {
      return type === 'text' ? 'text-neutral-700' : type === 'bg' ? 'bg-neutral-100' : 'hover:bg-neutral-100';
    }
    return type === 'text' ? 'text-neutral-600' : type === 'bg' ? 'bg-neutral-100' : 'hover:bg-neutral-100';
  };

  // Common navigation items
  const commonItems = [{
    path: '/profile',
    label: 'Mon profil',
    icon: <User size={20} />
  }, {
    path: '/settings',
    label: 'Paramètres',
    icon: <Settings size={20} />
  }];

  // Role-specific navigation items
  const navigationItems = {
    admin: [{
      path: '/admin/dashboard',
      label: 'Tableau de bord',
      icon: <Home size={20} />
    }, {
      path: '/admin/missions',
      label: 'Missions',
      icon: <Package size={20} />
    }, {
      path: '/admin/invoices',
      label: 'Factures',
      icon: <FileText size={20} />
    }, {
      path: '/admin/clients',
      label: 'Clients',
      icon: <Users size={20} />
    }, {
      path: '/admin/contacts',
      label: 'Contacts',
      icon: <Contact size={20} />
    }, {
      path: '/admin/pricing-grid',
      label: 'Grille tarifaire',
      icon: <Tag size={20} />
    }, {
      path: '/admin/invite',
      label: 'Invitations',
      icon: <UserPlus size={20} />
    }],
    client: [{
      path: '/client/dashboard',
      label: 'Tableau de bord',
      icon: <Home size={20} />
    }, {
      path: '/client/missions',
      label: 'Mes missions',
      icon: <Package size={20} />
    }, {
      path: '/client/invoices',
      label: 'Mes factures',
      icon: <FileText size={20} />
    }, {
      path: '/client/contacts',
      label: 'Mes contacts',
      icon: <Contact size={20} />
    }],
    chauffeur: [{
      path: '/driver/dashboard',
      label: 'Tableau de bord',
      icon: <Home size={20} />
    }, {
      path: '/driver/missions',
      label: 'Mes missions',
      icon: <ListCheck size={20} />
    }]
  };

  // Get navigation items for the current user role
  const roleItems = navigationItems[userRole as keyof typeof navigationItems] || [];

  // Merge role-specific items with common items
  const allItems = [...roleItems, ...commonItems];
  return <div className="bg-white w-64 h-full shadow-lg">
      {/* Logo Section */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center">
        <img src="/lovable-uploads/4f0af89a-3624-4a59-9623-2e9852b51049.png" alt="DK Automotive Logo" className="h-8" />
        
      </div>
      
      {/* Navigation Section */}
      <nav className="px-4 py-6">
        <ul className="space-y-2">
          {allItems.map(item => <li key={item.path}>
              <NavLink to={item.path} className={({
            isActive
          }) => `flex items-center px-4 py-2 rounded-md transition-colors ${isActive ? `${getRoleColorClass('bg')} ${getRoleColorClass('text')}` : `text-neutral-600 ${getRoleColorClass('hover-bg')}`}`}>
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>)}
        </ul>
      </nav>
    </div>;
};

export default Sidebar;
