import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mission, MissionStatus } from '@/types/supabase';
import { typedSupabase } from '@/types/database';
import { Clock, CheckCircle2 } from 'lucide-react';
import { missionStatusLabels, missionStatusColors } from '@/utils/missionUtils';
interface MissionStatusSectionProps {
  mission: Mission;
  refetchMission: () => void;
}
export const MissionStatusSection: React.FC<MissionStatusSectionProps> = ({
  mission,
  refetchMission
}) => {
  const [selectedStatus, setSelectedStatus] = useState<MissionStatus>(mission.status);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch status history
  useEffect(() => {
    fetchStatusHistory();
  }, [mission.id]);
  const fetchStatusHistory = async () => {
    if (!mission.id) return;
    try {
      setLoading(true);
      const {
        data,
        error
      } = await typedSupabase.from('mission_status_history').select('*').eq('mission_id', mission.id).order('changed_at', {
        ascending: false
      });
      if (error) {
        throw error;
      }
      setStatusHistory(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      toast.error('Impossible de charger l\'historique des statuts');
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateStatus = async () => {
    if (updating) return;
    if (selectedStatus === mission.status) {
      toast.info('Aucun changement de statut détecté');
      return;
    }
    try {
      setUpdating(true);
      const {
        error
      } = await typedSupabase.from('missions').update({
        status: selectedStatus
      }).eq('id', mission.id);
      if (error) {
        throw error;
      }
      toast.success(`Statut mis à jour: ${missionStatusLabels[selectedStatus]}`);
      refetchMission();
      fetchStatusHistory();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error(`Erreur: ${error.message || 'Impossible de mettre à jour le statut'}`);
      setSelectedStatus(mission.status); // Reset to current status on error
    } finally {
      setUpdating(false);
    }
  };

  // All possible mission statuses for the dropdown
  const statuses: MissionStatus[] = ['en_acceptation', 'accepte', 'prise_en_charge', 'livraison', 'livre', 'termine', 'annule', 'incident'];
  return <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Gestion du statut
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Statut actuel</h4>
              <Badge className={`${missionStatusColors[mission.status]} px-3 py-1`}>
                {missionStatusLabels[mission.status]}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Changer le statut</label>
                <Select value={selectedStatus} onValueChange={value => setSelectedStatus(value as MissionStatus)} disabled={updating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => <SelectItem key={status} value={status}>
                        {missionStatusLabels[status]}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={handleUpdateStatus} disabled={updating || selectedStatus === mission.status} className="w-full sm:w-auto">
              {updating ? 'Mise à jour...' : 'Mettre à jour le statut'}
            </Button>
          </div>
          
          
        </div>
      </CardContent>
    </Card>;
};