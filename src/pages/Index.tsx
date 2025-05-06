
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, User, UserCog, ChevronRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">ConvoySync</h1>
          </div>
          <div className="space-x-2">
            <Link to="/login">
              <Button variant="outline">Connexion</Button>
            </Link>
            <Link to="/register">
              <Button>Inscription</Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <div className="container mx-auto p-4 py-16 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Gestion de Convoyage de Véhicules</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Logistique simplifiée, calculs automatisés et données centralisées pour 
              une gestion efficace des convois de véhicules.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="animate-fade-in">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4">S'inscrire en tant que Client</h3>
                <p className="text-muted-foreground mb-6">
                  Créez un compte client pour gérer vos commandes et suivre vos convoyages de véhicules.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-client-light p-3 rounded-full">
                    <User className="h-6 w-6 text-client-dark" />
                  </div>
                  <div>
                    <p className="font-medium">Espace Client</p>
                    <p className="text-sm text-muted-foreground">Pour les entreprises nécessitant des services de transport</p>
                  </div>
                </div>
                <Link to="/register?role=client">
                  <Button className="w-full bg-client hover:bg-client-dark">
                    S'inscrire comme Client <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4">S'inscrire en tant que Chauffeur</h3>
                <p className="text-muted-foreground mb-6">
                  Rejoignez notre réseau de chauffeurs professionnels et commencez à recevoir des missions de convoyage.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-driver-light p-3 rounded-full">
                    <UserCog className="h-6 w-6 text-driver-dark" />
                  </div>
                  <div>
                    <p className="font-medium">Espace Chauffeur</p>
                    <p className="text-sm text-muted-foreground">Pour les professionnels fournissant des services de transport</p>
                  </div>
                </div>
                <Link to="/register?role=driver">
                  <Button className="w-full bg-driver hover:bg-driver-dark">
                    S'inscrire comme Chauffeur <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Vous avez déjà un compte ?
            </p>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Se connecter à votre compte
              </Button>
            </Link>
          </div>
        </div>
      </main>
      
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto p-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 ConvoySync. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
