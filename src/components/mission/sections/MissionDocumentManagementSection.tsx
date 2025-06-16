
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FolderOpen, Loader2 } from 'lucide-react';
import { Mission } from '@/types/supabase';
import { GenerateMissionSheetButton } from '@/components/mission/GenerateMissionSheetButton';
import GenerateQuoteButton from '@/components/mission/GenerateQuoteButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MissionDocumentManagementSectionProps {
  mission: Mission;
  client?: any;
  adminProfile?: any;
  driverName?: string;
  documentsCount: number;
  isAdmin: boolean;
  isClient: boolean;
  isDriver: boolean;
  onDocumentsClick: () => void;
}

export const MissionDocumentManagementSection: React.FC<MissionDocumentManagementSectionProps> = ({
  mission,
  client,
  adminProfile,
  driverName,
  documentsCount,
  isAdmin,
  isClient,
  isDriver,
  onDocumentsClick
}) => {
  const [convoyageExists, setConvoyageExists] = useState(false);
  const [checkingConvoyage, setCheckingConvoyage] = useState(true);

  useEffect(() => {
    if (isDriver) {
      checkConvoyageDocument();
    }
  }, [isDriver]);

  const checkConvoyageDocument = async () => {
    try {
      setCheckingConvoyage(true);
      const { data, error } = await supabase.storage
        .from('adminsettings')
        .list('', { search: 'BON DE CONVOYAGE.pdf' });
      
      if (error) {
        console.error('Erreur lors de la vérification du bon de convoyage:', error);
        setConvoyageExists(false);
      } else {
        setConvoyageExists(data && data.length > 0);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      setConvoyageExists(false);
    } finally {
      setCheckingConvoyage(false);
    }
  };

  const handleDownloadConvoyage = async () => {
    try {
      console.log('Téléchargement du bon de convoyage depuis adminsettings bucket');
      
      const { data, error } = await supabase.storage
        .from('adminsettings')
        .download('BON DE CONVOYAGE.pdf');
        
      if (error) {
        console.error('Erreur lors du téléchargement du bon de convoyage:', error);
        toast.error('Impossible de télécharger le bon de convoyage');
        return;
      }
      
      // Créer une URL pour le téléchargement
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = 'BON DE CONVOYAGE.pdf';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Bon de convoyage téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement du bon de convoyage:', error);
      toast.error('Impossible de télécharger le bon de convoyage');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderOpen className="h-5 w-5" />
          Gestion des documents
        </CardTitle>
      </CardHeader>
      <CardContent className="mx-0 px-[15px]">
        <div className="flex flex-row gap-2 md:gap-3">
          {/* Bouton Fiche de mission */}
          <GenerateMissionSheetButton mission={mission} driverName={driverName} />
          
          {/* Bouton Devis - Pour Admin et Client uniquement */}
          {(isAdmin || isClient) && (
            <GenerateQuoteButton mission={mission} client={client} adminProfile={adminProfile} />
          )}
          
          {/* Bouton Ajouter des documents - Pour tous les rôles */}
          <Button variant="outline" className="relative" onClick={onDocumentsClick}>
            {isDriver ? 'docs mission' : '+ Aj. docs'}
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

          {/* Bouton Bon de convoyage - Pour les chauffeurs uniquement */}
          {isDriver && (
            <Button 
              variant="outline"
              size="default"
              onClick={handleDownloadConvoyage}
              disabled={!convoyageExists || checkingConvoyage}
              className={!convoyageExists ? "text-gray-400" : ""}
            >
              {checkingConvoyage ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Bon de convoyage
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
