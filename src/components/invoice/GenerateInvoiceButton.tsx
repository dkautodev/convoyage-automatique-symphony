
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mission } from '@/types/supabase';
import { FilePlus } from 'lucide-react';

export interface GenerateInvoiceButtonProps {
  mission: Mission;
  client?: any;
  className?: string;
}

const GenerateInvoiceButton: React.FC<GenerateInvoiceButtonProps> = ({ mission, client, className }) => {
  const handleGenerateInvoice = () => {
    console.log('Generating invoice for mission:', mission.id);
    // Invoice generation logic will go here
  };
  
  return (
    <Button 
      onClick={handleGenerateInvoice}
      size="sm"
      variant="outline"
      className={className}
    >
      <FilePlus className="mr-2 h-4 w-4" />
      Générer facture
    </Button>
  );
};

export default GenerateInvoiceButton;
