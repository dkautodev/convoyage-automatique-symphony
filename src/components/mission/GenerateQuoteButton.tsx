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
  const {
    profile
  } = useAuth();
  const isDisabled = mission.status === 'annule' || mission.status === 'livre' || mission.status === 'termine';
  const [generating, setGenerating] = useState<boolean>(false);
  const handleGenerateQuote = async () => {
    try {
      setGenerating(true);
      const quoteNumber = `DEV-${formatMissionNumber(mission)}`;

      // Generate the PDF
      const blob = await pdf(<QuotePDF mission={mission} client={client} adminProfile={adminProfile || profile} />).toBlob();

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

  // Create a title message that explains the disabled state
  const getTitleMessage = () => {
    if (mission.status === 'annule') {
      return "Devis non disponible pour une mission annulée";
    } else if (mission.status === 'livre' || mission.status === 'termine') {
      return "Devis non disponible pour une mission terminée ou livrée";
    }
    return "Générer un devis";
  };
  return;
};
export default GenerateQuoteButton;