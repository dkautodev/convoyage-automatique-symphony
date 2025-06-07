import React, { useState, useEffect } from 'react';
import { useNavigate, useBeforeUnload, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateMissionForm from '@/components/mission/CreateMissionForm';
import { useAuth } from '@/hooks/useAuth';
import { typedSupabase } from '@/types/database';
import { Mission, MissionFromDB, convertMissionFromDB } from '@/types/supabase';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
export default function CreateMissionPage() {
  const navigate = useNavigate();
  const {
    profile
  } = useAuth();
  const [searchParams] = useSearchParams();
  const livId = searchParams.get('livId');
  const [formDirty, setFormDirty] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [livMission, setLivMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(false);

  // Avertir l'utilisateur avant de fermer l'onglet/navigateur
  useBeforeUnload(React.useCallback(event => {
    if (formDirty) {
      event.preventDefault();
      // Le message est contrôlé par le navigateur, pas par ce texte
      return event.returnValue = "Voulez-vous vraiment quitter cette page ? Les modifications non enregistrées seront perdues.";
    }
  }, [formDirty]));

  // Récupérer la mission LIV si livId est présent
  useEffect(() => {
    if (livId) {
      fetchLivMission();
    }
  }, [livId]);
  const fetchLivMission = async () => {
    if (!livId) return;
    try {
      setLoading(true);
      const {
        data,
        error
      } = await typedSupabase.from('missions').select('*').eq('id', livId).single();
      if (error) {
        console.error('Erreur lors de la récupération de la mission LIV:', error);
        toast.error('Mission LIV introuvable');
        navigate('/mission/create');
        return;
      }

      // Vérifier que c'est bien une mission LIV
      if (data.mission_type !== 'LIV') {
        toast.error('Cette mission n\'est pas de type LIV');
        navigate('/mission/create');
        return;
      }

      // Vérifier qu'elle n'est pas déjà liée
      if (data.linked_mission_id) {
        toast.error('Cette mission LIV est déjà liée à une mission RES');
        navigate(`/${profile?.role}/missions/${livId}`);
        return;
      }
      setLivMission(convertMissionFromDB(data as unknown as MissionFromDB));
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement de la mission LIV');
      navigate('/mission/create');
    } finally {
      setLoading(false);
    }
  };
  const handleFormChange = (isDirty: boolean) => {
    setFormDirty(isDirty);
  };
  const handleSuccess = (missionId: string) => {
    // Réinitialiser l'état dirty puisque la mission est sauvegardée
    setFormDirty(false);
    // Redirect to mission details page with the new mission ID
    if (profile?.role === 'admin') {
      navigate(`/admin/missions/${missionId}`);
    } else {
      navigate(`/client/missions/${missionId}`);
    }
  };
  const handleBack = () => {
    if (formDirty) {
      // Stocker la destination en attente
      let destination = '/client/missions';
      if (profile?.role === 'admin') {
        destination = '/admin/missions';
      }

      // Si on créait une RES, retourner à la mission LIV
      if (livId) {
        destination = `/${profile?.role}/missions/${livId}`;
      }
      setPendingNavigation(destination);
      setShowExitDialog(true);
    } else {
      // Pas de modifications, naviguer directement
      if (livId) {
        navigate(`/${profile?.role}/missions/${livId}`);
      } else if (profile?.role === 'admin') {
        navigate('/admin/missions');
      } else {
        navigate('/client/missions');
      }
    }
  };
  const handleCancelExit = () => {
    // Annuler la navigation
    setShowExitDialog(false);
    setPendingNavigation(null);
  };
  const handleConfirmExit = () => {
    // Confirmer la navigation
    setShowExitDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };
  if (loading) {
    return <div className="container max-w-5xl mx-auto py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>;
  }
  return <>
      <div className="container max-w-5xl mx-auto py-8 space-y-6 px-0">
        <div className="flex items-center">
          
          
        </div>
        
        {livMission && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Mission LIV liée :</strong> #{livMission.mission_number || livMission.id.slice(0, 8)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Les adresses et contacts seront automatiquement inversés. Le prix sera calculé avec une remise de 30%.
            </p>
          </div>}
        
        <CreateMissionForm onSuccess={handleSuccess} onDirtyChange={handleFormChange} livMission={livMission} />
      </div>
      
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitter la création de mission</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir quitter cette page ? Toutes les modifications non enregistrées seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelExit}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit}>Quitter</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
}