
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Mission } from '@/types/supabase';
import { useAuth } from '@/hooks/auth';
import { formatMissionNumber } from '@/utils/missionUtils';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';
import { supabase } from '@/integrations/supabase/client';

interface GenerateInvoiceButtonProps {
  mission: Mission;
  client: any;
  className?: string;
}

const GenerateInvoiceButton: React.FC<GenerateInvoiceButtonProps> = ({
  mission,
  client,
  className
}) => {
  const { profile } = useAuth();
  const [generating, setGenerating] = useState<boolean>(false);
  const [clientData, setClientData] = useState<any>(client);
  
  // Fetch client data if not provided or incomplete
  useEffect(() => {
    const fetchClientData = async () => {
      if (!client || !client.billing_address) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', mission.client_id)
            .single();
            
          if (error) throw error;
          if (data) {
            setClientData(data);
          }
        } catch (err) {
          console.error('Error fetching client data:', err);
        }
      }
    };
    
    if (mission.client_id) {
      fetchClientData();
    }
  }, [mission.client_id, client]);
  
  const handleGenerateInvoice = async () => {
    try {
      setGenerating(true);
      const missionNumber = formatMissionNumber(mission);
      const invoiceNumber = `FAC-${missionNumber}`;
      const fileName = `DKAUTOMOTIVE-${invoiceNumber}.pdf`;
      
      // Generate the PDF
      const blob = await pdf(
        <InvoicePDF 
          mission={mission} 
          client={clientData} 
          adminProfile={profile}
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
      
      toast.success(`Facture ${invoiceNumber} téléchargée`);
    } catch (error) {
      console.error('Erreur lors de la génération de la facture:', error);
      toast.error('Erreur lors de la génération de la facture');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleGenerateInvoice}
      disabled={generating}
      title="Télécharger la facture"
      className={className}
    >
      {generating ? (
        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
};

export default GenerateInvoiceButton;
