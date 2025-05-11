
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Mission } from '@/types/supabase';
import { typedSupabase } from '@/types/database';
import { useAuth } from '@/hooks/auth';
import { formatMissionNumber } from '@/utils/missionUtils';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import QuotePDF from './QuotePDF';

interface GenerateQuoteButtonProps {
  mission: Mission;
  client: any;
  adminProfile?: any;
}

const GenerateQuoteButton: React.FC<GenerateQuoteButtonProps> = ({
  mission,
  client,
  adminProfile
}) => {
  const { profile } = useAuth();
  const isDisabled = mission.status === 'annule' || mission.status === 'livre' || mission.status === 'termine';
  const [generating, setGenerating] = useState<boolean>(false);
  
  const handleGenerateQuote = async () => {
    try {
      setGenerating(true);
      const missionNumber = formatMissionNumber(mission);
      const quoteNumber = `DEV-${missionNumber}`;
      const fileName = `DKAUTOMOTIVE-${quoteNumber}.pdf`;
      
      // Generate the PDF
      const blob = await pdf(
        <QuotePDF 
          mission={mission} 
          client={client} 
          adminProfile={adminProfile || profile}
        />
      ).toBlob();
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create an anchor element and set it to download the PDF
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Devis ${quoteNumber} téléchargé`);
    } catch (error) {
      console.error('Erreur lors de la génération du devis:', error);
      toast.error('Erreur lors de la génération du devis');
    } finally {
      setGenerating(false);
    }
  };

  // Create a title message that explains the disabled state
  const getTitleMessage = () => {
    if (mission.status === 'annule') {
      return "Devis non disponible pour une mission annulée";
    } else if (mission.status === 'livre' || mission.status === 'termine') {
      return "Devis non disponible pour une mission terminée ou livrée";
    }
    return "Générer un devis";
  };

  return (
    <Button
      variant="outline"
      className="relative"
      onClick={handleGenerateQuote}
      disabled={isDisabled || generating}
      title={getTitleMessage()}
    >
      {generating ? (
        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      Devis
    </Button>
  );
};

export default GenerateQuoteButton;
