import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { typedSupabase } from '@/types/database';
import { Mission, convertMissionFromDB, MissionFromDB, missionStatusLabels, missionStatusColors } from '@/types/supabase';
import { formatMissionNumber } from '@/utils/missionUtils';
import { useAuth } from '@/hooks/auth';
interface LinkedMissionSectionProps {
  mission: Mission;
}
export const LinkedMissionSection: React.FC<LinkedMissionSectionProps> = ({
  mission
}) => {
  const [linkedMission, setLinkedMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    profile
  } = useAuth();
  useEffect(() => {
    fetchLinkedMission();
  }, [mission.id, mission.linked_mission_id]);
  const fetchLinkedMission = async () => {
    // Si cette mission a une mission liée, la récupérer
    if (mission.linked_mission_id) {
      try {
        setLoading(true);
        const {
          data,
          error
        } = await typedSupabase.from('missions').select('*').eq('id', mission.linked_mission_id).single();
        if (!error && data) {
          setLinkedMission(convertMissionFromDB(data as unknown as MissionFromDB));
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la mission liée:', error);
      } finally {
        setLoading(false);
      }
    }

    // Si cette mission est de type LIV, chercher une mission RES qui lui est liée
    if (mission.mission_type === 'LIV') {
      try {
        setLoading(true);
        const {
          data,
          error
        } = await typedSupabase.from('missions').select('*').eq('linked_mission_id', mission.id).eq('mission_type', 'RES').single();
        if (!error && data) {
          setLinkedMission(convertMissionFromDB(data as unknown as MissionFromDB));
        }
      } catch (error) {
        // Pas d'erreur si aucune mission RES n'est trouvée
        console.log('Aucune mission RES liée trouvée');
      } finally {
        setLoading(false);
      }
    }
  };

  // Ne pas afficher la section s'il n'y a pas de mission liée
  if (!linkedMission && !loading) {
    return null;
  }
  const userRole = profile?.role || 'client';
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          
          Mission liée
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div> : linkedMission ? <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-medium">
                Mission #{formatMissionNumber(linkedMission)}
              </span>
              <Badge className={missionStatusColors[linkedMission.status]}>
                {missionStatusLabels[linkedMission.status]}
              </Badge>
              <span className="text-sm text-gray-500">
                ({linkedMission.mission_type === 'RES' ? 'Restitution' : 'Livraison'})
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/${userRole}/missions/${linkedMission.id}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir détails
              </Link>
            </Button>
          </div> : null}
      </CardContent>
    </Card>;
};