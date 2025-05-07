
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Package, Clock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ClientDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tableau de bord client</h1>
        <Button>
          <Package className="mr-2 h-4 w-4" />
          Nouvelle mission
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Missions en cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-7 w-7 text-blue-500 mr-4" />
              <div>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">En transit</p>
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
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Planifiées</p>
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
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">Ce mois-ci</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="h-7 w-7 text-amber-500 mr-4" />
              <div>
                <div className="text-2xl font-bold">3 250 €</div>
                <p className="text-xs text-muted-foreground">Ce mois-ci</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Missions récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b pb-3">
                <div className="flex justify-between mb-1">
                  <div className="font-medium">Mission #CV-2023-156</div>
                  <div className="text-sm text-blue-500 font-medium">En cours</div>
                </div>
                <div className="text-sm text-muted-foreground">Paris → Lyon • 05/05/2025</div>
              </div>
              
              <div className="border-b pb-3">
                <div className="flex justify-between mb-1">
                  <div className="font-medium">Mission #CV-2023-155</div>
                  <div className="text-sm text-green-500 font-medium">Terminée</div>
                </div>
                <div className="text-sm text-muted-foreground">Marseille → Nice • 04/05/2025</div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <div className="font-medium">Mission #CV-2023-149</div>
                  <div className="text-sm text-green-500 font-medium">Terminée</div>
                </div>
                <div className="text-sm text-muted-foreground">Paris → Lille • 28/04/2025</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Missions à venir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b pb-3">
                <div className="flex justify-between mb-1">
                  <div className="font-medium">Mission #CV-2023-158</div>
                  <div className="text-sm text-amber-500 font-medium">Planifiée</div>
                </div>
                <div className="text-sm text-muted-foreground">Lyon → Paris • 12/05/2025</div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <div className="font-medium">Mission #CV-2023-159</div>
                  <div className="text-sm text-amber-500 font-medium">Planifiée</div>
                </div>
                <div className="text-sm text-muted-foreground">Bordeaux → Toulouse • 15/05/2025</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
