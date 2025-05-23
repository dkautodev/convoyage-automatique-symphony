
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Mission } from '@/types/supabase';
import { formatMissionNumber } from '@/utils/missionUtils';

interface MissionNumberLinkProps {
  mission: Mission;
  className?: string;
  showHash?: boolean;
}

export const MissionNumberLink: React.FC<MissionNumberLinkProps> = ({
  mission,
  className = '',
  showHash = true
}) => {
  const { profile } = useAuth();
  
  // Déterminer le chemin en fonction du rôle
  const getBasePath = () => {
    switch (profile?.role) {
      case 'admin':
        return '/admin/missions';
      case 'client':
        return '/client/missions';
      case 'chauffeur':
        return '/driver/missions';
      default:
        return '/missions';
    }
  };

  const linkPath = `${getBasePath()}/${mission.id}`;
  const displayNumber = formatMissionNumber(mission);
  const displayText = showHash ? `Mission #${displayNumber}` : displayNumber;

  return (
    <Link 
      to={linkPath} 
      className={`underline hover:underline ${className}`}
    >
      {displayText}
    </Link>
  );
};
