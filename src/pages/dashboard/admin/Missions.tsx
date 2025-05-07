
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Plus, Search, Filter, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

const MissionsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const handleCreateNewMission = () => {
    // Cette fonction sera implémentée ultérieurement pour la création de mission
    console.log('Création d\'une nouvelle mission');
  };

  const navigateToPricingGrid = () => {
    navigate('/admin/pricing-grid');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des missions</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={navigateToPricingGrid} className="gap-2">
            <FileText className="h-4 w-4" />
            Grille tarifaire
          </Button>
          <Button onClick={handleCreateNewMission}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle mission
          </Button>
        </div>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="in-progress">En cours</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
          <TabsTrigger value="canceled">Annulées</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Liste des missions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-neutral-500">
                <p>Aucune mission à afficher pour le moment.</p>
                <p className="text-sm mt-1">Créez votre première mission en cliquant sur "Nouvelle mission"</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MissionsPage;
