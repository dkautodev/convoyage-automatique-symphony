
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { Mission } from '@/types/supabase';
import { MissionSheetPDF } from './MissionSheetPDF';
import { toast } from 'sonner';

interface GenerateMissionSheetButtonProps {
  mission: Mission;
  driverName?: string;
}

export const GenerateMissionSheetButton: React.FC<GenerateMissionSheetButtonProps> = ({ 
  mission, 
  driverName 
}) => {
  const [generating, setGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    try {
      setGenerating(true);
      
      // Générer le PDF
      const blob = await pdf(
        <MissionSheetPDF mission={mission} driverName={driverName} />
      ).toBlob();
      
      // Créer un URL pour le blob
      const url = URL.createObjectURL(blob);
      
      // Ouvrir le PDF dans un nouvel onglet
      window.open(url, '_blank');
      
      toast.success('Fiche de mission générée avec succès');
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
      disabled={generating}
      variant="outline"
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
