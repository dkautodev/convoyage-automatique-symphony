
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClientMissionsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleCreateMission = () => {
    navigate('/mission/create');
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vos Missions</h1>
        <Button onClick={handleCreateMission} className="gap-2">
          <Plus className="h-4 w-4" />
          Créer une mission
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Liste de vos missions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Vous n'avez pas encore de missions. Cliquez sur le bouton "Créer une mission" pour commencer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientMissionsPage;
