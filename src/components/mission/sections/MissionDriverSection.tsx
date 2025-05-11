
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mission } from '@/types/supabase';
import { typedSupabase } from '@/types/database';
import { useProfiles, ProfileOption } from '@/hooks/useProfiles';
import { User, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/auth';

interface MissionDriverSectionProps {
  mission: Mission;
  refetchMission: () => void;
}

export const MissionDriverSection: React.FC<MissionDriverSectionProps> = ({ 
  mission, 
  refetchMission 
}) => {
  const { profiles: driverProfiles, loading } = useProfiles('chauffeur');
  const [selectedDriverId, setSelectedDriverId] = useState(mission.chauffeur_id || '');
  const [driverPrice, setDriverPrice] = useState(mission.chauffeur_price_ht?.toString() || '0');
  const [updating, setUpdating] = useState(false);
  const { profile } = useAuth();
  
  // Check if the current user is a driver
  const isDriver = profile?.role === 'chauffeur';

  // S'assurer que le prix du chauffeur est correctement initialisé
  useEffect(() => {
    if (mission.chauffeur_price_ht !== undefined && mission.chauffeur_price_ht !== null) {
      setDriverPrice(mission.chauffeur_price_ht.toString());
    }
  }, [mission]);

  // Find the current driver
  const currentDriver = driverProfiles.find(driver => driver.id === mission.chauffeur_id);
  const currentDriverName = currentDriver ? currentDriver.label : mission.chauffeur_id ? 'Chauffeur inconnu' : 'Non assigné';

  const handleUpdateDriver = async () => {
    if (updating) return;
    
    try {
      setUpdating(true);
      
      const updates = {
        chauffeur_id: selectedDriverId || null,
        chauffeur_price_ht: driverPrice ? parseFloat(driverPrice) : 0
      };
      
      const { error } = await typedSupabase
        .from('missions')
        .update(updates)
        .eq('id', mission.id);
      
      if (error) {
        throw error;
      }
      
      toast.success('Chauffeur mis à jour avec succès');
      refetchMission();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du chauffeur:', error);
      toast.error(`Erreur: ${error.message || 'Impossible de mettre à jour le chauffeur'}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Gestion du chauffeur
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Chauffeur actuellement assigné</h4>
              <p className="font-medium">{currentDriverName}</p>
            </div>
            {!isDriver && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Prix chauffeur actuel (HT)</h4>
                <p className="font-medium">{mission.chauffeur_price_ht ? `${mission.chauffeur_price_ht.toFixed(2)} €` : '0.00 €'}</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">Sélectionner un chauffeur</label>
              <Select 
                value={selectedDriverId} 
                onValueChange={setSelectedDriverId}
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un chauffeur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_driver">Aucun chauffeur assigné</SelectItem>
                  {loading ? (
                    <SelectItem value="loading" disabled>Chargement...</SelectItem>
                  ) : (
                    driverProfiles.map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {!isDriver && (
              <div>
                <label className="text-sm font-medium block mb-2">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Prix chauffeur (HT)
                  </div>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={driverPrice}
                    onChange={(e) => setDriverPrice(e.target.value)}
                    placeholder="0.00"
                    disabled={updating}
                  />
                  <span className="flex items-center">€</span>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleUpdateDriver} 
            disabled={updating}
            className="w-full sm:w-auto"
          >
            {updating ? 'Mise à jour...' : 'Mettre à jour le chauffeur'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
