
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateMissionForm } from '@/components/mission/CreateMissionForm';
import { useAuth } from '@/hooks/useAuth';

export default function CreateMissionPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const handleSuccess = () => {
    if (profile?.role === 'admin') {
      navigate('/admin/missions');
    } else {
      navigate('/client/missions');
    }
  };
  
  const handleBack = () => {
    if (profile?.role === 'admin') {
      navigate('/admin/missions');
    } else {
      navigate('/client/missions');
    }
  };
  
  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={handleBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Créer une nouvelle mission</h1>
      </div>
      
      <CreateMissionForm onSuccess={handleSuccess} />
    </div>
  );
}
