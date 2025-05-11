import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/auth';
import { typedSupabase } from '@/types/database';
import { Mission, MissionFromDB, convertMissionFromDB } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Package, History, Edit, Ban, Paperclip, FileText } from 'lucide-react';
import { formatMissionNumber, missionStatusLabels, missionStatusColors } from '@/utils/missionUtils';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

// Import our section components
import { MissionGeneralInfoSection } from '@/components/mission/sections/MissionGeneralInfoSection';
import { MissionDriverSection } from '@/components/mission/sections/MissionDriverSection';
import { ClientMissionDriverSection } from '@/components/mission/sections/ClientMissionDriverSection';
import { MissionStatusSection } from '@/components/mission/sections/MissionStatusSection';
import { MissionDocumentsSection } from '@/components/mission/sections/MissionDocumentsSection';
import { MissionStatusHistoryDrawer } from '@/components/mission/MissionStatusHistoryDrawer';
import { MissionEditDialog } from '@/components/mission/MissionEditDialog';
import { MissionDocumentsDialog } from '@/components/mission/MissionDocumentsDialog';
import GenerateQuoteButton from '@/components/mission/GenerateQuoteButton';
import { GenerateMissionSheetButton } from '@/components/mission/GenerateMissionSheetButton';

const MissionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [mission, setMission] = useState<Mission | null>(null);
  const [client, setClient] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [driverName, setDriverName] = useState<string>('Non assigné');
  
  const isAdmin = profile?.role === 'admin';
  const isClient = profile?.role === 'client';
  const userRole = profile?.role || 'client';
  
  useEffect(() => {
    fetchMission();
    if (id) {
      fetchStatusHistory(id);
      fetchDocumentsCount(id);
    }
    
    // Fetch admin profile for quote generation if user is admin
    if (isAdmin) {
      fetchAdminProfile();
    }
  }, [id, isAdmin]);
  
  const fetchAdminProfile = async () => {
    try {
      const { data, error } = await typedSupabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .limit(1)
        .single();
        
      if (!error && data) {
        setAdminProfile(data);
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    }
  };
  
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
      
      // Récupérer les informations du chauffeur si assigné
      if (missionData.chauffeur_id) {
        const { data: driverData, error: driverError } = await typedSupabase
          .from('profiles')
          .select('full_name')
          .eq('id', missionData.chauffeur_id)
          .single();
          
        if (!driverError && driverData) {
          setDriverName(driverData.full_name || 'Chauffeur sans nom');
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

  const fetchDocumentsCount = async (missionId: string) => {
    try {
      const { count, error } = await typedSupabase
        .from('mission_documents')
        .select('*', { count: 'exact', head: true })
        .eq('mission_id', missionId);
      
      if (error) {
        console.error('Erreur lors de la récupération du nombre de documents:', error);
        return;
      }
      
      setDocumentsCount(count || 0);
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de documents:', error);
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

  // Fonction pour ouvrir la boîte de dialogue de confirmation
  const openCancelDialog = () => {
    if (!mission || mission.status !== 'en_acceptation') {
      toast.error('Seuls les devis en cours d\'acceptation peuvent être annulés');
      return;
    }
    setCancelDialogOpen(true);
  };

  // Fonction pour annuler le devis après confirmation
  const handleCancelQuote = async () => {
    if (cancelling || !mission) return;
    if (mission.status !== 'en_acceptation') {
      toast.error('Seuls les devis en cours d\'acceptation peuvent être annulés');
      return;
    }

    try {
      setCancelling(true);
      const { error } = await typedSupabase
        .from('missions')
        .update({ status: 'annule' })
        .eq('id', mission.id);
      
      if (error) {
        throw error;
      }
      
      toast.success('Le devis a été annulé avec succès');
      fetchMission();
      if (id) fetchStatusHistory(id);
      setCancelDialogOpen(false);
    } catch (error: any) {
      console.error('Erreur lors de l\'annulation du devis:', error);
      toast.error(`Erreur: ${error.message || 'Impossible d\'annuler le devis'}`);
    } finally {
      setCancelling(false);
    }
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

  const showCancelButton = mission.status === 'en_acceptation' && (isAdmin || (isClient && user?.id === mission.client_id));

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
              <Button 
                variant="outline" 
                className="relative"
                onClick={() => setDocumentsDialogOpen(true)}
              >
                <Paperclip className="h-4 w-4" />
                {documentsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#ea384c] text-[0.625rem] font-medium text-white">
                    {documentsCount}
                  </span>
                )}
                {documentsCount === 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#8E9196] text-[0.625rem] font-medium text-white">
                    0
                  </span>
                )}
              </Button>
              <GenerateMissionSheetButton mission={mission} driverName={driverName} />
              <Button onClick={handleShowHistory} variant="outline">
                <History className="h-4 w-4 mr-2" />
                Historique
              </Button>
            </>
          )}
          {/* Client buttons */}
          {isClient && (
            <>
              <Button 
                variant="outline" 
                className="relative"
                onClick={() => setDocumentsDialogOpen(true)}
              >
                <Paperclip className="h-4 w-4" />
                {documentsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#ea384c] text-[0.625rem] font-medium text-white">
                    {documentsCount}
                  </span>
                )}
                {documentsCount === 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#8E9196] text-[0.625rem] font-medium text-white">
                    0
                  </span>
                )}
              </Button>
              <GenerateMissionSheetButton mission={mission} driverName={driverName} />
              <GenerateQuoteButton 
                mission={mission} 
                client={client}
              />
            </>
          )}
          {showCancelButton && (
            <Button onClick={openCancelDialog} disabled={cancelling} variant="destructive">
              <Ban className="h-4 w-4 mr-2" />
              {cancelling ? 'Annulation...' : 'Annuler le devis'}
            </Button>
          )}
          <Button onClick={handleBack} variant="outline">
            Retour aux missions
          </Button>
        </div>
      </div>

      {/* General Information Section */}
      <MissionGeneralInfoSection 
        mission={mission} 
        client={client} 
        driverName={driverName} 
        adminProfile={adminProfile}
      />
      
      {/* Driver Section - Admin and Client versions */}
      {isAdmin ? (
        <MissionDriverSection mission={mission} refetchMission={fetchMission} />
      ) : (
        <ClientMissionDriverSection mission={mission} />
      )}
      
      {/* Status Management Section (Admin only) */}
      {isAdmin && <MissionStatusSection mission={mission} refetchMission={fetchMission} />}
      
      {/* Documents Section - For both Admin and Client */}
      <div id="documents-section">
        <MissionDocumentsSection 
          mission={mission} 
          client={client}
          adminProfile={adminProfile}
        />
      </div>
      
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
      
      {/* Documents Dialog - Pour les deux rôles */}
      {mission && documentsDialogOpen && (
        <MissionDocumentsDialog
          mission={mission}
          isOpen={documentsDialogOpen}
          onClose={() => setDocumentsDialogOpen(false)}
          onDocumentsUpdated={() => fetchDocumentsCount(mission.id)}
        />
      )}

      {/* Boîte de dialogue de confirmation pour l'annulation */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler le devis</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Une fois le devis annulé, il ne pourra plus être modifié.
              Voulez-vous vraiment annuler ce devis ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelQuote} 
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={cancelling}
            >
              {cancelling ? 'Annulation en cours...' : 'Confirmer l\'annulation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MissionDetailsPage;
