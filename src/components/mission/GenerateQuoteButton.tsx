
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
  const isDisabled = mission.status === 'annule';
  const [generating, setGenerating] = useState<boolean>(false);
  
  const handleGenerateQuote = async () => {
    try {
      setGenerating(true);
      const quoteNumber = `DEV-${formatMissionNumber(mission)}`;
      
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
      
      // Open the PDF in a new tab
      window.open(url, '_blank');
      
      toast.success(`Devis ${quoteNumber} généré avec succès`);
    } catch (error) {
      console.error('Erreur lors de la génération du devis:', error);
      toast.error('Erreur lors de la génération du devis');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="relative"
      onClick={handleGenerateQuote}
      disabled={isDisabled || generating}
      title={isDisabled ? "Devis non disponible pour une mission annulée" : "Générer un devis"}
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
