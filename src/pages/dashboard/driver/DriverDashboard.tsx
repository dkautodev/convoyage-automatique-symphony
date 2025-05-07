
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Package, Clock, CreditCard, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DriverDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tableau de bord chauffeur</h1>
        <Button>
          <MapPin className="mr-2 h-4 w-4" />
          Voir mes missions
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mission du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-7 w-7 text-blue-500 mr-4" />
              <div>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Missions à venir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-7 w-7 text-green-500 mr-4" />
              <div>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">Cette semaine</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Missions terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-7 w-7 text-purple-500 mr-4" />
              <div>
                <div className="text-2xl font-bold">42</div>
                <p className="text-xs text-muted-foreground">Ce mois-ci</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="h-7 w-7 text-amber-500 mr-4" />
              <div>
                <div className="text-2xl font-bold">1 840 €</div>
                <p className="text-xs text-muted-foreground">Ce mois-ci</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ma mission en cours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-4 bg-muted/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Mission</h3>
                <p className="font-semibold text-lg">#CV-2023-156</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Statut</h3>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                  En cours de livraison
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Départ</h3>
                <p>Paris, France</p>
                <p className="text-sm text-muted-foreground">Départ à 08:30</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Destination</h3>
                <p>Lyon, France</p>
                <p className="text-sm text-muted-foreground">Arrivée estimée : 14:00</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Véhicule</h3>
                <p>Citroën C3 - AB-123-CD</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Distance</h3>
                <p>465 km</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <Button variant="outline">
              <Phone className="mr-2 h-4 w-4" />
              Contacter le client
            </Button>

            <Button>
              <CheckCircle className="mr-2 h-4 w-4" />
              Marquer comme terminé
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prochaines missions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-b pb-3">
              <div className="flex justify-between mb-1">
                <div className="font-medium">Mission #CV-2023-158</div>
                <div className="text-sm text-amber-500 font-medium">Demain</div>
              </div>
              <div className="text-sm text-muted-foreground">Lyon → Paris • 390 km</div>
            </div>

            <div className="border-b pb-3">
              <div className="flex justify-between mb-1">
                <div className="font-medium">Mission #CV-2023-160</div>
                <div className="text-sm text-amber-500 font-medium">09/05/2025</div>
              </div>
              <div className="text-sm text-muted-foreground">Paris → Nantes • 380 km</div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <div className="font-medium">Mission #CV-2023-162</div>
                <div className="text-sm text-amber-500 font-medium">11/05/2025</div>
              </div>
              <div className="text-sm text-muted-foreground">Nantes → Bordeaux • 350 km</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverDashboard;
