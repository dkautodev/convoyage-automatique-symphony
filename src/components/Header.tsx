
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Truck, User, LogOut } from 'lucide-react';

const Header = () => {
  const { user, profile, logout } = useAuth();
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-blue-500" />
          <Link to="/" className="text-xl font-bold">ConvoySync</Link>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Utilisateur connecté */}
              <div className="text-sm text-gray-600 hidden md:block">
                Connecté en tant que <span className="font-medium">{profile?.full_name || user.email}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/${profile?.role}/dashboard`}>
                    <User className="mr-2 h-4 w-4" />
                    Mon compte
                  </Link>
                </Button>
                
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Utilisateur non connecté */}
              <Button variant="ghost" size="sm" asChild>
                <Link to="/home">Connexion</Link>
              </Button>
              
              <Button variant="default" size="sm" asChild>
                <Link to="/register">Inscription</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
