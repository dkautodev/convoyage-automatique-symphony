
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Mission } from '@/types/supabase';
import { useAuth } from '@/hooks/auth';

interface RestitutionButtonProps {
  mission: Mission;
}

export const RestitutionButton: React.FC<RestitutionButtonProps> = ({ mission }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Vérifier si le bouton doit être affiché
  const shouldShowButton = () => {
    // Le bouton apparaît uniquement si :
    // 1. La mission est de type LIV
    // 2. La mission n'est pas déjà liée à une autre mission
    return mission.mission_type === 'LIV' && !mission.linked_mission_id;
  };

  const handleRestitutionClick = () => {
    // Naviguer vers le formulaire de création avec l'ID de la mission LIV
    if (profile?.role === 'admin') {
      navigate(`/mission/create?livId=${mission.id}`);
    } else {
      navigate(`/mission/create?livId=${mission.id}`);
    }
  };

  // Ne pas afficher le bouton si les conditions ne sont pas remplies
  if (!shouldShowButton()) {
    return null;
  }

  return (
    <Button 
      onClick={handleRestitutionClick}
      variant="outline"
      className="flex items-center gap-2"
    >
      <ArrowLeftRight className="h-4 w-4" />
      Restitution
    </Button>
  );
};
