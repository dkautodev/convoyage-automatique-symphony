
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ClientMissionsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mes missions</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Demander une mission
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            type="search"
            placeholder="Rechercher une mission..."
            className="pl-8"
          />
        </div>
        <Button variant="outline" className="flex gap-2">
          <Filter className="h-4 w-4" />
          Filtres
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Historique des missions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-neutral-500">
            <p>Aucune mission à afficher pour le moment.</p>
            <p className="text-sm mt-1">Demandez votre première mission en cliquant sur "Demander une mission"</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientMissionsPage;
