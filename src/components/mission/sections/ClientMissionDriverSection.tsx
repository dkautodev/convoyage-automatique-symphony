import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mission } from '@/types/supabase';
import { User } from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/auth';

interface ClientMissionDriverSectionProps {
  mission: Mission;
}

export const ClientMissionDriverSection: React.FC<ClientMissionDriverSectionProps> = ({ mission }) => {
  const { profiles: driverProfiles, loading } = useProfiles('chauffeur');
  const { profile } = useAuth();

  // Vérification du rôle utilisateur
  const isDriver = profile?.role === 'chauffeur';
  const isAdmin = profile?.role === 'admin';
  const showDriverPrice = isDriver || isAdmin;

  // Trouver le chauffeur assigné
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
        <div className="space-y-4">
          <div>
            {loading ? (
              <p className="text-gray-500">Chargement des informations du chauffeur...</p>
            ) : hasDriver ? (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Chauffeur assigné</h4>
                <p className="font-medium">{currentDriver?.label || 'Chauffeur non défini'}</p>
              </div>
            ) : (
              <p className="font-medium">Véhicule livré par un responsable DK AUTOMOTIVE</p>
            )}
          </div>

          {/* Afficher le prix chauffeur uniquement pour les admins et chauffeurs */}
          {showDriverPrice && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                Prix chauffeur (HT):{' '}
                <span className="font-medium">{mission.chauffeur_price_ht?.toFixed(2) || '0.00'} €</span>
              </h4>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};