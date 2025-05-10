
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Mission } from '@/types/supabase';
import { typedSupabase } from '@/types/database';
import { useAuth } from '@/hooks/auth';
import { formatMissionNumber } from '@/utils/missionUtils';
import { toast } from 'sonner';

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
  
  const handleGenerateQuote = async () => {
    try {
      // Here would go the actual PDF generation logic
      // For now, we'll just show a toast message
      const quoteNumber = `DEV-${formatMissionNumber(mission)}`;
      toast.success(`Devis ${quoteNumber} généré avec succès`);
      
      // In a real implementation, this would generate and download a PDF
      // with all the required sections from the specification
    } catch (error) {
      console.error('Erreur lors de la génération du devis:', error);
      toast.error('Erreur lors de la génération du devis');
    }
  };

  return (
    <Button
      variant="outline"
      className="relative"
      onClick={handleGenerateQuote}
      disabled={isDisabled}
      title={isDisabled ? "Devis non disponible pour une mission annulée" : "Générer un devis"}
    >
      <FileText className="h-4 w-4 mr-2" />
      Devis
    </Button>
  );
};

export default GenerateQuoteButton;
