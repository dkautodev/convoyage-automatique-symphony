
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminMissionsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleCreateMission = () => {
    navigate('/mission/create');
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Missions (Admin)</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Grille tarifaire
          </Button>
          <Button onClick={handleCreateMission} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle mission
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Liste des missions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Aucune mission n'a encore été créée. Cliquez sur "Nouvelle mission" pour en créer une.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMissionsPage;
