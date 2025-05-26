
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Mission } from '@/types/supabase';
import { useAuth } from '@/hooks/auth';
import { typedSupabase } from '@/types/database';

interface RestitutionButtonProps {
  mission: Mission;
}

export const RestitutionButton: React.FC<RestitutionButtonProps> = ({ mission }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [hasLinkedRes, setHasLinkedRes] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkForLinkedResMission();
  }, [mission.id]);

  const checkForLinkedResMission = async () => {
    if (mission.mission_type !== 'LIV') return;
    
    try {
      setLoading(true);
      const { data, error } = await typedSupabase
        .from('missions')
        .select('id')
        .eq('linked_mission_id', mission.id)
        .eq('mission_type', 'RES')
        .limit(1);

      if (!error && data && data.length > 0) {
        setHasLinkedRes(true);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la mission RES liée:', error);
    } finally {
      setLoading(false);
    }
  };

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
      disabled={hasLinkedRes || loading}
      className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-orange-600"
    >
      <ArrowLeftRight className="h-4 w-4" />
      <span className="hidden md:inline">
        {hasLinkedRes ? 'Restitution créée' : 'Restitution'}
      </span>
    </Button>
  );
};
