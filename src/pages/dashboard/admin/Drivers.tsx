
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DriversPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des chauffeurs</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau chauffeur
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Liste des chauffeurs
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
              <Input
                type="search"
                placeholder="Rechercher un chauffeur..."
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-neutral-500">
            <p>Aucun chauffeur à afficher pour le moment.</p>
            <p className="text-sm mt-1">Créez votre premier chauffeur en cliquant sur "Nouveau chauffeur"</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriversPage;
