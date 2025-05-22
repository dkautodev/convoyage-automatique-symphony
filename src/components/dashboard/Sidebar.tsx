
import React, { useContext, useEffect, createContext, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { User, Clipboard, Truck, MapPin, Calendar, Settings, LogOut, UserPlus, Shield, Plus, Mail, Menu, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

// Create context for controlling sidebar open state
interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  setIsOpen: () => {},
  toggle: () => {}
});

export const useSidebar = () => {
  return useContext(SidebarContext);
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Close sidebar on mobile by default
  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  const toggle = () => {
    setIsOpen(prev => !prev);
  };
  
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
};

// For accessibility - close sidebar when clicking outside on mobile
export const SidebarOverlay: React.FC = () => {
  const { isOpen, setIsOpen } = useSidebar();
  const isMobile = useIsMobile();
  
  if (!isOpen || !isMobile) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/20 z-40"
      onClick={() => setIsOpen(false)}
      aria-hidden="true"
    />
  );
};

export const SidebarTrigger: React.FC = () => {
  const { isOpen, toggle } = useSidebar();
  
  // Don't show trigger when sidebar is open - user can click elsewhere to close
  if (isOpen) {
    return null;
  }
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggle}
      className="mb-2"
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
};

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { isOpen, setIsOpen } = useSidebar();
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Get user role from profile
  const userRole = profile?.role || 'client';
  
  const handleLogout = () => {
    logout()
      .then(() => {
        toast.success('Déconnexion réussie');
        navigate('/login');
      })
      .catch(error => {
        console.error('Erreur lors de la déconnexion:', error);
        toast.error('Erreur lors de la déconnexion');
      });
  };
  
  const handleCreateMission = () => {
    navigate('/mission/create');
  };
  
  const handleContactClick = () => {
    if (userRole === 'admin') {
      navigate('/admin/contact');
    } else if (userRole === 'client') {
      navigate('/client/contact');
    } else {
      navigate('/contact');
    }
    
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const roleLinkPrefix = userRole === 'chauffeur' ? 'driver' : userRole;
  
  // Close sidebar on link click on mobile
  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };
  
  // Color styles based on role
  const roleColors = {
    admin: 'bg-admin-light/10 text-admin',
    client: 'bg-client-light/10 text-client',
    chauffeur: 'bg-driver-light/10 text-driver'
  };
  
  return (
    <>
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 transition-all duration-300 flex flex-col border-r bg-white",
          isOpen ? "translate-x-0 w-64" : "w-0 -translate-x-full",
          className
        )}
      >
        <div className="flex items-center justify-between p-4 h-16 border-b">
          <div className="flex items-center gap-2 overflow-hidden">
            <MapPin className={cn("h-5 w-5", roleColors[userRole])} />
            <h1 className="text-xl font-bold">ConvoySync</h1>
          </div>
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <nav className="space-y-1 flex-1 p-4 overflow-y-auto">
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            asChild
            onClick={handleLinkClick}
          >
            <Link to={`/${roleLinkPrefix}/dashboard`}>
              <Clipboard className="mr-2 h-4 w-4" />
              Tableau de bord
            </Link>
          </Button>
          
          {userRole === 'admin' && (
            <>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                asChild
                onClick={handleLinkClick}
              >
                <Link to="/admin/clients">
                  <User className="mr-2 h-4 w-4" />
                  Utilisateurs
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                asChild
                onClick={handleLinkClick}
              >
                <Link to="/admin/drivers">
                  <Truck className="mr-2 h-4 w-4" />
                  Chauffeurs
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                asChild
                onClick={handleLinkClick}
              >
                <Link to="/admin/missions">
                  <MapPin className="mr-2 h-4 w-4" />
                  Missions
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                asChild
                onClick={handleLinkClick}
              >
                <Link to="/admin/invoices">
                  <FileText className="mr-2 h-4 w-4" />
                  Facturation
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                asChild
                onClick={handleLinkClick}
              >
                <Link to="/admin/driver-invoices">
                  <FileText className="mr-2 h-4 w-4" />
                  Factures chauffeurs
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                asChild
                onClick={handleLinkClick}
              >
                <Link to="/admin/invite">
                  <Shield className="mr-2 h-4 w-4" />
                  Invitations Admin
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={handleCreateMission}
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer une mission
              </Button>
            </>
          )}
          
          {userRole === 'client' && (
            <>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                asChild
                onClick={handleLinkClick}
              >
                <Link to="/client/missions">
                  <Truck className="mr-2 h-4 w-4" />
                  Missions
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                asChild
                onClick={handleLinkClick}
              >
                <Link to="/client/invoices">
                  <FileText className="mr-2 h-4 w-4" />
                  Factures
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                asChild
                onClick={handleLinkClick}
              >
                <Link to="/client/contacts">
                  <User className="mr-2 h-4 w-4" />
                  Contacts
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={handleCreateMission}
              >
                <Plus className="mr-2 h-4 w-4" />
                Créer une mission
              </Button>
            </>
          )}
          
          {userRole === 'chauffeur' && (
            <>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                asChild
                onClick={handleLinkClick}
              >
                <Link to="/driver/missions">
                  <Calendar className="mr-2 h-4 w-4" />
                  Missions
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                asChild
                onClick={handleLinkClick}
              >
                <Link to="/driver/driver-invoices">
                  <FileText className="mr-2 h-4 w-4" />
                  Mes factures
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                asChild
                onClick={handleLinkClick}
              >
                <Link to="/driver/revenue-management">
                  <FileText className="mr-2 h-4 w-4" />
                  Revenus
                </Link>
              </Button>
            </>
          )}
          
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            onClick={handleContactClick}
          >
            <Mail className="mr-2 h-4 w-4" />
            Contact
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            asChild
            onClick={handleLinkClick}
          >
            <Link to="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </Link>
          </Button>
        </nav>
        
        <div className="border-t p-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground" 
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
