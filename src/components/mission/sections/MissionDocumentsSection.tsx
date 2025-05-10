
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileCheck, Receipt, PaperclipIcon } from 'lucide-react';
import { Mission } from '@/types/supabase';
import MissionAttachments from '@/components/mission/MissionAttachments';
import FileUpload from '@/components/mission/FileUpload';
import { toast } from 'sonner';

interface MissionDocumentsSectionProps {
  mission: Mission;
}

export const MissionDocumentsSection: React.FC<MissionDocumentsSectionProps> = ({
  mission
}) => {
  const [attachmentsKey, setAttachmentsKey] = useState<number>(0);

  // Placeholder functions for document generation
  const handleGenerateQuote = () => {
    alert('Génération de devis non implémentée');
  };
  const handleGenerateMissionSheet = () => {
    alert('Génération de fiche de mission non implémentée');
  };
  const handleGenerateInvoice = () => {
    alert('Génération de facture non implémentée');
  };
  
  // Handle document upload completion
  const handleDocumentUploaded = () => {
    // Force refresh the attachments list
    setAttachmentsKey(prev => prev + 1);
    toast.success("Document ajouté avec succès");
  };
  
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg flex flex-col items-center text-center">
            <FileText className="h-10 w-10 text-blue-600 mb-2" />
            <h3 className="text-lg font-medium mb-1">Devis</h3>
            
            <Button onClick={handleGenerateQuote} variant="outline" className="w-full">
              Générer
            </Button>
          </div>
          
          <div className="p-4 border rounded-lg flex flex-col items-center text-center">
            <FileCheck className="h-10 w-10 text-green-600 mb-2" />
            <h3 className="text-lg font-medium mb-1">Fiche de mission</h3>
            
            <Button onClick={handleGenerateMissionSheet} variant="outline" className="w-full">
              Générer
            </Button>
          </div>
          
          <div className="p-4 border rounded-lg flex flex-col items-center text-center">
            <Receipt className="h-10 w-10 text-amber-600 mb-2" />
            <h3 className="text-lg font-medium mb-1">Facture</h3>
            
            <Button onClick={handleGenerateInvoice} variant="outline" className="w-full">
              Générer
            </Button>
          </div>
        </div>
        
        {/* Attachments section */}
        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Pièces jointes</h3>
            <FileUpload
              missionId={mission.id}
              onUploadComplete={handleDocumentUploaded}
              variant="outline"
              label="Ajouter un document"
            />
          </div>
          <MissionAttachments 
            key={attachmentsKey}
            missionId={mission.id} 
            showTitle={false} 
          />
        </div>
      </CardContent>
    </Card>;
};
