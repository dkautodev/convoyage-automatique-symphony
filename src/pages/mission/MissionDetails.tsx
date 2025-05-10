
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { typedSupabase } from '@/types/database';
import { Mission, MissionFromDB, convertMissionFromDB } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Package, History, Edit } from 'lucide-react';
import { formatMissionNumber, missionStatusLabels, missionStatusColors } from '@/utils/missionUtils';

// Import our section components
import { MissionGeneralInfoSection } from '@/components/mission/sections/MissionGeneralInfoSection';
import { MissionDriverSection } from '@/components/mission/sections/MissionDriverSection';
import { MissionStatusSection } from '@/components/mission/sections/MissionStatusSection';
import { MissionDocumentsSection } from '@/components/mission/sections/MissionDocumentsSection';
import { MissionStatusHistoryDrawer } from '@/components/mission/MissionStatusHistoryDrawer';
import { MissionEditDialog } from '@/components/mission/MissionEditDialog';

const MissionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [mission, setMission] = useState<Mission | null>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const isAdmin = profile?.role === 'admin';
  const userRole = profile?.role || 'client';
  
  useEffect(() => {
    fetchMission();
    if (id) fetchStatusHistory(id);
  }, [id]);
  
  const fetchMission = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      const { data: missionData, error: missionError } = await typedSupabase
        .from('missions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (missionError) {
        console.error('Erreur lors de la récupération de la mission:', missionError);
        toast.error('Impossible de charger les détails de la mission');
        return;
      }
      
      console.log('Mission data retrieved:', missionData);
      
      // S'assurer que toutes les données de mission sont correctement incluses
      // Ne pas utiliser convertMissionFromDB pour préserver toutes les propriétés
      setMission(missionData as unknown as Mission);
      
      // Récupérer les informations du client
      if (missionData.client_id) {
        const { data: clientData, error: clientError } = await typedSupabase
          .from('profiles')
          .select('*')
          .eq('id', missionData.client_id)
          .single();
        
        if (!clientError && clientData) {
          setClient(clientData);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue lors du chargement de la mission');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusHistory = async (missionId: string) => {
    try {
      const { data, error } = await typedSupabase
        .from('mission_status_history')
        .select('*')
        .eq('mission_id', missionId)
        .order('changed_at', { ascending: false });
      
      if (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        return;
      }
      
      setStatusHistory(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
    }
  };
  
  const handleBack = () => {
    const basePath = userRole === 'admin' ? '/admin/missions' : '/client/missions';
    navigate(basePath);
  };

  const handleEditMission = () => {
    setEditDialogOpen(true);
  };

  const handleShowHistory = () => {
    setHistoryDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!mission) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <h3 className="text-lg font-medium">Mission introuvable</h3>
          <p className="text-gray-500 mt-1">Cette mission n'existe pas ou a été supprimée.</p>
          <Button className="mt-4" onClick={handleBack}>
            Retour aux missions
          </Button>
        </div>
      </div>
    );
  }
  
  const missionNumber = formatMissionNumber(mission);
  const formattedDate = mission.created_at 
    ? new Date(mission.created_at).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) 
    : 'Date inconnue';

  return (
    <div className="space-y-6 overflow-y-auto pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Mission #{missionNumber}
            <Badge className={missionStatusColors[mission.status]}>
              {missionStatusLabels[mission.status]}
            </Badge>
          </h2>
          <p className="text-gray-500">Créée le {formattedDate}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button onClick={handleEditMission} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Modifier infos
              </Button>
              <Button onClick={handleShowHistory} variant="outline">
                <History className="h-4 w-4 mr-2" />
                Historique
              </Button>
            </>
          )}
          <Button onClick={handleBack} variant="outline">
            Retour aux missions
          </Button>
        </div>
      </div>

      {/* General Information Section */}
      <MissionGeneralInfoSection mission={mission} client={client} />
      
      {/* Driver Management Section (Admin only) */}
      {isAdmin && <MissionDriverSection mission={mission} refetchMission={fetchMission} />}
      
      {/* Status Management Section */}
      {isAdmin && <MissionStatusSection mission={mission} refetchMission={fetchMission} />}
      
      {/* Documents Section */}
      {isAdmin && <MissionDocumentsSection mission={mission} />}
      
      {/* Status History Drawer */}
      <MissionStatusHistoryDrawer 
        statusHistory={statusHistory} 
        isOpen={historyDrawerOpen} 
        onClose={() => setHistoryDrawerOpen(false)} 
      />
      
      {/* Edit Mission Dialog */}
      {mission && editDialogOpen && (
        <MissionEditDialog
          mission={mission}
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onMissionUpdated={fetchMission}
        />
      )}
    </div>
  );
};

export default MissionDetailsPage;
