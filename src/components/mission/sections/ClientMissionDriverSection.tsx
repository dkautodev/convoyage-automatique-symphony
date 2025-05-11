
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mission } from '@/types/supabase';
import { User } from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/auth';

interface ClientMissionDriverSectionProps {
  mission: Mission;
}

export const ClientMissionDriverSection: React.FC<ClientMissionDriverSectionProps> = ({ 
  mission
}) => {
  const { profiles: driverProfiles, loading } = useProfiles('chauffeur');
  const { profile } = useAuth();
  
  // Check if the current user is a driver
  const isDriver = profile?.role === 'chauffeur';
  
  // Find the current driver
  const currentDriver = driverProfiles.find(driver => driver.id === mission.chauffeur_id);
  const hasDriver = !!mission.chauffeur_id && !!currentDriver;
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Informations chauffeur
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          {loading ? (
            <p className="text-gray-500">Chargement des informations du chauffeur...</p>
          ) : hasDriver ? (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Chauffeur assigné</h4>
              <p className="font-medium">{currentDriver.label}</p>
            </div>
          ) : (
            <p className="font-medium">Véhicule livré par un responsable DK AUTOMOTIVE</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
