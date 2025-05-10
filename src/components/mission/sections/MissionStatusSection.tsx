
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mission, missionStatusLabels, missionStatusColors, MissionStatus } from '@/types/supabase';
import { typedSupabase } from '@/types/database';
import { Clock, CheckCircle2 } from 'lucide-react';

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
      const { data, error } = await typedSupabase
        .from('mission_status_history')
        .select('*')
        .eq('mission_id', mission.id)
        .order('changed_at', { ascending: false });
      
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
      
      const { error } = await typedSupabase
        .from('missions')
        .update({ status: selectedStatus })
        .eq('id', mission.id);
      
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
  const statuses: MissionStatus[] = [
    'en_acceptation',
    'accepte',
    'prise_en_charge',
    'livraison',
    'livre',
    'termine',
    'annule',
    'incident'
  ];

  return (
    <Card className="mb-6">
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
                <Select 
                  value={selectedStatus} 
                  onValueChange={(value) => setSelectedStatus(value as MissionStatus)}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {missionStatusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleUpdateStatus} 
              disabled={updating || selectedStatus === mission.status}
              className="w-full sm:w-auto"
            >
              {updating ? 'Mise à jour...' : 'Mettre à jour le statut'}
            </Button>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historique des statuts
            </h3>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : statusHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucun historique disponible</p>
            ) : (
              <div className="space-y-4">
                {statusHistory.map((entry, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <Badge className={`${missionStatusColors[entry.new_status]} w-32 justify-center`}>
                        {missionStatusLabels[entry.new_status]}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(entry.changed_at).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {entry.old_status && (
                      <div className="mt-2 text-sm text-gray-500">
                        Ancien statut: <span className="font-medium">{missionStatusLabels[entry.old_status]}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
