
import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  User, 
  Clipboard, 
  Truck, 
  MapPin, 
  Calendar, 
  Settings, 
  LogOut,
  UserPlus,
  Shield
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user role from URL path
  const path = location.pathname;
  let userRole = 'client'; // default
  
  if (path.includes('/admin')) {
    userRole = 'admin';
  } else if (path.includes('/driver')) {
    userRole = 'driver';
  }
  
  const handleLogout = () => {
    // In a real app, this would call supabase.auth.signOut()
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  const handleInviteAdmin = () => {
    navigate('/admin/invite');
  };
  
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className={`w-64 bg-white border-r p-4 flex flex-col ${
          userRole === 'admin' ? 'bg-admin-light/10' :
          userRole === 'driver' ? 'bg-driver-light/10' :
          'bg-client-light/10'
        }`}>
          <div className="flex items-center gap-2 mb-8">
            <MapPin className={`h-6 w-6 ${
              userRole === 'admin' ? 'text-admin' :
              userRole === 'driver' ? 'text-driver' :
              'text-client'
            }`} />
            <h1 className="text-xl font-bold">ConvoySync</h1>
          </div>
          
          <nav className="space-y-1 flex-1">
            <Button variant="ghost" className="w-full justify-start">
              <Clipboard className="mr-2 h-4 w-4" />
              Tableau de bord
            </Button>
            
            {userRole === 'admin' && (
              <>
                <Button variant="ghost" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Utilisateurs
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Truck className="mr-2 h-4 w-4" />
                  Chauffeurs
                </Button>
                <Link to="/admin/invite">
                  <Button variant="ghost" className="w-full justify-start">
                    <Shield className="mr-2 h-4 w-4" />
                    Invitations Admin
                  </Button>
                </Link>
              </>
            )}
            
            {userRole === 'client' && (
              <>
                <Button variant="ghost" className="w-full justify-start">
                  <Truck className="mr-2 h-4 w-4" />
                  Commandes
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Planning
                </Button>
              </>
            )}
            
            {userRole === 'driver' && (
              <>
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Missions
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <MapPin className="mr-2 h-4 w-4" />
                  Itinéraires
                </Button>
              </>
            )}
            
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </Button>
          </nav>
          
          <div className="border-t pt-4 mt-4">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="mb-8">
            <h2 className={`text-2xl font-bold ${
              userRole === 'admin' ? 'text-admin' :
              userRole === 'driver' ? 'text-driver' :
              'text-client'
            }`}>
              {userRole === 'admin' ? 'Tableau de Bord Admin' :
               userRole === 'driver' ? 'Tableau de Bord Chauffeur' :
               'Tableau de Bord Client'}
            </h2>
            <p className="text-muted-foreground">Bienvenue ! Voici un aperçu de votre activité.</p>
          </div>
          
          {/* Admin-specific quick action - improved visibility */}
          {userRole === 'admin' && (
            <div className="mb-8">
              <Button 
                variant="default" 
                className="bg-primary text-white hover:bg-primary/90"
                onClick={handleInviteAdmin}
              >
                <Shield className="mr-2 h-4 w-4" />
                Inviter un nouvel administrateur
              </Button>
            </div>
          )}
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Missions Actives</CardTitle>
                <CardDescription>Convois en cours</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {userRole === 'admin' ? '24' : userRole === 'driver' ? '3' : '5'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {userRole === 'admin' ? 'Total Utilisateurs' : 
                   userRole === 'driver' ? 'Missions Terminées' : 
                   'Commandes en Attente'}
                </CardTitle>
                <CardDescription>
                  {userRole === 'admin' ? 'Comptes actifs sur la plateforme' :
                   userRole === 'driver' ? 'Livraisons effectuées avec succès' :
                   'En attente de traitement'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {userRole === 'admin' ? '158' : userRole === 'driver' ? '42' : '2'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {userRole === 'admin' ? 'Revenus' : 
                   userRole === 'driver' ? 'Gains' : 
                   'Total Dépensé'}
                </CardTitle>
                <CardDescription>Mois en cours</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  €{userRole === 'admin' ? '24 500' : 
                     userRole === 'driver' ? '1 840' : 
                     '3 250'}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
              <CardDescription>
                Votre dernière activité {userRole === 'admin' ? 'sur la plateforme' : 
                                        userRole === 'driver' ? 'de mission' : 
                                        'de commande'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-3 flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {userRole === 'admin' ? 'Nouvel enregistrement client' : 
                       userRole === 'driver' ? 'Mission #CV-2023-156 assignée' : 
                       'Commande #CV-2023-156 placée'}
                    </p>
                    <p className="text-sm text-muted-foreground">Aujourd'hui à 10:25</p>
                  </div>
                  <Button variant="ghost" size="sm">Voir</Button>
                </div>
                
                <div className="border-b pb-3 flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {userRole === 'admin' ? 'Configuration des tarifs mise à jour' : 
                       userRole === 'driver' ? 'Mission #CV-2023-142 terminée' : 
                       'Facture #INV-2023-052 payée'}
                    </p>
                    <p className="text-sm text-muted-foreground">Hier à 16:30</p>
                  </div>
                  <Button variant="ghost" size="sm">Voir</Button>
                </div>
                
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {userRole === 'admin' ? 'Maintenance système terminée' : 
                       userRole === 'driver' ? 'Itinéraire de mission #CV-2023-137 mis à jour' : 
                       'Commande #CV-2023-137 livrée'}
                    </p>
                    <p className="text-sm text-muted-foreground">6 mai 2025 à 9:15</p>
                  </div>
                  <Button variant="ghost" size="sm">Voir</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
