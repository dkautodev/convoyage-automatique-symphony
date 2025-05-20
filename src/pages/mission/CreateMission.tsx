
import React, { useState } from 'react';
import { useNavigate, useBeforeUnload } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateMissionForm from '@/components/mission/CreateMissionForm';
import { useAuth } from '@/hooks/useAuth';
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

export default function CreateMissionPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [formDirty, setFormDirty] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  // Avertir l'utilisateur avant de fermer l'onglet/navigateur
  useBeforeUnload(
    React.useCallback(
      (event) => {
        if (formDirty) {
          event.preventDefault();
          // Le message est contrôlé par le navigateur, pas par ce texte
          return (event.returnValue = "Voulez-vous vraiment quitter cette page ? Les modifications non enregistrées seront perdues.");
        }
      },
      [formDirty]
    )
  );

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
      const destination = profile?.role === 'admin' ? '/admin/missions' : '/client/missions';
      setPendingNavigation(destination);
      setShowExitDialog(true);
    } else {
      // Pas de modifications, naviguer directement
      if (profile?.role === 'admin') {
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
  
  return (
    <>
      <div className="container max-w-5xl mx-auto py-8 space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Créer une nouvelle mission</h1>
        </div>
        
        <CreateMissionForm onSuccess={handleSuccess} onDirtyChange={handleFormChange} />
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
    </>
  );
}
