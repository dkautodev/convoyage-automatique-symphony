
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { Mission } from '@/types/supabase';
import { MissionSheetPDF } from './MissionSheetPDF';
import { toast } from 'sonner';
import { formatMissionNumber } from '@/utils/missionUtils';

interface GenerateMissionSheetButtonProps {
  mission: Mission;
  driverName?: string;
}

export const GenerateMissionSheetButton: React.FC<GenerateMissionSheetButtonProps> = ({ 
  mission, 
  driverName 
}) => {
  const [generating, setGenerating] = useState(false);
  
  // Check if the mission is cancelled
  const isMissionCancelled = mission.status === 'annule';

  const handleGeneratePDF = async () => {
    try {
      setGenerating(true);
      const missionNumber = formatMissionNumber(mission);
      const fileName = `DKAUTOMOTIVE-MISSION-${missionNumber}.pdf`;
      
      // Générer le PDF
      const blob = await pdf(
        <MissionSheetPDF mission={mission} driverName={driverName} />
      ).toBlob();
      
      // Create an anchor element and set it to download the PDF
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      
      toast.success('Fiche de mission téléchargée avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Erreur lors de la génération de la fiche de mission');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button 
      onClick={handleGeneratePDF} 
      className="flex gap-2 items-center"
      disabled={generating || isMissionCancelled}
      variant="outline"
      title={isMissionCancelled ? "Impossible de générer une fiche pour une mission annulée" : "Générer la fiche de mission"}
    >
      {generating ? (
        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      Fiche de mission
    </Button>
  );
};
